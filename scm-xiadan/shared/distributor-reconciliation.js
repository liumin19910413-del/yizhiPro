/**
 * 经销商对账（Distributor Reconciliation）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责经销商对账的业务逻辑，包括对账汇总数据生成、按经销商分组、售后筛选等
 * 
 * Validates: Requirements 9.2, 9.4
 */

// 导入依赖模块（在浏览器环境中使用全局变量，在Node环境中使用require）
const getPaymentStatusCalculatorForDistributor = () => {
  if (typeof require !== 'undefined') {
    return require('./payment-status-calculator.js').PaymentStatusCalculator;
  } else if (typeof window !== 'undefined' && window.PaymentStatusCalculator) {
    return window.PaymentStatusCalculator;
  }
  throw new Error('PaymentStatusCalculator not found');
};

/**
 * 经销商对账
 */
class DistributorReconciliation {
  /**
   * 构造函数
   * @param {SettlementCalculator} calculator - 结算计算引擎
   */
  constructor(calculator) {
    if (!calculator) {
      throw new Error('SettlementCalculator is required');
    }
    this.calculator = calculator;
  }

  /**
   * 生成经销商对账汇总数据
   * @param {Array} orders - 订单列表
   * @param {Array} subOrders - 子订单列表
   * @param {Array} afterSales - 售后列表
   * @returns {Array} 汇总数据
   */
  generateSummary(orders, subOrders, afterSales) {
    try {
      // 验证输入参数，提供友好的错误提示
      const validOrders = this._validateAndSanitizeArray(orders, '订单');
      const validSubOrders = this._validateAndSanitizeArray(subOrders, '子订单');
      const validAfterSales = this._validateAndSanitizeArray(afterSales, '售后');

      // 处理空数据情况
      if (validOrders.length === 0) {
        console.info('[经销商对账提示] 没有订单数据，返回空汇总');
        return [];
      }

      // 按经销商分组
      const distributorGroups = this.groupByDistributor(validOrders);
      
      if (Object.keys(distributorGroups).length === 0) {
        console.info('[经销商对账提示] 没有有效的经销商分组，返回空汇总');
        return [];
      }

      const summaries = [];
      let processedDistributorCount = 0;
      let errorDistributorCount = 0;

      for (const [distributorId, distributorOrders] of Object.entries(distributorGroups)) {
        try {
          // 获取这些订单的子订单
          const orderIds = new Set(distributorOrders.map(o => o.id).filter(id => id));
          const relatedSubOrders = validSubOrders.filter(so => {
            const parentId = so.orderId || so.parentOrderId;
            return parentId && orderIds.has(parentId);
          });

          if (relatedSubOrders.length === 0) {
            console.warn(`[经销商对账警告] 经销商 ${distributorId} 没有关联的子订单，跳过处理`);
            continue;
          }

          // 筛选第一期和第二期订单
          const firstPeriod = this.calculator.filterFirstPeriodOrders(relatedSubOrders);
          const secondPeriod = this.calculator.filterSecondPeriodOrders(relatedSubOrders);

          // 计算正常应结金额（经销商应得金额）
          const normalAmount = this.calculator.calculateOrderAmount(
            firstPeriod,
            secondPeriod,
            order => {
              try {
                return this.extractDistributorAmount(order);
              } catch (error) {
                console.warn(`[经销商对账警告] 计算经销商应得金额时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 筛选该经销商的售后记录
          const distributorAfterSales = this.filterDistributorAfterSales(
            validAfterSales,
            relatedSubOrders
          );
          const chargebacks = this.calculator.filterChargebacks(distributorAfterSales);

          // 计算冲账金额（经销商分成的损失）
          const chargebackAmount = this.calculator.calculateChargebackAmount(
            chargebacks,
            afterSale => {
              try {
                // 计算经销商在售后中的损失（平台货款 × 20%）
                const platformAmount = this._safeGetNumber(
                  afterSale.platformAmount || afterSale.refundAmount, 
                  0, 
                  `经销商${distributorId}售后${afterSale.id}的平台货款`
                );
                return platformAmount * 0.2;
              } catch (error) {
                console.warn(`[经销商对账警告] 计算售后损失时发生错误，售后ID: ${afterSale?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 计算净应结金额
          const netAmount = this.calculator.calculateNetAmount(
            normalAmount,
            chargebackAmount
          );

          // 计算空中分账和保证金扣除（核心新增功能）
          const clearingAggregation = this.aggregateDistributorClearing(relatedSubOrders);
          const airSplitAmount = clearingAggregation.totalAirSplit;
          const depositDeductAmount = clearingAggregation.totalDepositDeduct;

          // 获取经销商名称
          const distributorName = this._getDistributorName(distributorOrders, distributorId);

          // 已付金额 = 空中分账金额（已自动到账）
          const paidAmount = airSplitAmount;

          // 计算待付金额和付款状态
          const PaymentStatusCalculator = getPaymentStatusCalculatorForDistributor();
          const pendingAmount = depositDeductAmount;  // 保证金扣除金额需要补付
          const paymentStatus = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);

          summaries.push({
            distributorId,
            distributorName,
            settlementMonth: this.calculator.settlementMonth,
            orderCount: distributorOrders.length,
            normalAmount,
            chargebackAmount,
            netAmount,
            airSplitAmount,        // 新增：空中分账金额
            depositDeductAmount,   // 新增：保证金扣除金额
            paidAmount,
            pendingAmount,
            paymentStatus
          });

          processedDistributorCount++;

        } catch (error) {
          errorDistributorCount++;
          console.warn(`[经销商对账错误] 处理经销商 ${distributorId} 时发生错误: ${error.message}`);
          // 跳过有问题的经销商，继续处理其他经销商
          continue;
        }
      }

      // 友好的处理结果提示
      console.info(`[经销商对账完成] 成功处理 ${processedDistributorCount} 个经销商，${errorDistributorCount} 个经销商处理失败`);

      return summaries;

    } catch (error) {
      console.error('[经销商对账严重错误] 生成汇总数据时发生严重错误:', error);
      return [];
    }
  }

  /**
   * 验证和清理数组数据
   * @private
   * @param {any} data - 待验证的数据
   * @param {string} dataType - 数据类型名称（用于日志）
   * @returns {Array} 有效的数组
   */
  _validateAndSanitizeArray(data, dataType) {
    if (data === null || data === undefined) {
      console.warn(`[经销商对账警告] ${dataType}数据为空，使用空数组处理`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`[经销商对账警告] ${dataType}数据不是有效数组 (类型: ${typeof data})，使用空数组处理`);
      return [];
    }
    
    return data;
  }

  /**
   * 安全获取数值
   * @private
   * @param {any} value - 待获取的值
   * @param {number} defaultValue - 默认值
   * @param {string} fieldDescription - 字段描述（用于日志）
   * @returns {number} 有效的数值
   */
  _safeGetNumber(value, defaultValue = 0, fieldDescription = '未知字段') {
    if (value === null || value === undefined) {
      console.warn(`[经销商对账警告] ${fieldDescription}为空，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`[经销商对账警告] ${fieldDescription}无效 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (value < 0) {
      console.warn(`[经销商对账警告] ${fieldDescription}为负数 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    return value;
  }

  /**
   * 获取经销商名称
   * @private
   * @param {Array} distributorOrders - 经销商订单列表
   * @param {string} distributorId - 经销商ID
   * @returns {string} 经销商名称
   */
  _getDistributorName(distributorOrders, distributorId) {
    try {
      if (distributorOrders.length > 0 && distributorOrders[0].distributorName) {
        return distributorOrders[0].distributorName;
      }
    } catch (error) {
      console.warn(`[经销商对账警告] 获取经销商名称时发生错误: ${error.message}`);
    }
    
    return `经销商${distributorId}`;
  }

  /**
   * 按经销商分组
   * @param {Array} orders - 订单列表
   * @returns {Object} 按经销商ID分组的订单对象
   */
  groupByDistributor(orders) {
    // 验证输入参数
    if (!Array.isArray(orders)) {
      return {};
    }

    const groups = {};
    
    for (const order of orders) {
      // 跳过无效订单或没有经销商信息的订单
      if (!order || !order.distributorId) {
        continue;
      }

      const distributorId = order.distributorId;
      
      // 初始化分组
      if (!groups[distributorId]) {
        groups[distributorId] = [];
      }
      
      groups[distributorId].push(order);
    }

    return groups;
  }

  /**
   * 筛选经销商的售后记录
   * @param {Array} afterSales - 售后记录列表
   * @param {Array} subOrders - 该经销商的子订单列表
   * @returns {Array} 该经销商的售后记录
   */
  filterDistributorAfterSales(afterSales, subOrders) {
    // 验证输入参数
    if (!Array.isArray(afterSales) || !Array.isArray(subOrders)) {
      return [];
    }

    // 创建子订单ID集合，用于快速查找
    const orderIds = new Set();
    for (const order of subOrders) {
      if (order && order.id) {
        orderIds.add(order.id);
      }
    }

    // 筛选属于该经销商的售后记录
    return afterSales.filter(afterSale => {
      if (!afterSale) {
        return false;
      }
      
      // 检查售后记录是否关联到该经销商的订单
      const subOrderId = afterSale.subOrderId || afterSale.orderId;
      return subOrderId && orderIds.has(subOrderId);
    });
  }

  /**
   * 从子订单中提取经销商应得金额
   * @param {Object} subOrder - 子订单
   * @returns {number} 经销商应得金额
   */
  extractDistributorAmount(subOrder) {
    if (!subOrder) {
      console.warn('[经销商金额提取警告] 子订单为空，返回0');
      return 0;
    }

    try {
      // 方法1：从清分数据中获取经销商应得金额
      if (subOrder.clearing && typeof subOrder.clearing.distributorAmount === 'number') {
        const amount = subOrder.clearing.distributorAmount;
        if (!isNaN(amount) && amount >= 0) {
          return amount;
        } else {
          console.warn(`[经销商金额提取警告] 清分数据中的经销商金额无效 (${amount})，尝试其他方法`);
        }
      }

      // 方法2：从子订单项目的清分数据中累计
      if (subOrder.items && Array.isArray(subOrder.items)) {
        let totalDistributorAmount = 0;
        let validItemCount = 0;
        
        for (const item of subOrder.items) {
          if (item && item.clearing && typeof item.clearing.distributorAmount === 'number') {
            const itemAmount = item.clearing.distributorAmount;
            if (!isNaN(itemAmount) && itemAmount >= 0) {
              totalDistributorAmount += itemAmount;
              validItemCount++;
            }
          }
        }
        
        if (validItemCount > 0) {
          return totalDistributorAmount;
        }
      }

      // 方法3：根据平台货款计算（平台货款 × 20%）
      const platformAmount = this._safeGetNumber(
        subOrder.platformAmount, 
        0, 
        `子订单${subOrder.id}的平台货款`
      );
      
      if (platformAmount > 0) {
        return platformAmount * 0.2;
      }

      // 方法4：根据子订单总金额估算（假设平台货款占70%，经销商占其中的20%）
      const totalAmount = this._safeGetNumber(
        subOrder.totalAmount || subOrder.amount, 
        0, 
        `子订单${subOrder.id}的总金额`
      );
      
      if (totalAmount > 0) {
        // 估算：总金额 × 70%（平台货款比例） × 20%（经销商分成比例）
        return totalAmount * 0.7 * 0.2;
      }

      console.warn(`[经销商金额提取警告] 子订单 ${subOrder.id || '未知'} 无法提取有效的经销商应得金额，返回0`);
      return 0;

    } catch (error) {
      console.warn(`[经销商金额提取错误] 处理子订单 ${subOrder?.id || '未知'} 时发生错误: ${error.message}`);
      return 0;
    }
  }

  /**
   * 计算经销商在某个订单中的空中分账和保证金扣除
   * 
   * 核心逻辑：
   * 1. 经销商分成 = 平台货款 × 20%
   * 2. 如果平台货款全部空中分账，则经销商分成也全部空中分账
   * 3. 如果平台货款部分保证金扣除，则经销商分成也按比例保证金扣除
   * 
   * @param {Object} subOrder - 子订单
   * @returns {Object} { distributorAmount, airSplit, depositDeduct, splitRatio, depositRatio }
   */
  calculateDistributorClearing(subOrder) {
    if (!subOrder || !subOrder.clearing) {
      return {
        distributorAmount: 0,
        airSplit: 0,
        depositDeduct: 0,
        splitRatio: 0,
        depositRatio: 0
      };
    }

    try {
      const clearing = subOrder.clearing;
      
      // 经销商应得金额
      const distributorAmount = clearing.distributorAmount || 0;
      
      // 平台货款的清分情况
      const platformClearing = clearing.clearingDetails?.platform;
      if (!platformClearing) {
        // 如果没有清分明细，假设全部空中分账
        return {
          distributorAmount,
          airSplit: distributorAmount,
          depositDeduct: 0,
          splitRatio: 1,
          depositRatio: 0
        };
      }
      
      const platformTotal = platformClearing.amount || 0;
      const platformSplit = platformClearing.splitAmount || 0;
      const platformDeposit = platformClearing.depositAmount || 0;
      
      // 计算比例
      let splitRatio = 0;
      let depositRatio = 0;
      
      if (platformTotal > 0) {
        splitRatio = platformSplit / platformTotal;
        depositRatio = platformDeposit / platformTotal;
      }
      
      // 计算经销商的空中分账和保证金扣除（按比例）
      const airSplit = Math.round(distributorAmount * splitRatio * 100) / 100;
      const depositDeduct = Math.round(distributorAmount * depositRatio * 100) / 100;
      
      return {
        distributorAmount,
        airSplit,
        depositDeduct,
        splitRatio,
        depositRatio
      };
      
    } catch (error) {
      console.warn(`[经销商清分计算错误] 处理子订单 ${subOrder?.id || '未知'} 时发生错误: ${error.message}`);
      return {
        distributorAmount: 0,
        airSplit: 0,
        depositDeduct: 0,
        splitRatio: 0,
        depositRatio: 0
      };
    }
  }

  /**
   * 聚合经销商的空中分账和保证金扣除
   * 
   * @param {Array} subOrders - 子订单列表
   * @returns {Object} { totalAirSplit, totalDepositDeduct }
   */
  aggregateDistributorClearing(subOrders) {
    let totalAirSplit = 0;
    let totalDepositDeduct = 0;
    
    if (!Array.isArray(subOrders)) {
      return { totalAirSplit, totalDepositDeduct };
    }
    
    for (const subOrder of subOrders) {
      const clearing = this.calculateDistributorClearing(subOrder);
      totalAirSplit += clearing.airSplit;
      totalDepositDeduct += clearing.depositDeduct;
    }
    
    return {
      totalAirSplit: Math.round(totalAirSplit * 100) / 100,
      totalDepositDeduct: Math.round(totalDepositDeduct * 100) / 100
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DistributorReconciliation };
} else if (typeof window !== 'undefined') {
  window.DistributorReconciliation = DistributorReconciliation;
}