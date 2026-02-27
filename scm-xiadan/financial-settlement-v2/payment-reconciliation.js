function getPaymentReconciliationStats(range) {
    const orders = getAllOrders() || [];
    const filtered = orders.filter(o => {
        if (!o.payTime) return false;
        const t = new Date(o.payTime).getTime();
        if (range.start && t < range.start) return false;
        if (range.end && t > range.end) return false;
        return true;
    });
    const result = {};
    filtered.forEach(o => {
        const channel = o.payChannel || o.paymentPlan?.cashPayMethod || 'wechat';
        const key = channel;
        if (!result[key]) {
            result[key] = {
                channel,
                orderAmount: 0,
                orderCount: 0,
                paidAmount: 0,
                paidCount: 0
            };
        }
        const amount = o.payAmount || o.totalAmount || 0;
        result[key].orderAmount += amount;
        result[key].orderCount += 1;
        result[key].paidAmount += amount;
        result[key].paidCount += 1;
    });
    return Object.values(result);
}

function renderPaymentReconciliation(container) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const range = {
        start: new Date(sevenDaysAgo + 'T00:00:00').getTime(),
        end: new Date(today + 'T23:59:59').getTime()
    };
    const stats = getPaymentReconciliationStats(range);
    const totalOrderAmount = stats.reduce((sum, s) => sum + s.orderAmount, 0);
    const totalPaidAmount = stats.reduce((sum, s) => sum + s.paidAmount, 0);
    const diffAmount = totalOrderAmount - totalPaidAmount;
    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
            <span style="font-size:13px;color:#666;">支付时间：</span>
            <input id="paymentReconcileStart" type="date" value="${sevenDaysAgo}" style="padding:6px 10px;border:1px solid #d9d9d9;border-radius:4px;">
            <span style="color:#999;">至</span>
            <input id="paymentReconcileEnd" type="date" value="${today}" style="padding:6px 10px;border:1px solid #d9d9d9;border-radius:4px;">
            <button class="btn btn-primary" onclick="applyPaymentReconciliationFilter()">🔍 查询</button>
            <button class="btn btn-default" onclick="resetPaymentReconciliationFilter()">🔄 重置</button>
        </div>
        <div class="stats-grid" style="margin-bottom:16px;">
            <div class="stat-card">
                <div class="stat-value">¥${totalOrderAmount.toFixed(2)}</div>
                <div class="stat-label">订单应收金额</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">¥${totalPaidAmount.toFixed(2)}</div>
                <div class="stat-label">渠道实收金额</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color:${Math.abs(diffAmount) < 0.01 ? '#52c41a' : '#ff4d4f'};">¥${diffAmount.toFixed(2)}</div>
                <div class="stat-label">差异金额（订单 - 实收）</div>
            </div>
        </div>
        <div style="border:1px solid #f0f0f0;border-radius:6px;overflow:hidden;">
            <table>
                <thead>
                    <tr>
                        <th style="width:140px;">支付渠道</th>
                        <th style="width:160px;">订单金额（含笔数）</th>
                        <th style="width:160px;">实收金额（含笔数）</th>
                        <th style="width:140px;">差异金额</th>
                        <th style="width:120px;">对账状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.length === 0 ? `
                        <tr>
                            <td colspan="5" style="text-align:center;color:#999;padding:24px 0;">当前时间范围内暂无支付记录</td>
                        </tr>
                    ` : stats.map(s => {
                        const diff = s.orderAmount - s.paidAmount;
                        const ok = Math.abs(diff) < 0.01;
                        const channelName = s.channel === 'alipay' ? '支付宝' : '微信';
                        return `
                            <tr>
                                <td>${channelName}</td>
                                <td>
                                    <div class="amount-neutral">¥${s.orderAmount.toFixed(2)}</div>
                                    <div style="font-size:11px;color:#999;">含 ${s.orderCount} 笔订单</div>
                                </td>
                                <td>
                                    <div class="amount-neutral">¥${s.paidAmount.toFixed(2)}</div>
                                    <div style="font-size:11px;color:#999;">含 ${s.paidCount} 笔支付</div>
                                </td>
                                <td>
                                    <span class="${ok ? 'amount-positive' : 'amount-negative'}">¥${diff.toFixed(2)}</span>
                                </td>
                                <td>
                                    <span class="status-badge ${ok ? 'status-paid' : 'status-unpaid'}">
                                        ${ok ? '已平' : '未平'}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function applyPaymentReconciliationFilter() {
    const container = document.getElementById('orderReconciliationContent');
    if (!container) return;
    const startInput = document.getElementById('paymentReconcileStart');
    const endInput = document.getElementById('paymentReconcileEnd');
    if (!startInput || !endInput) return;
    const start = startInput.value ? new Date(startInput.value + 'T00:00:00').getTime() : null;
    const end = endInput.value ? new Date(endInput.value + 'T23:59:59').getTime() : null;
    const stats = getPaymentReconciliationStats({ start, end });
    const totalOrderAmount = stats.reduce((sum, s) => sum + s.orderAmount, 0);
    const totalPaidAmount = stats.reduce((sum, s) => sum + s.paidAmount, 0);
    const diffAmount = totalOrderAmount - totalPaidAmount;
    renderPaymentReconciliation(container);
    const refreshedStart = document.getElementById('paymentReconcileStart');
    const refreshedEnd = document.getElementById('paymentReconcileEnd');
    if (refreshedStart && startInput.value) refreshedStart.value = startInput.value;
    if (refreshedEnd && endInput.value) refreshedEnd.value = endInput.value;
}

function resetPaymentReconciliationFilter() {
    const container = document.getElementById('orderReconciliationContent');
    if (!container) return;
    renderPaymentReconciliation(container);
}
