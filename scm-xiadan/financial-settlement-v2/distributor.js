/**
 * 经销商对账模块
 * 
 * 按照架构设计实现：
 * - 数据源：从订单清分记录聚合
 * - 清分方式分解：空中分账 + 保证金扣除
 * - 可追溯：能追溯到每个订单
 */

function renderDistributor(container) {
    // 1. 获取经销商月结汇总数据
    const summaries = getDistributorSummaries();
    
    if (summaries.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px;">🏢</div>
                <div style="font-size: 16px; margin-bottom: 20px;">暂无经销商对账数据</div>
                <button class="btn btn-primary" onclick="generateMockDataV2()">🎲 生成模拟数据</button>
            </div>
        `;
        return;
    }
    
    // 2. 计算汇总统计
    const totalStats = {
        distributorCount: summaries.length,
        totalOrders: summaries.reduce((sum, s) => sum + s.orderCount, 0),
        totalNormal: summaries.reduce((sum, s) => sum + s.normalAmount, 0),
        totalChargeback: summaries.reduce((sum, s) => sum + s.chargebackAmount, 0),
        totalNet: summaries.reduce((sum, s) => sum + s.netAmount, 0),
        totalAirSplit: summaries.reduce((sum, s) => sum + s.airSplitAmount, 0),
        totalDeposit: summaries.reduce((sum, s) => sum + s.depositDeductAmount, 0)
    };
    
    // 3. 渲染页面
    container.innerHTML = `
        <!-- 汇总统计 -->
        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
            <div class="stat-card" style="background: #1890ff; color: white;">
                <div class="label">经销商数量</div>
                <div class="value">${totalStats.distributorCount}</div>
            </div>
            <div class="stat-card" style="background: #722ed1; color: white;">
                <div class="label">订单数量</div>
                <div class="value">${totalStats.totalOrders}</div>
            </div>
            <div class="stat-card" style="background: #52c41a; color: white;">
                <div class="label">正常应结</div>
                <div class="value">¥${totalStats.totalNormal.toFixed(2)}</div>
            </div>
            <div class="stat-card" style="background: #ff4d4f; color: white;">
                <div class="label">售后冲账</div>
                <div class="value">¥${totalStats.totalChargeback.toFixed(2)}</div>
            </div>
            <div class="stat-card" style="background: #1890ff; color: white;">
                <div class="label">净应结</div>
                <div class="value">¥${totalStats.totalNet.toFixed(2)}</div>
            </div>
            <div class="stat-card" style="background: #e6f7ff; color: #1890ff; border: 2px solid #1890ff;">
                <div class="label">空中分账</div>
                <div class="value">¥${totalStats.totalAirSplit.toFixed(2)}</div>
                <div class="note">已到账</div>
            </div>
            <div class="stat-card" style="background: #fff7e6; color: #fa8c16; border: 2px solid #fa8c16;">
                <div class="label">保证金扣除</div>
                <div class="value">¥${totalStats.totalDeposit.toFixed(2)}</div>
                <div class="note">待补付</div>
            </div>
        </div>
        
        <!-- 月结汇总表 -->
        <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 15px;">📊 经销商月结汇总</h3>
            ${renderDistributorTable(summaries)}
        </div>
    `;
}

/**
 * 获取经销商月结汇总数据
 */
function getDistributorSummaries() {
    const summaries = [];
    
    // 获取所有经销商
    const distributors = getDistributors();
    
    distributors.forEach(distributor => {
        // 获取该经销商的所有清分记录
        const records = getDistributorClearingRecords(distributor.id);
        
        if (records.length === 0) return;
        
        // 分离正常记录和退款记录
        const normalRecords = records.filter(r => r.recordType === 'normal');
        const refundRecords = records.filter(r => r.recordType === 'refund');
        
        // 计算正常应结
        const normalAmount = normalRecords.reduce((sum, r) => sum + r.distributorAmount, 0);
        
        // 计算售后冲账
        const chargebackAmount = refundRecords.reduce((sum, r) => sum + r.distributorAmount, 0);
        
        // 计算净应结
        const netAmount = normalAmount + chargebackAmount;
        
        // 计算空中分账和保证金扣除（核心算法）
        const { airSplit, depositDeduct } = calculateDistributorClearing(records);
        
        // 计算付款状态
        const paidAmount = airSplit;  // 空中分账已自动到账
        const pendingAmount = depositDeduct;  // 保证金扣除待补付
        
        let paymentStatus = '未付款';
        if (paidAmount > 0 && pendingAmount > 0) {
            paymentStatus = '部分付款';
        } else if (pendingAmount === 0 && paidAmount > 0) {
            paymentStatus = '已付款';
        }
        
        summaries.push({
            distributorId: distributor.id,
            distributorName: distributor.name,
            settlementMonth: '2026-01',  // 简化处理，实际应该按月分组
            orderCount: new Set(records.map(r => r.subOrderId)).size,
            normalAmount,
            chargebackAmount,
            netAmount,
            airSplitAmount: airSplit,
            depositDeductAmount: depositDeduct,
            paidAmount,
            pendingAmount,
            paymentStatus
        });
    });
    
    return summaries;
}

/**
 * 获取经销商的清分记录
 */
function getDistributorClearingRecords(distributorId) {
    const records = [];
    
    // 获取该经销商的所有订单
    const orders = DB.orders.filter(o => o.distributorId === distributorId);
    
    orders.forEach(order => {
        const subOrders = DB.subOrders.filter(so => 
            order.subOrderIds && order.subOrderIds.includes(so.id)
        );
        
        subOrders.forEach(subOrder => {
            if (!subOrder.clearing || !subOrder.items) return;
            
            subOrder.items.forEach(item => {
                if (!item.clearing) return;
                
                const clearing = item.clearing;
                
                records.push({
                    subOrderId: subOrder.id,
                    skuId: item.skuId,
                    distributorAmount: clearing.distributorAmount || 0,
                    platformClearing: clearing.clearingDetails?.platform || {},
                    recordType: subOrder.isRefund ? 'refund' : 'normal'
                });
            });
        });
    });
    
    return records;
}

/**
 * 计算经销商的空中分账和保证金扣除（核心算法）
 * 
 * 逻辑：
 * 1. 经销商分成 = 平台货款 × 20%
 * 2. 如果平台货款全部空中分账，则经销商分成也全部空中分账
 * 3. 如果平台货款部分保证金扣除，则经销商分成也按比例保证金扣除
 */
function calculateDistributorClearing(records) {
    let totalAirSplit = 0;
    let totalDepositDeduct = 0;
    
    records.forEach(record => {
        const distributorAmount = record.distributorAmount;
        const platformClearing = record.platformClearing;
        
        if (!platformClearing || !platformClearing.amount) {
            // 如果没有清分明细，假设全部空中分账
            totalAirSplit += distributorAmount;
            return;
        }
        
        // 计算平台货款的清分比例
        const platformTotal = platformClearing.amount;
        const platformSplit = platformClearing.splitAmount || 0;
        const platformDeposit = platformClearing.depositAmount || 0;
        
        const splitRatio = platformTotal > 0 ? platformSplit / platformTotal : 0;
        const depositRatio = platformTotal > 0 ? platformDeposit / platformTotal : 0;
        
        // 按比例计算经销商的空中分账和保证金扣除
        const distributorSplit = distributorAmount * splitRatio;
        const distributorDeposit = distributorAmount * depositRatio;
        
        totalAirSplit += distributorSplit;
        totalDepositDeduct += distributorDeposit;
    });
    
    return {
        airSplit: Math.round(totalAirSplit * 100) / 100,
        depositDeduct: Math.round(totalDepositDeduct * 100) / 100
    };
}

/**
 * 获取所有经销商
 */
function getDistributors() {
    const distributorMap = new Map();
    
    DB.orders.forEach(order => {
        if (order.distributorId && order.distributorName) {
            distributorMap.set(order.distributorId, {
                id: order.distributorId,
                name: order.distributorName
            });
        }
    });
    
    return Array.from(distributorMap.values());
}

/**
 * 渲染经销商对账表格
 */
function renderDistributorTable(summaries) {
    return `
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>结算月份</th>
                        <th>经销商名称</th>
                        <th>订单数</th>
                        <th>正常应结</th>
                        <th>售后冲账</th>
                        <th style="background: #e6f7ff;">空中分账</th>
                        <th style="background: #fff7e6;">保证金扣除</th>
                        <th>净应结</th>
                        <th>已付</th>
                        <th>待付</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaries.map(s => `
                        <tr>
                            <td style="font-weight: 600;">${s.settlementMonth}</td>
                            <td style="font-weight: 500;">${s.distributorName}</td>
                            <td>${s.orderCount}</td>
                            <td class="amount-positive">¥${s.normalAmount.toFixed(2)}</td>
                            <td class="amount-negative">¥${s.chargebackAmount.toFixed(2)}</td>
                            <td style="background: #e6f7ff; color: #1890ff; font-weight: 600;">
                                ¥${s.airSplitAmount.toFixed(2)}
                                <div style="font-size: 10px; color: #999; margin-top: 2px;">已到账</div>
                            </td>
                            <td style="background: #fff7e6; color: #fa8c16; font-weight: 600;">
                                ¥${s.depositDeductAmount.toFixed(2)}
                                <div style="font-size: 10px; color: #999; margin-top: 2px;">待补付</div>
                            </td>
                            <td class="amount-neutral">¥${s.netAmount.toFixed(2)}</td>
                            <td class="amount-positive">¥${s.paidAmount.toFixed(2)}</td>
                            <td class="amount-negative">¥${s.pendingAmount.toFixed(2)}</td>
                            <td>
                                <span class="status-badge ${getStatusClass(s.paymentStatus)}">
                                    ${s.paymentStatus}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-primary" onclick="showDistributorDetail('${s.distributorId}')">
                                    📋 明细
                                </button>
                                ${s.depositDeductAmount > 0 ? `
                                <button class="btn btn-success" onclick="registerPayment('${s.distributorId}')">
                                    💰 登记补付
                                </button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * 获取状态样式类
 */
function getStatusClass(status) {
    switch(status) {
        case '未付款': return 'status-unpaid';
        case '部分付款': return 'status-partial';
        case '已付款': return 'status-paid';
        default: return 'status-unpaid';
    }
}

/**
 * 显示经销商明细
 */
function showDistributorDetail(distributorId) {
    alert(`查看经销商明细：${distributorId}\n\n功能开发中...`);
}

/**
 * 登记补付
 */
function registerPayment(distributorId) {
    alert(`登记保证金补付：${distributorId}\n\n功能开发中...`);
}
