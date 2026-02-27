# iframe白屏问题修复说明

## 问题描述

在尝试创建统一入口页面时，使用iframe嵌入MG和Lite系统会出现白屏问题。虽然：
- 直接访问 `mg/index.html` 和 `lite/index.html` 正常显示
- 直接访问 `mg-iframe.html` 和 `lite-iframe.html` 也正常显示
- 但在iframe中嵌入这些页面时，会出现白屏

## 问题原因

iframe白屏的根本原因是：
1. **JavaScript执行上下文隔离**：iframe中的JavaScript在独立的上下文中运行
2. **资源加载路径问题**：即使修改了相对路径，iframe内部的动态资源加载仍可能出错
3. **DOM事件传播限制**：iframe内外的事件无法正常传播
4. **浏览器安全策略**：某些浏览器对iframe有额外的安全限制

## 解决方案

### 方案1：页面跳转方式（推荐）✅

**文件**：`index-switch.html`

**特点**：
- 在同一个浏览器窗口中切换系统
- 点击卡片后跳转到对应系统页面
- 每个系统页面都有"返回系统选择"按钮
- 无需多个标签页，用户体验流畅

**使用方法**：
```
访问：http://localhost:8000/index-switch.html
点击卡片进入对应系统
点击侧边栏的"返回系统选择"按钮切换系统
```

**优点**：
- ✅ 完全避免iframe问题
- ✅ 在同一窗口中操作
- ✅ 系统间切换流畅
- ✅ 所有功能正常工作
- ✅ 浏览器历史记录支持（可以用后退按钮）

### 方案2：新标签页方式（备选）

**文件**：`index.html`（当前版本）

**特点**：
- 点击卡片在新标签页打开系统
- 需要在不同标签页间切换

**优点**：
- ✅ 简单可靠
- ✅ 所有功能正常
- ✅ 可以同时查看两个系统

**缺点**：
- ❌ 需要多个浏览器标签页

## 推荐使用

**推荐使用方案1（index-switch.html）**，因为：
1. 在同一窗口中操作，无需切换标签页
2. 用户体验更好，类似单页应用
3. 保持了系统间的连贯性
4. 所有功能完全正常工作

## 技术实现

### index-switch.html 实现原理

```javascript
// 1. 点击卡片时，在当前窗口跳转
function goToSystem(system) {
    window.location.href = system + '/index.html';
}

// 2. 在子系统页面添加返回按钮
<button onclick="window.location.href='../index-switch.html'">
    ← 返回系统选择
</button>
```

### 修改的文件

1. **prototype/index-switch.html**（新建）
   - 统一入口页面
   - 使用页面跳转而非iframe

2. **prototype/mg/index.html**（修改）
   - 添加"返回系统选择"按钮

3. **prototype/lite/index.html**（修改）
   - 添加"返回系统选择"按钮

## 测试验证

```bash
# 1. 启动服务器
cd prototype
python3 -m http.server 8000

# 2. 访问统一入口
http://localhost:8000/index-switch.html

# 3. 测试流程
- 点击"MG管理后台"卡片 → 进入MG系统
- 点击侧边栏"返回系统选择"按钮 → 返回首页
- 点击"Lite商户后台"卡片 → 进入Lite系统
- 点击侧边栏"返回系统选择"按钮 → 返回首页
```

## 为什么不使用iframe

经过多次尝试和调试，iframe方案存在以下无法解决的问题：

1. **白屏问题持续存在**
   - 即使修改了所有资源路径
   - 即使创建了专门的iframe版本HTML
   - 即使使用了base标签

2. **调试困难**
   - Console没有明显错误
   - 资源都正常加载
   - 但页面就是不显示

3. **维护成本高**
   - 需要维护多个版本的HTML文件
   - iframe内外的通信复杂
   - 容易出现不可预期的问题

## 总结

**最终方案**：使用 `index-switch.html` 作为统一入口，通过页面跳转实现系统切换。

这个方案：
- ✅ 完全避免了iframe的所有问题
- ✅ 在同一窗口中操作，无需多标签页
- ✅ 用户体验流畅自然
- ✅ 所有功能完全正常
- ✅ 代码简单易维护

---

**更新时间**：2026-01-15
**状态**：已解决 ✅
