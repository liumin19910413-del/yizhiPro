/**
 * 连锁总部对账（Headquarter Reconciliation）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责连锁总部对账的业务逻辑，包括月结汇总数据生成、按品牌分组、售后筛选等
 * 
 * Validates: Requirements 10.2, 10.4
 */

// 导入依赖模块（在浏览器环境中使用全局变量，在Node环境中使用require）
const getPaymentStatusCalculatorForHeadquarter = () => {
  if (typeof require !== 'undefined') {
    return require('./payment-status-calculator.js').PaymentStatusCalculator;
  } else if (typeof window !== 'undefined' && window.PaymentStatusCalculator) {
    return window.PaymentStatusCalculator;
  }
  throw new Error('PaymentStatusCalculator not found');
};

/**
 * 连锁总部对账
 */
class HeadquarterReconciliation {
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
   * 生成连锁总部月结汇总数据
   * @param {Array} orders - 订单列表
   * @param {Array} subOrders - 子订单列表
   * @param {Array} afterSales - 售后列表
   * @returns {Array} 汇总数据
   */
  generateMonthlySummary(orders, subOrders, afterSales) {
    try {
      // 验证输入参数，提供友好的错误提示
      const validOrders = this._validateAndSanitizeArray(orders, '订单');
      const validSubOrders = this._validateAndSanitizeArray(subOrders, '子订单');
      const validAfterSales = this._validateAndSanitizeArray(afterSales, '售后');

      // 处理空数据情况
      if (validOrders.length === 0) {
        console.info('[连锁总部对账提示] 没有订单数据，返回空汇总');
        return [];
      }

      // 按品牌分组
      const brandGroups = this.groupByBrand(validOrders);
      
      if (Object.keys(brandGroups).length === 0) {
        console.info('[连锁总部对账提示] 没有有效的品牌分组，返回空汇总');
        return [];
      }

      const summaries = [];
      let processedBrandCount = 0;
      let errorBrandCount = 0;

      for (const [brandName, brandOrders] of Object.entries(brandGroups)) {
        try {
          // 获取这些订单的子订单
          const orderIds = new Set(brandOrders.map(o => o.id).filter(id => id));
          const relatedSubOrders = validSubOrders.filter(so => {
            const parentId = so.parentOrderId || so.orderId;
            return parentId && orderIds.has(parentId);
          });

          if (relatedSubOrders.length === 0) {
            console.warn(`[连锁总部对账警告] 品牌 ${brandName} 没有关联的子订单，跳过处理`);
            continue;
          }

          // 筛选第一期和第二期订单
          const firstPeriod = this.calculator.filterFirstPeriodOrders(relatedSubOrders);
          const secondPeriod = this.calculator.filterSecondPeriodOrders(relatedSubOrders);

          // 计算正常应结金额（连锁总部应得金额）
          const normalAmount = this.calculator.calculateOrderAmount(
            firstPeriod,
            secondPeriod,
            order => {
              try {
                return this.extractHeadquarterAmount(order);
              } catch (error) {
                console.warn(`[连锁总部对账警告] 计算连锁总部应得金额时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 筛选该品牌的售后记录
          const brandAfterSales = this.filterBrandAfterSales(
            validAfterSales,
            relatedSubOrders
          );
          const chargebacks = this.calculator.filterChargebacks(brandAfterSales);

          // 计算冲账金额（连锁总部在售后中的损失）
          const chargebackAmount = this.calculator.calculateChargebackAmount(
            chargebacks,
            afterSale => {
              try {
                // 计算连锁总部在售后中的损失
                const merchantProfit = this.calculateMerchantProfit(afterSale);
                const headquarterShareRate = this.getHeadquarterShareRate(brandName);
                return merchantProfit * headquarterShareRate;
              } catch (error) {
                console.warn(`[连锁总部对账警告] 计算售后损失时发生错误，售后ID: ${afterSale?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 计算净应结金额
          const netAmount = this.calculator.calculateNetAmount(
            normalAmount,
            chargebackAmount
          );

          // 获取品牌ID（使用品牌名称作为ID）
          const brandId = this.getBrandId(brandName);

          // TODO: 从数据库读取已付金额，这里暂时设为0
          const paidAmount = 0;

          // 计算待付金额和付款状态
          const PaymentStatusCalculator = getPaymentStatusCalculatorForHeadquarter();
          const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);
          const paymentStatus = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);

          summaries.push({
            brandId,
            brandName,
            settlementMonth: this.calculator.settlementMonth,
            orderCount: brandOrders.length,
            normalAmount,
            chargebackAmount,
            netAmount,
            paidAmount,
            pendingAmount,
            paymentStatus
          });

          processedBrandCount++;

        } catch (error) {
          errorBrandCount++;
          console.warn(`[连锁总部对账错误] 处理品牌 ${brandName} 时发生错误: ${error.message}`);
          // 跳过有问题的品牌，继续处理其他品牌
          continue;
        }
      }

      // 友好的处理结果提示
      console.info(`[连锁总部对账完成] 成功处理 ${processedBrandCount} 个品牌，${errorBrandCount} 个品牌处理失败`);

      return summaries;

    } catch (error) {
      console.error('[连锁总部对账严重错误] 生成汇总数据时发生严重错误:', error);
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
      console.warn(`[连锁总部对账警告] ${dataType}数据为空，使用空数组处理`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`[连锁总部对账警告] ${dataType}数据不是有效数组 (类型: ${typeof data})，使用空数组处理`);
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
      console.warn(`[连锁总部对账警告] ${fieldDescription}为空，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`[连锁总部对账警告] ${fieldDescription}无效 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (value < 0) {
      console.warn(`[连锁总部对账警告] ${fieldDescription}为负数 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    return value;
  }

  /**
   * 按品牌分组
   * @param {Array} orders - 订单列表
   * @returns {Object} 按品牌名称分组的订单对象
   */
  groupByBrand(orders) {
    // 验证输入参数
    if (!Array.isArray(orders)) {
      return {};
    }

    const groups = {};
    
    for (const order of orders) {
      // 跳过无效订单
      if (!order) {
        continue;
      }

      // 获取品牌名称
      const brandName = this.getBrandNameFromOrder(order);
      
      // 跳过没有品牌信息的订单（单店订单）
      if (!brandName || brandName === '默认') {
        continue;
      }

      // 初始化分组
      if (!groups[brandName]) {
        groups[brandName] = [];
      }
      
      groups[brandName].push(order);
    }

    return groups;
  }

  /**
   * 筛选品牌的售后记录
   * @param {Array} afterSales - 售后记录列表
   * @param {Array} subOrders - 该品牌的子订单列表
   * @returns {Array} 该品牌的售后记录
   */
  filterBrandAfterSales(afterSales, subOrders) {
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

    // 筛选属于该品牌的售后记录
    return afterSales.filter(afterSale => {
      if (!afterSale) {
        return false;
      }
      
      // 检查售后记录是否关联到该品牌的订单
      const subOrderId = afterSale.subOrderId || afterSale.orderId;
      return subOrderId && orderIds.has(subOrderId);
    });
  }

  /**
   * 从订单中获取品牌名称
   * @param {Object} order - 订单对象
   * @returns {string} 品牌名称
   */
  getBrandNameFromOrder(order) {
    // 方法1：直接从订单中获取品牌名称
    if (order.brandName) {
      return order.brandName;
    }

    // 方法2：从门店信息中获取品牌名称
    if (order.storeId) {
      // 从全局门店数据中查找
      if (typeof TEST_STORES !== 'undefined' && TEST_STORES[order.storeId]) {
        return TEST_STORES[order.storeId].brandName;
      }
      
      // 从DB中查找
      if (typeof DB !== 'undefined' && DB.stores && DB.stores[order.storeId]) {
        return DB.stores[order.storeId].brandName;
      }
    }

    // 方法3：从门店名称推断（如果门店名称包含品牌信息）
    if (order.storeName) {
      // 这里可以根据实际业务规则来推断品牌
      // 暂时返回null，表示无法确定品牌
    }

    return null;
  }

  /**
   * 获取品牌ID
   * @param {string} brandName - 品牌名称
   * @returns {string} 品牌ID
   */
  getBrandId(brandName) {
    // 简单地使用品牌名称作为ID
    // 在实际系统中，应该有专门的品牌ID
    return brandName;
  }

  /**
   * 从子订单中提取连锁总部应得金额
   * @param {Object} subOrder - 子订单
   * @returns {number} 连锁总部应得金额
   */
  extractHeadquarterAmount(subOrder) {
    if (!subOrder) {
      return 0;
    }

    // 方法1：从清分数据中获取连锁总部应得金额
    if (subOrder.clearing && typeof subOrder.clearing.headquarterAmount === 'number') {
      return subOrder.clearing.headquarterAmount;
    }

    // 方法2：从子订单项目的清分数据中累计
    if (subOrder.items && Array.isArray(subOrder.items)) {
      let totalHeadquarterAmount = 0;
      for (const item of subOrder.items) {
        if (item.clearing && typeof item.clearing.headquarterAmount === 'number') {
          totalHeadquarterAmount += item.clearing.headquarterAmount;
        }
      }
      if (totalHeadquarterAmount > 0) {
        return totalHeadquarterAmount;
      }
    }

    // 方法3：根据商家毛利计算（商家毛利 × 连锁总部分成比例）
    const merchantProfit = this.calculateMerchantProfit(subOrder);
    if (merchantProfit > 0) {
      const brandName = this.getBrandNameFromSubOrder(subOrder);
      const headquarterShareRate = this.getHeadquarterShareRate(brandName);
      return merchantProfit * headquarterShareRate;
    }

    return 0;
  }

  /**
   * 计算商家毛利
   * @param {Object} orderOrAfterSale - 订单或售后对象
   * @returns {number} 商家毛利
   */
  calculateMerchantProfit(orderOrAfterSale) {
    if (!orderOrAfterSale) {
      console.warn('[连锁总部毛利计算警告] 订单或售后对象为空，返回0');
      return 0;
    }

    try {
      // 方法1：从清分数据中获取
      if (orderOrAfterSale.clearing && typeof orderOrAfterSale.clearing.merchantProfit === 'number') {
        const profit = orderOrAfterSale.clearing.merchantProfit;
        if (!isNaN(profit) && profit >= 0) {
          return profit;
        } else {
          console.warn(`[连锁总部毛利计算警告] 清分数据中的商家毛利无效 (${profit})，尝试其他方法`);
        }
      }

      // 方法2：根据平台货款和供应商货款计算
      const platformAmount = this._safeGetNumber(
        orderOrAfterSale.platformAmount, 
        0, 
        `记录${orderOrAfterSale.id}的平台货款`
      );
      const supplierAmount = this._safeGetNumber(
        orderOrAfterSale.supplierAmount, 
        0, 
        `记录${orderOrAfterSale.id}的供应商货款`
      );
      
      if (platformAmount > 0 && supplierAmount >= 0 && platformAmount >= supplierAmount) {
        return platformAmount - supplierAmount;
      }

      // 方法3：根据订单金额估算（假设商家毛利占订单金额的20%）
      const totalAmount = this._safeGetNumber(
        orderOrAfterSale.amount || orderOrAfterSale.refundAmount, 
        0, 
        `记录${orderOrAfterSale.id}的总金额`
      );
      
      if (totalAmount > 0) {
        // 估算：总金额 × 20%（商家毛利比例）
        return totalAmount * 0.2;
      }

      console.warn(`[连锁总部毛利计算警告] 记录 ${orderOrAfterSale.id || '未知'} 无法计算有效的商家毛利，返回0`);
      return 0;

    } catch (error) {
      console.warn(`[连锁总部毛利计算错误] 处理记录 ${orderOrAfterSale?.id || '未知'} 时发生错误: ${error.message}`);
      return 0;
    }
  }

  /**
   * 从子订单中获取品牌名称
   * @param {Object} subOrder - 子订单对象
   * @returns {string} 品牌名称
   */
  getBrandNameFromSubOrder(subOrder) {
    if (!subOrder) {
      return null;
    }

    // 从父订单中获取品牌信息
    const parentOrderId = subOrder.parentOrderId || subOrder.orderId;
    if (parentOrderId) {
      // 查找父订单
      let parentOrder = null;
      if (typeof DB !== 'undefined' && DB.orders) {
        parentOrder = DB.orders.find(o => o.id === parentOrderId);
      }
      
      // 从全局测试数据中查找
      if (!parentOrder && typeof global !== 'undefined' && global.testOrders) {
        parentOrder = global.testOrders.find(o => o.id === parentOrderId);
      }
      
      if (parentOrder) {
        return this.getBrandNameFromOrder(parentOrder);
      }
    }

    return null;
  }

  /**
   * 获取连锁总部分成比例
   * @param {string} brandName - 品牌名称
   * @returns {number} 分成比例
   */
  getHeadquarterShareRate(brandName) {
    if (!brandName) {
      return 0;
    }

    // 从品牌配置中获取
    if (typeof BRAND_CONFIG !== 'undefined') {
      const brandConfig = BRAND_CONFIG[brandName] || BRAND_CONFIG['_default'];
      return brandConfig.headquarterShareRate || 0;
    }

    // 默认配置
    if (brandName === '伊智美妆') {
      return 0.10; // 10%
    }

    return 0;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HeadquarterReconciliation };
} else if (typeof window !== 'undefined') {
  window.HeadquarterReconciliation = HeadquarterReconciliation;
}