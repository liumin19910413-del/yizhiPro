/**
 * 连锁总部对账测试
 * 
 * Feature: financial-reconciliation-refactor
 * 测试连锁总部对账的业务逻辑
 */

// 导入依赖模块
const { HeadquarterReconciliation } = require('./headquarter-reconciliation.js');
const { SettlementCalculator } = require('./settlement-calculator.js');
const { PaymentStatusCalculator } = require('./payment-status-calculator.js');

// 模拟品牌配置
global.BRAND_CONFIG = {
  '伊智美妆': {
    brandName: '伊智美妆',
    headquarterShareRate: 0.10,
    createTime: '2026-01-01'
  },
  '_default': {
    brandName: '默认',
    headquarterShareRate: 0,
    createTime: '2026-01-01'
  }
};

// 模拟门店数据
global.TEST_STORES = {
  'STORE001': {
    id: 'STORE001',
    name: '北京旗舰店',
    brandName: '伊智美妆',
    isChain: true,
    headquarterShareRate: 0.10
  },
  'STORE002': {
    id: 'STORE002',
    name: '上海旗舰店',
    brandName: '伊智美妆',
    isChain: true,
    headquarterShareRate: 0.10
  },
  'STORE003': {
    id: 'STORE003',
    name: '独立门店',
    brandName: '默认',
    isChain: false,
    headquarterShareRate: 0
  }
};

// 模拟DB
global.DB = {
  stores: global.TEST_STORES,
  orders: []
};

describe('HeadquarterReconciliation', () => {
  let calculator;
  let reconciliation;
  let settlementDate;

  beforeEach(() => {
    settlementDate = new Date('2026-04-15');
    calculator = new SettlementCalculator(settlementDate);
    reconciliation = new HeadquarterReconciliation(calculator);
  });

  describe('constructor', () => {
    test('should create instance with valid calculator', () => {
      expect(reconciliation).toBeInstanceOf(HeadquarterReconciliation);
      expect(reconciliation.calculator).toBe(calculator);
    });

    test('should throw error without calculator', () => {
      expect(() => new HeadquarterReconciliation()).toThrow('SettlementCalculator is required');
    });
  });

  describe('groupByBrand', () => {
    test('should group orders by brand name', () => {
      const orders = [
        { id: 'O001', storeId: 'STORE001', brandName: '伊智美妆' },
        { id: 'O002', storeId: 'STORE002', brandName: '伊智美妆' },
        { id: 'O003', storeId: 'STORE003', brandName: '默认' }
      ];

      const groups = reconciliation.groupByBrand(orders);

      expect(groups).toHaveProperty('伊智美妆');
      expect(groups['伊智美妆']).toHaveLength(2);
      expect(groups['伊智美妆'][0].id).toBe('O001');
      expect(groups['伊智美妆'][1].id).toBe('O002');
      
      // 默认品牌应该被跳过
      expect(groups).not.toHaveProperty('默认');
    });

    test('should get brand name from store info when not in order', () => {
      const orders = [
        { id: 'O001', storeId: 'STORE001' }, // 没有brandName，从门店获取
        { id: 'O002', storeId: 'STORE002' }
      ];

      const groups = reconciliation.groupByBrand(orders);

      expect(groups).toHaveProperty('伊智美妆');
      expect(groups['伊智美妆']).toHaveLength(2);
    });

    test('should handle empty orders array', () => {
      const groups = reconciliation.groupByBrand([]);
      expect(groups).toEqual({});
    });

    test('should handle invalid input', () => {
      const groups = reconciliation.groupByBrand(null);
      expect(groups).toEqual({});
    });

    test('should skip orders without brand info', () => {
      const orders = [
        { id: 'O001', storeId: 'STORE999' }, // 不存在的门店
        { id: 'O002' } // 没有门店信息
      ];

      const groups = reconciliation.groupByBrand(orders);
      expect(groups).toEqual({});
    });
  });

  describe('filterBrandAfterSales', () => {
    test('should filter after sales by sub order IDs', () => {
      const subOrders = [
        { id: 'SO001' },
        { id: 'SO002' }
      ];

      const afterSales = [
        { id: 'AS001', subOrderId: 'SO001', refundAmount: 100 },
        { id: 'AS002', subOrderId: 'SO002', refundAmount: 200 },
        { id: 'AS003', subOrderId: 'SO999', refundAmount: 300 } // 不匹配
      ];

      const filtered = reconciliation.filterBrandAfterSales(afterSales, subOrders);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('AS001');
      expect(filtered[1].id).toBe('AS002');
    });

    test('should handle empty arrays', () => {
      const filtered = reconciliation.filterBrandAfterSales([], []);
      expect(filtered).toEqual([]);
    });

    test('should handle invalid input', () => {
      const filtered = reconciliation.filterBrandAfterSales(null, null);
      expect(filtered).toEqual([]);
    });
  });

  describe('getBrandNameFromOrder', () => {
    test('should get brand name directly from order', () => {
      const order = { brandName: '伊智美妆' };
      const brandName = reconciliation.getBrandNameFromOrder(order);
      expect(brandName).toBe('伊智美妆');
    });

    test('should get brand name from store info', () => {
      const order = { storeId: 'STORE001' };
      const brandName = reconciliation.getBrandNameFromOrder(order);
      expect(brandName).toBe('伊智美妆');
    });

    test('should return null for unknown store', () => {
      const order = { storeId: 'STORE999' };
      const brandName = reconciliation.getBrandNameFromOrder(order);
      expect(brandName).toBeNull();
    });

    test('should return null for order without brand info', () => {
      const order = { id: 'O001' };
      const brandName = reconciliation.getBrandNameFromOrder(order);
      expect(brandName).toBeNull();
    });
  });

  describe('extractHeadquarterAmount', () => {
    test('should extract from clearing data', () => {
      const subOrder = {
        clearing: {
          headquarterAmount: 50
        }
      };

      const amount = reconciliation.extractHeadquarterAmount(subOrder);
      expect(amount).toBe(50);
    });

    test('should sum from items clearing data', () => {
      const subOrder = {
        items: [
          { clearing: { headquarterAmount: 20 } },
          { clearing: { headquarterAmount: 30 } }
        ]
      };

      const amount = reconciliation.extractHeadquarterAmount(subOrder);
      expect(amount).toBe(50);
    });

    test('should calculate from merchant profit', () => {
      const subOrder = {
        platformAmount: 700,
        supplierAmount: 500,
        parentOrderId: 'O001'
      };

      // 模拟父订单
      global.DB.orders = [
        { id: 'O001', storeId: 'STORE001', brandName: '伊智美妆' }
      ];

      const amount = reconciliation.extractHeadquarterAmount(subOrder);
      // 商家毛利 = 700 - 500 = 200
      // 连锁总部分成 = 200 * 0.10 = 20
      expect(amount).toBe(20);
    });

    test('should return 0 for invalid input', () => {
      const amount = reconciliation.extractHeadquarterAmount(null);
      expect(amount).toBe(0);
    });
  });

  describe('calculateMerchantProfit', () => {
    test('should get from clearing data', () => {
      const order = {
        clearing: {
          merchantProfit: 200
        }
      };

      const profit = reconciliation.calculateMerchantProfit(order);
      expect(profit).toBe(200);
    });

    test('should calculate from platform and supplier amounts', () => {
      const order = {
        platformAmount: 700,
        supplierAmount: 500
      };

      const profit = reconciliation.calculateMerchantProfit(order);
      expect(profit).toBe(200);
    });

    test('should estimate from total amount', () => {
      const order = {
        amount: 1000
      };

      const profit = reconciliation.calculateMerchantProfit(order);
      // 估算：1000 * 0.2 = 200
      expect(profit).toBe(200);
    });

    test('should return 0 for invalid input', () => {
      const profit = reconciliation.calculateMerchantProfit(null);
      expect(profit).toBe(0);
    });
  });

  describe('getHeadquarterShareRate', () => {
    test('should get rate from brand config', () => {
      const rate = reconciliation.getHeadquarterShareRate('伊智美妆');
      expect(rate).toBe(0.10);
    });

    test('should return default rate for unknown brand', () => {
      const rate = reconciliation.getHeadquarterShareRate('未知品牌');
      expect(rate).toBe(0);
    });

    test('should return 0 for null brand', () => {
      const rate = reconciliation.getHeadquarterShareRate(null);
      expect(rate).toBe(0);
    });
  });

  describe('generateMonthlySummary', () => {
    test('should generate summary for brand orders', () => {
      const orders = [
        { 
          id: 'O001', 
          storeId: 'STORE001', 
          brandName: '伊智美妆',
          createTime: '2026-04-01T00:00:00Z'
        },
        { 
          id: 'O002', 
          storeId: 'STORE002', 
          brandName: '伊智美妆',
          createTime: '2026-04-02T00:00:00Z'
        }
      ];

      const subOrders = [
        {
          id: 'SO001',
          parentOrderId: 'O001',
          deliverTime: '2026-04-01T00:00:00Z',
          clearing: { headquarterAmount: 50 }
        },
        {
          id: 'SO002',
          parentOrderId: 'O002',
          deliverTime: '2026-04-02T00:00:00Z',
          clearing: { headquarterAmount: 30 }
        }
      ];

      const afterSales = [
        {
          id: 'AS001',
          subOrderId: 'SO001',
          refundTime: '2026-04-10T00:00:00Z',
          platformAmount: 700,
          supplierAmount: 500
        }
      ];

      const summaries = reconciliation.generateMonthlySummary(orders, subOrders, afterSales);

      expect(summaries).toHaveLength(1);
      expect(summaries[0].brandName).toBe('伊智美妆');
      expect(summaries[0].settlementMonth).toBe('2026年04月');
      expect(summaries[0].orderCount).toBe(2);
      expect(summaries[0].normalAmount).toBeGreaterThan(0);
      expect(summaries[0].chargebackAmount).toBeLessThan(0);
      expect(summaries[0].paymentStatus).toBe('未付款');
    });

    test('should handle empty input arrays', () => {
      const summaries = reconciliation.generateMonthlySummary([], [], []);
      expect(summaries).toEqual([]);
    });

    test('should skip orders without brand info', () => {
      const orders = [
        { id: 'O001', storeId: 'STORE003', brandName: '默认' } // 单店，应该被跳过
      ];

      const summaries = reconciliation.generateMonthlySummary(orders, [], []);
      expect(summaries).toEqual([]);
    });
  });
});