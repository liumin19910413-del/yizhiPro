# 伊智精选供应链系统 - 原型部署

这是一个静态部署版本，可以直接部署到任何静态网页服务器。

## 访问方式

1. **主入口**: 打开 `index.html` 可以看到系统导航页面
2. **平台后台**: `admin/index.html`
3. **消费者商城**: `mall/index.html`
4. **商户后台(新)**: `merchant-vue/dist/index.html`

## 切换端口功能

- 平台后台 → 切换端口 → 商户后台/消费者商城
- 商户后台 → 切换端口 → 平台后台/消费者商城
- 消费者商城 → 切换端口 → 平台后台/商户后台

## 部署说明

可以将整个 `deploy` 文件夹部署到任意静态网页服务器（如 Nginx、Apache、GitHub Pages 等）。

### 本地预览

可以使用 Python 快速启动本地服务器：

```bash
cd deploy
python3 -m http.server 8080
```

然后访问 http://localhost:8080