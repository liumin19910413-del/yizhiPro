/**
 * 订单明细对账模块
 * 
 * 核心功能（按架构设计）：
 * 1. ✅ 12个核心指标卡片（含支付手续费）
 * 2. ✅ SKU级别清分明细表
 * 3. ✅ 结算方式标识（T+7/T+30 vs 月结）
 * 4. ✅ SKU清分状态（全额空分/部分保证金/全额保证金）
 * 5. ✅ 确认收货时间
 * 6. ✅ 清分明细优化展示
 * 7. ✅ 月结金额统计
 * 8. ✅ 结算状态筛选
 * 9. ✅ 筛选查询功能
 */

// 全局变量：存储所有清分记录
let allClearingRecords = [];
let filteredRecords = [];
let orderDetailCurrentPage = 1;
let orderDetailPageSize = 20; // 每页显示20条

function renderOrderDetail(container) {
    try {
        // 1. 获取数据源：所有子订单的清分记录
        allClearingRecords = getClearingRecords();
        filteredRecords = allClearingRecords;
        
        if (allClearingRecords.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                    <div style="font-size: 16px; margin-bottom: 20px;">暂无清分数据</div>
                    <button class="btn btn-primary" onclick="generateMockDataV2()">🎲 生成模拟数据</button>
                </div>
            `;
            return;
        }
        
        // 3. 渲染页面
        renderOrderDetailContent(container, filteredRecords);
    } catch (error) {
        console.error('renderOrderDetail error:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #ff4d4f;">
                <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <div style="font-size: 16px; margin-bottom: 20px;">加载失败</div>
                <div style="font-size: 13px; color: #999; margin-bottom: 20px;">${error.message}</div>
                <button class="btn btn-primary" onclick="location.reload()">🔄 刷新页面</button>
            </div>
        `;
    }
}

function renderOrderDetailContent(container, records) {
    // 重置到第一页
    orderDetailCurrentPage = 1;
    
    container.innerHTML = `
        <!-- 模拟数据按钮（演示用，右上角小图标） -->
        <div style="position: absolute; top: 20px; right: 30px; z-index: 10;">
            <button onclick="generateMockDataV2()" 
                    style="background: #f0f0f0; border: 1px solid #d9d9d9; color: #999; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px;"
                    title="生成模拟数据（演示用）">
                🎲
            </button>
        </div>
        
        <!-- 工具栏 -->
        <div class="toolbar" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
            <span style="font-size: 13px; color: #666;">时间范围：</span>
            <input type="date" id="startDate" style="padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px;" />
            <span style="color: #999;">至</span>
            <input type="date" id="endDate" style="padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px;" />
            
            <span style="font-size: 13px; color: #666; margin-left: 20px;">结算状态：</span>
            <select id="settlementStatusFilter" style="padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px;">
                <option value="all">全部</option>
                <option value="pending_confirm">待确认收货</option>
                <option value="pending_t7">待T+7结算</option>
                <option value="pending_t30">待T+30结算</option>
                <option value="settled">已结算</option>
                <option value="refund_chargeback">立即冲账</option>
            </select>
            
            <span style="font-size: 13px; color: #666; margin-left: 20px;">清分状态：</span>
            <select id="clearingStatusFilter" style="padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px;">
                <option value="all">全部</option>
                <option value="全额空分">全额空分</option>
                <option value="部分保证金">部分保证金</option>
                <option value="全额保证金">全额保证金</option>
            </select>
            
            <span style="font-size: 13px; color: #666; margin-left: 20px;">门店：</span>
            <input type="text" id="storeSearch" placeholder="搜索门店" style="padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 150px;" />
            
            <button class="btn btn-primary" onclick="applyOrderDetailFilter()">🔍 查询</button>
            <button class="btn btn-default" onclick="resetOrderDetailFilter()">🔄 重置</button>
            <button class="btn" style="background: #fa8c16; color: white;" onclick="exportToExcel()">📥 导出Excel</button>
        </div>
        
        <!-- 清分对账明细（SKU级） -->
        <div style="margin-top: 10px; margin-bottom: 120px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <h3 style="margin: 0;">📊 清分对账明细（SKU级）</h3>
                <button onclick="showReconciliationHelp()" 
                        style="background: #f0f0f0; border: 1px solid #d9d9d9; color: #666; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;"
                        title="查看对账说明">
                    <span style="font-size: 14px;">❓</span>
                    <span>如何对账</span>
                </button>
            </div>
            <div id="tableContainer">
                ${renderClearingTable(records)}
            </div>
        </div>
        
        <!-- 固定在底部的分页和统计 -->
        <div style="position: fixed; bottom: 0; left: 180px; right: 0; background: #fff; border-top: 2px solid #e8e8e8; box-shadow: 0 -2px 8px rgba(0,0,0,0.1); z-index: 100; padding: 15px 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <!-- 左侧：筛选结果统计 -->
                <div style="font-size: 13px; color: #666;">
                    <span style="color: #1890ff; font-weight: 600;">📊 筛选结果：</span>
                    共 <strong style="color: #1890ff;">${records.length}</strong> 条记录，
                    订单金额合计 <strong style="color: #1890ff;">¥${records.reduce((sum, r) => sum + r.skuAmount, 0).toFixed(2)}</strong>
                </div>
                
                <!-- 右侧：分页控件 -->
                <div id="paginationContainer">
                    ${renderPagination(records.length)}
                </div>
            </div>
        </div>
    `;
    
    // 渲染当前页数据
    renderCurrentPage();
}

/**
 * 渲染异常订单提示
 */
function renderAnomalyAlert(records) {
    // 检查异常订单
    const anomalies = records.filter(r => {
        const totalClearing = r.platformAmount + r.operationAmount + r.merchantProfit + r.paymentFee;
        const diff = Math.abs(r.skuAmount - totalClearing);
        return diff >= 0.01;
    });
    
    const fullDepositOrders = records.filter(r => r.clearingStatus === '全额保证金');
    
    if (anomalies.length === 0 && fullDepositOrders.length === 0) {
        return '';
    }
    
    return `
        <div style="margin: 20px 0; padding: 15px; background: #fff7e6; border: 1px solid #ffd666; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <span style="font-size: 20px;">⚠️</span>
                <strong style="color: #fa8c16;">发现异常订单</strong>
            </div>
            <div style="font-size: 13px; color: #666; line-height: 1.8;">
                ${anomalies.length > 0 ? `<p>• 有 <strong style="color: #ff4d4f;">${anomalies.length}</strong> 个订单清分金额不匹配，请检查</p>` : ''}
                ${fullDepositOrders.length > 0 ? `<p>• 有 <strong style="color: #fa8c16;">${fullDepositOrders.length}</strong> 个订单全额保证金扣除（现金不足）</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * 获取清分记录（数据源）
 */
function getClearingRecords() {
    const records = [];
    
    // 从所有子订单中提取清分记录
    const subOrders = DB.subOrders || [];
    
    subOrders.forEach(subOrder => {
        if (!subOrder.clearing || !subOrder.items) return;
        
        // 获取父订单信息
        const parentOrder = DB.orders.find(o => 
            o.subOrderIds && o.subOrderIds.includes(subOrder.id)
        );
        
        if (!parentOrder) return;
        
        // 判断是否是退款记录
        const isRefund = subOrder.isRefund || false;
        const recordType = isRefund ? 'refund' : 'normal';
        
        // 获取确认时间
        let confirmTime = '';
        if (isRefund) {
            // 退款记录：确认退款时间
            confirmTime = subOrder.refundConfirmTime || subOrder.updateTime || '';
        } else {
            // 正常记录：确认收货时间
            confirmTime = subOrder.deliverTime || '';
        }
        
        // 遍历每个SKU
        subOrder.items.forEach(item => {
            if (!item.clearing) return;
            
            const clearing = item.clearing;
            const clearingDetails = clearing.clearingDetails || {};
            
            // 判断清分状态
            let clearingStatus = '全额空分';
            let clearingStatusColor = '#52c41a';
            
            if (clearing.totalDepositDeduct > 0) {
                if (clearing.totalSplitAmount > 0) {
                    clearingStatus = '部分保证金';
                    clearingStatusColor = '#fa8c16';
                } else {
                    clearingStatus = '全额保证金';
                    clearingStatusColor = '#ff4d4f';
                }
            }
            
            // 判断结算方式
            const settlementMethod = parentOrder.distributorId ? 'T+7/T+30' : '月结';
            
            // 生成清分明细说明
            const clearingDetailText = generateClearingDetailText(clearingDetails, isRefund);
            
            // 获取供应商信息
            const product = DB.products.find(p => p.id === item.skuId);
            const supplierName = product && product.supplierId ? 
                (DB.suppliers?.find(s => s.id === product.supplierId)?.name || '未知供应商') : 
                '未知供应商';
            
            // 金额符号（退款为负数）
            const amountMultiplier = isRefund ? -1 : 1;
            
            records.push({
                // 基础信息
                orderId: parentOrder.id,
                subOrderId: subOrder.id,
                skuId: item.skuId,
                skuName: item.skuName || item.name,
                skuSpec: item.spec || '',
                qty: item.qty,
                unitPrice: item.price,
                skuAmount: (item.price * item.qty) * amountMultiplier,
                
                // 门店信息
                storeId: parentOrder.storeId,
                storeName: parentOrder.storeName,
                
                // 供应商信息
                supplierName,
                
                // 时间信息
                createTime: parentOrder.createTime,
                confirmTime,  // 确认收货时间或确认退款时间
                
                // 清分金额（退款为负数）
                platformAmount: (clearing.platformAmount || 0) * amountMultiplier,
                tradingCompanyAmount: (clearing.tradingCompanyAmount || 0) * amountMultiplier,
                distributorAmount: (clearing.distributorAmount || 0) * amountMultiplier,
                operationAmount: (clearing.operationAmount || 0) * amountMultiplier,
                headquarterAmount: (clearing.headquarterAmount || 0) * amountMultiplier,
                merchantProfit: (clearing.merchantProfit || 0) * amountMultiplier,
                storeProfit: (clearing.storeProfit || 0) * amountMultiplier,
                storeNetProfit: (clearing.storeNetProfit || 0) * amountMultiplier,
                directCommission: (clearing.directCommission || 0) * amountMultiplier,
                indirectCommission: (clearing.indirectCommission || 0) * amountMultiplier,
                paymentFee: (clearing.paymentFee || 0) * amountMultiplier,
                
                // 清分方式
                totalSplitAmount: (clearing.totalSplitAmount || 0) * amountMultiplier,
                totalDepositDeduct: (clearing.totalDepositDeduct || 0) * amountMultiplier,
                clearingStatus,
                clearingStatusColor,
                
                // 清分明细
                clearingDetails: {
                    headquarter: clearingDetails.headquarter || {},
                    operation: clearingDetails.operation || {},
                    platform: clearingDetails.platform || {},
                    directPromoter: clearingDetails.directPromoter || {},
                    indirectPromoter: clearingDetails.indirectPromoter || {}
                },
                clearingDetailText,  // 清分明细文本说明
                
                // 结算方式
                settlementMethod,
                
                // 供应商付款信息
                supplierPayment: subOrder.supplierPayment || null,
                
                // 结算状态（根据确认时间和当前时间计算）
                settlementStatus: calculateSettlementStatus(confirmTime, isRefund, subOrder.supplierPayment),
                settlementStatusText: getSettlementStatusText(calculateSettlementStatus(confirmTime, isRefund, subOrder.supplierPayment)),
                settlementStatusColor: getSettlementStatusColor(calculateSettlementStatus(confirmTime, isRefund, subOrder.supplierPayment)),
                
                // 记录类型
                recordType,
                isRefund
            });
        });
    });
    
    return records;
}

/**
 * 生成清分明细文本说明
 */
function generateClearingDetailText(clearingDetails, isRefund) {
    const parts = [];
    const prefix = isRefund ? '回退' : '分配';
    
    // 空中分账的角色
    const airSplitRoles = [];
    if (clearingDetails.headquarter?.splitAmount > 0) {
        airSplitRoles.push(`总部¥${clearingDetails.headquarter.splitAmount.toFixed(2)}`);
    }
    if (clearingDetails.operation?.splitAmount > 0) {
        airSplitRoles.push(`代运营¥${clearingDetails.operation.splitAmount.toFixed(2)}`);
    }
    if (clearingDetails.platform?.splitAmount > 0) {
        airSplitRoles.push(`平台¥${clearingDetails.platform.splitAmount.toFixed(2)}`);
    }
    if (clearingDetails.directPromoter?.splitAmount > 0) {
        airSplitRoles.push(`直推¥${clearingDetails.directPromoter.splitAmount.toFixed(2)}`);
    }
    if (clearingDetails.indirectPromoter?.splitAmount > 0) {
        airSplitRoles.push(`间推¥${clearingDetails.indirectPromoter.splitAmount.toFixed(2)}`);
    }
    
    if (airSplitRoles.length > 0) {
        parts.push(`💳 空中${prefix}: ${airSplitRoles.join(', ')}`);
    }
    
    // 保证金扣除的角色
    const depositRoles = [];
    if (clearingDetails.headquarter?.depositAmount > 0) {
        depositRoles.push(`总部¥${clearingDetails.headquarter.depositAmount.toFixed(2)}`);
    }
    if (clearingDetails.operation?.depositAmount > 0) {
        depositRoles.push(`代运营¥${clearingDetails.operation.depositAmount.toFixed(2)}`);
    }
    if (clearingDetails.platform?.depositAmount > 0) {
        depositRoles.push(`平台¥${clearingDetails.platform.depositAmount.toFixed(2)}`);
    }
    
    if (depositRoles.length > 0) {
        parts.push(`🔒 保证金${prefix}: ${depositRoles.join(', ')}`);
    }
    
    return parts.join('\n') || '无清分明细';
}

/**
 * 计算12个核心指标
 */
function calculateCoreStats(records) {
    const normalRecords = records.filter(r => r.recordType === 'normal');
    
    return {
        // 1. 交易订单额
        totalOrderAmount: normalRecords.reduce((sum, r) => sum + r.skuAmount, 0),
        
        // 2. 交易订单数
        totalOrderCount: new Set(normalRecords.map(r => r.subOrderId)).size,
        
        // 3. 平台代收（平台货款70%，托管）
        totalPlatformAmount: normalRecords.reduce((sum, r) => sum + r.platformAmount, 0),
        
        // 4. 贸易公司代收（80%，需要支付供应商成本价）
        totalTradingCompany: normalRecords.reduce((sum, r) => sum + r.tradingCompanyAmount, 0),
        
        // 5. 经销商分成（20%，线下结算）
        totalDistributor: normalRecords.reduce((sum, r) => sum + r.distributorAmount, 0),
        
        // 6. 平台利润（平台代收 - 供应商货款 - 经销商分成）
        // 注意：当前数据中没有供应商成本，暂时用贸易公司代收 - 经销商分成估算
        // TODO: 需要在数据中添加供应商成本字段
        totalPlatformProfit: normalRecords.reduce((sum, r) => 
            sum + r.tradingCompanyAmount - r.distributorAmount, 0
        ),
        
        // 7. 代运营费
        totalOperation: normalRecords.reduce((sum, r) => sum + r.operationAmount, 0),
        
        // 8. 支付手续费
        totalPaymentFee: normalRecords.reduce((sum, r) => sum + r.paymentFee, 0),
        
        // 9. 商家毛利
        totalMerchantProfit: normalRecords.reduce((sum, r) => sum + r.merchantProfit, 0),
        
        // 10. 总部收入
        totalHeadquarter: normalRecords.reduce((sum, r) => sum + r.headquarterAmount, 0),
        
        // 11. 门店毛利
        totalStoreProfit: normalRecords.reduce((sum, r) => sum + r.storeProfit, 0),
        
        // 12. 门店利润
        totalStoreNetProfit: normalRecords.reduce((sum, r) => sum + r.storeNetProfit, 0)
    };
}

/**
 * 渲染12个指标卡片
 */
function renderStatsCards(stats) {
    const cards = [
        { label: '💰 交易订单额', value: stats.totalOrderAmount, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        { label: '📦 交易订单数', value: stats.totalOrderCount, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', isCount: true },
        { label: '💵 平台代收', value: stats.totalPlatformAmount, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', note: '货款70%（托管）' },
        { label: '📤 贸易公司代收', value: stats.totalTradingCompany, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', note: '80%（需付供应商）' },
        { label: '🏢 经销商分成', value: stats.totalDistributor, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', note: '20%（线下结算）' },
        { label: '💎 平台利润', value: stats.totalPlatformProfit, color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', note: '代收-供应商-经销商' },
        { label: '🎯 代运营费', value: stats.totalOperation, color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
        { label: '💳 支付手续费', value: stats.totalPaymentFee, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', note: '费率 0.38%' },
        { label: '📊 商家毛利', value: stats.totalMerchantProfit, color: '#f8f9fa', textColor: '#13c2c2' },
        { label: '🏛️ 总部收入', value: stats.totalHeadquarter, color: '#f8f9fa', textColor: '#722ed1' },
        { label: '🏪 门店毛利', value: stats.totalStoreProfit, color: '#f8f9fa', textColor: '#52c41a' },
        { label: '✨ 门店利润', value: stats.totalStoreNetProfit, color: '#f8f9fa', textColor: '#1890ff' }
    ];
    
    return cards.map(card => `
        <div class="stat-card" style="background: ${card.color}; ${card.textColor ? `color: ${card.textColor}; border: 1px solid #e9ecef;` : ''}">
            <div class="label">${card.label}</div>
            <div class="value">${card.isCount ? card.value : '¥' + card.value.toFixed(2)}</div>
            ${card.note ? `<div class="note">${card.note}</div>` : ''}
        </div>
    `).join('');
}

/**
 * 渲染清分明细表（财务对账视角）
 */
function renderClearingTable(records) {
    return `
        <div class="clearing-table-container">
            <table class="clearing-table">
                <thead>
                    <tr>
                        <th rowspan="3">订单号</th>
                        <th rowspan="3">门店</th>
                        <th rowspan="3">供应商</th>
                        <th rowspan="3">SKU</th>
                        <th rowspan="3">数量</th>
                        <th rowspan="3">订单金额</th>
                        <th rowspan="3">记录类型</th>
                        <th rowspan="3">确认时间</th>
                        <th rowspan="3">结算状态</th>
                        <th rowspan="3" style="background: #f0f5ff;">收款商户号</th>
                        <th colspan="9" style="background: #f0f0f0; text-align: center; border-bottom: 2px solid #d9d9d9;">清分明细（资金流向）</th>
                        <th colspan="2" style="background: #e6f7ff; text-align: center;">清分方式</th>
                        <th rowspan="3">清分明细</th>
                    </tr>
                    <tr>
                        <!-- 第一层：平台代收 -->
                        <th colspan="3" style="background: #fff7e6; text-align: center; border: 2px solid #ffa940;">💵 平台代收 70%（托管）</th>
                        <!-- 第一层：其他 -->
                        <th rowspan="2" style="background: #e6f7ff;">🎯 代运营<br>10%</th>
                        <th colspan="4" style="background: #f6ffed; text-align: center;">📊 商家毛利 20%</th>
                        <th rowspan="2" style="background: #fff2f0; font-size: 11px;">💳 手续费</th>
                        <!-- 清分方式 -->
                        <th rowspan="2" style="background: #e6f7ff;">空中分账</th>
                        <th rowspan="2" style="background: #fff7e6;">保证金扣除</th>
                    </tr>
                    <tr>
                        <!-- 第二层：平台代收的分配 -->
                        <th style="background: #d4f1d4; border-left: 2px solid #ffa940;">📤 贸易公司<br>80%<br><span style="font-size: 10px; color: #999;">(需付供应商)</span></th>
                        <th style="background: #ffe7ba; font-size: 11px;">└ 供应商<br>成本价</th>
                        <th style="background: #ffd591; border-right: 2px solid #ffa940;">🏢 经销商<br>20%</th>
                        <!-- 第二层：商家毛利的分配 -->
                        <th style="font-size: 11px;">🏛️ 总部</th>
                        <th style="font-size: 11px;">🏪 门店毛利</th>
                        <th style="font-size: 11px;">👥 推广员</th>
                        <th style="font-size: 11px;">✨ 门店净利</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => {
                        // 验证清分金额是否正确（仅用于背景色判断）
                        const totalClearing = r.platformAmount + r.operationAmount + r.merchantProfit + r.paymentFee;
                        const diff = Math.abs(r.skuAmount - totalClearing);
                        const isValid = diff < 0.01;

                        // 验证清分方式是否正确
                        const clearingSum = r.totalSplitAmount + r.totalDepositDeduct;
                        const clearingValid = Math.abs(clearingSum - totalClearing) < 0.01;

                        // 模拟供应商成本（实际应该从数据中读取）
                        const supplierCost = r.tradingCompanyAmount * 0.8; // 假设成本是贸易公司代收的80%

                        // 记录类型样式
                        const recordTypeStyle = r.isRefund ? 'color: #ff4d4f; font-weight: 600;' : 'color: #52c41a;';
                        const recordTypeLabel = r.isRefund ? '🔙 退款' : '✅ 正常';

                        // 金额样式（退款为红色）
                        const amountStyle = r.isRefund ? 'color: #ff4d4f;' : '';

                        // 生成收款商户号（根据订单ID生成模拟商户号）
                        const merchantNoHtml = generateMerchantNoHtml(r);

                        return `
                        <tr style="${!isValid || !clearingValid ? 'background: #fff2f0;' : (r.isRefund ? 'background: #fff1f0;' : '')}">
                            <td style="font-size: 11px;">${r.orderId.substring(0, 12)}...</td>
                            <td style="font-size: 12px;">${r.storeName}</td>
                            <td style="font-size: 11px; color: #666;">${r.supplierName}</td>
                            <td style="font-size: 12px;">
                                <div>${r.skuName}</div>
                                ${r.skuSpec ? `<div style="font-size: 10px; color: #999;">${r.skuSpec}</div>` : ''}
                            </td>
                            <td>${r.qty}</td>
                            <td class="amount-neutral" style="font-weight: 700; ${amountStyle}">¥${r.skuAmount.toFixed(2)}</td>
                            <td style="font-size: 11px; ${recordTypeStyle}">${recordTypeLabel}</td>
                            <td style="font-size: 10px; color: #666;">${r.confirmTime ? r.confirmTime.substring(0, 16).replace('T', ' ') : '-'}</td>
                            <td>
                                <span class="status-badge" style="background: ${r.settlementStatusColor}15; color: ${r.settlementStatusColor}; border: 1px solid ${r.settlementStatusColor}40;">
                                    ${r.settlementStatusText}
                                </span>
                            </td>

                            <!-- 收款商户号 -->
                            <td style="background: #f0f5ff; font-size: 10px; line-height: 1.6;">
                                ${merchantNoHtml}
                            </td>

                            <!-- 平台代收的分配 -->
                            <td style="background: #d4f1d4; font-weight: 600; border-left: 2px solid #ffa940; ${amountStyle}">
                                ¥${r.tradingCompanyAmount.toFixed(2)}
                            </td>
                            <td style="background: #ffe7ba; font-size: 11px; color: #999;">
                                ¥${supplierCost.toFixed(2)}
                            </td>
                            <td style="background: #ffd591; font-weight: 600; border-right: 2px solid #ffa940; ${amountStyle}">
                                ¥${r.distributorAmount.toFixed(2)}
                            </td>

                            <!-- 代运营 -->
                            <td style="background: #e6f7ff; ${amountStyle}">¥${r.operationAmount.toFixed(2)}</td>

                            <!-- 商家毛利的分配 -->
                            <td style="background: #f6ffed; font-size: 11px; ${amountStyle}">¥${r.headquarterAmount.toFixed(2)}</td>
                            <td style="background: #f6ffed; font-size: 11px; ${amountStyle}">¥${r.storeProfit.toFixed(2)}</td>
                            <td style="background: #f6ffed; font-size: 11px; ${amountStyle}">¥${(r.directCommission + r.indirectCommission).toFixed(2)}</td>
                            <td style="background: #f6ffed; font-size: 11px; ${amountStyle}">¥${r.storeNetProfit.toFixed(2)}</td>

                            <!-- 手续费 -->
                            <td style="background: #fff2f0; font-size: 11px; ${amountStyle}">¥${r.paymentFee.toFixed(2)}</td>

                            <!-- 清分方式 -->
                            <td style="background: #e6f7ff; color: #1890ff; font-weight: 600; ${amountStyle}">
                                ¥${r.totalSplitAmount.toFixed(2)}
                                <div style="font-size: 9px; color: #999;">已到账</div>
                            </td>
                            <td style="background: #fff7e6; color: #fa8c16; font-weight: 600; ${amountStyle}">
                                ¥${r.totalDepositDeduct.toFixed(2)}
                                <div style="font-size: 9px; color: #999;">待补付</div>
                            </td>

                            <!-- 清分明细 -->
                            <td class="clearing-detail-cell" style="font-size: 10px; line-height: 1.6;">
                                ${r.clearingDetailText}
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
                <tfoot style="background: #fafafa; font-weight: 600;">
                    <tr>
                        <td colspan="5" style="text-align: right;">合计：</td>
                        <td class="amount-neutral">¥${records.reduce((sum, r) => sum + r.skuAmount, 0).toFixed(2)}</td>
                        <td colspan="4"></td>
                        <td style="background: #d4f1d4; border-left: 2px solid #ffa940;">¥${records.reduce((sum, r) => sum + r.tradingCompanyAmount, 0).toFixed(2)}</td>
                        <td style="background: #ffe7ba;">-</td>
                        <td style="background: #ffd591; border-right: 2px solid #ffa940;">¥${records.reduce((sum, r) => sum + r.distributorAmount, 0).toFixed(2)}</td>
                        <td style="background: #e6f7ff;">¥${records.reduce((sum, r) => sum + r.operationAmount, 0).toFixed(2)}</td>
                        <td style="background: #f6ffed;">¥${records.reduce((sum, r) => sum + r.headquarterAmount, 0).toFixed(2)}</td>
                        <td style="background: #f6ffed;">¥${records.reduce((sum, r) => sum + r.storeProfit, 0).toFixed(2)}</td>
                        <td style="background: #f6ffed;">¥${records.reduce((sum, r) => sum + r.directCommission + r.indirectCommission, 0).toFixed(2)}</td>
                        <td style="background: #f6ffed;">¥${records.reduce((sum, r) => sum + r.storeNetProfit, 0).toFixed(2)}</td>
                        <td style="background: #fff2f0;">¥${records.reduce((sum, r) => sum + r.paymentFee, 0).toFixed(2)}</td>
                        <td style="background: #e6f7ff;">¥${records.reduce((sum, r) => sum + r.totalSplitAmount, 0).toFixed(2)}</td>
                        <td style="background: #fff7e6;">¥${records.reduce((sum, r) => sum + r.totalDepositDeduct, 0).toFixed(2)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

/**
 * 生成收款商户号显示HTML
 * 显示统一的收款商户号
 */
function generateMerchantNoHtml(record) {
    // 模拟商户号（实际应该从数据中获取）
    // 根据门店ID生成固定的商户号，保证同一门店的商户号一致
    const storeHash = record.storeId ? record.storeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 12345;

    // 统一的收款商户号
    const merchantNo = `${(1500000000 + storeHash % 100000).toString()}`;

    return `<span style="color: #1890ff; font-weight: 500;">${merchantNo}</span>`;
}

/**
 * 渲染分页控件
 */
function renderPagination(totalRecords) {
    const totalPages = Math.ceil(totalRecords / orderDetailPageSize);
    
    if (totalPages <= 1) {
        return '<div style="color: #999; font-size: 13px;">无需分页</div>';
    }
    
    let html = '<div style="display: flex; align-items: center; gap: 10px;">';
    
    // 上一页
    html += `<button onclick="goToPage(${orderDetailCurrentPage - 1})" 
                     ${orderDetailCurrentPage === 1 ? 'disabled' : ''} 
                     style="padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: ${orderDetailCurrentPage === 1 ? '#f5f5f5' : '#fff'}; cursor: ${orderDetailCurrentPage === 1 ? 'not-allowed' : 'pointer'}; font-size: 13px;">
                ‹ 上一页
             </button>`;
    
    // 页码
    html += '<div style="display: flex; gap: 5px;">';
    
    // 始终显示第一页
    html += `<button onclick="goToPage(1)" 
                     style="padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: ${orderDetailCurrentPage === 1 ? '#1890ff' : '#fff'}; color: ${orderDetailCurrentPage === 1 ? '#fff' : '#333'}; cursor: pointer; font-size: 13px;">
                1
             </button>`;
    
    // 省略号
    if (orderDetailCurrentPage > 3) {
        html += '<span style="padding: 6px 8px; color: #999;">...</span>';
    }
    
    // 中间页码
    for (let i = Math.max(2, orderDetailCurrentPage - 1); i <= Math.min(totalPages - 1, orderDetailCurrentPage + 1); i++) {
        html += `<button onclick="goToPage(${i})" 
                         style="padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: ${orderDetailCurrentPage === i ? '#1890ff' : '#fff'}; color: ${orderDetailCurrentPage === i ? '#fff' : '#333'}; cursor: pointer; font-size: 13px;">
                    ${i}
                 </button>`;
    }
    
    // 省略号
    if (orderDetailCurrentPage < totalPages - 2) {
        html += '<span style="padding: 6px 8px; color: #999;">...</span>';
    }
    
    // 最后一页
    if (totalPages > 1) {
        html += `<button onclick="goToPage(${totalPages})" 
                         style="padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: ${orderDetailCurrentPage === totalPages ? '#1890ff' : '#fff'}; color: ${orderDetailCurrentPage === totalPages ? '#fff' : '#333'}; cursor: pointer; font-size: 13px;">
                    ${totalPages}
                 </button>`;
    }
    
    html += '</div>';
    
    // 下一页
    html += `<button onclick="goToPage(${orderDetailCurrentPage + 1})" 
                     ${orderDetailCurrentPage === totalPages ? 'disabled' : ''} 
                     style="padding: 6px 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: ${orderDetailCurrentPage === totalPages ? '#f5f5f5' : '#fff'}; cursor: ${orderDetailCurrentPage === totalPages ? 'not-allowed' : 'pointer'}; font-size: 13px;">
                下一页 ›
             </button>`;
    
    // 页码信息
    html += `<span style="color: #666; font-size: 13px; margin-left: 10px;">
                第 ${orderDetailCurrentPage} / ${totalPages} 页
             </span>`;
    
    html += '</div>';
    return html;
}

/**
 * 跳转到指定页
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredRecords.length / orderDetailPageSize);
    if (page < 1 || page > totalPages) return;
    
    orderDetailCurrentPage = page;
    renderCurrentPage();
}

/**
 * 渲染当前页数据
 */
function renderCurrentPage() {
    const startIndex = (orderDetailCurrentPage - 1) * orderDetailPageSize;
    const endIndex = Math.min(startIndex + orderDetailPageSize, filteredRecords.length);
    const pageRecords = filteredRecords.slice(startIndex, endIndex);
    
    // 更新表格
    const tableContainer = document.getElementById('tableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = renderClearingTable(pageRecords);
    }
    
    // 更新分页控件
    const paginationContainer = document.getElementById('paginationContainer');
    if (paginationContainer) {
        paginationContainer.innerHTML = renderPagination(filteredRecords.length);
    }
}

/**
 * 显示对账帮助浮窗
 */
function showReconciliationHelp() {
    const modal = document.getElementById('modal');
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3 style="margin: 0;">💡 如何对账？</h3>
                <button onclick="closeModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                <div style="font-size: 13px; line-height: 1.8; color: #666;">
                    <p><strong>1. 理解资金流向：</strong></p>
                    <p style="margin-left: 20px;">• 订单金额 = <span style="background: #fff7e6; padding: 2px 6px;">平台代收70%</span> + <span style="background: #e6f7ff; padding: 2px 6px;">代运营10%</span> + <span style="background: #f6ffed; padding: 2px 6px;">商家毛利20%</span> + 手续费</p>
                    <p style="margin-left: 20px;">• 平台代收 = <span style="background: #d4f1d4; padding: 2px 6px;">贸易公司80%</span> + <span style="background: #ffd591; padding: 2px 6px;">经销商20%</span></p>
                    <p style="margin-left: 20px;">• 贸易公司需要按成本价支付供应商</p>
                    
                    <p style="margin-top: 15px;"><strong>2. 理解结算状态：</strong></p>
                    <p style="margin-left: 20px;">• <span style="background: #fa8c1615; color: #fa8c16; padding: 2px 8px; border-radius: 4px;">待T+7结算</span> - 确认收货未满7天，等待第一期结算（90%）</p>
                    <p style="margin-left: 20px;">• <span style="background: #1890ff15; color: #1890ff; padding: 2px 8px; border-radius: 4px;">待T+30结算</span> - 已过7天未满30天，第一期已结算，等待第二期（10%）</p>
                    <p style="margin-left: 20px;">• <span style="background: #52c41a15; color: #52c41a; padding: 2px 8px; border-radius: 4px;">已结算</span> - 已过30天，两期全部结算完成</p>
                    <p style="margin-left: 20px;">• <span style="background: #ff4d4f15; color: #ff4d4f; padding: 2px 8px; border-radius: 4px;">立即冲账</span> - 退款记录，立即从下次结算中扣除（不等待T+7/T+30）</p>
                    
                    <p style="margin-top: 15px;"><strong>3. 退款冲账规则：</strong></p>
                    <p style="margin-left: 20px;">• 退款发生后，立即生成负数冲账记录</p>
                    <p style="margin-left: 20px;">• 冲账金额从下次月结时扣除，不需要等待T+7/T+30</p>
                    <p style="margin-left: 20px;">• 净应结 = 正常应结 + 退款冲账（负数）</p>
                    <p style="margin-left: 20px;">• 例如：本月应结¥10,000，退款冲账-¥500，净应结¥9,500</p>
                    
                    <p style="margin-top: 15px;"><strong>4. 验证清分金额：</strong></p>
                    <p style="margin-left: 20px;">各列金额加起来应该等于订单金额</p>
                    
                    <p style="margin-top: 10px;"><strong>5. 验证清分方式：</strong></p>
                    <p style="margin-left: 20px;">空中分账 + 保证金扣除 = 总清分金额</p>
                    
                    <p style="margin-top: 10px;"><strong>6. 清分明细：</strong></p>
                    <p style="margin-left: 20px;">显示空中分账和保证金扣除的具体分配给哪些角色</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeModal()">知道了</button>
            </div>
        </div>
    `;
    modal.classList.add('show');
}

/**
 * 关闭浮窗
 */
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
}

/**
 * 计算结算状态
 * @param {string} confirmTime - 确认收货/退款时间
 * @param {boolean} isRefund - 是否是退款记录
 * @param {object} supplierPayment - 供应商付款信息
 * @returns {string} - 结算状态: pending_t7, pending_t30, settled, refund_chargeback
 */
function calculateSettlementStatus(confirmTime, isRefund, supplierPayment) {
    if (!confirmTime) {
        return 'pending_confirm'; // 待确认收货
    }
    
    // 退款记录：立即冲账，不需要等待结算周期
    if (isRefund) {
        return 'refund_chargeback'; // 立即冲账（从下次结算中扣除）
    }
    
    // 如果供应商已付款，直接标记为已结算
    if (supplierPayment && supplierPayment.isPaid) {
        return 'settled';
    }
    
    const confirmDate = new Date(confirmTime);
    const now = new Date();
    const daysPassed = Math.floor((now - confirmDate) / (1000 * 60 * 60 * 24));
    
    if (daysPassed < 7) {
        return 'pending_t7'; // 待T+7结算
    } else if (daysPassed < 30) {
        return 'pending_t30'; // T+7已结算，待T+30结算
    } else {
        return 'settled'; // 已全部结算
    }
}

/**
 * 获取结算状态文本
 */
function getSettlementStatusText(status) {
    const map = {
        'pending_confirm': '待确认收货',
        'pending_t7': '待T+7结算',
        'pending_t30': '待T+30结算',
        'settled': '已结算',
        'refund_chargeback': '立即冲账'
    };
    return map[status] || status;
}

/**
 * 获取结算状态颜色
 */
function getSettlementStatusColor(status) {
    const map = {
        'pending_confirm': '#999',
        'pending_t7': '#fa8c16',
        'pending_t30': '#1890ff',
        'settled': '#52c41a',
        'refund_chargeback': '#ff4d4f'
    };
    return map[status] || '#999';
}

/**
 * 显示清分详情
 */
function showClearingDetail(subOrderId, skuId) {
    alert(`查看清分详情：${subOrderId} - ${skuId}\n\n功能开发中...`);
}

/**
 * 生成模拟数据
 */
function generateMockDataV2() {
    if (confirm('确定要生成模拟数据吗？')) {
        // 调用原有的数据生成函数
        if (typeof generateMockOrdersForClearing === 'function') {
            generateMockOrdersForClearing();
            setTimeout(() => {
                renderContent();
            }, 1000);
        } else {
            alert('数据生成函数未找到，请确保已加载 data.js');
        }
    }
}

/**
 * 应用筛选
 */
function applyOrderDetailFilter() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;
    const settlementStatus = document.getElementById('settlementStatusFilter')?.value;
    const clearingStatus = document.getElementById('clearingStatusFilter')?.value;
    const storeSearch = document.getElementById('storeSearch')?.value.trim().toLowerCase();
    
    // 筛选记录
    filteredRecords = allClearingRecords.filter(record => {
        // 时间范围筛选
        if (startDate && record.confirmTime) {
            const recordDate = record.confirmTime.substring(0, 10);
            if (recordDate < startDate) return false;
        }
        if (endDate && record.confirmTime) {
            const recordDate = record.confirmTime.substring(0, 10);
            if (recordDate > endDate) return false;
        }
        
        // 结算状态筛选
        if (settlementStatus && settlementStatus !== 'all') {
            if (record.settlementStatus !== settlementStatus) return false;
        }
        
        // 清分状态筛选
        if (clearingStatus && clearingStatus !== 'all') {
            if (record.clearingStatus !== clearingStatus) return false;
        }
        
        // 门店搜索
        if (storeSearch) {
            if (!record.storeName.toLowerCase().includes(storeSearch)) return false;
        }
        
        return true;
    });
    
    // 重新渲染
    const container = document.getElementById('content');
    renderOrderDetailContent(container, filteredRecords);
}

/**
 * 重置筛选
 */
function resetOrderDetailFilter() {
    filteredRecords = allClearingRecords;
    const container = document.getElementById('content');
    renderOrderDetailContent(container, filteredRecords);
}

/**
 * 应用筛选（兼容旧函数名）
 */
function applyFilter() {
    applyOrderDetailFilter();
}

/**
 * 导出Excel
 */
function exportToExcel() {
    alert('导出功能开发中...\n\n将导出以下内容：\n1. 当前筛选的订单记录\n2. SKU级别清分明细\n3. 汇总统计数据');
}
