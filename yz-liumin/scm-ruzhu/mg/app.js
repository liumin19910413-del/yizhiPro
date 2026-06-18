// MG端应用逻辑 - 严格按照需求文档实现
let currentPage = 'merchants'; // 默认页面改为商户入驻（数据概览已隐藏）
let currentProfitTab = 'brand'; // 记住当前选中的分成管理Tab
let currentMerchantsTab = 'audit'; // 记住当前选中的商户入驻Tab
let isInPageEditor = false; // 标记是否在页面编辑器中

// 确保在 DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log('MG App initializing...');
    initNavigation();
    renderPage(currentPage);
    listenStorageChanges();
    console.log('MG App initialized');
}

function listenStorageChanges() {
    window.addEventListener('storage', (e) => {
        if (['applications', 'orders', 'deposits', 'products', 'goods'].includes(e.key)) {
            // 如果在页面编辑器中，不自动刷新
            if (!isInPageEditor) {
                renderPage(currentPage);
                showToast('数据已更新', 'success');
            }
        }
    });
    // 定期刷新数据，确保实时同步
    // 但某些页面不需要频繁刷新，避免闪烁和影响用户操作
    setInterval(() => {
        // 排除需要用户交互的页面，避免自动刷新打断用户操作
        const excludePages = ['merchants', 'merchants-profit', 'goods', 'products', 'mall-goods'];
        // 如果在页面编辑器中，不自动刷新
        if (!excludePages.includes(currentPage) && !isInPageEditor) {
            renderPage(currentPage);
        }
    }, 5000);
}

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    console.log('initNavigation: found', navItems.length, 'nav items');
    
    navItems.forEach((item, index) => {
        console.log('Binding click to nav item', index, ':', item.dataset.page);
        item.addEventListener('click', (e) => {
            console.log('Nav item clicked:', item.dataset.page);
            if (item.classList.contains('has-submenu')) {
                item.classList.toggle('expanded');
                return;
            }
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentPage = item.dataset.page;
            renderPage(currentPage);
        });
    });
}

function renderPage(page) {
    const content = document.getElementById('page-content');
    switch(page) {
        case 'dashboard': content.innerHTML = renderDashboard(); break;
        case 'merchants': 
            content.innerHTML = renderMerchants(); 
            // 初始化筛选事件监听（如果在入驻审批Tab）
            setTimeout(() => {
                if (currentMerchantsTab === 'audit') {
                    initAuditFilters();
                }
            }, 0);
            break;
        case 'merchants-audit': 
            // 兼容旧的路由，重定向到merchants并设置Tab
            currentMerchantsTab = 'audit';
            content.innerHTML = renderMerchants(); 
            setTimeout(() => initAuditFilters(), 0);
            break;
        case 'merchants-profit': 
            // 兼容旧的路由，重定向到merchants并设置Tab
            currentMerchantsTab = 'profit';
            content.innerHTML = renderMerchants(); 
            break;
        case 'products': content.innerHTML = renderProducts(); break;
        case 'goods': 
            content.innerHTML = renderGoods(); 
            setTimeout(() => initGoodsRowClickEvents(), 0);
            break;
        case 'mall-goods': content.innerHTML = renderMallGoods(); break;
        case 'shipping': content.innerHTML = renderShipping(); break;
        case 'categories': content.innerHTML = renderCategories(); break;
        case 'exclude-areas': content.innerHTML = renderExcludeAreas(); break;
        case 'after-sale': content.innerHTML = renderAfterSale(); break;
        case 'mall-decoration': content.innerHTML = renderMallDecoration(); break;
        case 'deposits': content.innerHTML = renderDeposits(); break;
        case 'orders': content.innerHTML = renderOrders(); break;
        case 'finance': content.innerHTML = renderFinance(); break;
        default: content.innerHTML = '<div class="card"><p>页面开发中...</p></div>';
    }
    
    // 更新文档面板
    if (typeof updateDocPanel === 'function') {
        updateDocPanel(page);
    }
}

// 数据概览
function renderDashboard() {
    const apps = DataStore.get('applications');
    const orders = DataStore.get('orders');
    const deposits = DataStore.get('deposits');
    const products = DataStore.get('products');
    
    const pendingApps = apps.filter(a => a.status === 'pending').length;
    const signedApps = apps.filter(a => a.status === 'signed').length;
    const totalDeposit = deposits.reduce((sum, d) => sum + d.totalDeposit, 0);
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStockProducts = products.filter(p => p.stock < 100);
    
    return `
        <div class="page-header">
            <h2 class="page-title">数据概览</h2>
            <span class="breadcrumb">店商供应链平台 / 数据概览</span>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">待审核申请</div>
                <div class="value" style="color: ${pendingApps > 0 ? '#faad14' : '#333'};">${pendingApps}</div>
                <div class="trend">${pendingApps > 0 ? '⚠️ 有待处理' : '✓ 暂无待审核'}</div>
            </div>
            <div class="stat-card">
                <div class="label">已合作商户</div>
                <div class="value">${signedApps}</div>
                <div class="trend up">累计入驻</div>
            </div>
            <div class="stat-card">
                <div class="label">预收款总额</div>
                <div class="value">¥${totalDeposit.toLocaleString()}</div>
                <div class="trend">商户保证金</div>
            </div>
            <div class="stat-card">
                <div class="label">总销售额</div>
                <div class="value">¥${totalSales.toLocaleString()}</div>
                <div class="trend up">订单 ${orders.length} 笔</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">待审核申请</h3>
                    <button class="btn btn-link" onclick="navigateTo('merchants-audit')">查看全部 →</button>
                </div>
                ${apps.filter(a => a.status === 'pending').slice(0, 5).map(app => {
                    const merchant = DataStore.findById('merchants', app.merchantId);
                    return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                        <div>
                            <strong>${app.merchantId}</strong>
                            <span style="color: #999; margin-left: 10px;">${merchant?.name || '-'}</span>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="showAuditModal('${app.id}')">审核</button>
                    </div>
                `}).join('') || '<div style="text-align: center; padding: 40px; color: #999;">暂无待审核申请</div>'}
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">库存预警</h3>
                    <button class="btn btn-link" onclick="navigateTo('products')">查看全部 →</button>
                </div>
                ${lowStockProducts.slice(0, 5).map(p => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                        <div>
                            <strong>${p.name}</strong>
                            <span class="stock-badge low" style="margin-left: 10px;">库存: ${p.stock}</span>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="showStockModal('${p.id}')">调整库存</button>
                    </div>
                `).join('') || '<div style="text-align: center; padding: 40px; color: #999;">暂无库存预警</div>'}
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">最近订单</h3>
                <button class="btn btn-link" onclick="navigateTo('orders')">查看全部 →</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>订单号</th><th>商户号</th><th>商品</th><th>金额</th><th>状态</th><th>创建时间</th></tr>
                    </thead>
                    <tbody>
                        ${orders.slice(0, 5).map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.merchantId}</td>
                                <td>${order.goodsName}</td>
                                <td>¥${order.totalAmount}</td>
                                <td>${getOrderStatusTag(order.status)}</td>
                                <td>${order.createTime}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    currentPage = page;
    renderPage(page);
}


// 商户入驻（整合页面，包含入驻审批和分成管理两个Tab）
function renderMerchants() {
    // 根据currentMerchantsTab决定哪个Tab是active的
    const auditActive = currentMerchantsTab === 'audit' ? 'active' : '';
    const profitActive = currentMerchantsTab === 'profit' ? 'active' : '';
    
    return `
        <div class="page-header">
            <h2 class="page-title">商户入驻</h2>
            <span class="breadcrumb">商户入驻</span>
        </div>
        
        <div class="card">
            <!-- Tab导航 -->
            <div class="profit-tabs main-tabs">
                <div class="profit-tab main-tab ${auditActive}" data-tab="audit" onclick="switchMerchantsTab('audit')">
                    <span class="tab-icon">📋</span>
                    <span>入驻审批</span>
                </div>
                <div class="profit-tab main-tab ${profitActive}" data-tab="profit" onclick="switchMerchantsTab('profit')">
                    <span class="tab-icon">💰</span>
                    <span>分成管理</span>
                </div>
            </div>
            
            <!-- Tab内容 -->
            <div class="profit-tab-content">
                <!-- 入驻审批Tab -->
                <div id="merchants-audit-tab-content" class="tab-pane ${auditActive}">
                    ${renderMerchantsAuditContent()}
                </div>
                
                <!-- 分成管理Tab -->
                <div id="merchants-profit-tab-content" class="tab-pane ${profitActive}">
                    ${renderMerchantsProfitContent()}
                </div>
            </div>
        </div>
    `;
}

// 切换商户入驻主Tab
function switchMerchantsTab(tabName) {
    // 记住当前选中的Tab
    currentMerchantsTab = tabName;
    
    // 只更新主Tab导航状态（使用main-tab class）
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.querySelector(`.main-tab[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // 更新主Tab内容显示
    const auditContent = document.getElementById('merchants-audit-tab-content');
    const profitContent = document.getElementById('merchants-profit-tab-content');
    
    if (auditContent) auditContent.classList.remove('active');
    if (profitContent) profitContent.classList.remove('active');
    
    if (tabName === 'audit') {
        if (auditContent) {
            auditContent.classList.add('active');
            // 初始化筛选事件监听
            setTimeout(() => initAuditFilters(), 0);
        }
    } else if (tabName === 'profit') {
        if (profitContent) {
            profitContent.classList.add('active');
        }
    }
}

// 商户入驻审批内容（用于Tab内显示）
function renderMerchantsAuditContent() {
    const apps = DataStore.get('applications');
    const merchants = DataStore.get('merchants');
    
    return `
        <div class="card" style="margin-bottom: 20px; border: none; box-shadow: none;">
            <h3 style="margin-bottom: 15px; font-size: 16px;">筛选条件</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                <!-- 申请时间 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">申请时间</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="date" id="filter-apply-start" class="form-control" style="flex: 1;">
                        <span>至</span>
                        <input type="date" id="filter-apply-end" class="form-control" style="flex: 1;">
                    </div>
                </div>
                
                <!-- 审核时间 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">审核时间</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="date" id="filter-audit-start" class="form-control" style="flex: 1;">
                        <span>至</span>
                        <input type="date" id="filter-audit-end" class="form-control" style="flex: 1;">
                    </div>
                </div>
                
                <!-- 伊智付分账状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">伊智付分账状态</label>
                    <select id="filter-subaccount" class="form-control">
                        <option value="all">全部</option>
                        <option value="opened">已开通</option>
                        <option value="not-opened">未开通</option>
                    </select>
                </div>
                
                <!-- 营业执照经营范围 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">营业执照经营范围</label>
                    <select id="filter-scope" class="form-control">
                        <option value="all">全部</option>
                        <option value="compliant">符合</option>
                        <option value="non-compliant">不符合</option>
                    </select>
                </div>
                
                <!-- 审核状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">审核状态</label>
                    <select id="filter-audit-status" class="form-control">
                        <option value="all">全部</option>
                        <option value="pending">待审核</option>
                        <option value="approved">已通过</option>
                        <option value="rejected">已拒绝</option>
                    </select>
                </div>
                
                <!-- 签约状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">签约状态</label>
                    <select id="filter-sign-status" class="form-control">
                        <option value="all">全部</option>
                        <option value="signed">已签约</option>
                        <option value="pending-sign">待签约</option>
                    </select>
                </div>
            </div>
            
            <!-- 搜索框 -->
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">搜索商户号/商户名称</label>
                    <input type="text" class="form-control" placeholder="请输入商户号或商户名称..." id="filter-search" style="width: 100%;">
                </div>
                <button class="btn btn-primary" onclick="applyAuditFilters()" style="height: 38px;">查询</button>
                <button class="btn btn-outline" onclick="resetAuditFilters()" style="height: 38px;">重置</button>
            </div>
        </div>
        
        <div class="card" style="border: none; box-shadow: none;">
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #1890ff;">
                <span style="color: #1890ff; font-size: 14px;">💡 提示：修改筛选条件后会自动应用筛选，也可以点击"查询"按钮手动刷新</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th>
                            <th>收款主体</th>
                            <th>关联商户名称</th>
                            <th>关联连锁名称</th>
                            <th>申请账号</th>
                            <th>伊智付分账状态</th>
                            <th>营业执照经营范围</th>
                            <th>经销单位</th>
                            <th>经销员工</th>
                            <th>审核状态</th>
                            <th>签约状态</th>
                            <th>商品分佣比例</th>
                            <th>最新审核时间</th>
                            <th>审核人</th>
                            
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="apps-tbody">
                        ${apps.map(app => {
                            const merchant = merchants.find(m => m.id === app.merchantId);
                            const brandMerchant = app.brandMerchantId ? merchants.find(m => m.id === app.brandMerchantId) : null;
                            
                            // 判断经营范围是否符合
                            const scopeCompliant = merchant?.scope && (
                                merchant.scope.includes('化妆品') || 
                                merchant.scope.includes('日用品') ||
                                merchant.scope.includes('美容')
                            );
                            
                            // 获取签约状态
                            const getSignStatus = () => {
                                if (app.status === 'signed') return '<span class="badge badge-success">已签约</span>';
                                if (app.status === 'pending_sign') return '<span class="badge badge-warning">待签约</span>';
                                return '<span class="badge badge-secondary">未签约</span>';
                            };
                            
                            // 获取审核状态
                            const getAuditStatus = () => {
                                if (app.status === 'pending') return '<span class="badge badge-warning">待审核</span>';
                                if (app.status === 'rejected') return '<span class="badge badge-danger">已拒绝</span>';
                                if (app.status === 'pending_sign' || app.status === 'signed') return '<span class="badge badge-success">已通过</span>';
                                return '<span class="badge badge-secondary">-</span>';
                            };
                            
                            return `
                            <tr data-app-id="${app.id}" 
                                data-status="${app.status}"
                                data-subaccount="${merchant?.hasSubAccount ? 'opened' : 'not-opened'}"
                                data-scope="${scopeCompliant ? 'compliant' : 'non-compliant'}"
                                data-apply-time="${app.createTime}"
                                data-audit-time="${app.auditTime || ''}"
                                data-search="${app.merchantId} ${merchant?.name || ''} ${merchant?.companyName || ''}">
                                <td>${app.merchantId}</td>
                                <td>${merchant?.companyName || '-'}</td>
                                <td>${merchant?.name || '-'}</td>
                                <td>${brandMerchant?.brandName || '-'}</td>
                                <td>${app.applicantPhone}</td>
                                <td>${merchant?.hasSubAccount ? '<span class="badge badge-success">已开通</span>' : '<span class="badge badge-danger">未开通</span>'}</td>
                                <td>${scopeCompliant ? '<span class="badge badge-success">符合</span>' : '<span class="badge badge-danger">不符合</span>'}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>${getAuditStatus()}</td>
                                <td>${getSignStatus()}</td>
                                <td><button class="btn btn-link btn-sm" onclick="viewProfitRatio('${app.id}')">查看</button></td>
                                <td>${app.auditTime || '-'}</td>
                                <td>${app.auditor || '-'}</td>
                                
                                <td class="action-btns">
                                    <button class="btn btn-link btn-sm" onclick="viewAppDetail('${app.id}')">详情</button>
                                    ${app.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="showAuditModal('${app.id}')">审核通过</button>` : ''}
                                    ${app.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="showRejectModal('${app.id}')">审核拒绝</button>` : ''}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 分成管理内容（用于Tab内显示）
function renderMerchantsProfitContent() {
    const profitRules = DataStore.get('profitRules');
    const distributors = DataStore.get('distributors');
    
    // 根据currentProfitTab决定哪个子Tab是active的
    const brandActive = currentProfitTab === 'brand' ? 'active' : '';
    const distributorActive = currentProfitTab === 'distributor' ? 'active' : '';
    
    return `
        <div class="card" style="border: none; box-shadow: none; padding: 0;">
            <!-- 子Tab导航 - 添加视觉区分 -->
            <div class="profit-tabs sub-tabs" style="margin-bottom: 20px; background: #f5f5f5; padding: 10px; border-radius: 8px;">
                <div class="profit-tab sub-tab ${brandActive}" data-tab="brand" onclick="switchProfitTab('brand')" style="cursor: pointer;">
                    <span class="tab-icon">🏢</span>
                    <span>商户号分账接收方设置</span>
                </div>
                <div class="profit-tab sub-tab ${distributorActive}" data-tab="distributor" onclick="switchProfitTab('distributor')" style="cursor: pointer;">
                    <span class="tab-icon">🤝</span>
                    <span>营业部分成设置</span>
                </div>
            </div>
            
            <!-- 子Tab内容 -->
            <div class="profit-tab-content">
                <!-- 商户号分账接收方设置 -->
                <div id="brand-tab-content" class="tab-pane ${brandActive}">
                    <div class="tab-header">
                        <h3 class="tab-title">商户号分账接收方设置</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>商户号</th>
                                    <th>商户名称</th>
                                    <th>绑定门店数</th>
                                    <th>分账接收方</th>
                                    <th>分账接收方名称</th>
                                    <th>分走商户号的收益比例</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${profitRules.map(rule => `
                                    <tr>
                                        <td>${rule.merchantId}</td>
                                        <td>${rule.merchantName}</td>
                                        <td>${rule.bindStoreCount} 家</td>
                                        <td>${rule.brandMerchantId || '-'}</td>
                                        <td>${rule.brandMerchantName || '-'}</td>
                                        <td><span class="badge badge-info">${rule.brandRatio}%</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 营业部分成设置 -->
                <div id="distributor-tab-content" class="tab-pane ${distributorActive}">
                    <div class="tab-header">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 class="tab-title">营业部分成设置</h3>
                                <p class="tab-desc">对外不展示营业部的分成设置，对内的MG管理后台的账单和财务对账表、结算表都要计算营业部的分成明细和汇总数据。设置营业部与伊智贸易公司的分成比例（占供应链平台收益）。</p>
                            </div>
                            <button class="btn btn-primary" onclick="showAddDistributorModal()">
                                <span>批量设置分成比例</span>
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>营业部ID</th>
                                    <th>营业部名称</th>
                                    <th>营业部占供应链平台收益比例</th>
                                    <th>伊智贸易分成比例</th>
                                    <th>营业部入驻客户数量</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${distributors.map(d => `
                                    <tr>
                                        <td>${d.id}</td>
                                        <td>${d.name}</td>
                                        <td><span class="badge badge-success">${d.ratio}%</span></td>
                                        <td><span class="badge badge-primary">${d.tradeCompanyRatio}%</span></td>
                                        <td>${d.bindMerchantCount}</td>
                                        <td>
                                            <button class="btn btn-link" onclick="editDistributor('${d.id}')">编辑</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 商户入驻审批
function renderMerchantsAudit() {
    const apps = DataStore.get('applications');
    const merchants = DataStore.get('merchants');
    
    return `
        <div class="page-header">
            <h2 class="page-title">商户入驻审批</h2>
            <span class="breadcrumb">商户入驻 / 入驻审批</span>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 15px; font-size: 16px;">筛选条件</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                <!-- 申请时间 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">申请时间</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="date" id="filter-apply-start" class="form-control" style="flex: 1;">
                        <span>至</span>
                        <input type="date" id="filter-apply-end" class="form-control" style="flex: 1;">
                    </div>
                </div>
                
                <!-- 审核时间 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">审核时间</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="date" id="filter-audit-start" class="form-control" style="flex: 1;">
                        <span>至</span>
                        <input type="date" id="filter-audit-end" class="form-control" style="flex: 1;">
                    </div>
                </div>
                
                <!-- 伊智付分账状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">伊智付分账状态</label>
                    <select id="filter-subaccount" class="form-control">
                        <option value="all">全部</option>
                        <option value="opened">已开通</option>
                        <option value="not-opened">未开通</option>
                    </select>
                </div>
                
                <!-- 营业执照经营范围 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">营业执照经营范围</label>
                    <select id="filter-scope" class="form-control">
                        <option value="all">全部</option>
                        <option value="compliant">符合</option>
                        <option value="non-compliant">不符合</option>
                    </select>
                </div>
                
                <!-- 审核状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">审核状态</label>
                    <select id="filter-audit-status" class="form-control">
                        <option value="all">全部</option>
                        <option value="pending">待审核</option>
                        <option value="approved">已通过</option>
                        <option value="rejected">已拒绝</option>
                    </select>
                </div>
                
                <!-- 签约状态 -->
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">签约状态</label>
                    <select id="filter-sign-status" class="form-control">
                        <option value="all">全部</option>
                        <option value="signed">已签约</option>
                        <option value="pending-sign">待签约</option>
                    </select>
                </div>
            </div>
            
            <!-- 搜索框 -->
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px;">搜索商户号/商户名称</label>
                    <input type="text" class="form-control" placeholder="请输入商户号或商户名称..." id="filter-search" style="width: 100%;">
                </div>
                <button class="btn btn-primary" onclick="applyAuditFilters()" style="height: 38px;">查询</button>
                <button class="btn btn-outline" onclick="resetAuditFilters()" style="height: 38px;">重置</button>
            </div>
        </div>
        
        <div class="card">
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #1890ff;">
                <span style="color: #1890ff; font-size: 14px;">💡 提示：修改筛选条件后会自动应用筛选，也可以点击"查询"按钮手动刷新</span>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th>
                            <th>收款主体</th>
                            <th>关联商户名称</th>
                            <th>关联连锁名称</th>
                            <th>申请账号</th>
                            <th>伊智付分账状态</th>
                            <th>营业执照经营范围</th>
                            <th>经销单位</th>
                            <th>经销员工</th>
                            <th>审核状态</th>
                            <th>签约状态</th>
                            <th>商品分佣比例</th>
                            <th>最新审核时间</th>
                            <th>审核人</th>
                            
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="apps-tbody">
                        ${apps.map(app => {
                            const merchant = merchants.find(m => m.id === app.merchantId);
                            const brandMerchant = app.brandMerchantId ? merchants.find(m => m.id === app.brandMerchantId) : null;
                            
                            // 判断经营范围是否符合
                            const scopeCompliant = merchant?.scope && (
                                merchant.scope.includes('化妆品') || 
                                merchant.scope.includes('日用品') ||
                                merchant.scope.includes('美容')
                            );
                            
                            // 获取签约状态
                            const getSignStatus = () => {
                                if (app.status === 'signed') return '<span class="badge badge-success">已签约</span>';
                                if (app.status === 'pending_sign') return '<span class="badge badge-warning">待签约</span>';
                                return '<span class="badge badge-secondary">未签约</span>';
                            };
                            
                            // 获取审核状态
                            const getAuditStatus = () => {
                                if (app.status === 'pending') return '<span class="badge badge-warning">待审核</span>';
                                if (app.status === 'rejected') return '<span class="badge badge-danger">已拒绝</span>';
                                if (app.status === 'pending_sign' || app.status === 'signed') return '<span class="badge badge-success">已通过</span>';
                                return '<span class="badge badge-secondary">-</span>';
                            };
                            
                            return `
                            <tr data-app-id="${app.id}" 
                                data-status="${app.status}"
                                data-subaccount="${merchant?.hasSubAccount ? 'opened' : 'not-opened'}"
                                data-scope="${scopeCompliant ? 'compliant' : 'non-compliant'}"
                                data-apply-time="${app.createTime}"
                                data-audit-time="${app.auditTime || ''}"
                                data-search="${app.merchantId} ${merchant?.name || ''} ${merchant?.companyName || ''}">
                                <td>${app.merchantId}</td>
                                <td>${merchant?.companyName || '-'}</td>
                                <td>${merchant?.name || '-'}</td>
                                <td>${brandMerchant?.brandName || '-'}</td>
                                <td>${app.applicantPhone}</td>
                                <td>${merchant?.hasSubAccount ? '<span class="badge badge-success">已开通</span>' : '<span class="badge badge-danger">未开通</span>'}</td>
                                <td>${scopeCompliant ? '<span class="badge badge-success">符合</span>' : '<span class="badge badge-danger">不符合</span>'}</td>
                                <td>-</td>
                                <td>-</td>
                                <td>${getAuditStatus()}</td>
                                <td>${getSignStatus()}</td>
                                <td><button class="btn btn-link btn-sm" onclick="viewProfitRatio('${app.id}')">查看</button></td>
                                <td>${app.auditTime || '-'}</td>
                                <td>${app.auditor || '-'}</td>
                                
                                <td class="action-btns">
                                    <button class="btn btn-link btn-sm" onclick="viewAppDetail('${app.id}')">详情</button>
                                    ${app.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="showAuditModal('${app.id}')">审核通过</button>` : ''}
                                    ${app.status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="showRejectModal('${app.id}')">审核拒绝</button>` : ''}
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 分润管理
function renderMerchantsProfit() {
    const profitRules = DataStore.get('profitRules');
    const distributors = DataStore.get('distributors');
    
    // 根据currentProfitTab决定哪个Tab是active的
    const brandActive = currentProfitTab === 'brand' ? 'active' : '';
    const distributorActive = currentProfitTab === 'distributor' ? 'active' : '';
    
    return `
        <div class="page-header">
            <h2 class="page-title">分成管理</h2>
            <span class="breadcrumb">商户入驻 / 分成管理</span>
        </div>
        
        <div class="card">
            <!-- Tab导航 -->
            <div class="profit-tabs">
                <div class="profit-tab ${brandActive}" data-tab="brand" onclick="switchProfitTab('brand')">
                    <span class="tab-icon">🏢</span>
                    <span>品牌总部分成设置</span>
                </div>
                <div class="profit-tab ${distributorActive}" data-tab="distributor" onclick="switchProfitTab('distributor')">
                    <span class="tab-icon">🤝</span>
                    <span>经销商单位分成设置</span>
                </div>
            </div>
            
            <!-- Tab内容 -->
            <div class="profit-tab-content">
                <!-- 品牌总部分成设置 -->
                <div id="brand-tab-content" class="tab-pane ${brandActive}">
                    <div class="tab-header">
                        <h3 class="tab-title">品牌总部分成设置</h3>
                        <p class="tab-desc">以下是各商户号配置的品牌总部分成比例（占商家收益的百分比），仅供查看，不可编辑。</p>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>商户号</th>
                                    <th>商户名称</th>
                                    <th>绑定门店数</th>
                                    <th>品牌总部商户号</th>
                                    <th>品牌总部名称</th>
                                    <th>总部分成比例</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${profitRules.map(rule => `
                                    <tr>
                                        <td>${rule.merchantId}</td>
                                        <td>${rule.merchantName}</td>
                                        <td>${rule.bindStoreCount} 家</td>
                                        <td>${rule.brandMerchantId || '-'}</td>
                                        <td>${rule.brandMerchantName || '-'}</td>
                                        <td><span class="badge badge-info">${rule.brandRatio}%</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 经销商单位分成设置 -->
                <div id="distributor-tab-content" class="tab-pane ${distributorActive}">
                    <div class="tab-header">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 class="tab-title">经销商单位分成设置</h3>
                                <p class="tab-desc">设置经销商单位与伊智贸易公司的分成比例（占供应链平台收益）</p>
                            </div>
                            <button class="btn btn-primary" onclick="showAddDistributorModal()">
                                <span>批量设置分成比例</span>
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>经销商ID</th>
                                    <th>经销商名称</th>
                                    <th>经销商分成比例</th>
                                    <th>伊智贸易分成比例</th>
                                    <th>绑定商户数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${distributors.map(d => `
                                    <tr>
                                        <td>${d.id}</td>
                                        <td>${d.name}</td>
                                        <td><span class="badge badge-success">${d.ratio}%</span></td>
                                        <td><span class="badge badge-primary">${d.tradeCompanyRatio}%</span></td>
                                        <td>${d.bindMerchantCount}</td>
                                        <td>
                                            <button class="btn btn-link" onclick="editDistributor('${d.id}')">编辑</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 切换分成管理子Tab
function switchProfitTab(tabName) {
    // 记住当前选中的Tab
    currentProfitTab = tabName;
    
    // 只更新子Tab导航状态（使用sub-tab class）
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.querySelector(`.sub-tab[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // 更新子Tab内容显示
    const brandContent = document.getElementById('brand-tab-content');
    const distributorContent = document.getElementById('distributor-tab-content');
    
    if (brandContent) brandContent.classList.remove('active');
    if (distributorContent) distributorContent.classList.remove('active');
    
    if (tabName === 'brand') {
        if (brandContent) {
            brandContent.classList.add('active');
        }
    } else if (tabName === 'distributor') {
        if (distributorContent) {
            distributorContent.classList.add('active');
        }
    }
}

// 产品维护
function renderProducts() {
    const products = DataStore.get('products');
    
    return `
        <div class="page-header">
            <h2 class="page-title">产品维护</h2>
            <span class="breadcrumb">商品管理 / 产品维护</span>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">产品列表</h3>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-outline" onclick="syncProducts()">🔄 同步产品</button>
                    <button class="btn btn-primary" onclick="showBatchStockModal()">📦 批量出入库</button>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>序号</th>
                            <th>产品ID</th>
                            <th>产品名称</th>
                            <th>库存</th>
                            <th>供应商</th>
                            <th>单价</th>
                            <th>发货方式</th>
                            <th>创建人</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map((p, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${p.id}</td>
                                <td>${p.name}</td>
                                <td><span class="stock-badge ${p.stock < 100 ? 'low' : 'normal'}">${p.stock}</span></td>
                                <td>${p.supplier}</td>
                                <td>¥${p.price}</td>
                                <td>${p.deliveryMethod}</td>
                                <td>${p.creator}</td>
                                <td>${p.createTime}</td>
                                <td class="action-btns">
                                    <button class="btn btn-link" onclick="showStockModal('${p.id}')">调整出入库</button>
                                    <button class="btn btn-link" onclick="showStockHistory('${p.id}')">出入库记录</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 商品组合
function renderGoods() {
    const goods = DataStore.get('goods');
    
    return `
        <div class="page-header">
            <h2 class="page-title">商品组合</h2>
            <span class="breadcrumb">商品管理 / 商品组合</span>
        </div>
        
        <div style="display: flex; flex-direction: column; height: calc(100vh - 120px);">
            <!-- 商品列表区域 - 占2/3高度 -->
            <div class="card" style="flex: 2; overflow: auto; margin-bottom: 15px;">
                <div class="card-header">
                    <h3 class="card-title">商品列表</h3>
                    <button class="btn btn-primary" onclick="showCreateGoodsModal()">+ 创建商品组合</button>
                </div>
                
                <div class="search-bar" style="margin-bottom: 15px;">
                    <input type="text" class="form-control" placeholder="搜索商品名称/SPU ID..." id="goodsSearch" style="width: 300px;">
                    <select class="form-control" id="goodsCategoryFilter" style="width: 150px; margin-left: 10px;">
                        <option value="">全部分类</option>
                        ${DataStore.get('categories').map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    <select class="form-control" id="goodsStatusFilter" style="width: 120px; margin-left: 10px;">
                        <option value="">全部状态</option>
                        <option value="online">已上架</option>
                        <option value="offline">已下架</option>
                    </select>
                    <button class="btn btn-outline" onclick="filterGoods()" style="margin-left: 10px;">搜索</button>
                    <button class="btn btn-link" onclick="resetGoodsFilter()">重置</button>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>商品封面</th>
                                <th>SPU商品ID</th>
                                <th>SPU名称</th>
                                <th>分类</th>
                                <th>供应商</th>
                                <th>销售价格</th>
                                <th>成本价</th>
                                <th>状态</th>
                                <th>更新时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="goods-tbody">
                            ${goods.map(g => `
                                <tr data-category="${g.categoryId}" data-status="${g.status}" 
                                    data-goods-id="${g.id}"
                                    style="cursor: pointer;" 
                                    id="goods-row-${g.id}">
                                    <td>
                                        <div style="width: 60px; height: 60px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
                                            封面图
                                        </div>
                                    </td>
                                    <td>${g.id}</td>
                                    <td>${g.name}</td>
                                    <td>${g.category}</td>
                                    <td>${g.supplier || '-'}</td>
                                    <td>¥${g.salePrice}</td>
                                    <td>¥${g.costPrice}</td>
                                    <td>${g.status === 'online' ? '<span class="status-tag status-success">上架</span>' : '<span class="status-tag status-default">下架</span>'}</td>
                                    <td>${g.updateTime}</td>
                                    <td class="action-btns">
                                        <button class="btn btn-link" onclick="editGoods('${g.id}')">编辑</button>
                                        <button class="btn btn-link" onclick="toggleGoodsStatus('${g.id}')">${g.status === 'online' ? '下架' : '上架'}</button>
                                        ${g.status === 'offline' ? `<button class="btn btn-link" style="color: #ff4d4f;" onclick="deleteGoods('${g.id}')">删除</button>` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- 商品详情面板 - 占1/3高度 -->
            <div class="card" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;" id="goods-detail-panel">
                <div style="padding: 15px; border-bottom: 1px solid #e8e8e8; background: #fafafa;">
                    <h3 style="margin: 0; font-size: 15px; color: #666;">
                        <span id="goods-detail-title">请点击上方商品查看详情</span>
                    </h3>
                </div>
                <div id="goods-detail-content" style="flex: 1; overflow: auto; padding: 15px; background: #fff;">
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
                        <p>请点击上方商品行查看详细信息</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// 商城商品（多规格）
function renderMallGoods() {
    const mallGoods = DataStore.get('mallGoods');
    return `
        <div class="page-header">
            <h2 class="page-title">商城商品</h2>
            <span class="breadcrumb">商品管理 / 商城商品</span>
        </div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">商城商品列表（多规格商品）</h3>
                <button class="btn btn-primary" onclick="showCreateMallGoodsModal()">+ 创建商城商品</button>
            </div>
            <p style="color: #666; margin-bottom: 15px;">商城商品可以选择多个商品组合来组成不同规格，在小程序中展示和售卖。</p>
            <div class="table-container">
                <table>
                    <thead><tr><th>商品封面</th><th>商品ID</th><th>商品名称</th><th>规格数</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        ${mallGoods.map(g => `
                            <tr>
                                <td>
                                    <div style="width: 60px; height: 60px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
                                        封面图
                                    </div>
                                </td>
                                <td>${g.id}</td>
                                <td>${g.name}</td>
                                <td>${g.specs.length} 个规格</td>
                                <td>${g.status === 'online' ? '<span class="status-tag status-success">上架</span>' : '<span class="status-tag status-default">下架</span>'}</td>
                                <td><button class="btn btn-link" onclick="viewMallGoodsDetail('${g.id}')">详情</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 邮费管理
function renderShipping() {
    const templates = DataStore.get('shippingTemplates');
    return `
        <div class="page-header">
            <h2 class="page-title">邮费管理</h2>
            <span class="breadcrumb">商品管理 / 邮费管理</span>
        </div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">邮费模板</h3>
                <button class="btn btn-primary" onclick="showAddShippingModal()">+ 添加模板</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>模板ID</th><th>模板名称</th><th>类型</th><th>配置</th><th>操作</th></tr></thead>
                    <tbody>
                        ${templates.map(t => `
                            <tr>
                                <td>${t.id}</td>
                                <td>${t.name}</td>
                                <td>${t.type === 'free' ? '包邮' : '按地区收费'}</td>
                                <td>${t.type === 'free' ? '全国包邮' : `默认运费 ¥${t.defaultFee}`}</td>
                                <td><button class="btn btn-link" onclick="editShipping('${t.id}')">编辑</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 分类管理
function renderCategories() {
    const categories = DataStore.get('categories');
    return `
        <div class="page-header">
            <h2 class="page-title">商城分类管理</h2>
            <span class="breadcrumb">商品管理 / 分类管理</span>
        </div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">分类列表</h3>
                <button class="btn btn-primary" onclick="showAddCategoryModal()">+ 添加分类</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>分类ID</th><th>分类名称</th><th>排序</th><th>操作</th></tr></thead>
                    <tbody>
                        ${categories.map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.name}</td>
                                <td>${c.sort}</td>
                                <td><button class="btn btn-link" onclick="editCategory('${c.id}')">编辑</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 不可下单地区
function renderExcludeAreas() {
    const templates = DataStore.get('excludeAreaTemplates');
    return `
        <div class="page-header">
            <h2 class="page-title">不可下单地区维护</h2>
            <span class="breadcrumb">商品管理 / 不可下单地区</span>
        </div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">地区模板</h3>
                <button class="btn btn-primary" onclick="showAddAreaTemplateModal()">+ 添加模板</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>模板ID</th><th>模板名称</th><th>包含地区</th><th>操作</th></tr></thead>
                    <tbody>
                        ${templates.map(t => `
                            <tr>
                                <td>${t.id}</td>
                                <td>${t.name}</td>
                                <td>${t.areas.join('、')}</td>
                                <td><button class="btn btn-link" onclick="editAreaTemplate('${t.id}')">编辑</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 售后规则
function renderAfterSale() {
    const rules = DataStore.get('afterSaleRules');
    return `
        <div class="page-header">
            <h2 class="page-title">售后规则</h2>
            <span class="breadcrumb">商品管理 / 售后规则</span>
        </div>
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">售后规则列表</h3>
                <button class="btn btn-primary" onclick="showAddAfterSaleModal()">+ 添加规则</button>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>规则ID</th><th>规则名称</th><th>有效天数</th><th>说明</th><th>操作</th></tr></thead>
                    <tbody>
                        ${rules.map(r => `
                            <tr>
                                <td>${r.id}</td>
                                <td>${r.name}</td>
                                <td>${r.days} 天</td>
                                <td>${r.description}</td>
                                <td><button class="btn btn-link" onclick="editAfterSale('${r.id}')">编辑</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 运营管理 ==========

// 商城装修
function renderMallDecoration() {
    return `
        <div class="page-header">
            <h2 class="page-title">商城装修</h2>
            <span class="breadcrumb">运营管理 / 商城装修</span>
        </div>
        
        <div class="tabs">
            <div class="tab-item active" onclick="showMallDecorationTab('content')">内容管理</div>
        </div>
        
        <div id="mall-decoration-content">
            ${renderMallDecorationContentTab()}
        </div>
    `;
}

// 切换商城装修Tab
function switchMallDecorationTab(tab) {
    // 更新Tab激活状态
    document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // 渲染对应内容
    const contentDiv = document.getElementById('mall-decoration-content');
    switch(tab) {
        case 'content':
            contentDiv.innerHTML = renderMallDecorationContentTab();
            break;
    }
}

// 内容管理Tab
function renderMallDecorationContentTab() {
    const pages = DataStore.get('mallPages');
    
    return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">页面列表</h3>
                <button class="btn btn-primary" onclick="showCreatePageModal()">+ 创建页面</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>页面名称</th>
                            <th>别名</th>
                            <th>创建时间</th>
                            <th>主页</th>
                            <th>最后更新时间</th>
                            <th>最后修改人</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pages.map(page => `
                            <tr>
                                <td><strong>${page.name}</strong></td>
                                <td><code>${page.alias}</code></td>
                                <td>${page.createTime}</td>
                                <td>
                                    ${page.isHomePage ? 
                                        '<span class="badge" style="background: #52c41a; color: white;">是</span>' : 
                                        '<span class="badge" style="background: #d9d9d9; color: #666;">否</span>'
                                    }
                                </td>
                                <td>${page.updateTime}</td>
                                <td>${page.lastEditor}</td>
                                <td>
                                    ${!page.isHomePage ? `<button class="btn btn-link" style="color: #52c41a; margin-right: 16px;" onclick="setAsHomePage('${page.id}')">设为主页</button>` : ''}
                                    <button class="btn btn-link" style="margin-right: 16px;" onclick="editMallPage('${page.id}')">编辑</button>
                                    <button class="btn btn-link" style="margin-right: 16px;" onclick="copyMallPage('${page.id}')">复制</button>
                                    <button class="btn btn-link" style="margin-right: 16px;" onclick="previewMallPage('${page.id}')">预览</button>
                                    ${!page.isHomePage ? `<button class="btn btn-link" style="color: #ff4d4f;" onclick="deleteMallPage('${page.id}')">删除</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 显示创建页面（进入页面编辑器）
function showCreatePageModal() {
    // 直接进入页面编辑器，创建新页面
    const newPageId = 'PAGE' + Date.now();
    const newPage = {
        id: newPageId,
        name: '未命名页面',
        alias: 'page-' + Date.now(),
        isHomePage: false,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
        lastEditor: '系统管理员',
        status: 'draft',
        components: []
    };
    
    // 临时保存到sessionStorage，编辑完成后再保存到DataStore
    sessionStorage.setItem('editingPage', JSON.stringify(newPage));
    sessionStorage.setItem('isNewPage', 'true');
    
    // 进入页面编辑器
    showPageEditor(newPageId);
}

// 创建页面
function createMallPage() {
    const name = document.getElementById('pageName').value.trim();
    const alias = document.getElementById('pageAlias').value.trim();
    const isHomePage = document.getElementById('isHomePage').checked;
    
    if (!name) {
        showToast('请输入页面名称', 'error');
        return;
    }
    
    if (!alias) {
        showToast('请输入页面别名', 'error');
        return;
    }
    
    // 验证别名格式
    if (!/^[a-z0-9-]+$/.test(alias)) {
        showToast('页面别名只能包含小写字母、数字和连字符', 'error');
        return;
    }
    
    // 检查别名是否已存在
    const pages = DataStore.get('mallPages');
    if (pages.some(p => p.alias === alias)) {
        showToast('页面别名已存在', 'error');
        return;
    }
    
    // 如果设为主页，需要将其他页面的isHomePage设为false
    if (isHomePage) {
        pages.forEach(p => {
            if (p.isHomePage) {
                DataStore.update('mallPages', p.id, { isHomePage: false });
            }
        });
    }
    
    // 创建新页面
    const newPage = {
        id: 'PAGE' + Date.now(),
        name,
        alias,
        isHomePage,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
        lastEditor: '系统管理员',
        status: 'draft',
        components: []
    };
    
    DataStore.add('mallPages', newPage);
    
    closeModal();
    showToast('页面创建成功', 'success');
    renderPage('mall-decoration');
}

// 编辑页面
function editMallPage(pageId) {
    const page = DataStore.findById('mallPages', pageId);
    if (!page) return;
    
    // 保存到sessionStorage
    sessionStorage.setItem('editingPage', JSON.stringify(page));
    sessionStorage.setItem('isNewPage', 'false');
    
    // 进入页面编辑器
    showPageEditor(pageId);
}

// 显示页面编辑器
function showPageEditor(pageId) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    const isNewPage = sessionStorage.getItem('isNewPage') === 'true';
    
    // 设置标记，防止自动刷新
    isInPageEditor = true;
    
    const content = document.getElementById('page-content');
    content.innerHTML = renderPageEditor(pageData, isNewPage);
    
    // 初始化编辑器
    initPageEditor(pageData);
}

// 渲染页面编辑器
function renderPageEditor(pageData, isNewPage) {
    // 初始化页面配置默认值
    if (!pageData.config) {
        pageData.config = {
            shareImage: '',
            pageDescription: '',
            backgroundColor: '#ffffff',
            enableBack: true,
            transparentHeader: false,
            showHeader: true
        };
    }
    
    // 初始化组件数组（如果不存在）
    if (!pageData.components) {
        pageData.components = [];
    }
    
    return `
        <div class="page-editor">
            <!-- 顶部工具栏 -->
            <div class="editor-header">
                <div class="editor-header-left">
                    <button class="btn btn-link" onclick="closePageEditor()" style="margin-right: 20px;">
                        ← 返回
                    </button>
                    <span style="font-size: 16px; font-weight: 600;">${pageData.name || '未命名页面'}</span>
                </div>
                <div class="editor-header-right">
                    <button class="btn btn-outline" onclick="savePageDraft()">保存</button>
                    <button class="btn btn-primary" onclick="saveAndPublishPage()" style="margin-left: 10px;">发布</button>
                </div>
            </div>
            
            <!-- 编辑器主体 -->
            <div class="editor-body">
                <!-- 左侧区域：上下分割 -->
                <div class="editor-sidebar-left">
                    <!-- 上方：已选组件 -->
                    <div class="selected-components-section">
                        <div class="section-header">已选组件</div>
                        <div class="selected-components-list" id="selected-components-list">
                            ${renderSelectedComponentsList(pageData.components)}
                        </div>
                    </div>
                    
                    <!-- 下方：组件管理 -->
                    <div class="component-library-section">
                        <div class="section-header">组件管理</div>
                        <div class="component-library">
                            <div class="component-item" draggable="true" data-type="goods" onclick="addComponentToPage('goods')">
                                <div class="component-icon">🛍️</div>
                                <div class="component-name">商品</div>
                                <div class="component-count" id="count-goods">${getComponentCount(pageData.components, 'goods')}/5</div>
                            </div>
                            <div class="component-item" draggable="true" data-type="goods-group" onclick="addComponentToPage('goods-group')">
                                <div class="component-icon">📦</div>
                                <div class="component-name">商品分组</div>
                                <div class="component-count" id="count-goods-group">${getComponentCount(pageData.components, 'goods-group')}/5</div>
                            </div>
                            <div class="component-item" draggable="true" data-type="goods-search" onclick="addComponentToPage('goods-search')">
                                <div class="component-icon">🔍</div>
                                <div class="component-name">商品搜索</div>
                                <div class="component-count" id="count-goods-search">${getComponentCount(pageData.components, 'goods-search')}/5</div>
                            </div>
                            <div class="component-item" draggable="true" data-type="image-ad" onclick="addComponentToPage('image-ad')">
                                <div class="component-icon">🖼️</div>
                                <div class="component-name">图片广告</div>
                                <div class="component-count" id="count-image-ad">${getComponentCount(pageData.components, 'image-ad')}/5</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 中间预览区 - 使用iPhone 17尺寸和H5样式 -->
                <div class="editor-canvas">
                    <div class="h5-frame">
                        <div class="h5-header" id="h5-header" style="background: ${pageData.config.backgroundColor}; ${pageData.config.transparentHeader ? 'background: transparent;' : ''}">
                            ${pageData.config.showHeader ? `
                                ${pageData.config.enableBack ? '<span class="h5-back">←</span>' : ''}
                                <span class="h5-title">${pageData.name || '页面标题'}</span>
                            ` : ''}
                        </div>
                        <div class="h5-content" id="h5-content" style="background: ${pageData.config.backgroundColor};">
                            ${renderPhoneContent(pageData.components)}
                        </div>
                    </div>
                </div>
                
                <!-- 右侧配置面板 -->
                <div class="editor-sidebar-right" id="config-panel">
                    ${renderPageSettingsPanel(pageData)}
                </div>
                
                <!-- 产品说明文档面板 - 固定在最右侧，始终显示 -->
                <div class="editor-doc-panel" id="editor-doc-panel">
                    <div class="doc-panel-header">
                        <span class="doc-icon">📄</span>
                        <span class="doc-title">产品说明文档</span>
                    </div>
                    <div class="doc-panel-content" id="editor-doc-content">
                        <div class="doc-panel-inner">
                            ${renderEditorDocumentation()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .page-editor {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #f5f5f5;
                z-index: 1000;
                display: flex;
                flex-direction: column;
            }
            
            .editor-header {
                height: 60px;
                background: white;
                border-bottom: 1px solid #e8e8e8;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
                position: relative;
                z-index: 10;
            }
            
            .editor-header-left {
                display: flex;
                align-items: center;
            }
            
            .editor-header-right {
                display: flex;
                align-items: center;
            }
            
            .editor-body {
                flex: 1;
                display: flex;
                overflow: hidden;
                position: relative;
            }
            
            /* 左侧区域：上下分割 */
            .editor-sidebar-left {
                width: 280px;
                background: white;
                border-right: 1px solid #e8e8e8;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            /* 已选组件区域（上方，60%高度） */
            .selected-components-section {
                flex: 6;
                display: flex;
                flex-direction: column;
                border-bottom: 2px solid #e8e8e8;
                overflow: hidden;
            }
            
            /* 组件管理区域（下方，40%高度） */
            .component-library-section {
                flex: 4;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .section-header {
                padding: 12px 15px;
                font-size: 13px;
                font-weight: 600;
                color: #333;
                background: #fafafa;
                border-bottom: 1px solid #e8e8e8;
                flex-shrink: 0;
            }
            
            /* 已选组件列表 */
            .selected-components-list {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
            }
            
            .selected-component-item {
                padding: 10px 12px;
                margin-bottom: 8px;
                background: #f9f9f9;
                border: 1px solid #e8e8e8;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .selected-component-item:hover {
                background: #f0f0f0;
                border-color: #6c5ce7;
            }
            
            .selected-component-item.selected {
                background: #f0f0ff;
                border-color: #6c5ce7;
            }
            
            .selected-component-item.page-settings {
                background: #e0f2fe;
                border-color: #0ea5e9;
            }
            
            .selected-component-item.page-settings:hover {
                background: #bae6fd;
            }
            
            .component-item-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .component-item-icon {
                font-size: 16px;
            }
            
            .component-item-name {
                font-size: 13px;
                font-weight: 500;
            }
            
            /* 组件库 */
            .component-library {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                align-content: start;
            }
            
            .component-item {
                padding: 15px 10px;
                background: #f9f9f9;
                border: 1px solid #e8e8e8;
                border-radius: 6px;
                cursor: pointer;
                text-align: center;
                transition: all 0.3s;
                position: relative;
            }
            
            .component-item:hover {
                background: #f0f0f0;
                border-color: #6c5ce7;
                transform: translateY(-2px);
            }
            
            .component-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .component-item.disabled:hover {
                transform: none;
                border-color: #e8e8e8;
            }
            
            .component-icon {
                font-size: 28px;
                margin-bottom: 6px;
            }
            
            .component-name {
                font-size: 12px;
                color: #666;
                margin-bottom: 4px;
            }
            
            .component-count {
                font-size: 11px;
                color: #999;
            }
            
            .component-count.limit-reached {
                color: #ff4d4f;
                font-weight: 600;
            }
            
            .editor-sidebar-right {
                width: 320px;
                background: white;
                border-left: 1px solid #e8e8e8;
                overflow-y: auto;
            }
            
            .sidebar-title {
                padding: 15px 20px;
                font-size: 14px;
                font-weight: 600;
                border-bottom: 1px solid #e8e8e8;
                background: #fafafa;
            }
            
            .component-list {
                padding: 15px;
            }
            
            .component-item {
                padding: 15px;
                margin-bottom: 10px;
                background: #f9f9f9;
                border: 1px solid #e8e8e8;
                border-radius: 6px;
                cursor: move;
                text-align: center;
                transition: all 0.3s;
            }
            
            .component-item:hover {
                background: #f0f0f0;
                border-color: #6c5ce7;
            }
            
            .component-icon {
                font-size: 32px;
                margin-bottom: 8px;
            }
            
            .component-name {
                font-size: 13px;
                color: #666;
            }
            
            .editor-canvas {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                overflow: auto;
                background: #e8e8e8;
            }
            
            /* iPhone 17 尺寸：430x932 */
            .h5-frame {
                width: 430px;
                height: 932px;
                background: white;
                border-radius: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .h5-header {
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 15px;
                font-size: 17px;
                font-weight: 600;
                border-bottom: 1px solid #e8e8e8;
                position: relative;
            }
            
            .h5-back {
                position: absolute;
                left: 15px;
                font-size: 20px;
                cursor: pointer;
            }
            
            .h5-title {
                flex: 1;
                text-align: center;
            }
            
            .h5-content {
                flex: 1;
                overflow-y: auto;
            }
            
            .config-content {
                padding: 20px;
            }
            
            .preview-component {
                margin: 10px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                border: 2px dashed #e8e8e8;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
            }
            
            .preview-component:hover {
                border-color: #6c5ce7;
            }
            
            .preview-component.selected {
                border-color: #6c5ce7;
                background: #f9f8ff;
            }
            
            /* 组件删除按钮 */
            .component-delete-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #ff4d4f;
                color: white;
                border: none;
                font-size: 18px;
                line-height: 1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: all 0.3s;
                z-index: 10;
            }
            
            .preview-component:hover .component-delete-btn {
                opacity: 1;
            }
            
            .component-delete-btn:hover {
                background: #d32f2f;
                transform: scale(1.1);
            }
            
            /* 产品说明文档面板 - 固定在最右侧，始终显示 */
            .editor-doc-panel {
                width: 300px;
                background: white;
                border-left: 3px solid #ff4d4f;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .doc-panel-header {
                padding: 15px 20px;
                background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
                border-bottom: 2px solid #ff4d4f;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-shrink: 0;
            }
            
            .doc-icon {
                font-size: 20px;
            }
            
            .doc-title {
                font-weight: 600;
                font-size: 14px;
                color: #ff4d4f;
            }
            
            .doc-panel-content {
                flex: 1;
                overflow: hidden;
            }
            
            .doc-panel-inner {
                height: 100%;
                overflow-y: auto;
                padding: 20px;
                font-size: 13px;
                line-height: 1.8;
            }
            
            /* 文档内容样式 */
            .doc-panel-inner h4 {
                color: #ff4d4f;
                margin-top: 20px;
                margin-bottom: 10px;
                font-size: 14px;
                border-bottom: 1px solid #ffccc7;
                padding-bottom: 5px;
            }
            
            .doc-panel-inner h4:first-child {
                margin-top: 0;
            }
            
            .doc-panel-inner h5 {
                color: #333;
                margin-top: 15px;
                margin-bottom: 8px;
                font-size: 13px;
            }
            
            .doc-panel-inner ul {
                padding-left: 20px;
                margin: 10px 0;
            }
            
            .doc-panel-inner li {
                margin-bottom: 5px;
                color: #666;
            }
            
            .doc-panel-inner strong {
                color: #ff4d4f;
            }
            
            .doc-panel-inner code {
                background: #fff5f5;
                padding: 2px 6px;
                border-radius: 3px;
                color: #ff4d4f;
                font-family: 'Monaco', 'Courier New', monospace;
                font-size: 12px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-size: 13px;
                font-weight: 500;
                color: #333;
            }
            
            .form-control {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                font-size: 13px;
                transition: all 0.3s;
            }
            
            .form-control:focus {
                border-color: #6c5ce7;
                outline: none;
                box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.1);
            }
            
            .color-picker-wrapper {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .color-preview {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                border: 1px solid #d9d9d9;
                cursor: pointer;
            }
            
            .switch-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .switch {
                position: relative;
                display: inline-block;
                width: 44px;
                height: 24px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .slider {
                background-color: #6c5ce7;
            }
            
            input:checked + .slider:before {
                transform: translateX(20px);
            }
        </style>
    `;
}

// 渲染手机预览内容
function renderPhoneContent(components) {
    if (!components || components.length === 0) {
        return `
            <div style="padding: 40px; text-align: center; color: #999;">
                <div style="font-size: 48px; margin-bottom: 10px;">📱</div>
                <p>从左侧拖拽组件到这里</p>
            </div>
        `;
    }
    
    return components.map((comp, index) => {
        return renderComponentPreview(comp, index);
    }).join('');
}

// 渲染已选组件列表（包含页面设置）
function renderSelectedComponentsList(components) {
    let html = '';
    
    // 页面设置组件（固定，不可删除）
    html += `
        <div class="selected-component-item page-settings" data-type="page-settings" onclick="selectPageSettings()">
            <div class="component-item-left">
                <span class="component-item-icon">⚙️</span>
                <span class="component-item-name">页面设置</span>
            </div>
        </div>
    `;
    
    // 其他组件
    if (!components || components.length === 0) {
        html += `
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                从下方组件管理中<br>选择组件添加到页面
            </div>
        `;
    } else {
        components.forEach((comp, index) => {
            const typeName = getComponentTypeName(comp.type);
            const icon = getComponentIcon(comp.type);
            html += `
                <div class="selected-component-item" data-index="${index}" data-type="${comp.type}" onclick="selectComponentFromList(${index})">
                    <div class="component-item-left">
                        <span class="component-item-icon">${icon}</span>
                        <span class="component-item-name">${typeName}</span>
                    </div>
                    <button class="btn btn-link btn-sm" onclick="event.stopPropagation(); removeComponentFromList(${index})" style="color: #ff4d4f; padding: 2px 6px;">
                        删除
                    </button>
                </div>
            `;
        });
    }
    
    return html;
}

// 获取组件图标
function getComponentIcon(type) {
    const icons = {
        'goods': '🛍️',
        'goods-group': '📦',
        'goods-search': '🔍',
        'image-ad': '🖼️'
    };
    return icons[type] || '📄';
}

// 获取组件数量
function getComponentCount(components, type) {
    if (!components) return 0;
    return components.filter(c => c.type === type).length;
}

// 渲染页面设置面板
function renderPageSettingsPanel(pageData) {
    const config = pageData.config || {};
    
    return `
        <div class="sidebar-title">页面设置</div>
        <div class="config-content">
            <div class="form-group">
                <label>页面标题</label>
                <input type="text" class="form-control" id="page-name-input" 
                    value="${pageData.name || ''}" 
                    onchange="updatePageConfig('name', this.value)"
                    placeholder="请输入页面标题">
            </div>
            
            <div class="form-group">
                <label>页面别名</label>
                <input type="text" class="form-control" id="page-alias-input" 
                    value="${pageData.alias || ''}"
                    onchange="updatePageConfig('alias', this.value)"
                    placeholder="只能包含小写字母、数字和连字符">
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    用于页面URL，如：home、goods-list
                </div>
            </div>
            
            <div class="form-group">
                <label>分享封面</label>
                <input type="text" class="form-control" 
                    value="${config.shareImage || ''}"
                    onchange="updatePageConfig('shareImage', this.value)"
                    placeholder="请输入分享封面图片URL">
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    分享到微信时显示的封面图
                </div>
            </div>
            
            <div class="form-group">
                <label>页面描述</label>
                <textarea class="form-control" rows="3"
                    onchange="updatePageConfig('pageDescription', this.value)"
                    placeholder="请输入页面描述">${config.pageDescription || ''}</textarea>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    用于SEO和分享描述
                </div>
            </div>
            
            <div class="form-group">
                <label>背景颜色</label>
                <div class="color-picker-wrapper">
                    <div class="color-preview" 
                        style="background: ${config.backgroundColor || '#ffffff'};"
                        onclick="document.getElementById('bg-color-input').click()">
                    </div>
                    <input type="color" id="bg-color-input" 
                        value="${config.backgroundColor || '#ffffff'}"
                        onchange="updatePageConfig('backgroundColor', this.value)"
                        style="display: none;">
                    <input type="text" class="form-control" style="flex: 1;"
                        value="${config.backgroundColor || '#ffffff'}"
                        onchange="updatePageConfig('backgroundColor', this.value)"
                        placeholder="#ffffff">
                </div>
            </div>
            
            <div class="form-group">
                <label>返回操作</label>
                <div class="switch-wrapper">
                    <label class="switch">
                        <input type="checkbox" 
                            ${config.enableBack !== false ? 'checked' : ''}
                            onchange="updatePageConfig('enableBack', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 13px; color: #666;">
                        ${config.enableBack !== false ? '显示返回按钮' : '隐藏返回按钮'}
                    </span>
                </div>
            </div>
            
            <div class="form-group">
                <label>透明标题栏</label>
                <div class="switch-wrapper">
                    <label class="switch">
                        <input type="checkbox" 
                            ${config.transparentHeader ? 'checked' : ''}
                            onchange="updatePageConfig('transparentHeader', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 13px; color: #666;">
                        ${config.transparentHeader ? '标题栏透明' : '标题栏不透明'}
                    </span>
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    适用于顶部有大图的页面
                </div>
            </div>
            
            <div class="form-group">
                <label>顶部标题栏</label>
                <div class="switch-wrapper">
                    <label class="switch">
                        <input type="checkbox" 
                            ${config.showHeader !== false ? 'checked' : ''}
                            onchange="updatePageConfig('showHeader', this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 13px; color: #666;">
                        ${config.showHeader !== false ? '显示标题栏' : '隐藏标题栏'}
                    </span>
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    隐藏后页面全屏显示
                </div>
            </div>
        </div>
    `;
}

// 渲染编辑器产品文档
function renderEditorDocumentation() {
    return `
        <h4 style="margin-top: 0;">页面编辑器使用说明</h4>
        
        <h5 style="margin-top: 20px;">基础操作</h5>
        <ul style="padding-left: 20px; margin: 10px 0;">
            <li>从左侧拖拽组件到中间预览区</li>
            <li>点击组件可以选中并配置</li>
            <li>在右侧配置面板修改组件属性</li>
            <li>点击"保存草稿"保存但不发布</li>
            <li>点击"保存并发布"直接发布页面</li>
        </ul>
        
        <h5 style="margin-top: 20px;">页面设置说明</h5>
        <ul style="padding-left: 20px; margin: 10px 0;">
            <li><strong>页面标题：</strong>显示在顶部标题栏的文字</li>
            <li><strong>页面别名：</strong>用于URL路径，只能包含小写字母、数字和连字符</li>
            <li><strong>分享封面：</strong>分享到微信时显示的封面图</li>
            <li><strong>页面描述：</strong>用于SEO和分享描述</li>
            <li><strong>背景颜色：</strong>页面的背景颜色</li>
            <li><strong>返回操作：</strong>是否显示返回按钮</li>
            <li><strong>透明标题栏：</strong>标题栏是否透明（适用于顶部有大图的页面）</li>
            <li><strong>顶部标题栏：</strong>是否显示顶部标题栏（隐藏后页面全屏显示）</li>
        </ul>
        
        <h5 style="margin-top: 20px;">组件说明</h5>
        <ul style="padding-left: 20px; margin: 10px 0;">
            <li><strong>商品：</strong>展示商城商品列表，支持网格和列表布局</li>
            <li><strong>商品分组：</strong>按分类展示商品</li>
            <li><strong>商品搜索：</strong>提供商品搜索功能</li>
            <li><strong>图片广告：</strong>展示广告图片，支持跳转链接</li>
        </ul>
        
        <h5 style="margin-top: 20px;">注意事项</h5>
        <ul style="padding-left: 20px; margin: 10px 0;">
            <li>页面别名必须唯一</li>
            <li>页面别名只能包含小写字母、数字和连字符</li>
            <li>修改配置后预览区会实时更新</li>
            <li>保存前请确认所有配置正确</li>
        </ul>
    `;
}

// 渲染组件预览
function renderComponentPreview(comp, index) {
    const mallGoods = DataStore.get('mallGoods');
    const categories = DataStore.get('categories');
    
    // 删除按钮HTML
    const deleteBtn = `
        <button class="component-delete-btn" onclick="event.stopPropagation(); removeComponent(${index})" title="删除组件">
            ×
        </button>
    `;
    
    switch(comp.type) {
        case 'goods':
            const selectedGoods = comp.config.selectedGoods || [];
            const displayStyle = comp.config.displayStyle || 'grid';
            const goodsList = mallGoods.filter(g => selectedGoods.includes(g.id));
            
            if (goodsList.length === 0) {
                return `
                    <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                        ${deleteBtn}
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">商品组件</div>
                        <div style="font-size: 12px; color: #999;">请在右侧配置中选择要显示的商品</div>
                    </div>
                `;
            }
            
            if (displayStyle === 'grid') {
                return `
                    <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                        ${deleteBtn}
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">商品组件（网格）</div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            ${goodsList.slice(0, 4).map(goods => `
                                <div style="background: #f9f9f9; padding: 8px; border-radius: 4px;">
                                    <div style="width: 100%; height: 60px; background: #e0e0e0; border-radius: 4px; margin-bottom: 5px;"></div>
                                    <div style="font-size: 11px; margin-bottom: 3px;">${goods.name}</div>
                                    <div style="font-size: 12px; color: #ff4d4f; font-weight: 600;">¥${goods.specs[0].price}</div>
                                </div>
                            `).join('')}
                        </div>
                        ${goodsList.length > 4 ? `<div style="font-size: 11px; color: #999; margin-top: 5px; text-align: center;">还有 ${goodsList.length - 4} 个商品...</div>` : ''}
                    </div>
                `;
            } else {
                return `
                    <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                        ${deleteBtn}
                        <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">商品组件（列表）</div>
                        ${goodsList.slice(0, 3).map(goods => `
                            <div style="display: flex; gap: 10px; background: #f9f9f9; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                                <div style="width: 60px; height: 60px; background: #e0e0e0; border-radius: 4px; flex-shrink: 0;"></div>
                                <div style="flex: 1;">
                                    <div style="font-size: 11px; margin-bottom: 3px;">${goods.name}</div>
                                    <div style="font-size: 12px; color: #ff4d4f; font-weight: 600;">¥${goods.specs[0].price}</div>
                                </div>
                            </div>
                        `).join('')}
                        ${goodsList.length > 3 ? `<div style="font-size: 11px; color: #999; text-align: center;">还有 ${goodsList.length - 3} 个商品...</div>` : ''}
                    </div>
                `;
            }
            
        case 'goods-group':
            const selectedCategory = comp.config.selectedCategory || '';
            const displayCount = comp.config.displayCount || 10;
            const category = categories.find(c => c.id === selectedCategory);
            
            return `
                <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                    ${deleteBtn}
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">商品分组</div>
                    ${category ? `
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                            <div style="font-size: 12px; margin-bottom: 8px; color: #666;">分类：${category.name}</div>
                            <div style="font-size: 11px; color: #999;">显示该分类下前 ${displayCount} 个商品</div>
                        </div>
                    ` : `
                        <div style="font-size: 12px; color: #999;">请在右侧配置中选择商品分类</div>
                    `}
                </div>
            `;
            
        case 'goods-search':
            const placeholder = comp.config.placeholder || '搜索商品';
            const showHotWords = comp.config.showHotWords !== false;
            
            return `
                <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                    ${deleteBtn}
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">商品搜索</div>
                    <div style="background: #f5f5f5; padding: 8px 12px; border-radius: 20px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px;">🔍</span>
                        <span style="font-size: 12px; color: #999;">${placeholder}</span>
                    </div>
                    ${showHotWords ? `
                        <div style="margin-top: 10px; font-size: 11px; color: #999;">
                            热门：<span style="color: #666;">口红</span> <span style="color: #666;">面膜</span> <span style="color: #666;">精华</span>
                        </div>
                    ` : ''}
                </div>
            `;
            
        case 'image-ad':
            const imageUrl = comp.config.imageUrl || '';
            const linkType = comp.config.linkType || 'none';
            
            return `
                <div class="preview-component" data-index="${index}" onclick="selectComponent(${index})">
                    ${deleteBtn}
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">图片广告</div>
                    ${imageUrl ? `
                        <div style="position: relative;">
                            <img src="${imageUrl}" style="width: 100%; height: auto; border-radius: 4px;">
                            ${linkType !== 'none' ? `
                                <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
                                    🔗 ${linkType === 'goods' ? '商品' : linkType === 'page' ? '页面' : '链接'}
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div style="width: 100%; height: 120px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; flex-direction: column; gap: 5px;">
                            <span style="font-size: 24px;">🖼️</span>
                            <span style="font-size: 11px;">请在右侧配置中设置广告图片</span>
                        </div>
                    `}
                </div>
            `;
            
        default:
            return '';
    }
}

// 初始化页面编辑器
function initPageEditor(pageData) {
    // 初始化拖拽功能
    initDragAndDrop();
    
    // 更新组件计数
    updateComponentCounts(pageData.components || []);
}

// 从列表选中组件
function selectComponentFromList(index) {
    selectComponent(index);
    
    // 滚动到组件位置
    const component = document.querySelector(`[data-index="${index}"]`);
    if (component) {
        component.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 更新页面配置
function updatePageConfig(key, value) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    
    if (key === 'name' || key === 'alias') {
        pageData[key] = value;
    } else {
        if (!pageData.config) {
            pageData.config = {};
        }
        pageData.config[key] = value;
    }
    
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 实时更新预览
    updatePreview();
}

// 更新预览
function updatePreview() {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    const config = pageData.config || {};
    
    // 更新标题
    const h5Title = document.querySelector('.h5-title');
    if (h5Title) {
        h5Title.textContent = pageData.name || '页面标题';
    }
    
    // 更新标题栏
    const h5Header = document.getElementById('h5-header');
    if (h5Header) {
        h5Header.style.background = config.backgroundColor || '#ffffff';
        if (config.transparentHeader) {
            h5Header.style.background = 'transparent';
        }
        
        if (config.showHeader === false) {
            h5Header.style.display = 'none';
        } else {
            h5Header.style.display = 'flex';
            
            // 更新返回按钮
            const backBtn = h5Header.querySelector('.h5-back');
            if (backBtn) {
                backBtn.style.display = config.enableBack !== false ? 'block' : 'none';
            }
        }
    }
    
    // 更新内容区背景
    const h5Content = document.getElementById('h5-content');
    if (h5Content) {
        h5Content.style.background = config.backgroundColor || '#ffffff';
    }
    
    // 更新颜色预览
    const colorPreview = document.querySelector('.color-preview');
    if (colorPreview) {
        colorPreview.style.background = config.backgroundColor || '#ffffff';
    }
}

// 切换文档面板
// 初始化拖拽功能
function initDragAndDrop() {
    const componentItems = document.querySelectorAll('.component-item');
    const phoneContent = document.getElementById('h5-content');
    
    componentItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('componentType', item.dataset.type);
        });
    });
    
    if (phoneContent) {
        phoneContent.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        phoneContent.addEventListener('drop', (e) => {
            e.preventDefault();
            const componentType = e.dataTransfer.getData('componentType');
            addComponent(componentType);
        });
    }
}

// 添加组件
function addComponent(type) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    
    const newComponent = {
        type: type,
        id: 'COMP' + Date.now(),
        config: {}
    };
    
    pageData.components.push(newComponent);
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 刷新预览
    const phoneContent = document.getElementById('h5-content');
    phoneContent.innerHTML = renderPhoneContent(pageData.components);
    
    // 刷新已用组件列表
    const usedComponentsList = document.getElementById('used-components-list');
    if (usedComponentsList) {
        usedComponentsList.innerHTML = renderUsedComponentsList(pageData.components);
    }
    
    showToast('组件已添加', 'success');
}

// 选择组件
function selectComponent(index) {
    // 移除所有选中状态
    document.querySelectorAll('.preview-component').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelectorAll('.used-component-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 添加选中状态
    const selected = document.querySelector(`.preview-component[data-index="${index}"]`);
    if (selected) {
        selected.classList.add('selected');
    }
    
    const selectedInList = document.querySelector(`.used-component-item[data-index="${index}"]`);
    if (selectedInList) {
        selectedInList.classList.add('selected');
    }
    
    // 显示组件配置面板
    showComponentConfig(index);
}

// 显示组件配置面板
function showComponentConfig(index) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    const component = pageData.components[index];
    
    const configPanel = document.getElementById('config-panel');
    
    // 根据组件类型显示不同的配置项
    let configHTML = '';
    
    switch(component.type) {
        case 'goods':
            configHTML = renderGoodsComponentConfig(component, index);
            break;
        case 'goods-group':
            configHTML = renderGoodsGroupComponentConfig(component, index);
            break;
        case 'goods-search':
            configHTML = renderGoodsSearchComponentConfig(component, index);
            break;
        case 'image-ad':
            configHTML = renderImageAdComponentConfig(component, index);
            break;
        default:
            configHTML = `
                <div class="form-group">
                    <label>组件类型</label>
                    <input type="text" class="form-control" value="${getComponentTypeName(component.type)}" disabled>
                </div>
            `;
    }
    
    configPanel.innerHTML = `
        <div class="sidebar-title">组件设置</div>
        <div class="config-content">
            ${configHTML}
            <div class="form-group" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8e8e8;">
                <button class="btn btn-danger" style="width: 100%;" onclick="removeComponent(${index})">删除组件</button>
            </div>
        </div>
    `;
}

// 渲染商品组件配置
function renderGoodsComponentConfig(component, index) {
    const mallGoods = DataStore.get('mallGoods');
    const selectedGoods = component.config.selectedGoods || [];
    const displayStyle = component.config.displayStyle || 'grid'; // grid网格 | list列表
    
    return `
        <div class="form-group">
            <label>组件类型</label>
            <input type="text" class="form-control" value="商品" disabled>
        </div>
        
        <div class="form-group">
            <label>显示样式</label>
            <select class="form-control" onchange="updateComponentConfig(${index}, 'displayStyle', this.value)">
                <option value="grid" ${displayStyle === 'grid' ? 'selected' : ''}>网格布局</option>
                <option value="list" ${displayStyle === 'list' ? 'selected' : ''}>列表布局</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>选择商品</label>
            <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e8e8e8; border-radius: 4px; padding: 10px;">
                ${mallGoods.map(goods => `
                    <div style="margin-bottom: 10px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" 
                                ${selectedGoods.includes(goods.id) ? 'checked' : ''}
                                onchange="toggleGoodsSelection(${index}, '${goods.id}', this.checked)"
                                style="margin-right: 8px;">
                            <span>${goods.name}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 10px; font-size: 12px; color: #999;">
                已选择 ${selectedGoods.length} 个商品
            </div>
        </div>
    `;
}

// 渲染商品分组组件配置
function renderGoodsGroupComponentConfig(component, index) {
    const categories = DataStore.get('categories');
    const selectedCategory = component.config.selectedCategory || '';
    const displayCount = component.config.displayCount || 10;
    
    return `
        <div class="form-group">
            <label>组件类型</label>
            <input type="text" class="form-control" value="商品分组" disabled>
        </div>
        
        <div class="form-group">
            <label>选择分类</label>
            <select class="form-control" onchange="updateComponentConfig(${index}, 'selectedCategory', this.value)">
                <option value="">请选择分类</option>
                ${categories.map(cat => `
                    <option value="${cat.id}" ${selectedCategory === cat.id ? 'selected' : ''}>
                        ${cat.name}
                    </option>
                `).join('')}
            </select>
        </div>
        
        <div class="form-group">
            <label>显示数量</label>
            <input type="number" class="form-control" value="${displayCount}" min="1" max="50"
                onchange="updateComponentConfig(${index}, 'displayCount', parseInt(this.value))">
        </div>
    `;
}

// 渲染商品搜索组件配置
function renderGoodsSearchComponentConfig(component, index) {
    const placeholder = component.config.placeholder || '搜索商品';
    const showHotWords = component.config.showHotWords !== false; // 默认显示
    
    return `
        <div class="form-group">
            <label>组件类型</label>
            <input type="text" class="form-control" value="商品搜索" disabled>
        </div>
        
        <div class="form-group">
            <label>搜索框提示文字</label>
            <input type="text" class="form-control" value="${placeholder}"
                onchange="updateComponentConfig(${index}, 'placeholder', this.value)">
        </div>
        
        <div class="form-group">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" ${showHotWords ? 'checked' : ''}
                    onchange="updateComponentConfig(${index}, 'showHotWords', this.checked)"
                    style="margin-right: 8px;">
                <span>显示热门搜索词</span>
            </label>
        </div>
    `;
}

// 渲染图片广告组件配置
function renderImageAdComponentConfig(component, index) {
    const imageUrl = component.config.imageUrl || '';
    const linkUrl = component.config.linkUrl || '';
    const linkType = component.config.linkType || 'none'; // none无链接 | goods商品 | page页面 | url外部链接
    
    return `
        <div class="form-group">
            <label>组件类型</label>
            <input type="text" class="form-control" value="图片广告" disabled>
        </div>
        
        <div class="form-group">
            <label>广告图片</label>
            <div style="margin-bottom: 10px;">
                ${imageUrl ? `
                    <div style="position: relative; display: inline-block;">
                        <img src="${imageUrl}" style="max-width: 100%; height: auto; border-radius: 4px;">
                        <button onclick="updateComponentConfig(${index}, 'imageUrl', '')" 
                            style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">×</button>
                    </div>
                ` : `
                    <div style="width: 100%; height: 120px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">
                        暂无图片
                    </div>
                `}
            </div>
            <input type="text" class="form-control" placeholder="请输入图片URL"
                value="${imageUrl}"
                onchange="updateComponentConfig(${index}, 'imageUrl', this.value)">
            <div style="margin-top: 5px; font-size: 12px; color: #999;">
                提示：实际使用时需要上传图片，这里暂时使用URL
            </div>
        </div>
        
        <div class="form-group">
            <label>链接类型</label>
            <select class="form-control" onchange="updateComponentConfig(${index}, 'linkType', this.value)">
                <option value="none" ${linkType === 'none' ? 'selected' : ''}>无链接</option>
                <option value="goods" ${linkType === 'goods' ? 'selected' : ''}>跳转商品</option>
                <option value="page" ${linkType === 'page' ? 'selected' : ''}>跳转页面</option>
                <option value="url" ${linkType === 'url' ? 'selected' : ''}>外部链接</option>
            </select>
        </div>
        
        ${linkType !== 'none' ? `
            <div class="form-group">
                <label>链接地址</label>
                <input type="text" class="form-control" placeholder="请输入链接地址"
                    value="${linkUrl}"
                    onchange="updateComponentConfig(${index}, 'linkUrl', this.value)">
            </div>
        ` : ''}
    `;
}

// 更新组件配置
function updateComponentConfig(index, key, value) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    if (!pageData.components[index].config) {
        pageData.components[index].config = {};
    }
    pageData.components[index].config[key] = value;
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 刷新预览
    const phoneContent = document.getElementById('h5-content');
    phoneContent.innerHTML = renderPhoneContent(pageData.components);
    
    // 重新选中当前组件
    setTimeout(() => {
        const selected = document.querySelector(`.preview-component[data-index="${index}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    }, 0);
}

// 切换商品选择
function toggleGoodsSelection(index, goodsId, checked) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    if (!pageData.components[index].config) {
        pageData.components[index].config = {};
    }
    if (!pageData.components[index].config.selectedGoods) {
        pageData.components[index].config.selectedGoods = [];
    }
    
    if (checked) {
        if (!pageData.components[index].config.selectedGoods.includes(goodsId)) {
            pageData.components[index].config.selectedGoods.push(goodsId);
        }
    } else {
        pageData.components[index].config.selectedGoods = 
            pageData.components[index].config.selectedGoods.filter(id => id !== goodsId);
    }
    
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 刷新预览
    const phoneContent = document.getElementById('h5-content');
    phoneContent.innerHTML = renderPhoneContent(pageData.components);
    
    // 刷新配置面板以更新已选择数量
    showComponentConfig(index);
    
    // 重新选中当前组件
    setTimeout(() => {
        const selected = document.querySelector(`.preview-component[data-index="${index}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    }, 0);
}

// 获取组件类型名称
function getComponentTypeName(type) {
    const names = {
        'goods': '商品',
        'goods-group': '商品分组',
        'goods-search': '商品搜索',
        'image-ad': '图片广告'
    };
    return names[type] || type;
}

// 添加组件到页面
function addComponentToPage(type) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    
    // 检查组件数量限制
    const currentCount = getComponentCount(pageData.components, type);
    if (currentCount >= 5) {
        showToast('该组件最多只能添加5次', 'error');
        return;
    }
    
    // 创建新组件
    const newComponent = {
        type: type,
        config: getDefaultComponentConfig(type)
    };
    
    pageData.components.push(newComponent);
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 刷新已选组件列表
    const selectedList = document.getElementById('selected-components-list');
    if (selectedList) {
        selectedList.innerHTML = renderSelectedComponentsList(pageData.components);
    }
    
    // 刷新预览区
    const phoneContent = document.getElementById('h5-content');
    phoneContent.innerHTML = renderPhoneContent(pageData.components);
    
    // 更新组件计数
    updateComponentCounts(pageData.components);
    
    // 自动选中新添加的组件
    const newIndex = pageData.components.length - 1;
    setTimeout(() => {
        selectComponentFromList(newIndex);
    }, 100);
    
    showToast('组件已添加', 'success');
}

// 获取组件默认配置
function getDefaultComponentConfig(type) {
    const defaults = {
        'goods': {
            selectedGoods: [],
            displayStyle: 'grid',
            columns: 2,
            gap: 10
        },
        'goods-group': {
            selectedCategory: '',
            displayCount: 10,
            displayStyle: 'grid'
        },
        'goods-search': {
            placeholder: '搜索商品',
            showHotWords: true,
            hotWords: ['口红', '面膜', '精华']
        },
        'image-ad': {
            imageUrl: '',
            linkUrl: '',
            height: 200,
            borderRadius: 0
        }
    };
    return defaults[type] || {};
}

// 更新组件计数显示
function updateComponentCounts(components) {
    const types = ['goods', 'goods-group', 'goods-search', 'image-ad'];
    types.forEach(type => {
        const count = getComponentCount(components, type);
        const countEl = document.getElementById(`count-${type}`);
        if (countEl) {
            countEl.textContent = `${count}/5`;
            if (count >= 5) {
                countEl.classList.add('limit-reached');
                // 禁用对应的组件项
                const componentItem = document.querySelector(`.component-item[data-type="${type}"]`);
                if (componentItem) {
                    componentItem.classList.add('disabled');
                }
            } else {
                countEl.classList.remove('limit-reached');
                const componentItem = document.querySelector(`.component-item[data-type="${type}"]`);
                if (componentItem) {
                    componentItem.classList.remove('disabled');
                }
            }
        }
    });
}

// 从列表中删除组件
function removeComponentFromList(index) {
    if (!confirm('确定要删除此组件吗？')) return;
    
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    pageData.components.splice(index, 1);
    sessionStorage.setItem('editingPage', JSON.stringify(pageData));
    
    // 刷新已选组件列表
    const selectedList = document.getElementById('selected-components-list');
    if (selectedList) {
        selectedList.innerHTML = renderSelectedComponentsList(pageData.components);
    }
    
    // 刷新预览区
    const phoneContent = document.getElementById('h5-content');
    phoneContent.innerHTML = renderPhoneContent(pageData.components);
    
    // 更新组件计数
    updateComponentCounts(pageData.components);
    
    // 重置配置面板为页面设置
    const configPanel = document.getElementById('config-panel');
    configPanel.innerHTML = renderPageSettingsPanel(pageData);
    
    showToast('组件已删除', 'success');
}

// 选择页面设置
function selectPageSettings() {
    // 移除所有选中状态
    document.querySelectorAll('.selected-component-item').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelectorAll('.preview-component').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 选中页面设置
    const pageSettingsItem = document.querySelector('.selected-component-item.page-settings');
    if (pageSettingsItem) {
        pageSettingsItem.classList.add('selected');
    }
    
    // 显示页面设置面板
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    const configPanel = document.getElementById('config-panel');
    configPanel.innerHTML = renderPageSettingsPanel(pageData);
}

// 删除组件（从预览区删除）
function removeComponent(index) {
    removeComponentFromList(index);
}

// 关闭页面编辑器
function closePageEditor() {
    if (confirm('确定要关闭编辑器吗？未保存的更改将丢失。')) {
        sessionStorage.removeItem('editingPage');
        sessionStorage.removeItem('isNewPage');
        // 清除标记，恢复自动刷新
        isInPageEditor = false;
        renderPage('mall-decoration');
    }
}

// 保存草稿
function savePageDraft() {
    savePage('draft');
}

// 保存并发布
function saveAndPublishPage() {
    savePage('published');
}

// 保存页面
function savePage(status) {
    const pageData = JSON.parse(sessionStorage.getItem('editingPage'));
    const isNewPage = sessionStorage.getItem('isNewPage') === 'true';
    
    // 获取页面名称和别名
    const nameInput = document.getElementById('page-name-input');
    const aliasInput = document.getElementById('page-alias-input');
    
    if (nameInput) pageData.name = nameInput.value.trim();
    if (aliasInput) pageData.alias = aliasInput.value.trim();
    
    if (!pageData.name) {
        showToast('请输入页面名称', 'error');
        return;
    }
    
    if (!pageData.alias) {
        showToast('请输入页面别名', 'error');
        return;
    }
    
    // 验证别名格式
    if (!/^[a-z0-9-]+$/.test(pageData.alias)) {
        showToast('页面别名只能包含小写字母、数字和连字符', 'error');
        return;
    }
    
    // 检查别名是否已存在（排除自己）
    const pages = DataStore.get('mallPages');
    if (pages.some(p => p.alias === pageData.alias && p.id !== pageData.id)) {
        showToast('页面别名已存在', 'error');
        return;
    }
    
    pageData.status = status;
    pageData.updateTime = new Date().toLocaleString('zh-CN');
    
    if (isNewPage) {
        DataStore.add('mallPages', pageData);
        showToast('页面创建成功', 'success');
    } else {
        DataStore.update('mallPages', pageData.id, pageData);
        showToast('页面保存成功', 'success');
    }
    
    // 清除临时数据
    sessionStorage.removeItem('editingPage');
    sessionStorage.removeItem('isNewPage');
    
    // 清除标记，恢复自动刷新
    isInPageEditor = false;
    
    // 返回列表
    renderPage('mall-decoration');
}

// 复制页面
function copyMallPage(pageId) {
    const page = DataStore.findById('mallPages', pageId);
    if (!page) return;
    
    const newPage = {
        ...page,
        id: 'PAGE' + Date.now(),
        name: page.name + ' - 副本',
        alias: page.alias + '-copy-' + Date.now(),
        isHomePage: false,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN'),
        lastEditor: '系统管理员',
        status: 'draft'
    };
    
    DataStore.add('mallPages', newPage);
    showToast('页面复制成功', 'success');
    renderPage('mall-decoration');
}

// 预览页面
function previewMallPage(pageId) {
    const page = DataStore.findById('mallPages', pageId);
    if (!page) return;
    
    openModal('预览页面 - ' + page.name, `
        <div style="text-align: center; padding: 40px; color: #999;">
            <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
            <p>页面预览功能开发中...</p>
            <p style="font-size: 12px; margin-top: 10px;">页面别名：${page.alias}</p>
        </div>
    `, `
        <button class="btn btn-primary" onclick="closeModal()">关闭</button>
    `);
}

// 设为主页
function setAsHomePage(pageId) {
    const page = DataStore.findById('mallPages', pageId);
    if (!page) return;
    
    if (page.isHomePage) {
        showToast('该页面已经是主页', 'info');
        return;
    }
    
    // 使用页面内弹窗进行二次确认
    openModal('确认设为主页', `
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <p style="font-size: 16px; margin-bottom: 20px;">确定要将"<strong>${page.name}</strong>"设为主页吗？</p>
            <p style="font-size: 14px; color: #666;">原主页会自动取消主页状态</p>
        </div>
    `, `
        <button class="btn btn-primary" onclick="confirmSetAsHomePage('${pageId}')">确定</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 确认设为主页
function confirmSetAsHomePage(pageId) {
    // 获取所有页面
    const pages = DataStore.get('mallPages');
    
    // 将所有页面的isHomePage设为false
    pages.forEach(p => {
        if (p.isHomePage) {
            DataStore.update('mallPages', p.id, { 
                isHomePage: false,
                updateTime: new Date().toLocaleString('zh-CN'),
                lastEditor: '系统管理员'
            });
        }
    });
    
    // 将当前页面设为主页
    DataStore.update('mallPages', pageId, { 
        isHomePage: true,
        updateTime: new Date().toLocaleString('zh-CN'),
        lastEditor: '系统管理员'
    });
    
    closeModal();
    showToast('主页设置成功', 'success');
    renderPage('mall-decoration');
}

// 删除页面
function deleteMallPage(pageId) {
    const page = DataStore.findById('mallPages', pageId);
    if (!page) return;
    
    if (page.isHomePage) {
        showToast('主页不能删除', 'error');
        return;
    }
    
    if (!confirm(`确定要删除页面"${page.name}"吗？`)) return;
    
    DataStore.delete('mallPages', pageId);
    showToast('页面删除成功', 'success');
    renderPage('mall-decoration');
}

// 兼容旧的函数名
function showMallDecorationTab(tab) {
    switchMallDecorationTab(tab);
}

// ========== 财务管理 ==========

// 预收款管理
function renderDeposits() {
    const deposits = DataStore.get('deposits');
    const depositLogs = DataStore.get('depositLogs');
    const merchants = DataStore.get('merchants');
    
    const totalDeposit = deposits.reduce((sum, d) => sum + d.totalDeposit, 0);
    const totalAvailable = deposits.reduce((sum, d) => sum + d.availableDeposit, 0);
    const totalFrozen = deposits.reduce((sum, d) => sum + d.frozenDeposit, 0);
    const totalSettled = deposits.reduce((sum, d) => sum + d.settledDeposit, 0);
    
    return `
        <div class="page-header">
            <h2 class="page-title">预收款管理</h2>
            <span class="breadcrumb">财务管理 / 预收款管理</span>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card"><div class="label">累计预收款</div><div class="value">¥${totalDeposit.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">可使用金额</div><div class="value" style="color: #52c41a;">¥${totalAvailable.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">冻结中金额</div><div class="value" style="color: #faad14;">¥${totalFrozen.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">已结算金额</div><div class="value" style="color: #1890ff;">¥${totalSettled.toLocaleString()}</div></div>
        </div>
        
        <div class="tabs">
            <div class="tab-item active" onclick="showDepositTab('overview')">商户总览</div>
            <div class="tab-item" onclick="showDepositTab('logs')">资金流水</div>
            <div class="tab-item" onclick="showDepositTab('invoice')">发票管理</div>
        </div>
        
        <div class="card" id="deposit-content">
            <div class="card-header"><h3 class="card-title">商户保证金总览</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th>
                            <th>商户名称</th>
                            <th>累计充值</th>
                            <th>充值次数</th>
                            <th>可使用</th>
                            <th>需提现</th>
                            <th>冻结中</th>
                            <th>已结算</th>
                            <th>已开票</th>
                            <th>待开票</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deposits.map(d => {
                            const merchant = merchants.find(m => m.id === d.merchantId);
                            return `
                            <tr>
                                <td>${d.merchantId}</td>
                                <td>${merchant?.name || '-'}</td>
                                <td>¥${d.totalDeposit.toLocaleString()}</td>
                                <td>${d.rechargeCount} 次</td>
                                <td style="color: #52c41a;">¥${d.availableDeposit.toLocaleString()}</td>
                                <td style="color: ${d.needWithdrawDeposit > 0 ? '#ff4d4f' : '#999'};">¥${d.needWithdrawDeposit.toLocaleString()}</td>
                                <td style="color: #faad14;">¥${d.frozenDeposit.toLocaleString()}</td>
                                <td style="color: #1890ff;">¥${d.settledDeposit.toLocaleString()}</td>
                                <td>¥${d.invoicedAmount.toLocaleString()}</td>
                                <td>¥${d.pendingInvoiceAmount.toLocaleString()}</td>
                                <td class="action-btns">
                                    <button class="btn btn-link" onclick="showInvoiceModal('${d.merchantId}')">开发票</button>
                                    <button class="btn btn-link" onclick="viewDepositDetail('${d.merchantId}')">详情</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 订单管理
function renderOrders() {
    const orders = DataStore.get('orders');
    return `
        <div class="page-header">
            <h2 class="page-title">订单管理</h2>
            <span class="breadcrumb">财务管理 / 订单管理</span>
        </div>
        
        <div class="tabs">
            <div class="tab-item active" onclick="filterMgOrders('all')">全部 (${orders.length})</div>
            <div class="tab-item" onclick="filterMgOrders('pending_deposit')">待充值 (${orders.filter(o => o.status === 'pending_deposit').length})</div>
            <div class="tab-item" onclick="filterMgOrders('pending_ship')">待发货 (${orders.filter(o => o.status === 'pending_ship').length})</div>
            <div class="tab-item" onclick="filterMgOrders('shipped')">已发货 (${orders.filter(o => o.status === 'shipped').length})</div>
            <div class="tab-item" onclick="filterMgOrders('completed')">已完成 (${orders.filter(o => o.status === 'completed').length})</div>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>商户号</th>
                            <th>门店</th>
                            <th>商品</th>
                            <th>订单金额</th>
                            <th>微信支付</th>
                            <th>需充保证金</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="mg-orders-tbody">
                        ${orders.map(order => `
                            <tr data-status="${order.status}">
                                <td>${order.id}</td>
                                <td>${order.merchantId}</td>
                                <td>${order.storeName}</td>
                                <td>${order.goodsName} x${order.quantity}</td>
                                <td>¥${order.totalAmount}</td>
                                <td>¥${order.wxPayAmount}</td>
                                <td>${order.needDeposit > 0 ? `<span style="color: #ff4d4f;">¥${order.needDeposit.toFixed(2)}</span>` : '-'}</td>
                                <td>${getOrderStatusTag(order.status)}</td>
                                <td>${order.createTime}</td>
                                <td class="action-btns">
                                    ${order.status === 'pending_ship' ? `<button class="btn btn-success btn-sm" onclick="shipOrder('${order.id}')">发货</button>` : ''}
                                    ${order.status === 'shipped' ? `<button class="btn btn-primary btn-sm" onclick="completeOrder('${order.id}')">确认收货</button>` : ''}
                                    <button class="btn btn-link" onclick="viewMgOrderDetail('${order.id}')">详情</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 财务对账
function renderFinance() {
    const orders = DataStore.get('orders').filter(o => o.status === 'completed');
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPlatformProfit = orders.reduce((sum, o) => sum + o.platformProfit, 0);
    const totalOperationProfit = orders.reduce((sum, o) => sum + o.operationProfit, 0);
    
    return `
        <div class="page-header">
            <h2 class="page-title">财务对账</h2>
            <span class="breadcrumb">财务管理 / 财务对账</span>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card"><div class="label">已结算销售额</div><div class="value">¥${totalSales.toLocaleString()}</div></div>
            <div class="stat-card"><div class="label">供应链平台收益</div><div class="value" style="color: #52c41a;">¥${totalPlatformProfit.toFixed(2)}</div></div>
            <div class="stat-card"><div class="label">私域运营平台收益</div><div class="value" style="color: #1890ff;">¥${totalOperationProfit.toFixed(2)}</div></div>
            <div class="stat-card"><div class="label">已结算订单</div><div class="value">${orders.length}</div></div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">结算明细</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>商户号</th>
                            <th>订单金额</th>
                            <th>手续费</th>
                            <th>商家收益</th>
                            <th>品牌总部</th>
                            <th>私域运营</th>
                            <th>供应链平台</th>
                            <th>结算时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.merchantId}</td>
                                <td>¥${order.totalAmount}</td>
                                <td>¥${order.fee.toFixed(2)}</td>
                                <td>¥${order.merchantActualProfit.toFixed(2)}</td>
                                <td>${order.brandProfit > 0 ? `¥${order.brandProfit.toFixed(2)}` : '-'}</td>
                                <td>¥${order.operationProfit.toFixed(2)}</td>
                                <td>¥${order.platformProfit.toFixed(2)}</td>
                                <td>${order.settleTime || '待结算'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========== 辅助函数 ==========
function getApplyStatusTag(status) {
    const statusMap = {
        'pending': '<span class="status-tag status-warning">待审核</span>',
        'pending_sign': '<span class="status-tag status-info">待签署</span>',
        'signed': '<span class="status-tag status-success">已合作</span>',
        'rejected': '<span class="status-tag status-danger">已拒绝</span>',
        'need_maintain': '<span class="status-tag status-warning">待重新维护</span>'
    };
    return statusMap[status] || status;
}

function getOrderStatusTag(status) {
    const statusMap = {
        'pending_deposit': '<span class="status-tag status-warning">待充值</span>',
        'pending_ship': '<span class="status-tag status-info">待发货</span>',
        'shipped': '<span class="status-tag status-primary">已发货</span>',
        'completed': '<span class="status-tag status-success">已完成</span>'
    };
    return statusMap[status] || status;
}

// ========== 审核相关 ==========
function showAuditModal(appId) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    // 获取分账接收方信息
    let receiverInfo = '';
    let receiverApplicationInfo = '';
    
    if (app.profitReceiverId) {
        if (app.profitReceiverId === 'pending' && app.hasPendingReceiverApplication) {
            // 有待审核的分账接收方申请
            const receiverApp = DataStore.findById('profitReceiverApplications', app.pendingReceiverApplicationId);
            if (receiverApp) {
                receiverApplicationInfo = `
                    <div class="form-group" style="border: 2px solid #1890ff; padding: 15px; border-radius: 8px; background: #e6f7ff;">
                        <label style="color: #1890ff; font-weight: 600;">📋 新增分账接收方申请</label>
                        <div style="margin-top: 10px;">
                            <p><strong>接收方名称：</strong>${receiverApp.receiverName}</p>
                            <p><strong>账户类型：</strong>${receiverApp.receiverType === 'company' ? '对公账户' : '对私账户'}</p>
                            <p><strong>联系电话：</strong>${receiverApp.contactPhone}</p>
                            ${receiverApp.receiverType === 'company' ? `
                                <p><strong>收款账户姓名：</strong>${receiverApp.accountName || '-'}</p>
                                <p><strong>收款账户手机：</strong>${receiverApp.accountPhone || '-'}</p>
                                <p><strong>证件号：</strong>${receiverApp.idCardNumber || '-'}</p>
                            ` : `
                                <p><strong>营业执照号：</strong>${receiverApp.businessLicense || '-'}</p>
                                <p><strong>公司名称：</strong>${receiverApp.companyName || '-'}</p>
                                <p><strong>法人姓名：</strong>${receiverApp.legalName || '-'}</p>
                                <p><strong>法人身份证：</strong>${receiverApp.legalIdCard || '-'}</p>
                                <p><strong>银行账户：</strong>${receiverApp.bankAccount || '-'}</p>
                                <p><strong>开户行：</strong>${receiverApp.bankCode || '-'}</p>
                            `}
                            ${receiverApp.remark ? `<p><strong>备注说明：</strong>${receiverApp.remark}</p>` : ''}
                            <p style="color: #faad14; margin-top: 10px;">⚠️ 此分账接收方为商户新申请添加，需要一并审核</p>
                        </div>
                    </div>
                `;
            }
        } else {
            // 选择了已有的分账接收方
            const receiver = DataStore.findById('profitReceivers', app.profitReceiverId);
            if (receiver) {
                receiverInfo = `
                    <div class="form-group">
                        <label>分账接收方：</label>
                        <span>${receiver.receiverName} - ${receiver.receiverType === 'merchant' ? '商户号' : '银行账户'}</span>
                    </div>
                `;
            }
        }
    }
    
    // 如果有备注但没有选择分账接收方
    if (app.receiverRemark && !app.profitReceiverId) {
        receiverInfo = `
            <div class="form-group" style="border: 2px solid #faad14; padding: 15px; border-radius: 8px; background: #fff7e6;">
                <label style="color: #d46b08; font-weight: 600;">⚠️ 分账接收方备注</label>
                <p style="margin-top: 10px;">${app.receiverRemark}</p>
                <p style="color: #999; font-size: 12px; margin-top: 5px;">商户说明需要添加分账接收方，但未提交具体信息</p>
            </div>
        `;
    }
    
    // AI自动检测经营范围和分账功能
    const scopeValid = merchant.scope.includes('化妆品') && (merchant.scope.includes('零售') || merchant.scope.includes('销售'));
    const hasSubAccount = merchant.hasSubAccount;
    
    let autoRejectReason = '';
    if (!scopeValid) {
        autoRejectReason += '1.营业执照经营范围不符合要求，需包含"化妆品零售"或"化妆品销售"；';
    }
    if (!hasSubAccount) {
        autoRejectReason += '2.未开通分账功能，请联系经销商开通；';
    }
    
    openModal('审核申请', `
        <div class="form-group">
            <label>商户号：</label>
            <span>${app.merchantId}</span>
        </div>
        <div class="form-group">
            <label>商户名称：</label>
            <span>${merchant.name}</span>
        </div>
        <div class="form-group">
            <label>营业执照主体：</label>
            <span>${merchant.companyName}</span>
        </div>
        <div class="form-group">
            <label>申请人：</label>
            <span>${app.applicantName} / ${app.applicantPhone}</span>
        </div>
        <div class="form-group">
            <label>营业执照：</label>
            <div style="width: 300px; height: 200px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px;">
                营业执照图片
            </div>
        </div>
        <div class="form-group">
            <label>营业执照判断是否符合所需经营范围：</label>
            <div style="display: flex; gap: 20px; margin-top: 10px;">
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="radio" name="scopeValid" value="true" checked>
                    <span>符合</span>
                </label>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                    <input type="radio" name="scopeValid" value="false">
                    <span>不符合</span>
                </label>
            </div>
        </div>
        
        <div class="form-group">
            <label>商家收益比例区间（%）：</label>
            <input type="text" id="merchantRatioRange" class="form-control" placeholder="例如：8-12" value="8-12">
        </div>
        <div class="form-group">
            <label>供应链平台收益比例区间（%）：</label>
            <input type="text" id="platformRatioRange" class="form-control" placeholder="例如：68-72" value="68-72">
        </div>
        <div class="form-group">
            <label>私域运营平台收益比例区间（%）：</label>
            <input type="text" id="operationRatioRange" class="form-control" placeholder="例如：18-22" value="18-22">
        </div>
        <div class="form-group">
            <label>审核备注：</label>
            <textarea id="auditRemark" class="form-control" rows="3" placeholder="审核意见...">资质齐全，经营范围符合要求，同意合作</textarea>
        </div>
    `, `
        <button class="btn btn-success" onclick="approveApp('${appId}')">审核通过</button>
        <button class="btn btn-danger" onclick="rejectApp('${appId}')">拒绝</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

function autoRejectApp(appId, reason) {
    DataStore.update('applications', appId, {
        status: 'rejected',
        auditTime: new Date().toLocaleString('zh-CN'),
        auditor: '系统自动审核',
        auditRemark: `【自动审核拒绝】${reason}`
    });
    closeModal();
    showToast('已自动拒绝申请', 'success');
    renderPage('merchants-audit');
}

function approveApp(appId) {
    const scopeValid = document.querySelector('input[name="scopeValid"]:checked').value === 'true';
    const merchantRatioRange = document.getElementById('merchantRatioRange').value;
    const platformRatioRange = document.getElementById('platformRatioRange').value;
    const operationRatioRange = document.getElementById('operationRatioRange').value;
    const auditRemark = document.getElementById('auditRemark').value;
    
    // 验证营业执照经营范围
    if (!scopeValid) {
        showToast('营业执照经营范围不符合所需经营范围，只能拒绝让商户进行工商变更', 'error');
        return;
    }
    
    // 验证输入
    if (!merchantRatioRange || !platformRatioRange || !operationRatioRange) {
        showToast('请填写完整的分成比例区间', 'error');
        return;
    }
    
    const app = DataStore.findById('applications', appId);
    
    // 根据PRD要求，设置实际执行的分成比例（取区间中间值）
    const merchantRange = merchantRatioRange.split('-');
    const platformRange = platformRatioRange.split('-');
    const operationRange = operationRatioRange.split('-');
    
    const merchantRatio = Math.round((parseFloat(merchantRange[0]) + parseFloat(merchantRange[1])) / 2);
    const platformRatio = Math.round((parseFloat(platformRange[0]) + parseFloat(platformRange[1])) / 2);
    const operationRatio = Math.round((parseFloat(operationRange[0]) + parseFloat(operationRange[1])) / 2);
    
    // 验证比例总和是否为100%
    if (merchantRatio + platformRatio + operationRatio !== 100) {
        showToast('分成比例总和必须等于100%', 'error');
        return;
    }
    
    // 生成协议列表
    const contracts = [
        { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
        { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
    ];
    
    DataStore.update('applications', appId, {
        status: 'pending_sign',
        auditTime: new Date().toLocaleString('zh-CN'),
        auditor: '李审核员',
        auditRemark,
        merchantRatioRange,
        platformRatioRange,
        operationRatioRange,
        // 实际执行的分成比例
        merchantRatio,
        platformRatio,
        operationRatio,
        brandRatio: 0,  // 默认为0
        contracts
    });
    
    closeModal();
    showToast('审核通过，等待商户签署协议', 'success');
    renderPage('merchants-audit');
}

function rejectApp(appId) {
    const auditRemark = document.getElementById('auditRemark').value;
    DataStore.update('applications', appId, {
        status: 'rejected',
        auditTime: new Date().toLocaleString('zh-CN'),
        auditor: '李审核员',
        auditRemark
    });
    closeModal();
    showToast('已拒绝申请', 'success');
    renderPage('merchants-audit');
}

// ========== 库存管理 ==========
function showStockModal(productId) {
    const product = DataStore.findById('products', productId);
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>调整库存 - ${product.name}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>当前库存：</label>
                        <span style="font-size: 20px; font-weight: bold; color: #1890ff;">${product.stock}</span>
                    </div>
                    <div class="form-group">
                        <label>操作类型：</label>
                        <select id="stockType" class="form-control">
                            <option value="in">入库</option>
                            <option value="out">出库</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量：</label>
                        <input type="number" id="stockQuantity" class="form-control" min="1" value="10">
                    </div>
                    <div class="form-group">
                        <label>备注：</label>
                        <textarea id="stockRemark" class="form-control" rows="2" placeholder="调整原因..."></textarea>
                    </div>
                    <div style="margin-top: 20px; text-align: center;">
                        <button class="btn btn-primary" onclick="saveStockChange('${productId}')">确认</button>
                        <button class="btn btn-outline" onclick="closeModal()">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveStockChange(productId) {
    const product = DataStore.findById('products', productId);
    const type = document.getElementById('stockType').value;
    const quantity = parseInt(document.getElementById('stockQuantity').value);
    const remark = document.getElementById('stockRemark').value;
    
    const beforeStock = product.stock;
    const afterStock = type === 'in' ? beforeStock + quantity : beforeStock - quantity;
    
    if (afterStock < 0) {
        showToast('库存不足，无法出库', 'error');
        return;
    }
    
    // 更新库存
    DataStore.update('products', productId, { stock: afterStock });
    
    // 记录日志
    DataStore.add('stockLogs', {
        id: 'STK' + Date.now(),
        productId,
        type,
        quantity,
        beforeStock,
        afterStock,
        operator: '系统管理员',
        remark,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('库存调整成功', 'success');
    renderPage('products');
}

function showStockHistory(productId) {
    const product = DataStore.findById('products', productId);
    const logs = DataStore.findBy('stockLogs', 'productId', productId);
    
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>出入库记录 - ${product.name}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>时间</th><th>类型</th><th>数量</th><th>变更前</th><th>变更后</th><th>操作人</th><th>备注</th></tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => `
                                    <tr>
                                        <td>${log.createTime}</td>
                                        <td>${log.type === 'in' ? '<span style="color: #52c41a;">入库</span>' : '<span style="color: #ff4d4f;">出库</span>'}</td>
                                        <td>${log.quantity}</td>
                                        <td>${log.beforeStock}</td>
                                        <td>${log.afterStock}</td>
                                        <td>${log.operator}</td>
                                        <td>${log.remark}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function syncProducts() {
    showToast('产品同步成功', 'success');
}

function showBatchStockModal() {
    showToast('批量出入库功能开发中', 'info');
}

// ========== 商品管理 ==========
function showCreateGoodsModal() {
    const products = DataStore.get('products');
    const categories = DataStore.get('categories');
    
    // 按供应商分组产品
    const productsBySupplier = {};
    products.forEach(p => {
        if (!productsBySupplier[p.supplier]) {
            productsBySupplier[p.supplier] = [];
        }
        productsBySupplier[p.supplier].push(p);
    });
    
    const suppliers = Object.keys(productsBySupplier);
    
    openModal('创建商品组合', `
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 商品名称：</label>
            <input type="text" id="goodsName" class="form-control" placeholder="请输入商品名称">
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 分类：</label>
            <select id="goodsCategory" class="form-control">
                <option value="">请选择分类</option>
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 供应商：</label>
            <select id="goodsSupplier" class="form-control" onchange="filterProductsBySupplier()">
                <option value="">请选择供应商</option>
                ${suppliers.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <p style="color: #999; font-size: 13px; margin-top: 5px;">注意：只能组合同一供应商的产品</p>
        </div>
        <div class="form-group" id="productSelectionGroup" style="display: none;">
            <label><span style="color: #ff4d4f;">*</span> 选择产品：</label>
            <div id="productSelection"></div>
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 销售价格（元）：</label>
            <input type="number" id="goodsSalePrice" class="form-control" placeholder="请输入销售价格" min="0" step="0.01">
        </div>
        <div class="form-group">
            <label>商城折前价（元）：</label>
            <input type="number" id="goodsOriginalPrice" class="form-control" placeholder="不填则自动为销售价的1.2倍" min="0" step="0.01">
        </div>
        <div id="costPreview" style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; display: none;">
            <div>成本价：<strong id="previewCostPrice">0</strong> 元</div>
            <div>销售价：<strong id="previewSalePrice">0</strong> 元</div>
            <div>毛利润：<strong id="previewProfit">0</strong> 元</div>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveNewGoods()">创建</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
    
    // 保存产品数据到全局变量供后续使用
    window.productsBySupplier = productsBySupplier;
}

function filterProductsBySupplier() {
    const supplier = document.getElementById('goodsSupplier').value;
    const productSelectionGroup = document.getElementById('productSelectionGroup');
    const productSelection = document.getElementById('productSelection');
    
    if (!supplier) {
        productSelectionGroup.style.display = 'none';
        return;
    }
    
    productSelectionGroup.style.display = 'block';
    const products = window.productsBySupplier[supplier] || [];
    
    productSelection.innerHTML = products.map(p => `
        <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
            <label style="display: flex; align-items: center;">
                <input type="checkbox" class="product-check" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-supplier="${p.supplier}" data-delivery="${p.deliveryMethod}" onchange="updateCostPreview()">
                <span style="margin-left: 10px; flex: 1;">${p.name} (¥${p.price}) - 库存: ${p.stock}</span>
                <span style="margin: 0 10px;">数量：</span>
                <input type="number" class="product-quantity" data-id="${p.id}" min="1" value="1" style="width: 60px;" disabled onchange="updateCostPreview()">
            </label>
        </div>
    `).join('');
    
    // 监听复选框变化
    document.querySelectorAll('.product-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const quantityInput = document.querySelector(`.product-quantity[data-id="${e.target.dataset.id}"]`);
            quantityInput.disabled = !e.target.checked;
        });
    });
}

function updateCostPreview() {
    let costPrice = 0;
    let deliveryMethod = '';
    
    document.querySelectorAll('.product-check:checked').forEach(checkbox => {
        const productId = checkbox.dataset.id;
        const lockedPrice = parseFloat(checkbox.dataset.price);
        const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value);
        costPrice += lockedPrice * quantity;
        
        if (!deliveryMethod) {
            deliveryMethod = checkbox.dataset.delivery;
        }
    });
    
    const salePrice = parseFloat(document.getElementById('goodsSalePrice').value) || 0;
    const profit = salePrice - costPrice;
    
    if (costPrice > 0) {
        document.getElementById('costPreview').style.display = 'block';
        document.getElementById('previewCostPrice').textContent = costPrice.toFixed(2);
        document.getElementById('previewSalePrice').textContent = salePrice.toFixed(2);
        document.getElementById('previewProfit').textContent = profit.toFixed(2);
        document.getElementById('previewProfit').style.color = profit > 0 ? '#52c41a' : '#ff4d4f';
    } else {
        document.getElementById('costPreview').style.display = 'none';
    }
}

// 监听销售价格输入
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', (e) => {
        if (e.target.id === 'goodsSalePrice') {
            updateCostPreview();
        }
    });
});

function saveNewGoods() {
    const name = document.getElementById('goodsName').value;
    const categoryId = document.getElementById('goodsCategory').value;
    const supplier = document.getElementById('goodsSupplier').value;
    const salePrice = parseFloat(document.getElementById('goodsSalePrice').value);
    const originalPriceInput = document.getElementById('goodsOriginalPrice').value;
    const originalPrice = originalPriceInput ? parseFloat(originalPriceInput) : salePrice * 1.2;
    
    if (!name || !categoryId || !supplier || !salePrice) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    const category = DataStore.findById('categories', categoryId).name;
    
    const selectedProducts = [];
    let costPrice = 0;
    let deliveryMethod = '';
    
    document.querySelectorAll('.product-check:checked').forEach(checkbox => {
        const productId = checkbox.dataset.id;
        const productName = checkbox.dataset.name;
        const lockedPrice = parseFloat(checkbox.dataset.price);
        const quantity = parseInt(document.querySelector(`.product-quantity[data-id="${productId}"]`).value);
        
        selectedProducts.push({ productId, productName, quantity, lockedPrice });
        costPrice += lockedPrice * quantity;
        
        if (!deliveryMethod) {
            deliveryMethod = checkbox.dataset.delivery;
        }
    });
    
    if (selectedProducts.length === 0) {
        showToast('请至少选择一个产品', 'error');
        return;
    }
    
    if (salePrice < costPrice) {
        if (!confirm(`销售价格(¥${salePrice})低于成本价(¥${costPrice.toFixed(2)})，确定要创建吗？`)) {
            return;
        }
    }
    
    const newGoods = {
        id: 'SPU' + Date.now(),
        name,
        category,
        categoryId,
        supplier,
        products: selectedProducts,
        costPrice,
        salePrice,
        originalPrice,
        status: 'offline',
        deliveryMethod: deliveryMethod || '一件代发',
        updateTime: new Date().toLocaleString('zh-CN'),
        coverImg: '封面图',
        excludeAreas: [],
        freeShipping: true,
        shippingTemplateId: 'SHIP001'
    };
    
    DataStore.add('goods', newGoods);
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId: newGoods.id,
        action: '创建商品',
        operator: '系统管理员',
        detail: `创建商品组合：${name}，包含${selectedProducts.length}个产品`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('商品创建成功', 'success');
    renderPage('goods');
}

function showGoodsDetail(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const prices = DataStore.findBy('goodsPrices', 'goodsId', goodsId);
    const logs = DataStore.findBy('goodsLogs', 'goodsId', goodsId);
    
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" style="max-width: 900px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>商品详情 - ${goods.name}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="tabs" style="margin-bottom: 20px;">
                        <div class="tab-item active" onclick="switchGoodsTab('price', '${goodsId}')">价格列表</div>
                        <div class="tab-item" onclick="switchGoodsTab('products', '${goodsId}')">组合产品</div>
                        <div class="tab-item" onclick="switchGoodsTab('logs', '${goodsId}')">操作记录</div>
                        <div class="tab-item" onclick="switchGoodsTab('areas', '${goodsId}')">不可发货地区</div>
                        <div class="tab-item" onclick="switchGoodsTab('shipping', '${goodsId}')">包邮设置</div>
                    </div>
                    <div id="goods-detail-content">
                        ${renderGoodsPriceTab(goods, prices)}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function switchGoodsTab(tab, goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const prices = DataStore.findBy('goodsPrices', 'goodsId', goodsId);
    const logs = DataStore.findBy('goodsLogs', 'goodsId', goodsId);
    
    document.querySelectorAll('.modal-content .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('goods-detail-content');
    switch(tab) {
        case 'price': content.innerHTML = renderGoodsPriceTab(goods, prices); break;
        case 'products': content.innerHTML = renderGoodsProductsTab(goods); break;
        case 'logs': content.innerHTML = renderGoodsLogsTab(logs); break;
        case 'areas': content.innerHTML = renderGoodsAreasTab(goods); break;
        case 'shipping': content.innerHTML = renderGoodsShippingTab(goods); break;
    }
}

function renderGoodsPriceTab(goods, prices) {
    return `
        <div style="margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="showAddGoodsPriceModal('${goods.id}')">+ 添加价格</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>销售价</th>
                        <th>折前价</th>
                        <th>开始时间</th>
                        <th>结束时间</th>
                        <th>商家佣金</th>
                        <th>品牌总部</th>
                        <th>私域运营</th>
                        <th>供应链平台</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${prices.length > 0 ? prices.map(p => `
                        <tr>
                            <td>¥${p.salePrice}</td>
                            <td>¥${p.originalPrice}</td>
                            <td>${p.startTime}</td>
                            <td>${p.endTime}</td>
                            <td>¥${p.merchantAmount.toFixed(2)} (${p.merchantRatio}%)</td>
                            <td>¥${p.brandAmount.toFixed(2)}</td>
                            <td>¥${p.operationAmount.toFixed(2)} (${p.operationRatio}%)</td>
                            <td>¥${p.platformAmount.toFixed(2)} (${p.platformRatio}%)</td>
                            <td>${p.status === 'active' ? '<span class="status-tag status-success">生效中</span>' : '<span class="status-tag status-default">已失效</span>'}</td>
                            <td>
                                ${p.status === 'active' ? `<button class="btn btn-link" onclick="terminateGoodsPrice('${p.id}', '${goods.id}')">终止</button>` : '-'}
                            </td>
                        </tr>
                    `).join('') : '<tr><td colspan="10" style="text-align: center; color: #999; padding: 40px;">暂无价格设置，请添加价格</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderGoodsProductsTab(goods) {
    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>产品ID</th><th>产品名称</th><th>数量</th><th>锁定价</th><th>发货方式</th></tr>
                </thead>
                <tbody>
                    ${goods.products.map(p => `
                        <tr>
                            <td>${p.productId}</td>
                            <td>${p.productName}</td>
                            <td>${p.quantity}</td>
                            <td>¥${p.lockedPrice}</td>
                            <td>${goods.deliveryMethod}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderGoodsLogsTab(logs) {
    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr><th>时间</th><th>操作</th><th>操作人</th><th>详情</th></tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${log.createTime}</td>
                            <td>${log.action}</td>
                            <td>${log.operator}</td>
                            <td>${log.detail}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderGoodsAreasTab(goods) {
    const templates = DataStore.get('excludeAreaTemplates');
    return `
        <div style="margin-bottom: 20px;">
            <h4>当前不可发货地区</h4>
            <p style="color: #666;">${goods.excludeAreas.length > 0 ? goods.excludeAreas.join('、') : '无限制'}</p>
        </div>
        <div style="margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="showSetExcludeAreasModal('${goods.id}')">设置不可发货地区</button>
        </div>
        <div>
            <h4>可选地区模板</h4>
            <div class="table-container">
                <table>
                    <thead><tr><th>模板名称</th><th>包含地区</th><th>操作</th></tr></thead>
                    <tbody>
                        ${templates.map(t => `
                            <tr>
                                <td>${t.name}</td>
                                <td>${t.areas.join('、')}</td>
                                <td><button class="btn btn-link" onclick="applyExcludeTemplate('${goods.id}', '${t.id}')">应用</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderGoodsShippingTab(goods) {
    const templates = DataStore.get('shippingTemplates');
    const currentTemplate = templates.find(t => t.id === goods.shippingTemplateId);
    
    return `
        <div style="margin-bottom: 20px;">
            <h4>当前包邮设置</h4>
            <p style="color: #666;">
                包邮状态：${goods.freeShipping ? '<span style="color: #52c41a;">✓ 全国包邮</span>' : '<span style="color: #faad14;">按模板收费</span>'}
            </p>
            ${currentTemplate ? `<p style="color: #666;">当前模板：${currentTemplate.name}</p>` : ''}
        </div>
        <div style="margin-bottom: 15px;">
            <button class="btn btn-primary btn-sm" onclick="showSetShippingModal('${goods.id}')">设置包邮</button>
        </div>
        <div>
            <h4>可选邮费模板</h4>
            <div class="table-container">
                <table>
                    <thead><tr><th>模板名称</th><th>类型</th><th>配置</th><th>操作</th></tr></thead>
                    <tbody>
                        ${templates.map(t => `
                            <tr>
                                <td>${t.name}</td>
                                <td>${t.type === 'free' ? '包邮' : '按地区收费'}</td>
                                <td>${t.type === 'free' ? '全国包邮' : `默认运费 ¥${t.defaultFee}`}</td>
                                <td><button class="btn btn-link" onclick="applyShippingTemplate('${goods.id}', '${t.id}')">应用</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function toggleGoodsStatus(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const newStatus = goods.status === 'online' ? 'offline' : 'online';
    DataStore.update('goods', goodsId, { 
        status: newStatus,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: newStatus === 'online' ? '上架商品' : '下架商品',
        operator: '系统管理员',
        detail: newStatus === 'online' ? '商品上架' : '商品下架',
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast(newStatus === 'online' ? '商品已上架' : '商品已下架', 'success');
    
    // 不重新渲染整个页面，而是更新表格行
    updateGoodsTableRow(goodsId);
    if (selectedGoodsId === goodsId) {
        showGoodsDetailPanel(goodsId);
    }
}

function editGoods(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const products = DataStore.get('products');
    const categories = DataStore.get('categories');
    
    // 获取当前商品的分账比例，如果没有则使用默认值
    const currentMerchantRatio = goods.merchantRatio || 10;
    const currentOperationRatio = goods.operationRatio || 20;
    const currentPlatformRatio = goods.platformRatio || 70;
    
    openModal('编辑商品组合', `
        <div class="form-group">
            <label>商品ID：</label>
            <span>${goods.id}</span>
        </div>
        <div class="form-group">
            <label>商品名称：</label>
            <input type="text" id="editGoodsName" class="form-control" value="${goods.name}">
        </div>
        <div class="form-group">
            <label>分类：</label>
            <select id="editGoodsCategory" class="form-control">
                ${categories.map(c => `<option value="${c.id}" ${goods.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>当前组合产品：</label>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${goods.products.map(p => `<div>${p.productName} x ${p.quantity}</div>`).join('')}
            </div>
        </div>
        <div class="form-group">
            <label>销售价格：</label>
            <input type="number" id="editGoodsSalePrice" class="form-control" value="${goods.salePrice}" min="0" step="0.01">
        </div>
        <div class="form-group">
            <label>折前价：</label>
            <input type="number" id="editGoodsOriginalPrice" class="form-control" value="${goods.originalPrice}" min="0" step="0.01">
        </div>
        
        <p style="color: #999; font-size: 13px; margin-top: 15px;">注意：修改商品组合的产品需要重新创建商品</p>
        <p style="color: #1890ff; font-size: 13px;">💡 提示：三方分账比例设置已移至商品详情面板的"三方分账比例设置"标签页</p>
    `, `
        <button class="btn btn-primary" onclick="saveEditGoods('${goodsId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

function saveEditGoods(goodsId) {
    const name = document.getElementById('editGoodsName').value;
    const categoryId = document.getElementById('editGoodsCategory').value;
    const category = DataStore.findById('categories', categoryId).name;
    const salePrice = parseFloat(document.getElementById('editGoodsSalePrice').value);
    const originalPrice = parseFloat(document.getElementById('editGoodsOriginalPrice').value);
    
    if (!name || !salePrice) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    DataStore.update('goods', goodsId, {
        name,
        category,
        categoryId,
        salePrice,
        originalPrice,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '编辑商品',
        operator: '系统管理员',
        detail: `编辑商品信息：${name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('商品编辑成功', 'success');
    
    // 不重新渲染整个页面，而是更新表格行和详情面板
    updateGoodsTableRow(goodsId);
    if (selectedGoodsId === goodsId) {
        showGoodsDetailPanel(goodsId);
    }
}

function deleteGoods(goodsId) {
    if (!confirm('确定要删除此商品吗？删除后不可恢复！')) return;
    
    const goods = DataStore.findById('goods', goodsId);
    
    // 检查是否有关联的价格和订单
    const prices = DataStore.findBy('goodsPrices', 'goodsId', goodsId);
    if (prices.length > 0) {
        if (!confirm('此商品已设置价格，确定要删除吗？')) return;
    }
    
    // 删除商品
    DataStore.delete('goods', goodsId);
    
    // 删除关联的价格
    prices.forEach(p => DataStore.delete('goodsPrices', p.id));
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '删除商品',
        operator: '系统管理员',
        detail: `删除商品：${goods.name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('商品已删除', 'success');
    
    // 不重新渲染整个页面，而是移除表格行和清空详情面板
    const row = document.getElementById(`goods-row-${goodsId}`);
    if (row) {
        row.remove();
    }
    
    // 如果删除的是当前选中的商品，清空详情面板
    if (selectedGoodsId === goodsId) {
        selectedGoodsId = null;
        const titleElement = document.getElementById('goods-detail-title');
        const contentDiv = document.getElementById('goods-detail-content');
        if (titleElement) {
            titleElement.textContent = '请点击上方商品查看详情';
        }
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 15px;">📦</div>
                    <p>请点击上方商品行查看详细信息</p>
                </div>
            `;
        }
    }
}

// ========== 订单管理 ==========
function shipOrder(orderId) {
    DataStore.update('orders', orderId, {
        status: 'shipped',
        shipTime: new Date().toLocaleString('zh-CN')
    });
    showToast('订单已发货', 'success');
    renderPage('orders');
}

function completeOrder(orderId) {
    const order = DataStore.findById('orders', orderId);
    const completeTime = new Date().toLocaleString('zh-CN');
    const settleDate = new Date();
    settleDate.setDate(settleDate.getDate() + 7);
    const settleTime = settleDate.toLocaleString('zh-CN');
    
    DataStore.update('orders', orderId, {
        status: 'completed',
        completeTime,
        settleTime
    });
    
    // 更新保证金状态
    if (order.needDeposit > 0 && order.depositPaid) {
        const deposit = DataStore.findBy('deposits', 'merchantId', order.merchantId)[0];
        if (deposit) {
            DataStore.update('deposits', deposit.id, {
                frozenDeposit: deposit.frozenDeposit - order.needDeposit,
                settledDeposit: deposit.settledDeposit + order.needDeposit
            });
        }
    }
    
    showToast('订单已完成，T+7结算', 'success');
    renderPage('orders');
}

function viewMgOrderDetail(orderId) {
    const order = DataStore.findById('orders', orderId);
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" style="max-width: 700px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>订单详情 - ${order.id}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group"><label>订单号：</label><span>${order.id}</span></div>
                    <div class="form-group"><label>商户号：</label><span>${order.merchantId}</span></div>
                    <div class="form-group"><label>门店：</label><span>${order.storeName}</span></div>
                    <div class="form-group"><label>商品：</label><span>${order.goodsName} x${order.quantity}</span></div>
                    <div class="form-group"><label>订单金额：</label><span>¥${order.totalAmount}</span></div>
                    <div class="form-group"><label>微信支付：</label><span>¥${order.wxPayAmount}</span></div>
                    <div class="form-group"><label>其他支付：</label><span>¥${order.otherPayAmount}</span></div>
                    <div class="form-group"><label>手续费：</label><span>¥${order.fee.toFixed(2)}</span></div>
                    <div class="form-group"><label>商家收益：</label><span>¥${order.merchantActualProfit.toFixed(2)}</span></div>
                    ${order.brandProfit > 0 ? `<div class="form-group"><label>品牌总部：</label><span>¥${order.brandProfit.toFixed(2)}</span></div>` : ''}
                    <div class="form-group"><label>私域运营：</label><span>¥${order.operationProfit.toFixed(2)}</span></div>
                    <div class="form-group"><label>供应链平台：</label><span>¥${order.platformProfit.toFixed(2)}</span></div>
                    <div class="form-group"><label>需充保证金：</label><span style="color: ${order.needDeposit > 0 ? '#ff4d4f' : '#52c41a'};">¥${order.needDeposit.toFixed(2)}</span></div>
                    <div class="form-group"><label>状态：</label>${getOrderStatusTag(order.status)}</div>
                    <div class="form-group"><label>收货人：</label><span>${order.customerName} ${order.customerPhone}</span></div>
                    <div class="form-group"><label>收货地址：</label><span>${order.address}</span></div>
                    <div class="form-group"><label>创建时间：</label><span>${order.createTime}</span></div>
                    ${order.shipTime ? `<div class="form-group"><label>发货时间：</label><span>${order.shipTime}</span></div>` : ''}
                    ${order.completeTime ? `<div class="form-group"><label>完成时间：</label><span>${order.completeTime}</span></div>` : ''}
                    ${order.settleTime ? `<div class="form-group"><label>结算时间：</label><span>${order.settleTime}</span></div>` : ''}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== 保证金管理 ==========
function showDepositTab(tab) {
    const deposits = DataStore.get('deposits');
    const depositLogs = DataStore.get('depositLogs');
    const invoices = DataStore.get('invoices');
    const merchants = DataStore.get('merchants');
    
    document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('deposit-content');
    
    if (tab === 'overview') {
        content.innerHTML = `
            <div class="card-header"><h3 class="card-title">商户保证金总览</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th><th>商户名称</th><th>累计充值</th><th>充值次数</th><th>可使用</th>
                            <th>需提现</th><th>冻结中</th><th>已结算</th><th>已开票</th><th>待开票</th><th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${deposits.map(d => {
                            const merchant = merchants.find(m => m.id === d.merchantId);
                            return `
                            <tr>
                                <td>${d.merchantId}</td>
                                <td>${merchant?.name || '-'}</td>
                                <td>¥${d.totalDeposit.toLocaleString()}</td>
                                <td>${d.rechargeCount} 次</td>
                                <td style="color: #52c41a;">¥${d.availableDeposit.toLocaleString()}</td>
                                <td style="color: ${d.needWithdrawDeposit > 0 ? '#ff4d4f' : '#999'};">¥${d.needWithdrawDeposit.toLocaleString()}</td>
                                <td style="color: #faad14;">¥${d.frozenDeposit.toLocaleString()}</td>
                                <td style="color: #1890ff;">¥${d.settledDeposit.toLocaleString()}</td>
                                <td>¥${d.invoicedAmount.toLocaleString()}</td>
                                <td>¥${d.pendingInvoiceAmount.toLocaleString()}</td>
                                <td class="action-btns">
                                    <button class="btn btn-link" onclick="showInvoiceModal('${d.merchantId}')">开发票</button>
                                    <button class="btn btn-link" onclick="viewDepositDetail('${d.merchantId}')">详情</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (tab === 'logs') {
        content.innerHTML = `
            <div class="card-header"><h3 class="card-title">资金流水</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>时间</th><th>商户号</th><th>类型</th><th>金额</th><th>余额</th><th>订单号</th><th>备注</th></tr>
                    </thead>
                    <tbody>
                        ${depositLogs.map(log => `
                            <tr>
                                <td>${log.createTime}</td>
                                <td>${log.merchantId}</td>
                                <td>${log.type === 'recharge' ? '<span style="color: #52c41a;">充值</span>' : log.type === 'freeze' ? '<span style="color: #faad14;">冻结</span>' : '<span style="color: #1890ff;">结算</span>'}</td>
                                <td style="color: ${log.amount > 0 ? '#52c41a' : '#ff4d4f'};">${log.amount > 0 ? '+' : ''}¥${Math.abs(log.amount)}</td>
                                <td>¥${log.balance}</td>
                                <td>${log.orderId || '-'}</td>
                                <td>${log.remark}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (tab === 'invoice') {
        content.innerHTML = `
            <div class="card-header"><h3 class="card-title">发票管理</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr><th>发票号</th><th>商户号</th><th>金额</th><th>类型</th><th>开票时间</th><th>状态</th><th>操作</th></tr>
                    </thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${inv.invoiceNo}</td>
                                <td>${inv.merchantId}</td>
                                <td>¥${inv.amount}</td>
                                <td>${inv.invoiceType}</td>
                                <td>${inv.issueTime}</td>
                                <td>${inv.status === 'issued' ? '<span class="status-tag status-success">已开票</span>' : '<span class="status-tag status-warning">待上传</span>'}</td>
                                <td><button class="btn btn-link" onclick="showToast('查看功能开发中', 'info')">查看</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}

function showInvoiceModal(merchantId) {
    showToast('开发票功能开发中', 'info');
}

function viewDepositDetail(merchantId) {
    const logs = DataStore.findBy('depositLogs', 'merchantId', merchantId);
    const merchant = DataStore.findById('merchants', merchantId);
    
    const modalHtml = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" style="max-width: 800px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>保证金明细 - ${merchant.name}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>时间</th><th>类型</th><th>金额</th><th>余额</th><th>订单号</th><th>备注</th></tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => `
                                    <tr>
                                        <td>${log.createTime}</td>
                                        <td>${log.type === 'recharge' ? '<span style="color: #52c41a;">充值</span>' : log.type === 'freeze' ? '<span style="color: #faad14;">冻结</span>' : '<span style="color: #1890ff;">结算</span>'}</td>
                                        <td style="color: ${log.amount > 0 ? '#52c41a' : '#ff4d4f'};">${log.amount > 0 ? '+' : ''}¥${Math.abs(log.amount)}</td>
                                        <td>¥${log.balance}</td>
                                        <td>${log.orderId || '-'}</td>
                                        <td>${log.remark}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ========== 筛选和搜索 ==========
function filterApps(status) {
    document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#apps-tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterMgOrders(status) {
    document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#mg-orders-tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function searchMerchants() {
    const search = document.getElementById('merchantSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#apps-tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

function viewAppDetail(appId) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    // 生成签署日志内容
    let signLogsContent = '';
    if (app.contracts && app.contracts.length > 0) {
        const signedContracts = app.contracts.filter(c => c.signed);
        if (signedContracts.length > 0) {
            signLogsContent = `
                <h4 style="margin: 20px 0 10px;">📋 签署日志</h4>
                <div style="background: #f9f9f9; border-radius: 8px; padding: 15px;">
                    ${signedContracts.map(c => `
                        <div style="margin-bottom: 15px; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #e8e8e8;">
                            <div style="font-weight: 600; color: #1890ff; margin-bottom: 10px;">${c.name}</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                                <div><span style="color: #666;">登录账号:</span> <span style="color: #333;">${c.signerAccount || app.loginAccount || '-'}</span></div>
                                <div><span style="color: #666;">绑定手机号:</span> <span style="color: #333;">${c.signerPhone || app.loginPhone || '-'}</span></div>
                                <div><span style="color: #666;">打开时间:</span> <span style="color: #333;">${c.openTime ? new Date(c.openTime).toLocaleString('zh-CN') : '-'}</span></div>
                                <div><span style="color: #666;">浏览时长:</span> <span style="color: #333;">${c.readDuration ? c.readDuration + '秒' : '-'}</span></div>
                                <div><span style="color: #666;">签署时间:</span> <span style="color: #333;">${c.signTime || '-'}</span></div>
                                <div><span style="color: #666;">协议类型:</span> <span style="color: #333;">${c.name}</span></div>
                                <div><span style="color: #666;">IP地址:</span> <span style="color: #333;">${c.ipAddress || '-'}</span></div>
                                <div><span style="color: #666;">设备信息:</span> <span style="color: #333; word-break: break-all;">${c.deviceInfo || '-'}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }
    
    // 生成操作日志内容
    const operationLogs = [];
    
    // 申请创建
    operationLogs.push({
        time: app.createTime,
        action: '提交申请',
        operator: app.applicantName,
        detail: `申请人：${app.applicantName}，联系电话：${app.applicantPhone}`
    });
    
    // 审核记录
    if (app.auditTime) {
        operationLogs.push({
            time: app.auditTime,
            action: app.status === 'rejected' ? '审核拒绝' : '审核通过',
            operator: app.auditor || '-',
            detail: app.auditRemark || '-'
        });
    }
    
    // 签约记录
    if (app.signTime) {
        operationLogs.push({
            time: app.signTime,
            action: '完成签约',
            operator: '系统',
            detail: '所有协议已签署完成'
        });
    }
    
    const operationLogsContent = `
        <h4 style="margin: 20px 0 10px;">📝 操作日志</h4>
        <div style="background: #f9f9f9; border-radius: 8px; padding: 15px;">
            <div class="timeline">
                ${operationLogs.map((log, index) => `
                    <div class="timeline-item" style="position: relative; padding-left: 30px; padding-bottom: ${index === operationLogs.length - 1 ? '0' : '15px'}; ${index === operationLogs.length - 1 ? '' : 'border-left: 2px solid #e8e8e8;'} margin-left: 6px;">
                        <div style="position: absolute; left: -6px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: ${index === 0 ? '#1890ff' : log.action === '审核拒绝' ? '#ff4d4f' : '#52c41a'}; border: 2px solid #fff;"></div>
                        <div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e8e8e8;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                                <strong style="color: ${log.action === '审核拒绝' ? '#ff4d4f' : '#1890ff'};">${log.action}</strong>
                                <span style="color: #999; font-size: 12px;">${log.time}</span>
                            </div>
                            <div style="margin-bottom: 4px; font-size: 13px;">操作人：${log.operator}</div>
                            <div style="font-size: 13px; color: #666;">${log.detail}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    openModal('申请详情', `
        <div class="detail-list">
            <div class="detail-item"><span class="label">商户号</span><span class="value">${app.merchantId}</span></div>
            <div class="detail-item"><span class="label">商户名称</span><span class="value">${merchant?.name || '-'}</span></div>
            <div class="detail-item"><span class="label">营业执照主体</span><span class="value">${merchant?.companyName || '-'}</span></div>
            <div class="detail-item"><span class="label">申请的登录账号</span><span class="value">${app.loginAccount || '-'}</span></div>
            <div class="detail-item"><span class="label">登录账号绑定的手机号</span><span class="value">${app.loginPhone || '-'}</span></div>
            <div class="detail-item"><span class="label">申请人</span><span class="value">${app.applicantName} / ${app.applicantPhone}</span></div>
            <div class="detail-item"><span class="label">状态</span><span class="value">${getApplyStatusTag(app.status)}</span></div>
            <div class="detail-item"><span class="label">申请时间</span><span class="value">${app.createTime}</span></div>
            ${app.auditTime ? `<div class="detail-item"><span class="label">审核时间</span><span class="value">${app.auditTime}</span></div>` : ''}
            ${app.auditor ? `<div class="detail-item"><span class="label">审核人</span><span class="value">${app.auditor}</span></div>` : ''}
            ${app.auditRemark ? `<div class="detail-item" style="grid-column: span 2;"><span class="label">审核备注</span><span class="value">${app.auditRemark}</span></div>` : ''}
            ${app.merchantRatioRange ? `
                <div class="detail-item"><span class="label">分成比例</span><span class="value">商家${app.merchantRatio}% | 平台${app.platformRatio}% | 运营${app.operationRatio}%</span></div>
            ` : ''}
            ${app.brandRatio > 0 ? `<div class="detail-item"><span class="label">品牌总部分成</span><span class="value">${app.brandRatio}%（占商家收益）</span></div>` : ''}
        </div>
        ${signLogsContent}
        ${operationLogsContent}
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

// ========== 通用函数 ==========
function openModal(title, body, footer = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    // 清理动态创建的模态框
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        if (modal.id !== 'modal-overlay') {
            modal.remove();
        }
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function filterMgOrders(status) {
    document.querySelectorAll('.tabs .tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    const rows = document.querySelectorAll('#mg-orders-tbody tr');
    rows.forEach(row => {
        if (status === 'all' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function searchMerchants() {
    const keyword = document.getElementById('merchantSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#apps-tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? '' : 'none';
    });
}

// ========== 其他管理功能 ==========
function showAddDistributorModal() {
    const distributors = DataStore.get('distributors');
    
    openModal('经销商单位分成设置', `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; gap: 10px; margin-bottom: 15px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 3px solid #1890ff;">
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">批量设置经销商分成比例：</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="number" id="batch-distributor-ratio" class="form-control" placeholder="输入比例" min="0" max="100" style="width: 120px;">
                        <button class="btn btn-primary btn-sm" onclick="batchSetDistributorRatio()">应用到所有</button>
                    </div>
                </div>
                <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">批量设置伊智贸易分成比例：</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="number" id="batch-trade-ratio" class="form-control" placeholder="输入比例" min="0" max="100" style="width: 120px;">
                        <button class="btn btn-primary btn-sm" onclick="batchSetTradeRatio()">应用到所有</button>
                    </div>
                </div>
            </div>
            <p style="font-size: 12px; color: #999; margin: 0;">💡 提示：经销商分成比例 + 伊智贸易分成比例 = 100%</p>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>经销商ID</th>
                        <th>经销商名称</th>
                        <th>经销商分成比例</th>
                        <th>伊智贸易分成比例</th>
                        <th>绑定商户数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="distributor-list-tbody">
                    ${distributors.map(d => `
                        <tr data-id="${d.id}">
                            <td>${d.id}</td>
                            <td>${d.name}</td>
                            <td><span class="badge badge-success">${d.ratio}%</span></td>
                            <td><span class="badge badge-primary">${d.tradeCompanyRatio}%</span></td>
                            <td>${d.bindMerchantCount}</td>
                            <td>
                                <button class="btn btn-link btn-sm" onclick="editDistributor('${d.id}')">编辑</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

// 编辑经销商分成比例
function editDistributor(distributorId) {
    const distributors = DataStore.get('distributors');
    const distributor = distributors.find(d => d.id === distributorId);
    
    if (!distributor) {
        showToast('经销商不存在', 'error');
        return;
    }
    
    openModal('编辑经销商分成比例', `
        <form onsubmit="saveDistributorRatio(event, '${distributorId}')">
            <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                <div style="margin-bottom: 10px;">
                    <strong>经销商ID：</strong>${distributor.id}
                </div>
                <div>
                    <strong>经销商名称：</strong>${distributor.name}
                </div>
            </div>
            
            <div class="form-group">
                <label>经销商分成比例 <span style="color: red;">*</span></label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" id="edit-distributor-ratio" class="form-control" 
                           value="${distributor.ratio}" min="0" max="100" step="0.01" required 
                           oninput="updateTradeRatio()" style="flex: 1;">
                    <span style="font-size: 18px; font-weight: 500;">%</span>
                </div>
            </div>
            
            <div class="form-group">
                <label>伊智贸易分成比例 <span style="color: red;">*</span></label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" id="edit-trade-ratio" class="form-control" 
                           value="${distributor.tradeCompanyRatio}" min="0" max="100" step="0.01" required 
                           oninput="updateDistributorRatio()" style="flex: 1;">
                    <span style="font-size: 18px; font-weight: 500;">%</span>
                </div>
            </div>
            
            <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; border-left: 3px solid #1890ff; margin-bottom: 20px;">
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">比例合计：</div>
                <div style="font-size: 24px; font-weight: 500; color: #1890ff;" id="ratio-sum">
                    ${distributor.ratio + distributor.tradeCompanyRatio}%
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ✓ 两个比例合计必须等于100%
                </div>
            </div>
            
            <div style="text-align: right;">
                <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-primary">保存</button>
            </div>
        </form>
    `);
}

// 更新伊智贸易分成比例（当经销商比例改变时）
function updateTradeRatio() {
    const distributorRatio = parseFloat(document.getElementById('edit-distributor-ratio').value) || 0;
    const tradeRatio = 100 - distributorRatio;
    document.getElementById('edit-trade-ratio').value = tradeRatio.toFixed(2);
    updateRatioSum();
}

// 更新经销商分成比例（当伊智贸易比例改变时）
function updateDistributorRatio() {
    const tradeRatio = parseFloat(document.getElementById('edit-trade-ratio').value) || 0;
    const distributorRatio = 100 - tradeRatio;
    document.getElementById('edit-distributor-ratio').value = distributorRatio.toFixed(2);
    updateRatioSum();
}

// 更新比例合计显示
function updateRatioSum() {
    const distributorRatio = parseFloat(document.getElementById('edit-distributor-ratio').value) || 0;
    const tradeRatio = parseFloat(document.getElementById('edit-trade-ratio').value) || 0;
    const sum = distributorRatio + tradeRatio;
    const sumElement = document.getElementById('ratio-sum');
    
    sumElement.textContent = sum.toFixed(2) + '%';
    
    // 根据合计值改变颜色
    if (Math.abs(sum - 100) < 0.01) {
        sumElement.style.color = '#52c41a'; // 绿色 - 正确
    } else {
        sumElement.style.color = '#ff4d4f'; // 红色 - 错误
    }
}

// 保存经销商分成比例
function saveDistributorRatio(event, distributorId) {
    event.preventDefault();
    
    const distributorRatio = parseFloat(document.getElementById('edit-distributor-ratio').value);
    const tradeRatio = parseFloat(document.getElementById('edit-trade-ratio').value);
    const sum = distributorRatio + tradeRatio;
    
    // 验证比例合计是否为100%
    if (Math.abs(sum - 100) > 0.01) {
        showToast('两个比例合计必须等于100%', 'error');
        return;
    }
    
    // 更新数据
    const distributors = DataStore.get('distributors');
    const distributor = distributors.find(d => d.id === distributorId);
    
    if (distributor) {
        distributor.ratio = distributorRatio;
        distributor.tradeCompanyRatio = tradeRatio;
        DataStore.set('distributors', distributors);
        
        showToast('保存成功', 'success');
        closeModal();
        
        // 刷新页面
        renderPage('merchants-profit');
    }
}

// 批量设置经销商分成比例
function batchSetDistributorRatio() {
    const ratio = parseFloat(document.getElementById('batch-distributor-ratio').value);
    
    if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        showToast('请输入0-100之间的有效比例', 'error');
        return;
    }
    
    const tradeRatio = 100 - ratio;
    
    // 确认操作
    if (!confirm(`确定要将所有经销商的分成比例设置为 ${ratio}%，伊智贸易分成比例设置为 ${tradeRatio}% 吗？`)) {
        return;
    }
    
    // 更新所有经销商
    const distributors = DataStore.get('distributors');
    distributors.forEach(d => {
        d.ratio = ratio;
        d.tradeCompanyRatio = tradeRatio;
    });
    DataStore.set('distributors', distributors);
    
    showToast('批量设置成功', 'success');
    
    // 刷新列表
    updateDistributorList();
}

// 批量设置伊智贸易分成比例
function batchSetTradeRatio() {
    const ratio = parseFloat(document.getElementById('batch-trade-ratio').value);
    
    if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        showToast('请输入0-100之间的有效比例', 'error');
        return;
    }
    
    const distributorRatio = 100 - ratio;
    
    // 确认操作
    if (!confirm(`确定要将所有经销商的伊智贸易分成比例设置为 ${ratio}%，经销商分成比例设置为 ${distributorRatio}% 吗？`)) {
        return;
    }
    
    // 更新所有经销商
    const distributors = DataStore.get('distributors');
    distributors.forEach(d => {
        d.ratio = distributorRatio;
        d.tradeCompanyRatio = ratio;
    });
    DataStore.set('distributors', distributors);
    
    showToast('批量设置成功', 'success');
    
    // 刷新列表
    updateDistributorList();
}

// 更新经销商列表显示
function updateDistributorList() {
    const distributors = DataStore.get('distributors');
    const tbody = document.getElementById('distributor-list-tbody');
    
    if (tbody) {
        tbody.innerHTML = distributors.map(d => `
            <tr data-id="${d.id}">
                <td>${d.id}</td>
                <td>${d.name}</td>
                <td><span class="badge badge-success">${d.ratio}%</span></td>
                <td><span class="badge badge-primary">${d.tradeCompanyRatio}%</span></td>
                <td>${d.bindMerchantCount}</td>
                <td>
                    <button class="btn btn-link btn-sm" onclick="editDistributor('${d.id}')">编辑</button>
                </td>
            </tr>
        `).join('');
    }
}

function showAddShippingModal() {
    showToast('添加邮费模板功能开发中', 'info');
}

function editShipping(id) {
    showToast('编辑邮费模板功能开发中', 'info');
}

function showAddCategoryModal() {
    showToast('添加分类功能开发中', 'info');
}

function editCategory(id) {
    showToast('编辑分类功能开发中', 'info');
}

function showAddAreaTemplateModal() {
    showToast('添加地区模板功能开发中', 'info');
}

function editAreaTemplate(id) {
    showToast('编辑地区模板功能开发中', 'info');
}

function showAddAfterSaleModal() {
    showToast('添加售后规则功能开发中', 'info');
}

function editAfterSale(id) {
    showToast('编辑售后规则功能开发中', 'info');
}

function showCreateMallGoodsModal() {
    showToast('创建商城商品功能开发中', 'info');
}

function viewMallGoodsDetail(id) {
    showToast('商城商品详情功能开发中', 'info');
}

// ========== 商品价格管理 ==========
function showAddGoodsPriceModal(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const profitRules = DataStore.get('profitRules');
    const distributors = DataStore.get('distributors');
    
    // 获取默认分成比例（取第一个商户的配置作为示例）
    const defaultMerchantRatio = 10;
    const defaultPlatformRatio = 70;
    const defaultOperationRatio = 20;
    const defaultBrandRatio = 10;
    
    openModal('添加商品价格', `
        <div class="form-group">
            <label>商品名称：</label>
            <span>${goods.name}</span>
        </div>
        <div class="form-group">
            <label>成本价：</label>
            <span>¥${goods.costPrice}</span>
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 销售价格（元）：</label>
            <input type="number" id="priceSalePrice" class="form-control" placeholder="请输入销售价格" min="0" step="0.01" value="${goods.salePrice}">
        </div>
        <div class="form-group">
            <label>商城折前价（元）：</label>
            <input type="number" id="priceOriginalPrice" class="form-control" placeholder="请输入折前价" min="0" step="0.01" value="${(goods.salePrice * 1.2).toFixed(2)}">
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 开始时间：</label>
            <input type="datetime-local" id="priceStartTime" class="form-control" value="${new Date().toISOString().slice(0, 16)}">
        </div>
        <div class="form-group">
            <label><span style="color: #ff4d4f;">*</span> 结束时间：</label>
            <input type="datetime-local" id="priceEndTime" class="form-control" value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 16)}">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-bottom: 1px solid #e8e8e8; padding-bottom: 10px;">分成比例设置</h4>
        <p style="color: #999; font-size: 13px; margin-bottom: 15px;">注意：三方分成比例之和必须等于100%</p>
        
        <div class="form-group">
            <label>商家佣金比例（%）：</label>
            <input type="number" id="priceMerchantRatio" class="form-control" min="0" max="100" step="0.01" value="${defaultMerchantRatio}" onchange="calculatePriceProfit()">
        </div>
        <div class="form-group">
            <label>供应链平台佣金比例（%）：</label>
            <input type="number" id="pricePlatformRatio" class="form-control" min="0" max="100" step="0.01" value="${defaultPlatformRatio}" onchange="calculatePriceProfit()">
        </div>
        <div class="form-group">
            <label>私域运营平台佣金比例（%）：</label>
            <input type="number" id="priceOperationRatio" class="form-control" min="0" max="100" step="0.01" value="${defaultOperationRatio}" onchange="calculatePriceProfit()">
        </div>
        <div class="form-group">
            <label>品牌总部分成比例（占商家收益%）：</label>
            <input type="number" id="priceBrandRatio" class="form-control" min="0" max="100" step="0.01" value="${defaultBrandRatio}" onchange="calculatePriceProfit()">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-bottom: 1px solid #e8e8e8; padding-bottom: 10px;">分成金额预览</h4>
        <div id="profitPreview" style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
            <div style="margin-bottom: 8px;">商家实际收益：<strong id="previewMerchantAmount">-</strong> 元</div>
            <div style="margin-bottom: 8px;">品牌总部收益：<strong id="previewBrandAmount">-</strong> 元</div>
            <div style="margin-bottom: 8px;">私域运营平台收益：<strong id="previewOperationAmount">-</strong> 元</div>
            <div style="margin-bottom: 8px;">供应链平台收益：<strong id="previewPlatformAmount">-</strong> 元</div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #d9d9d9;">
                <span style="color: #999;">扣除手续费后可分配金额：</span><strong id="previewTotalAmount">-</strong> 元
            </div>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveGoodsPrice('${goodsId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
    
    // 初始计算
    setTimeout(() => calculatePriceProfit(), 100);
}

function calculatePriceProfit() {
    const salePrice = parseFloat(document.getElementById('priceSalePrice').value) || 0;
    const merchantRatio = parseFloat(document.getElementById('priceMerchantRatio').value) || 0;
    const platformRatio = parseFloat(document.getElementById('pricePlatformRatio').value) || 0;
    const operationRatio = parseFloat(document.getElementById('priceOperationRatio').value) || 0;
    const brandRatio = parseFloat(document.getElementById('priceBrandRatio').value) || 0;
    
    // 验证比例总和
    const totalRatio = merchantRatio + platformRatio + operationRatio;
    if (Math.abs(totalRatio - 100) > 0.01) {
        document.getElementById('profitPreview').style.background = '#fff2f0';
        document.getElementById('profitPreview').style.border = '1px solid #ffccc7';
        document.getElementById('previewTotalAmount').textContent = `⚠️ 三方分成比例之和必须等于100%（当前：${totalRatio.toFixed(2)}%）`;
        document.getElementById('previewMerchantAmount').textContent = '-';
        document.getElementById('previewBrandAmount').textContent = '-';
        document.getElementById('previewOperationAmount').textContent = '-';
        document.getElementById('previewPlatformAmount').textContent = '-';
        return;
    }
    
    document.getElementById('profitPreview').style.background = '#f5f5f5';
    document.getElementById('profitPreview').style.border = 'none';
    
    // 计算分成金额（假设手续费率0.6%）
    const feeRate = 0.006;
    const fee = salePrice * feeRate;
    const distributableAmount = salePrice - fee;
    
    const merchantAmount = distributableAmount * (merchantRatio / 100);
    const platformAmount = distributableAmount * (platformRatio / 100);
    const operationAmount = distributableAmount * (operationRatio / 100);
    const brandAmount = merchantAmount * (brandRatio / 100);
    const merchantActualAmount = merchantAmount - brandAmount;
    
    document.getElementById('previewTotalAmount').textContent = distributableAmount.toFixed(2);
    document.getElementById('previewMerchantAmount').textContent = merchantActualAmount.toFixed(2);
    document.getElementById('previewBrandAmount').textContent = brandAmount.toFixed(2);
    document.getElementById('previewOperationAmount').textContent = operationAmount.toFixed(2);
    document.getElementById('previewPlatformAmount').textContent = platformAmount.toFixed(2);
}

function saveGoodsPrice(goodsId) {
    const salePrice = parseFloat(document.getElementById('priceSalePrice').value);
    const originalPrice = parseFloat(document.getElementById('priceOriginalPrice').value);
    const startTime = document.getElementById('priceStartTime').value;
    const endTime = document.getElementById('priceEndTime').value;
    const merchantRatio = parseFloat(document.getElementById('priceMerchantRatio').value);
    const platformRatio = parseFloat(document.getElementById('pricePlatformRatio').value);
    const operationRatio = parseFloat(document.getElementById('priceOperationRatio').value);
    const brandRatio = parseFloat(document.getElementById('priceBrandRatio').value);
    
    // 验证
    if (!salePrice || !startTime || !endTime) {
        showToast('请填写完整信息', 'error');
        return;
    }
    
    const totalRatio = merchantRatio + platformRatio + operationRatio;
    if (Math.abs(totalRatio - 100) > 0.01) {
        showToast('三方分成比例之和必须等于100%', 'error');
        return;
    }
    
    if (new Date(startTime) >= new Date(endTime)) {
        showToast('结束时间必须大于开始时间', 'error');
        return;
    }
    
    // 计算分成金额
    const feeRate = 0.006;
    const fee = salePrice * feeRate;
    const distributableAmount = salePrice - fee;
    
    const merchantAmount = distributableAmount * (merchantRatio / 100);
    const platformAmount = distributableAmount * (platformRatio / 100);
    const operationAmount = distributableAmount * (operationRatio / 100);
    const brandAmount = merchantAmount * (brandRatio / 100);
    const merchantActualAmount = merchantAmount - brandAmount;
    
    // 保存价格
    const newPrice = {
        id: 'PRICE' + Date.now(),
        goodsId,
        salePrice,
        originalPrice: originalPrice || salePrice * 1.2,
        startTime: new Date(startTime).toLocaleString('zh-CN'),
        endTime: new Date(endTime).toLocaleString('zh-CN'),
        merchantRatio,
        platformRatio,
        operationRatio,
        brandRatio,
        merchantAmount: merchantActualAmount,
        brandAmount,
        platformAmount,
        operationAmount,
        status: 'active',
        createTime: new Date().toLocaleString('zh-CN')
    };
    
    DataStore.add('goodsPrices', newPrice);
    
    // 更新商品价格
    DataStore.update('goods', goodsId, {
        salePrice,
        originalPrice: originalPrice || salePrice * 1.2,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '设置价格',
        operator: '系统管理员',
        detail: `设置销售价¥${salePrice}，生效时间：${newPrice.startTime} - ${newPrice.endTime}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('价格设置成功', 'success');
    showGoodsDetail(goodsId);
}

function terminateGoodsPrice(priceId, goodsId) {
    if (!confirm('确定要终止此价格吗？')) return;
    
    const now = new Date().toLocaleString('zh-CN');
    DataStore.update('goodsPrices', priceId, {
        endTime: now,
        status: 'inactive'
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '终止价格',
        operator: '系统管理员',
        detail: `终止价格，终止时间：${now}`,
        createTime: now
    });
    
    showToast('价格已终止', 'success');
    showGoodsDetail(goodsId);
}

// ========== 不可发货地区管理 ==========
function showSetExcludeAreasModal(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const allAreas = ['新疆', '西藏', '内蒙古', '青海', '甘肃', '宁夏', '海南', '港澳台'];
    
    openModal('设置不可发货地区', `
        <div class="form-group">
            <label>商品名称：</label>
            <span>${goods.name}</span>
        </div>
        <div class="form-group">
            <label>选择不可发货地区：</label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px;">
                ${allAreas.map(area => `
                    <label style="display: flex; align-items: center;">
                        <input type="checkbox" class="area-check" value="${area}" ${goods.excludeAreas.includes(area) ? 'checked' : ''}>
                        <span style="margin-left: 5px;">${area}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveExcludeAreas('${goodsId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

function saveExcludeAreas(goodsId) {
    const selectedAreas = Array.from(document.querySelectorAll('.area-check:checked')).map(cb => cb.value);
    
    DataStore.update('goods', goodsId, {
        excludeAreas: selectedAreas,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '设置不可发货地区',
        operator: '系统管理员',
        detail: `设置不可发货地区：${selectedAreas.length > 0 ? selectedAreas.join('、') : '无限制'}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('不可发货地区设置成功', 'success');
    showGoodsDetail(goodsId);
}

function applyExcludeTemplate(goodsId, templateId) {
    const template = DataStore.findById('excludeAreaTemplates', templateId);
    
    DataStore.update('goods', goodsId, {
        excludeAreas: template.areas,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '应用地区模板',
        operator: '系统管理员',
        detail: `应用模板：${template.name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('模板应用成功', 'success');
    showGoodsDetail(goodsId);
}

// ========== 包邮设置管理 ==========
function showSetShippingModal(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const templates = DataStore.get('shippingTemplates');
    
    openModal('设置包邮', `
        <div class="form-group">
            <label>商品名称：</label>
            <span>${goods.name}</span>
        </div>
        <div class="form-group">
            <label>包邮设置：</label>
            <select id="shippingType" class="form-control" onchange="toggleShippingTemplate()">
                <option value="free" ${goods.freeShipping ? 'selected' : ''}>全国包邮</option>
                <option value="template" ${!goods.freeShipping ? 'selected' : ''}>按模板收费</option>
            </select>
        </div>
        <div class="form-group" id="templateSelection" style="display: ${goods.freeShipping ? 'none' : 'block'};">
            <label>选择邮费模板：</label>
            <select id="shippingTemplateId" class="form-control">
                ${templates.map(t => `
                    <option value="${t.id}" ${goods.shippingTemplateId === t.id ? 'selected' : ''}>${t.name}</option>
                `).join('')}
            </select>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveShippingSetting('${goodsId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

function toggleShippingTemplate() {
    const type = document.getElementById('shippingType').value;
    document.getElementById('templateSelection').style.display = type === 'free' ? 'none' : 'block';
}

function saveShippingSetting(goodsId) {
    const type = document.getElementById('shippingType').value;
    const freeShipping = type === 'free';
    const shippingTemplateId = freeShipping ? null : document.getElementById('shippingTemplateId').value;
    
    DataStore.update('goods', goodsId, {
        freeShipping,
        shippingTemplateId: shippingTemplateId || 'SHIP001',
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '设置包邮',
        operator: '系统管理员',
        detail: freeShipping ? '设置为全国包邮' : `设置邮费模板：${shippingTemplateId}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('包邮设置成功', 'success');
    showGoodsDetail(goodsId);
}

function applyShippingTemplate(goodsId, templateId) {
    const template = DataStore.findById('shippingTemplates', templateId);
    
    DataStore.update('goods', goodsId, {
        freeShipping: template.type === 'free',
        shippingTemplateId: templateId,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '应用邮费模板',
        operator: '系统管理员',
        detail: `应用模板：${template.name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('模板应用成功', 'success');
    showGoodsDetail(goodsId);
}

// ========== 商品筛选和搜索 ==========
function filterGoods() {
    const searchKeyword = document.getElementById('goodsSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('goodsCategoryFilter').value;
    const statusFilter = document.getElementById('goodsStatusFilter').value;
    
    const rows = document.querySelectorAll('#goods-tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const category = row.dataset.category;
        const status = row.dataset.status;
        
        const matchSearch = !searchKeyword || text.includes(searchKeyword);
        const matchCategory = !categoryFilter || category === categoryFilter;
        const matchStatus = !statusFilter || status === statusFilter;
        
        row.style.display = (matchSearch && matchCategory && matchStatus) ? '' : 'none';
    });
}

function resetGoodsFilter() {
    document.getElementById('goodsSearch').value = '';
    document.getElementById('goodsCategoryFilter').value = '';
    document.getElementById('goodsStatusFilter').value = '';
    filterGoods();
}


// ==================== 商户入驻审批 - 新增功能函数 ====================

// 初始化筛选事件监听器
function initAuditFilters() {
    // 为所有筛选控件添加change事件
    const filterIds = [
        'filter-apply-start',
        'filter-apply-end',
        'filter-audit-start',
        'filter-audit-end',
        'filter-subaccount',
        'filter-scope',
        'filter-audit-status',
        'filter-sign-status'
    ];
    
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                applyAuditFilters(true); // true表示自动触发
            });
        }
    });
    
    // 为搜索框添加input事件（实时搜索）
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyAuditFilters(true);
        });
    }
}

// 应用筛选条件
function applyAuditFilters(isAutoTrigger = false) {
    const applyStart = document.getElementById('filter-apply-start')?.value || '';
    const applyEnd = document.getElementById('filter-apply-end')?.value || '';
    const auditStart = document.getElementById('filter-audit-start')?.value || '';
    const auditEnd = document.getElementById('filter-audit-end')?.value || '';
    const subaccount = document.getElementById('filter-subaccount')?.value || 'all';
    const scope = document.getElementById('filter-scope')?.value || 'all';
    const auditStatus = document.getElementById('filter-audit-status')?.value || 'all';
    const signStatus = document.getElementById('filter-sign-status')?.value || 'all';
    const search = document.getElementById('filter-search')?.value.trim().toLowerCase() || '';
    
    const rows = document.querySelectorAll('#apps-tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let show = true;
        
        // 申请时间筛选
        if (applyStart || applyEnd) {
            const applyTime = row.dataset.applyTime;
            if (applyTime) {
                const applyDate = applyTime.split(' ')[0];
                if (applyStart && applyDate < applyStart) show = false;
                if (applyEnd && applyDate > applyEnd) show = false;
            }
        }
        
        // 审核时间筛选
        if (auditStart || auditEnd) {
            const auditTime = row.dataset.auditTime;
            if (auditTime) {
                const auditDate = auditTime.split(' ')[0];
                if (auditStart && auditDate < auditStart) show = false;
                if (auditEnd && auditDate > auditEnd) show = false;
            } else if (auditStart || auditEnd) {
                show = false; // 没有审核时间的记录
            }
        }
        
        // 分账状态筛选
        if (subaccount !== 'all' && row.dataset.subaccount !== subaccount) {
            show = false;
        }
        
        // 经营范围筛选
        if (scope !== 'all' && row.dataset.scope !== scope) {
            show = false;
        }
        
        // 审核状态筛选
        if (auditStatus !== 'all') {
            const status = row.dataset.status;
            if (auditStatus === 'pending' && status !== 'pending') show = false;
            if (auditStatus === 'approved' && status !== 'pending_sign' && status !== 'signed' && status !== 'need_maintain') show = false;
            if (auditStatus === 'rejected' && status !== 'rejected') show = false;
        }
        
        // 签约状态筛选
        if (signStatus !== 'all') {
            const status = row.dataset.status;
            if (signStatus === 'signed' && status !== 'signed') show = false;
            if (signStatus === 'pending-sign' && status !== 'pending_sign') show = false;
        }
        
        // 搜索筛选
        if (search && !row.dataset.search.toLowerCase().includes(search)) {
            show = false;
        }
        
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
    });
    
    // 只在手动点击查询按钮时显示提示
    if (!isAutoTrigger) {
        showToast(`筛选完成，共找到 ${visibleCount} 条记录`, 'success');
    }
}

// 重置筛选条件
function resetAuditFilters() {
    document.getElementById('filter-apply-start').value = '';
    document.getElementById('filter-apply-end').value = '';
    document.getElementById('filter-audit-start').value = '';
    document.getElementById('filter-audit-end').value = '';
    document.getElementById('filter-subaccount').value = 'all';
    document.getElementById('filter-scope').value = 'all';
    document.getElementById('filter-audit-status').value = 'all';
    document.getElementById('filter-sign-status').value = 'all';
    document.getElementById('filter-search').value = '';
    
    const rows = document.querySelectorAll('#apps-tbody tr');
    rows.forEach(row => row.style.display = '');
    
    showToast('筛选已重置', 'success');
}

// 查看商品分佣比例
function viewProfitRatio(appId) {
    console.log('viewProfitRatio called with appId:', appId);
    
    const apps = DataStore.get('applications');
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
        showToast('申请记录不存在', 'error');
        return;
    }
    
    console.log('Found app:', app);
    
    const merchants = DataStore.get('merchants');
    const merchant = merchants.find(m => m.id === app.merchantId);
    const merchantName = merchant?.name || app.merchantId;
    
    const hasRatio = app.merchantRatio !== null && app.merchantRatio !== undefined;
    
    console.log('hasRatio:', hasRatio);
    
    // 模拟商品数据（实际应该从后端获取该商户的商品列表）
    const mockGoods = [
        {
            name: '胖雪虚荣调理包',
            category: '小二鼻调理',
            supplier: '爱百伊',
            brand: '小二鼻',
            merchantRatio: 5.00,
            operationRatio: 2.00,
            platformRatio: 1.00
        },
        {
            name: '肝阳上亢调理包',
            category: '小二鼻调理',
            supplier: '隆海',
            brand: '小二鼻',
            merchantRatio: 5.50,
            operationRatio: 2.00,
            platformRatio: 1.00
        },
        {
            name: '妇科炎症调理包',
            category: '妇科炎症调理',
            supplier: '艾乐',
            brand: '妇科炎症调理',
            merchantRatio: 6.00,
            operationRatio: 1.50,
            platformRatio: 1.00
        }
    ];
    
    // 创建抽屉HTML
    const drawerHTML = `
        <div class="drawer-overlay" id="profit-drawer-overlay" onclick="closeProfitDrawer()"></div>
        <div class="drawer" id="profit-drawer">
            <div class="drawer-header">
                <h3 class="drawer-title">商品分佣比例</h3>
                <button class="drawer-close" onclick="closeProfitDrawer()">✕</button>
            </div>
            <div class="drawer-body">
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #e8e8e8;">
                    <span style="font-size: 14px; color: #666;">商家：</span>
                    <span style="font-size: 14px; font-weight: 500;">${merchantName}</span>
                </div>
                
                ${hasRatio ? `
                    <!-- 筛选条件 -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">商品分类：</label>
                            <select class="form-control" style="width: 100%; font-size: 13px;">
                                <option>全部</option>
                                <option>小二鼻调理</option>
                                <option>妇科炎症调理</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">供应商：</label>
                            <select class="form-control" style="width: 100%; font-size: 13px;">
                                <option>全部</option>
                                <option>爱百伊</option>
                                <option>隆海</option>
                                <option>艾乐</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">品牌：</label>
                            <select class="form-control" style="width: 100%; font-size: 13px;">
                                <option>全部</option>
                                <option>小二鼻</option>
                                <option>妇科炎症调理</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 5px; font-size: 13px; color: #666;">商品名称：</label>
                            <input type="text" class="form-control" placeholder="请输入商品名称" style="width: 100%; font-size: 13px;">
                        </div>
                        <div style="display: flex; gap: 8px; align-items: flex-end;">
                            <button class="btn btn-primary" style="height: 32px; padding: 0 20px; font-size: 13px;">搜索</button>
                            <button class="btn btn-outline" style="height: 32px; padding: 0 20px; font-size: 13px;">重置</button>
                        </div>
                    </div>
                    
                    <!-- 商品列表表格 -->
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #fafafa; border-bottom: 2px solid #e8e8e8;">
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 500; color: #333; white-space: nowrap;">商品名称</th>
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 500; color: #333; white-space: nowrap;">商品分类</th>
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 500; color: #333; white-space: nowrap;">供应商</th>
                                    <th style="padding: 12px 8px; text-align: left; font-weight: 500; color: #333; white-space: nowrap;">品牌</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 500; color: #333; white-space: nowrap;">商家收益比例</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 500; color: #333; white-space: nowrap;">私域运营平台收益比例</th>
                                    <th style="padding: 12px 8px; text-align: center; font-weight: 500; color: #333; white-space: nowrap;">供应链平台收益比例</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mockGoods.map((goods, index) => `
                                    <tr style="border-bottom: 1px solid #f0f0f0; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                                        <td style="padding: 12px 8px;">${goods.name}</td>
                                        <td style="padding: 12px 8px;">${goods.category}</td>
                                        <td style="padding: 12px 8px;">${goods.supplier}</td>
                                        <td style="padding: 12px 8px;">${goods.brand}</td>
                                        <td style="padding: 12px 8px; text-align: center; font-weight: 500; color: #52c41a;">${goods.merchantRatio.toFixed(2)}%</td>
                                        <td style="padding: 12px 8px; text-align: center; font-weight: 500; color: #fa8c16;">${goods.operationRatio.toFixed(2)}%</td>
                                        <td style="padding: 12px 8px; text-align: center; font-weight: 500; color: #1890ff;">${goods.platformRatio.toFixed(2)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 分页 -->
                    <div style="margin-top: 20px; text-align: center;">
                        <div style="display: inline-flex; gap: 5px; align-items: center;">
                            <button style="padding: 5px 10px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; border-radius: 2px;">&lt;</button>
                            <button style="padding: 5px 12px; border: 1px solid #1890ff; background: #1890ff; color: #fff; cursor: pointer; border-radius: 2px;">1</button>
                            <button style="padding: 5px 10px; border: 1px solid #d9d9d9; background: #fff; cursor: pointer; border-radius: 2px;">&gt;</button>
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <p style="font-size: 16px;">暂无分佣比例数据</p>
                        <p style="font-size: 14px; margin-top: 10px;">该申请尚未审核通过或未设置分佣比例</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    console.log('Creating drawer container...');
    
    // 添加到body
    const drawerContainer = document.createElement('div');
    drawerContainer.innerHTML = drawerHTML;
    document.body.appendChild(drawerContainer);
    
    console.log('Drawer container appended to body');
    
    // 触发动画
    setTimeout(() => {
        const overlay = document.getElementById('profit-drawer-overlay');
        const drawer = document.getElementById('profit-drawer');
        
        console.log('Overlay element:', overlay);
        console.log('Drawer element:', drawer);
        
        if (overlay && drawer) {
            overlay.classList.add('show');
            drawer.classList.add('show');
            console.log('Show classes added');
        } else {
            console.error('Could not find drawer elements!');
        }
    }, 10);
}

// 关闭商品分佣比例抽屉
function closeProfitDrawer() {
    const overlay = document.getElementById('profit-drawer-overlay');
    const drawer = document.getElementById('profit-drawer');
    
    if (overlay && drawer) {
        overlay.classList.remove('show');
        drawer.classList.remove('show');
        
        // 动画结束后移除元素
        setTimeout(() => {
            overlay.parentElement.remove();
        }, 300);
    }
}

// 查看审核日志
function viewAuditLog(appId) {
    const apps = DataStore.get('applications');
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
        showToast('申请记录不存在', 'error');
        return;
    }
    
    // 构建日志记录
    const logs = [];
    
    // 申请创建
    logs.push({
        time: app.createTime,
        action: '提交申请',
        operator: app.applicantName,
        detail: `申请人：${app.applicantName}，联系电话：${app.applicantPhone}`
    });
    
    // 审核记录
    if (app.auditTime) {
        logs.push({
            time: app.auditTime,
            action: app.status === 'rejected' ? '审核拒绝' : '审核通过',
            operator: app.auditor,
            detail: app.auditRemark || '-'
        });
    }
    
    // 签约记录
    if (app.signTime) {
        logs.push({
            time: app.signTime,
            action: '完成签约',
            operator: '系统',
            detail: '所有协议已签署完成'
        });
    }
    
    openModal('审核日志', `
        <div style="padding: 20px;">
            <div class="timeline">
                ${logs.map((log, index) => `
                    <div class="timeline-item" style="position: relative; padding-left: 30px; padding-bottom: 20px; ${index === logs.length - 1 ? 'border-left: none;' : 'border-left: 2px solid #e8e8e8;'}">
                        <div style="position: absolute; left: -6px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: ${index === 0 ? '#1890ff' : '#52c41a'}; border: 2px solid #fff;"></div>
                        <div style="background: #fafafa; padding: 15px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <strong style="color: #1890ff;">${log.action}</strong>
                                <span style="color: #999; font-size: 12px;">${log.time}</span>
                            </div>
                            <div style="margin-bottom: 5px; font-size: 13px;">操作人：${log.operator}</div>
                            <div style="font-size: 13px; color: #666;">${log.detail}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `, 700);
}

// 显示审核拒绝弹窗
function showRejectModal(appId) {
    openModal('审核拒绝', `
        <form onsubmit="submitReject(event, '${appId}')">
            <div class="form-group">
                <label>拒绝原因 <span style="color: red;">*</span></label>
                <textarea class="form-control" id="reject-reason" rows="5" placeholder="请输入拒绝原因..." required></textarea>
                <div style="margin-top: 5px; font-size: 12px; color: #999;">
                    请详细说明拒绝原因，以便商户了解并改进
                </div>
            </div>
            
            <div style="margin-top: 20px; text-align: right;">
                <button type="button" class="btn btn-outline" onclick="closeModal()">取消</button>
                <button type="submit" class="btn btn-danger">确认拒绝</button>
            </div>
        </form>
    `);
}

// 提交审核拒绝
function submitReject(event, appId) {
    event.preventDefault();
    
    const reason = document.getElementById('reject-reason').value.trim();
    
    if (!reason) {
        showToast('请输入拒绝原因', 'warning');
        return;
    }
    
    const apps = DataStore.get('applications');
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
        showToast('申请记录不存在', 'error');
        return;
    }
    
    // 更新申请状态
    app.status = 'rejected';
    app.auditTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-');
    app.auditor = '审核员'; // 实际应该是当前登录用户
    app.auditRemark = reason;
    
    DataStore.set('applications', apps);
    
    closeModal();
    showToast('审核拒绝成功', 'success');
    
    // 刷新页面
    renderPage('merchants-audit');
}

function remindSignStaff(appId) {
    const apps = DataStore.get('applications');
    const app = apps.find(a => a.id === appId);
    
    if (!app) {
        showToast('申请记录不存在', 'error');
        return;
    }
    
    // 模拟发送提醒
    showToast('已发送提醒通知给签约员工', 'success');
    
    // 实际应该调用后端接口发送通知
    console.log('发送提醒通知:', {
        appId: app.id,
        merchantId: app.merchantId,
        applicantPhone: app.applicantPhone
    });
}

// ========== 分账接收方管理 ==========

// 显示新增分账接收方弹窗
function showAddProfitReceiverModal() {
    const merchants = DataStore.get('merchants');
    const profitReceivers = DataStore.get('profitReceivers');
    
    openModal('设置分账接收方', `
        <form id="add-profit-receiver-form" onsubmit="submitProfitReceiver(event)">
            <div class="form-group">
                <label class="form-label">选择商户号 *</label>
                <select class="form-control" id="receiver-merchantId" onchange="loadProfitReceivers()" required>
                    <option value="">请选择商户号</option>
                    ${merchants.map(m => `
                        <option value="${m.id}">${m.id} - ${m.name}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group" id="receiver-selection-group" style="display: none;">
                <label class="form-label">选择分账接收方 *</label>
                <select class="form-control" id="receiver-profitReceiverId" required>
                    <option value="">请先选择商户号</option>
                </select>
            </div>
            
            <div class="form-group" id="receiver-ratio-group" style="display: none;">
                <label class="form-label">分走商户号的收益比例 * <span style="font-size: 12px; color: #999; font-weight: normal;">（假设设置的是10%，那么此商户号收益100元，则分账接收方从中分走10元）</span></label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" class="form-control" id="receiver-ratio" 
                           min="0" max="100" step="0.01" value="10" 
                           required style="width: 120px;">
                    <span>%</span>
                </div>
            </div>
            
            <div class="form-group" id="receiver-proof-group" style="display: none;">
                <label class="form-label">上传协议证明 *</label>
                <input type="file" class="form-control" id="receiver-proof" accept=".pdf,.jpg,.jpeg,.png" required>
                <p style="font-size: 12px; color: #999; margin-top: 5px;">支持PDF、JPG、PNG格式，文件大小不超过5MB</p>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('add-profit-receiver-form').requestSubmit()">提交</button>
    `);
}

// 加载分账接收方列表
function loadProfitReceivers() {
    const merchantId = document.getElementById('receiver-merchantId').value;
    const selectionGroup = document.getElementById('receiver-selection-group');
    const ratioGroup = document.getElementById('receiver-ratio-group');
    const proofGroup = document.getElementById('receiver-proof-group');
    const receiverSelect = document.getElementById('receiver-profitReceiverId');
    
    if (!merchantId) {
        selectionGroup.style.display = 'none';
        ratioGroup.style.display = 'none';
        proofGroup.style.display = 'none';
        return;
    }
    
    const merchant = DataStore.findById('merchants', merchantId);
    const brandMerchantId = merchant?.brandMerchantId;
    
    if (!brandMerchantId) {
        receiverSelect.innerHTML = '<option value="">该商户没有品牌总部</option>';
        selectionGroup.style.display = 'block';
        return;
    }
    
    const receivers = DataStore.findBy('profitReceivers', 'merchantId', brandMerchantId)
        .filter(r => r.status === 'active');
    
    if (receivers.length === 0) {
        receiverSelect.innerHTML = '<option value="">暂无可用的分账接收方</option>';
    } else {
        receiverSelect.innerHTML = `
            <option value="">请选择分账接收方</option>
            ${receivers.map(r => `
                <option value="${r.id}">${r.receiverName} - ${r.receiverType === 'merchant' ? '商户号' : '银行账户'}</option>
            `).join('')}
        `;
    }
    
    selectionGroup.style.display = 'block';
    ratioGroup.style.display = 'block';
    proofGroup.style.display = 'block';
}

// 提交分账接收方设置
function submitProfitReceiver(e) {
    e.preventDefault();
    
    const merchantId = document.getElementById('receiver-merchantId').value;
    const profitReceiverId = document.getElementById('receiver-profitReceiverId').value;
    const ratio = parseFloat(document.getElementById('receiver-ratio').value);
    const proofFile = document.getElementById('receiver-proof').files[0];
    
    if (!profitReceiverId) {
        showToast('请选择分账接收方', 'warning');
        return;
    }
    
    if (ratio <= 0 || ratio > 100) {
        showToast('收益比例必须在0-100之间', 'warning');
        return;
    }
    
    if (!proofFile) {
        showToast('请上传协议证明', 'warning');
        return;
    }
    
    // 模拟文件上传
    const proofUrl = `https://example.com/proofs/${Date.now()}_${proofFile.name}`;
    
    // 创建日志记录
    const log = {
        id: 'LOG' + Date.now(),
        merchantId: merchantId,
        profitReceiverId: profitReceiverId,
        ratio: ratio,
        proofUrl: proofUrl,
        proofFileName: proofFile.name,
        operator: 'MG管理员', // 实际应该是当前登录用户
        operatorAccount: 'admin@mg.com',
        operateTime: new Date().toLocaleString('zh-CN'),
        operateType: 'create',
        source: 'mg_backend',
        remark: '通过MG管理后台设置分账接收方'
    };
    
    // 保存到profitReceiverLogs表
    let logs = DataStore.get('profitReceiverLogs') || [];
    logs.push(log);
    DataStore.set('profitReceiverLogs', logs);
    
    // 更新profitRules表
    const profitRules = DataStore.get('profitRules');
    const ruleIndex = profitRules.findIndex(r => r.merchantId === merchantId);
    
    if (ruleIndex >= 0) {
        const receiver = DataStore.findById('profitReceivers', profitReceiverId);
        profitRules[ruleIndex].brandMerchantId = receiver.merchantId;
        profitRules[ruleIndex].brandMerchantName = receiver.receiverName;
        profitRules[ruleIndex].brandRatio = ratio;
        profitRules[ruleIndex].profitReceiverId = profitReceiverId;
        profitRules[ruleIndex].updateTime = new Date().toLocaleString('zh-CN');
        DataStore.set('profitRules', profitRules);
    }
    
    closeModal();
    showToast('分账接收方设置成功', 'success');
    
    // 刷新页面
    renderPage('merchants');
    switchMerchantsTab('profit');
    switchProfitTab('brand');
}

// 编辑分账接收方
function editProfitReceiver(merchantId) {
    const profitRules = DataStore.get('profitRules');
    const rule = profitRules.find(r => r.merchantId === merchantId);
    const merchant = DataStore.findById('merchants', merchantId);
    
    if (!rule) {
        showToast('未找到该商户的分账设置', 'error');
        return;
    }
    
    const brandMerchantId = merchant?.brandMerchantId;
    const receivers = brandMerchantId ? 
        DataStore.findBy('profitReceivers', 'merchantId', brandMerchantId).filter(r => r.status === 'active') : [];
    
    openModal('编辑分账接收方', `
        <form id="edit-profit-receiver-form" onsubmit="submitEditProfitReceiver(event, '${merchantId}')">
            <div class="form-group">
                <label class="form-label">商户号</label>
                <input type="text" class="form-control" value="${merchantId} - ${rule.merchantName}" disabled>
            </div>
            
            <div class="form-group">
                <label class="form-label">选择分账接收方 *</label>
                <select class="form-control" id="edit-receiver-profitReceiverId" required>
                    <option value="">请选择分账接收方</option>
                    ${receivers.map(r => `
                        <option value="${r.id}" ${r.id === rule.profitReceiverId ? 'selected' : ''}>
                            ${r.receiverName} - ${r.receiverType === 'merchant' ? '商户号' : '银行账户'}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">分走商户号的收益比例 * <span style="font-size: 12px; color: #999; font-weight: normal;">（假设设置的是10%，那么此商户号收益100元，则分账接收方从中分走10元）</span></label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="number" class="form-control" id="edit-receiver-ratio" 
                           min="0" max="100" step="0.01" value="${rule.brandRatio}" 
                           required style="width: 120px;">
                    <span>%</span>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">上传协议证明 *</label>
                <input type="file" class="form-control" id="edit-receiver-proof" accept=".pdf,.jpg,.jpeg,.png" required>
                <p style="font-size: 12px; color: #999; margin-top: 5px;">支持PDF、JPG、PNG格式，文件大小不超过5MB</p>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('edit-profit-receiver-form').requestSubmit()">保存</button>
    `);
}

// 提交编辑分账接收方
function submitEditProfitReceiver(e, merchantId) {
    e.preventDefault();
    
    const profitReceiverId = document.getElementById('edit-receiver-profitReceiverId').value;
    const ratio = parseFloat(document.getElementById('edit-receiver-ratio').value);
    const proofFile = document.getElementById('edit-receiver-proof').files[0];
    
    if (!profitReceiverId) {
        showToast('请选择分账接收方', 'warning');
        return;
    }
    
    if (ratio <= 0 || ratio > 100) {
        showToast('收益比例必须在0-100之间', 'warning');
        return;
    }
    
    if (!proofFile) {
        showToast('请上传协议证明', 'warning');
        return;
    }
    
    // 模拟文件上传
    const proofUrl = `https://example.com/proofs/${Date.now()}_${proofFile.name}`;
    
    // 创建日志记录
    const log = {
        id: 'LOG' + Date.now(),
        merchantId: merchantId,
        profitReceiverId: profitReceiverId,
        ratio: ratio,
        proofUrl: proofUrl,
        proofFileName: proofFile.name,
        operator: 'MG管理员',
        operatorAccount: 'admin@mg.com',
        operateTime: new Date().toLocaleString('zh-CN'),
        operateType: 'update',
        source: 'mg_backend',
        remark: '通过MG管理后台修改分账接收方'
    };
    
    // 保存到profitReceiverLogs表
    let logs = DataStore.get('profitReceiverLogs') || [];
    logs.push(log);
    DataStore.set('profitReceiverLogs', logs);
    
    // 更新profitRules表
    const profitRules = DataStore.get('profitRules');
    const ruleIndex = profitRules.findIndex(r => r.merchantId === merchantId);
    
    if (ruleIndex >= 0) {
        const receiver = DataStore.findById('profitReceivers', profitReceiverId);
        profitRules[ruleIndex].brandMerchantId = receiver.merchantId;
        profitRules[ruleIndex].brandMerchantName = receiver.receiverName;
        profitRules[ruleIndex].brandRatio = ratio;
        profitRules[ruleIndex].profitReceiverId = profitReceiverId;
        profitRules[ruleIndex].updateTime = new Date().toLocaleString('zh-CN');
        DataStore.set('profitRules', profitRules);
    }
    
    closeModal();
    showToast('分账接收方修改成功', 'success');
    
    // 刷新页面
    renderPage('merchants');
    switchMerchantsTab('profit');
    switchProfitTab('brand');
}

// 查看分账接收方日志
function viewProfitReceiverLog(merchantId) {
    const logs = (DataStore.get('profitReceiverLogs') || []).filter(l => l.merchantId === merchantId);
    const merchant = DataStore.findById('merchants', merchantId);
    
    const logsHtml = logs.length > 0 ? logs.map(log => `
        <tr>
            <td>${log.operateTime}</td>
            <td>${log.operateType === 'create' ? '新增' : log.operateType === 'update' ? '修改' : '删除'}</td>
            <td>${log.source === 'mg_backend' ? 'MG管理后台' : 'Lite商户端'}</td>
            <td>${log.operator}</td>
            <td>${log.operatorAccount}</td>
            <td>${log.ratio}%</td>
            <td><a href="${log.proofUrl}" target="_blank">${log.proofFileName}</a></td>
            <td>${log.remark || '-'}</td>
        </tr>
    `).join('') : '<tr><td colspan="8" style="text-align: center; color: #999;">暂无操作日志</td></tr>';
    
    openModal(`分账接收方操作日志 - ${merchantId}`, `
        <div style="margin-bottom: 15px;">
            <p><strong>商户号：</strong>${merchantId}</p>
            <p><strong>商户名称：</strong>${merchant?.name || '-'}</p>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>操作时间</th>
                        <th>操作类型</th>
                        <th>操作来源</th>
                        <th>操作人</th>
                        <th>操作账号</th>
                        <th>收益比例</th>
                        <th>协议证明</th>
                        <th>备注</th>
                    </tr>
                </thead>
                <tbody>
                    ${logsHtml}
                </tbody>
            </table>
        </div>
    `, `
        <button class="btn btn-primary" onclick="closeModal()">关闭</button>
    `);
}

// 更新三方分账比例总和提示（用于详情面板Tab）
function updateRatioSum() {
    const merchantRatio = parseFloat(document.getElementById('ratioMerchantRatio')?.value || 0);
    const operationRatio = parseFloat(document.getElementById('ratioOperationRatio')?.value || 0);
    const platformRatio = parseFloat(document.getElementById('ratioPlatformRatio')?.value || 0);
    
    const sum = merchantRatio + operationRatio + platformRatio;
    const sumText = document.getElementById('ratioSumText');
    const sumTip = document.getElementById('ratioSumTip');
    
    if (sumText && sumTip) {
        sumText.textContent = `当前总和：${sum.toFixed(2)}%`;
        
        if (Math.abs(sum - 100) < 0.01) {
            sumTip.style.background = '#f6ffed';
            sumTip.style.border = '1px solid #b7eb8f';
            sumTip.style.color = '#52c41a';
            sumText.textContent += ' ✓ 符合要求';
        } else {
            sumTip.style.background = '#fff2f0';
            sumTip.style.border = '1px solid #ffccc7';
            sumTip.style.color = '#ff4d4f';
            sumText.textContent += ' ✗ 必须等于100%';
        }
    }
}

// 保存商品的三方分账比例
function saveGoodsRatio(goodsId) {
    const merchantRatio = parseFloat(document.getElementById('ratioMerchantRatio').value);
    const operationRatio = parseFloat(document.getElementById('ratioOperationRatio').value);
    const platformRatio = parseFloat(document.getElementById('ratioPlatformRatio').value);
    
    // 验证三方分账比例之和必须等于100%
    const ratioSum = merchantRatio + operationRatio + platformRatio;
    if (Math.abs(ratioSum - 100) > 0.01) {
        showToast('三方分账比例之和必须等于100%，当前为' + ratioSum.toFixed(2) + '%', 'error');
        return;
    }
    
    // 更新商品数据
    DataStore.update('goods', goodsId, {
        merchantRatio,
        operationRatio,
        platformRatio,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('goodsLogs', {
        id: 'GLOG' + Date.now(),
        goodsId,
        action: '修改分账比例',
        operator: '系统管理员',
        detail: `修改三方分账比例：收款商户号${merchantRatio}%、私域运营平台${operationRatio}%、供应链平台${platformRatio}%`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('分账比例保存成功', 'success');
    
    // 刷新详情面板
    showGoodsDetailPanel(goodsId);
    
    // 切换回分账比例Tab
    setTimeout(() => {
        switchGoodsDetailTab('ratio', goodsId);
    }, 100);
}

// 更新商品表格行（不重新渲染整个页面）
function updateGoodsTableRow(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    if (!goods) return;
    
    const row = document.getElementById(`goods-row-${goodsId}`);
    if (!row) return;
    
    // 保持选中状态
    const isSelected = row.style.background === 'rgb(230, 247, 255)';
    
    row.innerHTML = `
        <td>
            <div style="width: 60px; height: 60px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
                封面图
            </div>
        </td>
        <td>${goods.id}</td>
        <td>${goods.name}</td>
        <td>${goods.category}</td>
        <td>${goods.supplier || '-'}</td>
        <td>¥${goods.salePrice}</td>
        <td>¥${goods.costPrice}</td>
        <td>${goods.status === 'online' ? '<span class="status-tag status-success">上架</span>' : '<span class="status-tag status-default">下架</span>'}</td>
        <td>${goods.updateTime}</td>
        <td class="action-btns">
            <button class="btn btn-link" onclick="editGoods('${goods.id}')">编辑</button>
            <button class="btn btn-link" onclick="toggleGoodsStatus('${goods.id}')">${goods.status === 'online' ? '下架' : '上架'}</button>
            ${goods.status === 'offline' ? `<button class="btn btn-link" style="color: #ff4d4f;" onclick="deleteGoods('${goods.id}')">删除</button>` : ''}
        </td>
    `;
    
    // 恢复选中状态
    if (isSelected) {
        row.style.background = '#e6f7ff';
    }
}

// 选择商品行并显示详情
let selectedGoodsId = null;

function selectGoodsRow(goodsId, event) {
    // 如果点击的是操作按钮，不处理
    if (event && event.target.closest('.action-btns')) {
        return;
    }
    
    // 移除之前选中的高亮
    document.querySelectorAll('#goods-tbody tr').forEach(row => {
        row.style.background = '';
    });
    
    // 高亮当前选中的行
    const row = document.getElementById(`goods-row-${goodsId}`);
    if (row) {
        row.style.background = '#e6f7ff';
    }
    
    selectedGoodsId = goodsId;
    showGoodsDetailPanel(goodsId);
}

// 初始化商品行点击事件（在renderGoods后调用）
function initGoodsRowClickEvents() {
    const tbody = document.getElementById('goods-tbody');
    if (!tbody) return;
    
    tbody.addEventListener('click', function(event) {
        const row = event.target.closest('tr[data-goods-id]');
        if (!row) return;
        
        // 如果点击的是操作按钮区域，不处理
        if (event.target.closest('.action-btns')) {
            return;
        }
        
        const goodsId = row.getAttribute('data-goods-id');
        selectGoodsRow(goodsId, event);
    });
}

// 显示商品详情面板
function showGoodsDetailPanel(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    if (!goods) return;
    
    const prices = DataStore.findBy('goodsPrices', 'goodsId', goodsId);
    const logs = DataStore.findBy('goodsLogs', 'goodsId', goodsId);
    
    // 更新标题
    const titleElement = document.getElementById('goods-detail-title');
    if (titleElement) {
        titleElement.textContent = `${goods.name} (${goods.id})`;
    }
    
    // 渲染详情内容
    const contentDiv = document.getElementById('goods-detail-content');
    if (!contentDiv) return;
    
    contentDiv.innerHTML = `
        <div class="goods-detail-tabs">
            <div class="goods-detail-tab active" data-tab="price" data-goods-id="${goodsId}">
                <span>商品价格列表</span>
            </div>
            <div class="goods-detail-tab" data-tab="ratio" data-goods-id="${goodsId}">
                <span>三方分账比例设置</span>
            </div>
            <div class="goods-detail-tab" data-tab="products" data-goods-id="${goodsId}">
                <span>组合绑定产品</span>
            </div>
            <div class="goods-detail-tab" data-tab="areas" data-goods-id="${goodsId}">
                <span>不可发货地区</span>
            </div>
            <div class="goods-detail-tab" data-tab="shipping" data-goods-id="${goodsId}">
                <span>商品邮费设置</span>
            </div>
            <div class="goods-detail-tab" data-tab="logs" data-goods-id="${goodsId}">
                <span>商品操作记录</span>
            </div>
            <div class="goods-detail-tab" data-tab="warehouse" data-goods-id="${goodsId}">
                <span>云仓关联信息</span>
            </div>
        </div>
        <div id="goods-detail-tab-content" style="margin-top: 15px;">
            ${renderGoodsDetailPriceTab(goods, prices)}
        </div>
        
        <style>
            .goods-detail-tabs {
                display: flex;
                border-bottom: 2px solid #e8e8e8;
                gap: 5px;
            }
            .goods-detail-tab {
                padding: 10px 20px;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.3s;
                font-size: 13px;
                color: #666;
            }
            .goods-detail-tab:hover {
                color: #6c5ce7;
                background: #f5f5f5;
            }
            .goods-detail-tab.active {
                color: #6c5ce7;
                border-bottom-color: #6c5ce7;
                font-weight: 600;
            }
        </style>
    `;
    
    // 初始化Tab点击事件
    initGoodsDetailTabEvents();
}

// 切换商品详情Tab
function switchGoodsDetailTab(tab, goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const prices = DataStore.findBy('goodsPrices', 'goodsId', goodsId);
    const logs = DataStore.findBy('goodsLogs', 'goodsId', goodsId);
    
    // 更新Tab激活状态
    document.querySelectorAll('.goods-detail-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.goods-detail-tab[data-tab="${tab}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // 渲染对应内容
    const contentDiv = document.getElementById('goods-detail-tab-content');
    if (!contentDiv) return;
    
    switch(tab) {
        case 'price':
            contentDiv.innerHTML = renderGoodsDetailPriceTab(goods, prices);
            break;
        case 'ratio':
            contentDiv.innerHTML = renderGoodsDetailRatioTab(goods);
            break;
        case 'products':
            contentDiv.innerHTML = renderGoodsDetailProductsTab(goods);
            break;
        case 'areas':
            contentDiv.innerHTML = renderGoodsDetailAreasTab(goods);
            break;
        case 'shipping':
            contentDiv.innerHTML = renderGoodsDetailShippingTab(goods);
            break;
        case 'logs':
            contentDiv.innerHTML = renderGoodsDetailLogsTab(logs);
            break;
        case 'warehouse':
            contentDiv.innerHTML = renderGoodsDetailWarehouseTab(goods);
            break;
    }
}

// 初始化商品详情Tab点击事件
let goodsDetailTabEventsInitialized = false;

function initGoodsDetailTabEvents() {
    const tabsContainer = document.querySelector('.goods-detail-tabs');
    if (!tabsContainer) return;
    
    // 移除旧的事件监听器（如果存在）
    const oldListener = tabsContainer._tabClickListener;
    if (oldListener) {
        tabsContainer.removeEventListener('click', oldListener);
    }
    
    // 创建新的事件监听器
    const newListener = function(event) {
        const tab = event.target.closest('.goods-detail-tab');
        if (!tab) return;
        
        const tabName = tab.getAttribute('data-tab');
        const goodsId = tab.getAttribute('data-goods-id');
        
        if (tabName && goodsId) {
            switchGoodsDetailTab(tabName, goodsId);
        }
    };
    
    // 保存监听器引用并添加
    tabsContainer._tabClickListener = newListener;
    tabsContainer.addEventListener('click', newListener);
}

// 商品价格列表Tab
function renderGoodsDetailPriceTab(goods, prices) {
    if (!goods) return '<p style="text-align: center; color: #999; padding: 20px;">商品数据加载失败</p>';
    
    return `
        <div style="margin-bottom: 15px;">
            <h4 style="font-size: 14px; margin-bottom: 10px;">当前价格</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">销售价格</div>
                    <div style="font-size: 20px; font-weight: 600; color: #ff4d4f;">¥${goods.salePrice || 0}</div>
                </div>
                <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">原价</div>
                    <div style="font-size: 20px; font-weight: 600; color: #999;">¥${goods.originalPrice || 0}</div>
                </div>
                <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">成本价</div>
                    <div style="font-size: 20px; font-weight: 600; color: #52c41a;">¥${goods.costPrice || 0}</div>
                </div>
            </div>
        </div>
        
        ${prices && prices.length > 0 ? `
            <div>
                <h4 style="font-size: 14px; margin-bottom: 10px;">历史价格记录</h4>
                <div class="table-container">
                    <table style="font-size: 12px;">
                        <thead>
                            <tr>
                                <th>销售价</th>
                                <th>原价</th>
                                <th>生效时间</th>
                                <th>结束时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prices.map(p => `
                                <tr>
                                    <td>¥${p.salePrice || 0}</td>
                                    <td>¥${p.originalPrice || 0}</td>
                                    <td>${p.startTime || '-'}</td>
                                    <td>${p.endTime || '至今'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : '<p style="text-align: center; color: #999; padding: 20px;">暂无历史价格记录</p>'}
    `;
}

// 三方分账比例设置Tab
function renderGoodsDetailRatioTab(goods) {
    if (!goods) return '<p style="text-align: center; color: #999; padding: 20px;">商品数据加载失败</p>';
    
    const currentMerchantRatio = goods.merchantRatio || 10;
    const currentOperationRatio = goods.operationRatio || 20;
    const currentPlatformRatio = goods.platformRatio || 70;
    const ratioSum = currentMerchantRatio + currentOperationRatio + currentPlatformRatio;
    
    return `
        <div style="max-width: 800px;">
            <div style="margin-bottom: 20px; padding: 15px; background: #e6f7ff; border-radius: 8px; border: 1px solid #91d5ff;">
                <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #1890ff;">💡 说明</h4>
                <p style="font-size: 13px; color: #666; margin: 0;">设置收款商户号、私域运营平台、供应链平台的分账比例，三方之和必须等于100%</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="font-size: 14px; margin-bottom: 15px;">当前分账比例</h4>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="padding: 20px; background: #e6f7ff; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">收款商户号</div>
                        <div style="font-size: 28px; font-weight: 600; color: #1890ff;">${currentMerchantRatio}%</div>
                    </div>
                    <div style="padding: 20px; background: #f0f7ff; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">私域运营平台</div>
                        <div style="font-size: 28px; font-weight: 600; color: #1890ff;">${currentOperationRatio}%</div>
                    </div>
                    <div style="padding: 20px; background: #f6ffed; border-radius: 8px; text-align: center;">
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">供应链平台</div>
                        <div style="font-size: 28px; font-weight: 600; color: #52c41a;">${currentPlatformRatio}%</div>
                    </div>
                </div>
                
                <div style="padding: 12px; background: ${ratioSum === 100 ? '#f6ffed' : '#fff7e6'}; border-radius: 6px; border: 1px solid ${ratioSum === 100 ? '#b7eb8f' : '#ffd591'};">
                    <span style="font-size: 13px; color: ${ratioSum === 100 ? '#52c41a' : '#fa8c16'};">
                        ${ratioSum === 100 ? '✓ 当前总和：100%（符合要求）' : '⚠️ 当前总和：' + ratioSum + '%（需要等于100%）'}
                    </span>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="font-size: 14px; margin-bottom: 15px;">修改分账比例</h4>
                
                <div class="form-group">
                    <label class="form-label">收款商户号分账比例 *</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" class="form-control" id="ratioMerchantRatio" 
                               min="0" max="100" step="0.01" value="${currentMerchantRatio}" 
                               oninput="updateRatioSum()" required style="width: 150px;">
                        <span>%</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">私域运营平台分账比例 *</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" class="form-control" id="ratioOperationRatio" 
                               min="0" max="100" step="0.01" value="${currentOperationRatio}" 
                               oninput="updateRatioSum()" required style="width: 150px;">
                        <span>%</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">供应链平台分账比例 *</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" class="form-control" id="ratioPlatformRatio" 
                               min="0" max="100" step="0.01" value="${currentPlatformRatio}" 
                               oninput="updateRatioSum()" required style="width: 150px;">
                        <span>%</span>
                    </div>
                </div>
                
                <div id="ratioSumTip" style="padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 15px;">
                    <span id="ratioSumText">当前总和：${ratioSum}%</span>
                </div>
                
                <button class="btn btn-primary" onclick="saveGoodsRatio('${goods.id}')">
                    保存分账比例
                </button>
            </div>
        </div>
    `;
}

// 组合绑定产品Tab
function renderGoodsDetailProductsTab(goods) {
    if (!goods || !goods.products || goods.products.length === 0) {
        return `
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 36px; margin-bottom: 10px;">📦</div>
                <p>暂无产品组合信息</p>
            </div>
        `;
    }
    
    return `
        <div>
            <h4 style="font-size: 14px; margin-bottom: 10px;">产品组合信息</h4>
            <div class="table-container">
                <table style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th>产品ID</th>
                            <th>产品名称</th>
                            <th>数量</th>
                            <th>锁定单价</th>
                            <th>小计</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${goods.products.map(p => `
                            <tr>
                                <td>${p.productId || '-'}</td>
                                <td>${p.productName || '-'}</td>
                                <td>${p.quantity || 0}</td>
                                <td>¥${p.lockedPrice || 0}</td>
                                <td>¥${((p.quantity || 0) * (p.lockedPrice || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #fafafa; font-weight: 600;">
                            <td colspan="4" style="text-align: right;">成本价合计：</td>
                            <td>¥${goods.costPrice || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 不可发货地区Tab
function renderGoodsDetailAreasTab(goods) {
    const templates = DataStore.get('excludeAreaTemplates');
    const currentTemplate = templates.find(t => t.id === goods.excludeAreaTemplateId);
    
    return `
        <div>
            <h4 style="font-size: 14px; margin-bottom: 10px;">不可发货地区设置</h4>
            ${currentTemplate ? `
                <div style="padding: 15px; background: #fff7e6; border-radius: 6px; border: 1px solid #ffd591;">
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                        模板：${currentTemplate.name}
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        不可发货地区：${currentTemplate.areas.join('、')}
                    </div>
                </div>
            ` : `
                <div style="text-align: center; padding: 30px; color: #999;">
                    <div style="font-size: 36px; margin-bottom: 10px;">📍</div>
                    <p>未设置不可发货地区，全国可发货</p>
                </div>
            `}
        </div>
    `;
}

// 商品邮费设置Tab
function renderGoodsDetailShippingTab(goods) {
    const templates = DataStore.get('shippingTemplates');
    const currentTemplate = templates.find(t => t.id === goods.shippingTemplateId);
    
    return `
        <div>
            <h4 style="font-size: 14px; margin-bottom: 10px;">邮费模板设置</h4>
            ${currentTemplate ? `
                <div style="padding: 15px; background: #e6f7ff; border-radius: 6px; border: 1px solid #91d5ff;">
                    <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                        模板：${currentTemplate.name}
                    </div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        类型：${currentTemplate.type === 'free' ? '包邮' : '标准运费'}
                    </div>
                    ${currentTemplate.type === 'standard' ? `
                        <div style="font-size: 12px; color: #666;">
                            默认运费：¥${currentTemplate.defaultFee}
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div style="text-align: center; padding: 30px; color: #999;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🚚</div>
                    <p>未设置邮费模板</p>
                </div>
            `}
        </div>
    `;
}

// 商品操作记录Tab
function renderGoodsDetailLogsTab(logs) {
    if (!logs || logs.length === 0) {
        return `
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 36px; margin-bottom: 10px;">📝</div>
                <p>暂无操作记录</p>
            </div>
        `;
    }
    
    return `
        <div>
            <h4 style="font-size: 14px; margin-bottom: 10px;">操作记录</h4>
            <div class="table-container">
                <table style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th>操作时间</th>
                            <th>操作类型</th>
                            <th>操作人</th>
                            <th>操作详情</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.createTime || '-'}</td>
                                <td>${log.action || '-'}</td>
                                <td>${log.operator || '-'}</td>
                                <td>${log.detail || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 云仓关联信息Tab
function renderGoodsDetailWarehouseTab(goods) {
    return `
        <div>
            <h4 style="font-size: 14px; margin-bottom: 10px;">云仓关联信息</h4>
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 36px; margin-bottom: 10px;">☁️</div>
                <p>云仓功能开发中...</p>
                <p style="font-size: 12px; margin-top: 10px;">此功能将用于关联云仓库存、发货等信息</p>
            </div>
        </div>
    `;
}
