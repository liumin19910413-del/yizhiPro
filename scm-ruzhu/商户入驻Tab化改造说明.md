# 商户入驻页面Tab化改造说明

## 改造目标

将【商户入驻】的子菜单结构改为Tab页结构，与【商品管理】等其他模块的交互方式保持一致。

## 改造前后对比

### 改造前

**侧边栏结构：**
```
└─ 商户入驻 (父菜单，可展开/收起)
   ├─ 入驻审批 (子菜单)
   └─ 分成管理 (子菜单)
```

**操作流程：**
1. 点击【商户入驻】展开子菜单
2. 点击【入驻审批】或【分成管理】进入对应页面

**问题：**
- 需要两次点击才能进入功能页面
- 与其他模块（如商品管理）的交互方式不一致
- 菜单层级较深

### 改造后

**侧边栏结构：**
```
└─ 商户入驻 (单一菜单)
```

**页面结构：**
```
商户入驻页面
├─ [入驻审批] Tab
│  └─ 筛选条件 + 申请列表
└─ [分成管理] Tab
   ├─ [品牌总部分成设置] 子Tab
   └─ [经销商单位分成设置] 子Tab
```

**操作流程：**
1. 点击【商户入驻】直接进入页面
2. 在页面内通过Tab切换功能

**优势：**
- 一次点击即可进入
- 与其他模块交互方式一致
- 菜单结构更扁平
- Tab切换更直观

## 功能特性

### 主Tab导航
- **入驻审批Tab** 📋
  - 包含所有入驻审批功能
  - 筛选条件
  - 申请列表
  - 审核操作
  
- **分成管理Tab** 💰
  - 包含两个子Tab
  - 品牌总部分成设置
  - 经销商单位分成设置

### 状态保持
- ✅ 记住用户选择的主Tab（入驻审批/分成管理）
- ✅ 记住用户选择的子Tab（品牌总部/经销商单位）
- ✅ 切换其他页面后返回，Tab状态保持不变
- ✅ 页面不会自动刷新，避免闪烁

### 性能优化
- ✅ 页面不会每5秒自动刷新
- ✅ Tab切换无需重新加载数据
- ✅ 减少不必要的DOM操作

## 技术实现

### 新增全局变量
```javascript
let currentMerchantsTab = 'audit'; // 记住当前选中的商户入驻Tab
```

### 新增函数

**1. renderMerchants()**
- 渲染商户入驻整合页面
- 根据currentMerchantsTab决定显示哪个Tab
- 返回包含Tab导航和内容的HTML

**2. switchMerchantsTab(tabName)**
- 切换商户入驻Tab
- 保存用户选择的Tab
- 更新Tab导航和内容显示
- 初始化相应的事件监听

**3. renderMerchantsAuditContent()**
- 渲染入驻审批Tab的内容
- 包含筛选条件和申请列表
- 返回HTML字符串

**4. renderMerchantsProfitContent()**
- 渲染分成管理Tab的内容
- 包含品牌总部和经销商两个子Tab
- 返回HTML字符串

### 修改的函数

**1. renderPage()**
```javascript
case 'merchants': 
    content.innerHTML = renderMerchants(); 
    setTimeout(() => {
        if (currentMerchantsTab === 'audit') {
            initAuditFilters();
        }
    }, 0);
    break;
```

**2. listenStorageChanges()**
```javascript
setInterval(() => {
    if (currentPage !== 'merchants' && currentPage !== 'merchants-profit') {
        renderPage(currentPage);
    }
}, 5000);
```

### 路由兼容

为了保持向后兼容，保留了旧的路由：

```javascript
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
```

## 测试步骤

### 测试1：验证菜单结构
1. 访问 MG端：http://localhost:8000/mg/index.html
2. 查看左侧菜单【商户入驻】
3. **预期**：显示为单一菜单项，没有子菜单

### 测试2：验证页面进入
1. 点击【商户入驻】菜单
2. **预期**：直接进入商户入驻页面，显示Tab导航

### 测试3：验证Tab切换
1. 默认显示【入驻审批】Tab
2. 点击【分成管理】Tab
3. **预期**：Tab正常切换，显示分成管理内容
4. 点击【入驻审批】Tab
5. **预期**：Tab正常切换回来

### 测试4：验证子Tab
1. 在【分成管理】Tab中
2. 默认显示【品牌总部分成设置】子Tab
3. 点击【经销商单位分成设置】子Tab
4. **预期**：子Tab正常切换

### 测试5：验证状态保持
1. 切换到【分成管理】Tab
2. 点击左侧其他菜单（如【数据概览】）
3. 再点击【商户入驻】
4. **预期**：Tab仍然停留在【分成管理】

### 测试6：验证功能完整性
1. 在【入驻审批】Tab中
2. 测试筛选功能
3. 测试审核功能
4. **预期**：所有功能正常工作

### 测试7：验证子Tab状态保持
1. 在【分成管理】Tab中
2. 切换到【经销商单位分成设置】子Tab
3. 点击其他菜单后返回
4. **预期**：主Tab和子Tab状态都保持

### 测试8：验证编辑功能
1. 在【分成管理】>【经销商单位分成设置】中
2. 点击【+ 添加经销商】
3. 编辑某个经销商
4. 保存
5. **预期**：功能正常，Tab状态保持

### 测试9：验证旧路由兼容
1. 在浏览器地址栏手动访问旧路由（如果有书签）
2. **预期**：正常显示对应的Tab

### 测试10：验证无闪烁
1. 停留在【商户入驻】页面
2. 观察10秒以上
3. **预期**：页面内容稳定，不闪烁

## 修改的文件

### prototype/mg/index.html
**修改内容：**
- 移除【商户入驻】的子菜单结构
- 改为单一菜单项

**修改前：**
```html
<div class="nav-item has-submenu" data-page="merchants">
    <span class="icon">🏪</span><span>商户入驻</span>
</div>
<div class="nav-submenu">
    <div class="nav-item" data-page="merchants-audit"><span>入驻审批</span></div>
    <div class="nav-item" data-page="merchants-profit"><span>分成管理</span></div>
</div>
```

**修改后：**
```html
<div class="nav-item" data-page="merchants">
    <span class="icon">🏪</span><span>商户入驻</span>
</div>
```

### prototype/mg/app.js
**新增内容：**
- 全局变量 `currentMerchantsTab`
- 函数 `renderMerchants()`
- 函数 `switchMerchantsTab()`
- 函数 `renderMerchantsAuditContent()`
- 函数 `renderMerchantsProfitContent()`

**修改内容：**
- `renderPage()` 函数 - 支持新路由
- `listenStorageChanges()` 函数 - 排除自动刷新

## 用户体验提升

### 操作简化
- ✅ 从两次点击减少到一次点击
- ✅ 菜单层级从2级减少到1级
- ✅ 操作流程更直观

### 视觉统一
- ✅ 与【商品管理】等模块交互方式一致
- ✅ 使用相同的Tab样式
- ✅ 使用相同的图标设计
- ✅ 整体风格更统一

### 性能优化
- ✅ 页面不会自动刷新，避免闪烁
- ✅ Tab切换无需重新加载数据
- ✅ 状态保持，减少重复操作

## 业务价值

### 提升效率
- 减少点击次数 50%
- 减少页面跳转
- 快速切换功能模块

### 降低学习成本
- 交互方式统一
- 操作逻辑一致
- 易于理解和使用

### 优化系统架构
- 菜单结构更扁平
- 代码结构更清晰
- 易于维护和扩展

## 注意事项

1. **Tab状态保持**：Tab状态会在页面切换时保持，但浏览器关闭后会重置为默认的第一个Tab
2. **自动刷新**：商户入驻页面不会自动刷新，避免闪烁
3. **手动刷新**：切换到商户入驻页面时会刷新一次，显示最新数据
4. **兼容性**：保留了旧的路由，确保向后兼容

## 修复时间

2026-01-15

## 修复状态

✅ 已完成并测试通过

## 相关文档

- `prototype/CHANGELOG.md` - 版本 1.7.7 更新日志
- `prototype/分成管理页面优化说明.md` - 分成管理功能说明
- `prototype/分成管理防闪烁优化说明.md` - 防闪烁优化说明
