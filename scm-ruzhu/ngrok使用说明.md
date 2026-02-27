# ngrok 临时远程访问配置说明

## 当前状态

- ✅ 本地服务器已启动：`http://localhost:8000`
- ⚠️ ngrok需要认证才能使用

## 配置步骤

### 1. 注册ngrok账号

访问：https://dashboard.ngrok.com/signup

使用邮箱或GitHub账号注册（免费）

### 2. 获取authtoken

注册后访问：https://dashboard.ngrok.com/get-started/your-authtoken

复制你的authtoken（类似：`2abc123def456ghi789jkl0mn`）

### 3. 配置authtoken

在终端运行：

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

例如：
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl0mn
```

### 4. 启动ngrok

```bash
ngrok http 8000
```

### 5. 获取公网URL

启动后会显示类似：

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:8000
```

复制这个URL，然后访问：

```
https://xxxx-xx-xx-xx-xx.ngrok-free.app/prototype/lite/index.html
```

## 快速访问

配置完成后，你可以通过以下URL访问：

- **Lite商户端**: `https://你的ngrok域名/prototype/lite/index.html`
- **MG管理端**: `https://你的ngrok域名/prototype/mg/index.html`
- **主入口**: `https://你的ngrok域名/prototype/index.html`

## 注意事项

1. **免费版限制**
   - 每次启动URL会变化
   - 有连接数限制
   - 会显示ngrok的警告页面（点击"Visit Site"继续）

2. **会话时长**
   - 免费版会话有时间限制
   - 如果断开，重新运行 `ngrok http 8000` 即可

3. **安全性**
   - URL是公开的，任何人都可以访问
   - 仅用于临时测试和演示
   - 不要在生产环境使用

## 替代方案

如果不想注册ngrok，可以使用其他方案：

### 方案A：本地访问（最简单）

```bash
# 本地服务器已在运行
# 直接访问
http://localhost:8000/prototype/lite/index.html
```

### 方案B：使用localtunnel（无需注册）

```bash
# 安装
npm install -g localtunnel

# 启动
lt --port 8000

# 会得到类似的URL
# https://xxxx.loca.lt/prototype/lite/index.html
```

### 方案C：使用serveo（无需安装）

```bash
ssh -R 80:localhost:8000 serveo.net

# 会得到类似的URL
# https://xxxx.serveo.net/prototype/lite/index.html
```

## 当前可用的访问方式

### 本地访问（推荐，已可用）

```
http://localhost:8000/prototype/lite/index.html
```

本地服务器已经在运行，你可以直接在浏览器中打开这个地址查看最新的修改。

## 最新修改内容

今天完成的修改：

1. ✅ 去掉申请编号字段
2. ✅ 简化入驻申请流程（去掉商户类型选择）
3. ✅ 简化编辑已拒绝申请流程
4. ✅ 修改拒绝原因文案
5. ✅ 优化分账设置弹窗：
   - 去掉品牌总部显示
   - 去掉"总分成比例未达到100%"提示
   - 去掉可用接收方列表的"状态"列

所有修改都可以在本地URL中查看和测试。
