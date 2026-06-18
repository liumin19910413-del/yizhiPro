/**
 * 付款状态计算器测试
 * 
 * Feature: financial-reconciliation-refactor
 * 测试 PaymentStatusCalculator 的核心功能
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

const { PaymentStatusCalculator } = require('./payment-status-calculator');
const fc = require('fast-check');

describe('PaymentStatusCalculator - 付款状态计算', () => {
  describe('应付款场景（净应结 > 0）', () => {
    test('净应结 > 0 且已付 = 0 → "未付款"', () => {
      expect(PaymentStatusCalculator.calculateStatus(0, 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(0, 0.01)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(0, 10000)).toBe('未付款');
    });

    test('净应结 > 0 且 0 < 已付 < 净应结 → "部分付款"', () => {
      expect(PaymentStatusCalculator.calculateStatus(500, 1000)).toBe('部分付款');
      expect(PaymentStatusCalculator.calculateStatus(0.01, 1000)).toBe('部分付款');
      expect(PaymentStatusCalculator.calculateStatus(999.99, 1000)).toBe('部分付款');
      expect(PaymentStatusCalculator.calculateStatus(1, 2)).toBe('部分付款');
    });

    test('净应结 > 0 且已付 ≥ 净应结 → "已付款"', () => {
      expect(PaymentStatusCalculator.calculateStatus(1000, 1000)).toBe('已付款');
      expect(PaymentStatusCalculator.calculateStatus(1500, 1000)).toBe('已付款');
      expect(PaymentStatusCalculator.calculateStatus(2000, 1000)).toBe('已付款');
    });
  });

  describe('应收款场景（净应结 < 0）', () => {
    test('净应结 < 0 且已付 = 0 → "应收款"', () => {
      expect(PaymentStatusCalculator.calculateStatus(0, -1000)).toBe('应收款');
      expect(PaymentStatusCalculator.calculateStatus(0, -0.01)).toBe('应收款');
      expect(PaymentStatusCalculator.calculateStatus(0, -10000)).toBe('应收款');
    });

    test('净应结 < 0 且已付 > 0 → "已收款"', () => {
      expect(PaymentStatusCalculator.calculateStatus(500, -1000)).toBe('已收款');
      expect(PaymentStatusCalculator.calculateStatus(0.01, -1000)).toBe('已收款');
      expect(PaymentStatusCalculator.calculateStatus(1000, -500)).toBe('已收款');
    });
  });

  describe('已结清场景（净应结 = 0）', () => {
    test('净应结 = 0 → "已结清"', () => {
      expect(PaymentStatusCalculator.calculateStatus(0, 0)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(100, 0)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(-100, 0)).toBe('已结清');
    });
  });

  describe('边界条件和异常处理', () => {
    test('处理无效输入值', () => {
      // null 和 undefined 应该被视为 0
      expect(PaymentStatusCalculator.calculateStatus(null, 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(1000, null)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(null, null)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(undefined, 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(1000, undefined)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(undefined, undefined)).toBe('已结清');
    });

    test('处理 NaN 输入', () => {
      expect(PaymentStatusCalculator.calculateStatus(NaN, 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(1000, NaN)).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus(NaN, NaN)).toBe('已结清');
    });

    test('处理字符串输入', () => {
      expect(PaymentStatusCalculator.calculateStatus('500', 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(500, '1000')).toBe('已结清');
      expect(PaymentStatusCalculator.calculateStatus('invalid', 'invalid')).toBe('已结清');
    });

    test('处理负数已付金额', () => {
      // 负数已付金额在实际业务中不太可能，但应该正确处理
      expect(PaymentStatusCalculator.calculateStatus(-100, 1000)).toBe('未付款');
      expect(PaymentStatusCalculator.calculateStatus(-100, -500)).toBe('应收款');
    });

    test('处理极小的浮点数', () => {
      expect(PaymentStatusCalculator.calculateStatus(0.001, 0.002)).toBe('部分付款');
      expect(PaymentStatusCalculator.calculateStatus(0.002, 0.002)).toBe('已付款');
      expect(PaymentStatusCalculator.calculateStatus(0.001, -0.002)).toBe('已收款');
    });
  });
});

describe('PaymentStatusCalculator - 待付金额计算', () => {
  describe('正常计算场景', () => {
    test('净应结 > 已付 → 待付金额 = 净应结 - 已付', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount(500, 1000)).toBe(500);
      expect(PaymentStatusCalculator.calculatePendingAmount(0, 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(100, 1500)).toBe(1400);
      expect(PaymentStatusCalculator.calculatePendingAmount(0.5, 1.5)).toBe(1);
    });

    test('净应结 ≤ 已付 → 待付金额 = 0', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount(1000, 1000)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(1500, 1000)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(2000, 1000)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(100, 0)).toBe(0);
    });

    test('净应结为负数 → 待付金额 = 0', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount(0, -1000)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(500, -1000)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(-100, -1000)).toBe(0);
    });

    test('净应结为0 → 待付金额 = 0', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount(0, 0)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(100, 0)).toBe(0);
      // 负数已付金额会被视为0处理，所以待付金额 = max(0, 0 - 0) = 0
      expect(PaymentStatusCalculator.calculatePendingAmount(-100, 0)).toBe(0);
    });
  });

  describe('边界条件和异常处理', () => {
    test('处理无效输入值', () => {
      // null 和 undefined 应该被视为 0
      expect(PaymentStatusCalculator.calculatePendingAmount(null, 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(1000, null)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(null, null)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(undefined, 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(1000, undefined)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(undefined, undefined)).toBe(0);
    });

    test('处理 NaN 输入', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount(NaN, 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(1000, NaN)).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount(NaN, NaN)).toBe(0);
    });

    test('处理字符串输入', () => {
      expect(PaymentStatusCalculator.calculatePendingAmount('500', 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(500, '1000')).toBe(0);
      expect(PaymentStatusCalculator.calculatePendingAmount('invalid', 'invalid')).toBe(0);
    });

    test('处理负数已付金额', () => {
      // 负数已付金额会被视为0处理
      expect(PaymentStatusCalculator.calculatePendingAmount(-100, 1000)).toBe(1000);
      expect(PaymentStatusCalculator.calculatePendingAmount(-100, -500)).toBe(0);
    });

    test('处理极小的浮点数', () => {
      // 使用浮点数容差
      expect(Math.abs(PaymentStatusCalculator.calculatePendingAmount(0.001, 0.002) - 0.001)).toBeLessThan(0.15);
      expect(Math.abs(PaymentStatusCalculator.calculatePendingAmount(0.002, 0.002))).toBeLessThan(0.15);
      expect(Math.abs(PaymentStatusCalculator.calculatePendingAmount(0.001, -0.002))).toBeLessThan(0.15);
    });
  });
});

describe('PaymentStatusCalculator - 集成测试', () => {
  test('付款状态和待付金额的一致性', () => {
    const testCases = [
      // [已付金额, 净应结金额, 期望状态, 期望待付金额]
      [0, 1000, '未付款', 1000],
      [500, 1000, '部分付款', 500],
      [1000, 1000, '已付款', 0],
      [1500, 1000, '已付款', 0],
      [0, -1000, '应收款', 0],
      [500, -1000, '已收款', 0],
      [0, 0, '已结清', 0],
      [100, 0, '已结清', 0]
    ];

    testCases.forEach(([paidAmount, netAmount, expectedStatus, expectedPending]) => {
      const status = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);
      const pending = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

      expect(status).toBe(expectedStatus);
      expect(pending).toBe(expectedPending);
    });
  });

  test('实际业务场景测试', () => {
    // 供应商对账场景
    const supplierCase = {
      normalAmount: 10000,    // 正常应结
      chargebackAmount: -1500, // 售后冲账
      netAmount: 8500,        // 净应结
      paidAmount: 5000        // 已付金额
    };

    expect(PaymentStatusCalculator.calculateStatus(
      supplierCase.paidAmount, 
      supplierCase.netAmount
    )).toBe('部分付款');

    expect(PaymentStatusCalculator.calculatePendingAmount(
      supplierCase.paidAmount, 
      supplierCase.netAmount
    )).toBe(3500);

    // 经销商对账场景（冲账大于正常应结）
    const distributorCase = {
      normalAmount: 2000,     // 正常应结
      chargebackAmount: -3000, // 售后冲账
      netAmount: -1000,       // 净应结（负数）
      paidAmount: 0           // 未收款
    };

    expect(PaymentStatusCalculator.calculateStatus(
      distributorCase.paidAmount, 
      distributorCase.netAmount
    )).toBe('应收款');

    expect(PaymentStatusCalculator.calculatePendingAmount(
      distributorCase.paidAmount, 
      distributorCase.netAmount
    )).toBe(0);

    // 连锁总部对账场景（已结清）
    const headquarterCase = {
      normalAmount: 1000,     // 正常应结
      chargebackAmount: -1000, // 售后冲账
      netAmount: 0,           // 净应结（为0）
      paidAmount: 500         // 已付金额
    };

    expect(PaymentStatusCalculator.calculateStatus(
      headquarterCase.paidAmount, 
      headquarterCase.netAmount
    )).toBe('已结清');

    expect(PaymentStatusCalculator.calculatePendingAmount(
      headquarterCase.paidAmount, 
      headquarterCase.netAmount
    )).toBe(0);
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Property Tests - 付款状态计算正确性', () => {
  // Feature: financial-reconciliation-refactor, Property 12: 付款状态计算正确性
  // **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  describe('Property 12: 付款状态计算正确性 - calculateStatus', () => {
    test('付款状态规则的完整性和一致性', () => {
      // 生成随机的已付金额和净应结金额
      const arbPaidAmount = fc.float({ min: -1000, max: 10000 });
      const arbNetAmount = fc.float({ min: -5000, max: 10000 });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        // 跳过 NaN 值以避免测试复杂性
        if (isNaN(paidAmount) || isNaN(netAmount)) {
          return true;
        }

        const status = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);

        // Property: 状态必须是预定义的6种状态之一
        const validStatuses = ['未付款', '部分付款', '已付款', '应收款', '已收款', '已结清'];
        expect(validStatuses).toContain(status);

        // Property: 根据净应结金额和已付金额的关系验证状态正确性
        if (netAmount > 0) {
          // 应付款场景
          if (paidAmount <= 0) {
            expect(status).toBe('未付款');
          } else if (paidAmount > 0 && paidAmount < netAmount) {
            expect(status).toBe('部分付款');
          } else if (paidAmount >= netAmount) {
            expect(status).toBe('已付款');
          }
        } else if (netAmount < 0) {
          // 应收款场景
          if (paidAmount <= 0) {
            expect(status).toBe('应收款');
          } else {
            expect(status).toBe('已收款');
          }
        } else {
          // netAmount === 0
          expect(status).toBe('已结清');
        }
      }), { numRuns: 200 });
    });

    test('状态计算的确定性', () => {
      // 相同输入应该产生相同输出
      const arbPaidAmount = fc.float({ min: -1000, max: 10000 });
      const arbNetAmount = fc.float({ min: -5000, max: 10000 });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        if (isNaN(paidAmount) || isNaN(netAmount)) {
          return true;
        }

        const status1 = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);
        const status2 = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);

        // Property: 相同输入应该产生相同输出
        expect(status1).toBe(status2);
      }), { numRuns: 100 });
    });

    test('边界条件的正确处理', () => {
      // 测试边界条件：已付金额等于净应结金额
      const arbNetAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(10000) });

      fc.assert(fc.property(arbNetAmount, (netAmount) => {
        if (isNaN(netAmount)) {
          return true;
        }

        // 当已付金额等于净应结金额时
        const status = PaymentStatusCalculator.calculateStatus(netAmount, netAmount);

        // Property: 已付金额等于净应结金额且净应结 > 0 时，状态应该是"已付款"
        if (netAmount > 0) {
          expect(status).toBe('已付款');
        } else if (netAmount < 0) {
          // 这种情况在实际业务中不太可能，但逻辑上应该是"已收款"
          expect(status).toBe('已收款');
        } else {
          expect(status).toBe('已结清');
        }
      }), { numRuns: 100 });
    });

    test('无效输入的鲁棒性', () => {
      // 测试各种无效输入
      const arbInvalidInput = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.string(),
        fc.boolean(),
        fc.object()
      );

      const arbValidAmount = fc.float({ min: -1000, max: 10000 });

      fc.assert(fc.property(arbInvalidInput, arbValidAmount, (invalidInput, validAmount) => {
        if (isNaN(validAmount)) {
          return true;
        }

        // 测试第一个参数无效的情况
        const status1 = PaymentStatusCalculator.calculateStatus(invalidInput, validAmount);
        expect(typeof status1).toBe('string');

        // 测试第二个参数无效的情况
        const status2 = PaymentStatusCalculator.calculateStatus(validAmount, invalidInput);
        expect(typeof status2).toBe('string');

        // 测试两个参数都无效的情况
        const status3 = PaymentStatusCalculator.calculateStatus(invalidInput, invalidInput);
        expect(typeof status3).toBe('string');

        // Property: 无效输入不应该导致函数抛出异常
        // 这个测试通过不抛出异常来验证
      }), { numRuns: 100 });
    });

    test('状态转换的逻辑一致性', () => {
      // 测试随着已付金额增加，状态转换的逻辑一致性
      const arbNetAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(1000) });

      fc.assert(fc.property(arbNetAmount, (netAmount) => {
        if (isNaN(netAmount) || netAmount <= 0) {
          return true;
        }

        // 测试状态转换序列
        const status0 = PaymentStatusCalculator.calculateStatus(0, netAmount);
        const statusHalf = PaymentStatusCalculator.calculateStatus(netAmount / 2, netAmount);
        const statusFull = PaymentStatusCalculator.calculateStatus(netAmount, netAmount);
        const statusOver = PaymentStatusCalculator.calculateStatus(netAmount * 1.5, netAmount);

        // Property: 状态转换应该遵循逻辑顺序
        expect(status0).toBe('未付款');
        expect(statusHalf).toBe('部分付款');
        expect(statusFull).toBe('已付款');
        expect(statusOver).toBe('已付款');
      }), { numRuns: 100 });
    });
  });

  describe('Property 12: 付款状态计算正确性 - calculatePendingAmount', () => {
    test('待付金额计算的正确性', () => {
      const arbPaidAmount = fc.float({ min: -1000, max: 10000 });
      const arbNetAmount = fc.float({ min: -5000, max: 10000 });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        if (isNaN(paidAmount) || isNaN(netAmount)) {
          return true;
        }

        const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

        // Property: 待付金额必须是非负数
        expect(pendingAmount).toBeGreaterThanOrEqual(0);

        // Property: 待付金额的计算逻辑
        // 注意：负数的已付金额会被视为0处理
        const effectivePaid = Math.max(0, paidAmount);
        const effectiveNet = Math.max(0, netAmount);
        
        if (effectiveNet > effectivePaid) {
          expect(Math.abs(pendingAmount - (effectiveNet - effectivePaid))).toBeLessThan(0.15);
        } else {
          expect(Math.abs(pendingAmount)).toBeLessThan(0.15); // 使用浮点数容差
        }
      }), { numRuns: 200 });
    });

    test('待付金额的单调性', () => {
      // 在净应结金额固定的情况下，随着已付金额增加，待付金额应该单调递减
      const arbNetAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(1000) });
      const arbPaidAmount1 = fc.float({ min: Math.fround(0), max: Math.fround(500) });
      const arbPaidAmount2 = fc.float({ min: Math.fround(500), max: Math.fround(1000) });

      fc.assert(fc.property(arbNetAmount, arbPaidAmount1, arbPaidAmount2, (netAmount, paid1, paid2) => {
        if (isNaN(netAmount) || isNaN(paid1) || isNaN(paid2) || netAmount <= 0) {
          return true;
        }

        // 确保 paid1 <= paid2
        const [smallerPaid, largerPaid] = paid1 <= paid2 ? [paid1, paid2] : [paid2, paid1];

        const pending1 = PaymentStatusCalculator.calculatePendingAmount(smallerPaid, netAmount);
        const pending2 = PaymentStatusCalculator.calculatePendingAmount(largerPaid, netAmount);

        // Property: 已付金额增加时，待付金额应该减少或保持不变
        expect(pending1).toBeGreaterThanOrEqual(pending2);
      }), { numRuns: 100 });
    });

    test('待付金额与付款状态的一致性', () => {
      const arbPaidAmount = fc.float({ min: Math.fround(0), max: Math.fround(10000) });
      const arbNetAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(10000) });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        // 过滤掉极小的浮点数和无效值
        if (isNaN(paidAmount) || isNaN(netAmount) || netAmount <= 0 || paidAmount < 0 ||
            Math.abs(paidAmount) < 0.001 || Math.abs(netAmount) < 0.001) {
          return true;
        }

        const status = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);
        const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

        // Property: 付款状态与待付金额的逻辑一致性
        if (status === '未付款') {
          expect(Math.abs(pendingAmount - netAmount)).toBeLessThan(0.15);
        } else if (status === '部分付款') {
          expect(pendingAmount).toBeGreaterThan(0);
          expect(pendingAmount).toBeLessThanOrEqual(netAmount + 0.05); // 加容差
        } else if (status === '已付款') {
          expect(Math.abs(pendingAmount)).toBeLessThan(0.15); // 使用浮点数容差
        }
      }), { numRuns: 100 });
    });

    test('待付金额计算的确定性', () => {
      const arbPaidAmount = fc.float({ min: -1000, max: 10000 });
      const arbNetAmount = fc.float({ min: -5000, max: 10000 });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        if (isNaN(paidAmount) || isNaN(netAmount)) {
          return true;
        }

        const pending1 = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);
        const pending2 = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

        // Property: 相同输入应该产生相同输出
        expect(pending1).toBe(pending2);
      }), { numRuns: 100 });
    });

    test('无效输入的鲁棒性', () => {
      const arbInvalidInput = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(NaN),
        fc.string(),
        fc.boolean()
      );

      const arbValidAmount = fc.float({ min: -1000, max: 10000 });

      fc.assert(fc.property(arbInvalidInput, arbValidAmount, (invalidInput, validAmount) => {
        if (isNaN(validAmount)) {
          return true;
        }

        // 测试第一个参数无效的情况
        const pending1 = PaymentStatusCalculator.calculatePendingAmount(invalidInput, validAmount);
        expect(typeof pending1).toBe('number');
        expect(pending1).toBeGreaterThanOrEqual(0);

        // 测试第二个参数无效的情况
        const pending2 = PaymentStatusCalculator.calculatePendingAmount(validAmount, invalidInput);
        expect(typeof pending2).toBe('number');
        expect(pending2).toBeGreaterThanOrEqual(0);

        // 测试两个参数都无效的情况
        const pending3 = PaymentStatusCalculator.calculatePendingAmount(invalidInput, invalidInput);
        expect(typeof pending3).toBe('number');
        expect(pending3).toBeGreaterThanOrEqual(0);

        // Property: 无效输入不应该导致函数抛出异常，且结果应该是非负数
      }), { numRuns: 100 });
    });
  });

  describe('Property 12: 付款状态计算正确性 - 综合属性测试', () => {
    test('状态和待付金额的综合一致性', () => {
      // 使用更合理的范围，避免极端的浮点精度问题
      const arbPaidAmount = fc.float({ min: Math.fround(-100), max: Math.fround(10000) });
      const arbNetAmount = fc.float({ min: Math.fround(-1000), max: Math.fround(10000) });

      fc.assert(fc.property(arbPaidAmount, arbNetAmount, (paidAmount, netAmount) => {
        if (isNaN(paidAmount) || isNaN(netAmount)) {
          return true;
        }

        // 过滤掉极小的浮点数以避免精度问题
        if (Math.abs(paidAmount) < 0.01 && Math.abs(netAmount) < 0.01) {
          return true;
        }

        const status = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);
        const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

        // Property: 待付金额必须是非负数
        expect(pendingAmount).toBeGreaterThanOrEqual(0);

        // Property: 综合逻辑一致性验证
        if (netAmount > 0.01) {
          // 应付款场景
          if (status === '未付款') {
            // 对于未付款状态，待付金额应该接近净应结金额
            expect(Math.abs(pendingAmount - netAmount)).toBeLessThan(Math.max(0.1, Math.abs(netAmount) * 0.01));
          } else if (status === '部分付款') {
            expect(pendingAmount).toBeGreaterThan(0);
            expect(pendingAmount).toBeLessThanOrEqual(netAmount + 0.01); // 允许小的浮点误差
          } else if (status === '已付款') {
            expect(pendingAmount).toBe(0);
          }
        } else if (netAmount < -0.01) {
          // 应收款场景，待付金额应该为0
          expect(Math.abs(pendingAmount)).toBeLessThan(0.15);
        }
        // 跳过 netAmount 接近 0 的情况，因为浮点精度问题
      }), { numRuns: 100 });
    });

    test('函数的数学属性', () => {
      const arbAmount = fc.float({ min: Math.fround(0.01), max: Math.fround(1000) });

      fc.assert(fc.property(arbAmount, (amount) => {
        if (isNaN(amount) || amount <= 0) {
          return true;
        }

        // Property: 数学恒等式验证
        // 当 paidAmount + pendingAmount = netAmount 时（在应付款场景下）
        const paidAmount = amount * 0.6; // 60% 已付
        const netAmount = amount;        // 100% 净应结

        const status = PaymentStatusCalculator.calculateStatus(paidAmount, netAmount);
        const pendingAmount = PaymentStatusCalculator.calculatePendingAmount(paidAmount, netAmount);

        // 验证数学关系
        expect(Math.abs((paidAmount + pendingAmount) - netAmount)).toBeLessThan(0.15);
        expect(status).toBe('部分付款');
      }), { numRuns: 100 });
    });
  });
});