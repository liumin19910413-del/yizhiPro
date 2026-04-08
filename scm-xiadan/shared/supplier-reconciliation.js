/**
 * 供应商对账（Supplier Reconciliation）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责供应商对账的业务逻辑，包括月结汇总数据生成、按供应商分组、售后筛选等
 * 
 * Validates: Requirements 8.2, 8.4
 */

// 导入依赖模块（在浏览器环境中使用全局变量，在Node环境中使用require）
const getPaymentStatusCalculatorForSupplier = () => {
  if (typeof require !== 'undefined') {
    return require('./payment-status-calculator.js').PaymentStatusCalculator;
  } else if (typeof window !== 'undefined' && window.PaymentStatusCalculator) {
    return window.PaymentStatusCalculator;
  }
  throw new Error('PaymentStatusCalculator not found');
};

/**
 * 供应商对账
 */
class SupplierReconciliation {
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
   * 生成供应商月结汇总数据
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
      if (validSubOrders.length === 0) {
        console.info('[供应商对账提示] 没有子订单数据，返回空汇总');
        return [];
      }

      // 按供应商分组
      const supplierGroups = this.groupBySupplier(validSubOrders);
      
      if (Object.keys(supplierGroups).length === 0) {
        console.info('[供应商对账提示] 没有有效的供应商分组，返回空汇总');
        return [];
      }

      const summaries = [];
      let processedSupplierCount = 0;
      let errorSupplierCount = 0;

      for (const [supplierId, supplierOrders] of Object.entries(supplierGroups)) {
        try {
          // 筛选第一期和第二期订单
          const firstPeriod = this.calculator.filterFirstPeriodOrders(supplierOrders);
          const secondPeriod = this.calculator.filterSecondPeriodOrders(supplierOrders);

          // 计算正常应结金额（商品货款 + 运费）
          const normalAmount = this.calculator.calculateOrderAmount(
            firstPeriod,
            secondPeriod,
            order => {
              try {
                const supplierAmount = this._safeGetNumber(order.supplierAmount, 0, `供应商${supplierId}订单${order.id}的供应商货款`);
                const shippingFee = this._safeGetNumber(order.shippingFee, 0, `供应商${supplierId}订单${order.id}的运费`);
                return supplierAmount + shippingFee;
              } catch (error) {
                console.warn(`[供应商对账警告] 计算订单金额时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 筛选该供应商的售后记录
          const supplierAfterSales = this.filterSupplierAfterSales(
            validAfterSales,
            supplierOrders
          );
          const chargebacks = this.calculator.filterChargebacks(supplierAfterSales);

          // 计算冲账金额
          const chargebackAmount = this.calculator.calculateChargebackAmount(
            chargebacks,
            afterSale => {
              try {
                return this._safeGetNumber(afterSale.refundAmount, 0, `供应商${supplierId}售后${afterSale.id}的退款金额`);
              } catch (error) {
                console.warn(`[供应商对账警告] 计算售后金额时发生错误，售后ID: ${afterSale?.id || '未知'}，错误: ${error.message}`);
                return 0;
              }
            }
          );

          // 计算净应结金额
          const netAmount = this.calculator.calculateNetAmount(
            normalAmount,
            chargebackAmount
          );

          // 获取供应商名称（从第一个订单中获取）
          const supplierName = this._getSupplierName(supplierOrders, supplierId);

          // TODO: 从数据库读取已付金额，这里暂时设为0
          const paidAmount = 0;

          // 计算待付金额和付款状态
          const PaymentStatusCalculator = getPaymentStatusCalculatorForSupplier();
          const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);
          const paymentStatus = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);

          summaries.push({
            supplierId,
            supplierName,
            settlementMonth: this.calculator.settlementMonth,
            orderCount: supplierOrders.length,
            normalAmount,
            chargebackAmount,
            netAmount,
            paidAmount,
            pendingAmount,
            paymentStatus
          });

          processedSupplierCount++;

        } catch (error) {
          errorSupplierCount++;
          console.warn(`[供应商对账错误] 处理供应商 ${supplierId} 时发生错误: ${error.message}`);
          // 跳过有问题的供应商，继续处理其他供应商
          continue;
        }
      }

      // 友好的处理结果提示
      console.info(`[供应商对账完成] 成功处理 ${processedSupplierCount} 个供应商，${errorSupplierCount} 个供应商处理失败`);

      return summaries;

    } catch (error) {
      console.error('[供应商对账严重错误] 生成汇总数据时发生严重错误:', error);
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
      console.warn(`[供应商对账警告] ${dataType}数据为空，使用空数组处理`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`[供应商对账警告] ${dataType}数据不是有效数组 (类型: ${typeof data})，使用空数组处理`);
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
      console.warn(`[供应商对账警告] ${fieldDescription}为空，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      console.warn(`[供应商对账警告] ${fieldDescription}无效 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    if (value < 0) {
      console.warn(`[供应商对账警告] ${fieldDescription}为负数 (${value})，使用默认值${defaultValue}`);
      return defaultValue;
    }
    
    return value;
  }

  /**
   * 获取供应商名称
   * @private
   * @param {Array} supplierOrders - 供应商订单列表
   * @param {string} supplierId - 供应商ID
   * @returns {string} 供应商名称
   */
  _getSupplierName(supplierOrders, supplierId) {
    try {
      if (supplierOrders.length > 0 && supplierOrders[0].supplierName) {
        return supplierOrders[0].supplierName;
      }
    } catch (error) {
      console.warn(`[供应商对账警告] 获取供应商名称时发生错误: ${error.message}`);
    }
    
    return `供应商${supplierId}`;
  }

  /**
   * 按供应商分组
   * @param {Array} subOrders - 子订单列表
   * @returns {Object} 按供应商ID分组的订单对象
   */
  groupBySupplier(subOrders) {
    // 验证输入参数
    if (!Array.isArray(subOrders)) {
      return {};
    }

    const groups = {};
    
    for (const order of subOrders) {
      // 跳过无效订单
      if (!order || !order.supplierId) {
        continue;
      }

      const supplierId = order.supplierId;
      
      // 初始化分组
      if (!groups[supplierId]) {
        groups[supplierId] = [];
      }
      
      groups[supplierId].push(order);
    }

    return groups;
  }

  /**
   * 筛选供应商的售后记录
   * @param {Array} afterSales - 售后记录列表
   * @param {Array} supplierOrders - 该供应商的订单列表
   * @returns {Array} 该供应商的售后记录
   */
  filterSupplierAfterSales(afterSales, supplierOrders) {
    // 验证输入参数
    if (!Array.isArray(afterSales) || !Array.isArray(supplierOrders)) {
      return [];
    }

    // 创建订单ID集合，用于快速查找
    const orderIds = new Set();
    for (const order of supplierOrders) {
      if (order && order.id) {
        orderIds.add(order.id);
      }
    }

    // 筛选属于该供应商的售后记录
    return afterSales.filter(afterSale => {
      if (!afterSale) {
        return false;
      }
      
      // 检查售后记录是否关联到该供应商的订单
      const subOrderId = afterSale.subOrderId || afterSale.orderId;
      return subOrderId && orderIds.has(subOrderId);
    });
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupplierReconciliation };
} else if (typeof window !== 'undefined') {
  window.SupplierReconciliation = SupplierReconciliation;
}