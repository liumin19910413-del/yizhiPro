/**
 * 金额格式化工具测试（Amount Formatter Tests）
 * 
 * Feature: financial-reconciliation-refactor
 * 测试金额格式化功能的正确性
 */

const { AmountFormatter } = require('./amount-formatter');

describe('AmountFormatter', () => {
  describe('format()', () => {
    test('should format positive amounts correctly', () => {
      expect(AmountFormatter.format(1234.56)).toBe('¥1,234.56');
      expect(AmountFormatter.format(1000)).toBe('¥1,000.00');
      expect(AmountFormatter.format(123456789.99)).toBe('¥123,456,789.99');
    });

    test('should format negative amounts correctly', () => {
      expect(AmountFormatter.format(-1234.56)).toBe('-¥1,234.56');
      expect(AmountFormatter.format(-1000)).toBe('-¥1,000.00');
      expect(AmountFormatter.format(-123456789.99)).toBe('-¥123,456,789.99');
    });

    test('should format zero amount correctly', () => {
      expect(AmountFormatter.format(0)).toBe('¥0.00');
      expect(AmountFormatter.format(-0)).toBe('¥0.00');
    });

    test('should handle small amounts correctly', () => {
      expect(AmountFormatter.format(0.01)).toBe('¥0.01');
      expect(AmountFormatter.format(0.99)).toBe('¥0.99');
      expect(AmountFormatter.format(-0.01)).toBe('-¥0.01');
    });

    test('should add thousand separators correctly', () => {
      expect(AmountFormatter.format(1000)).toBe('¥1,000.00');
      expect(AmountFormatter.format(10000)).toBe('¥10,000.00');
      expect(AmountFormatter.format(100000)).toBe('¥100,000.00');
      expect(AmountFormatter.format(1000000)).toBe('¥1,000,000.00');
    });

    test('should preserve two decimal places', () => {
      expect(AmountFormatter.format(1234)).toBe('¥1,234.00');
      expect(AmountFormatter.format(1234.5)).toBe('¥1,234.50');
      expect(AmountFormatter.format(1234.567)).toBe('¥1,234.57'); // 四舍五入
    });

    test('should handle invalid inputs gracefully', () => {
      expect(AmountFormatter.format(null)).toBe('¥0.00');
      expect(AmountFormatter.format(undefined)).toBe('¥0.00');
      expect(AmountFormatter.format(NaN)).toBe('¥0.00');
      expect(AmountFormatter.format('invalid')).toBe('¥0.00');
    });
  });

  describe('formatRed()', () => {
    test('should format positive amounts with red color', () => {
      const result = AmountFormatter.formatRed(1234.56);
      expect(result).toBe('<span style="color: #e74c3c;">¥1,234.56</span>');
    });

    test('should format negative amounts with red color', () => {
      const result = AmountFormatter.formatRed(-1234.56);
      expect(result).toBe('<span style="color: #e74c3c;">-¥1,234.56</span>');
    });

    test('should format zero with red color', () => {
      const result = AmountFormatter.formatRed(0);
      expect(result).toBe('<span style="color: #e74c3c;">¥0.00</span>');
    });

    test('should handle invalid inputs gracefully', () => {
      const result = AmountFormatter.formatRed(null);
      expect(result).toBe('<span style="color: #e74c3c;">¥0.00</span>');
    });
  });

  describe('Edge cases', () => {
    test('should handle very large numbers', () => {
      const largeNumber = 999999999999.99;
      expect(AmountFormatter.format(largeNumber)).toBe('¥999,999,999,999.99');
    });

    test('should handle very small numbers', () => {
      const smallNumber = 0.001;
      expect(AmountFormatter.format(smallNumber)).toBe('¥0.00'); // 四舍五入到两位小数
    });

    test('should handle floating point precision issues', () => {
      // JavaScript浮点数精度问题测试
      expect(AmountFormatter.format(0.1 + 0.2)).toBe('¥0.30');
    });
  });
});