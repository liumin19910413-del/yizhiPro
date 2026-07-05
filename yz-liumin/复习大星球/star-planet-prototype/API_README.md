# 课后小星球 MVP API

本原型已经接入本地 Fastify API + SQLite。

## 启动

```bash
npm run dev
```

- Web: http://127.0.0.1:5179/
- API: http://127.0.0.1:3333/
- SQLite: `storage/app.db`

## 当前已落地的数据表

- `users`
- `children`
- `textbook_packages`
- `textbook_units`
- `textbook_lessons`
- `knowledge_items`
- `question_bank`
- `child_subject_configs`
- `subject_progress`
- `daily_tasks`
- `task_submissions`
- `wrong_items`
- `reward_accounts`
- `reward_records`

## 当前接口

```text
GET  /api/health
GET  /api/tasks/today
GET  /api/textbook/lessons
POST /api/progress/check
POST /api/tasks/:taskKey/submit
GET  /api/reports/daily
```

## 已接入前端的动作

- 首页加载今日任务：`GET /api/tasks/today`
- 学校进度打卡：`POST /api/progress/check`
- 拼音答题提交：`POST /api/tasks/pinyin/submit`
- 生字卡片提交：`POST /api/tasks/chars/submit`
- 朗读提交：`POST /api/tasks/reading/submit`
- 错题宝箱提交：`POST /api/tasks/wrong/submit`

## 种子内容

当前种子内容为：

- 孩子：小星星
- 学科：语文
- 内容包：二年级下册语文示例内容包
- 当前课次：第一单元第 3 课《开满鲜花的小路》
- 任务：生字认读、拼音选择、朗读挑战、错题宝箱

后续可以继续把 `教材/人教版 语文 二年级下册.pdf` 结构化为完整内容包。
