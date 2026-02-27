/**
 * 金额格式化工具（Amount Formatter）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责金额格式化显示的工具类
 * 
 * Validates: Requirements 5.2, 12.1
 */

/**
 * 金额格式化工具
 */
class AmountFormatter {
  /**
   * 格式化金额
   * @param {number} amount - 金额
   * @returns {string} 格式化后的金额字符串
   */
  static format(amount) {
    let validAmount = 0;

    // 处理无效金额，提供友好的错误提示
    if (amount === null || amount === undefined) {
      console.warn('[金额格式化警告] 金额为空，显示为¥0.00');
    } else if (typeof amount !== 'number') {
      console.warn(`[金额格式化警告] 金额类型无效 (${typeof amount}: ${amount})，显示为¥0.00`);
    } else if (isNaN(amount)) {
      console.warn('[金额格式化警告] 金额为NaN，显示为¥0.00');
    } else if (!isFinite(amount)) {
      console.warn('[金额格式化警告] 金额为无穷大，显示为¥0.00');
    } else {
      validAmount = amount;
    }
    
    // 判断是否为负数
    const isNegative = validAmount < 0;
    
    // 取绝对值进行格式化
    const absAmount = Math.abs(validAmount);
    
    try {
      // 保留两位小数并添加千分位分隔符
      const formatted = absAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      // 添加货币符号和负号
      return isNegative ? `-¥${formatted}` : `¥${formatted}`;
    } catch (error) {
      console.error('[金额格式化错误] 格式化过程中发生错误:', error);
      return '¥0.00';
    }
  }

  /**
   * 格式化为红色金额（用于冲账）
   * @param {number} amount - 金额
   * @returns {string} HTML格式的红色金额
   */
  static formatRed(amount) {
    try {
      const formatted = this.format(amount);
      return `<span style="color: #e74c3c;">${formatted}</span>`;
    } catch (error) {
      console.error('[红色金额格式化错误] 格式化过程中发生错误:', error);
      return '<span style="color: #e74c3c;">¥0.00</span>';
    }
  }

  /**
   * 验证金额是否有效
   * @param {any} amount - 待验证的金额
   * @returns {boolean} 是否为有效金额
   */
  static isValidAmount(amount) {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
  }

  /**
   * 安全地转换为有效金额
   * @param {any} amount - 待转换的金额
   * @param {number} defaultValue - 默认值
   * @returns {number} 有效的金额数值
   */
  static toValidAmount(amount, defaultValue = 0) {
    if (this.isValidAmount(amount)) {
      return amount;
    }
    
    // 尝试转换字符串数字
    if (typeof amount === 'string' && amount.trim() !== '') {
      const parsed = parseFloat(amount.replace(/[,¥]/g, ''));
      if (this.isValidAmount(parsed)) {
        return parsed;
      }
    }
    
    return defaultValue;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AmountFormatter };
} else if (typeof window !== 'undefined') {
  window.AmountFormatter = AmountFormatter;
}