/**
 * 经销商对账测试（Distributor Reconciliation Tests）
 * 
 * Feature: financial-reconciliation-refactor
 * 测试经销商对账的业务逻辑
 */

const { DistributorReconciliation } = require('./distributor-reconciliation.js');
const { SettlementCalculator } = require('./settlement-calculator.js');
const { PaymentStatusCalculator } = require('./payment-status-calculator.js');

describe('DistributorReconciliation', () => {
  let calculator;
  let distributorReconciliation;
  let settlementDate;

  beforeEach(() => {
    settlementDate = new Date('2026-04-15');
    calculator = new SettlementCalculator(settlementDate);
    distributorReconciliation = new DistributorReconciliation(calculator);
  });

  describe('constructor', () => {
    test('should create instance with valid calculator', () => {
      expect(distributorReconciliation).toBeInstanceOf(DistributorReconciliation);
      expect(distributorReconciliation.calculator).toBe(calculator);
    });

    test('should throw error without calculator', () => {
      expect(() => new DistributorReconciliation()).toThrow('SettlementCalculator is required');
    });
  });

  describe('groupByDistributor', () => {
    test('should group orders by distributorId', () => {
      const orders = [
        { id: 'O1', distributorId: 'D1', distributorName: '经销商A' },
        { id: 'O2', distributorId: 'D2', distributorName: '经销商B' },
        { id: 'O3', distributorId: 'D1', distributorName: '经销商A' },
        { id: 'O4', distributorId: 'D3', distributorName: '经销商C' }
      ];

      const result = distributorReconciliation.groupByDistributor(orders);

      expect(Object.keys(result)).toEqual(['D1', 'D2', 'D3']);
      expect(result['D1']).toHaveLength(2);
      expect(result['D2']).toHaveLength(1);
      expect(result['D3']).toHaveLength(1);
      expect(result['D1'].map(o => o.id)).toEqual(['O1', 'O3']);
    });

    test('should skip orders without distributorId', () => {
      const orders = [
        { id: 'O1', distributorId: 'D1', distributorName: '经销商A' },
        { id: 'O2', distributorName: '经销商B' }, // 缺少distributorId
        { id: 'O3', distributorId: null, distributorName: '经销商C' }, // distributorId为null
        { id: 'O4', distributorId: 'D1', distributorName: '经销商A' }
      ];

      const result = distributorReconciliation.groupByDistributor(orders);

      expect(Object.keys(result)).toEqual(['D1']);
      expect(result['D1']).toHaveLength(2);
      expect(result['D1'].map(o => o.id)).toEqual(['O1', 'O4']);
    });

    test('should handle empty array', () => {
      const result = distributorReconciliation.groupByDistributor([]);
      expect(result).toEqual({});
    });

    test('should handle invalid input', () => {
      expect(distributorReconciliation.groupByDistributor(null)).toEqual({});
      expect(distributorReconciliation.groupByDistributor(undefined)).toEqual({});
      expect(distributorReconciliation.groupByDistributor('invalid')).toEqual({});
    });
  });

  describe('filterDistributorAfterSales', () => {
    test('should filter after sales by sub order IDs', () => {
      const subOrders = [
        { id: 'SO1', orderId: 'O1' },
        { id: 'SO2', orderId: 'O2' },
        { id: 'SO3', orderId: 'O3' }
      ];

      const afterSales = [
        { id: 'AS1', subOrderId: 'SO1', refundAmount: 100 },
        { id: 'AS2', subOrderId: 'SO4', refundAmount: 200 }, // 不属于该经销商
        { id: 'AS3', subOrderId: 'SO2', refundAmount: 150 },
        { id: 'AS4', subOrderId: 'SO5', refundAmount: 300 }  // 不属于该经销商
      ];

      const result = distributorReconciliation.filterDistributorAfterSales(afterSales, subOrders);

      expect(result).toHaveLength(2);
      expect(result.map(as => as.id)).toEqual(['AS1', 'AS3']);
    });

    test('should handle orderId fallback', () => {
      const subOrders = [
        { id: 'SO1', orderId: 'O1' }
      ];

      const afterSales = [
        { id: 'AS1', orderId: 'SO1', refundAmount: 100 }, // 使用orderId而不是subOrderId
      ];

      const result = distributorReconciliation.filterDistributorAfterSales(afterSales, subOrders);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('AS1');
    });

    test('should handle empty arrays', () => {
      const result = distributorReconciliation.filterDistributorAfterSales([], []);
      expect(result).toEqual([]);
    });

    test('should handle invalid input', () => {
      expect(distributorReconciliation.filterDistributorAfterSales(null, [])).toEqual([]);
      expect(distributorReconciliation.filterDistributorAfterSales([], null)).toEqual([]);
    });
  });

  describe('extractDistributorAmount', () => {
    test('should extract from clearing.distributorAmount', () => {
      const subOrder = {
        id: 'SO1',
        clearing: {
          distributorAmount: 200
        }
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(200);
    });

    test('should extract from items clearing data', () => {
      const subOrder = {
        id: 'SO1',
        items: [
          { clearing: { distributorAmount: 100 } },
          { clearing: { distributorAmount: 150 } },
          { clearing: { distributorAmount: 50 } }
        ]
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(300);
    });

    test('should calculate from platformAmount (20%)', () => {
      const subOrder = {
        id: 'SO1',
        platformAmount: 1000
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(200); // 1000 * 0.2
    });

    test('should estimate from totalAmount', () => {
      const subOrder = {
        id: 'SO1',
        totalAmount: 1000
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(140); // 1000 * 0.7 * 0.2
    });

    test('should use amount as fallback for totalAmount', () => {
      const subOrder = {
        id: 'SO1',
        amount: 1000
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(140); // 1000 * 0.7 * 0.2
    });

    test('should return 0 for invalid input', () => {
      expect(distributorReconciliation.extractDistributorAmount(null)).toBe(0);
      expect(distributorReconciliation.extractDistributorAmount(undefined)).toBe(0);
      expect(distributorReconciliation.extractDistributorAmount({})).toBe(0);
    });

    test('should prioritize clearing.distributorAmount over other methods', () => {
      const subOrder = {
        id: 'SO1',
        clearing: {
          distributorAmount: 200
        },
        platformAmount: 1000, // 这个会被忽略
        totalAmount: 2000     // 这个也会被忽略
      };

      const result = distributorReconciliation.extractDistributorAmount(subOrder);
      expect(result).toBe(200);
    });
  });

  describe('generateSummary', () => {
    test('should generate summary for multiple distributors', () => {
      const orders = [
        { id: 'O1', distributorId: 'D1', distributorName: '经销商A' },
        { id: 'O2', distributorId: 'D2', distributorName: '经销商B' }
      ];

      const subOrders = [
        {
          id: 'SO1',
          orderId: 'O1',
          deliverTime: '2026-03-01T10:00:00Z', // 更早的日期，确保满足T+30条件
          clearing: { distributorAmount: 200 }
        },
        {
          id: 'SO2',
          orderId: 'O2',
          deliverTime: '2026-03-02T10:00:00Z', // 更早的日期，确保满足T+30条件
          clearing: { distributorAmount: 300 }
        }
      ];

      const afterSales = [
        {
          id: 'AS1',
          subOrderId: 'SO1',
          refundTime: '2026-04-10T10:00:00Z',
          platformAmount: 500,
          refundAmount: 500
        }
      ];

      const result = distributorReconciliation.generateSummary(orders, subOrders, afterSales);

      expect(result).toHaveLength(2);
      
      // 检查经销商A的数据
      const distributorA = result.find(r => r.distributorId === 'D1');
      expect(distributorA).toBeDefined();
      expect(distributorA.distributorName).toBe('经销商A');
      expect(distributorA.settlementMonth).toBe('2026年04月');
      expect(distributorA.orderCount).toBe(1);
      expect(distributorA.normalAmount).toBe(200); // 第一期90% + 第二期10%
      expect(distributorA.chargebackAmount).toBe(-100); // -500 * 0.2
      expect(distributorA.netAmount).toBe(100); // 200 + (-100)
      expect(distributorA.paymentStatus).toBe('未付款');

      // 检查经销商B的数据
      const distributorB = result.find(r => r.distributorId === 'D2');
      expect(distributorB).toBeDefined();
      expect(distributorB.distributorName).toBe('经销商B');
      expect(distributorB.normalAmount).toBe(300);
      expect(distributorB.chargebackAmount).toBeCloseTo(0); // 没有售后，使用toBeCloseTo处理-0
      expect(distributorB.netAmount).toBe(300);
    });

    test('should handle empty input arrays', () => {
      const result = distributorReconciliation.generateSummary([], [], []);
      expect(result).toEqual([]);
    });

    test('should handle invalid input', () => {
      const result = distributorReconciliation.generateSummary(null, undefined, 'invalid');
      expect(result).toEqual([]);
    });

    test('should skip orders without distributorId', () => {
      const orders = [
        { id: 'O1', distributorName: '经销商A' }, // 缺少distributorId
        { id: 'O2', distributorId: 'D2', distributorName: '经销商B' }
      ];

      const subOrders = [
        {
          id: 'SO2',
          orderId: 'O2',
          deliverTime: '2026-04-01T10:00:00Z',
          clearing: { distributorAmount: 300 }
        }
      ];

      const result = distributorReconciliation.generateSummary(orders, subOrders, []);

      expect(result).toHaveLength(1);
      expect(result[0].distributorId).toBe('D2');
    });

    test('should use default distributor name when missing', () => {
      const orders = [
        { id: 'O1', distributorId: 'D1' } // 缺少distributorName
      ];

      const subOrders = [
        {
          id: 'SO1',
          orderId: 'O1',
          deliverTime: '2026-04-01T10:00:00Z',
          clearing: { distributorAmount: 200 }
        }
      ];

      const result = distributorReconciliation.generateSummary(orders, subOrders, []);

      expect(result).toHaveLength(1);
      expect(result[0].distributorName).toBe('经销商D1');
    });
  });
});