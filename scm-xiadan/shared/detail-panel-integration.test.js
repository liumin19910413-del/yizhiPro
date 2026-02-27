/**
 * 明细对账面板集成测试（Detail Panel Integration Tests）
 * 
 * Feature: financial-reconciliation-refactor
 * 测试DetailPanel与其他模块的集成
 */

const { DetailPanel } = require('./detail-panel');
const { AmountFormatter } = require('./amount-formatter');

describe('DetailPanel Integration', () => {
  let detailPanel;

  beforeEach(() => {
    detailPanel = new DetailPanel();
  });

  it('should work with AmountFormatter for display', () => {
    const orders = [
      {
        id: 'order1',
        orderNo: 'ORD001',
        amount: 1234.56,
        deliverTime: '2024-01-15T10:00:00Z'
      }
    ];

    const chargebacks = [
      {
        subOrderId: 'order1',
        originalOrderNo: 'ORD001',
        refundAmount: 567.89,
        refundTime: '2024-01-17T10:00:00Z',
        reason: '质量问题'
      }
    ];

    const records = detailPanel.generateDetailRecords(orders, chargebacks);
    const summary = detailPanel.calculateSummary(records);

    // 测试金额格式化
    expect(AmountFormatter.format(summary.orderTotal)).toBe('¥1,234.56');
    expect(AmountFormatter.format(summary.chargebackTotal)).toBe('-¥567.89');
    expect(AmountFormatter.format(summary.netTotal)).toBe('¥666.67');

    // 测试红色格式化（用于冲账）
    expect(AmountFormatter.formatRed(summary.chargebackTotal)).toBe('<span style="color: #e74c3c;">-¥567.89</span>');
  });

  it('should generate complete detail records with all required fields', () => {
    const orders = [
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
        refundAmount: 300,
        refundTime: '2024-01-17T10:00:00Z',
        reason: '质量问题'
      }
    ];

    const records = detailPanel.generateDetailRecords(orders, chargebacks);

    // 验证订单记录结构
    const orderRecord = records.find(r => r.type === 'order');
    expect(orderRecord).toMatchObject({
      type: 'order',
      typeLabel: '🟢订单',
      orderId: 'order1',
      orderNo: 'ORD001',
      amount: 1000,
      deliverTime: '2024-01-15T10:00:00Z',
      backgroundColor: '#ffffff'
    });

    // 验证冲账记录结构
    const chargebackRecord = records.find(r => r.type === 'chargeback');
    expect(chargebackRecord).toMatchObject({
      type: 'chargeback',
      typeLabel: '🔴冲账',
      orderId: 'order1',
      orderNo: 'ORD001',
      amount: -300,
      refundTime: '2024-01-17T10:00:00Z',
      refundReason: '质量问题',
      backgroundColor: '#ffebee'
    });

    // 验证统计数据
    const summary = detailPanel.calculateSummary(records);
    expect(summary).toEqual({
      orderTotal: 1000,
      chargebackTotal: -300,
      netTotal: 700
    });
  });

  it('should handle complex scenarios with multiple orders and chargebacks', () => {
    const orders = [
      { id: 'order1', orderNo: 'ORD001', amount: 1000, deliverTime: '2024-01-15T10:00:00Z' },
      { id: 'order2', orderNo: 'ORD002', amount: 2000, deliverTime: '2024-01-16T10:00:00Z' },
      { id: 'order3', orderNo: 'ORD003', amount: 1500, deliverTime: '2024-01-17T10:00:00Z' }
    ];

    const chargebacks = [
      { subOrderId: 'order1', originalOrderNo: 'ORD001', refundAmount: 300, refundTime: '2024-01-18T10:00:00Z', reason: '质量问题' },
      { subOrderId: 'order2', originalOrderNo: 'ORD002', refundAmount: 500, refundTime: '2024-01-19T10:00:00Z', reason: '尺寸不符' }
    ];

    const records = detailPanel.generateDetailRecords(orders, chargebacks);
    const summary = detailPanel.calculateSummary(records);

    expect(records).toHaveLength(5); // 3个订单 + 2个冲账
    expect(summary).toEqual({
      orderTotal: 4500,
      chargebackTotal: -800,
      netTotal: 3700
    });

    // 验证时间排序
    const times = records.map(r => r.deliverTime || r.refundTime);
    const sortedTimes = [...times].sort((a, b) => new Date(a) - new Date(b));
    expect(times).toEqual(sortedTimes);
  });
});