# 朋友圈素材上传工具 MVP

一个给运营同事使用的轻量 Web 工具：上传单个产品素材 ZIP，系统解析 Word 文案、匹配图片文件夹、自动推荐标签与发布时间，预览确认后发布素材到供应链后台。

## 素材包规则

ZIP 里建议只有一个产品文件夹，产品文件夹名包含 SPU ID 和商品名：

```text
SPUID：3 : 持证美白+16小时清新口气，清新牙膏:美白牙膏可选
```

产品文件夹内包含：

- 一个 `.docx` 文案文件，标题使用 `朋友圈一`、`朋友圈二` 这类格式。
- 每条朋友圈对应一个图片文件夹，文件夹名和 Word 标题一致，或在标题下面写 `（文件夹：xxx）`。
- 图片支持 `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`，每条最多 9 张，单张不超过 20MB。

## 本地启动

```bash
npm install
cp .env.example .env
npm start
```

打开：

```text
http://localhost:3100
```

## 环境变量

```bash
PORT=3100
SESSION_SECRET=replace-with-a-long-random-string
MG_CENTER_BASE_URL=https://mg-cli.meimeifa.com
DEV_LOGIN_BYPASS=0
ALLOW_PREVIEW_ONLY=0

SCM_BEARER_TOKEN=
SCM_BUSINESS_TOKEN=
SCM_ACCOUNT_ID=715
SCM_ACCOUNT_NAME=技术部刘敏
```

- `MG_CENTER_BASE_URL`：MG 登录服务地址。
- 正常完整流程会在登录时自动换取 SCM 创建素材授权，不需要运营手工复制 token。
- `SCM_BEARER_TOKEN` / `SCM_BUSINESS_TOKEN`：只作为兜底配置；登录态没有拿到 SCM 授权时才使用。
- `DEV_LOGIN_BYPASS=1`：仅本地开发测试使用，部署给运营时不要开启。
- `ALLOW_PREVIEW_ONLY=1`：允许没有 SCM 创建授权时只进入解析预览；正式完整流程建议保持 `0`。

## 当前 MVP 能力

- MG 账号登录。
- 上传 ZIP 后自动解析产品、SPU ID、朋友圈文案、图片。
- 自动推荐发布时间：从页面选择开始日期和发布时间点，按素材顺序轮流排期；可选早上 10 点、中午 12 点、晚上 8 点、晚上 22 点。
- 自动推荐素材标签。
- 用文案、SPU ID、图片文件名和大小生成指纹，重复素材会标记为“已存在”。
- 登录拿到 SCM 授权后，可上传图片到七牛并调用素材创建接口。

## 后续建议

- 增加 SCM token 过期后的自动刷新或重新登录提示。
- 增加上传批次的删除/重试按钮。
- 增加 Dockerfile 或 PM2/systemd 部署脚本。
