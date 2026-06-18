/**
 * 付款状态计算器（Payment Status Calculator）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责计算付款状态和待付金额的逻辑
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

/**
 * 付款状态计算器
 */
class PaymentStatusCalculator {
  /**
   * 计算付款状态
   * @param {number} paidAmount - 已付金额
   * @param {number} netAmount - 净应结金额
   * @returns {string} 付款状态
   */
  static calculateStatus(paidAmount, netAmount) {
    // 处理无效输入，提供友好的错误提示
    let paid = 0;
    let net = 0;

    if (paidAmount === null || paidAmount === undefined) {
      console.warn('[付款状态计算警告] 已付金额为空，视为0处理');
    } else if (typeof paidAmount !== 'number' || isNaN(paidAmount)) {
      console.warn(`[付款状态计算警告] 已付金额无效 (${paidAmount})，视为0处理`);
    } else if (paidAmount < 0) {
      console.warn(`[付款状态计算警告] 已付金额为负数 (${paidAmount})，视为0处理`);
    } else {
      paid = paidAmount;
    }

    if (netAmount === null || netAmount === undefined) {
      console.warn('[付款状态计算警告] 净应结金额为空，视为0处理');
    } else if (typeof netAmount !== 'number' || isNaN(netAmount)) {
      console.warn(`[付款状态计算警告] 净应结金额无效 (${netAmount})，视为0处理`);
    } else {
      net = netAmount;
    }

    try {
      if (net > 0) {
        // 应付款场景（净应结 > 0）
        if (paid <= 0) {
          return '未付款';
        } else if (paid < net) {
          return '部分付款';
        } else {
          return '已付款';
        }
      } else if (net < 0) {
        // 应收款场景（净应结 < 0）
        if (paid <= 0) {
          return '应收款';
        } else {
          return '已收款';
        }
      } else {
        // 净应结为0
        return '已结清';
      }
    } catch (error) {
      console.error('[付款状态计算错误] 计算过程中发生错误:', error);
      return '状态异常';
    }
  }

  /**
   * 计算待付金额
   * @param {number} paidAmount - 已付金额
   * @param {number} netAmount - 净应结金额
   * @returns {number} 待付金额
   */
  static calculatePendingAmount(paidAmount, netAmount) {
    // 处理无效输入，提供友好的错误提示
    let paid = 0;
    let net = 0;

    if (paidAmount === null || paidAmount === undefined) {
      console.warn('[待付金额计算警告] 已付金额为空，视为0处理');
    } else if (typeof paidAmount !== 'number' || isNaN(paidAmount)) {
      console.warn(`[待付金额计算警告] 已付金额无效 (${paidAmount})，视为0处理`);
    } else if (paidAmount < 0) {
      console.warn(`[待付金额计算警告] 已付金额为负数 (${paidAmount})，视为0处理`);
    } else {
      paid = paidAmount;
    }

    if (netAmount === null || netAmount === undefined) {
      console.warn('[待付金额计算警告] 净应结金额为空，视为0处理');
    } else if (typeof netAmount !== 'number' || isNaN(netAmount)) {
      console.warn(`[待付金额计算警告] 净应结金额无效 (${netAmount})，视为0处理`);
    } else {
      net = netAmount;
    }

    try {
      // 待付金额 = max(0, 净应结金额 - 已付金额)
      const result = Math.max(0, net - paid);
      
      // 精度处理
      return Math.round(result * 100) / 100;
    } catch (error) {
      console.error('[待付金额计算错误] 计算过程中发生错误:', error);
      return 0;
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PaymentStatusCalculator };
} else if (typeof window !== 'undefined') {
  window.PaymentStatusCalculator = PaymentStatusCalculator;
}