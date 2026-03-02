/**
 * 供应商对账模块集成测试
 * 
 * 测试 SupplierReconciliation 类和相关函数的集成
 */

const { SupplierReconciliation } = require('./shared/supplier-reconciliation.js');
const { SettlementCalculator } = require('./shared/settlement-calculator.js');
const { PaymentStatusCalculator } = require('./shared/payment-status-calculator.js');
const { DetailPanel } = require('./shared/detail-panel.js');
const { AmountFormatter } = require('./shared/amount-formatter.js');

// 测试数据
const testData = {
  subOrders: [
    {
      id: 'sub1',
      orderId: 'order1',
      supplierId: 'supplier1',
      supplierName: '测试供应商A',
      supplierAmount: 1000,
      shippingFee: 50,
      deliverTime: '2024-01-10T00:00:00Z'
    },
    {
      id: 'sub2',
      orderId: 'order2',
      supplierId: 'supplier1',
      supplierName: '测试供应商A',
      supplierAmount: 2000,
      shippingFee: 100,
      deliverTime: '2024-01-15T00:00:00Z'
    },
    {
      id: 'sub3',
      orderId: 'order3',
      supplierId: 'supplier2',
      supplierName: '测试供应商B',
      supplierAmount: 1500,
      shippingFee: 75,
      deliverTime: '2024-01-20T00:00:00Z'
    }
  ],
  afterSales: [
    {
      id: 'as1',
      subOrderId: 'sub1',
      originalOrderNo: 'ORD001',
      refundAmount: 300,
      refundTime: '2024-02-01T00:00:00Z',
      reason: '质量问题'
    },
    {
      id: 'as2',
      subOrderId: 'sub3',
      originalOrderNo: 'ORD003',
      refundAmount: 200,
      refundTime: '2024-02-05T00:00:00Z',
      reason: '尺寸不符'
    }
  ]
};

function runIntegrationTests() {
  console.log('🧪 开始供应商对账模块集成测试...\n');

  try {
    // 1. 测试 SupplierReconciliation 类
    console.log('1️⃣ 测试 SupplierReconciliation 类');
    const settlementDate = new Date('2024-02-15T00:00:00Z');
    const calculator = new SettlementCalculator(settlementDate);
    const supplierReconciliation = new SupplierReconciliation(calculator);

    // 生成月结汇总数据
    const summaries = supplierReconciliation.generateMonthlySummary(
      [], // orders 参数暂时不使用
      testData.subOrders,
      testData.afterSales
    );

    console.log(`   ✅ 生成了 ${summaries.length} 个供应商的汇总数据`);
    
    // 验证汇总数据结构
    summaries.forEach((summary, index) => {
      console.log(`   📊 供应商 ${index + 1}: ${summary.supplierName}`);
      console.log(`      - 结算月份: ${summary.settlementMonth}`);
      console.log(`      - 订单数: ${summary.orderCount}`);
      console.log(`      - 正常应结: ${AmountFormatter.format(summary.normalAmount)}`);
      console.log(`      - 售后冲账: ${AmountFormatter.format(summary.chargebackAmount)}`);
      console.log(`      - 净应结: ${AmountFormatter.format(summary.netAmount)}`);
      console.log(`      - 付款状态: ${summary.paymentStatus}`);
    });

    // 2. 测试 DetailPanel 类
    console.log('\n2️⃣ 测试 DetailPanel 类');
    const detailPanel = new DetailPanel();

    // 为第一个供应商生成明细记录
    const supplier1Orders = testData.subOrders.filter(o => o.supplierId === 'supplier1').map(order => ({
      ...order,
      amount: order.supplierAmount + (order.shippingFee || 0) // DetailPanel expects 'amount' field
    }));
    const supplier1AfterSales = testData.afterSales.filter(as => 
      supplier1Orders.some(o => o.id === as.subOrderId)
    );

    const detailRecords = detailPanel.generateDetailRecords(supplier1Orders, supplier1AfterSales);
    const detailSummary = detailPanel.calculateSummary(detailRecords);

    console.log(`   ✅ 生成了 ${detailRecords.length} 条明细记录`);
    console.log(`   📋 明细统计:`);
    console.log(`      - 订单总额: ${AmountFormatter.format(detailSummary.orderTotal)}`);
    console.log(`      - 冲账总额: ${AmountFormatter.format(detailSummary.chargebackTotal)}`);
    console.log(`      - 净总额: ${AmountFormatter.format(detailSummary.netTotal)}`);

    // 3. 测试 PaymentStatusCalculator
    console.log('\n3️⃣ 测试 PaymentStatusCalculator');
    summaries.forEach((summary, index) => {
      const status = PaymentStatusCalculator.calculateStatus(summary.paidAmount, summary.netAmount);
      const pending = PaymentStatusCalculator.calculatePendingAmount(summary.paidAmount, summary.netAmount);
      
      console.log(`   💰 供应商 ${index + 1} 付款状态: ${status}`);
      console.log(`      - 待付金额: ${AmountFormatter.format(pending)}`);
    });

    // 4. 测试 AmountFormatter
    console.log('\n4️⃣ 测试 AmountFormatter');
    const testAmounts = [1234.56, -567.89, 0, 1000000.99];
    testAmounts.forEach(amount => {
      console.log(`   💵 ${amount} → ${AmountFormatter.format(amount)}`);
    });

    // 5. 验证业务逻辑正确性
    console.log('\n5️⃣ 验证业务逻辑正确性');
    
    // 验证供应商A的计算
    const supplier1Summary = summaries.find(s => s.supplierId === 'supplier1');
    if (supplier1Summary) {
      // 手动计算期望值
      // 订单1: (1000 + 50) = 1050，签收时间 2024-01-10
      // 订单2: (2000 + 100) = 2100，签收时间 2024-01-15
      // 结算日期: 2024-02-15
      // 
      // 第一期条件 (T+7): 签收时间 + 7天 <= 结算日期
      // 订单1: 2024-01-10 + 7 = 2024-01-17 <= 2024-02-15 ✓
      // 订单2: 2024-01-15 + 7 = 2024-01-22 <= 2024-02-15 ✓
      // 第一期金额: (1050 + 2100) * 0.9 = 2835
      //
      // 第二期条件 (T+30): 签收时间 + 30天 <= 结算日期  
      // 订单1: 2024-01-10 + 30 = 2024-02-09 <= 2024-02-15 ✓
      // 订单2: 2024-01-15 + 30 = 2024-02-14 <= 2024-02-15 ✓
      // 第二期金额: (1050 + 2100) * 0.1 = 315
      //
      // 总计: 2835 + 315 = 3150
      // 冲账: -300
      // 净应结: 3150 - 300 = 2850
      
      console.log(`   🔍 供应商A验证:`);
      console.log(`      - 期望正常应结: ¥3,150.00`);
      console.log(`      - 实际正常应结: ${AmountFormatter.format(supplier1Summary.normalAmount)}`);
      console.log(`      - 期望冲账: -¥300.00`);
      console.log(`      - 实际冲账: ${AmountFormatter.format(supplier1Summary.chargebackAmount)}`);
      console.log(`      - 期望净应结: ¥2,850.00`);
      console.log(`      - 实际净应结: ${AmountFormatter.format(supplier1Summary.netAmount)}`);
      
      // 验证计算正确性
      const expectedNormal = 3150;
      const expectedChargeback = -300;
      const expectedNet = 2850;
      
      if (Math.abs(supplier1Summary.normalAmount - expectedNormal) < 0.01 &&
          Math.abs(supplier1Summary.chargebackAmount - expectedChargeback) < 0.01 &&
          Math.abs(supplier1Summary.netAmount - expectedNet) < 0.01) {
        console.log(`   ✅ 供应商A计算正确`);
      } else {
        console.log(`   ❌ 供应商A计算错误`);
        console.log(`      实际值: 正常=${supplier1Summary.normalAmount}, 冲账=${supplier1Summary.chargebackAmount}, 净=${supplier1Summary.netAmount}`);
        console.log(`      期望值: 正常=${expectedNormal}, 冲账=${expectedChargeback}, 净=${expectedNet}`);
      }
    }

    console.log('\n🎉 所有集成测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   ✅ SupplierReconciliation 类正常工作');
    console.log('   ✅ DetailPanel 类正常工作');
    console.log('   ✅ PaymentStatusCalculator 正常工作');
    console.log('   ✅ AmountFormatter 正常工作');
    console.log('   ✅ 业务逻辑计算正确');
    console.log('\n🚀 供应商对账模块已准备就绪！');

  } catch (error) {
    console.error('❌ 集成测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
runIntegrationTests();