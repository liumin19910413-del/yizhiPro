/**
 * 结算计算引擎（Settlement Calculator）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责订单筛选和金额计算的核心逻辑
 * 
 * Validates: Requirements 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3
 */

/**
 * 结算计算引擎
 */
class SettlementCalculator {
  /**
   * 构造函数
   * @param {Date} settlementDate - 结算日期
   */
  constructor(settlementDate) {
    if (!settlementDate || !(settlementDate instanceof Date) || isNaN(settlementDate.getTime())) {
      throw new Error('Invalid settlement date');
    }
    this.settlementDate = settlementDate;
    this.settlementMonth = this.formatMonth(settlementDate);
  }

  /**
   * 格式化结算月份
   * @param {Date} date - 日期
   * @returns {string} 格式化的月份（如：2026年04月）
   */
  formatMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}年${month}月`;
  }

  /**
   * 筛选第一期应结订单（T+7，90%）
   * @param {Array} subOrders - 子订单列表
   * @returns {Array} 符合条件的订单
   */
  filterFirstPeriodOrders(subOrders) {
    if (!Array.isArray(subOrders)) {
      return [];
    }

    return subOrders.filter(order => {
      // 检查必需字段 - 验证订单deliverTime字段存在性
      if (!order.deliverTime) {
        console.warn(`[数据验证警告] 订单缺少deliverTime字段，跳过该记录。订单ID: ${order.id || '未知'}, 订单号: ${order.orderNo || '未知'}`);
        return false;
      }

      try {
        const deliveryDate = new Date(order.deliverTime);
        
        // 验证日期有效性
        if (isNaN(deliveryDate.getTime())) {
          console.warn(`[数据验证警告] 订单deliverTime字段格式无效，跳过该记录。订单ID: ${order.id || '未知'}, deliverTime: ${order.deliverTime}`);
          return false;
        }

        // 计算签收时间 + 7天
        const eligibleDate = new Date(deliveryDate);
        eligibleDate.setDate(eligibleDate.getDate() + 7);
        
        // 判断是否满足条件：签收时间 + 7天 <= 结算日期
        return eligibleDate <= this.settlementDate;
      } catch (error) {
        console.warn(`[数据验证警告] 处理订单deliverTime时发生错误，跳过该记录。订单ID: ${order.id || '未知'}, 错误: ${error.message}`);
        return false;
      }
    });
  }

  /**
   * 筛选第二期应结订单（T+30，10%）
   * @param {Array} subOrders - 子订单列表
   * @returns {Array} 符合条件的订单
   */
  filterSecondPeriodOrders(subOrders) {
    if (!Array.isArray(subOrders)) {
      return [];
    }

    return subOrders.filter(order => {
      // 检查必需字段 - 验证订单deliverTime字段存在性
      if (!order.deliverTime) {
        console.warn(`[数据验证警告] 订单缺少deliverTime字段，跳过该记录。订单ID: ${order.id || '未知'}, 订单号: ${order.orderNo || '未知'}`);
        return false;
      }

      try {
        const deliveryDate = new Date(order.deliverTime);
        
        // 验证日期有效性
        if (isNaN(deliveryDate.getTime())) {
          console.warn(`[数据验证警告] 订单deliverTime字段格式无效，跳过该记录。订单ID: ${order.id || '未知'}, deliverTime: ${order.deliverTime}`);
          return false;
        }

        // 计算签收时间 + 30天
        const eligibleDate = new Date(deliveryDate);
        eligibleDate.setDate(eligibleDate.getDate() + 30);
        
        // 判断是否满足条件：签收时间 + 30天 <= 结算日期
        return eligibleDate <= this.settlementDate;
      } catch (error) {
        console.warn(`[数据验证警告] 处理订单deliverTime时发生错误，跳过该记录。订单ID: ${order.id || '未知'}, 错误: ${error.message}`);
        return false;
      }
    });
  }

  /**
   * 筛选售后冲账记录
   * @param {Array} afterSales - 售后记录列表
   * @returns {Array} 符合条件的售后记录
   */
  filterChargebacks(afterSales) {
    if (!Array.isArray(afterSales)) {
      return [];
    }

    return afterSales.filter(afterSale => {
      // 检查必需字段 - 验证售后refundTime字段存在性
      if (!afterSale.refundTime) {
        console.warn(`[数据验证警告] 售后记录缺少refundTime字段，跳过该记录。售后ID: ${afterSale.id || '未知'}, 子订单ID: ${afterSale.subOrderId || '未知'}`);
        return false;
      }

      try {
        const refundDate = new Date(afterSale.refundTime);
        
        // 验证日期有效性
        if (isNaN(refundDate.getTime())) {
          console.warn(`[数据验证警告] 售后记录refundTime字段格式无效，跳过该记录。售后ID: ${afterSale.id || '未知'}, refundTime: ${afterSale.refundTime}`);
          return false;
        }

        // 判断是否满足条件：退款完成时间 <= 结算日期
        return refundDate <= this.settlementDate;
      } catch (error) {
        console.warn(`[数据验证警告] 处理售后记录refundTime时发生错误，跳过该记录。售后ID: ${afterSale.id || '未知'}, 错误: ${error.message}`);
        return false;
      }
    });
  }

  /**
   * 计算订单应结金额
   * @param {Array} firstPeriodOrders - 第一期订单
   * @param {Array} secondPeriodOrders - 第二期订单
   * @param {Function} amountExtractor - 金额提取函数
   * @returns {number} 总应结金额
   */
  calculateOrderAmount(firstPeriodOrders, secondPeriodOrders, amountExtractor) {
    // 处理空数据情况
    if (!Array.isArray(firstPeriodOrders) || !Array.isArray(secondPeriodOrders)) {
      console.warn('[错误处理] 订单数据不是有效数组，返回金额为0');
      return 0;
    }

    if (typeof amountExtractor !== 'function') {
      console.error('[错误处理] 金额提取函数无效，无法计算订单金额');
      throw new Error('金额提取函数必须是一个有效的函数');
    }

    // 处理空数据情况
    if (firstPeriodOrders.length === 0 && secondPeriodOrders.length === 0) {
      console.info('[数据提示] 没有符合条件的订单，应结金额为0');
      return 0;
    }

    let invalidOrderCount = 0;

    // 计算第一期金额（90%）
    const firstPeriodAmount = firstPeriodOrders.reduce((sum, order) => {
      try {
        if (!order) {
          invalidOrderCount++;
          return sum;
        }

        const amount = amountExtractor(order);
        
        // 处理无效金额
        if (amount === null || amount === undefined) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额为空，视为0处理`);
          return sum;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额无效 (${amount})，视为0处理`);
          return sum;
        }

        if (amount < 0) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额为负数 (${amount})，视为0处理`);
          return sum;
        }

        return sum + (amount * 0.9);
      } catch (error) {
        invalidOrderCount++;
        console.warn(`[错误处理] 处理第一期订单时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
        return sum;
      }
    }, 0);

    // 计算第二期金额（10%）
    const secondPeriodAmount = secondPeriodOrders.reduce((sum, order) => {
      try {
        if (!order) {
          invalidOrderCount++;
          return sum;
        }

        const amount = amountExtractor(order);
        
        // 处理无效金额
        if (amount === null || amount === undefined) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额为空，视为0处理`);
          return sum;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额无效 (${amount})，视为0处理`);
          return sum;
        }

        if (amount < 0) {
          console.warn(`[金额处理警告] 订单 ${order.id || '未知'} 的金额为负数 (${amount})，视为0处理`);
          return sum;
        }

        return sum + (amount * 0.1);
      } catch (error) {
        invalidOrderCount++;
        console.warn(`[错误处理] 处理第二期订单时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
        return sum;
      }
    }, 0);

    // 友好的错误提示
    if (invalidOrderCount > 0) {
      console.warn(`[数据质量提示] 共有 ${invalidOrderCount} 个订单因数据问题被跳过，请检查数据完整性`);
    }

    const totalAmount = firstPeriodAmount + secondPeriodAmount;
    
    // 精度处理
    return Math.round(totalAmount * 100) / 100;
  }

  /**
   * 计算售后冲账金额
   * @param {Array} chargebacks - 售后记录
   * @param {Function} amountExtractor - 金额提取函数
   * @returns {number} 冲账金额（负数）
   */
  calculateChargebackAmount(chargebacks, amountExtractor) {
    // 处理空数据情况
    if (!Array.isArray(chargebacks)) {
      console.warn('[错误处理] 售后数据不是有效数组，返回冲账金额为0');
      return 0;
    }

    if (typeof amountExtractor !== 'function') {
      console.error('[错误处理] 金额提取函数无效，无法计算冲账金额');
      throw new Error('金额提取函数必须是一个有效的函数');
    }

    // 处理空数据情况
    if (chargebacks.length === 0) {
      console.info('[数据提示] 没有符合条件的售后记录，冲账金额为0');
      return 0;
    }

    let invalidChargebackCount = 0;

    const totalChargeback = chargebacks.reduce((sum, chargeback) => {
      try {
        if (!chargeback) {
          invalidChargebackCount++;
          return sum;
        }

        const amount = amountExtractor(chargeback);
        
        // 处理无效金额
        if (amount === null || amount === undefined) {
          console.warn(`[金额处理警告] 售后记录 ${chargeback.id || '未知'} 的退款金额为空，视为0处理`);
          return sum;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) {
          console.warn(`[金额处理警告] 售后记录 ${chargeback.id || '未知'} 的退款金额无效 (${amount})，视为0处理`);
          return sum;
        }

        if (amount < 0) {
          console.warn(`[金额处理警告] 售后记录 ${chargeback.id || '未知'} 的退款金额为负数 (${amount})，取绝对值处理`);
          return sum + Math.abs(amount);
        }

        return sum + amount;
      } catch (error) {
        invalidChargebackCount++;
        console.warn(`[错误处理] 处理售后记录时发生错误，记录ID: ${chargeback?.id || '未知'}，错误: ${error.message}`);
        return sum;
      }
    }, 0);

    // 友好的错误提示
    if (invalidChargebackCount > 0) {
      console.warn(`[数据质量提示] 共有 ${invalidChargebackCount} 个售后记录因数据问题被跳过，请检查数据完整性`);
    }

    // 返回负数（冲账）
    const result = -totalChargeback;
    
    // 精度处理
    return Math.round(result * 100) / 100;
  }

  /**
   * 计算净应结金额
   * @param {number} normalAmount - 正常应结金额
   * @param {number} chargebackAmount - 冲账金额
   * @returns {number} 净应结金额
   */
  calculateNetAmount(normalAmount, chargebackAmount) {
    // 处理无效金额，提供友好的错误提示
    let normal = 0;
    let chargeback = 0;

    if (normalAmount === null || normalAmount === undefined) {
      console.warn('[金额处理警告] 正常应结金额为空，视为0处理');
    } else if (typeof normalAmount !== 'number' || isNaN(normalAmount)) {
      console.warn(`[金额处理警告] 正常应结金额无效 (${normalAmount})，视为0处理`);
    } else {
      normal = normalAmount;
    }

    if (chargebackAmount === null || chargebackAmount === undefined) {
      console.warn('[金额处理警告] 冲账金额为空，视为0处理');
    } else if (typeof chargebackAmount !== 'number' || isNaN(chargebackAmount)) {
      console.warn(`[金额处理警告] 冲账金额无效 (${chargebackAmount})，视为0处理`);
    } else {
      chargeback = chargebackAmount;
    }

    const result = normal + chargeback;
    
    // 精度处理
    return Math.round(result * 100) / 100;
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettlementCalculator };
}
