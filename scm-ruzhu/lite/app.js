// Lite端应用逻辑 - 营销应用架构
let currentPage = 'marketing-apps'; // 默认显示营销应用列表
let currentApp = null; // 当前打开的应用
let currentMerchantId = 'YZF202501001'; // 当前登录的商户号

document.addEventListener('DOMContentLoaded', () => {
    // 调试：打印当前商户的所有申请记录
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    console.log('当前商户申请记录:', apps);
    console.log('申请状态统计:', apps.map(a => ({id: a.id, status: a.status})));
    
    renderMainMenu();
    renderPage(currentPage);
    listenStorageChanges();
});

function listenStorageChanges() {
    window.addEventListener('storage', (e) => {
        if (['applications', 'orders', 'deposits', 'goods'].includes(e.key)) {
            if (currentApp === 'supply-chain') {
                checkSupplyChainStatus();
            }
            showToast('数据已更新', 'success');
        }
    });
    // 定期检查数据更新，确保实时同步
    setInterval(() => {
        if (currentApp === 'supply-chain') {
            checkSupplyChainStatus();
            if (currentPage !== 'marketing-apps' && currentPage !== 'supply-chain-entry') {
                renderPage(currentPage);
            }
        }
    }, 5000);
}

// 渲染主菜单 - 营销应用架构
function renderMainMenu() {
    document.getElementById('nav-menu').innerHTML = `
        <div class="nav-group-title">Lite商户后台</div>
        <div class="nav-item has-submenu" data-page="store-config">
            <span class="icon">🏪</span>
            <span>门店配置</span>
        </div>
        <div class="nav-submenu">
            <div class="nav-item" data-page="organization"><span class="icon">🏗️</span><span>基础架构</span></div>
            <div class="nav-item" data-page="role-permission"><span class="icon">🔐</span><span>角色权限</span></div>
        </div>
        <div class="nav-item active" data-page="marketing-apps"><span class="icon">🚀</span><span>营销应用</span></div>
    `;
    initNavigation();
}

// 渲染店商供应链应用内菜单
function renderSupplyChainMenu() {
    const merchant = DataStore.findById('merchants', currentMerchantId);
    const merchants = DataStore.get('merchants');
    
    // 获取所有已签约的商户号（同品牌或当前商户）
    const signedMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        if (merchant.brandId) {
            return signed && m.brandId === merchant.brandId;
        }
        return signed && m.id === currentMerchantId;
    });
    
    document.getElementById('nav-menu').innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <button onclick="exitSupplyChainApp()" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer; font-size: 13px;">← 返回营销应用</button>
        </div>
        ${signedMerchants.length > 1 ? `
        <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <label style="font-size: 12px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 5px;">当前商户号</label>
            <select class="form-control" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2);" onchange="switchMerchant(this.value)">
                ${signedMerchants.map(m => `
                    <option value="${m.id}" ${m.id === currentMerchantId ? 'selected' : ''}>${m.name}</option>
                `).join('')}
            </select>
        </div>
        ` : ''}
        <div class="nav-group-title">店商供应链</div>
        <div class="nav-item active" data-page="supply-chain-dashboard"><span class="icon">📊</span><span>工作台</span></div>
        <div class="nav-item" data-page="supply-chain-apply"><span class="icon">📝</span><span>入驻管理</span></div>
        <div class="nav-item" data-page="supply-chain-goods"><span class="icon">🛍️</span><span>商品管理</span></div>
        <!-- 暂时隐藏以下模块
        <div class="nav-item" data-page="supply-chain-deposit"><span class="icon">💰</span><span>保证金管理</span></div>
        <div class="nav-item" data-page="supply-chain-orders"><span class="icon">📦</span><span>订单管理</span></div>
        <div class="nav-item" data-page="supply-chain-finance"><span class="icon">📈</span><span>财务对账</span></div>
        -->
    `;
    initNavigation();
}

// 检查店商供应链应用状态
function checkSupplyChainStatus() {
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const signedApp = apps.find(a => a.status === 'signed');
    
    if (signedApp) {
        // 已签约，显示完整菜单
        renderSupplyChainMenu();
        document.getElementById('sidebar-subtitle').textContent = '店商供应链';
        if (currentPage === 'supply-chain-entry') {
            currentPage = 'supply-chain-dashboard';
        }
    } else {
        // 未签约，显示入驻流程菜单
        renderSupplyChainApplyMenu();
        document.getElementById('sidebar-subtitle').textContent = '店商供应链入驻';
        currentPage = 'supply-chain-entry';
    }
    renderPage(currentPage);
}

// 未签约商户的入驻菜单
function renderSupplyChainApplyMenu() {
    document.getElementById('nav-menu').innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">
            <button onclick="exitSupplyChainApp()" style="width: 100%; padding: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer; font-size: 13px;">← 返回营销应用</button>
        </div>
        <div class="nav-group-title">店商供应链</div>
        <div class="nav-item active" data-page="supply-chain-entry"><span class="icon">🚀</span><span>入驻申请</span></div>
    `;
    initNavigation();
}

// 退出店商供应链应用
function exitSupplyChainApp() {
    currentApp = null;
    currentPage = 'marketing-apps';
    document.getElementById('sidebar-subtitle').textContent = '营销应用';
    renderMainMenu();
    renderPage(currentPage);
}

// 进入店商供应链应用
function enterSupplyChainApp() {
    currentApp = 'supply-chain';
    checkSupplyChainStatus();
}

function switchMerchant(merchantId) {
    currentMerchantId = merchantId;
    checkSupplyChainStatus();
}

// 未签约商户的入驻菜单
function renderApplyMenu() {
    renderSupplyChainApplyMenu();
}

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // 如果是有子菜单的项，切换展开/折叠状态
            if (item.classList.contains('has-submenu')) {
                item.classList.toggle('expanded');
                return;
            }
            
            // 普通菜单项，切换页面
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
        // 主系统页面
        case 'marketing-apps': content.innerHTML = renderMarketingApps(); break;
        case 'organization': content.innerHTML = renderOrganization(); break;
        case 'role-permission': content.innerHTML = renderRolePermission(); break;
        
        // 店商供应链应用页面
        case 'supply-chain-entry': content.innerHTML = renderSupplyChainEntry(); break;
        case 'supply-chain-dashboard': content.innerHTML = renderSupplyChainDashboard(); break;
        case 'supply-chain-apply': content.innerHTML = renderSupplyChainApplyManagement(); break;
        case 'supply-chain-goods': content.innerHTML = renderSupplyChainGoods(); break;
        case 'supply-chain-deposit': content.innerHTML = renderSupplyChainDeposit(); break;
        case 'supply-chain-orders': content.innerHTML = renderSupplyChainOrders(); break;
        case 'supply-chain-finance': content.innerHTML = renderSupplyChainFinance(); break;
        
        // 兼容旧页面名称
        case 'entry': content.innerHTML = renderSupplyChainEntry(); break;
        case 'apply': content.innerHTML = renderSupplyChainApplyManagement(); break;
        case 'goods': content.innerHTML = renderSupplyChainGoods(); break;
        case 'deposit': content.innerHTML = renderSupplyChainDeposit(); break;
        case 'orders': content.innerHTML = renderSupplyChainOrders(); break;
        case 'finance': content.innerHTML = renderSupplyChainFinance(); break;
    }
    
    // 更新文档面板
    if (typeof updateDocPanel === 'function') {
        updateDocPanel(page);
    }
}

// 营销应用列表页面
function renderMarketingApps() {
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const supplyChainApp = apps.find(a => a.status === 'signed');
    const pendingApp = apps.find(a => a.status === 'pending_sign');
    const hasApplication = apps.length > 0;
    
    let supplyChainStatus = 'inactive';
    let supplyChainStatusText = '未开通';
    
    if (supplyChainApp) {
        supplyChainStatus = 'active';
        supplyChainStatusText = '已开通';
    } else if (pendingApp) {
        supplyChainStatus = 'pending';
        supplyChainStatusText = '待签署协议';
    } else if (hasApplication) {
        supplyChainStatus = 'pending';
        supplyChainStatusText = '申请中';
    }
    
    return `
        <div class="page-header">
            <h2 class="page-title">营销应用</h2>
            <span class="breadcrumb">Lite商户后台 / 营销应用</span>
        </div>
        
        <div class="app-cards-grid">
            <div class="app-card" onclick="enterSupplyChainApp()">
                <div class="app-card-icon">🛒</div>
                <div class="app-card-title">店商供应链</div>
                <div class="app-card-desc">
                    一站式供应链解决方案，提供商品代发、库存管理、订单处理等服务。
                    与供应链平台合作，让您专注于销售和客户服务。
                </div>
                <div class="app-card-status ${supplyChainStatus}">${supplyChainStatusText}</div>
            </div>
        </div>
    `;
}

// ========== 门店配置模块 ==========

// 基础架构页面
function renderOrganization() {
    const organizations = DataStore.get('organizations') || [];
    const tree = buildOrgTree(organizations);
    
    return `
        <div class="page-header">
            <h2 class="page-title">基础架构</h2>
            <span class="breadcrumb">门店配置 / 基础架构</span>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">组织架构</h3>
                <button class="btn btn-primary" onclick="showAddOrgModal()">+ 添加组织</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; min-height: 500px;">
                <!-- 左侧：组织树 -->
                <div style="border-right: 1px solid #e8e8e8; padding-right: 20px;">
                    <h4 style="margin-bottom: 15px; font-size: 14px; color: #666;">组织结构树</h4>
                    <div id="org-tree">
                        ${tree.length > 0 ? renderOrgTree(tree) : `
                            <div style="text-align: center; padding: 60px 20px; color: #999;">
                                <div style="font-size: 48px; margin-bottom: 15px;">🏗️</div>
                                <p>暂无组织架构</p>
                                <p style="font-size: 13px; margin-top: 8px;">点击右上角"添加组织"开始创建</p>
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- 右侧：详情 -->
                <div style="padding-left: 20px;">
                    <div id="org-detail">
                        <div style="text-align: center; padding: 60px 20px; color: #999;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                            <p>请选择一个组织节点查看详情</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 构建组织树
function buildOrgTree(organizations) {
    const map = {};
    const roots = [];
    
    // 创建映射
    organizations.forEach(org => {
        map[org.id] = { ...org, children: [] };
    });
    
    // 构建树
    organizations.forEach(org => {
        if (org.parentId && map[org.parentId]) {
            map[org.parentId].children.push(map[org.id]);
        } else {
            roots.push(map[org.id]);
        }
    });
    
    return roots;
}

// 渲染组织树
function renderOrgTree(nodes, level = 0) {
    return nodes.map(node => `
        <div class="org-node" style="padding-left: ${level * 20}px; margin-bottom: 8px;">
            <div class="org-node-content" onclick="selectOrgNode('${node.id}')" 
                 style="padding: 10px; background: #f9f9f9; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
                 onmouseover="this.style.background='#e6f7ff'" 
                 onmouseout="this.style.background='#f9f9f9'">
                <span style="margin-right: 8px;">${getOrgIcon(node.type)}</span>
                <span style="font-weight: 500;">${node.name}</span>
                <span style="margin-left: 10px; font-size: 12px; color: #666;">${node.employeeCount || 0}人</span>
            </div>
            ${node.children && node.children.length > 0 ? renderOrgTree(node.children, level + 1) : ''}
        </div>
    `).join('');
}

// 获取组织图标
function getOrgIcon(type) {
    const icons = {
        'headquarters': '🏢',
        'region': '🌍',
        'store': '🏪',
        'department': '👥'
    };
    return icons[type] || '📁';
}

// 选择组织节点
function selectOrgNode(orgId) {
    const organizations = DataStore.get('organizations') || [];
    const org = organizations.find(o => o.id === orgId);
    if (!org) return;
    
    document.getElementById('org-detail').innerHTML = `
        <h4 style="margin-bottom: 15px; font-size: 16px;">${org.name}</h4>
        <div class="detail-list">
            <div class="detail-item">
                <span class="label">组织ID</span>
                <span class="value">${org.id}</span>
            </div>
            <div class="detail-item">
                <span class="label">组织类型</span>
                <span class="value">${getOrgTypeName(org.type)}</span>
            </div>
            <div class="detail-item">
                <span class="label">负责人</span>
                <span class="value">${org.managerName || '未设置'}</span>
            </div>
            <div class="detail-item">
                <span class="label">员工数量</span>
                <span class="value">${org.employeeCount || 0}人</span>
            </div>
            <div class="detail-item">
                <span class="label">创建时间</span>
                <span class="value">${org.createTime}</span>
            </div>
        </div>
        <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button class="btn btn-primary" onclick="editOrg('${org.id}')">编辑</button>
            <button class="btn btn-outline" onclick="deleteOrg('${org.id}')">删除</button>
        </div>
    `;
}

// 获取组织类型名称
function getOrgTypeName(type) {
    const names = {
        'headquarters': '总部',
        'region': '区域',
        'store': '门店',
        'department': '部门'
    };
    return names[type] || type;
}

// 角色权限页面
function renderRolePermission() {
    const roles = DataStore.get('roles') || [];
    
    return `
        <div class="page-header">
            <h2 class="page-title">角色权限管理</h2>
            <span class="breadcrumb">门店配置 / 角色权限</span>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">角色列表</h3>
                <button class="btn btn-primary" onclick="showCreateRoleModal()">+ 创建角色</button>
            </div>
            
            ${roles.length > 0 ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding: 20px 0;">
                    ${roles.map(role => `
                        <div class="role-card" style="border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px; background: #fafafa; transition: all 0.3s;"
                             onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" 
                             onmouseout="this.style.boxShadow='none'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                <h4 style="margin: 0; font-size: 16px;">${role.name}</h4>
                                <span class="badge" style="background: #e6f7ff; color: #1890ff; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                                    ${role.employeeCount || 0} 人
                                </span>
                            </div>
                            <p style="color: #666; font-size: 13px; margin-bottom: 15px; min-height: 40px;">
                                ${role.description || '暂无描述'}
                            </p>
                            <div style="font-size: 12px; color: #999; margin-bottom: 15px;">
                                <div>权限数：${countPermissions(role.permissions)}</div>
                                <div>创建时间：${role.createTime}</div>
                            </div>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button class="btn btn-link btn-sm" onclick="editRole('${role.id}')">编辑</button>
                                <button class="btn btn-link btn-sm" onclick="configPermissions('${role.id}')">配置权限</button>
                                <button class="btn btn-link btn-sm" onclick="viewRoleEmployees('${role.id}')">查看员工</button>
                                <button class="btn btn-link btn-sm" style="color: #ff4d4f;" onclick="deleteRole('${role.id}')">删除</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🔐</div>
                    <p>暂无角色</p>
                    <p style="font-size: 13px; margin-top: 8px;">点击右上角"创建角色"开始创建</p>
                </div>
            `}
        </div>
    `;
}

// 统计权限数量
function countPermissions(permissions) {
    if (!permissions) return 0;
    let count = 0;
    Object.keys(permissions).forEach(key => {
        count += permissions[key].length;
    });
    return count;
}

// 店商供应链入口页面 - 根据状态显示不同流程
function renderSupplyChainEntry() {
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const merchant = DataStore.findById('merchants', currentMerchantId);
    
    // 情况c: 已签约，但仍可查看入驻管理
    const signedApp = apps.find(a => a.status === 'signed');
    if (signedApp) {
        return renderSupplyChainApplyManagement();
    }
    
    // 情况b: 有待签署的申请
    const pendingSignApp = apps.find(a => a.status === 'pending_sign');
    if (pendingSignApp) {
        return renderSignContract(pendingSignApp);
    }
    
    // 情况b: 有申请记录但未签约（包括待审核、已拒绝）
    if (apps.length > 0) {
        return renderApplyHistory(apps);
    }
    
    // 情况a: 初次申请
    return renderFirstApply();
}

// 初次申请页面
function renderFirstApply() {
    const merchants = DataStore.get('merchants');
    const availableMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        return !signed && m.miniProgramId; // 有商城小程序且未签约
    });
    
    return `
        <div class="page-header">
            <h2 class="page-title">店商供应链入驻申请</h2>
            <span class="breadcrumb">营销应用 / 店商供应链 / 入驻申请</span>
        </div>
        
        <div class="apply-steps">
            <div class="step active"><span class="step-num">1</span><span class="step-text">填写申请</span></div>
            <div class="step-line"></div>
            <div class="step"><span class="step-num">2</span><span class="step-text">平台审核</span></div>
            <div class="step-line"></div>
            <div class="step"><span class="step-num">3</span><span class="step-text">签署协议</span></div>
            <div class="step-line"></div>
            <div class="step"><span class="step-num">4</span><span class="step-text">合作成功</span></div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">申请入驻店商供应链</h3></div>
            <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 14px; color: #1890ff;">📌 入驻条件：</p>
                <p style="font-size: 13px; color: #666; margin-top: 8px;">1. 拥有【伊智付商户号】且已开通【分账】功能</p>
                <p style="font-size: 13px; color: #666;">2. 营业执照经营范围包含"化妆品零售"或"化妆品销售"</p>
                <p style="font-size: 13px; color: #666;">3. 所有合作以申请伊智付商户号的营业执照为合作主体</p>
            </div>
            
            <form id="apply-form" onsubmit="submitApplication(event)">
                <div class="form-group">
                    <label class="form-label">选择伊智付商户号 *</label>
                    <select class="form-control" id="merchantId" required onchange="onMerchantChange()">
                        <option value="">请选择商城小程序绑定的商户号</option>
                        ${availableMerchants.map(m => `
                            <option value="${m.id}" data-type="${m.type}" data-brand="${m.brandId || ''}" data-brand-merchant="${m.brandMerchantId || ''}">
                                ${m.id} - ${m.name} ${!m.hasSubAccount ? '(未开通分账)' : ''} ${m.type === 'individual' ? '(个体户)' : '(公司)'}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div id="merchant-info" style="display:none; margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                    <p><strong>营业执照：</strong><span id="license-info"></span></p>
                    <p><strong>经营范围：</strong><span id="scope-info"></span></p>
                    <p><strong>分账功能：</strong><span id="subaccount-info"></span></p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">申请人姓名 *</label>
                    <input type="text" class="form-control" id="applicantName" placeholder="请输入申请人姓名" required>
                </div>
                <div class="form-group">
                    <label class="form-label">申请人手机号 *</label>
                    <input type="tel" class="form-control" id="applicantPhone" placeholder="请输入手机号" required>
                </div>
                
                <div id="brand-section" style="display:none;">
                    <div class="form-group">
                        <label class="form-label">品牌总部商户号（连锁商户需填写）</label>
                        <select class="form-control" id="brandMerchantId" onchange="onBrandMerchantChange()">
                            <option value="">无需品牌总部分成</option>
                        </select>
                        <p style="font-size: 12px; color: #999; margin-top: 5px;">如果是连锁品牌分店，需选择总部的伊智付商户号</p>
                    </div>
                    <div class="form-group" id="brandRatioGroup" style="display:none;">
                        <label class="form-label">品牌总部分成比例（占商家收益的百分比）</label>
                        <input type="number" class="form-control" id="brandRatio" min="0" max="100" placeholder="例如：10 表示总部拿商家收益的10%" onchange="onBrandRatioChange()">
                    </div>
                    <div class="form-group" id="profitReceiverGroup" style="display:none;">
                        <label class="form-label">分账接收方 *</label>
                        <div style="display: flex; gap: 10px; align-items: flex-end;">
                            <div style="flex: 1;">
                                <select class="form-control" id="profitReceiver" required>
                                    <option value="">请选择分账接收方</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-outline" onclick="showAddReceiverModal()" style="white-space: nowrap;">+ 添加接收方</button>
                        </div>
                        <p style="font-size: 12px; color: #999; margin-top: 5px;">选择用于接收品牌总部分成的账户</p>
                    </div>
                    <div id="receiverRemark" style="display:none; margin-top: 15px; padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;">
                        <p style="color: #d46b08; font-weight: 600; margin-bottom: 8px;">⚠️ 需要添加分账接收方</p>
                        <p style="font-size: 13px; color: #666; margin-bottom: 10px;">当前品牌总部暂无可用的分账接收方，请添加后再提交申请。</p>
                        <textarea class="form-control" id="receiverRemarkText" placeholder="请说明需要添加分账接收方的原因..." rows="3"></textarea>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary">提交申请</button>
            </form>
        </div>
    `;
}

function onMerchantChange() {
    const select = document.getElementById('merchantId');
    const option = select.options[select.selectedIndex];
    const merchantId = select.value;
    
    if (!merchantId) {
        document.getElementById('merchant-info').style.display = 'none';
        document.getElementById('brand-section').style.display = 'none';
        return;
    }
    
    const merchant = DataStore.findById('merchants', merchantId);
    document.getElementById('merchant-info').style.display = 'block';
    document.getElementById('license-info').textContent = merchant.businessLicense + ' - ' + merchant.companyName;
    document.getElementById('scope-info').textContent = merchant.scope;
    document.getElementById('subaccount-info').innerHTML = merchant.hasSubAccount ? 
        '<span style="color:#52c41a">✓ 已开通</span>' : 
        '<span style="color:#ff4d4f">✗ 未开通</span>';
    
    // 连锁品牌显示总部选择
    if (merchant.brandId) {
        document.getElementById('brand-section').style.display = 'block';
        const brandMerchants = DataStore.get('merchants').filter(m => m.brandId === merchant.brandId && !m.brandMerchantId);
        document.getElementById('brandMerchantId').innerHTML = `
            <option value="">无需品牌总部分成</option>
            ${brandMerchants.map(m => `<option value="${m.id}">${m.id} - ${m.name}</option>`).join('')}
        `;
        if (merchant.brandMerchantId) {
            document.getElementById('brandMerchantId').value = merchant.brandMerchantId;
            onBrandMerchantChange();
        }
    } else {
        document.getElementById('brand-section').style.display = 'none';
    }
}

function onBrandMerchantChange() {
    const brandMerchantId = document.getElementById('brandMerchantId').value;
    
    if (!brandMerchantId) {
        document.getElementById('brandRatioGroup').style.display = 'none';
        document.getElementById('profitReceiverGroup').style.display = 'none';
        document.getElementById('receiverRemark').style.display = 'none';
        return;
    }
    
    document.getElementById('brandRatioGroup').style.display = 'block';
}

function onBrandRatioChange() {
    const brandRatio = parseFloat(document.getElementById('brandRatio').value);
    const brandMerchantId = document.getElementById('brandMerchantId').value;
    
    if (!brandRatio || brandRatio <= 0 || !brandMerchantId) {
        document.getElementById('profitReceiverGroup').style.display = 'none';
        document.getElementById('receiverRemark').style.display = 'none';
        return;
    }
    
    // 显示分账接收方选择
    document.getElementById('profitReceiverGroup').style.display = 'block';
    
    // 加载该品牌总部的分账接收方列表
    const receivers = DataStore.findBy('profitReceivers', 'merchantId', brandMerchantId)
        .filter(r => r.status === 'active');
    
    const receiverSelect = document.getElementById('profitReceiver');
    if (receivers.length > 0) {
        receiverSelect.innerHTML = `
            <option value="">请选择分账接收方</option>
            ${receivers.map(r => `
                <option value="${r.id}">
                    ${r.receiverName} - ${r.receiverType === 'merchant' ? '商户号' : '银行账户'} 
                    ${r.receiverType === 'bank' ? `(${r.bankName} ${r.bankAccount.slice(-4)})` : ''}
                </option>
            `).join('')}
        `;
        document.getElementById('receiverRemark').style.display = 'none';
    } else {
        receiverSelect.innerHTML = '<option value="">暂无可用的分账接收方</option>';
        document.getElementById('receiverRemark').style.display = 'block';
    }
}

// 签署协议页面
function renderSignContract(app) {
    const merchant = DataStore.findById('merchants', app.merchantId);
    const hasBrand = app.brandMerchantId && app.brandRatio > 0;
    const allSigned = app.contracts.every(c => c.signed);
    
    return `
        <div class="page-header">
            <h2 class="page-title">签署协议</h2>
            <span class="breadcrumb">营销应用 / 店商供应链 / 签署协议</span>
        </div>
        
        <div class="apply-steps">
            <div class="step done"><span class="step-num">✓</span><span class="step-text">填写申请</span></div>
            <div class="step-line"></div>
            <div class="step done"><span class="step-num">✓</span><span class="step-text">平台审核</span></div>
            <div class="step-line"></div>
            <div class="step active"><span class="step-num">3</span><span class="step-text">签署协议</span></div>
            <div class="step-line"></div>
            <div class="step"><span class="step-num">4</span><span class="step-text">合作成功</span></div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">审核结果</h3></div>
            <div style="padding: 15px; background: #f6ffed; border-radius: 8px; border: 1px solid #b7eb8f;">
                <p><strong>审核状态：</strong><span style="color: #52c41a;">✓ 审核通过</span></p>
                <p><strong>审核备注：</strong>${app.auditRemark}</p>
                <p style="margin-top: 10px;"><strong>分成比例区间（将代入协议）：</strong></p>
                <p style="font-size: 13px; color: #666;">• 商家收益：${app.merchantRatioRange}%</p>
                <p style="font-size: 13px; color: #666;">• 供应链平台收益：${app.platformRatioRange}%</p>
                <p style="font-size: 13px; color: #666;">• 私域运营平台收益：${app.operationRatioRange}%</p>
                ${hasBrand ? `<p style="font-size: 13px; color: #666;">• 品牌总部分成：占商家收益的${app.brandRatio}%</p>` : ''}
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">待签署协议</h3></div>
            <p style="color: #666; margin-bottom: 15px;">请使用申请伊智付商户号的营业执照（${merchant.companyName}）签署以下协议：</p>
            
            <div style="padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591; margin-bottom: 20px;">
                <p style="color: #d46b08; font-size: 13px;">
                    📌 签署规则：打开协议 → 滚动到底部 → 阅读≥10秒 → 勾选同意 → 点击"已阅读并确认签署"
                </p>
            </div>
            
            <div class="contract-list">
                ${app.contracts.map((contract, index) => `
                    <div class="contract-item ${contract.signed ? 'signed' : ''}">
                        <div class="contract-info">
                            <h4>${contract.name}</h4>
                            <p>签约主体：${merchant.companyName} 与 ${
                                contract.type === 'dropship' || contract.type === 'platform' ? '伊智贸易公司' : 
                                contract.type === 'operation' ? '私域运营平台' : '品牌总部'
                            }</p>
                            ${contract.signed ? `
                                <p style="color: #52c41a;">✓ 已签署 ${contract.signTime}</p>
                                <p style="font-size: 12px; color: #999;">阅读时长：${contract.readDuration || '-'}秒</p>
                            ` : ''}
                        </div>
                        ${contract.signed ? 
                            '<span class="status-tag status-success">已签署</span>' : 
                            `<button class="btn btn-primary btn-sm" onclick="signSingleContract('${app.id}', ${index})">签署协议</button>`
                        }
                    </div>
                `).join('')}
            </div>
            ${allSigned ? `
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-success" onclick="completeSign('${app.id}')" style="padding: 12px 40px; font-size: 16px;">✓ 确认完成签署，开始合作</button>
                </div>
            ` : ''}
        </div>
    `;
}


// 申请历史记录页面
function renderApplyHistory(apps) {
    const merchants = DataStore.get('merchants');
    // 获取所有未签约的商户号（有商城小程序的）
    const availableMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        return !signed && m.miniProgramId; // 有商城小程序且未签约
    });
    
    return `
        <div class="page-header">
            <h2 class="page-title">入驻申请</h2>
            <span class="breadcrumb">营销应用 / 店商供应链 / 入驻申请</span>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">申请记录</h3>
                ${availableMerchants.length > 0 ? `<button class="btn btn-primary" onclick="showNewApplyModal()">+ 继续申请入驻</button>` : ''}
            </div>
            <p style="color: #666; margin-bottom: 15px;">您可以查看历史申请记录，对审核通过的申请进行协议签署。</p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th>
                            <th>申请人</th>
                            <th>状态</th>
                            <th>申请时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apps.map(app => `
                            <tr>
                                <td>${app.merchantId}</td>
                                <td>${app.applicantName} / ${app.applicantPhone}</td>
                                <td>${getApplyStatusTag(app.status)}</td>
                                <td>${app.createTime}</td>
                                <td>
                                    ${app.status === 'pending_sign' ? `<button class="btn btn-primary btn-sm" onclick="goToSign('${app.id}')">去签署</button>` : ''}
                                    ${app.status === 'rejected' ? `<button class="btn btn-warning btn-sm" onclick="reapply('${app.merchantId}')">重新申请</button>` : ''}
                                    <button class="btn btn-link" onclick="viewApplyDetail('${app.id}')">详情</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 已签约后的店商供应链工作台
function renderSupplyChainDashboard() {
    const merchant = DataStore.findById('merchants', currentMerchantId);
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const signedApp = apps.find(a => a.status === 'signed');
    const orders = DataStore.findBy('orders', 'merchantId', currentMerchantId);
    const deposit = DataStore.findBy('deposits', 'merchantId', currentMerchantId)[0] || {};
    
    const pendingDepositOrders = orders.filter(o => o.status === 'pending_deposit').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalProfit = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.merchantActualProfit, 0);
    
    return `
        <div class="page-header">
            <h2 class="page-title">工作台</h2>
            <span class="breadcrumb">店商供应链 / 工作台</span>
        </div>
        
        <div class="card" style="background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); color: #fff; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin-bottom: 8px;">🎉 ${merchant.name} 已成功入驻店商供应链</h3>
                    <p style="opacity: 0.9;">合作主体：${merchant.companyName}</p>
                    <p style="opacity: 0.9;">签约时间：${signedApp?.signTime || '-'}</p>
                </div>
                <div style="text-align: right;">
                    <p>分成比例：商家 ${signedApp?.merchantRatio}% | 平台 ${signedApp?.platformRatio}% | 运营 ${signedApp?.operationRatio}%</p>
                    ${signedApp?.brandRatio > 0 ? `<p>品牌总部分成：${signedApp.brandRatio}%（占商家收益）</p>` : ''}
                </div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">可用保证金</div>
                <div class="value" style="color: #52c41a;">¥${(deposit.availableDeposit || 0).toLocaleString()}</div>
                <div class="trend">累计充值 ¥${(deposit.totalDeposit || 0).toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="label">待充值订单</div>
                <div class="value" style="color: ${pendingDepositOrders > 0 ? '#ff4d4f' : '#333'};">${pendingDepositOrders}</div>
                <div class="trend ${pendingDepositOrders > 0 ? 'down' : ''}">${pendingDepositOrders > 0 ? '需充值保证金后发货' : '暂无待处理'}</div>
            </div>
            <div class="stat-card">
                <div class="label">累计销售额</div>
                <div class="value">¥${totalSales.toLocaleString()}</div>
                <div class="trend">订单 ${orders.length} 笔</div>
            </div>
            <div class="stat-card">
                <div class="label">累计收益</div>
                <div class="value" style="color: #52c41a;">¥${totalProfit.toFixed(2)}</div>
                <div class="trend up">已完成 ${completedOrders} 笔</div>
            </div>
        </div>
        
        ${pendingDepositOrders > 0 ? `
        <div class="card" style="border-left: 4px solid #ff4d4f;">
            <div class="card-header">
                <h3 class="card-title" style="color: #ff4d4f;">⚠️ 待处理：${pendingDepositOrders}个订单需充值保证金</h3>
                <button class="btn btn-warning" onclick="navigateTo('orders')">立即处理</button>
            </div>
            <p style="color: #666;">消费者使用卡金/赠金/积分等非微信支付方式，微信支付金额不足以完成多方分账，需要您充值保证金后才能发货。</p>
        </div>
        ` : ''}

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">快捷操作</h3>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="navigateTo('goods')">🛍️ 查看商品</button>
                <!-- 暂时隐藏以下按钮
                <button class="btn btn-outline" onclick="navigateTo('deposit')">💰 充值保证金</button>
                <button class="btn btn-outline" onclick="navigateTo('orders')">📦 订单管理</button>
                <button class="btn btn-outline" onclick="navigateTo('finance')">📈 财务对账</button>
                -->
            </div>
        </div>
    `;
}

// 店商供应链入驻管理（已签约后）
// 搜索条件状态
let applySearchMerchantId = '';

function renderSupplyChainApplyManagement() {
    const merchants = DataStore.get('merchants');
    const currentMerchant = DataStore.findById('merchants', currentMerchantId);
    
    // 获取当前商户的所有申请记录
    let myApps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    
    // 根据搜索条件过滤
    if (applySearchMerchantId) {
        myApps = myApps.filter(app => app.merchantId.toLowerCase().includes(applySearchMerchantId.toLowerCase()));
    }
    
    // 获取可以继续申请的商户号（同品牌或当前商户的其他商户号）
    const availableMerchants = merchants.filter(m => {
        // 如果是连锁品牌，可以为同品牌的其他商户号申请
        if (currentMerchant.brandId && m.brandId === currentMerchant.brandId) {
            const apps = DataStore.findBy('applications', 'merchantId', m.id);
            const signed = apps.find(a => a.status === 'signed');
            return !signed && m.miniProgramId;
        }
        // 如果是单店，只能为自己的其他商户号申请（如果有多个的话）
        return false;
    });
    
    return `
        <div class="page-header">
            <h2 class="page-title">入驻管理</h2>
            <span class="breadcrumb">店商供应链 / 入驻管理</span>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">申请记录</h3>
                ${availableMerchants.length > 0 ? `<button class="btn btn-primary" onclick="showNewApplyModal()">+ 申请入驻</button>` : ''}
            </div>
            
            <!-- 搜索条件 -->
            <div style="display: flex; gap: 15px; margin-bottom: 15px; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 14px; color: #666; white-space: nowrap;">商户号：</label>
                    <input type="text" class="form-control" id="searchMerchantId" placeholder="输入商户号搜索" 
                        value="${applySearchMerchantId}" 
                        style="width: 200px;" 
                        onkeyup="if(event.key==='Enter')searchApplyRecords()">
                </div>
                <button class="btn btn-primary btn-sm" onclick="searchApplyRecords()">搜索</button>
                <button class="btn btn-outline btn-sm" onclick="resetApplySearch()">重置</button>
            </div>
            
            <p style="color: #666; margin-bottom: 15px;">
                ${availableMerchants.length > 0 ? 
                    '如果您有其他伊智付商户号（商城小程序绑定）需要入驻店商供应链，可以继续申请。' : 
                    '当前所有商城小程序绑定的商户号均已申请入驻。'
                }
            </p>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商户号</th>
                            <th>商户名称</th>
                            <th>申请人</th>
                            <th>状态</th>
                            <th>申请时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${myApps.length === 0 ? `
                            <tr><td colspan="6" style="text-align: center; color: #999; padding: 40px;">暂无符合条件的申请记录</td></tr>
                        ` : myApps.map(app => {
                            const merchant = DataStore.findById('merchants', app.merchantId);
                            let actionBtns = '';
                            
                            // 判断是否显示分账设置（连锁品牌）
                            const showProfitSetting = app.brandMerchantId;
                            
                            switch(app.status) {
                                case 'pending':
                                    // 待审核：只能查看详情
                                    actionBtns = `<button class="btn btn-link" onclick="viewApplyDetail('${app.id}')">查看详情</button>`;
                                    break;
                                case 'pending_sign':
                                    // 待签约：可以去签署协议
                                    actionBtns = `
                                        <button class="btn btn-primary btn-sm" onclick="goToSignFromManage('${app.id}')">去签署</button>
                                        <button class="btn btn-link" onclick="viewApplyDetail('${app.id}')" style="margin-left: 12px;">详情</button>
                                    `;
                                    break;
                                case 'rejected':
                                    // 已拒绝：可以查看拒绝原因，编辑资料重新提交
                                    actionBtns = `
                                        <button class="btn btn-warning btn-sm" onclick="editAndResubmit('${app.id}')">编辑资料</button>
                                        <button class="btn btn-link" onclick="viewApplyDetail('${app.id}')" style="margin-left: 12px;">查看原因</button>
                                    `;
                                    break;
                                case 'signed':
                                    // 已签约：查看详情
                                    actionBtns = `<button class="btn btn-link" onclick="viewApplyDetail('${app.id}')">查看详情</button>`;
                                    break;
                                default:
                                    actionBtns = `<button class="btn btn-link" onclick="viewApplyDetail('${app.id}')">详情</button>`;
                            }
                            
                            // 添加分账设置按钮（根据权限）
                            if (showProfitSetting) {
                                const permission = getProfitSettingPermission();
                                if (permission === 'edit') {
                                    actionBtns += `<button class="btn btn-link" onclick="showProfitSettingModal('${app.merchantId}', true)" style="margin-left: 12px;">分账设置</button>`;
                                } else if (permission === 'view') {
                                    actionBtns += `<button class="btn btn-link" onclick="showProfitSettingModal('${app.merchantId}', false)" style="margin-left: 12px;">分账设置</button>`;
                                }
                                // permission === 'none' 时不显示按钮
                            }
                            
                            return `
                            <tr>
                                <td>${app.merchantId}</td>
                                <td>${merchant?.name || '-'}</td>
                                <td>${app.applicantName}</td>
                                <td>${getApplyStatusTag(app.status)}</td>
                                <td>${app.createTime}</td>
                                <td style="white-space: nowrap;">${actionBtns}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 搜索申请记录
function searchApplyRecords() {
    applySearchMerchantId = document.getElementById('searchMerchantId')?.value || '';
    renderPage(currentPage);
}

// 重置搜索条件
function resetApplySearch() {
    applySearchMerchantId = '';
    renderPage(currentPage);
}


// 店商供应链商品管理 - 只读查看
function renderSupplyChainGoods() {
    const goods = DataStore.get('goods').filter(g => g.status === 'online');
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const signedApp = apps.find(a => a.status === 'signed');
    const merchantRatio = signedApp?.merchantRatio || 10;
    const brandRatio = signedApp?.brandRatio || 0;
    
    return `
        <div class="page-header">
            <h2 class="page-title">商品管理</h2>
            <span class="breadcrumb">店商供应链 / 商品管理</span>
        </div>
        
        <div class="card" style="margin-bottom: 20px;">
            <p style="color: #666;">
                📌 商品由供应链平台统一管理，您可以查看可销售的商品及您的利润点。
                商品售出后，系统将按照约定比例自动分账。
            </p>
            <p style="color: #666; margin-top: 8px;">
                您的分成比例：商家 ${merchantRatio}% ${brandRatio > 0 ? `（品牌总部分走${brandRatio}%，实际到手${(merchantRatio * (100 - brandRatio) / 100).toFixed(1)}%）` : ''}
            </p>
        </div>
        
        <div class="search-bar">
            <input type="text" class="form-control" placeholder="搜索商品名称/SPU ID..." id="goodsSearch" oninput="filterGoods()">
            <select class="form-control" id="categoryFilter" onchange="filterGoods()">
                <option value="">全部分类</option>
                ${DataStore.get('categories').map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>商品封面</th>
                            <th>SPU商品ID</th>
                            <th>商品名称</th>
                            <th>分类</th>
                            <th>销售价格</th>
                            <th>原价</th>
                            <th>您的预计收益</th>
                            <th>成本价</th>
                            <th>毛利率</th>
                            <th>更新时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="goods-tbody">
                        ${goods.map(item => {
                            // 计算商家实际利润
                            const netPrice = item.salePrice * 0.994; // 扣除0.6%手续费
                            const merchantProfit = netPrice * (merchantRatio / 100);
                            const actualProfit = merchantProfit * (1 - brandRatio / 100);
                            const profitMargin = ((actualProfit / item.salePrice) * 100).toFixed(1);
                            
                            return `
                            <tr data-category="${item.categoryId}" data-name="${item.name.toLowerCase()}" data-spu="${item.id.toLowerCase()}">
                                <td>
                                    <div style="width: 60px; height: 60px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">
                                        封面图
                                    </div>
                                </td>
                                <td>
                                    <span style="font-family: monospace; font-weight: 600; color: #1890ff;">${item.id}</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                                    <div style="font-size: 12px; color: #999;">组合产品 ${item.products.length} 个</div>
                                </td>
                                <td>
                                    <span class="category-tag">${item.category}</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600; color: #ff4d4f; font-size: 16px;">¥${item.salePrice}</div>
                                </td>
                                <td>
                                    <span style="color: #999; text-decoration: line-through;">¥${item.originalPrice}</span>
                                </td>
                                <td>
                                    <div style="font-weight: 600; color: #52c41a; font-size: 16px;">¥${actualProfit.toFixed(2)}</div>
                                    ${brandRatio > 0 ? `<div style="font-size: 11px; color: #999;">（扣除总部${brandRatio}%）</div>` : ''}
                                </td>
                                <td>
                                    <span style="color: #666;">¥${item.costPrice}</span>
                                </td>
                                <td>
                                    <span style="color: ${profitMargin > 15 ? '#52c41a' : profitMargin > 8 ? '#faad14' : '#ff4d4f'}; font-weight: 600;">
                                        ${profitMargin}%
                                    </span>
                                </td>
                                <td>
                                    <span style="font-size: 12px; color: #999;">${item.updateTime}</span>
                                </td>
                                <td>
                                    <button class="btn btn-link" onclick="viewGoodsDetail('${item.id}')">详情</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
            
            ${goods.length === 0 ? `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    <div style="font-size: 16px; margin-bottom: 8px;">暂无可销售商品</div>
                    <div style="font-size: 14px;">供应链平台正在为您准备商品，请稍后查看</div>
                </div>
            ` : ''}
        </div>
    `;
}

// 店商供应链保证金管理
function renderSupplyChainDeposit() {
    const merchant = DataStore.findById('merchants', currentMerchantId);
    const deposit = DataStore.findBy('deposits', 'merchantId', currentMerchantId)[0] || {
        totalDeposit: 0, rechargeCount: 0, availableDeposit: 0, needWithdrawDeposit: 0,
        frozenDeposit: 0, settledDeposit: 0, invoicedAmount: 0, pendingInvoiceAmount: 0
    };
    const logs = DataStore.findBy('depositLogs', 'merchantId', currentMerchantId);
    const invoices = DataStore.findBy('invoices', 'merchantId', currentMerchantId);
    
    return `
        <div class="page-header">
            <h2 class="page-title">保证金管理</h2>
            <span class="breadcrumb">店商供应链 / 保证金管理</span>
        </div>
        
        <div class="deposit-overview">
            <div class="deposit-item">
                <div class="amount">¥${deposit.totalDeposit.toLocaleString()}</div>
                <div class="label">累计充值（${deposit.rechargeCount}次）</div>
            </div>
            <div class="deposit-item available">
                <div class="amount">¥${deposit.availableDeposit.toLocaleString()}</div>
                <div class="label">可使用保证金</div>
            </div>
            <div class="deposit-item frozen">
                <div class="amount">¥${deposit.frozenDeposit.toLocaleString()}</div>
                <div class="label">冻结中保证金</div>
            </div>
            <div class="deposit-item settled">
                <div class="amount">¥${deposit.settledDeposit.toLocaleString()}</div>
                <div class="label">已结算保证金</div>
            </div>
        </div>
        
        ${deposit.needWithdrawDeposit > 0 ? `
        <div class="card" style="border-left: 4px solid #ff4d4f; margin-bottom: 20px;">
            <h4 style="color: #ff4d4f;">⚠️ 需提现保证金：¥${deposit.needWithdrawDeposit.toLocaleString()}</h4>
            <p style="color: #666; margin-top: 8px;">检测到您的营业执照信息已变更，请先提现历史充值的保证金，然后使用新的营业执照信息重新充值。</p>
            <button class="btn btn-danger" style="margin-top: 10px;" onclick="withdrawDeposit()">申请提现</button>
        </div>
        ` : ''}
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">操作</h3></div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="showRechargeModal()">💳 充值保证金</button>
                <button class="btn btn-outline" onclick="showWithdrawModal()">💰 提现保证金</button>
                <button class="btn btn-outline" onclick="showInvoiceList()">📄 发票管理</button>
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <p style="font-size: 13px; color: #666;">
                    <strong>充值说明：</strong>
                    ${merchant.type === 'company' ? 
                        '公司账户仅支持对公银行转账充值' : 
                        '个体户支持微信扫码、支付宝扫码、银行转账充值'
                    }
                </p>
                <p style="font-size: 13px; color: #666; margin-top: 8px;">
                    <strong>开票说明：</strong>已结算的保证金，供应链平台会开具发票给您（待开票：¥${deposit.pendingInvoiceAmount}）
                </p>
            </div>
        </div>
        
        <div class="tabs" style="margin-top: 20px;">
            <div class="tab-item active" onclick="showDepositTab('logs')">资金流水</div>
            <div class="tab-item" onclick="showDepositTab('invoices')">发票记录</div>
        </div>
        
        <div class="card" id="deposit-tab-content">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>流水号</th>
                            <th>类型</th>
                            <th>金额</th>
                            <th>余额</th>
                            <th>关联订单</th>
                            <th>备注</th>
                            <th>时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.id}</td>
                                <td>${getDepositTypeTag(log.type)}</td>
                                <td style="color: ${log.amount > 0 ? '#52c41a' : '#ff4d4f'}; font-weight: 600;">
                                    ${log.amount > 0 ? '+' : ''}¥${Math.abs(log.amount).toFixed(2)}
                                </td>
                                <td>¥${log.balance.toFixed(2)}</td>
                                <td>${log.orderId || '-'}</td>
                                <td>${log.remark}</td>
                                <td>${log.createTime}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 店商供应链订单管理
function renderSupplyChainOrders() {
    const orders = DataStore.findBy('orders', 'merchantId', currentMerchantId);
    
    return `
        <div class="page-header">
            <h2 class="page-title">订单管理</h2>
            <span class="breadcrumb">店商供应链 / 订单管理</span>
        </div>
        
        <div class="tabs">
            <div class="tab-item active" onclick="filterOrders('all')">全部订单 (${orders.length})</div>
            <div class="tab-item" onclick="filterOrders('pending_deposit')">待充值保证金 (${orders.filter(o => o.status === 'pending_deposit').length})</div>
            <div class="tab-item" onclick="filterOrders('pending_ship')">待发货 (${orders.filter(o => o.status === 'pending_ship').length})</div>
            <div class="tab-item" onclick="filterOrders('shipped')">已发货 (${orders.filter(o => o.status === 'shipped').length})</div>
            <div class="tab-item" onclick="filterOrders('completed')">已完成 (${orders.filter(o => o.status === 'completed').length})</div>
        </div>
        
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>商品</th>
                            <th>订单金额</th>
                            <th>微信支付</th>
                            <th>其他支付</th>
                            <th>需充保证金</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="orders-tbody">
                        ${orders.map(order => `
                            <tr data-status="${order.status}">
                                <td>${order.id}</td>
                                <td>${order.goodsName} x${order.quantity}</td>
                                <td>¥${order.totalAmount}</td>
                                <td>¥${order.wxPayAmount}</td>
                                <td>¥${order.otherPayAmount}</td>
                                <td>
                                    ${order.needDeposit > 0 ? 
                                        `<span style="color: #ff4d4f; font-weight: 600;">¥${order.needDeposit.toFixed(2)}</span>` : 
                                        '<span style="color: #52c41a;">-</span>'
                                    }
                                </td>
                                <td>${getOrderStatusTag(order.status)}</td>
                                <td>${order.createTime}</td>
                                <td>
                                    ${order.status === 'pending_deposit' ? 
                                        `<button class="btn btn-warning btn-sm" onclick="payOrderDeposit('${order.id}', ${order.needDeposit})">充值保证金</button>` : ''
                                    }
                                    <button class="btn btn-link" onclick="viewOrderDetail('${order.id}')">详情</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// 店商供应链财务对账
function renderSupplyChainFinance() {
    const orders = DataStore.findBy('orders', 'merchantId', currentMerchantId);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalSales = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalProfit = completedOrders.reduce((sum, o) => sum + o.merchantActualProfit, 0);
    const totalFee = completedOrders.reduce((sum, o) => sum + o.fee, 0);
    
    return `
        <div class="page-header">
            <h2 class="page-title">财务对账</h2>
            <span class="breadcrumb">店商供应链 / 财务对账</span>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">已结算销售额</div>
                <div class="value">¥${totalSales.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="label">已结算收益</div>
                <div class="value" style="color: #52c41a;">¥${totalProfit.toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="label">累计手续费</div>
                <div class="value">¥${totalFee.toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="label">已结算订单</div>
                <div class="value">${completedOrders.length}</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><h3 class="card-title">结算明细</h3></div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>商品</th>
                            <th>订单金额</th>
                            <th>手续费</th>
                            <th>商家收益</th>
                            <th>品牌总部</th>
                            <th>实际到账</th>
                            <th>完成时间</th>
                            <th>结算时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${completedOrders.map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.goodsName}</td>
                                <td>¥${order.totalAmount}</td>
                                <td>¥${order.fee.toFixed(2)}</td>
                                <td>¥${order.merchantProfit.toFixed(2)}</td>
                                <td>${order.brandProfit > 0 ? `¥${order.brandProfit.toFixed(2)}` : '-'}</td>
                                <td style="color: #52c41a; font-weight: 600;">¥${order.merchantActualProfit.toFixed(2)}</td>
                                <td>${order.completeTime || '-'}</td>
                                <td>${order.settleTime || '待结算(T+7)'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


// 辅助函数
function getApplyStatusTag(status) {
    const map = {
        'pending': '<span class="status-tag status-pending">待审核</span>',
        'pending_sign': '<span class="status-tag status-info">待签署协议</span>',
        'signed': '<span class="status-tag status-success">已合作</span>',
        'rejected': '<span class="status-tag status-danger">已拒绝</span>',
        'need_maintain': '<span class="status-tag status-warning">待重新维护</span>'
    };
    return map[status] || status;
}

function getOrderStatusTag(status) {
    const map = {
        'pending_deposit': '<span class="status-tag status-danger">待充值保证金</span>',
        'pending_ship': '<span class="status-tag status-info">待发货</span>',
        'shipped': '<span class="status-tag status-info">已发货</span>',
        'completed': '<span class="status-tag status-success">已完成</span>'
    };
    return map[status] || status;
}

function getDepositTypeTag(type) {
    const map = {
        'recharge': '<span class="status-tag status-success">充值</span>',
        'freeze': '<span class="status-tag status-warning">冻结</span>',
        'unfreeze': '<span class="status-tag status-info">解冻</span>',
        'settle': '<span class="status-tag status-info">结算</span>',
        'withdraw': '<span class="status-tag status-default">提现</span>'
    };
    return map[type] || type;
}

function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    currentPage = page;
    
    // 如果导航到主系统页面，退出应用模式
    if (['marketing-apps', 'dashboard', 'merchant-info', 'settings'].includes(page)) {
        if (currentApp) {
            exitSupplyChainApp();
            return;
        }
    }
    
    renderPage(page);
}

// 弹窗
function openModal(title, body, footer = '', size = 'normal') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    
    const modal = document.querySelector('.modal');
    if (modal) {
        // 根据size参数设置弹窗宽度
        if (size === 'large') {
            modal.style.maxWidth = '800px';
        } else {
            modal.style.maxWidth = '600px';
        }
    }
    
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// 业务操作
function submitApplication(e) {
    e.preventDefault();
    const merchantId = document.getElementById('merchantId').value;
    const applicantName = document.getElementById('applicantName').value;
    const applicantPhone = document.getElementById('applicantPhone').value;
    const brandMerchantId = document.getElementById('brandMerchantId')?.value || null;
    const brandRatio = parseInt(document.getElementById('brandRatio')?.value) || 0;
    const profitReceiverId = document.getElementById('profitReceiver')?.value || null;
    const receiverRemarkText = document.getElementById('receiverRemarkText')?.value || '';
    
    const merchant = DataStore.findById('merchants', merchantId);
    
    if (!merchant.hasSubAccount) {
        showToast('该商户号未开通分账功能，请先联系经销商开通', 'error');
        return;
    }
    
    if (!merchant.scope.includes('化妆品')) {
        showToast('营业执照经营范围不符合要求，需包含"化妆品"相关经营范围', 'error');
        return;
    }
    
    // 如果设置了品牌总部分成，必须选择分账接收方
    if (brandMerchantId && brandRatio > 0 && !profitReceiverId) {
        showToast('请选择分账接收方或添加新的分账接收方', 'warning');
        return;
    }
    
    const contracts = [
        { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
        { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
    ];
    if (brandMerchantId && brandRatio > 0) {
        contracts.push({ type: 'brand', name: '店商供应链合作协议-品牌总部', signed: false, signTime: null });
    }
    
    const newApp = {
        id: 'APP' + Date.now().toString().slice(-9),
        merchantId,
        applicantName,
        applicantPhone,
        brandMerchantId,
        brandRatio,
        profitReceiverId, // 选择的分账接收方ID
        receiverRemark: receiverRemarkText, // 备注说明
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        signTime: null,
        merchantRatioRange: null,
        platformRatioRange: null,
        operationRatioRange: null,
        merchantRatio: null,
        platformRatio: null,
        operationRatio: null,
        auditor: null,
        auditRemark: null,
        contracts
    };
    
    DataStore.add('applications', newApp);
    
    // 如果有待提交的分账接收方申请，一起提交
    const pendingReceiver = sessionStorage.getItem('pendingReceiverApplication');
    if (pendingReceiver && profitReceiverId === 'pending') {
        const receiverData = JSON.parse(pendingReceiver);
        receiverData.applicationId = newApp.id; // 关联到入驻申请
        DataStore.add('profitReceiverApplications', receiverData);
        sessionStorage.removeItem('pendingReceiverApplication');
        
        // 更新申请记录，标记有分账接收方申请
        newApp.hasPendingReceiverApplication = true;
        newApp.pendingReceiverApplicationId = receiverData.id;
        DataStore.update('applications', newApp.id, newApp);
    }
    
    currentMerchantId = merchantId;
    showToast('申请提交成功，请等待平台审核', 'success');
    
    // 立即刷新状态，显示申请记录
    setTimeout(() => {
        checkSupplyChainStatus();
    }, 100);
}

function signSingleContract(appId, contractIndex) {
    const app = DataStore.findById('applications', appId);
    const contract = app.contracts[contractIndex];
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    // 获取协议内容
    let contractContent = '';
    if (contract.type === 'dropship' || contract.type === 'platform') {
        contractContent = getDropshipContractContent(merchant, app);
    } else if (contract.type === 'operation') {
        contractContent = getOperationContractContent(merchant, app);
    } else if (contract.type === 'brand') {
        contractContent = getBrandContractContent(merchant, app);
    }
    
    // 记录打开时间
    const openTime = new Date().toISOString();
    
    openModal(contract.name, `
        <div id="contract-sign-container">
            <div style="padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591; margin-bottom: 15px;">
                <p style="color: #d46b08; font-size: 13px;">
                    📌 请仔细阅读协议内容，滚动到底部后需阅读至少10秒才能签署
                </p>
            </div>
            
            <div id="contract-content" style="height: 400px; overflow-y: auto; border: 1px solid #e8e8e8; border-radius: 8px; padding: 20px; background: #fafafa; font-size: 14px; line-height: 1.8;">
                ${contractContent}
            </div>
            
            <div id="scroll-tip" style="text-align: center; padding: 15px; color: #ff4d4f; font-weight: 600;">
                ⬇️ 请滚动到底部阅读完整协议
            </div>
            
            <div id="read-timer" style="display: none; text-align: center; padding: 15px;">
                <span style="color: #1890ff; font-weight: 600;">阅读倒计时：<span id="countdown">10</span> 秒</span>
            </div>
            
            <div style="margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" id="agree-checkbox" disabled style="margin-right: 10px; width: 18px; height: 18px;">
                    <span style="font-size: 14px;">我已阅读并同意以上协议内容</span>
                </label>
            </div>
        </div>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" id="sign-btn" disabled onclick="confirmSignContract('${appId}', ${contractIndex}, '${openTime}')">已阅读并确认签署</button>
    `);
    
    // 初始化滚动监听和计时器
    setTimeout(() => {
        initContractScrollListener(appId, contractIndex);
    }, 100);
}

// 获取一件代发协议内容
function getDropshipContractContent(merchant, app) {
    return `
        <h2 style="text-align: center; margin-bottom: 20px;">一件代发协议</h2>
        
        <p><strong>甲方（供应商）：</strong>伊智贸易有限公司</p>
        <p><strong>乙方（商户）：</strong>${merchant.companyName}</p>
        <p><strong>签订日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
        
        <h3 style="margin-top: 20px;">第一条 合作内容</h3>
        <p>1.1 甲方为乙方提供商品一件代发服务，包括但不限于商品存储、包装、发货等。</p>
        <p>1.2 乙方通过甲方提供的平台系统进行商品销售，甲方负责商品的仓储和物流配送。</p>
        <p>1.3 双方同意按照本协议约定的分成比例进行收益分配。</p>
        
        <h3 style="margin-top: 20px;">第二条 商品管理</h3>
        <p>2.1 甲方负责商品的质量把控，确保所有商品符合国家相关标准。</p>
        <p>2.2 甲方应保证商品库存充足，及时更新库存信息。</p>
        <p>2.3 乙方有权查看商品详情、库存状态及物流信息。</p>
        
        <h3 style="margin-top: 20px;">第三条 订单处理</h3>
        <p>3.1 乙方收到消费者订单后，系统自动同步至甲方。</p>
        <p>3.2 甲方应在收到订单后48小时内完成发货。</p>
        <p>3.3 物流费用由甲方承担，包含在商品成本中。</p>
        
        <h3 style="margin-top: 20px;">第四条 收益分配</h3>
        <p>4.1 商家收益比例：${app.merchantRatioRange || '8-15'}%</p>
        <p>4.2 供应链平台收益比例：${app.platformRatioRange || '65-72'}%</p>
        <p>4.3 收益结算周期为T+7，即订单完成后7个工作日内结算。</p>
        
        <h3 style="margin-top: 20px;">第五条 售后服务</h3>
        <p>5.1 商品质量问题由甲方负责处理退换货。</p>
        <p>5.2 非质量问题的退换货，运费由消费者承担。</p>
        <p>5.3 售后处理时效为收到退货后3个工作日内。</p>
        
        <h3 style="margin-top: 20px;">第六条 保密条款</h3>
        <p>6.1 双方应对合作过程中知悉的商业秘密予以保密。</p>
        <p>6.2 未经对方书面同意，不得向第三方披露相关信息。</p>
        
        <h3 style="margin-top: 20px;">第七条 协议期限</h3>
        <p>7.1 本协议自签署之日起生效，有效期一年。</p>
        <p>7.2 协议到期前30日，如双方无异议，自动续期一年。</p>
        
        <h3 style="margin-top: 20px;">第八条 违约责任</h3>
        <p>8.1 任何一方违反本协议约定，应承担相应的违约责任。</p>
        <p>8.2 因违约给对方造成损失的，应予以赔偿。</p>
        
        <h3 style="margin-top: 20px;">第九条 争议解决</h3>
        <p>9.1 本协议的解释和执行适用中华人民共和国法律。</p>
        <p>9.2 因本协议产生的争议，双方应友好协商解决。</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8e8e8;">
            <p style="color: #999; font-size: 12px;">【协议结束】请确认您已阅读并理解以上全部内容</p>
        </div>
    `;
}

// 获取私域运营协议内容
function getOperationContractContent(merchant, app) {
    return `
        <h2 style="text-align: center; margin-bottom: 20px;">私域运营协议</h2>
        
        <p><strong>甲方（运营平台）：</strong>私域运营服务平台</p>
        <p><strong>乙方（商户）：</strong>${merchant.companyName}</p>
        <p><strong>签订日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
        
        <h3 style="margin-top: 20px;">第一条 服务内容</h3>
        <p>1.1 甲方为乙方提供私域流量运营服务，包括但不限于用户管理、营销推广、数据分析等。</p>
        <p>1.2 甲方提供技术平台支持，帮助乙方建立和维护私域用户池。</p>
        <p>1.3 甲方提供营销工具和活动模板，协助乙方开展促销活动。</p>
        
        <h3 style="margin-top: 20px;">第二条 用户数据</h3>
        <p>2.1 乙方的用户数据归乙方所有，甲方仅在提供服务范围内使用。</p>
        <p>2.2 甲方应采取必要措施保护用户数据安全。</p>
        <p>2.3 未经乙方同意，甲方不得将用户数据用于其他目的。</p>
        
        <h3 style="margin-top: 20px;">第三条 营销服务</h3>
        <p>3.1 甲方提供多种营销工具，包括优惠券、满减活动、会员积分等。</p>
        <p>3.2 甲方协助乙方制定营销策略，提供数据分析报告。</p>
        <p>3.3 营销活动的具体方案由乙方确认后执行。</p>
        
        <h3 style="margin-top: 20px;">第四条 收益分配</h3>
        <p>4.1 私域运营平台收益比例：${app.operationRatioRange || '18-22'}%</p>
        <p>4.2 收益按订单实际成交金额计算。</p>
        <p>4.3 结算周期与一件代发协议保持一致。</p>
        
        <h3 style="margin-top: 20px;">第五条 技术支持</h3>
        <p>5.1 甲方提供7x24小时技术支持服务。</p>
        <p>5.2 系统故障应在4小时内响应，24小时内解决。</p>
        <p>5.3 甲方定期进行系统升级和功能优化。</p>
        
        <h3 style="margin-top: 20px;">第六条 培训服务</h3>
        <p>6.1 甲方为乙方提供平台使用培训。</p>
        <p>6.2 甲方定期举办运营技巧分享会。</p>
        <p>6.3 培训服务包含在服务费用中，不另行收费。</p>
        
        <h3 style="margin-top: 20px;">第七条 保密义务</h3>
        <p>7.1 双方应对合作中获取的商业信息严格保密。</p>
        <p>7.2 保密义务在协议终止后仍然有效。</p>
        
        <h3 style="margin-top: 20px;">第八条 协议变更</h3>
        <p>8.1 本协议的修改需经双方书面同意。</p>
        <p>8.2 甲方调整服务内容应提前30日通知乙方。</p>
        
        <h3 style="margin-top: 20px;">第九条 终止条款</h3>
        <p>9.1 任何一方可提前30日书面通知对方终止协议。</p>
        <p>9.2 协议终止后，双方应完成未结算的款项清算。</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8e8e8;">
            <p style="color: #999; font-size: 12px;">【协议结束】请确认您已阅读并理解以上全部内容</p>
        </div>
    `;
}

// 获取品牌总部协议内容
function getBrandContractContent(merchant, app) {
    return `
        <h2 style="text-align: center; margin-bottom: 20px;">品牌总部分成协议</h2>
        
        <p><strong>甲方（品牌总部）：</strong>美丽集团总部</p>
        <p><strong>乙方（加盟商户）：</strong>${merchant.companyName}</p>
        <p><strong>签订日期：</strong>${new Date().toLocaleDateString('zh-CN')}</p>
        
        <h3 style="margin-top: 20px;">第一条 分成约定</h3>
        <p>1.1 乙方同意将商家收益的${app.brandRatio || 10}%分配给甲方。</p>
        <p>1.2 分成基数为乙方在店商供应链平台的实际收益。</p>
        <p>1.3 分成通过平台自动结算，无需乙方手动操作。</p>
        
        <h3 style="margin-top: 20px;">第二条 品牌支持</h3>
        <p>2.1 甲方为乙方提供品牌授权和形象支持。</p>
        <p>2.2 甲方提供统一的营销物料和活动支持。</p>
        <p>2.3 甲方协助乙方进行市场推广和客户引流。</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8e8e8;">
            <p style="color: #999; font-size: 12px;">【协议结束】请确认您已阅读并理解以上全部内容</p>
        </div>
    `;
}

// 初始化协议滚动监听
function initContractScrollListener(appId, contractIndex) {
    const container = document.getElementById('contract-content');
    const scrollTip = document.getElementById('scroll-tip');
    const readTimer = document.getElementById('read-timer');
    const checkbox = document.getElementById('agree-checkbox');
    const signBtn = document.getElementById('sign-btn');
    
    let hasScrolledToBottom = false;
    let countdownStarted = false;
    let countdown = 10;
    
    container.addEventListener('scroll', function() {
        // 检查是否滚动到底部（允许5px误差）
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 5;
        
        if (isAtBottom && !hasScrolledToBottom) {
            hasScrolledToBottom = true;
            scrollTip.style.display = 'none';
            readTimer.style.display = 'block';
            
            // 开始10秒倒计时
            if (!countdownStarted) {
                countdownStarted = true;
                const countdownEl = document.getElementById('countdown');
                
                const timer = setInterval(() => {
                    countdown--;
                    countdownEl.textContent = countdown;
                    
                    if (countdown <= 0) {
                        clearInterval(timer);
                        readTimer.innerHTML = '<span style="color: #52c41a; font-weight: 600;">✓ 阅读完成，可以签署协议</span>';
                        checkbox.disabled = false;
                    }
                }, 1000);
            }
        }
    });
    
    // 复选框变化监听
    checkbox.addEventListener('change', function() {
        signBtn.disabled = !this.checked;
    });
}

// 确认签署协议
function confirmSignContract(appId, contractIndex, openTime) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    const contract = app.contracts[contractIndex];
    
    const signTime = new Date().toISOString();
    const openTimeDate = new Date(openTime);
    const signTimeDate = new Date(signTime);
    const readDuration = Math.round((signTimeDate - openTimeDate) / 1000);
    
    // 更新协议签署信息
    app.contracts[contractIndex] = {
        ...contract,
        signed: true,
        signTime: new Date().toLocaleString('zh-CN'),
        signerAccount: app.loginAccount || merchant.contactName + '@merchant.com',
        signerPhone: app.loginPhone || merchant.contactPhone,
        readDuration: readDuration,
        openTime: openTime,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255), // 模拟IP
        deviceInfo: navigator.userAgent.substring(0, 50) + '...' // 设备信息
    };
    
    DataStore.update('applications', appId, { contracts: app.contracts });
    
    closeModal();
    showToast('协议签署成功', 'success');
    renderPage(currentPage);
}

function completeSign(appId) {
    const app = DataStore.findById('applications', appId);
    DataStore.update('applications', appId, {
        status: 'signed',
        signTime: new Date().toLocaleString('zh-CN')
    });
    
    // 初始化保证金账户
    const existingDeposit = DataStore.findBy('deposits', 'merchantId', app.merchantId)[0];
    if (!existingDeposit) {
        DataStore.add('deposits', {
            id: 'DEP' + Date.now().toString().slice(-9),
            merchantId: app.merchantId,
            totalDeposit: 0,
            rechargeCount: 0,
            availableDeposit: 0,
            needWithdrawDeposit: 0,
            frozenDeposit: 0,
            settledDeposit: 0,
            invoicedAmount: 0,
            pendingInvoiceAmount: 0
        });
    }
    
    showToast('🎉 恭喜！协议签署成功，您已成功入驻店商供应链', 'success');
    checkSupplyChainStatus();
}

function showRechargeModal() {
    const merchant = DataStore.findById('merchants', currentMerchantId);
    const isCompany = merchant?.type === 'company';
    
    openModal('充值保证金', `
        <div class="form-group">
            <label class="form-label">充值金额（元）</label>
            <input type="number" class="form-control" id="rechargeAmount" placeholder="请输入充值金额" min="100">
        </div>
        <div class="form-group">
            <label class="form-label">支付方式</label>
            ${isCompany ? `
                <div class="pay-methods">
                    <div class="pay-method selected" data-method="bank">
                        <div class="icon">🏦</div>
                        <div class="name">对公银行转账</div>
                    </div>
                </div>
                <div style="padding: 15px; background: #f9f9f9; border-radius: 8px; margin-top: 15px;">
                    <p style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">收款账户信息：</p>
                    <p><strong>户名：</strong>伊智贸易有限公司</p>
                    <p><strong>开户行：</strong>中国工商银行广州天河支行</p>
                    <p><strong>账号：</strong>6222 0236 0123 4567 890</p>
                    <p style="color: #ff4d4f; margin-top: 10px; font-size: 13px;">* 请使用申请伊智付商户号的对公账户转账</p>
                </div>
            ` : `
                <div class="pay-methods">
                    <div class="pay-method selected" data-method="wechat" onclick="selectPayMethod(this)">
                        <div class="icon">💚</div>
                        <div class="name">微信扫码</div>
                    </div>
                    <div class="pay-method" data-method="alipay" onclick="selectPayMethod(this)">
                        <div class="icon">💙</div>
                        <div class="name">支付宝扫码</div>
                    </div>
                    <div class="pay-method" data-method="bank" onclick="selectPayMethod(this)">
                        <div class="icon">🏦</div>
                        <div class="name">银行转账</div>
                    </div>
                </div>
            `}
        </div>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="confirmRecharge()">确认充值</button>
    `);
}

function selectPayMethod(el) {
    document.querySelectorAll('.pay-method').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
}

function confirmRecharge() {
    const amount = parseFloat(document.getElementById('rechargeAmount').value);
    if (!amount || amount < 100) {
        showToast('充值金额不能少于100元', 'error');
        return;
    }
    
    let deposit = DataStore.findBy('deposits', 'merchantId', currentMerchantId)[0];
    if (!deposit) {
        deposit = {
            id: 'DEP' + Date.now().toString().slice(-9),
            merchantId: currentMerchantId,
            totalDeposit: 0,
            rechargeCount: 0,
            availableDeposit: 0,
            needWithdrawDeposit: 0,
            frozenDeposit: 0,
            settledDeposit: 0,
            invoicedAmount: 0,
            pendingInvoiceAmount: 0
        };
        DataStore.add('deposits', deposit);
    }
    
    DataStore.update('deposits', deposit.id, {
        totalDeposit: deposit.totalDeposit + amount,
        rechargeCount: deposit.rechargeCount + 1,
        availableDeposit: deposit.availableDeposit + amount
    });
    
    DataStore.add('depositLogs', {
        id: 'DEPLOG' + Date.now().toString().slice(-9),
        merchantId: currentMerchantId,
        type: 'recharge',
        amount: amount,
        balance: deposit.availableDeposit + amount,
        orderId: null,
        remark: '保证金充值',
        payMethod: 'bank',
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast(`充值成功！已充值 ¥${amount}`, 'success');
    renderPage('deposit');
}

function payOrderDeposit(orderId, amount) {
    const deposit = DataStore.findBy('deposits', 'merchantId', currentMerchantId)[0];
    
    if (!deposit || deposit.availableDeposit < amount) {
        showToast(`可用保证金不足，需要 ¥${amount.toFixed(2)}，当前可用 ¥${(deposit?.availableDeposit || 0).toFixed(2)}`, 'error');
        showRechargeModal();
        return;
    }
    
    DataStore.update('deposits', deposit.id, {
        availableDeposit: deposit.availableDeposit - amount,
        frozenDeposit: deposit.frozenDeposit + amount
    });
    
    DataStore.update('orders', orderId, {
        status: 'pending_ship',
        depositPaid: true,
        canShip: true,
        depositPayTime: new Date().toLocaleString('zh-CN')
    });
    
    DataStore.add('depositLogs', {
        id: 'DEPLOG' + Date.now().toString().slice(-9),
        merchantId: currentMerchantId,
        type: 'freeze',
        amount: -amount,
        balance: deposit.availableDeposit - amount,
        orderId: orderId,
        remark: `订单${orderId}保证金冻结`,
        payMethod: null,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('保证金支付成功，订单已变为可发货状态', 'success');
    renderPage('orders');
}

function viewOrderDetail(orderId) {
    const order = DataStore.findById('orders', orderId);
    openModal('订单详情', `
        <div class="detail-list">
            <div class="detail-item"><span class="label">订单号</span><span class="value">${order.id}</span></div>
            <div class="detail-item"><span class="label">商品</span><span class="value">${order.goodsName} x${order.quantity}</span></div>
            <div class="detail-item"><span class="label">订单金额</span><span class="value">¥${order.totalAmount}</span></div>
            <div class="detail-item"><span class="label">微信支付</span><span class="value">¥${order.wxPayAmount}</span></div>
            <div class="detail-item"><span class="label">其他支付</span><span class="value">¥${order.otherPayAmount}</span></div>
            <div class="detail-item"><span class="label">手续费</span><span class="value">¥${order.fee}</span></div>
            <div class="detail-item"><span class="label">状态</span><span class="value">${getOrderStatusTag(order.status)}</span></div>
            <div class="detail-item"><span class="label">消费者</span><span class="value">${order.customerName}</span></div>
            <div class="detail-item"><span class="label">创建时间</span><span class="value">${order.createTime}</span></div>
        </div>
        <h4 style="margin: 20px 0 10px;">分润明细</h4>
        <div class="table-container">
            <table>
                <tr><td>商家收益</td><td>¥${order.merchantProfit.toFixed(2)}</td></tr>
                ${order.brandProfit > 0 ? `<tr><td>品牌总部</td><td>¥${order.brandProfit.toFixed(2)}</td></tr>` : ''}
                <tr><td>商家实际到账</td><td style="color:#52c41a;font-weight:600;">¥${order.merchantActualProfit.toFixed(2)}</td></tr>
                <tr><td>私域运营平台</td><td>¥${order.operationProfit.toFixed(2)}</td></tr>
                <tr><td>供应链平台</td><td>¥${order.platformProfit.toFixed(2)}</td></tr>
            </table>
        </div>
        ${order.needDeposit > 0 ? `
        <div style="margin-top: 15px; padding: 15px; background: #fff7e6; border-radius: 8px;">
            <p style="color: #d46b08;"><strong>需充值保证金：¥${order.needDeposit.toFixed(2)}</strong></p>
            <p style="font-size: 13px; color: #666; margin-top: 5px;">消费者微信支付金额不足以完成分账，需要您充值保证金后才能发货。</p>
        </div>
        ` : ''}
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

function viewApplyDetail(appId) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    let statusContent = '';
    let contractsContent = '';
    
    // 根据状态显示不同内容
    if (app.status === 'rejected') {
        statusContent = `
            <div style="padding: 15px; background: #fff2f0; border-radius: 8px; border: 1px solid #ffccc7; margin-top: 15px;">
                <p style="color: #ff4d4f; font-weight: 600; margin-bottom: 8px;">❌ 拒绝原因：</p>
                <p style="color: #666;">您申请的商户号营业执照的经营范围还未更新，请您按申请入驻时提醒你要的经营范围去工商进行变更，变更成功后再进行提交。</p>
            </div>
        `;
    } else if (app.status === 'pending') {
        statusContent = `
            <div style="padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591; margin-top: 15px;">
                <p style="color: #d46b08; font-weight: 600;">⏳ 申请正在审核中</p>
                <p style="color: #666; margin-top: 8px;">预计1-3个工作日内完成审核，请耐心等待。</p>
            </div>
        `;
    } else if (app.status === 'pending_sign') {
        statusContent = `
            <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; border: 1px solid #91d5ff; margin-top: 15px;">
                <p style="color: #1890ff; font-weight: 600;">✓ 审核已通过，请尽快签署协议</p>
                <p style="color: #666; margin-top: 8px;">审核备注：${app.auditRemark || '无'}</p>
            </div>
        `;
    } else if (app.status === 'signed') {
        statusContent = `
            <div style="padding: 15px; background: #f6ffed; border-radius: 8px; border: 1px solid #b7eb8f; margin-top: 15px;">
                <p style="color: #52c41a; font-weight: 600;">✓ 已签约合作</p>
                <p style="color: #666; margin-top: 8px;">签约时间：${app.signTime}</p>
            </div>
        `;
    }
    
    // 显示协议签署记录
    if (app.contracts && app.contracts.length > 0) {
        contractsContent = `
            <div style="margin-top: 20px;">
                <h4 style="margin-bottom: 10px; color: #333;">协议签署记录</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>协议名称</th><th>签署状态</th><th>签署时间</th></tr>
                        </thead>
                        <tbody>
                            ${app.contracts.map(c => `
                                <tr>
                                    <td>${c.name}</td>
                                    <td>${c.signed ? '<span style="color: #52c41a;">✓ 已签署</span>' : '<span style="color: #999;">未签署</span>'}</td>
                                    <td>${c.signTime || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    openModal('申请详情', `
        <div class="detail-list">
            <div class="detail-item"><span class="label">商户号</span><span class="value">${app.merchantId}</span></div>
            <div class="detail-item"><span class="label">商户名称</span><span class="value">${merchant?.name || '-'}</span></div>
            <div class="detail-item"><span class="label">营业执照</span><span class="value">${merchant?.companyName || '-'}</span></div>
            <div class="detail-item"><span class="label">申请人</span><span class="value">${app.applicantName} / ${app.applicantPhone}</span></div>
            <div class="detail-item"><span class="label">状态</span><span class="value">${getApplyStatusTag(app.status)}</span></div>
            <div class="detail-item"><span class="label">申请时间</span><span class="value">${app.createTime}</span></div>
            ${app.auditTime ? `<div class="detail-item"><span class="label">审核时间</span><span class="value">${app.auditTime}</span></div>` : ''}
            ${app.auditor ? `<div class="detail-item"><span class="label">审核人</span><span class="value">${app.auditor}</span></div>` : ''}
        </div>
        ${statusContent}
        ${contractsContent}
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

function filterOrders(status) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('#orders-tbody tr').forEach(tr => {
        tr.style.display = (status === 'all' || tr.dataset.status === status) ? '' : 'none';
    });
}

function filterGoods() {
    const search = document.getElementById('goodsSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    document.querySelectorAll('#goods-tbody tr').forEach(row => {
        const name = row.dataset.name || '';
        const spuId = row.dataset.spu || '';
        const rowCategory = row.dataset.category;
        const matchSearch = name.includes(search) || spuId.includes(search);
        const matchCategory = !category || rowCategory === category;
        row.style.display = (matchSearch && matchCategory) ? '' : 'none';
    });
}

function viewGoodsDetail(goodsId) {
    const goods = DataStore.findById('goods', goodsId);
    const apps = DataStore.findBy('applications', 'merchantId', currentMerchantId);
    const signedApp = apps.find(a => a.status === 'signed');
    const merchantRatio = signedApp?.merchantRatio || 10;
    const brandRatio = signedApp?.brandRatio || 0;
    
    // 计算收益详情
    const netPrice = goods.salePrice * 0.994; // 扣除0.6%手续费
    const merchantProfit = netPrice * (merchantRatio / 100);
    const actualProfit = merchantProfit * (1 - brandRatio / 100);
    const brandProfit = merchantProfit * (brandRatio / 100);
    const platformProfit = netPrice * 0.7; // 假设平台70%
    const operationProfit = netPrice * 0.2; // 假设运营20%
    
    openModal('商品详情', `
        <div class="goods-detail">
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="width: 120px; height: 120px; background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 14px;">
                    封面图
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; color: #333;">${goods.name}</h3>
                    <p style="margin: 4px 0; color: #666;"><strong>SPU ID:</strong> ${goods.id}</p>
                    <p style="margin: 4px 0; color: #666;"><strong>分类:</strong> ${goods.category}</p>
                    <p style="margin: 4px 0; color: #666;"><strong>发货方式:</strong> ${goods.deliveryMethod}</p>
                    <p style="margin: 4px 0; color: #666;"><strong>更新时间:</strong> ${goods.updateTime}</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4 style="margin-bottom: 10px; color: #333;">价格信息</h4>
                    <div class="detail-list">
                        <div class="detail-item"><span class="label">销售价格</span><span class="value" style="color: #ff4d4f; font-weight: 600;">¥${goods.salePrice}</span></div>
                        <div class="detail-item"><span class="label">商城原价</span><span class="value" style="color: #999;">¥${goods.originalPrice}</span></div>
                        <div class="detail-item"><span class="label">成本价格</span><span class="value">¥${goods.costPrice}</span></div>
                        <div class="detail-item"><span class="label">毛利率</span><span class="value">${(((goods.salePrice - goods.costPrice) / goods.salePrice) * 100).toFixed(1)}%</span></div>
                    </div>
                </div>
                
                <div>
                    <h4 style="margin-bottom: 10px; color: #333;">您的收益分析</h4>
                    <div class="detail-list">
                        <div class="detail-item"><span class="label">扣除手续费后</span><span class="value">¥${netPrice.toFixed(2)}</span></div>
                        <div class="detail-item"><span class="label">商家总收益</span><span class="value">¥${merchantProfit.toFixed(2)} (${merchantRatio}%)</span></div>
                        ${brandRatio > 0 ? `<div class="detail-item"><span class="label">品牌总部分成</span><span class="value" style="color: #faad14;">¥${brandProfit.toFixed(2)} (${brandRatio}%)</span></div>` : ''}
                        <div class="detail-item"><span class="label">您的实际收益</span><span class="value" style="color: #52c41a; font-weight: 600;">¥${actualProfit.toFixed(2)}</span></div>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px; color: #333;">组合产品明细</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>产品ID</th><th>产品名称</th><th>数量</th><th>单价</th><th>小计</th></tr>
                        </thead>
                        <tbody>
                            ${goods.products.map(p => `
                                <tr>
                                    <td>${p.productId}</td>
                                    <td>${p.productName}</td>
                                    <td>${p.quantity}</td>
                                    <td>¥${p.lockedPrice}</td>
                                    <td>¥${(p.quantity * p.lockedPrice).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px; color: #333;">分账明细预览</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>分账方</th><th>分账金额</th><th>分账比例</th><th>说明</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>您（商家）</td>
                                <td style="color: #52c41a; font-weight: 600;">¥${actualProfit.toFixed(2)}</td>
                                <td>${merchantRatio}%</td>
                                <td>${brandRatio > 0 ? `扣除品牌总部${brandRatio}%后` : '直接到账'}</td>
                            </tr>
                            ${brandRatio > 0 ? `
                            <tr>
                                <td>品牌总部</td>
                                <td style="color: #faad14; font-weight: 600;">¥${brandProfit.toFixed(2)}</td>
                                <td>${brandRatio}%</td>
                                <td>占商家收益比例</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <td>供应链平台</td>
                                <td>¥${platformProfit.toFixed(2)}</td>
                                <td>70%</td>
                                <td>负责发货和售后</td>
                            </tr>
                            <tr>
                                <td>私域运营平台</td>
                                <td>¥${operationProfit.toFixed(2)}</td>
                                <td>20%</td>
                                <td>提供运营服务</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style="padding: 15px; background: #f6ffed; border-radius: 8px; border: 1px solid #b7eb8f;">
                <p style="margin: 0; color: #52c41a; font-size: 14px;">
                    <strong>💡 温馨提示：</strong>
                    以上收益为预估值，实际收益以订单完成后的分账结算为准。消费者使用不同支付方式可能影响实际分账金额。
                </p>
            </div>
        </div>
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

function goToSign(appId) {
    const app = DataStore.findById('applications', appId);
    currentMerchantId = app.merchantId;
    checkMerchantStatus();
}

function goToSignFromManage(appId) {
    const app = DataStore.findById('applications', appId);
    currentMerchantId = app.merchantId;
    // 直接打开签署协议弹窗
    openContractSignModal(appId);
}

// 编辑资料并重新提交（针对被拒绝的申请）
function editAndResubmit(appId) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    // 检查是否是连锁商户
    const isChain = merchant?.brandId || app.brandMerchantId;
    
    // 获取当前的分账设置（支持多个商户号）
    const currentProfitSettings = app.profitSettings || [];
    
    let profitSettingsSection = '';
    if (isChain && app.brandMerchantId) {
        const brandMerchant = DataStore.findById('merchants', app.brandMerchantId);
        
        // 不再显示选择商户号和商户号管理表格
        profitSettingsSection = '';
        
        // 清空全局变量
        window.editBrandMerchants = [];
        window.editCurrentProfitSettings = [];
    }
    
    openModal('编辑资料并重新提交', `
        <div style="padding: 15px; background: #fff2f0; border-radius: 8px; border: 1px solid #ffccc7; margin-bottom: 20px;">
            <p style="color: #ff4d4f; font-weight: 600; margin-bottom: 8px;">❌ 上次申请被拒绝原因：</p>
            <p style="color: #666;">您申请的商户号营业执照的经营范围还未更新，请您按申请入驻时提醒你要的经营范围去工商进行变更，变更成功后再进行提交。</p>
        </div>
        
        <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; border: 1px solid #91d5ff; margin-bottom: 20px;">
            <p style="color: #1890ff; font-size: 13px;">
                💡 请根据拒绝原因修改相关资料后重新提交，修改后的申请将进入待审核状态。
            </p>
        </div>
        
        <form id="edit-resubmit-form" onsubmit="submitEditedApplication(event, '${appId}')">
            <div class="form-group">
                <label class="form-label">商户号</label>
                <input type="text" class="form-control" value="${app.merchantId}" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">商户名称</label>
                <input type="text" class="form-control" value="${merchant?.name || '-'}" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">营业执照</label>
                <input type="text" class="form-control" value="${merchant?.companyName || '-'}" disabled>
            </div>
            ${profitSettingsSection}
            <div class="form-group" style="margin-top: 20px;">
                <label class="form-label">申请人姓名 *</label>
                <input type="text" class="form-control" id="edit-applicantName" value="${app.applicantName}" required>
            </div>
            <div class="form-group">
                <label class="form-label">申请人手机号 *</label>
                <input type="tel" class="form-control" id="edit-applicantPhone" value="${app.applicantPhone}" required>
            </div>
            <div class="form-group">
                <label class="form-label">补充说明（可选）</label>
                <textarea class="form-control" id="edit-remark" rows="3" placeholder="请说明您已做的修改或补充材料..."></textarea>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('edit-resubmit-form').requestSubmit()">重新提交申请</button>
    `);
}

// ========== 以下函数已废弃 ==========
// function onEditBrandRatioChange() - 已废弃，改用多商户号表格模式
// ========== 以上函数已废弃 ==========

// 切换编辑模式下的商户号选择
function toggleEditMerchantSelection(merchantId) {
    const checkbox = document.getElementById(`merchant-check-${merchantId}`);
    const tbody = document.getElementById('edit-merchant-profit-tbody');
    const settings = window.editCurrentProfitSettings || [];
    
    if (checkbox.checked) {
        // 添加商户号到设置中
        if (!settings.find(s => s.merchantId === merchantId)) {
            settings.push({
                merchantId: merchantId,
                receiverId: null,
                ratio: 0
            });
        }
    } else {
        // 从设置中移除商户号
        const index = settings.findIndex(s => s.merchantId === merchantId);
        if (index > -1) {
            settings.splice(index, 1);
        }
    }
    
    window.editCurrentProfitSettings = settings;
    renderEditMerchantProfitTable();
}

// 切换编辑模式下的分成开关
function toggleEditProfitEnabled(merchantId) {
    const select = document.getElementById(`profit-enabled-${merchantId}`);
    const receiverSelect = document.getElementById(`receiver-${merchantId}`);
    const ratioInput = document.getElementById(`ratio-${merchantId}`);
    const enabled = select.value === 'yes';
    
    receiverSelect.disabled = !enabled;
    ratioInput.disabled = !enabled;
    
    if (!enabled) {
        receiverSelect.value = '';
        ratioInput.value = 0;
    }
    
    // 更新设置
    const settings = window.editCurrentProfitSettings || [];
    const setting = settings.find(s => s.merchantId === merchantId);
    if (setting) {
        if (!enabled) {
            setting.receiverId = null;
            setting.ratio = 0;
        }
    }
}

// 删除编辑模式下的商户号
function removeEditMerchant(merchantId) {
    if (!confirm('确定要删除这个商户号的分账设置吗？')) return;
    
    // 取消勾选
    const checkbox = document.getElementById(`merchant-check-${merchantId}`);
    if (checkbox) {
        checkbox.checked = false;
    }
    
    // 从设置中移除
    const settings = window.editCurrentProfitSettings || [];
    const index = settings.findIndex(s => s.merchantId === merchantId);
    if (index > -1) {
        settings.splice(index, 1);
    }
    
    window.editCurrentProfitSettings = settings;
    renderEditMerchantProfitTable();
}

// 重新渲染编辑模式的商户号分账表格
function renderEditMerchantProfitTable() {
    const tbody = document.getElementById('edit-merchant-profit-tbody');
    const merchants = window.editBrandMerchants || [];
    const settings = window.editCurrentProfitSettings || [];
    
    // 过滤出已选择的商户号
    const selectedMerchants = merchants.filter(m => 
        settings.some(s => s.merchantId === m.id)
    );
    
    if (selectedMerchants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #999; padding: 40px;">
                    请先在上方选择商户号
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = selectedMerchants.map(m => {
        const setting = settings.find(s => s.merchantId === m.id) || {};
        const hasProfit = setting.receiverId ? true : false;
        const receivers = DataStore.findBy('profitReceivers', 'merchantId', m.id).filter(r => r.status === 'active');
        
        return `
            <tr data-merchant-id="${m.id}">
                <td>${m.id}</td>
                <td>
                    <select class="form-control" 
                            id="profit-enabled-${m.id}" 
                            onchange="toggleEditProfitEnabled('${m.id}')">
                        <option value="no" ${!hasProfit ? 'selected' : ''}>否</option>
                        <option value="yes" ${hasProfit ? 'selected' : ''}>是</option>
                    </select>
                </td>
                <td>
                    <select class="form-control" 
                            id="receiver-${m.id}" 
                            ${!hasProfit ? 'disabled' : ''}>
                        <option value="">-</option>
                        ${receivers.map(r => `
                            <option value="${r.id}" ${r.id === setting.receiverId ? 'selected' : ''}>
                                ${r.receiverName}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td>
                    <input type="number" 
                           class="form-control" 
                           id="ratio-${m.id}" 
                           value="${setting.ratio || 0}" 
                           min="0" max="100" step="0.1"
                           ${!hasProfit ? 'disabled' : ''}>
                </td>
                <td>
                    <button type="button" class="btn btn-link btn-sm" style="color: #ff4d4f;" 
                            onclick="removeEditMerchant('${m.id}')">删除</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 显示添加分账接收方弹窗（编辑模式）
function showAddEditReceiverModal() {
    openModal('新增分账接收方', `
        <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            <!-- 说明 -->
            <div style="padding: 12px; background: #e6f7ff; border-radius: 6px; border: 1px solid #91d5ff; margin-bottom: 20px;">
                <p style="color: #1890ff; font-size: 13px; margin: 0;">
                    📌 说明：<br>
                    添加的分账接收方账户一般用于接收品牌总部的分成，建议至营业执照所在银行开户并绑定至伊智付分账账户后再申请。
                </p>
            </div>
            
            <!-- Tab切换 -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; border-bottom: 2px solid #e8e8e8;">
                    <button type="button" class="receiver-tab active" data-tab="company" 
                            onclick="switchReceiverTab('company')"
                            style="flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px;">
                        对公账户
                    </button>
                    <button type="button" class="receiver-tab" data-tab="personal" 
                            onclick="switchReceiverTab('personal')"
                            style="flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px;">
                        对私账户
                    </button>
                </div>
            </div>
            
            <!-- 基本信息 -->
            <div class="form-group">
                <label class="form-label">分账接收方名称 *</label>
                <input type="text" class="form-control" id="receiver-name" placeholder="请输入分账接收方名称">
            </div>
            
            <div class="form-group">
                <label class="form-label">联系手机号 *</label>
                <input type="tel" class="form-control" id="receiver-phone" placeholder="请输入联系手机号">
            </div>
            
            <!-- 营业执照信息（对公账户） -->
            <div id="company-fields">
                <div class="form-group">
                    <label class="form-label">营业执照号码 *</label>
                    <input type="text" class="form-control" id="business-license-no" placeholder="请输入营业执照号码">
                </div>
                
                <div class="form-group">
                    <label class="form-label">营业执照名称 *</label>
                    <input type="text" class="form-control" id="business-license-name" placeholder="请输入营业执照名称">
                </div>
                
                <div class="form-group">
                    <label class="form-label">营业执照照片 *</label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('license-upload').click()">
                            + 上传营业执照照片（不超过2M）
                        </button>
                        <input type="file" id="license-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'license-preview')">
                        <span id="license-preview" style="font-size: 12px; color: #999;"></span>
                    </div>
                </div>
            </div>
            
            <!-- 法人信息 -->
            <div class="form-group">
                <label class="form-label">法人姓名 *</label>
                <input type="text" class="form-control" id="legal-person-name" placeholder="请输入法人姓名">
            </div>
            
            <div class="form-group">
                <label class="form-label">法人身份证号 *</label>
                <input type="text" class="form-control" id="legal-person-id" placeholder="请输入法人身份证号">
            </div>
            
            <div class="form-group">
                <label class="form-label">法人身份证照片 *</label>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <button type="button" class="btn btn-outline" style="width: 100%;" onclick="document.getElementById('id-front-upload').click()">
                            + 上传人像面（不超过2M）
                        </button>
                        <input type="file" id="id-front-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'id-front-preview')">
                        <span id="id-front-preview" style="font-size: 12px; color: #999; display: block; margin-top: 5px;"></span>
                    </div>
                    <div style="flex: 1;">
                        <button type="button" class="btn btn-outline" style="width: 100%;" onclick="document.getElementById('id-back-upload').click()">
                            + 上传国徽面（不超过2M）
                        </button>
                        <input type="file" id="id-back-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'id-back-preview')">
                        <span id="id-back-preview" style="font-size: 12px; color: #999; display: block; margin-top: 5px;"></span>
                    </div>
                </div>
            </div>
            
            <!-- 收款账户信息 -->
            <div class="form-group">
                <label class="form-label">收款账户名称 *</label>
                <input type="text" class="form-control" id="account-name" placeholder="请输入收款账户名称">
            </div>
            
            <div class="form-group">
                <label class="form-label">收款账户号码 *</label>
                <input type="text" class="form-control" id="account-number" placeholder="请输入收款账户号码">
            </div>
            
            <div class="form-group">
                <label class="form-label">收款账户卡号 *</label>
                <input type="text" class="form-control" id="account-card-no" placeholder="请输入收款账户卡号">
            </div>
            
            <!-- 银行卡照片 -->
            <div class="form-group">
                <label class="form-label">银行卡照片 *</label>
                <button type="button" class="btn btn-outline" onclick="document.getElementById('bank-card-upload').click()">
                    + 上传银行卡照片（不超过2M）
                </button>
                <input type="file" id="bank-card-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'bank-card-preview')">
                <span id="bank-card-preview" style="font-size: 12px; color: #999; display: block; margin-top: 5px;"></span>
            </div>
            
            <!-- 收款账户证件号（对私账户） -->
            <div id="personal-fields" style="display: none;">
                <div class="form-group">
                    <label class="form-label">收款账户证件号 *</label>
                    <input type="text" class="form-control" id="account-id-no" placeholder="请输入收款账户证件号">
                </div>
                
                <div class="form-group">
                    <label class="form-label">收款账户证件照片 *</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <button type="button" class="btn btn-outline" style="width: 100%;" onclick="document.getElementById('account-id-front-upload').click()">
                                + 上传人像面（不超过2M）
                            </button>
                            <input type="file" id="account-id-front-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'account-id-front-preview')">
                            <span id="account-id-front-preview" style="font-size: 12px; color: #999; display: block; margin-top: 5px;"></span>
                        </div>
                        <div style="flex: 1;">
                            <button type="button" class="btn btn-outline" style="width: 100%;" onclick="document.getElementById('account-id-back-upload').click()">
                                + 上传国徽面（不超过2M）
                            </button>
                            <input type="file" id="account-id-back-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'account-id-back-preview')">
                            <span id="account-id-back-preview" style="font-size: 12px; color: #999; display: block; margin-top: 5px;"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 备注说明 -->
            <div class="form-group">
                <label class="form-label">备注说明</label>
                <textarea class="form-control" id="receiver-remark" rows="3" placeholder="请说明添加此分账接收方的原因..."></textarea>
            </div>
        </div>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="confirmAddEditReceiver()">提交申请</button>
    `, 'large');
}

// 切换分账接收方Tab
function switchReceiverTab(tab) {
    // 更新Tab样式
    document.querySelectorAll('.receiver-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.tab === tab) {
            t.classList.add('active');
            t.style.color = '#1890ff';
            t.style.borderBottomColor = '#1890ff';
        } else {
            t.style.color = '#666';
            t.style.borderBottomColor = 'transparent';
        }
    });
    
    // 切换字段显示
    const companyFields = document.getElementById('company-fields');
    const personalFields = document.getElementById('personal-fields');
    
    if (tab === 'company') {
        companyFields.style.display = 'block';
        personalFields.style.display = 'none';
    } else {
        companyFields.style.display = 'none';
        personalFields.style.display = 'block';
    }
}

// 处理文件上传
function handleFileUpload(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    
    // 检查文件大小（2M = 2 * 1024 * 1024 bytes）
    if (file.size > 2 * 1024 * 1024) {
        showToast('文件大小不能超过2M', 'error');
        input.value = '';
        return;
    }
    
    // 显示文件名
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.textContent = `已选择: ${file.name}`;
        preview.style.color = '#52c41a';
    }
    
    // 这里可以添加实际的上传逻辑
    // 暂时只是模拟文件选择
}

// 确认添加分账接收方（编辑模式）
function confirmAddEditReceiver() {
    const name = document.getElementById('receiver-name').value;
    const phone = document.getElementById('receiver-phone').value;
    
    // 获取当前Tab
    const activeTab = document.querySelector('.receiver-tab.active').dataset.tab;
    const isCompany = activeTab === 'company';
    
    // 基本验证
    if (!name) {
        showToast('请输入分账接收方名称', 'error');
        return;
    }
    
    if (!phone) {
        showToast('请输入联系手机号', 'error');
        return;
    }
    
    // 对公账户验证
    if (isCompany) {
        const licenseNo = document.getElementById('business-license-no').value;
        const licenseName = document.getElementById('business-license-name').value;
        const licenseFile = document.getElementById('license-upload').files[0];
        
        if (!licenseNo) {
            showToast('请输入营业执照号码', 'error');
            return;
        }
        
        if (!licenseName) {
            showToast('请输入营业执照名称', 'error');
            return;
        }
        
        if (!licenseFile) {
            showToast('请上传营业执照照片', 'error');
            return;
        }
    }
    
    // 法人信息验证
    const legalPersonName = document.getElementById('legal-person-name').value;
    const legalPersonId = document.getElementById('legal-person-id').value;
    const idFrontFile = document.getElementById('id-front-upload').files[0];
    const idBackFile = document.getElementById('id-back-upload').files[0];
    
    if (!legalPersonName) {
        showToast('请输入法人姓名', 'error');
        return;
    }
    
    if (!legalPersonId) {
        showToast('请输入法人身份证号', 'error');
        return;
    }
    
    if (!idFrontFile || !idBackFile) {
        showToast('请上传法人身份证正反面照片', 'error');
        return;
    }
    
    // 收款账户验证
    const accountName = document.getElementById('account-name').value;
    const accountNumber = document.getElementById('account-number').value;
    const accountCardNo = document.getElementById('account-card-no').value;
    const bankCardFile = document.getElementById('bank-card-upload').files[0];
    
    if (!accountName) {
        showToast('请输入收款账户名称', 'error');
        return;
    }
    
    if (!accountNumber) {
        showToast('请输入收款账户号码', 'error');
        return;
    }
    
    if (!accountCardNo) {
        showToast('请输入收款账户卡号', 'error');
        return;
    }
    
    if (!bankCardFile) {
        showToast('请上传银行卡照片', 'error');
        return;
    }
    
    // 对私账户额外验证
    if (!isCompany) {
        const accountIdNo = document.getElementById('account-id-no').value;
        const accountIdFrontFile = document.getElementById('account-id-front-upload').files[0];
        const accountIdBackFile = document.getElementById('account-id-back-upload').files[0];
        
        if (!accountIdNo) {
            showToast('请输入收款账户证件号', 'error');
            return;
        }
        
        if (!accountIdFrontFile || !accountIdBackFile) {
            showToast('请上传收款账户证件照片', 'error');
            return;
        }
    }
    
    const remark = document.getElementById('receiver-remark').value;
    
    // 创建新的分账接收方（不关联商户号，只是创建接收方账户）
    const newReceiver = {
        id: 'PR' + Date.now().toString().slice(-9),
        receiverName: name,
        receiverType: isCompany ? 'company' : 'personal',
        contactPhone: phone,
        
        // 营业执照信息（对公）
        businessLicenseNo: isCompany ? document.getElementById('business-license-no').value : null,
        businessLicenseName: isCompany ? document.getElementById('business-license-name').value : null,
        businessLicensePhoto: isCompany ? 'license_' + Date.now() + '.jpg' : null,
        
        // 法人信息
        legalPersonName: legalPersonName,
        legalPersonId: legalPersonId,
        legalPersonIdFront: 'id_front_' + Date.now() + '.jpg',
        legalPersonIdBack: 'id_back_' + Date.now() + '.jpg',
        
        // 收款账户信息
        accountName: accountName,
        accountNumber: accountNumber,
        accountCardNo: accountCardNo,
        bankCardPhoto: 'bank_card_' + Date.now() + '.jpg',
        
        // 对私账户额外信息
        accountIdNo: !isCompany ? document.getElementById('account-id-no').value : null,
        accountIdFront: !isCompany ? 'account_id_front_' + Date.now() + '.jpg' : null,
        accountIdBack: !isCompany ? 'account_id_back_' + Date.now() + '.jpg' : null,
        
        remark: remark,
        status: 'pending', // 待审核
        createTime: new Date().toLocaleString('zh-CN')
    };
    
    DataStore.add('profitReceivers', newReceiver);
    
    closeModal();
    showToast('分账接收方申请已提交，等待审核', 'success');
    
    // 刷新表格
    if (typeof renderEditMerchantProfitTable === 'function') {
        renderEditMerchantProfitTable();
    }
}

// ========== 以下函数已废弃 ==========
// function toggleReceiverTypeFields() - 已废弃，改用新的表单结构
// ========== 以上函数已废弃 ==========

// ========== 以下函数已废弃（改用简单的单接收方界面）==========
// 关闭添加接收方弹窗（编辑模式）
// function closeEditAddReceiverModal() {
//     const tempModal = document.getElementById('temp-edit-add-receiver-modal');
//     if (tempModal) {
//         tempModal.remove();
//     }
// }

// 确认添加接收方（编辑模式）
// function confirmEditAddReceiver() {
//     const receiverId = document.getElementById('edit-new-receiver-select')?.value;
//     const ratio = parseFloat(document.getElementById('edit-new-receiver-ratio')?.value);
//     
//     if (!receiverId) {
//         showToast('请选择分账接收方', 'error');
//         return;
//     }
//     
//     if (isNaN(ratio) || ratio < 0 || ratio > 100) {
//         showToast('请输入有效的分成比例（0-100）', 'error');
//         return;
//     }
//     
//     // 添加到当前设置
//     window.editProfitSettings.push({
//         receiverId: receiverId,
//         ratio: ratio
//     });
//     
//     // 关闭临时弹窗
//     closeEditAddReceiverModal();
//     
//     // 重新渲染表格
//     renderEditProfitTable();
// }

// 更新分成比例（编辑模式）
// function updateEditProfitRatio(index, value) {
//     const ratio = parseFloat(value);
//     if (isNaN(ratio) || ratio < 0 || ratio > 100) {
//         showToast('请输入有效的分成比例（0-100）', 'error');
//         return;
//     }
//     
//     window.editProfitSettings[index].ratio = ratio;
//     
//     // 更新总计显示
//     const totalRatio = window.editProfitSettings.reduce((sum, s) => sum + (s.ratio || 0), 0);
//     const totalElement = document.getElementById('edit-total-ratio');
//     if (totalElement) {
//         totalElement.textContent = totalRatio.toFixed(1) + '%';
//         totalElement.style.color = totalRatio > 100 ? '#ff4d4f' : totalRatio === 100 ? '#52c41a' : '#333';
//     }
// }

// 删除分账接收方（编辑模式）
// function removeEditProfitReceiver(index) {
//     if (!confirm('确定要删除这个分账接收方吗？')) return;
//     
//     window.editProfitSettings.splice(index, 1);
//     
//     // 重新渲染表格
//     renderEditProfitTable();
// }

// 重新渲染编辑模式的分账表格
// function renderEditProfitTable() {
//     const tbody = document.getElementById('edit-profit-tbody');
//     const receivers = window.editAvailableReceivers || [];
//     const settings = window.editProfitSettings || [];
//     
//     if (settings.length === 0) {
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
//                     暂无分账接收方设置，点击右上角"添加接收方"开始配置
//                 </td>
//             </tr>
//         `;
//         // 隐藏tfoot
//         const tfoot = document.querySelector('#edit-profit-settings-table tfoot');
//         if (tfoot) tfoot.style.display = 'none';
//         return;
//     }
//     
//     tbody.innerHTML = settings.map((setting, index) => {
//         const receiver = receivers.find(r => r.id === setting.receiverId);
//         if (!receiver) return '';
//         
//         return `
//             <tr data-index="${index}">
//                 <td>${index + 1}</td>
//                 <td>${receiver.receiverName}</td>
//                 <td>${receiver.receiverType === 'merchant' ? '商户号' : '银行账户'}</td>
//                 <td>
//                     ${receiver.receiverType === 'merchant' ? 
//                         receiver.receiverAccount : 
//                         `${receiver.bankName} ${receiver.bankAccount.slice(-4)}`
//                     }
//                 </td>
//                 <td>
//                     <input type="number" class="form-control" 
//                            value="${setting.ratio || 0}" 
//                            min="0" max="100" step="0.1"
//                            data-index="${index}"
//                            onchange="updateEditProfitRatio(${index}, this.value)"
//                            style="width: 100%;">
//                 </td>
//                 <td>
//                     <button type="button" class="btn btn-link btn-sm" style="color: #ff4d4f;" 
//                             onclick="removeEditProfitReceiver(${index})">删除</button>
//                 </td>
//             </tr>
//         `;
//     }).join('');
//     
//     // 更新tfoot
//     const totalRatio = settings.reduce((sum, s) => sum + (s.ratio || 0), 0);
//     const tfoot = document.querySelector('#edit-profit-settings-table tfoot');
//     if (tfoot) {
//         tfoot.style.display = '';
//         tfoot.innerHTML = `
//             <tr style="background: #fafafa; font-weight: 600;">
//                 <td colspan="4" style="text-align: right; padding-right: 15px;">总计：</td>
//                 <td>
//                     <span id="edit-total-ratio" style="color: ${totalRatio > 100 ? '#ff4d4f' : totalRatio === 100 ? '#52c41a' : '#333'};">
//                         ${totalRatio.toFixed(1)}%
//                     </span>
//                 </td>
//                 <td></td>
//             </tr>
//         `;
//     }
// }
// ========== 以上函数已废弃 ==========

// 提交编辑后的申请（简化版，不依赖商户号管理表格）
function submitEditedApplication(e, oldAppId) {
    e.preventDefault();
    
    const oldApp = DataStore.findById('applications', oldAppId);
    const merchant = DataStore.findById('merchants', oldApp.merchantId);
    
    const applicantName = document.getElementById('edit-applicantName').value;
    const applicantPhone = document.getElementById('edit-applicantPhone').value;
    const remark = document.getElementById('edit-remark').value;
    
    // 创建新的申请记录
    const contracts = [
        { 
            type: 'dropship', 
            name: '一件代发协议', 
            signed: false, 
            signTime: null,
            signerAccount: null,
            signerPhone: null,
            readDuration: null,
            openTime: null,
            ipAddress: null,
            deviceInfo: null
        },
        { 
            type: 'operation', 
            name: '私域运营协议', 
            signed: false, 
            signTime: null,
            signerAccount: null,
            signerPhone: null,
            readDuration: null,
            openTime: null,
            ipAddress: null,
            deviceInfo: null
        }
    ];
    
    if (merchant.brandMerchantId || oldApp.brandMerchantId) {
        contracts.push({ 
            type: 'brand', 
            name: '品牌总部分成协议', 
            signed: false, 
            signTime: null,
            signerAccount: null,
            signerPhone: null,
            readDuration: null,
            openTime: null,
            ipAddress: null,
            deviceInfo: null
        });
    }
    
    const newApp = {
        id: 'APP' + Date.now().toString().slice(-9),
        merchantId: oldApp.merchantId,
        loginAccount: oldApp.loginAccount || applicantName + '@merchant.com',
        loginPhone: applicantPhone,
        applicantName,
        applicantPhone,
        brandMerchantId: oldApp.brandMerchantId || merchant.brandMerchantId || null,
        brandRatio: 0,  // 默认不设置分成比例
        profitSettings: [],  // 默认为空数组
        status: 'pending', // 重新进入待审核状态
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        signTime: null,
        merchantRatioRange: null,
        platformRatioRange: null,
        operationRatioRange: null,
        merchantRatio: null,
        platformRatio: null,
        operationRatio: null,
        auditor: null,
        auditRemark: null,
        resubmitRemark: remark, // 补充说明
        previousAppId: oldAppId, // 关联之前被拒绝的申请
        contracts
    };
    
    DataStore.add('applications', newApp);
    
    // 清理全局变量
    delete window.editBrandMerchants;
    delete window.editCurrentProfitSettings;
    
    closeModal();
    showToast('申请已重新提交，请等待平台审核', 'success');
    renderPage(currentPage);
}

function reapply(merchantId) {
    // 重新申请，使用之前被拒绝的商户号
    currentMerchantId = merchantId;
    const apps = DataStore.findBy('applications', 'merchantId', merchantId);
    
    // 如果有被拒绝的申请，显示原因
    const rejectedApp = apps.find(a => a.status === 'rejected');
    if (rejectedApp) {
        openModal('重新申请入驻', `
            <div style="padding: 15px; background: #fff2f0; border-radius: 8px; border: 1px solid #ffccc7; margin-bottom: 20px;">
                <p style="color: #ff4d4f; font-weight: 600;">上次申请被拒绝原因：</p>
                <p style="color: #666; margin-top: 8px;">${rejectedApp.auditRemark}</p>
            </div>
            <p style="color: #666; margin-bottom: 15px;">请确认已解决上述问题后，再次提交申请。</p>
            <form id="reapply-form" onsubmit="submitReapplication(event, '${merchantId}')">
                <div class="form-group">
                    <label class="form-label">申请人姓名 *</label>
                    <input type="text" class="form-control" id="reapply-applicantName" value="${rejectedApp.applicantName}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">申请人手机号 *</label>
                    <input type="tel" class="form-control" id="reapply-applicantPhone" value="${rejectedApp.applicantPhone}" required>
                </div>
            </form>
        `, `
            <button class="btn btn-outline" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="document.getElementById('reapply-form').requestSubmit()">重新提交</button>
        `);
    }
}

function submitReapplication(e, merchantId) {
    e.preventDefault();
    const applicantName = document.getElementById('reapply-applicantName').value;
    const applicantPhone = document.getElementById('reapply-applicantPhone').value;
    
    const merchant = DataStore.findById('merchants', merchantId);
    
    const contracts = [
        { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
        { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
    ];
    if (merchant.brandMerchantId) {
        contracts.push({ type: 'brand', name: '店商供应链合作协议-品牌总部', signed: false, signTime: null });
    }
    
    const newApp = {
        id: 'APP' + Date.now().toString().slice(-9),
        merchantId,
        applicantName,
        applicantPhone,
        brandMerchantId: merchant.brandMerchantId || null,
        brandRatio: 0,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        signTime: null,
        merchantRatioRange: null,
        platformRatioRange: null,
        operationRatioRange: null,
        merchantRatio: null,
        platformRatio: null,
        operationRatio: null,
        auditor: null,
        auditRemark: null,
        contracts
    };
    
    DataStore.add('applications', newApp);
    closeModal();
    showToast('申请已重新提交，请等待平台审核', 'success');
    renderPage('entry');
}

function showNewApplyModal() {
    const merchants = DataStore.get('merchants');
    const currentMerchant = DataStore.findById('merchants', currentMerchantId);
    
    // 获取可以继续申请的商户号
    const availableMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        // 有商城小程序、未签约、且是同品牌（如果是连锁）
        if (currentMerchant.brandId) {
            return !signed && m.miniProgramId && m.brandId === currentMerchant.brandId;
        }
        return !signed && m.miniProgramId && m.id === currentMerchantId;
    });
    
    if (availableMerchants.length === 0) {
        showToast('暂无可申请的商户号', 'info');
        return;
    }
    
    openModal('新增入驻申请', `
        <form id="new-apply-form" onsubmit="submitNewApplication(event)">
            <div class="form-group">
                <label class="form-label">选择伊智付商户号 *</label>
                <select class="form-control" id="new-merchantId" required onchange="onNewMerchantChange()">
                    <option value="">请选择商城小程序绑定的商户号</option>
                    ${availableMerchants.map(m => `
                        <option value="${m.id}" data-type="${m.type}" data-brand="${m.brandId || ''}" data-brand-merchant="${m.brandMerchantId || ''}">
                            ${m.id} - ${m.name} ${!m.hasSubAccount ? '(未开通分账)' : ''} ${m.type === 'individual' ? '(个体户)' : '(公司)'}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div id="new-merchant-info" style="display:none; margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <p><strong>营业执照：</strong><span id="new-license-info"></span></p>
                <p><strong>经营范围：</strong><span id="new-scope-info"></span></p>
                <p><strong>分账功能：</strong><span id="new-subaccount-info"></span></p>
            </div>
            
            <div class="form-group">
                <label class="form-label">申请人姓名 *</label>
                <input type="text" class="form-control" id="new-applicantName" placeholder="请输入申请人姓名" required>
            </div>
            <div class="form-group">
                <label class="form-label">申请人手机号 *</label>
                <input type="tel" class="form-control" id="new-applicantPhone" placeholder="请输入手机号" required>
            </div>
            
            <div id="new-brand-section" style="display:none;">
                <div class="form-group">
                    <label class="form-label">品牌总部商户号（连锁商户需填写）</label>
                    <select class="form-control" id="new-brandMerchantId">
                        <option value="">无需品牌总部分成</option>
                    </select>
                </div>
                <div class="form-group" id="new-brandRatioGroup" style="display:none;">
                    <label class="form-label">品牌总部分成比例（占商家收益的百分比）</label>
                    <input type="number" class="form-control" id="new-brandRatio" min="0" max="100" placeholder="例如：10">
                </div>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('new-apply-form').requestSubmit()">提交申请</button>
    `);
}

function onNewMerchantChange() {
    const select = document.getElementById('new-merchantId');
    const merchantId = select.value;
    
    if (!merchantId) {
        document.getElementById('new-merchant-info').style.display = 'none';
        document.getElementById('new-brand-section').style.display = 'none';
        return;
    }
    
    const merchant = DataStore.findById('merchants', merchantId);
    document.getElementById('new-merchant-info').style.display = 'block';
    document.getElementById('new-license-info').textContent = merchant.businessLicense + ' - ' + merchant.companyName;
    document.getElementById('new-scope-info').textContent = merchant.scope;
    document.getElementById('new-subaccount-info').innerHTML = merchant.hasSubAccount ? 
        '<span style="color:#52c41a">✓ 已开通</span>' : 
        '<span style="color:#ff4d4f">✗ 未开通</span>';
    
    if (merchant.brandId) {
        document.getElementById('new-brand-section').style.display = 'block';
        const brandMerchants = DataStore.get('merchants').filter(m => m.brandId === merchant.brandId && !m.brandMerchantId);
        document.getElementById('new-brandMerchantId').innerHTML = `
            <option value="">无需品牌总部分成</option>
            ${brandMerchants.map(m => `<option value="${m.id}">${m.id} - ${m.name}</option>`).join('')}
        `;
        if (merchant.brandMerchantId) {
            document.getElementById('new-brandMerchantId').value = merchant.brandMerchantId;
            document.getElementById('new-brandRatioGroup').style.display = 'block';
        }
    }
}

function submitNewApplication(e) {
    e.preventDefault();
    const merchantId = document.getElementById('new-merchantId').value;
    const applicantName = document.getElementById('new-applicantName').value;
    const applicantPhone = document.getElementById('new-applicantPhone').value;
    const brandMerchantId = document.getElementById('new-brandMerchantId')?.value || null;
    const brandRatio = parseInt(document.getElementById('new-brandRatio')?.value) || 0;
    
    const merchant = DataStore.findById('merchants', merchantId);
    
    if (!merchant.hasSubAccount) {
        showToast('该商户号未开通分账功能，请先联系经销商开通', 'error');
        return;
    }
    
    if (!merchant.scope.includes('化妆品')) {
        showToast('营业执照经营范围不符合要求，需包含"化妆品"相关经营范围', 'error');
        return;
    }
    
    const contracts = [
        { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
        { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
    ];
    if (brandMerchantId && brandRatio > 0) {
        contracts.push({ type: 'brand', name: '店商供应链合作协议-品牌总部', signed: false, signTime: null });
    }
    
    const newApp = {
        id: 'APP' + Date.now().toString().slice(-9),
        merchantId,
        applicantName,
        applicantPhone,
        brandMerchantId,
        brandRatio,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        signTime: null,
        merchantRatioRange: null,
        platformRatioRange: null,
        operationRatioRange: null,
        merchantRatio: null,
        platformRatio: null,
        operationRatio: null,
        auditor: null,
        auditRemark: null,
        contracts
    };
    
    DataStore.add('applications', newApp);
    closeModal();
    showToast('申请提交成功，请等待平台审核', 'success');
    renderPage('apply');
}

function showWithdrawModal() {
    const deposit = DataStore.findBy('deposits', 'merchantId', currentMerchantId)[0];
    openModal('提现保证金', `
        <p style="margin-bottom: 15px;">可提现金额：<strong style="color: #52c41a;">¥${(deposit?.availableDeposit || 0).toFixed(2)}</strong></p>
        <div class="form-group">
            <label class="form-label">提现金额</label>
            <input type="number" class="form-control" id="withdrawAmount" placeholder="请输入提现金额" max="${deposit?.availableDeposit || 0}">
        </div>
        <p style="font-size: 13px; color: #666;">提现将退回至申请伊智付商户号的对公账户，预计1-3个工作日到账。</p>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="confirmWithdraw()">确认提现</button>
    `);
}

function confirmWithdraw() {
    showToast('提现申请已提交，预计1-3个工作日到账', 'success');
    closeModal();
}

function showInvoiceList() {
    const invoices = DataStore.findBy('invoices', 'merchantId', currentMerchantId);
    openModal('发票管理', `
        <p style="margin-bottom: 15px;">已结算的保证金，供应链平台会开具发票给您。</p>
        ${invoices.length > 0 ? `
            <div class="table-container">
                <table>
                    <thead><tr><th>发票号</th><th>金额</th><th>状态</th><th>开票时间</th><th>操作</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${inv.invoiceNo}</td>
                                <td>¥${inv.amount}</td>
                                <td>${inv.status === 'issued' ? '<span class="status-tag status-success">已开票</span>' : '<span class="status-tag status-pending">待开票</span>'}</td>
                                <td>${inv.issueTime || '-'}</td>
                                <td>${inv.invoiceUrl ? '<button class="btn btn-link">下载</button>' : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="color: #999; text-align: center; padding: 40px;">暂无发票记录</p>'}
    `, '<button class="btn btn-outline" onclick="closeModal()">关闭</button>');
}

function showDepositTab(tab) {
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (tab === 'invoices') {
        const invoices = DataStore.findBy('invoices', 'merchantId', currentMerchantId);
        document.getElementById('deposit-tab-content').innerHTML = `
            <div class="table-container">
                <table>
                    <thead><tr><th>发票号</th><th>金额</th><th>类型</th><th>状态</th><th>开票时间</th><th>操作</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${inv.invoiceNo}</td>
                                <td>¥${inv.amount}</td>
                                <td>${inv.invoiceType}</td>
                                <td>${inv.status === 'issued' ? '<span class="status-tag status-success">已开票</span>' : '<span class="status-tag status-pending">待开票</span>'}</td>
                                <td>${inv.issueTime || '-'}</td>
                                <td>${inv.invoiceUrl ? '<button class="btn btn-link">下载</button>' : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        renderPage('deposit');
    }
}


// 显示添加分账接收方弹窗
function showAddReceiverModal() {
    // 直接调用新增分账接收方弹窗，不需要先选择商户号
    showAddEditReceiverModal();
}

// 通用的添加分账接收方弹窗（接受商户号参数）- 使用完整表单
function showAddReceiverModalWithMerchantId(merchantId) {
    // 直接调用新增分账接收方弹窗，不需要商户号参数
    showAddEditReceiverModal();
}

// 切换分账接收方类型（旧函数，保留兼容性）
function switchReceiverType(type) {
    document.getElementById('receiver-type').value = type;
    
    // 切换tab样式
    document.querySelectorAll('#modal .tab-item').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 切换表单显示
    if (type === 'company') {
        document.getElementById('company-receiver-form').style.display = 'block';
        document.getElementById('individual-receiver-form').style.display = 'none';
    } else {
        document.getElementById('company-receiver-form').style.display = 'none';
        document.getElementById('individual-receiver-form').style.display = 'block';
    }
}

// 提交分账接收方申请
function submitReceiverApplication(event) {
    if (event) event.preventDefault();
    
    const type = document.getElementById('receiver-type').value;
    const brandMerchantId = document.getElementById('receiver-brand-merchant-id').value;
    const remark = document.getElementById('receiver-remark').value;
    
    let receiverData = {
        id: 'PRA' + Date.now().toString().slice(-9),
        applicationId: null, // 将在提交入驻申请时关联
        merchantId: currentMerchantId,
        brandMerchantId: brandMerchantId,
        receiverType: type === 'company' ? 'company' : 'individual',
        remark: remark,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        auditor: null,
        auditRemark: null
    };
    
    if (type === 'company') {
        receiverData.receiverName = document.getElementById('receiver-name-company').value;
        receiverData.contactPhone = document.getElementById('receiver-phone-company').value;
        receiverData.accountName = document.getElementById('receiver-account-name-company').value;
        receiverData.accountPhone = document.getElementById('receiver-account-phone-company').value;
        receiverData.idCardNumber = document.getElementById('receiver-id-card-company').value;
    } else {
        receiverData.receiverName = document.getElementById('receiver-name-individual').value;
        receiverData.contactPhone = document.getElementById('receiver-phone-individual').value;
        receiverData.businessLicense = document.getElementById('receiver-license-no').value;
        receiverData.companyName = document.getElementById('receiver-license-name').value;
        receiverData.legalName = document.getElementById('receiver-legal-name').value;
        receiverData.legalIdCard = document.getElementById('receiver-legal-id').value;
        receiverData.bankAccountName = document.getElementById('receiver-bank-account-name').value;
        receiverData.bankCode = document.getElementById('receiver-bank-code').value;
        receiverData.bankAccount = document.getElementById('receiver-bank-account').value;
        receiverData.accountIdCard = document.getElementById('receiver-account-id-individual').value;
    }
    
    // 临时存储到sessionStorage，在提交入驻申请时一起提交
    sessionStorage.setItem('pendingReceiverApplication', JSON.stringify(receiverData));
    
    showToast('分账接收方信息已保存，请继续完成入驻申请', 'success');
    closeModal();
    
    // 刷新分账接收方下拉列表，显示"待审核"选项
    const receiverSelect = document.getElementById('profitReceiver');
    receiverSelect.innerHTML = `
        <option value="pending">待审核的分账接收方 - ${receiverData.receiverName}</option>
    `;
    receiverSelect.value = 'pending';
    document.getElementById('receiverRemark').style.display = 'none';
}


// ========== 优化后的入驻申请流程 ==========

// 重写showNewApplyModal - 直接进入连锁入驻申请
function showNewApplyModal() {
    // 直接调用连锁申请表单
    showChainStoreApply();
}

// 经营范围提示文案
function getBusinessScopeNotice() {
    return `
        <div style="padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591; margin-top: 20px;">
            <p style="color: #d46b08; font-weight: 600; margin-bottom: 10px;">⚠️ 重要提示</p>
            <p style="font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 10px;">
                如需开通供应链应用，请您先开通【伊智付分账功能】和申请伊智付的营业执照执照经营范围符合需求（不满足可去工商进行变更），
                且本项目的合作均以您申请伊智付的营业执照为合作主体。
            </p>
            <p style="font-size: 13px; color: #666; margin-top: 10px; font-weight: 600;">
                请您确保营业执照有以下经营范围，如果没有的话，请您及时去进行变更新增：
            </p>
            <div style="font-size: 12px; color: #666; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                <p><strong>日用杂品销售、日用品批发、日用品销售：</strong>牙刷、日常生活清扫、清洗用品、厨房器具、餐具</p>
                <p><strong>针纺织品销售：</strong>毛巾、被子、面巾、家用纺织品</p>
                <p><strong>个人卫生用品销售：</strong>卫生纸、纸巾、个人卫生用品、卫生棉</p>
                <p><strong>日用化学产品销售：</strong>香皂、洗手液、家居清洁护理剂、洗衣液、浴液</p>
                <p><strong>厨具卫具及日用杂品批发、零售：</strong>清洁用品、洗涤用品、去污用品、清洁卫生用品</p>
                <p><strong>化妆品批发、化妆品零售：</strong>基础彩妆粉底液</p>
                <p><strong>卫生用品和一次性使用医疗用品销售：</strong>卫生巾、卫生护垫、化妆纸、化妆巾</p>
                <p><strong>母婴用品销售：</strong>睡袋、驱蚊露、洗发沐浴液</p>
                <p><strong>保健食品（预包装）销售、食品销售：</strong>预包装食品、保健品</p>
                <p><strong>新鲜水果批发、新鲜水果零售：</strong>生鲜水果</p>
            </div>
        </div>
    `;
}


// 单店申请表单
function showSingleStoreApply() {
    const merchants = DataStore.get('merchants');
    const currentMerchant = DataStore.findById('merchants', currentMerchantId);
    
    // 获取可申请的单店商户号
    const availableMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        return !signed && m.miniProgramId && !m.brandId; // 单店：没有brandId
    });
    
    if (availableMerchants.length === 0) {
        showToast('暂无可申请的单店商户号', 'info');
        return;
    }
    
    openModal('单店入驻申请', `
        <form id="single-store-form" onsubmit="submitSingleStoreApplication(event)">
            <div class="form-group">
                <label class="form-label">选择伊智付商户号 *</label>
                <select class="form-control" id="single-merchantId" required>
                    <option value="">请选择商城小程序绑定的商户号</option>
                    ${availableMerchants.map(m => `
                        <option value="${m.id}">
                            ${m.id} - ${m.name} ${!m.hasSubAccount ? '(未开通分账)' : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">申请人姓名 *</label>
                <input type="text" class="form-control" id="single-applicantName" placeholder="请输入申请人姓名" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">申请人手机号 *</label>
                <input type="tel" class="form-control" id="single-applicantPhone" placeholder="请输入手机号" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">请您添加工作人员微信</label>
                <div style="text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #d9d9d9;">
                    <div style="width: 150px; height: 150px; margin: 0 auto; background: #fff; border: 1px solid #d9d9d9; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                        <div style="text-align: center; color: #999;">
                            <div style="font-size: 48px;">📱</div>
                            <div style="font-size: 12px; margin-top: 8px;">工作人员微信二维码</div>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">扫码添加工作人员微信，获取入驻指导</p>
                </div>
            </div>
            
            ${getBusinessScopeNotice()}
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('single-store-form').requestSubmit()">提交申请</button>
    `);
}

// 提交单店申请
function submitSingleStoreApplication(e) {
    e.preventDefault();
    const merchantId = document.getElementById('single-merchantId').value;
    const applicantName = document.getElementById('single-applicantName').value;
    const applicantPhone = document.getElementById('single-applicantPhone').value;
    
    const merchant = DataStore.findById('merchants', merchantId);
    
    if (!merchant.hasSubAccount) {
        showToast('该商户号未开通分账功能，请先联系经销商开通', 'error');
        return;
    }
    
    const contracts = [
        { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
        { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
    ];
    
    const newApp = {
        id: 'APP' + Date.now().toString().slice(-9),
        merchantId,
        applicantName,
        applicantPhone,
        brandMerchantId: null,
        brandRatio: 0,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        auditTime: null,
        signTime: null,
        merchantRatioRange: null,
        platformRatioRange: null,
        operationRatioRange: null,
        merchantRatio: null,
        platformRatio: null,
        operationRatio: null,
        auditor: null,
        auditRemark: null,
        contracts
    };
    
    DataStore.add('applications', newApp);
    closeModal();
    showToast('申请提交成功，请等待平台审核', 'success');
    renderPage('supply-chain-apply');
}


// 连锁申请表单
function showChainStoreApply() {
    const merchants = DataStore.get('merchants');
    const currentMerchant = DataStore.findById('merchants', currentMerchantId);
    
    // 获取可申请的连锁商户号
    const availableMerchants = merchants.filter(m => {
        const apps = DataStore.findBy('applications', 'merchantId', m.id);
        const signed = apps.find(a => a.status === 'signed');
        if (currentMerchant.brandId) {
            return !signed && m.miniProgramId && m.brandId === currentMerchant.brandId;
        }
        return !signed && m.miniProgramId && m.brandId; // 有brandId的是连锁
    });
    
    if (availableMerchants.length === 0) {
        showToast('暂无可申请的连锁商户号', 'info');
        return;
    }
    
    openModal('入驻申请', `
        <form id="chain-store-form" onsubmit="submitChainStoreApplication(event)">
            <div class="form-group">
                <label class="form-label">选择伊智付商户号 * <span style="font-size: 12px; color: #999;">(可多选)</span></label>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #d9d9d9; border-radius: 4px; padding: 10px;">
                    ${availableMerchants.map(m => `
                        <label style="display: block; padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 5px;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                            <input type="checkbox" name="chain-merchants" value="${m.id}">
                            <span style="margin-left: 8px;">${m.id} - ${m.name} ${!m.hasSubAccount ? '(未开通分账)' : ''}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group" style="margin-top: 20px;">
                <label class="form-label">申请人姓名 *</label>
                <input type="text" class="form-control" id="chain-applicantName" placeholder="请输入申请人姓名" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">申请人手机号 *</label>
                <input type="tel" class="form-control" id="chain-applicantPhone" placeholder="请输入手机号" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">请您添加工作人员微信</label>
                <div style="text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; border: 1px solid #d9d9d9;">
                    <div style="width: 150px; height: 150px; margin: 0 auto; background: #fff; border: 1px solid #d9d9d9; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                        <div style="text-align: center; color: #999;">
                            <div style="font-size: 48px;">📱</div>
                            <div style="font-size: 12px; margin-top: 8px;">工作人员微信二维码</div>
                        </div>
                    </div>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">扫码添加工作人员微信，获取入驻指导</p>
                </div>
            </div>
            
            ${getBusinessScopeNotice()}
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="document.getElementById('chain-store-form').requestSubmit()">提交申请</button>
    `);
}


// 更新连锁商户列表
function updateChainMerchantList() {
    const checkboxes = document.querySelectorAll('input[name="chain-merchants"]:checked');
    const listDiv = document.getElementById('chain-merchant-list');
    const tbody = document.getElementById('chain-merchant-tbody');
    
    if (checkboxes.length === 0) {
        listDiv.style.display = 'none';
        return;
    }
    
    listDiv.style.display = 'block';
    
    const merchants = DataStore.get('merchants');
    const rows = Array.from(checkboxes).map(cb => {
        const merchant = merchants.find(m => m.id === cb.value);
        const brandMerchant = merchant.brandMerchantId ? merchants.find(m => m.id === merchant.brandMerchantId) : null;
        const receivers = brandMerchant ? DataStore.findBy('profitReceivers', 'merchantId', brandMerchant.id).filter(r => r.status === 'active') : [];
        
        return `
            <tr data-merchant-id="${merchant.id}">
                <td>${merchant.id}</td>
                <td>
                    <select class="form-control form-control-sm" onchange="toggleReceiverSelect('${merchant.id}', this.value)">
                        <option value="no">否</option>
                        <option value="yes">是</option>
                    </select>
                </td>
                <td>
                    <select class="form-control form-control-sm receiver-select" id="receiver-${merchant.id}" disabled style="display:none;">
                        <option value="">请选择分账接收方</option>
                        ${receivers.map(r => `
                            <option value="${r.id}">${r.receiverName} - ${r.receiverType === 'merchant' ? '商户号' : '银行账户'}</option>
                        `).join('')}
                    </select>
                    <span class="no-receiver-text" id="no-receiver-${merchant.id}">-</span>
                </td>
                <td>
                    <div style="display:none;" id="ratio-container-${merchant.id}">
                        <input type="number" class="form-control form-control-sm" id="ratio-${merchant.id}" 
                               min="0" max="100" step="0.01" value="10" style="width: 80px; display: inline-block;">
                        <span style="margin-left: 5px;">%</span>
                        <div style="font-size: 11px; color: #999; margin-top: 3px;">
                            💡 假设设置的是10%，那么此商户号收益100元，则分账接收方从中分走10元
                        </div>
                    </div>
                    <span class="no-ratio-text" id="no-ratio-${merchant.id}">-</span>
                </td>
                <td>
                    <button type="button" class="btn btn-link btn-sm" onclick="removeChainMerchant('${merchant.id}')">删除</button>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

// 切换分账接收方选择
function toggleReceiverSelect(merchantId, needProfit) {
    const receiverSelect = document.getElementById(`receiver-${merchantId}`);
    const noReceiverText = document.getElementById(`no-receiver-${merchantId}`);
    const ratioContainer = document.getElementById(`ratio-container-${merchantId}`);
    const noRatioText = document.getElementById(`no-ratio-${merchantId}`);
    
    if (needProfit === 'yes') {
        receiverSelect.style.display = 'block';
        receiverSelect.disabled = false;
        noReceiverText.style.display = 'none';
        ratioContainer.style.display = 'block';
        noRatioText.style.display = 'none';
    } else {
        receiverSelect.style.display = 'none';
        receiverSelect.disabled = true;
        noReceiverText.style.display = 'inline';
        ratioContainer.style.display = 'none';
        noRatioText.style.display = 'inline';
    }
}


// 删除连锁商户
function removeChainMerchant(merchantId) {
    const checkbox = document.querySelector(`input[name="chain-merchants"][value="${merchantId}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateChainMerchantList();
    }
}

// 提交连锁申请（简化版，不依赖商户号管理表格）
function submitChainStoreApplication(e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="chain-merchants"]:checked');
    
    if (checkboxes.length === 0) {
        showToast('请至少选择一个商户号', 'warning');
        return;
    }
    
    const applicantName = document.getElementById('chain-applicantName').value;
    const applicantPhone = document.getElementById('chain-applicantPhone').value;
    
    const merchants = DataStore.get('merchants');
    let hasError = false;
    
    // 为每个选中的商户号创建申请
    Array.from(checkboxes).forEach(cb => {
        const merchant = merchants.find(m => m.id === cb.value);
        
        if (!merchant.hasSubAccount) {
            showToast(`商户号 ${merchant.id} 未开通分账功能，请先联系经销商开通`, 'error');
            hasError = true;
            return;
        }
        
        const contracts = [
            { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: false, signTime: null },
            { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: false, signTime: null }
        ];
        
        // 如果有品牌总部，添加品牌总部协议
        if (merchant.brandMerchantId) {
            contracts.push({ type: 'brand', name: '店商供应链合作协议-品牌总部', signed: false, signTime: null });
        }
        
        const newApp = {
            id: 'APP' + Date.now().toString().slice(-9),
            merchantId: merchant.id,
            applicantName,
            applicantPhone,
            brandMerchantId: merchant.brandMerchantId || null,
            brandRatio: 0,
            profitReceiverId: null,
            status: 'pending',
            createTime: new Date().toLocaleString('zh-CN'),
            auditTime: null,
            signTime: null,
            merchantRatioRange: null,
            platformRatioRange: null,
            operationRatioRange: null,
            merchantRatio: null,
            platformRatio: null,
            operationRatio: null,
            auditor: null,
            auditRemark: null,
            contracts
        };
        
        DataStore.add('applications', newApp);
    });
    
    if (!hasError) {
        closeModal();
        showToast('申请提交成功，请等待平台审核', 'success');
        renderPage('supply-chain-apply');
    }
}


// 连锁申请中的新增分账接收方（重写以适配连锁申请场景）
function showAddReceiverModalForChain() {
    // 在连锁申请场景中，获取第一个选中的商户号的品牌总部
    const checkboxes = document.querySelectorAll('input[name="chain-merchants"]:checked');
    if (checkboxes.length === 0) {
        showToast('请先选择商户号', 'warning');
        return;
    }
    
    const merchants = DataStore.get('merchants');
    const firstMerchant = merchants.find(m => m.id === checkboxes[0].value);
    const brandMerchantId = firstMerchant.brandMerchantId;
    
    if (!brandMerchantId) {
        showToast('该商户没有品牌总部', 'warning');
        return;
    }
    
    // 调用原有的添加分账接收方弹窗，但传入品牌总部ID
    showAddReceiverModalWithBrandId(brandMerchantId);
}

// 通用的添加分账接收方弹窗（接受品牌总部ID参数）
function showAddReceiverModalWithBrandId(brandMerchantId) {
    openModal('新增分账接收方', `
        <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #1890ff; margin-bottom: 8px;">📌 说明：</p>
            <p style="font-size: 13px; color: #666;">添加的分账接收方账户将用于接收品牌总部的分成。提交后需要供应链平台审核通过才能使用。</p>
        </div>
        
        <div class="tabs" style="margin-bottom: 20px;">
            <div class="tab-item active" onclick="switchReceiverType('company')">对公账户</div>
            <div class="tab-item" onclick="switchReceiverType('individual')">对私账户</div>
        </div>
        
        <form id="receiver-form" onsubmit="submitReceiverApplicationForChain(event)">
            <input type="hidden" id="receiver-type" value="company">
            <input type="hidden" id="receiver-brand-merchant-id" value="${brandMerchantId}">
            
            <!-- 对公账户表单 -->
            <div id="company-receiver-form">
                <div class="form-group">
                    <label class="form-label">分账接收方名称 *</label>
                    <input type="text" class="form-control" id="receiver-name-company" placeholder="请输入分账接收方名称" required>
                </div>
                <div class="form-group">
                    <label class="form-label">联系手机号 *</label>
                    <input type="tel" class="form-control" id="receiver-phone-company" placeholder="请输入联系手机号" required>
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户姓名</label>
                    <input type="text" class="form-control" id="receiver-account-name-company" placeholder="请输入收款账户姓名">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户手机</label>
                    <input type="tel" class="form-control" id="receiver-account-phone-company" placeholder="请输入收款账户手机">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户证件号</label>
                    <input type="text" class="form-control" id="receiver-id-card-company" placeholder="请输入收款账户证件号">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户证件照片</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传人像面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传国徽面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 对私账户表单 -->
            <div id="individual-receiver-form" style="display: none;">
                <div class="form-group">
                    <label class="form-label">分账接收方名称 *</label>
                    <input type="text" class="form-control" id="receiver-name-individual" placeholder="请输入分账接收方名称">
                </div>
                <div class="form-group">
                    <label class="form-label">联系手机号 *</label>
                    <input type="tel" class="form-control" id="receiver-phone-individual" placeholder="请输入联系手机号">
                </div>
                <div class="form-group">
                    <label class="form-label">营业执照号码 *</label>
                    <input type="text" class="form-control" id="receiver-license-no" placeholder="请输入营业执照号码">
                </div>
                <div class="form-group">
                    <label class="form-label">营业执照名称 *</label>
                    <input type="text" class="form-control" id="receiver-license-name" placeholder="请输入营业执照名称">
                </div>
                <div class="form-group">
                    <label class="form-label">营业执照照片 *</label>
                    <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px;">+</div>
                            <div style="font-size: 12px;">上传营业执照照片(不超过2M)</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">法人姓名 *</label>
                    <input type="text" class="form-control" id="receiver-legal-name" placeholder="请输入法人姓名">
                </div>
                <div class="form-group">
                    <label class="form-label">法人身份证号 *</label>
                    <input type="text" class="form-control" id="receiver-legal-id" placeholder="请输入法人身份证号">
                </div>
                <div class="form-group">
                    <label class="form-label">法人身份证照片 *</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传人像面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传国徽面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户名称</label>
                    <input type="text" class="form-control" id="receiver-bank-account-name" placeholder="请输入收款账户名称">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户行号</label>
                    <input type="text" class="form-control" id="receiver-bank-code" placeholder="请输入收款账户行号">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户卡号</label>
                    <input type="text" class="form-control" id="receiver-bank-account" placeholder="请输入收款账户卡号">
                </div>
                <div class="form-group">
                    <label class="form-label">银行卡照片</label>
                    <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px;">+</div>
                            <div style="font-size: 12px;">上传银行卡照片(不超过2M)</div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户证件号</label>
                    <input type="text" class="form-control" id="receiver-account-id-individual" placeholder="请输入收款账户证件号">
                </div>
                <div class="form-group">
                    <label class="form-label">收款账户证件照片</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传人像面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="width: 100%; height: 120px; border: 2px dashed #d9d9d9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; cursor: pointer;">
                                <div style="text-align: center;">
                                    <div style="font-size: 24px;">+</div>
                                    <div style="font-size: 12px;">上传国徽面(不超过2M)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">备注说明</label>
                <textarea class="form-control" id="receiver-remark" rows="3" placeholder="请说明添加此分账接收方的原因..."></textarea>
            </div>
        </form>
    `, `
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="submitReceiverApplicationForChain(event)">提交申请</button>
    `);
}

// 连锁申请场景下提交分账接收方
function submitReceiverApplicationForChain(event) {
    if (event) event.preventDefault();
    
    const type = document.getElementById('receiver-type').value;
    const brandMerchantId = document.getElementById('receiver-brand-merchant-id').value;
    const remark = document.getElementById('receiver-remark').value;
    
    let receiverData = {
        id: 'PR' + Date.now().toString().slice(-9),
        merchantId: brandMerchantId,
        receiverType: type === 'company' ? 'company' : 'individual',
        remark: remark,
        status: 'active', // 直接设为active，实际应该是pending等待审核
        createTime: new Date().toLocaleString('zh-CN')
    };
    
    if (type === 'company') {
        receiverData.receiverName = document.getElementById('receiver-name-company').value;
        receiverData.contactPhone = document.getElementById('receiver-phone-company').value;
        receiverData.accountName = document.getElementById('receiver-account-name-company').value;
        receiverData.accountPhone = document.getElementById('receiver-account-phone-company').value;
        receiverData.idCardNumber = document.getElementById('receiver-id-card-company').value;
    } else {
        receiverData.receiverName = document.getElementById('receiver-name-individual').value;
        receiverData.contactPhone = document.getElementById('receiver-phone-individual').value;
        receiverData.businessLicense = document.getElementById('receiver-license-no').value;
        receiverData.companyName = document.getElementById('receiver-license-name').value;
        receiverData.legalName = document.getElementById('receiver-legal-name').value;
        receiverData.legalIdCard = document.getElementById('receiver-legal-id').value;
        receiverData.bankAccountName = document.getElementById('receiver-bank-account-name').value;
        receiverData.bankCode = document.getElementById('receiver-bank-code').value;
        receiverData.bankAccount = document.getElementById('receiver-bank-account').value;
        receiverData.accountIdCard = document.getElementById('receiver-account-id-individual').value;
    }
    
    // 直接保存到profitReceivers（实际应该保存到profitReceiverApplications等待审核）
    DataStore.add('profitReceivers', receiverData);
    
    showToast('分账接收方添加成功', 'success');
    closeModal();
    
    // 刷新连锁商户列表，使新添加的接收方可选
    updateChainMerchantList();
}

// ========== 签署协议弹窗功能 ==========

// 打开签署协议主弹窗
function openContractSignModal(appId) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    
    // 找到第一个未签署的协议
    const unsignedIndex = app.contracts.findIndex(c => !c.signed);
    const allSigned = unsignedIndex === -1;
    
    // 创建全屏弹窗
    const modalHtml = `
        <div class="contract-sign-overlay" id="contract-sign-overlay" style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
        ">
            <div class="contract-sign-modal" style="
                width: 90%; max-width: 900px; max-height: 90vh;
                background: #fff; border-radius: 12px;
                display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <div class="modal-header" style="
                    padding: 20px 24px; border-bottom: 1px solid #e8e8e8;
                    display: flex; justify-content: space-between; align-items: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;
                ">
                    <h3 style="margin: 0; font-size: 18px;">📝 签署协议</h3>
                    <button onclick="closeContractSignModal()" style="
                        background: none; border: none; color: #fff;
                        font-size: 24px; cursor: pointer; line-height: 1;
                    ">&times;</button>
                </div>
                <div id="contract-sign-body" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
                    <!-- 内容由JS动态填充 -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    if (allSigned) {
        renderAllContractsSigned(appId, merchant);
    } else {
        renderContractToSign(appId, unsignedIndex, merchant);
    }
}

// 渲染待签署的协议
function renderContractToSign(appId, contractIndex, merchant) {
    const app = DataStore.findById('applications', appId);
    // 如果 merchant 为 null，重新获取
    if (!merchant) {
        merchant = DataStore.findById('merchants', app.merchantId);
    }
    const contract = app.contracts[contractIndex];
    const totalContracts = app.contracts.length;
    const signedCount = app.contracts.filter(c => c.signed).length;

    // 获取协议内容
    let contractContent = '';
    let contractTitle = '';
    let isOperationContract = false;
    let currentMode = 1;
    if (contract.type === 'dropship' || contract.type === 'platform') {
        contractTitle = '电商代发协议';
        contractContent = getDropshipAgreementContent(merchant, app);
    } else if (contract.type === 'operation') {
        isOperationContract = true;
        // 根据选择的代运营模式显示不同的协议内容
        const operationMode = app.operationMode || 1;
        currentMode = operationMode;
        if (operationMode === 1) {
            contractTitle = '代运营合作协议（工具托管版）';
            contractContent = getOperationAgreementContentMode1(merchant, app);
        } else {
            contractTitle = '代运营合作协议（全托管+私域铁军版）';
            contractContent = getOperationAgreementContentMode2(merchant, app);
        }
    }

    const openTime = new Date().toISOString();

    // 如果是代运营协议，显示当前模式信息和更改按钮
    const modeInfoHtml = isOperationContract ? `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: ${currentMode === 1 ? '#e6f7ff' : '#f6ffed'}; border-radius: 8px; border: 1px solid ${currentMode === 1 ? '#91d5ff' : '#b7eb8f'}; margin-top: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${currentMode === 1 ? '🛠️' : '👥'}</span>
                <div>
                    <span style="font-weight: 600; color: #333;">当前模式：${currentMode === 1 ? '模式一（运营工具托管）' : '模式二（全托管+私域铁军）'}</span>
                    <span style="margin-left: 10px; color: #ff4d4f; font-weight: 600;">佣金 ${currentMode === 1 ? '15%' : '25%'}</span>
                </div>
            </div>
            <button onclick="goBackToModeSelection('${appId}', ${contractIndex})" style="
                padding: 6px 16px; border: 1px solid #1890ff; background: #fff;
                color: #1890ff; border-radius: 4px; cursor: pointer; font-size: 13px;
            ">更改模式</button>
        </div>
    ` : '';

    const bodyHtml = `
        <div style="padding: 20px 24px; background: #f5f5f5; border-bottom: 1px solid #e8e8e8;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div>
                    <span style="font-size: 16px; font-weight: 600; color: #333;">${contract.name}</span>
                    <span style="margin-left: 10px; padding: 2px 8px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 12px;">
                        第 ${signedCount + 1} / ${totalContracts} 份
                    </span>
                </div>
                <div style="font-size: 13px; color: #666;">
                    签约主体：${merchant.companyName}
                </div>
            </div>
            <div style="padding: 12px 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;">
                <p style="color: #d46b08; font-size: 13px; margin: 0;">
                    📌 签署规则：请仔细阅读协议内容，滚动到底部后需阅读至少10秒才能签署
                </p>
            </div>
            ${modeInfoHtml}
        </div>

        <div id="contract-scroll-container" style="
            flex: 1; overflow-y: auto; padding: 24px;
            background: #fafafa; min-height: 300px; max-height: 400px;
        " onscroll="checkContractScroll()">
            <div style="background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                ${contractContent}
            </div>
        </div>

        <div id="contract-scroll-tip" style="
            text-align: center; padding: 12px; background: #fff2f0;
            color: #ff4d4f; font-weight: 600; border-top: 1px solid #ffccc7;
        ">
            ⬇️ 请滚动到底部阅读完整协议
        </div>

        <div id="contract-timer-section" style="display: none; text-align: center; padding: 12px; background: #e6f7ff; border-top: 1px solid #91d5ff;">
            <span style="color: #1890ff; font-weight: 600;">阅读倒计时：<span id="contract-countdown">10</span> 秒</span>
        </div>

        <div style="padding: 20px 24px; border-top: 1px solid #e8e8e8; background: #fff;">
            <label id="contract-agree-label" style="display: flex; align-items: center; cursor: not-allowed; opacity: 0.5; margin-bottom: 15px;">
                <input type="checkbox" id="contract-agree-checkbox" disabled style="margin-right: 10px; width: 18px; height: 18px;">
                <span style="font-size: 14px;">我已阅读并同意以上协议内容</span>
            </label>
            <div style="display: flex; gap: 15px; justify-content: flex-end;">
                <button onclick="closeContractSignModal()" style="
                    padding: 10px 24px; border: 1px solid #d9d9d9; background: #fff;
                    border-radius: 6px; cursor: pointer; font-size: 14px;
                ">取消</button>
                <button id="contract-sign-btn" disabled onclick="executeContractSign('${appId}', ${contractIndex}, '${openTime}')" style="
                    padding: 10px 24px; border: none; background: #ccc; color: #fff;
                    border-radius: 6px; cursor: not-allowed; font-size: 14px;
                ">已阅读并确认签署</button>
            </div>
        </div>
    `;
    
    document.getElementById('contract-sign-body').innerHTML = bodyHtml;
    
    // 初始化滚动和计时器状态
    window.contractSignState = {
        hasScrolledToBottom: false,
        countdownStarted: false,
        countdown: 10,
        timer: null
    };
}

// 检查协议滚动状态
function checkContractScroll() {
    const container = document.getElementById('contract-scroll-container');
    if (!container || !window.contractSignState) return;
    
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;
    
    if (isAtBottom && !window.contractSignState.hasScrolledToBottom) {
        window.contractSignState.hasScrolledToBottom = true;
        
        // 隐藏滚动提示，显示计时器
        document.getElementById('contract-scroll-tip').style.display = 'none';
        document.getElementById('contract-timer-section').style.display = 'block';
        
        // 开始10秒倒计时
        if (!window.contractSignState.countdownStarted) {
            window.contractSignState.countdownStarted = true;
            
            window.contractSignState.timer = setInterval(() => {
                window.contractSignState.countdown--;
                const countdownEl = document.getElementById('contract-countdown');
                if (countdownEl) {
                    countdownEl.textContent = window.contractSignState.countdown;
                }
                
                if (window.contractSignState.countdown <= 0) {
                    clearInterval(window.contractSignState.timer);
                    enableContractSign();
                }
            }, 1000);
        }
    }
}

// 启用签署按钮
function enableContractSign() {
    const timerSection = document.getElementById('contract-timer-section');
    const agreeLabel = document.getElementById('contract-agree-label');
    const checkbox = document.getElementById('contract-agree-checkbox');
    const signBtn = document.getElementById('contract-sign-btn');
    
    if (timerSection) {
        timerSection.innerHTML = '<span style="color: #52c41a; font-weight: 600;">✓ 阅读完成，请勾选同意后签署协议</span>';
        timerSection.style.background = '#f6ffed';
        timerSection.style.borderColor = '#b7eb8f';
    }
    
    if (agreeLabel) {
        agreeLabel.style.cursor = 'pointer';
        agreeLabel.style.opacity = '1';
    }
    
    if (checkbox) {
        checkbox.disabled = false;
        checkbox.addEventListener('change', function() {
            if (signBtn) {
                if (this.checked) {
                    signBtn.disabled = false;
                    signBtn.style.background = '#52c41a';
                    signBtn.style.cursor = 'pointer';
                } else {
                    signBtn.disabled = true;
                    signBtn.style.background = '#ccc';
                    signBtn.style.cursor = 'not-allowed';
                }
            }
        });
    }
}

// 执行协议签署
function executeContractSign(appId, contractIndex, openTime) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);
    const contract = app.contracts[contractIndex];
    
    const signTime = new Date().toISOString();
    const openTimeDate = new Date(openTime);
    const signTimeDate = new Date(signTime);
    const readDuration = Math.round((signTimeDate - openTimeDate) / 1000);
    
    // 更新协议签署信息
    app.contracts[contractIndex] = {
        ...contract,
        signed: true,
        signTime: new Date().toLocaleString('zh-CN'),
        signerAccount: app.loginAccount || merchant.contactName + '@merchant.com',
        signerPhone: app.loginPhone || merchant.contactPhone,
        readDuration: readDuration,
        openTime: openTime,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        deviceInfo: navigator.userAgent.substring(0, 80)
    };
    
    DataStore.update('applications', appId, { contracts: app.contracts });
    
    // 清理计时器
    if (window.contractSignState && window.contractSignState.timer) {
        clearInterval(window.contractSignState.timer);
    }
    
    // 检查是否还有未签署的协议
    const nextUnsignedIndex = app.contracts.findIndex(c => !c.signed);
    
    if (nextUnsignedIndex === -1) {
        // 所有协议都已签署
        renderAllContractsSigned(appId, merchant);
    } else {
        // 还有协议需要签署，显示成功提示后继续下一份
        showContractSignSuccess(appId, contractIndex, nextUnsignedIndex, merchant);
    }
}

// 显示单份协议签署成功
function showContractSignSuccess(appId, signedIndex, nextIndex, merchant) {
    const app = DataStore.findById('applications', appId);
    const signedContract = app.contracts[signedIndex];
    const nextContract = app.contracts[nextIndex];

    // 如果刚签署的是代发协议，且下一份是代运营协议，则显示模式选择
    if ((signedContract.type === 'dropship' || signedContract.type === 'platform') && nextContract.type === 'operation') {
        showOperationModeSelection(appId, signedIndex, nextIndex, merchant, signedContract);
        return;
    }

    const bodyHtml = `
        <div style="padding: 60px 40px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h3 style="color: #52c41a; margin-bottom: 10px;">《${signedContract.name}》签署成功！</h3>
            <p style="color: #666; margin-bottom: 30px;">签署时间：${signedContract.signTime}</p>

            <div style="padding: 20px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591; margin-bottom: 30px;">
                <p style="color: #d46b08; font-size: 14px; margin: 0;">
                    📋 还需签署：《${nextContract.name}》
                </p>
            </div>

            <button onclick="renderContractToSign('${appId}', ${nextIndex}, null)" style="
                padding: 12px 40px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff; border-radius: 8px; cursor: pointer; font-size: 16px;
            ">继续签署下一份协议</button>
        </div>
    `;

    document.getElementById('contract-sign-body').innerHTML = bodyHtml;
}

// 显示代运营模式选择弹窗
function showOperationModeSelection(appId, signedIndex, nextIndex, merchant, signedContract) {
    const bodyHtml = `
        <div style="padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                <h3 style="color: #52c41a; margin-bottom: 10px;">《${signedContract.name}》签署成功！</h3>
                <p style="color: #666;">签署时间：${signedContract.signTime}</p>
            </div>

            <div style="padding: 20px; background: #e6f7ff; border-radius: 8px; border: 1px solid #91d5ff; margin-bottom: 25px;">
                <p style="color: #1890ff; font-size: 14px; margin: 0; text-align: center;">
                    📋 接下来请选择您需要的代运营服务模式
                </p>
            </div>

            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <!-- 模式1 -->
                <div id="operation-mode-1" onclick="selectOperationMode(1)" style="
                    flex: 1; padding: 24px; border: 2px solid #d9d9d9; border-radius: 12px;
                    cursor: pointer; transition: all 0.3s; background: #fff;
                ">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <span style="font-size: 40px;">🛠️</span>
                    </div>
                    <h4 style="text-align: center; margin-bottom: 12px; color: #333; font-size: 16px;">
                        模式一：运营工具托管
                    </h4>
                    <div style="color: #666; font-size: 13px; line-height: 1.8;">
                        <p style="margin-bottom: 8px;">✓ 提供运营方案</p>
                        <p style="margin-bottom: 8px;">✓ 提供运营工具</p>
                        <p style="margin-bottom: 8px;">✓ 全托管服务支持</p>
                        <p style="margin-bottom: 8px;">✓ 数据分析报告</p>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 6px; text-align: center;">
                        <span style="color: #ff4d4f; font-weight: 600;">代运营佣金：15%</span>
                    </div>
                </div>

                <!-- 模式2 -->
                <div id="operation-mode-2" onclick="selectOperationMode(2)" style="
                    flex: 1; padding: 24px; border: 2px solid #d9d9d9; border-radius: 12px;
                    cursor: pointer; transition: all 0.3s; background: #fff;
                ">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <span style="font-size: 40px;">👥</span>
                    </div>
                    <h4 style="text-align: center; margin-bottom: 12px; color: #333; font-size: 16px;">
                        模式二：全托管+私域铁军
                    </h4>
                    <div style="color: #666; font-size: 13px; line-height: 1.8;">
                        <p style="margin-bottom: 8px;">✓ 包含模式一全部服务</p>
                        <p style="margin-bottom: 8px;">✓ 私域销售铁军团队</p>
                        <p style="margin-bottom: 8px;">✓ 专人代运营私域客户</p>
                        <p style="margin-bottom: 8px;">✓ 1对1客户跟进服务</p>
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: #fff7e6; border-radius: 6px; text-align: center;">
                        <span style="color: #ff4d4f; font-weight: 600;">代运营佣金：25%</span>
                    </div>
                    <div style="margin-top: 8px; text-align: center;">
                        <span style="padding: 2px 8px; background: #52c41a; color: #fff; border-radius: 4px; font-size: 11px;">推荐</span>
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <button id="confirm-mode-btn" disabled onclick="confirmOperationMode('${appId}', ${nextIndex})" style="
                    padding: 14px 50px; border: none; background: #ccc; color: #fff;
                    border-radius: 8px; cursor: not-allowed; font-size: 16px;
                ">请先选择代运营模式</button>
            </div>
        </div>
    `;

    document.getElementById('contract-sign-body').innerHTML = bodyHtml;

    // 初始化选择状态
    window.selectedOperationMode = null;
}

// 选择代运营模式
function selectOperationMode(mode) {
    window.selectedOperationMode = mode;

    const mode1 = document.getElementById('operation-mode-1');
    const mode2 = document.getElementById('operation-mode-2');
    const confirmBtn = document.getElementById('confirm-mode-btn');

    // 重置所有样式
    mode1.style.border = '2px solid #d9d9d9';
    mode1.style.background = '#fff';
    mode2.style.border = '2px solid #d9d9d9';
    mode2.style.background = '#fff';

    // 高亮选中的模式
    if (mode === 1) {
        mode1.style.border = '2px solid #1890ff';
        mode1.style.background = '#e6f7ff';
    } else if (mode === 2) {
        mode2.style.border = '2px solid #52c41a';
        mode2.style.background = '#f6ffed';
    }

    // 启用确认按钮
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        confirmBtn.style.cursor = 'pointer';
        confirmBtn.textContent = mode === 1 ? '确认选择模式一，继续签署协议' : '确认选择模式二，继续签署协议';
    }
}

// 确认代运营模式并继续签署
function confirmOperationMode(appId, nextIndex) {
    if (!window.selectedOperationMode) {
        showToast('请先选择代运营模式', 'error');
        return;
    }

    // 保存选择的模式到应用记录
    const app = DataStore.findById('applications', appId);
    DataStore.update('applications', appId, {
        operationMode: window.selectedOperationMode,
        // 根据模式设置代运营佣金比例
        operationRatio: window.selectedOperationMode === 1 ? 15 : 25
    });

    // 更新协议名称以反映所选模式
    const updatedApp = DataStore.findById('applications', appId);
    updatedApp.contracts[nextIndex].name = window.selectedOperationMode === 1
        ? '代运营合作协议（工具托管版）'
        : '代运营合作协议（全托管+私域铁军版）';
    DataStore.update('applications', appId, { contracts: updatedApp.contracts });

    // 继续签署下一份协议
    renderContractToSign(appId, nextIndex, null);
}

// 返回模式选择界面
function goBackToModeSelection(appId, contractIndex) {
    const app = DataStore.findById('applications', appId);
    const merchant = DataStore.findById('merchants', app.merchantId);

    // 找到代发协议的索引（第一份协议）
    const dropshipIndex = app.contracts.findIndex(c => c.type === 'dropship' || c.type === 'platform');
    const dropshipContract = app.contracts[dropshipIndex];

    // 清理计时器状态
    if (window.contractSignState && window.contractSignState.timer) {
        clearInterval(window.contractSignState.timer);
    }
    window.contractSignState = null;

    // 重新显示模式选择弹窗
    showOperationModeSelection(appId, dropshipIndex, contractIndex, merchant, dropshipContract);
}

// 渲染所有协议签署完成
function renderAllContractsSigned(appId, merchant) {
    const app = DataStore.findById('applications', appId);
    if (!merchant) {
        merchant = DataStore.findById('merchants', app.merchantId);
    }
    
    const bodyHtml = `
        <div style="padding: 60px 40px; text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">🎉</div>
            <h2 style="color: #52c41a; margin-bottom: 15px;">所有协议签署完成！</h2>
            <p style="color: #666; margin-bottom: 30px;">恭喜您，所有协议已签署完成，点击下方按钮完成入驻。</p>
            
            <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: left;">
                <h4 style="color: #52c41a; margin-bottom: 15px;">已签署协议：</h4>
                ${app.contracts.map(c => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d9f7be;">
                        <span>✓ ${c.name}</span>
                        <span style="color: #999; font-size: 13px;">${c.signTime}</span>
                    </div>
                `).join('')}
            </div>
            
            <button onclick="completeContractSign('${appId}')" style="
                padding: 14px 50px; border: none; background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                color: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: 600;
            ">✓ 确认完成，开始合作</button>
        </div>
    `;
    
    document.getElementById('contract-sign-body').innerHTML = bodyHtml;
}

// 完成协议签署，更新状态
function completeContractSign(appId) {
    DataStore.update('applications', appId, {
        status: 'signed',
        signTime: new Date().toLocaleString('zh-CN')
    });
    
    const app = DataStore.findById('applications', appId);
    
    // 初始化保证金账户
    const existingDeposit = DataStore.findBy('deposits', 'merchantId', app.merchantId)[0];
    if (!existingDeposit) {
        DataStore.add('deposits', {
            id: 'DEP' + Date.now().toString().slice(-9),
            merchantId: app.merchantId,
            totalDeposit: 0,
            rechargeCount: 0,
            availableDeposit: 0,
            needWithdrawDeposit: 0,
            frozenDeposit: 0,
            settledDeposit: 0,
            invoicedAmount: 0,
            pendingInvoiceAmount: 0
        });
    }
    
    closeContractSignModal();
    showToast('🎉 恭喜！协议签署成功，您已成功入驻店商供应链', 'success');
    renderPage(currentPage);
}

// 关闭签署协议弹窗
function closeContractSignModal() {
    const overlay = document.getElementById('contract-sign-overlay');
    if (overlay) {
        overlay.remove();
    }
    if (window.contractSignState && window.contractSignState.timer) {
        clearInterval(window.contractSignState.timer);
    }
    window.contractSignState = null;
}

// 电商代发协议内容
function getDropshipAgreementContent(merchant, app) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    return `
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 30px; color: #333;">电商代发协议</h2>
        
        <div style="margin-bottom: 25px; line-height: 2;">
            <p><strong>委托人（甲方）：</strong>${merchant.companyName}</p>
            <p><strong>地　址：</strong>${merchant.address || '广州市天河区'}</p>
            <p><strong>受托人（乙方）：</strong>伊智贸易有限公司</p>
            <p><strong>地　址：</strong>广州市天河区天河路385号</p>
        </div>
        
        <p style="text-indent: 2em; line-height: 2; margin-bottom: 20px;">
            甲乙双方经过友好协商达成如下合作意向：
        </p>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">一、服务说明</h3>
        <div style="line-height: 2; color: #555;">
            <p>1、甲方可销售乙方商城里的产品，甲方自行传到自己网店进行销售；</p>
            <p>2、乙方按出厂批发价为甲方提供一件代发的服务，甲方对自己的网店拥有独立的运营权；</p>
            <p>3、乙方提供的一件代发服务不再额外收取产品打包发货必需的泡沫箱、冰袋及人工费等；</p>
            <p>4、一件代发产生的快递费用，根据与快递公司的实际结算金额为准，由甲方支付；</p>
            <p>5、合作快递默认为圆通，若中途更改其他快递或客人需要临时改发其他快递，费用由甲方支付；</p>
            <p>6、交易售后过程中，非产品质量问题，一切均由甲方负责。</p>
        </div>
        <p style="margin-top: 10px; color: #666; font-size: 13px;">附：乙方产品批发价目表</p>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">二、发货说明</h3>
        <div style="line-height: 2; color: #555;">
            <p>1、下单说明：甲方将订单信息发送给乙方，当天15点前的订单当天发货，当天15点后的订单次日发货，请仔细核对商品信息和收货人信息，如信息错误而造成发错货，乙方不承担任何责任。</p>
            <p>2、发货说明：乙方按要求为甲方提供代发货服务，乙方有责任保质保量发出甲方委托代发的货物，物发出后及时将快递单号告知甲方。个别订单如果时间有延误，乙方有责任将在第一时间通知甲方知晓，提前做好售后准备，避免产生纠纷问题，若已知晓乙方不承担任何责任。</p>
            <p>3、签收说明：甲方客户签收货物时，请提醒客户当面验收，如发现货物有破损或缺少，请及时联系快递公司或乙方处理，签收后再反馈的问题，乙方不承担任何责任。</p>
        </div>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">三、售后说明</h3>
        <div style="line-height: 2; color: #555;">
            <p>1、退换货说明：如因产品质量问题需要退换货的，乙方承担来回运费；如因甲方客户个人原因需要退换货的，运费由甲方客户承担。</p>
            <p>2、退款说明：退货商品经乙方验收合格后，3个工作日内完成退款。</p>
            <p>3、投诉处理：如甲方客户对产品或服务有投诉，甲方应第一时间联系乙方协商处理。</p>
        </div>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">四、结算方式</h3>
        <div style="line-height: 2; color: #555;">
            <p>1、甲方通过平台下单，系统自动按约定比例进行分账结算；</p>
            <p>2、结算周期为T+7，即订单确认收货后7个工作日内完成结算；</p>
            <p>3、分成比例：商家收益 ${app.merchantRatio || 10}%，供应链平台 ${app.platformRatio || 70}%。</p>
        </div>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">五、协议期限</h3>
        <div style="line-height: 2; color: #555;">
            <p>本协议有效期自 ${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日起至 ${endDate.getFullYear()} 年 ${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日止。</p>
            <p>协议到期前30日，如双方无异议，自动续期一年。</p>
        </div>
        
        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">六、其他约定</h3>
        <div style="line-height: 2; color: #555;">
            <p>1、本协议一式两份，甲乙双方各执一份，具有同等法律效力；</p>
            <p>2、本协议未尽事宜，双方可另行协商签订补充协议；</p>
            <p>3、因本协议产生的争议，双方应友好协商解决，协商不成的，提交甲方所在地人民法院诉讼解决。</p>
        </div>
        
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>
                <p><strong>甲方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
            <div>
                <p><strong>乙方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
        </div>
        
        <div style="margin-top: 40px; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; color: #999; font-size: 13px;">
            【协议结束】请确认您已阅读并理解以上全部内容
        </div>
    `;
}

// 代运营合作协议内容
function getOperationAgreementContent(merchant, app) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return `
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 30px; color: #333;">代运营合作协议</h2>

        <p style="text-align: right; margin-bottom: 20px; color: #666;">协议编号：YY${Date.now().toString().slice(-8)}</p>

        <div style="margin-bottom: 25px; line-height: 2;">
            <p><strong>甲方：</strong>私域运营服务平台</p>
            <p><strong>乙方：</strong>${merchant.companyName}</p>
        </div>

        <p style="text-indent: 2em; line-height: 2; margin-bottom: 20px;">
            甲、乙双方基于各自拥有的独特优势和能力，本着平等合作、互惠互利的原则，就甲方全权授权委托乙方运作电子商务事宜达成以下协议：
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">1 合作形式</h3>
        <p style="line-height: 2; color: #555; text-indent: 2em;">
            本协议所称合作，指由甲方提供品牌和商品，乙方负责该品牌和商品在速卖通平台架构搭建、营销推广、双方联合经营的运营模式。
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">2 合作期限及目标</h3>
        <p style="line-height: 2; color: #555; text-indent: 2em;">
            本合同期限自 ${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日起至 ${endDate.getFullYear()} 年 ${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日止。
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">3 双方的权利与义务</h3>

        <h4 style="font-size: 14px; margin: 20px 0 10px; color: #444;">3.1 乙方权利与义务</h4>
        <div style="line-height: 2; color: #555;">
            <p>3.1.1 乙方依据甲方实际情况搭建速卖通销售平台并提供相应的运营团队支持，保证其正常运行，使甲方在网上交易活动得以顺利进行。</p>
            <p>3.1.2 乙方组建并管理该项目的运营团队，并负责产品上传,产品信息优化、营销推广、数据分析等工作。该团队提供服务岗位包括：(运营)产品上传、活动管理，推广管理，数据分析反馈给企业开发新产品,客服服务等。</p>
            <p>3.1.3 乙方负责做好店铺产品的各项整体营销方案，如店铺内实施的大型促销活动或参加平台内的活动，产品的促销价格与优惠条款在与甲方协商达成一致后实施，并在实施过程中根据实际情况与甲方协商达成一致后进行调整。</p>
            <p>3.1.4 乙方在使用付费推广时，需提前做好计划，并把相关计划提交给甲方审批，甲方同意并拨款后方可执行。</p>
            <p>3.1.5 乙方应保证甲方店铺的正常运营，不得有任何违反平台规则的行为。</p>
        </div>

        <h4 style="font-size: 14px; margin: 20px 0 10px; color: #444;">3.2 甲方权利与义务</h4>
        <div style="line-height: 2; color: #555;">
            <p>3.2.1 甲方应提供合法有效的企业资质及产品资质，确保产品质量符合国家相关标准。</p>
            <p>3.2.2 甲方应及时提供产品信息、图片等运营所需资料。</p>
            <p>3.2.3 甲方有权监督乙方的运营工作，并提出合理建议。</p>
            <p>3.2.4 甲方应按时支付约定的服务费用。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">4 费用及结算</h3>
        <div style="line-height: 2; color: #555;">
            <p>4.1 私域运营平台收益比例：${app.operationRatio || 20}%</p>
            <p>4.2 收益按订单实际成交金额计算，通过平台自动分账结算。</p>
            <p>4.3 结算周期与电商代发协议保持一致，为T+7。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">5 保密条款</h3>
        <div style="line-height: 2; color: #555;">
            <p>5.1 双方应对合作过程中知悉的对方商业秘密、技术秘密、客户信息等保密信息严格保密。</p>
            <p>5.2 未经对方书面同意，任何一方不得向第三方披露、转让或许可使用上述保密信息。</p>
            <p>5.3 保密义务在本协议终止后仍然有效，有效期为协议终止后两年。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">6 违约责任</h3>
        <div style="line-height: 2; color: #555;">
            <p>6.1 任何一方违反本协议约定，应承担违约责任，赔偿对方因此遭受的损失。</p>
            <p>6.2 因不可抗力导致协议无法履行的，双方互不承担违约责任。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">7 争议解决</h3>
        <div style="line-height: 2; color: #555;">
            <p>7.1 本协议的解释和执行适用中华人民共和国法律。</p>
            <p>7.2 因本协议产生的争议，双方应友好协商解决；协商不成的，任何一方均可向甲方所在地人民法院提起诉讼。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">8 其他</h3>
        <div style="line-height: 2; color: #555;">
            <p>8.1 本协议一式两份，甲乙双方各执一份，具有同等法律效力。</p>
            <p>8.2 本协议自双方签字盖章之日起生效。</p>
            <p>8.3 本协议未尽事宜，双方可另行签订补充协议，补充协议与本协议具有同等法律效力。</p>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>
                <p><strong>甲方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
            <div>
                <p><strong>乙方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
        </div>

        <div style="margin-top: 40px; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; color: #999; font-size: 13px;">
            【协议结束】请确认您已阅读并理解以上全部内容
        </div>
    `;
}

// 模式1代运营协议：运营工具托管版（运营方案+运营工具全托管）
function getOperationAgreementContentMode1(merchant, app) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return `
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 30px; color: #333;">代运营合作协议（工具托管版）</h2>

        <div style="padding: 15px; background: #e6f7ff; border-radius: 8px; border: 1px solid #91d5ff; margin-bottom: 25px;">
            <p style="color: #1890ff; font-size: 14px; margin: 0; text-align: center;">
                🛠️ 本协议为【模式一：运营工具托管】版本，提供运营方案+运营工具全托管服务
            </p>
        </div>

        <p style="text-align: right; margin-bottom: 20px; color: #666;">协议编号：YY-M1-${Date.now().toString().slice(-8)}</p>

        <div style="margin-bottom: 25px; line-height: 2;">
            <p><strong>甲方：</strong>私域运营服务平台</p>
            <p><strong>乙方：</strong>${merchant.companyName}</p>
        </div>

        <p style="text-indent: 2em; line-height: 2; margin-bottom: 20px;">
            甲、乙双方基于各自拥有的独特优势和能力，本着平等合作、互惠互利的原则，就甲方为乙方提供运营工具托管服务达成以下协议：
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">1 服务范围</h3>
        <div style="line-height: 2; color: #555;">
            <p>1.1 本协议所称服务，指甲方为乙方提供以下运营工具托管服务：</p>
            <p style="padding-left: 2em;">• 私域运营方案设计与规划</p>
            <p style="padding-left: 2em;">• 营销工具平台使用权限</p>
            <p style="padding-left: 2em;">• 数据分析与报告服务</p>
            <p style="padding-left: 2em;">• 运营策略指导与培训</p>
            <p style="padding-left: 2em;">• 技术支持与系统维护</p>
            <p>1.2 乙方自行负责私域客户的日常运营与维护。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">2 合作期限</h3>
        <p style="line-height: 2; color: #555; text-indent: 2em;">
            本协议期限自 ${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日起至 ${endDate.getFullYear()} 年 ${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日止。
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">3 甲方义务</h3>
        <div style="line-height: 2; color: #555;">
            <p>3.1 为乙方提供完整的私域运营方案，包括用户画像分析、营销策略制定、活动方案设计等。</p>
            <p>3.2 提供稳定、安全的运营工具平台，保证系统可用性不低于99.5%。</p>
            <p>3.3 提供数据分析服务，定期出具运营数据报告。</p>
            <p>3.4 提供运营培训服务，帮助乙方团队掌握工具使用方法。</p>
            <p>3.5 提供7×12小时技术支持服务。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">4 乙方义务</h3>
        <div style="line-height: 2; color: #555;">
            <p>4.1 乙方自行组建运营团队，负责私域客户的日常运营维护。</p>
            <p>4.2 合理使用甲方提供的运营工具，不得用于违法违规用途。</p>
            <p>4.3 按时支付约定的服务费用。</p>
            <p>4.4 积极配合甲方的运营指导，及时反馈运营情况。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333; color: #ff4d4f;">5 费用及结算 ⭐</h3>
        <div style="line-height: 2; color: #555; padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;">
            <p><strong>5.1 代运营服务费比例：${app.operationRatio || 15}%</strong></p>
            <p>5.2 费用计算基础：按订单实际成交金额计算。</p>
            <p>5.3 结算方式：通过平台自动分账结算，结算周期为T+7。</p>
            <p>5.4 发票开具：甲方按月为乙方开具增值税普通发票。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">6 保密条款</h3>
        <div style="line-height: 2; color: #555;">
            <p>6.1 双方应对合作过程中知悉的对方商业秘密、客户信息等保密信息严格保密。</p>
            <p>6.2 保密义务在本协议终止后仍然有效，有效期为协议终止后两年。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">7 违约责任</h3>
        <div style="line-height: 2; color: #555;">
            <p>7.1 任何一方违反本协议约定，应承担违约责任。</p>
            <p>7.2 因不可抗力导致协议无法履行的，双方互不承担违约责任。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">8 其他</h3>
        <div style="line-height: 2; color: #555;">
            <p>8.1 本协议一式两份，甲乙双方各执一份，具有同等法律效力。</p>
            <p>8.2 本协议自双方签字盖章之日起生效。</p>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>
                <p><strong>甲方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
            <div>
                <p><strong>乙方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
        </div>

        <div style="margin-top: 40px; padding: 15px; background: #f5f5f5; border-radius: 8px; text-align: center; color: #999; font-size: 13px;">
            【协议结束 - 模式一：运营工具托管版】请确认您已阅读并理解以上全部内容
        </div>
    `;
}

// 模式2代运营协议：全托管+私域铁军版
function getOperationAgreementContentMode2(merchant, app) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return `
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 30px; color: #333;">代运营合作协议（全托管+私域铁军版）</h2>

        <div style="padding: 15px; background: #f6ffed; border-radius: 8px; border: 1px solid #b7eb8f; margin-bottom: 25px;">
            <p style="color: #52c41a; font-size: 14px; margin: 0; text-align: center;">
                👥 本协议为【模式二：全托管+私域铁军】版本，除运营工具外还提供私域销售铁军团队代运营服务
            </p>
        </div>

        <p style="text-align: right; margin-bottom: 20px; color: #666;">协议编号：YY-M2-${Date.now().toString().slice(-8)}</p>

        <div style="margin-bottom: 25px; line-height: 2;">
            <p><strong>甲方：</strong>私域运营服务平台</p>
            <p><strong>乙方：</strong>${merchant.companyName}</p>
        </div>

        <p style="text-indent: 2em; line-height: 2; margin-bottom: 20px;">
            甲、乙双方基于各自拥有的独特优势和能力，本着平等合作、互惠互利的原则，就甲方为乙方提供全托管运营服务及私域销售铁军代运营服务达成以下协议：
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">1 服务范围</h3>
        <div style="line-height: 2; color: #555;">
            <p><strong>1.1 运营工具托管服务（基础服务）：</strong></p>
            <p style="padding-left: 2em;">• 私域运营方案设计与规划</p>
            <p style="padding-left: 2em;">• 营销工具平台使用权限</p>
            <p style="padding-left: 2em;">• 数据分析与报告服务</p>
            <p style="padding-left: 2em;">• 运营策略指导与培训</p>
            <p style="padding-left: 2em;">• 技术支持与系统维护</p>
            <p style="margin-top: 15px;"><strong>1.2 私域销售铁军服务（增值服务）：</strong></p>
            <p style="padding-left: 2em;">• 专业销售铁军团队配置</p>
            <p style="padding-left: 2em;">• 私域客户1对1跟进服务</p>
            <p style="padding-left: 2em;">• 客户关系维护与复购促进</p>
            <p style="padding-left: 2em;">• 社群运营与活动执行</p>
            <p style="padding-left: 2em;">• 客户咨询与售前售后服务</p>
            <p style="padding-left: 2em;">• 7×24小时客户响应</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">2 合作期限</h3>
        <p style="line-height: 2; color: #555; text-indent: 2em;">
            本协议期限自 ${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日起至 ${endDate.getFullYear()} 年 ${endDate.getMonth() + 1} 月 ${endDate.getDate()} 日止。
        </p>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">3 甲方义务</h3>
        <div style="line-height: 2; color: #555;">
            <p><strong>3.1 运营工具服务：</strong></p>
            <p style="padding-left: 2em;">3.1.1 为乙方提供完整的私域运营方案。</p>
            <p style="padding-left: 2em;">3.1.2 提供稳定、安全的运营工具平台。</p>
            <p style="padding-left: 2em;">3.1.3 提供数据分析服务，定期出具运营数据报告。</p>
            <p style="margin-top: 15px;"><strong>3.2 私域铁军服务：</strong></p>
            <p style="padding-left: 2em;">3.2.1 为乙方配置专业的私域销售铁军团队，团队成员经过严格培训。</p>
            <p style="padding-left: 2em;">3.2.2 铁军团队全权负责乙方私域客户的日常运营，包括但不限于客户跟进、咨询解答、活动推广、复购促进等。</p>
            <p style="padding-left: 2em;">3.2.3 每周提供运营周报，每月提供详细的运营分析报告。</p>
            <p style="padding-left: 2em;">3.2.4 提供7×24小时客户响应服务，确保客户问题及时处理。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">4 乙方义务</h3>
        <div style="line-height: 2; color: #555;">
            <p>4.1 提供必要的产品信息、品牌资料供铁军团队使用。</p>
            <p>4.2 配合甲方铁军团队的工作，及时审核营销方案和话术。</p>
            <p>4.3 按时支付约定的服务费用。</p>
            <p>4.4 保证产品质量和供货稳定性。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333; color: #ff4d4f;">5 费用及结算 ⭐</h3>
        <div style="line-height: 2; color: #555; padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;">
            <p><strong>5.1 代运营服务费比例：${app.operationRatio || 25}%</strong></p>
            <p style="padding-left: 2em; font-size: 13px; color: #666;">（含运营工具服务费15% + 私域铁军服务费10%）</p>
            <p>5.2 费用计算基础：按订单实际成交金额计算。</p>
            <p>5.3 结算方式：通过平台自动分账结算，结算周期为T+7。</p>
            <p>5.4 发票开具：甲方按月为乙方开具增值税普通发票。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">6 服务质量保障</h3>
        <div style="line-height: 2; color: #555;">
            <p>6.1 甲方承诺铁军团队客户响应时间不超过5分钟（工作时间）。</p>
            <p>6.2 客户满意度不低于95%，否则甲方需制定改进方案。</p>
            <p>6.3 乙方有权对铁军团队的服务质量进行监督和评价。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">7 保密条款</h3>
        <div style="line-height: 2; color: #555;">
            <p>7.1 双方应对合作过程中知悉的商业秘密、客户信息等严格保密。</p>
            <p>7.2 铁军团队接触的客户数据归乙方所有，甲方不得用于其他用途。</p>
            <p>7.3 保密义务在本协议终止后仍然有效，有效期为协议终止后两年。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">8 违约责任</h3>
        <div style="line-height: 2; color: #555;">
            <p>8.1 任何一方违反本协议约定，应承担违约责任。</p>
            <p>8.2 因不可抗力导致协议无法履行的，双方互不承担违约责任。</p>
        </div>

        <h3 style="font-size: 16px; margin: 25px 0 15px; color: #333;">9 其他</h3>
        <div style="line-height: 2; color: #555;">
            <p>9.1 本协议一式两份，甲乙双方各执一份，具有同等法律效力。</p>
            <p>9.2 本协议自双方签字盖章之日起生效。</p>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>
                <p><strong>甲方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
            <div>
                <p><strong>乙方（盖章）：</strong></p>
                <p style="margin-top: 30px;"><strong>日期：</strong>____年____月____日</p>
            </div>
        </div>

        <div style="margin-top: 40px; padding: 15px; background: #f6ffed; border-radius: 8px; text-align: center; color: #52c41a; font-size: 13px;">
            【协议结束 - 模式二：全托管+私域铁军版】请确认您已阅读并理解以上全部内容
        </div>
    `;
}


// ========== 角色权限管理功能 ==========

// 创建角色弹窗
function showCreateRoleModal() {
    openModal('创建角色', `
        <div class="form-group">
            <label class="form-label">角色名称 *</label>
            <input type="text" class="form-control" id="role-name" placeholder="请输入角色名称">
        </div>
        <div class="form-group">
            <label class="form-label">角色描述</label>
            <textarea class="form-control" id="role-desc" rows="3" placeholder="请输入角色描述（选填）"></textarea>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveNewRole()">创建</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 保存新角色
function saveNewRole() {
    const name = document.getElementById('role-name').value.trim();
    const description = document.getElementById('role-desc').value.trim();
    
    if (!name) {
        showToast('请输入角色名称', 'error');
        return;
    }
    
    const newRole = {
        id: 'ROLE' + Date.now(),
        name,
        description,
        permissions: {},
        employeeCount: 0,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN')
    };
    
    DataStore.add('roles', newRole);
    
    // 记录日志
    DataStore.add('permissionLogs', {
        id: 'LOG' + Date.now(),
        action: 'create_role',
        roleId: newRole.id,
        roleName: newRole.name,
        operator: currentMerchantId,
        operatorName: '当前用户',
        detail: `创建角色：${newRole.name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('角色创建成功', 'success');
    renderPage('role-permission');
}

// 编辑角色
function editRole(roleId) {
    const role = DataStore.findById('roles', roleId);
    if (!role) return;
    
    openModal('编辑角色', `
        <div class="form-group">
            <label class="form-label">角色名称 *</label>
            <input type="text" class="form-control" id="edit-role-name" value="${role.name}">
        </div>
        <div class="form-group">
            <label class="form-label">角色描述</label>
            <textarea class="form-control" id="edit-role-desc" rows="3">${role.description || ''}</textarea>
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveEditRole('${roleId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 保存编辑的角色
function saveEditRole(roleId) {
    const name = document.getElementById('edit-role-name').value.trim();
    const description = document.getElementById('edit-role-desc').value.trim();
    
    if (!name) {
        showToast('请输入角色名称', 'error');
        return;
    }
    
    DataStore.update('roles', roleId, {
        name,
        description,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('permissionLogs', {
        id: 'LOG' + Date.now(),
        action: 'edit_role',
        roleId,
        roleName: name,
        operator: currentMerchantId,
        operatorName: '当前用户',
        detail: `编辑角色：${name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('角色编辑成功', 'success');
    renderPage('role-permission');
}

// 删除角色
function deleteRole(roleId) {
    const role = DataStore.findById('roles', roleId);
    if (!role) return;
    
    if (role.employeeCount > 0) {
        showToast(`该角色下还有${role.employeeCount}名员工，无法删除`, 'error');
        return;
    }
    
    if (!confirm(`确定要删除角色"${role.name}"吗？`)) return;
    
    DataStore.delete('roles', roleId);
    
    // 记录日志
    DataStore.add('permissionLogs', {
        id: 'LOG' + Date.now(),
        action: 'delete_role',
        roleId,
        roleName: role.name,
        operator: currentMerchantId,
        operatorName: '当前用户',
        detail: `删除角色：${role.name}`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    showToast('角色删除成功', 'success');
    renderPage('role-permission');
}

// 配置权限
function configPermissions(roleId) {
    const role = DataStore.findById('roles', roleId);
    if (!role) return;
    
    const permissions = role.permissions || {};
    
    openModal(`配置权限：${role.name}`, `
        <div class="permission-config" style="max-height: 60vh; overflow-y: auto;">
            <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 13px; color: #666;">
                    已选择 <strong id="selected-count">${countPermissions(permissions)}</strong> 个权限
                </div>
                <div>
                    <button class="btn btn-outline btn-sm" onclick="selectAllPermissions()">全选</button>
                    <button class="btn btn-outline btn-sm" onclick="clearAllPermissions()">清空</button>
                </div>
            </div>
            ${renderPermissionTree(permissions)}
        </div>
    `, `
        <button class="btn btn-primary" onclick="savePermissions('${roleId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 渲染权限树
function renderPermissionTree(selectedPermissions) {
    const permissionNodes = {
        'store-config': {
            name: '门店配置',
            children: ['organization', 'role-permission']
        },
        'organization': {
            name: '基础架构',
            actions: ['view', 'create', 'edit', 'delete']
        },
        'role-permission': {
            name: '角色权限',
            actions: ['view', 'create', 'edit', 'delete']
        },
        'marketing-apps': {
            name: '营销应用',
            children: ['supply-chain']
        },
        'supply-chain': {
            name: '店商供应链',
            children: [
                'supply-chain-dashboard',
                'supply-chain-apply',
                'supply-chain-goods',
                'supply-chain-deposit',
                'supply-chain-orders',
                'supply-chain-finance'
            ]
        },
        'supply-chain-dashboard': {
            name: '工作台',
            actions: ['view']
        },
        'supply-chain-apply': {
            name: '入驻管理',
            actions: ['view', 'create', 'edit'],
            children: ['supply-chain-profit-setting']
        },
        'supply-chain-profit-setting': {
            name: '分账设置',
            actions: ['view', 'edit']
        },
        'supply-chain-goods': {
            name: '商品管理',
            actions: ['view']
        },
        'supply-chain-deposit': {
            name: '保证金管理',
            actions: ['view', 'create']
        },
        'supply-chain-orders': {
            name: '订单管理',
            actions: ['view', 'edit']
        },
        'supply-chain-finance': {
            name: '财务对账',
            actions: ['view']
        }
    };
    
    return Object.keys(permissionNodes).map(nodeId => {
        const node = permissionNodes[nodeId];
        const isSelected = selectedPermissions[nodeId] || [];
        const hasChildren = node.children && node.children.length > 0;
        
        return `
            <div class="permission-node" style="margin-bottom: 15px; padding: 15px; border: 1px solid #e8e8e8; border-radius: 8px; background: #fafafa;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${node.actions ? '10px' : '0'};">
                    <div style="font-weight: 600; font-size: 14px;">
                        <span style="margin-right: 8px;">${hasChildren ? '📁' : '📄'}</span>
                        ${node.name}
                    </div>
                </div>
                ${node.actions ? `
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; padding-left: 28px;">
                        ${node.actions.map(action => `
                            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                                <input type="checkbox" 
                                       data-node="${nodeId}" 
                                       data-action="${action}"
                                       ${isSelected.includes(action) ? 'checked' : ''}
                                       onchange="updatePermissionSelection()">
                                <span style="font-size: 13px;">${getActionLabel(action)}</span>
                            </label>
                        `).join('')}
                    </div>
                ` : ''}
                ${hasChildren ? `
                    <div style="margin-top: 10px; padding-left: 20px;">
                        ${node.children.map(childId => {
                            const childNode = permissionNodes[childId];
                            const childSelected = selectedPermissions[childId] || [];
                            return `
                                <div style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 6px; border: 1px solid #e8e8e8;">
                                    <div style="font-weight: 500; font-size: 13px; margin-bottom: 8px;">
                                        📄 ${childNode.name}
                                    </div>
                                    ${childNode.actions ? `
                                        <div style="display: flex; gap: 15px; flex-wrap: wrap; padding-left: 20px;">
                                            ${childNode.actions.map(action => `
                                                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                                                    <input type="checkbox" 
                                                           data-node="${childId}" 
                                                           data-action="${action}"
                                                           ${childSelected.includes(action) ? 'checked' : ''}
                                                           onchange="updatePermissionSelection()">
                                                    <span style="font-size: 13px;">${getActionLabel(action)}</span>
                                                </label>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// 获取操作标签
function getActionLabel(action) {
    const labels = {
        'view': '查看',
        'create': '创建',
        'edit': '编辑',
        'delete': '删除'
    };
    return labels[action] || action;
}

// 更新权限选择
function updatePermissionSelection() {
    const checkboxes = document.querySelectorAll('.permission-config input[type="checkbox"]');
    let count = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) count++;
    });
    document.getElementById('selected-count').textContent = count;
}

// 全选权限
function selectAllPermissions() {
    const checkboxes = document.querySelectorAll('.permission-config input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    updatePermissionSelection();
}

// 清空权限
function clearAllPermissions() {
    const checkboxes = document.querySelectorAll('.permission-config input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updatePermissionSelection();
}

// 保存权限
function savePermissions(roleId) {
    const checkboxes = document.querySelectorAll('.permission-config input[type="checkbox"]');
    const permissions = {};
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const nodeId = cb.dataset.node;
            const action = cb.dataset.action;
            if (!permissions[nodeId]) {
                permissions[nodeId] = [];
            }
            permissions[nodeId].push(action);
        }
    });
    
    const role = DataStore.findById('roles', roleId);
    DataStore.update('roles', roleId, {
        permissions,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 记录日志
    DataStore.add('permissionLogs', {
        id: 'LOG' + Date.now(),
        action: 'config_permission',
        roleId,
        roleName: role.name,
        operator: currentMerchantId,
        operatorName: '当前用户',
        detail: `配置权限：${role.name}，共${countPermissions(permissions)}个权限`,
        createTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('权限配置成功', 'success');
    renderPage('role-permission');
}

// 查看角色员工
function viewRoleEmployees(roleId) {
    const role = DataStore.findById('roles', roleId);
    if (!role) return;
    
    const userRoles = DataStore.findBy('userRoles', 'roleId', roleId) || [];
    
    openModal(`角色员工：${role.name}`, `
        <div style="margin-bottom: 15px;">
            <p style="color: #666;">该角色下共有 <strong>${userRoles.length}</strong> 名员工</p>
        </div>
        ${userRoles.length > 0 ? `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>员工ID</th>
                            <th>员工姓名</th>
                            <th>分配时间</th>
                            <th>分配人</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userRoles.map(ur => `
                            <tr>
                                <td>${ur.userId}</td>
                                <td>${ur.userName}</td>
                                <td>${ur.assignTime}</td>
                                <td>${ur.assignBy}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>该角色下暂无员工</p>
            </div>
        `}
    `, `
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
    `);
}

// ========== 组织架构管理功能 ==========

// 添加组织弹窗
function showAddOrgModal() {
    const organizations = DataStore.get('organizations') || [];
    
    openModal('添加组织', `
        <div class="form-group">
            <label class="form-label">组织名称 *</label>
            <input type="text" class="form-control" id="org-name" placeholder="请输入组织名称">
        </div>
        <div class="form-group">
            <label class="form-label">组织类型 *</label>
            <select class="form-control" id="org-type">
                <option value="headquarters">总部</option>
                <option value="region">区域</option>
                <option value="store">门店</option>
                <option value="department">部门</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">上级组织</label>
            <select class="form-control" id="org-parent">
                <option value="">无（作为顶级组织）</option>
                ${organizations.map(org => `
                    <option value="${org.id}">${org.name}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">负责人</label>
            <input type="text" class="form-control" id="org-manager" placeholder="请输入负责人姓名">
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveNewOrg()">添加</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 保存新组织
function saveNewOrg() {
    const name = document.getElementById('org-name').value.trim();
    const type = document.getElementById('org-type').value;
    const parentId = document.getElementById('org-parent').value || null;
    const managerName = document.getElementById('org-manager').value.trim();
    
    if (!name) {
        showToast('请输入组织名称', 'error');
        return;
    }
    
    const newOrg = {
        id: 'ORG' + Date.now(),
        name,
        type,
        parentId,
        managerName: managerName || null,
        managerId: null,
        employeeCount: 0,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN')
    };
    
    DataStore.add('organizations', newOrg);
    
    closeModal();
    showToast('组织添加成功', 'success');
    renderPage('organization');
}

// 编辑组织
function editOrg(orgId) {
    const org = DataStore.findById('organizations', orgId);
    if (!org) return;
    
    const organizations = DataStore.get('organizations').filter(o => o.id !== orgId);
    
    openModal('编辑组织', `
        <div class="form-group">
            <label class="form-label">组织名称 *</label>
            <input type="text" class="form-control" id="edit-org-name" value="${org.name}">
        </div>
        <div class="form-group">
            <label class="form-label">组织类型 *</label>
            <select class="form-control" id="edit-org-type">
                <option value="headquarters" ${org.type === 'headquarters' ? 'selected' : ''}>总部</option>
                <option value="region" ${org.type === 'region' ? 'selected' : ''}>区域</option>
                <option value="store" ${org.type === 'store' ? 'selected' : ''}>门店</option>
                <option value="department" ${org.type === 'department' ? 'selected' : ''}>部门</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">上级组织</label>
            <select class="form-control" id="edit-org-parent">
                <option value="">无（作为顶级组织）</option>
                ${organizations.map(o => `
                    <option value="${o.id}" ${org.parentId === o.id ? 'selected' : ''}>${o.name}</option>
                `).join('')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">负责人</label>
            <input type="text" class="form-control" id="edit-org-manager" value="${org.managerName || ''}">
        </div>
    `, `
        <button class="btn btn-primary" onclick="saveEditOrg('${orgId}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 保存编辑的组织
function saveEditOrg(orgId) {
    const name = document.getElementById('edit-org-name').value.trim();
    const type = document.getElementById('edit-org-type').value;
    const parentId = document.getElementById('edit-org-parent').value || null;
    const managerName = document.getElementById('edit-org-manager').value.trim();
    
    if (!name) {
        showToast('请输入组织名称', 'error');
        return;
    }
    
    DataStore.update('organizations', orgId, {
        name,
        type,
        parentId,
        managerName: managerName || null,
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    closeModal();
    showToast('组织编辑成功', 'success');
    renderPage('organization');
}

// 删除组织
function deleteOrg(orgId) {
    const org = DataStore.findById('organizations', orgId);
    if (!org) return;
    
    // 检查是否有子组织
    const organizations = DataStore.get('organizations');
    const hasChildren = organizations.some(o => o.parentId === orgId);
    
    if (hasChildren) {
        showToast('该组织下还有子组织，无法删除', 'error');
        return;
    }
    
    if (!confirm(`确定要删除组织"${org.name}"吗？`)) return;
    
    DataStore.delete('organizations', orgId);
    
    showToast('组织删除成功', 'success');
    renderPage('organization');
}

// ========== 分账设置功能 ==========

// 获取分账设置权限（根据当前用户角色）
function getProfitSettingPermission() {
    // TODO: 实际应该根据当前用户的角色权限来判断
    // 这里先返回可编辑权限用于演示
    // 'none' - 不可见（没有view权限）
    // 'view' - 只能浏览（有view权限但没有edit权限）
    // 'edit' - 能修改（有edit权限）
    
    // 演示：可以通过检查用户权限来决定
    // const userPermissions = getUserPermissions(currentUserId);
    // const hasView = hasPermission('supply-chain-profit-setting', 'view', userPermissions);
    // const hasEdit = hasPermission('supply-chain-profit-setting', 'edit', userPermissions);
    // if (!hasView) return 'none';
    // if (hasEdit) return 'edit';
    // return 'view';
    
    return 'edit'; // 演示用，实际应该从用户权限中获取
}

// 显示分账设置弹窗
function showProfitSettingModal(merchantId, canEdit) {
    const merchant = DataStore.findById('merchants', merchantId);
    if (!merchant) return;
    
    // 获取该商户的申请记录（找到有品牌总部分成的申请）
    const apps = DataStore.findBy('applications', 'merchantId', merchantId);
    const app = apps.find(a => a.brandMerchantId);
    
    if (!app) {
        showToast('该商户没有品牌总部配置', 'error');
        return;
    }
    
    const brandMerchant = DataStore.findById('merchants', app.brandMerchantId);
    
    // 获取品牌总部的分账接收方列表
    const receivers = DataStore.findBy('profitReceivers', 'merchantId', app.brandMerchantId)
        .filter(r => r.status === 'active');
    
    // 获取当前配置的分账接收方设置（支持多个）
    const profitSettings = app.profitSettings || [];
    
    // 计算总分成比例
    const totalRatio = profitSettings.reduce((sum, s) => sum + (s.ratio || 0), 0);
    
    openModal(`分账设置 - ${merchant.name}`, `
        <div style="margin-bottom: 20px;">
            <div class="detail-list">
                <div class="detail-item">
                    <span class="label">商户号</span>
                    <span class="value">${merchantId}</span>
                </div>
                <div class="detail-item">
                    <span class="label">商户名称</span>
                    <span class="value">${merchant.name}</span>
                </div>
            </div>
        </div>
        
        <div style="border-top: 1px solid #e8e8e8; padding-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 14px;">分账接收方设置</h4>
                ${canEdit && receivers.length > 0 ? `
                    <button class="btn btn-outline btn-sm" onclick="addProfitReceiver('${app.id}')">+ 添加接收方</button>
                ` : ''}
            </div>
            
            ${receivers.length === 0 ? `
                <div style="padding: 15px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;">
                    <p style="color: #d46b08; font-weight: 600; margin-bottom: 8px;">⚠️ 暂无可用的分账接收方</p>
                    <p style="font-size: 13px; color: #666;">
                        品牌总部（${brandMerchant?.name}）暂未配置分账接收方，请联系品牌总部管理员添加。
                    </p>
                </div>
            ` : `
                <div class="table-container">
                    <table id="profit-settings-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">序号</th>
                                <th>接收方名称</th>
                                <th>类型</th>
                                <th>账户信息</th>
                                <th style="width: 150px;">分成比例（%）</th>
                                ${canEdit ? '<th style="width: 100px;">操作</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            ${profitSettings.length === 0 ? `
                                <tr>
                                    <td colspan="${canEdit ? 6 : 5}" style="text-align: center; color: #999; padding: 40px;">
                                        暂无分账接收方设置${canEdit ? '，点击右上角"添加接收方"开始配置' : ''}
                                    </td>
                                </tr>
                            ` : profitSettings.map((setting, index) => {
                                const receiver = receivers.find(r => r.id === setting.receiverId);
                                if (!receiver) return '';
                                
                                return `
                                    <tr data-index="${index}">
                                        <td>${index + 1}</td>
                                        <td>${receiver.receiverName}</td>
                                        <td>${receiver.receiverType === 'merchant' ? '商户号' : '银行账户'}</td>
                                        <td>
                                            ${receiver.receiverType === 'merchant' ? 
                                                receiver.receiverAccount : 
                                                `${receiver.bankName} ${receiver.bankAccount.slice(-4)}`
                                            }
                                        </td>
                                        <td>
                                            ${canEdit ? `
                                                <input type="number" class="form-control" 
                                                       value="${setting.ratio || 0}" 
                                                       min="0" max="100" step="0.1"
                                                       data-index="${index}"
                                                       onchange="updateProfitRatio(${index}, this.value)"
                                                       style="width: 100%;">
                                            ` : `
                                                <span style="font-weight: 600;">${setting.ratio || 0}%</span>
                                            `}
                                        </td>
                                        ${canEdit ? `
                                            <td>
                                                <button class="btn btn-link btn-sm" style="color: #ff4d4f;" 
                                                        onclick="removeProfitReceiver(${index})">删除</button>
                                            </td>
                                        ` : ''}
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                        ${profitSettings.length > 0 ? `
                            <tfoot>
                                <tr style="background: #fafafa; font-weight: 600;">
                                    <td colspan="4" style="text-align: right; padding-right: 15px;">总计：</td>
                                    <td>
                                        <span id="total-ratio" style="color: ${totalRatio > 100 ? '#ff4d4f' : totalRatio === 100 ? '#52c41a' : '#333'};">
                                            ${totalRatio.toFixed(1)}%
                                        </span>
                                    </td>
                                    ${canEdit ? '<td></td>' : ''}
                                </tr>
                            </tfoot>
                        ` : ''}
                    </table>
                </div>
                
                ${profitSettings.length > 0 && totalRatio > 100 ? `
                    <div style="margin-top: 10px; padding: 10px; background: #fff2f0; border-radius: 6px; border: 1px solid #ffccc7;">
                        <p style="color: #ff4d4f; font-size: 13px; margin: 0;">
                            ⚠️ 总分成比例超过100%，请调整
                        </p>
                    </div>
                ` : ''}
                
                ${!canEdit && profitSettings.length > 0 ? `
                    <p style="font-size: 13px; color: #999; margin-top: 15px;">
                        您当前只有查看权限，如需修改请联系管理员
                    </p>
                ` : ''}
            `}
        </div>
        
        ${receivers.length > 0 && canEdit ? `
            <div style="border-top: 1px solid #e8e8e8; padding-top: 20px; margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; font-size: 14px;">可用分账接收方列表</h4>
                    <button class="btn btn-outline btn-sm" onclick="showAddProfitReceiverModal('${app.brandMerchantId}')">+ 新增分账接收方</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>接收方名称</th>
                                <th>类型</th>
                                <th>账户信息</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receivers.map(r => `
                                <tr>
                                    <td>${r.receiverName}</td>
                                    <td>${r.receiverType === 'merchant' ? '商户号' : '银行账户'}</td>
                                    <td>
                                        ${r.receiverType === 'merchant' ? 
                                            r.receiverAccount : 
                                            `${r.bankName} ${r.bankAccount.slice(-4)}`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
    `, canEdit ? `
        <button class="btn btn-primary" onclick="saveProfitSettings('${app.id}')">保存</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    ` : `
        <button class="btn btn-outline" onclick="closeModal()">关闭</button>
    `);
    
    // 存储当前编辑的数据到全局变量
    window.currentProfitSettings = JSON.parse(JSON.stringify(profitSettings));
    window.currentAppId = app.id;
    window.availableReceivers = receivers;
}

// 添加分账接收方
function addProfitReceiver(appId) {
    const receivers = window.availableReceivers || [];
    const currentSettings = window.currentProfitSettings || [];
    
    // 过滤掉已经添加的接收方
    const usedReceiverIds = currentSettings.map(s => s.receiverId);
    const availableReceivers = receivers.filter(r => !usedReceiverIds.includes(r.id));
    
    if (availableReceivers.length === 0) {
        showToast('所有可用的分账接收方都已添加', 'warning');
        return;
    }
    
    // 显示选择接收方的弹窗
    const modalHtml = `
        <div style="padding: 20px;">
            <h4 style="margin-bottom: 15px;">选择分账接收方</h4>
            <div class="form-group">
                <label class="form-label">接收方 *</label>
                <select class="form-control" id="new-receiver-select">
                    <option value="">请选择</option>
                    ${availableReceivers.map(r => `
                        <option value="${r.id}">
                            ${r.receiverName} - ${r.receiverType === 'merchant' ? '商户号' : '银行账户'}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">分成比例（%）*</label>
                <input type="number" class="form-control" id="new-receiver-ratio" 
                       min="0" max="100" step="0.1" value="0" placeholder="请输入分成比例">
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-outline" onclick="closeAddReceiverModal()">取消</button>
                <button class="btn btn-primary" onclick="confirmAddReceiver()">确定</button>
            </div>
        </div>
    `;
    
    // 创建临时弹窗
    const tempModal = document.createElement('div');
    tempModal.className = 'modal-overlay active';
    tempModal.id = 'temp-add-receiver-modal';
    tempModal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">添加分账接收方</h3>
                <button class="modal-close" onclick="closeAddReceiverModal()">&times;</button>
            </div>
            <div class="modal-body">${modalHtml}</div>
        </div>
    `;
    document.body.appendChild(tempModal);
}

// 关闭添加接收方弹窗
function closeAddReceiverModal() {
    const tempModal = document.getElementById('temp-add-receiver-modal');
    if (tempModal) {
        tempModal.remove();
    }
}

// 确认添加接收方
function confirmAddReceiver() {
    const receiverId = document.getElementById('new-receiver-select')?.value;
    const ratio = parseFloat(document.getElementById('new-receiver-ratio')?.value);
    
    if (!receiverId) {
        showToast('请选择分账接收方', 'error');
        return;
    }
    
    if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        showToast('请输入有效的分成比例（0-100）', 'error');
        return;
    }
    
    // 添加到当前设置
    window.currentProfitSettings.push({
        receiverId: receiverId,
        ratio: ratio
    });
    
    // 关闭临时弹窗
    closeAddReceiverModal();
    
    // 重新渲染主弹窗
    const merchant = DataStore.findById('merchants', DataStore.findById('applications', window.currentAppId).merchantId);
    showProfitSettingModal(merchant.id, true);
}

// 更新分成比例
function updateProfitRatio(index, value) {
    const ratio = parseFloat(value);
    if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        showToast('请输入有效的分成比例（0-100）', 'error');
        return;
    }
    
    window.currentProfitSettings[index].ratio = ratio;
    
    // 更新总计显示
    const totalRatio = window.currentProfitSettings.reduce((sum, s) => sum + (s.ratio || 0), 0);
    const totalElement = document.getElementById('total-ratio');
    if (totalElement) {
        totalElement.textContent = totalRatio.toFixed(1) + '%';
        totalElement.style.color = totalRatio > 100 ? '#ff4d4f' : totalRatio === 100 ? '#52c41a' : '#333';
    }
}

// 删除分账接收方
function removeProfitReceiver(index) {
    if (!confirm('确定要删除这个分账接收方吗？')) return;
    
    window.currentProfitSettings.splice(index, 1);
    
    // 重新渲染主弹窗
    const merchant = DataStore.findById('merchants', DataStore.findById('applications', window.currentAppId).merchantId);
    showProfitSettingModal(merchant.id, true);
}

// 保存分账设置
function saveProfitSettings(appId) {
    const settings = window.currentProfitSettings || [];
    
    if (settings.length === 0) {
        showToast('请至少添加一个分账接收方', 'error');
        return;
    }
    
    // 验证总比例
    const totalRatio = settings.reduce((sum, s) => sum + (s.ratio || 0), 0);
    if (totalRatio > 100) {
        showToast('总分成比例不能超过100%', 'error');
        return;
    }
    
    // 验证每个接收方的比例
    for (let setting of settings) {
        if (!setting.receiverId) {
            showToast('存在无效的分账接收方', 'error');
            return;
        }
        if (isNaN(setting.ratio) || setting.ratio < 0 || setting.ratio > 100) {
            showToast('存在无效的分成比例', 'error');
            return;
        }
    }
    
    // 更新申请记录
    DataStore.update('applications', appId, {
        profitSettings: settings,
        brandRatio: totalRatio,  // 保持兼容性
        updateTime: new Date().toLocaleString('zh-CN')
    });
    
    // 清理全局变量
    delete window.currentProfitSettings;
    delete window.currentAppId;
    delete window.availableReceivers;
    
    closeModal();
    showToast('分账设置保存成功', 'success');
    renderPage(currentPage);
}

// 显示新增分账接收方弹窗
function showAddProfitReceiverModal(brandMerchantId) {
    openModal('新增分账接收方', `
        <div style="padding: 10px 0;">
            <!-- 收款账户类型选择 -->
            <div class="form-group">
                <label class="form-label" style="display: flex; align-items: center; gap: 20px;">
                    <span>收款账户类型</span>
                    <div style="display: flex; gap: 20px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: normal;">
                            <input type="radio" name="receiverAccountType" value="company" checked onchange="toggleReceiverType('company')">
                            <span>对公</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-weight: normal;">
                            <input type="radio" name="receiverAccountType" value="personal" onchange="toggleReceiverType('personal')">
                            <span>对私</span>
                        </label>
                    </div>
                </label>
            </div>

            <!-- 对公表单 -->
            <div id="company-form" style="display: block;">
                <div class="form-group">
                    <label class="form-label required">分账接收方名称</label>
                    <input type="text" class="form-control" id="company-receiver-name" placeholder="请输入分账接收方名称">
                </div>

                <div class="form-group">
                    <label class="form-label required">联系手机号</label>
                    <input type="text" class="form-control" id="company-contact-phone" placeholder="请输入联系手机号">
                </div>

                <div class="form-group">
                    <label class="form-label required">营业执照编号</label>
                    <input type="text" class="form-control" id="company-license-number" placeholder="请输入营业执照编号">
                </div>

                <div class="form-group">
                    <label class="form-label required">营业执照名称</label>
                    <input type="text" class="form-control" id="company-license-name" placeholder="请输入营业执照名称">
                </div>

                <div class="form-group">
                    <label class="form-label required">营业执照照片</label>
                    <div class="upload-area" onclick="document.getElementById('company-license-upload').click()">
                        <div style="text-align: center; color: #1890ff;">
                            <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                            <div>上传营业执照(大小限制在2M)</div>
                        </div>
                        <input type="file" id="company-license-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-license-preview')">
                    </div>
                    <div id="company-license-preview" class="upload-preview"></div>
                </div>

                <div class="form-group">
                    <label class="form-label required">法人姓名</label>
                    <input type="text" class="form-control" id="company-legal-name" placeholder="请输入法人姓名">
                </div>

                <div class="form-group">
                    <label class="form-label required">法人身份证号</label>
                    <input type="text" class="form-control" id="company-legal-id" placeholder="请输入法人身份证号">
                </div>

                <div class="form-group">
                    <label class="form-label required">法人身份证照片</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('company-legal-id-front').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传人像面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="company-legal-id-front" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-legal-id-front-preview')">
                            </div>
                            <div id="company-legal-id-front-preview" class="upload-preview"></div>
                        </div>
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('company-legal-id-back').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传国徽面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="company-legal-id-back" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-legal-id-back-preview')">
                            </div>
                            <div id="company-legal-id-back-preview" class="upload-preview"></div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">收款账户名称</label>
                    <input type="text" class="form-control" id="company-account-name" placeholder="请输入收款账户名称">
                </div>

                <div class="form-group">
                    <label class="form-label">收款账户行号</label>
                    <input type="text" class="form-control" id="company-bank-code" placeholder="请输入银行账号，最少4个字母或数字">
                </div>

                <div class="form-group">
                    <label class="form-label">收款账户卡号</label>
                    <input type="text" class="form-control" id="company-account-number" placeholder="请输入收款账户卡号">
                </div>

                <div class="form-group">
                    <label class="form-label">银行卡照片</label>
                    <div class="upload-area" onclick="document.getElementById('company-bank-card-upload').click()">
                        <div style="text-align: center; color: #1890ff;">
                            <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                            <div>上传银行卡照片(大小限制在2M)</div>
                        </div>
                        <input type="file" id="company-bank-card-upload" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-bank-card-preview')">
                    </div>
                    <div id="company-bank-card-preview" class="upload-preview"></div>
                </div>

                <div class="form-group">
                    <label class="form-label">收款账户证件号</label>
                    <input type="text" class="form-control" id="company-account-id" placeholder="请输入收款账户证件号">
                </div>

                <div class="form-group">
                    <label class="form-label required">收款账户证件照片</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('company-account-id-front').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传人像面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="company-account-id-front" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-account-id-front-preview')">
                            </div>
                            <div id="company-account-id-front-preview" class="upload-preview"></div>
                        </div>
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('company-account-id-back').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传国徽面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="company-account-id-back" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'company-account-id-back-preview')">
                            </div>
                            <div id="company-account-id-back-preview" class="upload-preview"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 对私表单 -->
            <div id="personal-form" style="display: none;">
                <div class="form-group">
                    <label class="form-label required">分账接收方名称</label>
                    <input type="text" class="form-control" id="personal-receiver-name" placeholder="请输入分账接收方名称">
                </div>

                <div class="form-group">
                    <label class="form-label required">联系手机号</label>
                    <input type="text" class="form-control" id="personal-contact-phone" placeholder="请输入联系手机号">
                </div>

                <div class="form-group">
                    <label class="form-label">收款账户姓名</label>
                    <input type="text" class="form-control" id="personal-account-name" placeholder="请输入银行卡开户姓名">
                </div>

                <div class="form-group">
                    <label class="form-label required">收款账户卡号</label>
                    <input type="text" class="form-control" id="personal-account-number" placeholder="请输入收款账户卡号">
                </div>

                <div class="form-group">
                    <label class="form-label required">收款账户证件号</label>
                    <input type="text" class="form-control" id="personal-account-id" placeholder="请输入收款账户证件号">
                </div>

                <div class="form-group">
                    <label class="form-label required">收款账户证件照片</label>
                    <div style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('personal-account-id-front').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传人像面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="personal-account-id-front" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'personal-account-id-front-preview')">
                            </div>
                            <div id="personal-account-id-front-preview" class="upload-preview"></div>
                        </div>
                        <div style="flex: 1;">
                            <div class="upload-area" onclick="document.getElementById('personal-account-id-back').click()">
                                <div style="text-align: center; color: #1890ff;">
                                    <div style="font-size: 32px; margin-bottom: 8px;">+</div>
                                    <div>上传国徽面(大小限制在2M)</div>
                                </div>
                                <input type="file" id="personal-account-id-back" accept="image/*" style="display: none;" onchange="handleFileUpload(this, 'personal-account-id-back-preview')">
                            </div>
                            <div id="personal-account-id-back-preview" class="upload-preview"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `, `
        <button class="btn btn-primary" onclick="submitNewProfitReceiver('${brandMerchantId}')">提交</button>
        <button class="btn btn-outline" onclick="closeModal()">取消</button>
    `);
}

// 切换收款账户类型
function toggleReceiverType(type) {
    const companyForm = document.getElementById('company-form');
    const personalForm = document.getElementById('personal-form');
    
    if (type === 'company') {
        companyForm.style.display = 'block';
        personalForm.style.display = 'none';
    } else {
        companyForm.style.display = 'none';
        personalForm.style.display = 'block';
    }
}

// 处理文件上传
function handleFileUpload(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    
    // 检查文件大小（2M = 2 * 1024 * 1024 bytes）
    if (file.size > 2 * 1024 * 1024) {
        showToast('文件大小不能超过2M', 'error');
        input.value = '';
        return;
    }
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showToast('只能上传图片文件', 'error');
        input.value = '';
        return;
    }
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewDiv = document.getElementById(previewId);
        if (previewDiv) {
            previewDiv.innerHTML = `
                <div style="position: relative; display: inline-block; margin-top: 10px;">
                    <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 4px; border: 1px solid #d9d9d9;">
                    <button onclick="removeUploadedFile('${input.id}', '${previewId}')" 
                            style="position: absolute; top: -8px; right: -8px; background: #ff4d4f; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px; line-height: 1;">×</button>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

// 移除已上传的文件
function removeUploadedFile(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (input) input.value = '';
    if (preview) preview.innerHTML = '';
}

// 提交新增分账接收方
function submitNewProfitReceiver(brandMerchantId) {
    const accountType = document.querySelector('input[name="receiverAccountType"]:checked').value;
    
    let receiverData = {
        id: 'PR' + Date.now(),
        merchantId: brandMerchantId,
        status: 'active',
        createTime: new Date().toLocaleString('zh-CN')
    };
    
    if (accountType === 'company') {
        // 对公账户验证
        const receiverName = document.getElementById('company-receiver-name')?.value.trim();
        const contactPhone = document.getElementById('company-contact-phone')?.value.trim();
        const licenseNumber = document.getElementById('company-license-number')?.value.trim();
        const licenseName = document.getElementById('company-license-name')?.value.trim();
        const legalName = document.getElementById('company-legal-name')?.value.trim();
        const legalId = document.getElementById('company-legal-id')?.value.trim();
        
        if (!receiverName || !contactPhone || !licenseNumber || !licenseName || !legalName || !legalId) {
            showToast('请填写所有必填项', 'error');
            return;
        }
        
        // 验证手机号
        if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
            showToast('请输入有效的手机号', 'error');
            return;
        }
        
        // 验证身份证号
        if (!/^\d{17}[\dXx]$/.test(legalId)) {
            showToast('请输入有效的身份证号', 'error');
            return;
        }
        
        receiverData = {
            ...receiverData,
            receiverType: 'bank',
            accountType: 'company',
            receiverName: receiverName,
            contactPhone: contactPhone,
            licenseNumber: licenseNumber,
            licenseName: licenseName,
            legalName: legalName,
            legalId: legalId,
            accountName: document.getElementById('company-account-name')?.value.trim() || '',
            bankCode: document.getElementById('company-bank-code')?.value.trim() || '',
            bankAccount: document.getElementById('company-account-number')?.value.trim() || '',
            accountId: document.getElementById('company-account-id')?.value.trim() || '',
            bankName: '银行账户'
        };
        
    } else {
        // 对私账户验证
        const receiverName = document.getElementById('personal-receiver-name')?.value.trim();
        const contactPhone = document.getElementById('personal-contact-phone')?.value.trim();
        const accountNumber = document.getElementById('personal-account-number')?.value.trim();
        const accountId = document.getElementById('personal-account-id')?.value.trim();
        
        if (!receiverName || !contactPhone || !accountNumber || !accountId) {
            showToast('请填写所有必填项', 'error');
            return;
        }
        
        // 验证手机号
        if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
            showToast('请输入有效的手机号', 'error');
            return;
        }
        
        // 验证身份证号
        if (!/^\d{17}[\dXx]$/.test(accountId)) {
            showToast('请输入有效的身份证号', 'error');
            return;
        }
        
        receiverData = {
            ...receiverData,
            receiverType: 'bank',
            accountType: 'personal',
            receiverName: receiverName,
            contactPhone: contactPhone,
            accountName: document.getElementById('personal-account-name')?.value.trim() || receiverName,
            bankAccount: accountNumber,
            accountId: accountId,
            bankName: '银行账户'
        };
    }
    
    // 保存到数据库
    DataStore.create('profitReceivers', receiverData);
    
    closeModal();
    showToast('新增分账接收方成功', 'success');
    
    // 刷新页面
    renderPage(currentPage);
}
