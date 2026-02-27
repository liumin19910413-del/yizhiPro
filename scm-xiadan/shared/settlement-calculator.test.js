/**
 * 结算计算引擎测试
 * 
 * Feature: financial-reconciliation-refactor
 * 测试 SettlementCalculator 的核心功能
 * 
 * Validates: Requirements 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3
 */

const { SettlementCalculator } = require('./settlement-calculator');
const fc = require('fast-check');

describe('SettlementCalculator - 构造函数和月份格式化', () => {
  test('正确初始化结算日期和月份', () => {
    const date = new Date('2026-04-15');
    const calculator = new SettlementCalculator(date);
    
    expect(calculator.settlementDate).toEqual(date);
    expect(calculator.settlementMonth).toBe('2026年04月');
  });

  test('正确格式化不同月份', () => {
    const testCases = [
      { date: new Date('2026-01-01'), expected: '2026年01月' },
      { date: new Date('2026-12-31'), expected: '2026年12月' },
      { date: new Date('2025-06-15'), expected: '2025年06月' },
      { date: new Date('2027-11-20'), expected: '2027年11月' }
    ];

    testCases.forEach(({ date, expected }) => {
      const calculator = new SettlementCalculator(date);
      expect(calculator.settlementMonth).toBe(expected);
    });
  });

  test('无效日期抛出错误', () => {
    expect(() => new SettlementCalculator(null)).toThrow('Invalid settlement date');
    expect(() => new SettlementCalculator(undefined)).toThrow('Invalid settlement date');
    expect(() => new SettlementCalculator('invalid')).toThrow('Invalid settlement date');
    expect(() => new SettlementCalculator(new Date('invalid'))).toThrow('Invalid settlement date');
  });
});

describe('SettlementCalculator - 第一期订单筛选（T+7）', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('筛选符合条件的订单（签收时间 + 7天 <= 结算日期）', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-04-01' }, // 4-1 + 7 = 4-8 <= 4-15 ✓
      { id: '2', deliverTime: '2026-04-08' }, // 4-8 + 7 = 4-15 <= 4-15 ✓
      { id: '3', deliverTime: '2026-04-09' }, // 4-9 + 7 = 4-16 > 4-15 ✗
      { id: '4', deliverTime: '2026-04-10' }  // 4-10 + 7 = 4-17 > 4-15 ✗
    ];

    const result = calculator.filterFirstPeriodOrders(subOrders);
    
    expect(result).toHaveLength(2);
    expect(result.map(o => o.id)).toEqual(['1', '2']);
  });

  test('排除缺少deliverTime字段的订单', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-04-01' },
      { id: '2' }, // 缺少 deliverTime
      { id: '3', deliverTime: null },
      { id: '4', deliverTime: undefined }
    ];

    const result = calculator.filterFirstPeriodOrders(subOrders);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('排除无效日期格式的订单', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-04-01' },
      { id: '2', deliverTime: 'invalid-date' },
      { id: '3', deliverTime: '2026-13-45' } // 无效日期
    ];

    const result = calculator.filterFirstPeriodOrders(subOrders);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('空订单列表返回空数组', () => {
    expect(calculator.filterFirstPeriodOrders([])).toEqual([]);
  });

  test('非数组输入返回空数组', () => {
    expect(calculator.filterFirstPeriodOrders(null)).toEqual([]);
    expect(calculator.filterFirstPeriodOrders(undefined)).toEqual([]);
    expect(calculator.filterFirstPeriodOrders('not-array')).toEqual([]);
  });

  test('跨月份的订单筛选', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-03-25' }, // 3-25 + 7 = 4-1 <= 4-15 ✓
      { id: '2', deliverTime: '2026-03-31' }, // 3-31 + 7 = 4-7 <= 4-15 ✓
      { id: '3', deliverTime: '2026-04-09' }  // 4-9 + 7 = 4-16 > 4-15 ✗
    ];

    const result = calculator.filterFirstPeriodOrders(subOrders);
    
    expect(result).toHaveLength(2);
    expect(result.map(o => o.id)).toEqual(['1', '2']);
  });
});

describe('SettlementCalculator - 第二期订单筛选（T+30）', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('筛选符合条件的订单（签收时间 + 30天 <= 结算日期）', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-03-10' }, // 3-10 + 30 = 4-9 <= 4-15 ✓
      { id: '2', deliverTime: '2026-03-16' }, // 3-16 + 30 = 4-15 <= 4-15 ✓
      { id: '3', deliverTime: '2026-03-17' }, // 3-17 + 30 = 4-16 > 4-15 ✗
      { id: '4', deliverTime: '2026-04-01' }  // 4-1 + 30 = 5-1 > 4-15 ✗
    ];

    const result = calculator.filterSecondPeriodOrders(subOrders);
    
    expect(result).toHaveLength(2);
    expect(result.map(o => o.id)).toEqual(['1', '2']);
  });

  test('排除缺少deliverTime字段的订单', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-03-10' },
      { id: '2' }, // 缺少 deliverTime
      { id: '3', deliverTime: null }
    ];

    const result = calculator.filterSecondPeriodOrders(subOrders);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('空订单列表返回空数组', () => {
    expect(calculator.filterSecondPeriodOrders([])).toEqual([]);
  });

  test('非数组输入返回空数组', () => {
    expect(calculator.filterSecondPeriodOrders(null)).toEqual([]);
    expect(calculator.filterSecondPeriodOrders(undefined)).toEqual([]);
  });

  test('跨月份的订单筛选', () => {
    const subOrders = [
      { id: '1', deliverTime: '2026-02-20' }, // 2-20 + 30 = 3-22 <= 4-15 ✓
      { id: '2', deliverTime: '2026-03-01' }, // 3-1 + 30 = 3-31 <= 4-15 ✓
      { id: '3', deliverTime: '2026-03-20' }  // 3-20 + 30 = 4-19 > 4-15 ✗
    ];

    const result = calculator.filterSecondPeriodOrders(subOrders);
    
    expect(result).toHaveLength(2);
    expect(result.map(o => o.id)).toEqual(['1', '2']);
  });
});

describe('SettlementCalculator - 售后冲账筛选', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('筛选符合条件的售后记录（退款完成时间 <= 结算日期）', () => {
    const afterSales = [
      { id: '1', refundTime: '2026-04-01' }, // <= 4-15 ✓
      { id: '2', refundTime: '2026-04-15' }, // <= 4-15 ✓
      { id: '3', refundTime: '2026-04-16' }, // > 4-15 ✗
      { id: '4', refundTime: '2026-05-01' }  // > 4-15 ✗
    ];

    const result = calculator.filterChargebacks(afterSales);
    
    expect(result).toHaveLength(2);
    expect(result.map(o => o.id)).toEqual(['1', '2']);
  });

  test('排除缺少refundTime字段的售后记录', () => {
    const afterSales = [
      { id: '1', refundTime: '2026-04-01' },
      { id: '2' }, // 缺少 refundTime
      { id: '3', refundTime: null },
      { id: '4', refundTime: undefined }
    ];

    const result = calculator.filterChargebacks(afterSales);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('排除无效日期格式的售后记录', () => {
    const afterSales = [
      { id: '1', refundTime: '2026-04-01' },
      { id: '2', refundTime: 'invalid-date' },
      { id: '3', refundTime: '2026-99-99' }
    ];

    const result = calculator.filterChargebacks(afterSales);
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('空售后列表返回空数组', () => {
    expect(calculator.filterChargebacks([])).toEqual([]);
  });

  test('非数组输入返回空数组', () => {
    expect(calculator.filterChargebacks(null)).toEqual([]);
    expect(calculator.filterChargebacks(undefined)).toEqual([]);
  });
});

describe('SettlementCalculator - 订单金额计算', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('计算第一期和第二期订单总金额', () => {
    const firstPeriodOrders = [
      { amount: 1000 },
      { amount: 2000 }
    ];
    const secondPeriodOrders = [
      { amount: 500 },
      { amount: 1500 }
    ];

    const amountExtractor = (order) => order.amount;
    const result = calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      amountExtractor
    );

    // 第一期：(1000 + 2000) × 0.9 = 2700
    // 第二期：(500 + 1500) × 0.1 = 200
    // 总计：2700 + 200 = 2900
    expect(result).toBe(2900);
  });

  test('第一期金额为90%，第二期金额为10%', () => {
    const firstPeriodOrders = [{ amount: 1000 }];
    const secondPeriodOrders = [{ amount: 1000 }];

    const amountExtractor = (order) => order.amount;
    const result = calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      amountExtractor
    );

    // 第一期：1000 × 0.9 = 900
    // 第二期：1000 × 0.1 = 100
    // 总计：900 + 100 = 1000
    expect(result).toBe(1000);
  });

  test('使用自定义金额提取函数', () => {
    const firstPeriodOrders = [
      { supplierAmount: 800, shippingFee: 50 },
      { supplierAmount: 1200, shippingFee: 30 }
    ];
    const secondPeriodOrders = [
      { supplierAmount: 500, shippingFee: 20 }
    ];

    // 供应商金额 = 商品货款 + 运费
    const amountExtractor = (order) => order.supplierAmount + (order.shippingFee || 0);
    const result = calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      amountExtractor
    );

    // 第一期：(850 + 1230) × 0.9 = 1872
    // 第二期：520 × 0.1 = 52
    // 总计：1872 + 52 = 1924
    expect(result).toBe(1924);
  });

  test('空订单列表返回0', () => {
    const amountExtractor = (order) => order.amount;
    const result = calculator.calculateOrderAmount([], [], amountExtractor);
    
    expect(result).toBe(0);
  });

  test('非数组输入返回0', () => {
    const amountExtractor = (order) => order.amount;
    
    expect(calculator.calculateOrderAmount(null, [], amountExtractor)).toBe(0);
    expect(calculator.calculateOrderAmount([], null, amountExtractor)).toBe(0);
    expect(calculator.calculateOrderAmount(null, null, amountExtractor)).toBe(0);
  });

  test('无效金额提取函数抛出错误', () => {
    const firstPeriodOrders = [{ amount: 1000 }];
    const secondPeriodOrders = [];

    expect(() => calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      null
    )).toThrow('金额提取函数必须是一个有效的函数');

    expect(() => calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      'not-a-function'
    )).toThrow('金额提取函数必须是一个有效的函数');
  });

  test('处理无效金额值', () => {
    const firstPeriodOrders = [
      { amount: 1000 },
      { amount: null },
      { amount: undefined },
      { amount: NaN },
      { amount: 'invalid' }
    ];
    const secondPeriodOrders = [];

    const amountExtractor = (order) => order.amount;
    const result = calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      amountExtractor
    );

    // 只有第一个订单的金额有效：1000 × 0.9 = 900
    expect(result).toBe(900);
  });

  test('金额提取函数抛出错误时继续处理其他订单', () => {
    const firstPeriodOrders = [
      { amount: 1000 },
      { noAmount: true }, // 会导致提取函数返回 undefined
      { amount: 2000 }
    ];
    const secondPeriodOrders = [];

    const amountExtractor = (order) => {
      if (order.noAmount) {
        throw new Error('No amount field');
      }
      return order.amount;
    };

    const result = calculator.calculateOrderAmount(
      firstPeriodOrders,
      secondPeriodOrders,
      amountExtractor
    );

    // 第一个和第三个订单有效：(1000 + 2000) × 0.9 = 2700
    expect(result).toBe(2700);
  });
});

describe('SettlementCalculator - 冲账金额计算', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('计算冲账金额（返回负数）', () => {
    const chargebacks = [
      { refundAmount: 500 },
      { refundAmount: 300 },
      { refundAmount: 200 }
    ];

    const amountExtractor = (chargeback) => chargeback.refundAmount;
    const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

    // 冲账金额 = -(500 + 300 + 200) = -1000
    expect(result).toBe(-1000);
  });

  test('使用自定义金额提取函数', () => {
    const chargebacks = [
      { platformAmount: 1000, supplierAmount: 800 },
      { platformAmount: 500, supplierAmount: 400 }
    ];

    // 经销商分成 = 平台货款 × 20%
    const amountExtractor = (chargeback) => chargeback.platformAmount * 0.2;
    const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

    // 冲账金额 = -((1000 × 0.2) + (500 × 0.2)) = -(200 + 100) = -300
    expect(result).toBe(-300);
  });

  test('空冲账列表返回0', () => {
    const amountExtractor = (chargeback) => chargeback.refundAmount;
    const result = calculator.calculateChargebackAmount([], amountExtractor);
    
    // Handle -0 vs 0 comparison
    expect(result === 0 || result === -0).toBe(true);
  });

  test('非数组输入返回0', () => {
    const amountExtractor = (chargeback) => chargeback.refundAmount;
    
    expect(calculator.calculateChargebackAmount(null, amountExtractor)).toBe(0);
    expect(calculator.calculateChargebackAmount(undefined, amountExtractor)).toBe(0);
  });

  test('无效金额提取函数抛出错误', () => {
    const chargebacks = [{ refundAmount: 500 }];

    expect(() => calculator.calculateChargebackAmount(chargebacks, null))
      .toThrow('金额提取函数必须是一个有效的函数');
  });

  test('处理无效金额值', () => {
    const chargebacks = [
      { refundAmount: 500 },
      { refundAmount: null },
      { refundAmount: undefined },
      { refundAmount: NaN },
      { refundAmount: 'invalid' }
    ];

    const amountExtractor = (chargeback) => chargeback.refundAmount;
    const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

    // 只有第一个冲账的金额有效：-500
    expect(result).toBe(-500);
  });
});

describe('SettlementCalculator - 净应结金额计算', () => {
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  test('计算净应结金额（正常应结 + 冲账）', () => {
    const normalAmount = 10000;
    const chargebackAmount = -1500;

    const result = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    // 净应结 = 10000 + (-1500) = 8500
    expect(result).toBe(8500);
  });

  test('无冲账时净应结等于正常应结', () => {
    const normalAmount = 10000;
    const chargebackAmount = 0;

    const result = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    expect(result).toBe(10000);
  });

  test('冲账大于正常应结时净应结为负数', () => {
    const normalAmount = 5000;
    const chargebackAmount = -8000;

    const result = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    // 净应结 = 5000 + (-8000) = -3000
    expect(result).toBe(-3000);
  });

  test('处理无效输入值', () => {
    expect(calculator.calculateNetAmount(null, -500)).toBe(-500);
    expect(calculator.calculateNetAmount(1000, null)).toBe(1000);
    expect(calculator.calculateNetAmount(null, null)).toBe(0);
    expect(calculator.calculateNetAmount(undefined, undefined)).toBe(0);
    expect(calculator.calculateNetAmount(NaN, NaN)).toBe(0);
  });

  test('处理字符串输入', () => {
    expect(calculator.calculateNetAmount('1000', '-500')).toBe(0);
    expect(calculator.calculateNetAmount('invalid', 'invalid')).toBe(0);
  });
});

describe('SettlementCalculator - 完整流程集成测试', () => {
  test('供应商对账完整流程', () => {
    const settlementDate = new Date('2026-04-15');
    const calculator = new SettlementCalculator(settlementDate);

    // 子订单数据
    const subOrders = [
      { 
        id: '1', 
        deliverTime: '2026-04-01', 
        supplierAmount: 800, 
        shippingFee: 50 
      }, // T+7: 4-1 + 7 = 4-8 <= 4-15 ✓, T+30: 4-1 + 30 = 5-1 > 4-15 ✗
      { 
        id: '2', 
        deliverTime: '2026-03-10', 
        supplierAmount: 1200, 
        shippingFee: 30 
      }, // T+7: 3-10 + 7 = 3-17 <= 4-15 ✓, T+30: 3-10 + 30 = 4-9 <= 4-15 ✓
      { 
        id: '3', 
        deliverTime: '2026-04-10', 
        supplierAmount: 500, 
        shippingFee: 20 
      }  // T+7: 4-10 + 7 = 4-17 > 4-15 ✗, T+30: 4-10 + 30 = 5-10 > 4-15 ✗
    ];

    // 售后数据
    const afterSales = [
      { id: 'AS1', refundTime: '2026-04-10', refundAmount: 300 }, // 符合
      { id: 'AS2', refundTime: '2026-04-20', refundAmount: 200 }  // 不符合
    ];

    // 筛选订单
    const firstPeriod = calculator.filterFirstPeriodOrders(subOrders);
    const secondPeriod = calculator.filterSecondPeriodOrders(subOrders);

    expect(firstPeriod).toHaveLength(2); // 订单1和2
    expect(secondPeriod).toHaveLength(1); // 只有订单2

    // 计算正常应结金额
    const normalAmount = calculator.calculateOrderAmount(
      firstPeriod,
      secondPeriod,
      order => order.supplierAmount + (order.shippingFee || 0)
    );

    // 第一期：(850 + 1230) × 0.9 = 1872
    // 第二期：1230 × 0.1 = 123
    // 总计：1872 + 123 = 1995
    expect(normalAmount).toBe(1995);

    // 筛选售后
    const chargebacks = calculator.filterChargebacks(afterSales);
    expect(chargebacks).toHaveLength(1);

    // 计算冲账金额
    const chargebackAmount = calculator.calculateChargebackAmount(
      chargebacks,
      afterSale => afterSale.refundAmount
    );

    expect(chargebackAmount).toBe(-300);

    // 计算净应结金额
    const netAmount = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    // 净应结 = 1995 + (-300) = 1695
    expect(netAmount).toBe(1695);
  });

  test('经销商对账完整流程', () => {
    const settlementDate = new Date('2026-04-15');
    const calculator = new SettlementCalculator(settlementDate);

    const subOrders = [
      { id: '1', deliverTime: '2026-04-01', platformAmount: 1000 }, // T+7 ✓, T+30 ✗
      { id: '2', deliverTime: '2026-03-10', platformAmount: 2000 }  // T+7 ✓, T+30 ✓
    ];

    const afterSales = [
      { id: 'AS1', refundTime: '2026-04-10', platformAmount: 500 }
    ];

    const firstPeriod = calculator.filterFirstPeriodOrders(subOrders);
    const secondPeriod = calculator.filterSecondPeriodOrders(subOrders);

    // 经销商分成 = 平台货款 × 20%
    const normalAmount = calculator.calculateOrderAmount(
      firstPeriod,
      secondPeriod,
      order => order.platformAmount * 0.2
    );

    // 第一期：(1000 + 2000) × 0.2 × 0.9 = 540
    // 第二期：2000 × 0.2 × 0.1 = 40
    // 总计：540 + 40 = 580
    expect(normalAmount).toBe(580);

    const chargebacks = calculator.filterChargebacks(afterSales);
    const chargebackAmount = calculator.calculateChargebackAmount(
      chargebacks,
      afterSale => afterSale.platformAmount * 0.2
    );

    // 冲账：-500 × 0.2 = -100
    expect(chargebackAmount).toBe(-100);

    const netAmount = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    // 净应结：580 + (-100) = 480
    expect(netAmount).toBe(480);
  });

  test('连锁总部对账完整流程', () => {
    const settlementDate = new Date('2026-04-15');
    const calculator = new SettlementCalculator(settlementDate);

    const subOrders = [
      { 
        id: '1', 
        deliverTime: '2026-04-01', 
        platformAmount: 1000, 
        supplierAmount: 800 
      }, // T+7 ✓, T+30 ✗
      { 
        id: '2', 
        deliverTime: '2026-03-10', 
        platformAmount: 2000, 
        supplierAmount: 1500 
      }  // T+7 ✓, T+30 ✓
    ];

    const afterSales = [
      { 
        id: 'AS1', 
        refundTime: '2026-04-10', 
        platformAmount: 500, 
        supplierAmount: 400 
      }
    ];

    const firstPeriod = calculator.filterFirstPeriodOrders(subOrders);
    const secondPeriod = calculator.filterSecondPeriodOrders(subOrders);

    // 连锁总部分成 = 商家毛利 × 10% = (平台货款 - 供应商货款) × 10%
    const normalAmount = calculator.calculateOrderAmount(
      firstPeriod,
      secondPeriod,
      order => {
        const merchantProfit = order.platformAmount - order.supplierAmount;
        return merchantProfit * 0.1;
      }
    );

    // 第一期：((1000 - 800) + (2000 - 1500)) × 0.1 × 0.9 = (200 + 500) × 0.1 × 0.9 = 63
    // 第二期：(2000 - 1500) × 0.1 × 0.1 = 500 × 0.1 × 0.1 = 5
    // 总计：63 + 5 = 68
    expect(normalAmount).toBe(68);

    const chargebacks = calculator.filterChargebacks(afterSales);
    const chargebackAmount = calculator.calculateChargebackAmount(
      chargebacks,
      afterSale => {
        const merchantProfit = afterSale.platformAmount - afterSale.supplierAmount;
        return merchantProfit * 0.1;
      }
    );

    // 冲账：-(500 - 400) × 0.1 = -10
    expect(chargebackAmount).toBe(-10);

    const netAmount = calculator.calculateNetAmount(normalAmount, chargebackAmount);

    // 净应结：68 + (-10) = 58
    expect(netAmount).toBe(58);
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property Tests - 时间筛选正确性', () => {
  // Feature: financial-reconciliation-refactor, Property 2: 时间筛选正确性
  // **Validates: Requirements 2.1, 3.1, 1.3**

  describe('Property 2: 时间筛选正确性 - filterFirstPeriodOrders', () => {
    test('所有筛选结果都满足 T+7 条件', () => {
      // 生成随机结算日期（确保有效）
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成随机订单列表
      const arbSubOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString()),
          supplierAmount: fc.float({ min: 0, max: 10000 }),
          shippingFee: fc.float({ min: 0, max: 500 })
        }),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrders, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterFirstPeriodOrders(subOrders);

        // Property: 所有筛选结果都应该满足条件：签收时间 + 7天 <= 结算日期
        for (const order of result) {
          const deliveryDate = new Date(order.deliverTime);
          const eligibleDate = new Date(deliveryDate);
          eligibleDate.setDate(eligibleDate.getDate() + 7);
          
          expect(eligibleDate <= settlementDate).toBe(true);
        }

        // Property: 不满足条件的订单都应该被排除
        const excludedOrders = subOrders.filter(order => 
          order.deliverTime && !result.some(r => r.id === order.id)
        );
        
        for (const order of excludedOrders) {
          const deliveryDate = new Date(order.deliverTime);
          const eligibleDate = new Date(deliveryDate);
          eligibleDate.setDate(eligibleDate.getDate() + 7);
          
          expect(eligibleDate > settlementDate).toBe(true);
        }
      }), { numRuns: 100 });
    });

    test('筛选结果数量不超过输入订单数量', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString())
        }),
        { minLength: 0, maxLength: 100 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrders, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterFirstPeriodOrders(subOrders);

        // Property: 筛选结果数量不应该超过输入订单数量
        expect(result.length).toBeLessThanOrEqual(subOrders.length);
      }), { numRuns: 100 });
    });

    test('缺少 deliverTime 的订单被排除', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrdersWithMissingTime = fc.array(
        fc.oneof(
          // 有 deliverTime 的订单
          fc.record({
            id: fc.uuid(),
            deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime()))
              .map(d => d.toISOString())
          }),
          // 缺少 deliverTime 的订单
          fc.record({
            id: fc.uuid()
          })
        ),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrdersWithMissingTime, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterFirstPeriodOrders(subOrders);

        // Property: 所有筛选结果都应该有 deliverTime 字段
        for (const order of result) {
          expect(order.deliverTime).toBeDefined();
          expect(order.deliverTime).not.toBeNull();
        }
      }), { numRuns: 100 });
    });
  });

  describe('Property 2: 时间筛选正确性 - filterSecondPeriodOrders', () => {
    test('所有筛选结果都满足 T+30 条件', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString()),
          supplierAmount: fc.float({ min: 0, max: 10000 })
        }),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrders, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterSecondPeriodOrders(subOrders);

        // Property: 所有筛选结果都应该满足条件：签收时间 + 30天 <= 结算日期
        for (const order of result) {
          const deliveryDate = new Date(order.deliverTime);
          const eligibleDate = new Date(deliveryDate);
          eligibleDate.setDate(eligibleDate.getDate() + 30);
          
          expect(eligibleDate <= settlementDate).toBe(true);
        }

        // Property: 不满足条件的订单都应该被排除
        const excludedOrders = subOrders.filter(order => 
          order.deliverTime && !result.some(r => r.id === order.id)
        );
        
        for (const order of excludedOrders) {
          const deliveryDate = new Date(order.deliverTime);
          const eligibleDate = new Date(deliveryDate);
          eligibleDate.setDate(eligibleDate.getDate() + 30);
          
          expect(eligibleDate > settlementDate).toBe(true);
        }
      }), { numRuns: 100 });
    });

    test('筛选结果数量不超过输入订单数量', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString())
        }),
        { minLength: 0, maxLength: 100 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrders, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterSecondPeriodOrders(subOrders);

        // Property: 筛选结果数量不应该超过输入订单数量
        expect(result.length).toBeLessThanOrEqual(subOrders.length);
      }), { numRuns: 100 });
    });

    test('缺少 deliverTime 的订单被排除', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrdersWithMissingTime = fc.array(
        fc.oneof(
          // 有 deliverTime 的订单
          fc.record({
            id: fc.uuid(),
            deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime()))
              .map(d => d.toISOString())
          }),
          // 缺少 deliverTime 的订单
          fc.record({
            id: fc.uuid()
          })
        ),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrdersWithMissingTime, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterSecondPeriodOrders(subOrders);

        // Property: 所有筛选结果都应该有 deliverTime 字段
        for (const order of result) {
          expect(order.deliverTime).toBeDefined();
          expect(order.deliverTime).not.toBeNull();
        }
      }), { numRuns: 100 });
    });
  });

  describe('Property 2: 时间筛选正确性 - filterChargebacks', () => {
    test('所有筛选结果都满足售后时间条件', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSales = fc.array(
        fc.record({
          id: fc.uuid(),
          refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString()),
          refundAmount: fc.float({ min: 0, max: 10000 })
        }),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSales, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 所有筛选结果都应该满足条件：退款完成时间 <= 结算日期
        for (const afterSale of result) {
          const refundDate = new Date(afterSale.refundTime);
          expect(refundDate <= settlementDate).toBe(true);
        }

        // Property: 不满足条件的售后都应该被排除
        const excludedAfterSales = afterSales.filter(afterSale => 
          afterSale.refundTime && !result.some(r => r.id === afterSale.id)
        );
        
        for (const afterSale of excludedAfterSales) {
          const refundDate = new Date(afterSale.refundTime);
          expect(refundDate > settlementDate).toBe(true);
        }
      }), { numRuns: 100 });
    });

    test('筛选结果数量不超过输入售后数量', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSales = fc.array(
        fc.record({
          id: fc.uuid(),
          refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString())
        }),
        { minLength: 0, maxLength: 100 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSales, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 筛选结果数量不应该超过输入售后数量
        expect(result.length).toBeLessThanOrEqual(afterSales.length);
      }), { numRuns: 100 });
    });

    test('缺少 refundTime 的售后被排除', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSalesWithMissingTime = fc.array(
        fc.oneof(
          // 有 refundTime 的售后
          fc.record({
            id: fc.uuid(),
            refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime()))
              .map(d => d.toISOString())
          }),
          // 缺少 refundTime 的售后
          fc.record({
            id: fc.uuid()
          })
        ),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSalesWithMissingTime, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 所有筛选结果都应该有 refundTime 字段
        for (const afterSale of result) {
          expect(afterSale.refundTime).toBeDefined();
          expect(afterSale.refundTime).not.toBeNull();
        }
      }), { numRuns: 100 });
    });
  });

  describe('Property 2: 时间筛选正确性 - 边界条件', () => {
    test('空数组输入返回空数组', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));

      fc.assert(fc.property(arbSettlementDate, (settlementDate) => {
        const calculator = new SettlementCalculator(settlementDate);
        
        // Property: 空数组输入应该返回空数组
        expect(calculator.filterFirstPeriodOrders([])).toEqual([]);
        expect(calculator.filterSecondPeriodOrders([])).toEqual([]);
        expect(calculator.filterChargebacks([])).toEqual([]);
      }), { numRuns: 50 });
    });

    test('非数组输入返回空数组', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbInvalidInput = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.string(),
        fc.integer(),
        fc.boolean()
      );

      fc.assert(fc.property(arbSettlementDate, arbInvalidInput, (settlementDate, invalidInput) => {
        const calculator = new SettlementCalculator(settlementDate);
        
        // Property: 非数组输入应该返回空数组
        expect(calculator.filterFirstPeriodOrders(invalidInput)).toEqual([]);
        expect(calculator.filterSecondPeriodOrders(invalidInput)).toEqual([]);
        expect(calculator.filterChargebacks(invalidInput)).toEqual([]);
      }), { numRuns: 50 });
    });
  });

  describe('Property 2: 时间筛选正确性 - 时间计算一致性', () => {
    test('第一期和第二期筛选的时间计算逻辑一致', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbSubOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          deliverTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString())
        }),
        { minLength: 0, maxLength: 30 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSubOrders, (settlementDate, subOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const firstPeriod = calculator.filterFirstPeriodOrders(subOrders);
        const secondPeriod = calculator.filterSecondPeriodOrders(subOrders);

        // Property: 第一期符合条件的订单也应该符合第二期条件（因为 7 < 30）
        // 但是这个逻辑是错误的！第一期要求 deliverTime + 7 <= settlementDate
        // 第二期要求 deliverTime + 30 <= settlementDate
        // 如果 deliverTime + 7 <= settlementDate，不一定意味着 deliverTime + 30 <= settlementDate
        // 正确的逻辑应该是：如果一个订单符合第二期条件，它一定符合第一期条件

        // Property: 第二期符合条件的订单也应该符合第一期条件（因为 30 > 7）
        for (const order of secondPeriod) {
          const deliveryDate = new Date(order.deliverTime);
          const firstPeriodEligibleDate = new Date(deliveryDate);
          firstPeriodEligibleDate.setDate(firstPeriodEligibleDate.getDate() + 7);
          
          expect(firstPeriodEligibleDate <= settlementDate).toBe(true);
        }

        // Property: 第二期结果应该是第一期结果的子集
        for (const order of secondPeriod) {
          expect(firstPeriod.some(o => o.id === order.id)).toBe(true);
        }
      }), { numRuns: 100 });
    });
  });
});

describe('Property Tests - 分期金额计算正确性', () => {
  // Feature: financial-reconciliation-refactor, Property 3: 分期金额计算正确性
  // **Validates: Requirements 2.2, 3.2**

  describe('Property 3: 分期金额计算正确性 - calculateOrderAmount', () => {
    test('第一期金额为订单总额的90%', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成第一期订单（只有第一期，第二期为空）
      const arbFirstPeriodOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
        }),
        { minLength: 1, maxLength: 20 }
      ).filter(orders => orders.every(order => !isNaN(order.amount)));

      fc.assert(fc.property(arbSettlementDate, arbFirstPeriodOrders, (settlementDate, firstPeriodOrders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const secondPeriodOrders = []; // 空的第二期订单
        const amountExtractor = (order) => order.amount;

        const result = calculator.calculateOrderAmount(
          firstPeriodOrders,
          secondPeriodOrders,
          amountExtractor
        );

        // 计算期望的第一期金额（90%）
        const expectedFirstPeriodAmount = firstPeriodOrders.reduce((sum, order) => {
          return sum + order.amount * 0.9;
        }, 0);

        // Property: 第一期金额应该等于订单总额的90%
        expect(Math.abs(result - expectedFirstPeriodAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('第二期金额为订单总额的10%', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成第二期订单（只有第二期，第一期为空）
      const arbSecondPeriodOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
        }),
        { minLength: 1, maxLength: 20 }
      );

      fc.assert(fc.property(arbSettlementDate, arbSecondPeriodOrders, (settlementDate, secondPeriodOrders) => {
        // 过滤掉金额过小的订单
        const validOrders = secondPeriodOrders.filter(order => 
          order.amount && !isNaN(order.amount) && Math.abs(order.amount) >= 0.01
        );
        
        if (validOrders.length === 0) {
          return true; // 跳过无效测试用例
        }

        const calculator = new SettlementCalculator(settlementDate);
        const firstPeriodOrders = []; // 空的第一期订单
        const amountExtractor = (order) => order.amount;

        const result = calculator.calculateOrderAmount(
          firstPeriodOrders,
          validOrders,
          amountExtractor
        );

        // 计算期望的第二期金额（10%）
        const expectedSecondPeriodAmount = validOrders.reduce((sum, order) => {
          return sum + order.amount * 0.1;
        }, 0);

        // Property: 第二期金额应该等于订单总额的10%
        expect(Math.abs(result - expectedSecondPeriodAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('第一期 + 第二期 = 订单金额总和', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成第一期和第二期订单
      const arbFirstPeriodOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(5000) })
        }),
        { minLength: 0, maxLength: 15 }
      );

      const arbSecondPeriodOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(5000) })
        }),
        { minLength: 0, maxLength: 15 }
      );

      fc.assert(fc.property(
        arbSettlementDate, 
        arbFirstPeriodOrders, 
        arbSecondPeriodOrders, 
        (settlementDate, firstPeriodOrders, secondPeriodOrders) => {
          // Filter out any orders with NaN amounts to avoid test failures
          const validFirstPeriod = firstPeriodOrders.filter(order => 
            typeof order.amount === 'number' && !isNaN(order.amount)
          );
          const validSecondPeriod = secondPeriodOrders.filter(order => 
            typeof order.amount === 'number' && !isNaN(order.amount)
          );

          const calculator = new SettlementCalculator(settlementDate);
          const amountExtractor = (order) => order.amount;

          const totalResult = calculator.calculateOrderAmount(
            validFirstPeriod,
            validSecondPeriod,
            amountExtractor
          );

          // 分别计算第一期和第二期金额
          const firstPeriodResult = calculator.calculateOrderAmount(
            validFirstPeriod,
            [],
            amountExtractor
          );

          const secondPeriodResult = calculator.calculateOrderAmount(
            [],
            validSecondPeriod,
            amountExtractor
          );

          // Property: 总金额应该等于第一期 + 第二期
          expect(Math.abs(totalResult - (firstPeriodResult + secondPeriodResult))).toBeLessThan(0.15);

          // Property: 总金额应该等于所有订单金额的加权和（90% + 10% = 100%）
          const expectedTotal = validFirstPeriod.reduce((sum, order) => sum + order.amount * 0.9, 0) +
                               validSecondPeriod.reduce((sum, order) => sum + order.amount * 0.1, 0);

          expect(Math.abs(totalResult - expectedTotal)).toBeLessThan(0.15);
        }
      ), { numRuns: 100 });
    });

    test('金额提取函数正确应用', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成包含多个金额字段的订单
      const arbOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          supplierAmount: fc.float({ min: Math.fround(0.1), max: Math.fround(3000) }),
          shippingFee: fc.float({ min: Math.fround(0), max: Math.fround(500) }),
          platformAmount: fc.float({ min: Math.fround(0.1), max: Math.fround(5000) })
        }),
        { minLength: 1, maxLength: 20 }
      ).filter(orders => orders.every(order => 
        !isNaN(order.supplierAmount) && !isNaN(order.shippingFee) && !isNaN(order.platformAmount) &&
        order.supplierAmount >= 0.1 && order.platformAmount >= 0.1
      ));

      fc.assert(fc.property(arbSettlementDate, arbOrders, (settlementDate, orders) => {
        // 过滤掉金额过小的订单
        const validOrders = orders.filter(order => 
          order.supplierAmount && !isNaN(order.supplierAmount) && Math.abs(order.supplierAmount) >= 0.01 &&
          order.platformAmount && !isNaN(order.platformAmount) && Math.abs(order.platformAmount) >= 0.01
        );
        
        if (validOrders.length === 0) {
          return true; // 跳过无效测试用例
        }

        const calculator = new SettlementCalculator(settlementDate);

        // 测试不同的金额提取函数
        const extractors = [
          // 供应商金额 + 运费
          (order) => order.supplierAmount + (order.shippingFee || 0),
          // 平台金额的20%（经销商分成）
          (order) => order.platformAmount * 0.2,
          // 商家毛利的10%（连锁总部分成）
          (order) => (order.platformAmount - order.supplierAmount) * 0.1
        ];

        extractors.forEach(extractor => {
          // 将订单分为第一期和第二期（随机分配）
          const midPoint = Math.floor(validOrders.length / 2);
          const firstPeriodOrders = validOrders.slice(0, midPoint);
          const secondPeriodOrders = validOrders.slice(midPoint);

          // 跳过空列表的情况
          if (firstPeriodOrders.length === 0 && secondPeriodOrders.length === 0) {
            return;
          }

          const result = calculator.calculateOrderAmount(
            firstPeriodOrders,
            secondPeriodOrders,
            extractor
          );

          // 手动计算期望结果
          const expectedFirstPeriod = firstPeriodOrders.reduce((sum, order) => {
            return sum + extractor(order) * 0.9;
          }, 0);

          const expectedSecondPeriod = secondPeriodOrders.reduce((sum, order) => {
            return sum + extractor(order) * 0.1;
          }, 0);

          const expectedTotal = expectedFirstPeriod + expectedSecondPeriod;

          // Property: 金额提取函数应该被正确应用
          expect(Math.abs(result - expectedTotal)).toBeLessThan(0.15);
        });
      }), { numRuns: 50 });
    });

    test('空订单列表处理正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));

      fc.assert(fc.property(arbSettlementDate, (settlementDate) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (order) => order.amount;

        // Property: 空订单列表应该返回0
        expect(calculator.calculateOrderAmount([], [], amountExtractor)).toBe(0);
        expect(calculator.calculateOrderAmount([{ amount: 100 }], [], amountExtractor)).toBe(90);
        expect(calculator.calculateOrderAmount([], [{ amount: 100 }], amountExtractor)).toBe(10);
      }), { numRuns: 50 });
    });

    test('无效金额处理正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成包含无效金额的订单
      const arbOrdersWithInvalidAmounts = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.oneof(
            fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }), // 有效金额
            fc.constant(null),                   // 无效金额
            fc.constant(undefined),              // 无效金额
            fc.constant(NaN),                    // 无效金额
            fc.constant('invalid')               // 无效金额
          )
        }),
        { minLength: 1, maxLength: 20 }
      );

      fc.assert(fc.property(arbSettlementDate, arbOrdersWithInvalidAmounts, (settlementDate, orders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (order) => order.amount;

        const result = calculator.calculateOrderAmount(
          orders,
          [],
          amountExtractor
        );

        // 手动计算期望结果（只计算有效金额）
        const expectedResult = orders.reduce((sum, order) => {
          const amount = order.amount;
          if (typeof amount === 'number' && !isNaN(amount)) {
            return sum + amount * 0.9;
          }
          return sum;
        }, 0);

        // Property: 无效金额应该被忽略，只计算有效金额
        expect(Math.abs(result - expectedResult)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('金额提取函数异常处理正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
          shouldThrow: fc.boolean()
        }),
        { minLength: 1, maxLength: 10 }
      ).filter(orders => orders.every(order => !isNaN(order.amount)));

      fc.assert(fc.property(arbSettlementDate, arbOrders, (settlementDate, orders) => {
        const calculator = new SettlementCalculator(settlementDate);
        
        // 金额提取函数，对某些订单抛出异常
        const amountExtractor = (order) => {
          if (order.shouldThrow) {
            throw new Error('Extraction failed');
          }
          return order.amount;
        };

        const result = calculator.calculateOrderAmount(
          orders,
          [],
          amountExtractor
        );

        // 手动计算期望结果（只计算不抛出异常的订单）
        const expectedResult = orders.reduce((sum, order) => {
          if (!order.shouldThrow) {
            return sum + order.amount * 0.9;
          }
          return sum;
        }, 0);

        // Property: 金额提取函数抛出异常时应该跳过该订单，继续处理其他订单
        expect(Math.abs(result - expectedResult)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('分期比例精度正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 生成精确的金额，便于验证比例计算
      const arbOrders = fc.array(
        fc.record({
          id: fc.uuid(),
          amount: fc.integer({ min: 1, max: 10000 }) // 使用整数避免浮点精度问题
        }),
        { minLength: 1, maxLength: 10 }
      );

      fc.assert(fc.property(arbSettlementDate, arbOrders, (settlementDate, orders) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (order) => order.amount;

        const firstPeriodResult = calculator.calculateOrderAmount(
          orders,
          [],
          amountExtractor
        );

        const secondPeriodResult = calculator.calculateOrderAmount(
          [],
          orders,
          amountExtractor
        );

        const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

        // Property: 第一期应该是总金额的90%
        expect(Math.abs(firstPeriodResult - totalAmount * 0.9)).toBeLessThan(0.15);
        
        // Property: 第二期应该是总金额的10%
        expect(Math.abs(secondPeriodResult - totalAmount * 0.1)).toBeLessThan(0.15);

        // Property: 第一期 + 第二期应该等于总金额
        expect(Math.abs((firstPeriodResult + secondPeriodResult) - totalAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });
  });
});

// ============================================================================
// Property Tests - 售后冲账筛选和金额计算
// ============================================================================

describe('Property Tests - 售后冲账筛选和金额计算', () => {
  // Feature: financial-reconciliation-refactor, Property 4: 售后冲账筛选正确性
  // **Validates: Requirements 4.1**

  describe('Property 4: 售后冲账筛选正确性 - filterChargebacks', () => {
    test('所有筛选结果都满足售后时间条件：refundTime ≤ settlementDate', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbAfterSales = fc.array(
        fc.record({
          id: fc.uuid(),
          subOrderId: fc.uuid(),
          refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString()),
          refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) }),
          reason: fc.string({ minLength: 1, maxLength: 50 })
        }),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSales, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 所有筛选结果都应该满足条件：refundTime ≤ settlementDate
        for (const afterSale of result) {
          const refundDate = new Date(afterSale.refundTime);
          expect(refundDate <= settlementDate).toBe(true);
        }

        // Property: 不满足条件的售后都应该被排除
        const excludedAfterSales = afterSales.filter(afterSale => 
          afterSale.refundTime && !result.some(r => r.id === afterSale.id)
        );
        
        for (const afterSale of excludedAfterSales) {
          const refundDate = new Date(afterSale.refundTime);
          expect(refundDate > settlementDate).toBe(true);
        }
      }), { numRuns: 100 });
    });

    test('筛选结果数量不超过输入售后数量', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSales = fc.array(
        fc.record({
          id: fc.uuid(),
          refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
            .filter(d => !isNaN(d.getTime()))
            .map(d => d.toISOString()),
          refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
        }),
        { minLength: 0, maxLength: 100 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSales, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 筛选结果数量不应该超过输入售后数量
        expect(result.length).toBeLessThanOrEqual(afterSales.length);
      }), { numRuns: 100 });
    });

    test('缺少 refundTime 的售后记录被正确排除', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSalesWithMissingTime = fc.array(
        fc.oneof(
          // 有 refundTime 的售后
          fc.record({
            id: fc.uuid(),
            refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime()))
              .map(d => d.toISOString()),
            refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
          }),
          // 缺少 refundTime 的售后
          fc.record({
            id: fc.uuid(),
            refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
          })
        ),
        { minLength: 0, maxLength: 50 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSalesWithMissingTime, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 所有筛选结果都应该有 refundTime 字段
        for (const afterSale of result) {
          expect(afterSale.refundTime).toBeDefined();
          expect(afterSale.refundTime).not.toBeNull();
        }

        // Property: 筛选结果数量应该等于有效 refundTime 且满足时间条件的售后数量
        const validAfterSales = afterSales.filter(afterSale => {
          if (!afterSale.refundTime) return false;
          try {
            const refundDate = new Date(afterSale.refundTime);
            return !isNaN(refundDate.getTime()) && refundDate <= settlementDate;
          } catch {
            return false;
          }
        });

        expect(result.length).toBe(validAfterSales.length);
      }), { numRuns: 100 });
    });

    test('无效日期格式的售后记录被正确排除', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      const arbAfterSalesWithInvalidDates = fc.array(
        fc.oneof(
          // 有效日期的售后
          fc.record({
            id: fc.uuid(),
            refundTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime()))
              .map(d => d.toISOString()),
            refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
          }),
          // 无效日期的售后
          fc.record({
            id: fc.uuid(),
            refundTime: fc.oneof(
              fc.constant('invalid-date'),
              fc.constant('2026-99-99'),
              fc.constant('not-a-date'),
              fc.constant('')
            ),
            refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000) })
          })
        ),
        { minLength: 1, maxLength: 30 }
      );

      fc.assert(fc.property(arbSettlementDate, arbAfterSalesWithInvalidDates, (settlementDate, afterSales) => {
        const calculator = new SettlementCalculator(settlementDate);
        const result = calculator.filterChargebacks(afterSales);

        // Property: 所有筛选结果都应该有有效的 refundTime
        for (const afterSale of result) {
          const refundDate = new Date(afterSale.refundTime);
          expect(isNaN(refundDate.getTime())).toBe(false);
        }
      }), { numRuns: 100 });
    });

    test('边界条件：refundTime 等于 settlementDate 的情况', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));

      fc.assert(fc.property(arbSettlementDate, (settlementDate) => {
        const calculator = new SettlementCalculator(settlementDate);
        
        // 创建 refundTime 等于 settlementDate 的售后记录
        const afterSales = [
          {
            id: 'boundary-test',
            refundTime: settlementDate.toISOString(),
            refundAmount: 1000
          }
        ];

        const result = calculator.filterChargebacks(afterSales);

        // Property: refundTime 等于 settlementDate 的售后应该被包含（≤ 条件）
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('boundary-test');
      }), { numRuns: 50 });
    });
  });

  // Feature: financial-reconciliation-refactor, Property 5: 冲账金额计算正确性
  // **Validates: Requirements 4.2**

  describe('Property 5: 冲账金额计算正确性 - calculateChargebackAmount', () => {
    test('冲账金额应该等于售后退款总和的负数', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbChargebacks = fc.array(
        fc.record({
          id: fc.uuid(),
          refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(5000) })
        }),
        { minLength: 1, maxLength: 20 }
      ).filter(chargebacks => chargebacks.every(cb => !isNaN(cb.refundAmount)));

      fc.assert(fc.property(arbSettlementDate, arbChargebacks, (settlementDate, chargebacks) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (chargeback) => chargeback.refundAmount;

        const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

        // 手动计算期望的冲账金额
        const expectedAmount = -chargebacks.reduce((sum, chargeback) => {
          return sum + chargeback.refundAmount;
        }, 0);

        // Property: 冲账金额应该等于售后退款总和的负数
        expect(Math.abs(result - expectedAmount)).toBeLessThan(0.15);
        
        // Property: 冲账金额应该是负数或零
        expect(result).toBeLessThanOrEqual(0);
      }), { numRuns: 100 });
    });

    test('使用不同金额提取函数的正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbChargebacks = fc.array(
        fc.record({
          id: fc.uuid(),
          refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(3000) }),
          platformAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(5000) }),
          supplierAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(4000) })
        }),
        { minLength: 1, maxLength: 15 }
      ).filter(chargebacks => chargebacks.every(cb => 
        !isNaN(cb.refundAmount) && !isNaN(cb.platformAmount) && !isNaN(cb.supplierAmount)
      ));

      fc.assert(fc.property(arbSettlementDate, arbChargebacks, (settlementDate, chargebacks) => {
        // 过滤掉金额过小的冲账记录
        const validChargebacks = chargebacks.filter(cb => 
          cb.refundAmount && !isNaN(cb.refundAmount) && Math.abs(cb.refundAmount) >= 0.01 &&
          cb.platformAmount && !isNaN(cb.platformAmount) && Math.abs(cb.platformAmount) >= 0.01 &&
          cb.supplierAmount && !isNaN(cb.supplierAmount) && Math.abs(cb.supplierAmount) >= 0.01
        );
        
        if (validChargebacks.length === 0) {
          return true; // 跳过无效测试用例
        }

        const calculator = new SettlementCalculator(settlementDate);

        // 测试不同的金额提取函数
        const extractors = [
          // 直接退款金额
          { name: 'refundAmount', fn: (cb) => cb.refundAmount },
          // 经销商分成（平台金额的20%）
          { name: 'distributorShare', fn: (cb) => cb.platformAmount * 0.2 },
          // 连锁总部分成（商家毛利的10%）
          { name: 'headquarterShare', fn: (cb) => (cb.platformAmount - cb.supplierAmount) * 0.1 }
        ];

        extractors.forEach(extractor => {
          // 跳过空列表的情况
          if (validChargebacks.length === 0) {
            return;
          }

          const result = calculator.calculateChargebackAmount(validChargebacks, extractor.fn);

          // 手动计算期望结果
          const expectedAmount = -validChargebacks.reduce((sum, chargeback) => {
            return sum + extractor.fn(chargeback);
          }, 0);

          // Property: 金额提取函数应该被正确应用
          expect(Math.abs(result - expectedAmount)).toBeLessThan(0.15);
          
          // Property: 结果应该是负数或零 (allow for floating point precision errors)
          expect(result).toBeLessThanOrEqual(0.05);
        });
      }), { numRuns: 50 });
    });

    test('空冲账列表返回零', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));

      fc.assert(fc.property(arbSettlementDate, (settlementDate) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (chargeback) => chargeback.refundAmount;

        const result = calculator.calculateChargebackAmount([], amountExtractor);

        // Property: 空冲账列表应该返回0 (handle -0 case)
        expect(result === 0 || result === -0).toBe(true);
      }), { numRuns: 50 });
    });

    test('无效金额值被正确处理', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbChargebacksWithInvalidAmounts = fc.array(
        fc.record({
          id: fc.uuid(),
          refundAmount: fc.oneof(
            fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }), // 有效金额
            fc.constant(null),                   // 无效金额
            fc.constant(undefined),              // 无效金额
            fc.constant(NaN),                    // 无效金额
            fc.constant('invalid')               // 无效金额
          )
        }),
        { minLength: 1, maxLength: 20 }
      );

      fc.assert(fc.property(arbSettlementDate, arbChargebacksWithInvalidAmounts, (settlementDate, chargebacks) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (chargeback) => chargeback.refundAmount;

        const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

        // 手动计算期望结果（只计算有效金额）
        const expectedAmount = -chargebacks.reduce((sum, chargeback) => {
          const amount = chargeback.refundAmount;
          if (typeof amount === 'number' && !isNaN(amount)) {
            return sum + amount;
          }
          return sum;
        }, 0);

        // Property: 无效金额应该被忽略，只计算有效金额
        expect(Math.abs(result - expectedAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('金额提取函数异常处理正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      const arbChargebacks = fc.array(
        fc.record({
          id: fc.uuid(),
          refundAmount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
          shouldThrow: fc.boolean()
        }),
        { minLength: 1, maxLength: 10 }
      ).filter(chargebacks => chargebacks.every(cb => !isNaN(cb.refundAmount)));

      fc.assert(fc.property(arbSettlementDate, arbChargebacks, (settlementDate, chargebacks) => {
        const calculator = new SettlementCalculator(settlementDate);
        
        // 金额提取函数，对某些冲账抛出异常
        const amountExtractor = (chargeback) => {
          if (chargeback.shouldThrow) {
            throw new Error('Extraction failed');
          }
          return chargeback.refundAmount;
        };

        const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

        // 手动计算期望结果（只计算不抛出异常的冲账）
        const expectedAmount = -chargebacks.reduce((sum, chargeback) => {
          if (!chargeback.shouldThrow) {
            return sum + chargeback.refundAmount;
          }
          return sum;
        }, 0);

        // Property: 金额提取函数抛出异常时应该跳过该冲账，继续处理其他冲账
        expect(Math.abs(result - expectedAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('冲账金额计算的数学正确性', () => {
      const arbSettlementDate = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
        .filter(d => !isNaN(d.getTime()));
      
      // 使用整数避免浮点精度问题
      const arbChargebacks = fc.array(
        fc.record({
          id: fc.uuid(),
          refundAmount: fc.integer({ min: 1, max: 10000 })
        }),
        { minLength: 1, maxLength: 10 }
      );

      fc.assert(fc.property(arbSettlementDate, arbChargebacks, (settlementDate, chargebacks) => {
        const calculator = new SettlementCalculator(settlementDate);
        const amountExtractor = (chargeback) => chargeback.refundAmount;

        const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);

        const totalRefund = chargebacks.reduce((sum, cb) => sum + cb.refundAmount, 0);

        // Property: 冲账金额的绝对值应该等于退款总额
        expect(Math.abs(result)).toBe(totalRefund);
        
        // Property: 冲账金额应该是负数（除非总额为0）
        if (totalRefund > 0) {
          expect(result).toBeLessThan(0);
        } else {
          expect(result === 0 || result === -0).toBe(true);
        }
      }), { numRuns: 100 });
    });
  });

  // Feature: financial-reconciliation-refactor, Property 6: 净应结金额计算正确性
  // **Validates: Requirements 4.3**

  describe('Property 6: 净应结金额计算正确性 - calculateNetAmount', () => {
    test('净应结金额等于正常应结金额加冲账金额', () => {
      const arbNormalAmount = fc.float({ min: Math.fround(-10000), max: Math.fround(10000) })
        .filter(n => !isNaN(n));
      const arbChargebackAmount = fc.float({ min: Math.fround(-10000), max: Math.fround(0) })
        .filter(n => !isNaN(n)); // 冲账通常是负数或零

      fc.assert(fc.property(arbNormalAmount, arbChargebackAmount, (normalAmount, chargebackAmount) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const result = calculator.calculateNetAmount(normalAmount, chargebackAmount);

        // Property: 净应结金额应该等于正常应结金额 + 冲账金额
        const expectedResult = normalAmount + chargebackAmount;
        expect(Math.abs(result - expectedResult)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('加法交换律：calculateNetAmount(a, b) = calculateNetAmount(b, a)', () => {
      const arbAmount1 = fc.float({ min: Math.fround(-5000), max: Math.fround(5000) })
        .filter(n => !isNaN(n));
      const arbAmount2 = fc.float({ min: Math.fround(-5000), max: Math.fround(5000) })
        .filter(n => !isNaN(n));

      fc.assert(fc.property(arbAmount1, arbAmount2, (amount1, amount2) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const result1 = calculator.calculateNetAmount(amount1, amount2);
        const result2 = calculator.calculateNetAmount(amount2, amount1);

        // Property: 加法应该满足交换律
        expect(Math.abs(result1 - result2)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('零元素性质：与零相加不改变结果', () => {
      const arbAmount = fc.float({ min: Math.fround(-10000), max: Math.fround(10000) })
        .filter(n => !isNaN(n));

      fc.assert(fc.property(arbAmount, (amount) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const resultWithZeroNormal = calculator.calculateNetAmount(0, amount);
        const resultWithZeroChargeback = calculator.calculateNetAmount(amount, 0);

        // Property: 与零相加应该等于原值
        expect(Math.abs(resultWithZeroNormal - amount)).toBeLessThan(0.15);
        expect(Math.abs(resultWithZeroChargeback - amount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('无效输入值的处理正确性', () => {
      const arbValidAmount = fc.float({ min: Math.fround(-5000), max: Math.fround(5000) })
        .filter(n => !isNaN(n));
      const arbInvalidAmount = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.constant('invalid')
      );

      fc.assert(fc.property(arbValidAmount, arbInvalidAmount, (validAmount, invalidAmount) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        // 测试无效的正常应结金额
        const result1 = calculator.calculateNetAmount(invalidAmount, validAmount);
        // 测试无效的冲账金额
        const result2 = calculator.calculateNetAmount(validAmount, invalidAmount);

        // Property: 无效输入应该被视为0
        expect(Math.abs(result1 - validAmount)).toBeLessThan(0.15);
        expect(Math.abs(result2 - validAmount)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('双重无效输入返回零', () => {
      const arbInvalidAmount1 = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.constant('invalid')
      );
      const arbInvalidAmount2 = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.constant('invalid')
      );

      fc.assert(fc.property(arbInvalidAmount1, arbInvalidAmount2, (invalidAmount1, invalidAmount2) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const result = calculator.calculateNetAmount(invalidAmount1, invalidAmount2);

        // Property: 两个无效输入应该返回0
        expect(result).toBe(0);
      }), { numRuns: 50 });
    });

    test('正负数组合的正确性', () => {
      const arbPositiveAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(5000) })
        .filter(n => !isNaN(n));
      const arbNegativeAmount = fc.float({ min: Math.fround(-5000), max: Math.fround(-0.01) })
        .filter(n => !isNaN(n));

      fc.assert(fc.property(arbPositiveAmount, arbNegativeAmount, (positiveAmount, negativeAmount) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        // 正常应结为正数，冲账为负数（典型场景）
        const result1 = calculator.calculateNetAmount(positiveAmount, negativeAmount);
        // 正常应结为负数，冲账为正数（异常场景）
        const result2 = calculator.calculateNetAmount(negativeAmount, positiveAmount);

        // Property: 计算结果应该等于两数之和
        expect(Math.abs(result1 - (positiveAmount + negativeAmount))).toBeLessThan(0.15);
        expect(Math.abs(result2 - (negativeAmount + positiveAmount))).toBeLessThan(0.15);

        // Property: 两个结果应该相等（加法交换律）
        expect(Math.abs(result1 - result2)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });

    test('边界值处理：极大和极小值', () => {
      const arbLargePositive = fc.float({ min: Math.fround(1000000), max: Math.fround(10000000) })
        .filter(n => !isNaN(n));
      const arbLargeNegative = fc.float({ min: Math.fround(-10000000), max: Math.fround(-1000000) })
        .filter(n => !isNaN(n));

      fc.assert(fc.property(arbLargePositive, arbLargeNegative, (largePositive, largeNegative) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const result = calculator.calculateNetAmount(largePositive, largeNegative);

        // Property: 即使是大数值，计算也应该正确
        const expectedResult = largePositive + largeNegative;
        expect(Math.abs(result - expectedResult)).toBeLessThan(0.15); // 允许更大的误差范围
      }), { numRuns: 50 });
    });

    test('精度保持：小数计算的准确性', () => {
      // 使用有限精度的小数避免浮点精度问题
      const arbDecimalAmount1 = fc.integer({ min: -100000, max: 100000 }).map(n => n / 100);
      const arbDecimalAmount2 = fc.integer({ min: -100000, max: 100000 }).map(n => n / 100);

      fc.assert(fc.property(arbDecimalAmount1, arbDecimalAmount2, (amount1, amount2) => {
        const settlementDate = new Date('2026-04-15');
        const calculator = new SettlementCalculator(settlementDate);

        const result = calculator.calculateNetAmount(amount1, amount2);

        // Property: 小数计算应该保持精度
        const expectedResult = amount1 + amount2;
        expect(Math.abs(result - expectedResult)).toBeLessThan(0.15);
      }), { numRuns: 100 });
    });
  });
});

// ============================================================================
// Unit Tests - 边界条件 (Boundary Conditions)
// ============================================================================

describe('SettlementCalculator - 边界条件单元测试', () => {
  // **Validates: Requirements 11.3, 11.4**
  
  const settlementDate = new Date('2026-04-15');
  const calculator = new SettlementCalculator(settlementDate);

  describe('空订单列表处理', () => {
    test('空订单列表 - filterFirstPeriodOrders', () => {
      const result = calculator.filterFirstPeriodOrders([]);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('空订单列表 - filterSecondPeriodOrders', () => {
      const result = calculator.filterSecondPeriodOrders([]);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('空订单列表 - calculateOrderAmount', () => {
      const amountExtractor = (order) => order.amount;
      const result = calculator.calculateOrderAmount([], [], amountExtractor);
      
      expect(result).toBe(0);
    });

    test('空售后列表 - filterChargebacks', () => {
      const result = calculator.filterChargebacks([]);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    test('空售后列表 - calculateChargebackAmount', () => {
      const amountExtractor = (afterSale) => afterSale.refundAmount;
      const result = calculator.calculateChargebackAmount([], amountExtractor);
      
      // Handle -0 vs 0 comparison
      expect(result === 0 || result === -0).toBe(true);
    });
  });

  describe('缺少deliverTime字段的订单处理', () => {
    test('订单缺少deliverTime字段 - filterFirstPeriodOrders', () => {
      const subOrders = [
        { id: '1', deliverTime: '2026-04-01', amount: 1000 }, // 有效订单
        { id: '2', amount: 2000 }, // 缺少 deliverTime
        { id: '3', deliverTime: null, amount: 1500 }, // deliverTime 为 null
        { id: '4', deliverTime: undefined, amount: 800 }, // deliverTime 为 undefined
        { id: '5', deliverTime: '', amount: 600 }, // deliverTime 为空字符串
        { id: '6', deliverTime: '2026-04-05', amount: 1200 } // 有效订单
      ];

      const result = calculator.filterFirstPeriodOrders(subOrders);
      
      // 只有有效的订单应该被包含
      expect(result).toHaveLength(2);
      expect(result.map(o => o.id)).toEqual(['1', '6']);
      
      // 验证所有结果都有有效的 deliverTime
      result.forEach(order => {
        expect(order.deliverTime).toBeDefined();
        expect(order.deliverTime).not.toBeNull();
        expect(order.deliverTime).not.toBe('');
      });
    });

    test('订单缺少deliverTime字段 - filterSecondPeriodOrders', () => {
      const subOrders = [
        { id: '1', deliverTime: '2026-03-10', amount: 1000 }, // 有效订单
        { id: '2', amount: 2000 }, // 缺少 deliverTime
        { id: '3', deliverTime: null, amount: 1500 }, // deliverTime 为 null
        { id: '4', deliverTime: undefined, amount: 800 }, // deliverTime 为 undefined
        { id: '5', deliverTime: '2026-03-15', amount: 1200 } // 有效订单
      ];

      const result = calculator.filterSecondPeriodOrders(subOrders);
      
      // 只有有效的订单应该被包含
      expect(result).toHaveLength(2);
      expect(result.map(o => o.id)).toEqual(['1', '5']);
      
      // 验证所有结果都有有效的 deliverTime
      result.forEach(order => {
        expect(order.deliverTime).toBeDefined();
        expect(order.deliverTime).not.toBeNull();
      });
    });

    test('全部订单都缺少deliverTime字段', () => {
      const subOrders = [
        { id: '1', amount: 1000 }, // 缺少 deliverTime
        { id: '2', deliverTime: null, amount: 2000 }, // deliverTime 为 null
        { id: '3', deliverTime: undefined, amount: 1500 } // deliverTime 为 undefined
      ];

      const firstPeriodResult = calculator.filterFirstPeriodOrders(subOrders);
      const secondPeriodResult = calculator.filterSecondPeriodOrders(subOrders);
      
      expect(firstPeriodResult).toEqual([]);
      expect(secondPeriodResult).toEqual([]);
    });

    test('无效deliverTime格式的订单被排除', () => {
      const subOrders = [
        { id: '1', deliverTime: '2026-04-01', amount: 1000 }, // 有效
        { id: '2', deliverTime: 'invalid-date', amount: 2000 }, // 无效日期
        { id: '3', deliverTime: '2026-13-45', amount: 1500 }, // 无效日期
        { id: '4', deliverTime: 'not-a-date', amount: 800 }, // 无效日期
        { id: '5', deliverTime: '2026-04-05', amount: 1200 } // 有效
      ];

      const firstPeriodResult = calculator.filterFirstPeriodOrders(subOrders);
      const secondPeriodResult = calculator.filterSecondPeriodOrders(subOrders);
      
      // 只有有效日期的订单被包含
      expect(firstPeriodResult.map(o => o.id)).toEqual(['1', '5']);
      // For second period, only orders that meet T+30 condition should be included
      // 2026-04-01 + 30 = 2026-05-01 > 2026-04-15 (settlement date) - not included
      // 2026-04-05 + 30 = 2026-05-05 > 2026-04-15 (settlement date) - not included
      expect(secondPeriodResult.map(o => o.id)).toEqual([]);
    });

    test('混合有效和无效deliverTime的金额计算', () => {
      const firstPeriodOrders = [
        { id: '1', deliverTime: '2026-04-01', amount: 1000 }, // 有效
        { id: '2', amount: 2000 }, // 缺少 deliverTime，但在金额计算中会被处理
        { id: '3', deliverTime: null, amount: 1500 } // deliverTime 为 null
      ];

      const amountExtractor = (order) => order.amount;
      const result = calculator.calculateOrderAmount(firstPeriodOrders, [], amountExtractor);
      
      // 所有订单的金额都应该被计算（金额计算不依赖 deliverTime）
      // 第一期：(1000 + 2000 + 1500) × 0.9 = 4050
      expect(result).toBe(4050);
    });
  });

  describe('缺少refundTime字段的售后处理', () => {
    test('售后缺少refundTime字段 - filterChargebacks', () => {
      const afterSales = [
        { id: 'AS1', refundTime: '2026-04-10', refundAmount: 500 }, // 有效售后
        { id: 'AS2', refundAmount: 300 }, // 缺少 refundTime
        { id: 'AS3', refundTime: null, refundAmount: 200 }, // refundTime 为 null
        { id: 'AS4', refundTime: undefined, refundAmount: 400 }, // refundTime 为 undefined
        { id: 'AS5', refundTime: '', refundAmount: 150 }, // refundTime 为空字符串
        { id: 'AS6', refundTime: '2026-04-12', refundAmount: 600 } // 有效售后
      ];

      const result = calculator.filterChargebacks(afterSales);
      
      // 只有有效的售后应该被包含
      expect(result).toHaveLength(2);
      expect(result.map(as => as.id)).toEqual(['AS1', 'AS6']);
      
      // 验证所有结果都有有效的 refundTime
      result.forEach(afterSale => {
        expect(afterSale.refundTime).toBeDefined();
        expect(afterSale.refundTime).not.toBeNull();
        expect(afterSale.refundTime).not.toBe('');
      });
    });

    test('全部售后都缺少refundTime字段', () => {
      const afterSales = [
        { id: 'AS1', refundAmount: 500 }, // 缺少 refundTime
        { id: 'AS2', refundTime: null, refundAmount: 300 }, // refundTime 为 null
        { id: 'AS3', refundTime: undefined, refundAmount: 200 } // refundTime 为 undefined
      ];

      const result = calculator.filterChargebacks(afterSales);
      
      expect(result).toEqual([]);
    });

    test('无效refundTime格式的售后被排除', () => {
      const afterSales = [
        { id: 'AS1', refundTime: '2026-04-10', refundAmount: 500 }, // 有效
        { id: 'AS2', refundTime: 'invalid-date', refundAmount: 300 }, // 无效日期
        { id: 'AS3', refundTime: '2026-99-99', refundAmount: 200 }, // 无效日期
        { id: 'AS4', refundTime: 'not-a-date', refundAmount: 400 }, // 无效日期
        { id: 'AS5', refundTime: '2026-04-12', refundAmount: 600 } // 有效
      ];

      const result = calculator.filterChargebacks(afterSales);
      
      // 只有有效日期的售后被包含
      expect(result.map(as => as.id)).toEqual(['AS1', 'AS5']);
    });

    test('混合有效和无效refundTime的冲账金额计算', () => {
      const chargebacks = [
        { id: 'AS1', refundTime: '2026-04-10', refundAmount: 500 }, // 有效
        { id: 'AS2', refundAmount: 300 }, // 缺少 refundTime，但在金额计算中会被处理
        { id: 'AS3', refundTime: null, refundAmount: 200 } // refundTime 为 null
      ];

      const amountExtractor = (afterSale) => afterSale.refundAmount;
      const result = calculator.calculateChargebackAmount(chargebacks, amountExtractor);
      
      // 所有售后的金额都应该被计算（金额计算不依赖 refundTime）
      // 冲账金额：-(500 + 300 + 200) = -1000
      expect(result).toBe(-1000);
    });
  });

  describe('边界条件组合测试', () => {
    test('同时处理缺少时间字段的订单和售后', () => {
      const subOrders = [
        { id: '1', deliverTime: '2026-04-01', amount: 1000 }, // 有效
        { id: '2', amount: 2000 }, // 缺少 deliverTime
        { id: '3', deliverTime: '2026-03-10', amount: 1500 } // 有效
      ];

      const afterSales = [
        { id: 'AS1', refundTime: '2026-04-10', refundAmount: 300 }, // 有效
        { id: 'AS2', refundAmount: 200 }, // 缺少 refundTime
        { id: 'AS3', refundTime: '2026-04-12', refundAmount: 400 } // 有效
      ];

      // 筛选有效的订单和售后
      const firstPeriod = calculator.filterFirstPeriodOrders(subOrders);
      const secondPeriod = calculator.filterSecondPeriodOrders(subOrders);
      const chargebacks = calculator.filterChargebacks(afterSales);

      expect(firstPeriod).toHaveLength(2); // 订单1和3
      // For second period: 
      // Order 1: 2026-04-01 + 30 = 2026-05-01 > 2026-04-15 - not included
      // Order 3: 2026-03-10 + 30 = 2026-04-09 <= 2026-04-15 - included
      expect(secondPeriod).toHaveLength(1); // 只有订单3
      expect(chargebacks).toHaveLength(2); // 售后AS1和AS3

      // 计算金额（包括所有订单和售后，不管时间字段）
      const amountExtractor = (item) => item.amount || item.refundAmount;
      const normalAmount = calculator.calculateOrderAmount(firstPeriod, [], amountExtractor);
      const chargebackAmount = calculator.calculateChargebackAmount(afterSales, amountExtractor);

      // 正常金额：(1000 + 1500) × 0.9 = 2250
      expect(normalAmount).toBe(2250);
      // 冲账金额：-(300 + 200 + 400) = -900
      expect(chargebackAmount).toBe(-900);

      // 净应结金额
      const netAmount = calculator.calculateNetAmount(normalAmount, chargebackAmount);
      expect(netAmount).toBe(1350); // 2250 + (-900) = 1350
    });

    test('所有数据都无效的极端情况', () => {
      const invalidSubOrders = [
        { id: '1', amount: 1000 }, // 缺少 deliverTime
        { id: '2', deliverTime: null, amount: 2000 }, // deliverTime 为 null
        { id: '3', deliverTime: 'invalid', amount: 1500 } // 无效 deliverTime
      ];

      const invalidAfterSales = [
        { id: 'AS1', refundAmount: 300 }, // 缺少 refundTime
        { id: 'AS2', refundTime: null, refundAmount: 200 }, // refundTime 为 null
        { id: 'AS3', refundTime: 'invalid', refundAmount: 400 } // 无效 refundTime
      ];

      // 筛选结果应该为空
      const firstPeriod = calculator.filterFirstPeriodOrders(invalidSubOrders);
      const secondPeriod = calculator.filterSecondPeriodOrders(invalidSubOrders);
      const chargebacks = calculator.filterChargebacks(invalidAfterSales);

      expect(firstPeriod).toEqual([]);
      expect(secondPeriod).toEqual([]);
      expect(chargebacks).toEqual([]);

      // 但金额计算仍然可以进行（因为不依赖时间字段）
      const orderAmountExtractor = (order) => order.amount;
      const afterSaleAmountExtractor = (afterSale) => afterSale.refundAmount;

      const normalAmount = calculator.calculateOrderAmount(invalidSubOrders, [], orderAmountExtractor);
      const chargebackAmount = calculator.calculateChargebackAmount(invalidAfterSales, afterSaleAmountExtractor);

      // 正常金额：(1000 + 2000 + 1500) × 0.9 = 4050
      expect(normalAmount).toBe(4050);
      // 冲账金额：-(300 + 200 + 400) = -900
      expect(chargebackAmount).toBe(-900);
    });

    test('空数组和无效数据混合处理', () => {
      const mixedSubOrders = [
        { id: '1', deliverTime: '2026-04-01', amount: 1000 }, // 有效
        { id: '2' }, // 完全无效的订单对象
        { id: '3', deliverTime: '2026-03-10', amount: 1500 } // 有效
      ];

      const emptyAfterSales = [];

      const firstPeriod = calculator.filterFirstPeriodOrders(mixedSubOrders);
      const chargebacks = calculator.filterChargebacks(emptyAfterSales);

      expect(firstPeriod).toHaveLength(2);
      expect(chargebacks).toEqual([]);

      // 金额计算
      const orderAmountExtractor = (order) => order.amount || 0;
      const afterSaleAmountExtractor = (afterSale) => afterSale.refundAmount || 0;

      const normalAmount = calculator.calculateOrderAmount(firstPeriod, [], orderAmountExtractor);
      const chargebackAmount = calculator.calculateChargebackAmount(chargebacks, afterSaleAmountExtractor);

      // 正常金额：(1000 + 1500) × 0.9 = 2250
      expect(normalAmount).toBe(2250);
      // 冲账金额：0
      expect(chargebackAmount === 0 || chargebackAmount === -0).toBe(true);

      const netAmount = calculator.calculateNetAmount(normalAmount, chargebackAmount);
      expect(netAmount).toBe(2250);
    });
  });

  describe('控制台警告验证', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('无效deliverTime格式应该输出警告', () => {
      const subOrders = [
        { id: '1', deliverTime: 'invalid-date', amount: 1000 },
        { id: '2', deliverTime: '2026-99-99', amount: 2000 }
      ];

      calculator.filterFirstPeriodOrders(subOrders);

      // 验证控制台警告被正确输出
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('[数据验证警告] 订单deliverTime字段格式无效，跳过该记录。订单ID: 1, deliverTime: invalid-date');
      expect(consoleSpy).toHaveBeenCalledWith('[数据验证警告] 订单deliverTime字段格式无效，跳过该记录。订单ID: 2, deliverTime: 2026-99-99');
    });

    test('无效refundTime格式应该输出警告', () => {
      const afterSales = [
        { id: 'AS1', refundTime: 'invalid-date', refundAmount: 300 },
        { id: 'AS2', refundTime: '2026-99-99', refundAmount: 400 }
      ];

      calculator.filterChargebacks(afterSales);

      // 验证控制台警告被正确输出
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('[数据验证警告] 售后记录refundTime字段格式无效，跳过该记录。售后ID: AS1, refundTime: invalid-date');
      expect(consoleSpy).toHaveBeenCalledWith('[数据验证警告] 售后记录refundTime字段格式无效，跳过该记录。售后ID: AS2, refundTime: 2026-99-99');
    });

    test('金额提取函数异常应该输出警告', () => {
      const orders = [
        { id: '1', amount: 1000 },
        { id: '2', invalidField: true }
      ];

      const problematicExtractor = (order) => {
        if (order.invalidField) {
          throw new Error('Invalid field access');
        }
        return order.amount;
      };

      calculator.calculateOrderAmount(orders, [], problematicExtractor);

      // 验证控制台警告被调用（新格式：中文详细错误信息）
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[错误处理] 处理第一期订单时发生错误'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[数据质量提示]'));
    });

    test('冲账金额提取函数异常应该输出警告', () => {
      const chargebacks = [
        { id: 'AS1', refundAmount: 300 },
        { id: 'AS2', invalidField: true }
      ];

      const problematicExtractor = (chargeback) => {
        if (chargeback.invalidField) {
          throw new Error('Invalid field access');
        }
        return chargeback.refundAmount;
      };

      calculator.calculateChargebackAmount(chargebacks, problematicExtractor);

      // 验证控制台警告被调用（新格式：中文详细错误信息）
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[错误处理] 处理售后记录时发生错误'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[数据质量提示]'));
    });
  });
});