import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const storageDir = join(rootDir, "storage");
const dbPath = join(storageDir, "app.db");

mkdirSync(storageDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      parent_user_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      grade TEXT NOT NULL,
      semester TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (parent_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS textbook_packages (
      id TEXT PRIMARY KEY,
      package_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      stage TEXT NOT NULL,
      grade TEXT NOT NULL,
      semester TEXT NOT NULL,
      subject TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      copyright_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS textbook_units (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      unit_no INTEGER NOT NULL,
      title TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (package_id) REFERENCES textbook_packages(id)
    );

    CREATE TABLE IF NOT EXISTS textbook_lessons (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      lesson_no TEXT NOT NULL,
      title TEXT NOT NULL,
      lesson_type TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (package_id) REFERENCES textbook_packages(id),
      FOREIGN KEY (unit_id) REFERENCES textbook_units(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      item_type TEXT NOT NULL,
      content TEXT NOT NULL,
      pinyin TEXT,
      explanation TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES textbook_lessons(id)
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      knowledge_item_id TEXT,
      question_type TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      stem TEXT NOT NULL,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      analysis TEXT,
      auto_gradable INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES textbook_lessons(id)
    );

    CREATE TABLE IF NOT EXISTS child_subject_configs (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      package_id TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (package_id) REFERENCES textbook_packages(id)
    );

    CREATE TABLE IF NOT EXISTS subject_progress (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      package_id TEXT NOT NULL,
      current_unit_id TEXT NOT NULL,
      current_lesson_id TEXT NOT NULL,
      confirmed_by TEXT NOT NULL,
      confirmed_at TEXT NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id)
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      package_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      task_date TEXT NOT NULL,
      task_key TEXT NOT NULL,
      task_type TEXT NOT NULL,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      total_steps INTEGER NOT NULL,
      completed_steps INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      reward_stars INTEGER NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      UNIQUE(child_id, task_date, task_key),
      FOREIGN KEY (child_id) REFERENCES children(id)
    );

    CREATE TABLE IF NOT EXISTS task_submissions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      child_id TEXT NOT NULL,
      submission_type TEXT NOT NULL,
      answer_data TEXT NOT NULL,
      is_correct INTEGER,
      status TEXT NOT NULL,
      parent_comment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES daily_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS wrong_items (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      package_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_content TEXT NOT NULL,
      question_id TEXT,
      wrong_count INTEGER NOT NULL,
      mastery_status TEXT NOT NULL,
      next_review_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reward_accounts (
      child_id TEXT PRIMARY KEY,
      stars_total INTEGER NOT NULL,
      stars_available INTEGER NOT NULL,
      water INTEGER NOT NULL,
      sunshine INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      tree_level INTEGER NOT NULL,
      streak_days INTEGER NOT NULL,
      FOREIGN KEY (child_id) REFERENCES children(id)
    );

    CREATE TABLE IF NOT EXISTS reward_records (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_count INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function seed() {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get("demo-parent");
  if (existing) return;

  const createdAt = now();
  const parentId = "user_demo_parent";
  const childId = "child_demo";
  const packageId = "pkg_chinese_2b_demo";
  const unitId = "unit_chinese_2b_1";
  const lessonIds = ["lesson_2b_1", "lesson_2b_2", "lesson_2b_3", "lesson_2b_4"];

  const insertUser = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
  const insertChild = db.prepare("INSERT INTO children VALUES (?, ?, ?, ?, ?, ?)");
  const insertPackage = db.prepare("INSERT INTO textbook_packages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const insertUnit = db.prepare("INSERT INTO textbook_units VALUES (?, ?, ?, ?, ?)");
  const insertLesson = db.prepare("INSERT INTO textbook_lessons VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertKnowledge = db.prepare("INSERT INTO knowledge_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const insertQuestion = db.prepare("INSERT INTO question_bank VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const insertConfig = db.prepare("INSERT INTO child_subject_configs VALUES (?, ?, ?, ?, ?, ?)");
  const insertProgress = db.prepare("INSERT INTO subject_progress VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertReward = db.prepare("INSERT INTO reward_accounts VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

  const tx = db.transaction(() => {
    insertUser.run(parentId, "demo-parent", "星球家长", "parent", createdAt);
    insertChild.run(childId, parentId, "小星星", "2", "下册", createdAt);
    insertPackage.run(
      packageId,
      "chinese_2b_demo",
      "二年级下册语文示例内容包",
      "小学",
      "2",
      "下册",
      "chinese",
      "人教版/统编版",
      "内测",
      "内部测试",
      createdAt,
    );
    insertUnit.run(unitId, packageId, 1, "第一单元·阅读", 1);
    [
      ["1", "古诗二首", "阅读", 1, { poems: ["咏柳", "村居"] }],
      ["2", "找春天", "阅读", 2, {}],
      ["3", "开满鲜花的小路", "阅读", 3, {}],
      ["4", "邓小平爷爷植树", "阅读", 4, {}],
    ].forEach((lesson, index) => {
      insertLesson.run(lessonIds[index], packageId, unitId, lesson[0], lesson[1], lesson[2], lesson[3], JSON.stringify(lesson[4]));
    });

    [
      ["ki_you", "生字", "邮", "you", "邮递、邮局", 1],
      ["ki_di", "生字", "递", "di", "邮递、传递", 2],
      ["ki_guo", "生字", "裹", "guo", "包裹", 3],
      ["ki_ju", "生字", "局", "ju", "邮局", 4],
      ["ki_lou", "生字", "漏", "lou", "遗漏、漏掉", 5],
      ["ki_xian", "词语", "鲜花", null, "开满鲜花的小路", 6],
    ].forEach((item) => {
      insertKnowledge.run(item[0], packageId, unitId, lessonIds[2], "chinese", item[1], item[2], item[3], item[4], "{}", item[5]);
    });

    [
      ["q_guo_pinyin", "看字选拼音", "“裹”的正确读音是？", ["guo", "guǒ", "ke"], "guǒ", "ki_guo"],
      ["q_lou_pinyin", "看字选拼音", "“漏”的正确读音是？", ["lòu", "liù", "lǒu"], "lòu", "ki_lou"],
      ["q_you_word", "生字组词", "“邮”可以组成哪个词？", ["邮局", "水果", "春风"], "邮局", "ki_you"],
    ].forEach((question, index) => {
      insertQuestion.run(
        question[0],
        packageId,
        "chinese",
        unitId,
        lessonIds[2],
        question[5],
        question[1],
        index === 2 ? 2 : 1,
        question[2],
        JSON.stringify(question[3]),
        JSON.stringify(question[4]),
        "答错后进入错题宝箱，后续复习继续回收。",
        1,
        "active",
        createdAt,
      );
    });

    insertConfig.run("cfg_demo_chinese", childId, "chinese", packageId, 1, createdAt);
    insertProgress.run("progress_demo_chinese", childId, "chinese", packageId, unitId, lessonIds[2], "child", createdAt);
    insertReward.run(childId, 128, 128, 8, 0, 0, 2, 3);
  });

  tx();
  ensureTodayTasks(childId);
}

export function ensureTodayTasks(childId = "child_demo") {
  const progress = db.prepare(`
    SELECT sp.*, tp.id AS package_id, tl.unit_id AS unit_id, tl.id AS lesson_id
    FROM subject_progress sp
    JOIN textbook_lessons tl ON tl.id = sp.current_lesson_id
    JOIN textbook_packages tp ON tp.id = sp.package_id
    WHERE sp.child_id = ? AND sp.subject = 'chinese'
  `).get(childId);

  if (!progress) return;

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO daily_tasks (
      id, child_id, subject, package_id, unit_id, lesson_id, task_date, task_key,
      task_type, source_type, title, estimated_minutes, total_steps, completed_steps,
      status, reward_stars, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const taskDate = today();
  const taskDefs = [
    ["chars", "cards", "延迟复习", "生字认读", 3, 4, 4, "done", 3, { items: ["邮", "递", "裹", "局"] }],
    ["pinyin", "quiz", "延迟复习", "拼音选择", 3, 2, 1, "progress", 4, { questionIds: ["q_guo_pinyin", "q_lou_pinyin"] }],
    ["reading", "reading", "朗读任务", "朗读挑战", 4, 1, 0, "idle", 3, { text: "鼹鼠先生路过刺猬太太家，正巧，刺猬太太走出门。" }],
    ["wrong", "wrong", "错题巩固", "错题宝箱", 5, 1, 0, "idle", 2, {}],
  ];

  taskDefs.forEach((task) => {
    insertTask.run(
      id("task"),
      childId,
      "chinese",
      progress.package_id,
      progress.unit_id,
      progress.lesson_id,
      taskDate,
      task[0],
      task[1],
      task[2],
      task[3],
      task[4],
      task[5],
      task[6],
      task[7],
      task[8],
      JSON.stringify(task[9]),
      now(),
    );
  });
}

export function getTodayPayload(childId = "child_demo") {
  ensureTodayTasks(childId);

  const child = db.prepare("SELECT * FROM children WHERE id = ?").get(childId);
  const progress = db.prepare(`
    SELECT sp.*, tl.lesson_no, tl.title AS lesson_title, tu.title AS unit_title
    FROM subject_progress sp
    JOIN textbook_lessons tl ON tl.id = sp.current_lesson_id
    JOIN textbook_units tu ON tu.id = tl.unit_id
    WHERE sp.child_id = ? AND sp.subject = 'chinese'
  `).get(childId);
  const rewards = db.prepare("SELECT * FROM reward_accounts WHERE child_id = ?").get(childId);
  const tasks = db.prepare(`
    SELECT * FROM daily_tasks
    WHERE child_id = ? AND task_date = ?
    ORDER BY CASE task_key
      WHEN 'chars' THEN 1
      WHEN 'pinyin' THEN 2
      WHEN 'reading' THEN 3
      WHEN 'wrong' THEN 4
      ELSE 99
    END
  `).all(childId, today()).map((task) => ({
    ...task,
    metadata: JSON.parse(task.metadata || "{}"),
    questions: task.task_key === "pinyin"
      ? db.prepare("SELECT id, stem, options, answer FROM question_bank WHERE id IN ('q_guo_pinyin', 'q_lou_pinyin')").all().map((question) => ({
          ...question,
          options: JSON.parse(question.options),
          answer: JSON.parse(question.answer),
        }))
      : [],
  }));
  const wrongItems = db.prepare("SELECT * FROM wrong_items WHERE child_id = ? AND mastery_status != '已掌握' ORDER BY updated_at DESC").all(childId);

  return {
    child,
    lesson: {
      id: progress.current_lesson_id,
      lessonNo: progress.lesson_no,
      title: progress.lesson_title,
      unitTitle: progress.unit_title,
      shortTitle: `第${progress.lesson_no}课《${progress.lesson_title}》`,
    },
    rewards: {
      stars: rewards.stars_total,
      water: rewards.water,
      streak: rewards.streak_days,
      treeLevel: rewards.tree_level,
    },
    tasks,
    wrongItems,
  };
}

export function updateProgress(lessonId, confirmedBy = "child", childId = "child_demo") {
  const lesson = db.prepare("SELECT * FROM textbook_lessons WHERE id = ?").get(lessonId);
  if (!lesson) {
    const error = new Error("Lesson not found");
    error.statusCode = 404;
    throw error;
  }

  db.prepare(`
    UPDATE subject_progress
    SET current_unit_id = ?, current_lesson_id = ?, confirmed_by = ?, confirmed_at = ?
    WHERE child_id = ? AND subject = 'chinese'
  `).run(lesson.unit_id, lesson.id, confirmedBy, now(), childId);

  return getTodayPayload(childId);
}

export function submitTask({ taskKey, submissionType, answerData, isCorrect }, childId = "child_demo") {
  const task = db.prepare(`
    SELECT * FROM daily_tasks
    WHERE child_id = ? AND task_date = ? AND task_key = ?
  `).get(childId, today(), taskKey);

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  const correctFlag = typeof isCorrect === "boolean" ? (isCorrect ? 1 : 0) : null;
  db.prepare("INSERT INTO task_submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id("sub"), task.id, childId, submissionType, JSON.stringify(answerData || {}), correctFlag, "通过", null, now());

  if (isCorrect === false && answerData?.question) {
    const existing = db.prepare(`
      SELECT * FROM wrong_items WHERE child_id = ? AND item_content = ?
    `).get(childId, answerData.question.stem);
    if (existing) {
      db.prepare("UPDATE wrong_items SET wrong_count = wrong_count + 1, mastery_status = '复习中', updated_at = ? WHERE id = ?")
        .run(now(), existing.id);
    } else {
      db.prepare("INSERT INTO wrong_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(
          id("wrong"),
          childId,
          "chinese",
          task.package_id,
          "题目",
          answerData.question.stem,
          answerData.question.id || null,
          1,
          "未掌握",
          null,
          now(),
          now(),
        );
    }
  }

  if (isCorrect !== false) {
    const nextCompleted = Math.min(task.completed_steps + 1, task.total_steps);
    const nextStatus = nextCompleted >= task.total_steps ? "done" : "progress";
    db.prepare("UPDATE daily_tasks SET completed_steps = ?, status = ? WHERE id = ?")
      .run(nextCompleted, nextStatus, task.id);

    db.prepare(`
      UPDATE reward_accounts
      SET stars_total = stars_total + ?, stars_available = stars_available + ?, water = water + ?
      WHERE child_id = ?
    `).run(1, 1, taskKey === "reading" ? 1 : 0, childId);

    db.prepare("INSERT INTO reward_records VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id("reward"), childId, "星星", 1, "任务提交", task.id, now());

    if (answerData?.fromWrong && answerData?.question?.stem) {
      db.prepare("UPDATE wrong_items SET mastery_status = '基本掌握', updated_at = ? WHERE child_id = ? AND item_content = ?")
        .run(now(), childId, answerData.question.stem);
    }
  }

  return getTodayPayload(childId);
}

export function getLessons() {
  return db.prepare(`
    SELECT id, lesson_no AS lessonNo, title
    FROM textbook_lessons
    WHERE package_id = 'pkg_chinese_2b_demo'
    ORDER BY sort_order
  `).all().map((lesson) => ({
    ...lesson,
    shortTitle: `第${lesson.lessonNo}课《${lesson.title}》`,
  }));
}

export function getDailyReport(childId = "child_demo") {
  const payload = getTodayPayload(childId);
  const completed = payload.tasks.filter((task) => task.status === "done").length;
  return {
    date: today(),
    childName: payload.child.nickname,
    completed,
    total: payload.tasks.length,
    lesson: payload.lesson.shortTitle,
    stars: payload.rewards.stars,
    weakPoint: payload.wrongItems.length ? "拼音辨认" : "暂无新增错题",
    tomorrowPlan: "第2课复习 + 错题回收",
    pendingConfirmations: payload.tasks.some((task) => task.task_key === "reading" && task.status === "done")
      ? ["朗读挑战待家长确认"]
      : [],
  };
}

migrate();
seed();
