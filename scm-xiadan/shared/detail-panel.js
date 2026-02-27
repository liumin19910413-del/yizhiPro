/**
 * 明细对账面板（Detail Panel）
 * 
 * Feature: financial-reconciliation-refactor
 * 负责生成明细记录和统计计算的逻辑
 * 
 * Validates: Requirements 6.1, 6.2, 6.4, 6.5
 */

/**
 * 明细对账面板
 */
class DetailPanel {
  /**
   * 生成明细数据（整合订单和冲账）
   * @param {Array} orders - 订单列表
   * @param {Array} chargebacks - 冲账列表
   * @returns {Array} 明细记录
   */
  generateDetailRecords(orders, chargebacks) {
    // 验证输入参数，提供友好的错误提示
    const validOrders = this._validateAndSanitizeArray(orders, '订单');
    const validChargebacks = this._validateAndSanitizeArray(chargebacks, '冲账');
    
    const records = [];
    let invalidOrderCount = 0;
    let invalidChargebackCount = 0;

    // 添加正常订单记录
    for (const order of validOrders) {
      try {
        if (!order) {
          invalidOrderCount++;
          continue;
        }
        
        // 处理订单金额
        let amount = 0;
        if (order.amount === null || order.amount === undefined) {
          console.warn(`[明细记录警告] 订单 ${order.id || '未知'} 的金额为空，视为0处理`);
        } else if (typeof order.amount !== 'number' || isNaN(order.amount)) {
          console.warn(`[明细记录警告] 订单 ${order.id || '未知'} 的金额无效 (${order.amount})，视为0处理`);
        } else {
          amount = order.amount;
        }

        // 处理签收时间
        let deliverTime = order.deliverTime || null;
        if (deliverTime && typeof deliverTime === 'string') {
          try {
            const testDate = new Date(deliverTime);
            if (isNaN(testDate.getTime())) {
              console.warn(`[明细记录警告] 订单 ${order.id || '未知'} 的签收时间格式无效 (${deliverTime})，设为空`);
              deliverTime = null;
            }
          } catch (error) {
            console.warn(`[明细记录警告] 订单 ${order.id || '未知'} 的签收时间解析失败: ${error.message}`);
            deliverTime = null;
          }
        }
        
        records.push({
          type: 'order',
          typeLabel: '🟢订单',
          orderId: order.id || '',
          orderNo: order.orderNo || order.id || '',
          amount: amount,
          deliverTime: deliverTime,
          backgroundColor: '#ffffff'
        });
      } catch (error) {
        invalidOrderCount++;
        console.warn(`[明细记录错误] 处理订单记录时发生错误，订单ID: ${order?.id || '未知'}，错误: ${error.message}`);
      }
    }

    // 添加冲账记录
    for (const chargeback of validChargebacks) {
      try {
        if (!chargeback) {
          invalidChargebackCount++;
          continue;
        }
        
        // 处理退款金额
        let refundAmount = 0;
        if (chargeback.refundAmount === null || chargeback.refundAmount === undefined) {
          console.warn(`[明细记录警告] 冲账记录 ${chargeback.id || '未知'} 的退款金额为空，视为0处理`);
        } else if (typeof chargeback.refundAmount !== 'number' || isNaN(chargeback.refundAmount)) {
          console.warn(`[明细记录警告] 冲账记录 ${chargeback.id || '未知'} 的退款金额无效 (${chargeback.refundAmount})，视为0处理`);
        } else {
          refundAmount = chargeback.refundAmount;
        }

        // 处理退款时间
        let refundTime = chargeback.refundTime || null;
        if (refundTime && typeof refundTime === 'string') {
          try {
            const testDate = new Date(refundTime);
            if (isNaN(testDate.getTime())) {
              console.warn(`[明细记录警告] 冲账记录 ${chargeback.id || '未知'} 的退款时间格式无效 (${refundTime})，设为空`);
              refundTime = null;
            }
          } catch (error) {
            console.warn(`[明细记录警告] 冲账记录 ${chargeback.id || '未知'} 的退款时间解析失败: ${error.message}`);
            refundTime = null;
          }
        }
        
        // 冲账金额为负数（确保0不变成-0）
        const amount = refundAmount === 0 ? 0 : -refundAmount;
        
        records.push({
          type: 'chargeback',
          typeLabel: '🔴冲账',
          orderId: chargeback.subOrderId || chargeback.orderId || '',
          orderNo: chargeback.originalOrderNo || chargeback.orderNo || '',
          amount: amount,
          refundTime: refundTime,
          refundReason: chargeback.reason || chargeback.refundReason || '',
          backgroundColor: '#ffebee'
        });
      } catch (error) {
        invalidChargebackCount++;
        console.warn(`[明细记录错误] 处理冲账记录时发生错误，记录ID: ${chargeback?.id || '未知'}，错误: ${error.message}`);
      }
    }

    // 友好的错误提示
    if (invalidOrderCount > 0) {
      console.warn(`[数据质量提示] 共有 ${invalidOrderCount} 个订单记录因数据问题被跳过，请检查数据完整性`);
    }
    if (invalidChargebackCount > 0) {
      console.warn(`[数据质量提示] 共有 ${invalidChargebackCount} 个冲账记录因数据问题被跳过，请检查数据完整性`);
    }

    // 按时间排序（订单按签收时间，冲账按退款时间）
    try {
      records.sort((a, b) => {
        const timeA = a.deliverTime || a.refundTime;
        const timeB = b.deliverTime || b.refundTime;
        
        // 如果时间字段不存在，放到最后
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        try {
          const dateA = new Date(timeA);
          const dateB = new Date(timeB);
          
          // 验证日期有效性
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateA - dateB;
        } catch (error) {
          console.warn('[明细记录排序警告] 时间比较时发生错误:', error);
          return 0;
        }
      });
    } catch (error) {
      console.warn('[明细记录排序错误] 排序过程中发生错误:', error);
      // 排序失败时不影响数据返回
    }

    return records;
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
      console.warn(`[数据验证警告] ${dataType}数据为空，使用空数组处理`);
      return [];
    }
    
    if (!Array.isArray(data)) {
      console.warn(`[数据验证警告] ${dataType}数据不是有效数组 (类型: ${typeof data})，使用空数组处理`);
      return [];
    }
    
    return data;
  }

  /**
   * 计算明细统计
   * @param {Array} records - 明细记录
   * @returns {Object} 统计数据
   */
  calculateSummary(records) {
    // 验证输入参数
    if (!Array.isArray(records)) {
      console.warn('[明细统计警告] 明细记录不是有效数组，返回零值统计');
      return {
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      };
    }

    // 处理空数据情况
    if (records.length === 0) {
      console.info('[明细统计提示] 没有明细记录，返回零值统计');
      return {
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      };
    }

    let orderTotal = 0;
    let chargebackTotal = 0;
    let invalidRecordCount = 0;

    for (const record of records) {
      try {
        if (!record) {
          invalidRecordCount++;
          continue;
        }

        // 验证金额有效性
        if (record.amount === null || record.amount === undefined) {
          console.warn(`[明细统计警告] 记录 ${record.orderId || '未知'} 的金额为空，跳过统计`);
          invalidRecordCount++;
          continue;
        }

        if (typeof record.amount !== 'number' || isNaN(record.amount)) {
          console.warn(`[明细统计警告] 记录 ${record.orderId || '未知'} 的金额无效 (${record.amount})，跳过统计`);
          invalidRecordCount++;
          continue;
        }

        // 按类型累计金额
        if (record.type === 'order') {
          orderTotal += record.amount;
        } else if (record.type === 'chargeback') {
          chargebackTotal += record.amount; // 已经是负数
        } else {
          console.warn(`[明细统计警告] 记录 ${record.orderId || '未知'} 的类型无效 (${record.type})，跳过统计`);
          invalidRecordCount++;
        }
      } catch (error) {
        invalidRecordCount++;
        console.warn(`[明细统计错误] 处理记录时发生错误，记录ID: ${record?.orderId || '未知'}，错误: ${error.message}`);
      }
    }

    // 友好的错误提示
    if (invalidRecordCount > 0) {
      console.warn(`[数据质量提示] 共有 ${invalidRecordCount} 个明细记录因数据问题被跳过，请检查数据完整性`);
    }

    try {
      // 精度处理
      const result = {
        orderTotal: Math.round(orderTotal * 100) / 100,
        chargebackTotal: Math.round(chargebackTotal * 100) / 100,
        netTotal: Math.round((orderTotal + chargebackTotal) * 100) / 100
      };

      return result;
    } catch (error) {
      console.error('[明细统计错误] 计算统计数据时发生错误:', error);
      return {
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      };
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DetailPanel };
} else if (typeof window !== 'undefined') {
  window.DetailPanel = DetailPanel;
}