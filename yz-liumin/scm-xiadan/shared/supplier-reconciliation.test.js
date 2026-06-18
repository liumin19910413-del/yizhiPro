/**
 * 供应商对账测试（Supplier Reconciliation Tests）
 * 
 * Feature: financial-reconciliation-refactor
 * 测试供应商对账类的各项功能
 */

// 导入测试依赖
const { SupplierReconciliation } = require('./supplier-reconciliation.js');
const { SettlementCalculator } = require('./settlement-calculator.js');
const { PaymentStatusCalculator } = require('./payment-status-calculator.js');

// 测试数据
const testData = {
  // 测试子订单数据
  subOrders: [
    {
      id: 'sub1',
      orderId: 'order1',
      supplierId: 'supplier1',
      supplierName: '供应商A',
      supplierAmount: 1000,
      shippingFee: 50,
      deliverTime: '2024-01-01T00:00:00Z'
    },
    {
      id: 'sub2',
      orderId: 'order2',
      supplierId: 'supplier1',
      supplierName: '供应商A',
      supplierAmount: 2000,
      shippingFee: 100,
      deliverTime: '2024-01-05T00:00:00Z'
    },
    {
      id: 'sub3',
      orderId: 'order3',
      supplierId: 'supplier2',
      supplierName: '供应商B',
      supplierAmount: 1500,
      shippingFee: 75,
      deliverTime: '2024-01-10T00:00:00Z'
    }
  ],

  // 测试售后数据
  afterSales: [
    {
      id: 'as1',
      subOrderId: 'sub1',
      refundAmount: 500,
      refundTime: '2024-01-15T00:00:00Z',
      reason: '质量问题'
    },
    {
      id: 'as2',
      subOrderId: 'sub3',
      refundAmount: 300,
      refundTime: '2024-01-20T00:00:00Z',
      reason: '尺寸不合适'
    }
  ]
};

// 单元测试
describe('SupplierReconciliation', () => {
  let calculator;
  let supplierReconciliation;

  beforeEach(() => {
    // 设置结算日期为2024年2月1日
    const settlementDate = new Date('2024-02-01T00:00:00Z');
    calculator = new SettlementCalculator(settlementDate);
    supplierReconciliation = new SupplierReconciliation(calculator);
  });

  describe('constructor', () => {
    it('should create instance with valid calculator', () => {
      expect(supplierReconciliation).toBeDefined();
      expect(supplierReconciliation.calculator).toBe(calculator);
    });

    it('should throw error without calculator', () => {
      expect(() => new SupplierReconciliation()).toThrow('SettlementCalculator is required');
    });
  });

  describe('groupBySupplier', () => {
    it('should group orders by supplier ID', () => {
      const groups = supplierReconciliation.groupBySupplier(testData.subOrders);
      
      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['supplier1']).toHaveLength(2);
      expect(groups['supplier2']).toHaveLength(1);
      
      expect(groups['supplier1'][0].id).toBe('sub1');
      expect(groups['supplier1'][1].id).toBe('sub2');
      expect(groups['supplier2'][0].id).toBe('sub3');
    });

    it('should handle empty array', () => {
      const groups = supplierReconciliation.groupBySupplier([]);
      expect(groups).toEqual({});
    });

    it('should handle null/undefined input', () => {
      expect(supplierReconciliation.groupBySupplier(null)).toEqual({});
      expect(supplierReconciliation.groupBySupplier(undefined)).toEqual({});
    });

    it('should skip orders without supplier ID', () => {
      const ordersWithMissing = [
        { id: 'sub1', supplierId: 'supplier1', supplierName: '供应商A' },
        { id: 'sub2' }, // 缺少 supplierId
        { id: 'sub3', supplierId: 'supplier2', supplierName: '供应商B' }
      ];

      const groups = supplierReconciliation.groupBySupplier(ordersWithMissing);
      
      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['supplier1']).toHaveLength(1);
      expect(groups['supplier2']).toHaveLength(1);
    });
  });

  describe('filterSupplierAfterSales', () => {
    it('should filter after sales for specific supplier orders', () => {
      const supplier1Orders = testData.subOrders.filter(o => o.supplierId === 'supplier1');
      const filtered = supplierReconciliation.filterSupplierAfterSales(
        testData.afterSales,
        supplier1Orders
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('as1');
      expect(filtered[0].subOrderId).toBe('sub1');
    });

    it('should return empty array for supplier with no after sales', () => {
      const supplier2Orders = testData.subOrders.filter(o => o.supplierId === 'supplier2');
      const filtered = supplierReconciliation.filterSupplierAfterSales(
        [testData.afterSales[0]], // 只包含supplier1的售后
        supplier2Orders
      );

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty arrays', () => {
      expect(supplierReconciliation.filterSupplierAfterSales([], [])).toEqual([]);
      expect(supplierReconciliation.filterSupplierAfterSales(testData.afterSales, [])).toEqual([]);
      expect(supplierReconciliation.filterSupplierAfterSales([], testData.subOrders)).toEqual([]);
    });

    it('should handle null/undefined inputs', () => {
      expect(supplierReconciliation.filterSupplierAfterSales(null, testData.subOrders)).toEqual([]);
      expect(supplierReconciliation.filterSupplierAfterSales(testData.afterSales, null)).toEqual([]);
    });
  });

  describe('generateMonthlySummary', () => {
    it('should generate monthly summary for all suppliers', () => {
      const summaries = supplierReconciliation.generateMonthlySummary(
        [], // orders 参数暂时不使用
        testData.subOrders,
        testData.afterSales
      );

      expect(summaries).toHaveLength(2);

      // 检查供应商1的汇总
      const supplier1Summary = summaries.find(s => s.supplierId === 'supplier1');
      expect(supplier1Summary).toBeDefined();
      expect(supplier1Summary.supplierName).toBe('供应商A');
      expect(supplier1Summary.settlementMonth).toBe('2024年02月');
      expect(supplier1Summary.orderCount).toBe(2);
      expect(supplier1Summary.normalAmount).toBeGreaterThan(0);
      expect(supplier1Summary.chargebackAmount).toBeLessThan(0); // 应该是负数
      expect(supplier1Summary.netAmount).toBe(supplier1Summary.normalAmount + supplier1Summary.chargebackAmount);
      expect(supplier1Summary.paidAmount).toBe(0);
      expect(supplier1Summary.paymentStatus).toBe('未付款');

      // 检查供应商2的汇总
      const supplier2Summary = summaries.find(s => s.supplierId === 'supplier2');
      expect(supplier2Summary).toBeDefined();
      expect(supplier2Summary.supplierName).toBe('供应商B');
      expect(supplier2Summary.orderCount).toBe(1);
    });

    it('should handle empty inputs', () => {
      const summaries = supplierReconciliation.generateMonthlySummary([], [], []);
      expect(summaries).toEqual([]);
    });

    it('should handle null/undefined inputs', () => {
      const summaries = supplierReconciliation.generateMonthlySummary(null, null, null);
      expect(summaries).toEqual([]);
    });

    it('should calculate supplier amount correctly (supplierAmount + shippingFee)', () => {
      // 创建一个简单的测试用例
      const simpleSubOrders = [{
        id: 'sub1',
        supplierId: 'supplier1',
        supplierName: '测试供应商',
        supplierAmount: 1000,
        shippingFee: 100,
        deliverTime: '2024-01-01T00:00:00Z'
      }];

      const summaries = supplierReconciliation.generateMonthlySummary([], simpleSubOrders, []);
      
      expect(summaries).toHaveLength(1);
      const summary = summaries[0];
      
      // 应结金额应该是 (1000 + 100) * 0.9 + (1000 + 100) * 0.1 = 1100
      expect(summary.normalAmount).toBe(1100);
    });

    it('should handle missing shippingFee', () => {
      const ordersWithoutShipping = [{
        id: 'sub1',
        supplierId: 'supplier1',
        supplierName: '测试供应商',
        supplierAmount: 1000,
        // 缺少 shippingFee
        deliverTime: '2024-01-01T00:00:00Z'
      }];

      const summaries = supplierReconciliation.generateMonthlySummary([], ordersWithoutShipping, []);
      
      expect(summaries).toHaveLength(1);
      const summary = summaries[0];
      
      // 应结金额应该是 1000 * 0.9 + 1000 * 0.1 = 1000
      expect(summary.normalAmount).toBe(1000);
    });

    it('should use default supplier name when missing', () => {
      const ordersWithoutName = [{
        id: 'sub1',
        supplierId: 'supplier1',
        // 缺少 supplierName
        supplierAmount: 1000,
        deliverTime: '2024-01-01T00:00:00Z'
      }];

      const summaries = supplierReconciliation.generateMonthlySummary([], ordersWithoutName, []);
      
      expect(summaries).toHaveLength(1);
      expect(summaries[0].supplierName).toBe('供应商supplier1');
    });
  });
});

// 运行测试的辅助函数
function runTests() {
  console.log('Running SupplierReconciliation tests...');
  
  // 这里可以添加简单的测试运行逻辑
  // 在实际环境中，应该使用 Jest 或其他测试框架
  
  console.log('SupplierReconciliation tests completed.');
}

// 如果直接运行此文件，执行测试
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}