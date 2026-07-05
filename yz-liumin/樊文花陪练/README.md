# 多品牌陪练成长报告 H5

面向企业微信员工陪练场景的通用 H5 报告页。页面通过 `oneId` 读取智能体记忆接口，动态展示品牌配置、知识地图、模块进度、历史报告、五维能力、复盘建议，并支持复制复练口令回到企微继续练习。

## 技术栈

- Vue 3
- Vite
- TypeScript
- 纯 CSS 移动端 H5

## 本地启动

```bash
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:5178/#demo
```

## 接入旧 memory 接口

页面默认沿用头道汤旧报告页的数据入口：

```text
GET https://yz-fc.meimeifa.com/dify/api/public/user/memory/{oneId}
```

真实员工报告访问方式：

```text
https://你的报告页域名/#307:xxxx
```

页面会从 URL hash 中读取 `oneId`，然后请求 memory API。

也可以临时指定 memory API：

```text
https://你的报告页域名/#307:xxxx?memoryApi=https://your-domain/user/memory/
```

## 推荐数据结构

未来多品牌开放时，建议智能体在 `userProfile` 中写入：

```json
{
  "brandConfig": {
    "brandName": "樊文花",
    "reportTitle": "陪练成长报告",
    "primaryColor": "#159A86",
    "accentColor": "#F0795C",
    "passScore": 80,
    "modules": [
      { "id": "new_customer", "name": "新客接待与需求挖掘", "order": 1, "passScore": 80 }
    ],
    "dimensions": [
      { "id": "need", "name": "需求挖掘", "max": 20 }
    ]
  },
  "moduleProgress": {
    "new_customer": {
      "name": "新客接待与需求挖掘",
      "status": "not_pass",
      "bestScore": 76,
      "latestScore": 76,
      "practiceCount": 2
    }
  },
  "practiceHistory": []
}
```

如果没有新版字段，页面会尝试兼容旧字段：

- `knowledgeMap`
- `newFiveDimHistory`
- `practiceHistory`
- `dimensionScores`
- `weaknesses`
- `improvements`
- `latestScore`

## 构建部署

```bash
npm run build
```

将 `dist/` 部署到 Nginx、对象存储 CDN 或任意静态站点服务即可。

上线后把智能体提示词中的报告链接改为：

```text
https://你的报告页域名/#{完整oneId}
```
