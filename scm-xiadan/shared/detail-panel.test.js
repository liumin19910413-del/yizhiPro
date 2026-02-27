/**
 * 明细对账面板测试（Detail Panel Tests）
 * 
 * Feature: financial-reconciliation-refactor
 * 测试明细记录生成和统计计算功能
 */

const { DetailPanel } = require('./detail-panel');

describe('DetailPanel', () => {
  let detailPanel;

  beforeEach(() => {
    detailPanel = new DetailPanel();
  });

  describe('generateDetailRecords', () => {
    it('should generate records for orders and chargebacks', () => {
      const orders = [
        {
          id: 'order1',
          orderNo: 'ORD001',
          amount: 1000,
          deliverTime: '2024-01-15T10:00:00Z'
        },
        {
          id: 'order2',
          orderNo: 'ORD002',
          amount: 2000,
          deliverTime: '2024-01-16T10:00:00Z'
        }
      ];

      const chargebacks = [
        {
          subOrderId: 'order1',
          originalOrderNo: 'ORD001',
          refundAmount: 500,
          refundTime: '2024-01-17T10:00:00Z',
          reason: '质量问题'
        }
      ];

      const records = detailPanel.generateDetailRecords(orders, chargebacks);

      expect(records).toHaveLength(3);
      
      // 检查订单记录
      const orderRecords = records.filter(r => r.type === 'order');
      expect(orderRecords).toHaveLength(2);
      expect(orderRecords[0]).toMatchObject({
        type: 'order',
        typeLabel: '🟢订单',
        orderId: 'order1',
        orderNo: 'ORD001',
        amount: 1000,
        backgroundColor: '#ffffff'
      });

      // 检查冲账记录
      const chargebackRecords = records.filter(r => r.type === 'chargeback');
      expect(chargebackRecords).toHaveLength(1);
      expect(chargebackRecords[0]).toMatchObject({
        type: 'chargeback',
        typeLabel: '🔴冲账',
        orderId: 'order1',
        orderNo: 'ORD001',
        amount: -500, // 冲账金额为负数
        refundReason: '质量问题',
        backgroundColor: '#ffebee'
      });
    });

    it('should handle empty arrays', () => {
      const records = detailPanel.generateDetailRecords([], []);
      expect(records).toEqual([]);
    });

    it('should handle null/undefined inputs', () => {
      const records = detailPanel.generateDetailRecords(null, undefined);
      expect(records).toEqual([]);
    });

    it('should handle invalid order data', () => {
      const orders = [
        null,
        undefined,
        { id: 'order1' }, // 缺少amount
        { id: 'order2', amount: 'invalid' }, // 无效amount
        { id: 'order3', amount: 1000 } // 正常订单
      ];

      const records = detailPanel.generateDetailRecords(orders, []);
      
      expect(records).toHaveLength(3); // null和undefined被跳过，其他3个被处理
      
      // 检查缺少amount的订单
      const recordWithoutAmount = records.find(r => r.orderId === 'order1');
      expect(recordWithoutAmount.amount).toBe(0);
      
      // 检查无效amount的订单
      const recordWithInvalidAmount = records.find(r => r.orderId === 'order2');
      expect(recordWithInvalidAmount.amount).toBe(0);
      
      // 检查正常订单
      const normalRecord = records.find(r => r.orderId === 'order3');
      expect(normalRecord.amount).toBe(1000);
    });

    it('should handle invalid chargeback data', () => {
      const chargebacks = [
        null,
        undefined,
        { subOrderId: 'order1' }, // 缺少refundAmount
        { subOrderId: 'order2', refundAmount: 'invalid' }, // 无效refundAmount
        { subOrderId: 'order3', refundAmount: 500 } // 正常冲账
      ];

      const records = detailPanel.generateDetailRecords([], chargebacks);
      
      expect(records).toHaveLength(3); // null和undefined被跳过
      
      // 检查缺少refundAmount的冲账
      const recordWithoutAmount = records.find(r => r.orderId === 'order1');
      expect(recordWithoutAmount.amount).toBe(0);
      
      // 检查无效refundAmount的冲账
      const recordWithInvalidAmount = records.find(r => r.orderId === 'order2');
      expect(recordWithInvalidAmount.amount).toBe(0);
      
      // 检查正常冲账
      const normalRecord = records.find(r => r.orderId === 'order3');
      expect(normalRecord.amount).toBe(-500);
    });

    it('should sort records by time', () => {
      const orders = [
        {
          id: 'order2',
          orderNo: 'ORD002',
          amount: 2000,
          deliverTime: '2024-01-16T10:00:00Z'
        },
        {
          id: 'order1',
          orderNo: 'ORD001',
          amount: 1000,
          deliverTime: '2024-01-15T10:00:00Z'
        }
      ];

      const chargebacks = [
        {
          subOrderId: 'order1',
          originalOrderNo: 'ORD001',
          refundAmount: 500,
          refundTime: '2024-01-17T10:00:00Z',
          reason: '质量问题'
        }
      ];

      const records = detailPanel.generateDetailRecords(orders, chargebacks);

      // 应该按时间排序：order1 (15日) -> order2 (16日) -> chargeback (17日)
      expect(records[0].orderId).toBe('order1');
      expect(records[1].orderId).toBe('order2');
      expect(records[2].type).toBe('chargeback');
    });

    it('should handle records without time fields', () => {
      const orders = [
        { id: 'order1', amount: 1000 }, // 没有deliverTime
        { id: 'order2', amount: 2000, deliverTime: '2024-01-15T10:00:00Z' }
      ];

      const chargebacks = [
        { subOrderId: 'order3', refundAmount: 500 } // 没有refundTime
      ];

      const records = detailPanel.generateDetailRecords(orders, chargebacks);
      
      expect(records).toHaveLength(3);
      // 有时间的记录应该排在前面
      expect(records[0].orderId).toBe('order2');
    });

    it('should handle invalid time formats', () => {
      const orders = [
        {
          id: 'order1',
          amount: 1000,
          deliverTime: 'invalid-date'
        },
        {
          id: 'order2',
          amount: 2000,
          deliverTime: '2024-01-15T10:00:00Z'
        }
      ];

      const records = detailPanel.generateDetailRecords(orders, []);
      
      expect(records).toHaveLength(2);
      // 有效时间的记录应该排在前面
      expect(records[0].orderId).toBe('order2');
      expect(records[1].orderId).toBe('order1');
    });
  });

  describe('calculateSummary', () => {
    it('should calculate summary correctly', () => {
      const records = [
        { type: 'order', amount: 1000 },
        { type: 'order', amount: 2000 },
        { type: 'chargeback', amount: -500 },
        { type: 'chargeback', amount: -300 }
      ];

      const summary = detailPanel.calculateSummary(records);

      expect(summary).toEqual({
        orderTotal: 3000,
        chargebackTotal: -800,
        netTotal: 2200
      });
    });

    it('should handle empty records array', () => {
      const summary = detailPanel.calculateSummary([]);

      expect(summary).toEqual({
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      });
    });

    it('should handle null/undefined input', () => {
      const summary1 = detailPanel.calculateSummary(null);
      const summary2 = detailPanel.calculateSummary(undefined);

      expect(summary1).toEqual({
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      });

      expect(summary2).toEqual({
        orderTotal: 0,
        chargebackTotal: 0,
        netTotal: 0
      });
    });

    it('should handle invalid record data', () => {
      const records = [
        null,
        undefined,
        { type: 'order' }, // 缺少amount
        { type: 'order', amount: 'invalid' }, // 无效amount
        { type: 'order', amount: NaN }, // NaN amount
        { type: 'order', amount: 1000 }, // 正常记录
        { type: 'chargeback', amount: -500 }, // 正常冲账
        { type: 'unknown', amount: 100 } // 未知类型
      ];

      const summary = detailPanel.calculateSummary(records);

      expect(summary).toEqual({
        orderTotal: 1000,
        chargebackTotal: -500,
        netTotal: 500
      });
    });

    it('should only count order and chargeback types', () => {
      const records = [
        { type: 'order', amount: 1000 },
        { type: 'chargeback', amount: -500 },
        { type: 'unknown', amount: 200 },
        { type: 'other', amount: 300 }
      ];

      const summary = detailPanel.calculateSummary(records);

      expect(summary).toEqual({
        orderTotal: 1000,
        chargebackTotal: -500,
        netTotal: 500
      });
    });
  });
});