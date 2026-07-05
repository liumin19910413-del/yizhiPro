require("dotenv").config();

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const AdmZip = require("adm-zip");
const mammoth = require("mammoth");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT || 3100);
const ROOT = __dirname;
const STORAGE_DIR = path.join(ROOT, "storage");
const UPLOAD_DIR = path.join(STORAGE_DIR, "uploads");
const EXTRACT_DIR = path.join(STORAGE_DIR, "extracted");
const DB_PATH = path.join(STORAGE_DIR, "data.db");

const TAG_LIBRARY = {
  "适用时机": ["日常", "活动", "节日", "新品", "清仓"],
  "内容形式": ["品牌宣传", "买家秀", "效果对比", "场景展示", "促销"],
  "语气风格": ["闺蜜种草", "促销强逼", "温情生活", "专业测评"],
  "核心卖点": ["省钱", "品质", "安全", "便捷", "大牌平替"],
  "目标人群": ["宝妈", "上班族", "家庭主妇", "泛人群"],
};

const TAG_IDS = {
  "日常": 1,
  "活动": 2,
  "节日": 3,
  "新品": 4,
  "清仓": 5,
  "品牌宣传": 6,
  "买家秀": 7,
  "效果对比": 8,
  "场景展示": 9,
  "促销": 10,
  "闺蜜种草": 11,
  "促销强逼": 12,
  "温情生活": 13,
  "专业测评": 14,
  "省钱": 15,
  "品质": 16,
  "安全": 17,
  "便捷": 18,
  "大牌平替": 19,
  "宝妈": 20,
  "上班族": 21,
  "家庭主妇": 22,
  "泛人群": 23,
};

const CN_NUM = {
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "七": 7,
  "八": 8,
  "九": 9,
  "十": 10,
};

const MOJIBAKE_PATTERN = /(?:Ã|Â|æ|ç|è|é|å|ï|¼|||||||||||||||||||||||||)/;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(EXTRACT_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 300 * 1024 * 1024 },
});

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  product_dir TEXT NOT NULL,
  spu_id INTEGER,
  spu_name TEXT,
  status TEXT NOT NULL DEFAULT 'parsed',
  created_by TEXT,
  created_at TEXT NOT NULL,
  uploaded_at TEXT
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  moments_no TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  spu_id INTEGER,
  spu_name TEXT,
  content TEXT NOT NULL,
  image_paths TEXT NOT NULL,
  image_urls TEXT,
  tag_names TEXT NOT NULL,
  tag_ids TEXT NOT NULL,
  publish_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  backend_material_id INTEGER,
  error_message TEXT,
  validation_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);
try {
  db.exec("CREATE INDEX IF NOT EXISTS idx_materials_fingerprint_status ON materials(fingerprint, status)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_materials_batch ON materials(batch_id)");
} catch (error) {
  // Older SQLite files created during local development may already have a different shape.
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  }),
);

function now() {
  const date = new Date();
  return `${dateTimeLocal(date)}:${pad2(date.getSeconds())}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dateOnlyLocal(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateTimeLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

const PUBLISH_TIME_OPTIONS = [
  ["10:00", "早上 10 点"],
  ["12:00", "中午 12 点"],
  ["20:00", "晚上 8 点"],
  ["22:00", "晚上 22 点"],
];

function normalizePublishTimes(value) {
  const values = Array.isArray(value) ? value : value ? [value] : ["12:00"];
  const allowed = new Set(PUBLISH_TIME_OPTIONS.map(([time]) => time));
  const normalized = unique(values).filter((time) => allowed.has(time));
  return normalized.length ? normalized : ["12:00"];
}

function publishTimeChoices(selected = ["12:00"]) {
  const selectedSet = new Set(selected);
  return `<div class="time-choice-grid">
    ${PUBLISH_TIME_OPTIONS.map(([value, label]) => `
      <label class="time-choice">
        <input type="checkbox" name="publishTimes" value="${value}" ${selectedSet.has(value) ? "checked" : ""}>
        <span>${label}</span>
        <small>${value}</small>
      </label>
    `).join("")}
  </div>`;
}

function decodeUploadName(name) {
  if (!name || !MOJIBAKE_PATTERN.test(name)) return name;
  try {
    const decoded = Buffer.from(name, "latin1").toString("utf8");
    return decoded.includes("�") ? name : decoded;
  } catch {
    return name;
  }
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(req, title, body) {
  const user = req.session.user;
  const isLogin = !user;
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body class="${isLogin ? "login-page" : "admin-page"}">
  ${isLogin ? `
    <main class="login-shell">${body}</main>
  ` : `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <strong>盛唐素材</strong>
          <span>朋友圈上传工具</span>
        </div>
        <nav class="side-nav" aria-label="后台导航">
          <a class="active" href="/">素材上传</a>
          <a href="/" aria-disabled="true">批次记录</a>
          <a href="/" aria-disabled="true">规则设置</a>
        </nav>
      </aside>
      <div class="admin-main">
        <header class="topbar">
          <div class="brand">
            <h1>${esc(title)}</h1>
            <p>上传产品素材包，解析文案与图片，预览后发布素材到供应链后台</p>
          </div>
          <div class="account-bar">
            <span>${esc(user.name)}</span>
            <a class="button ghost" href="/logout">退出</a>
          </div>
        </header>
        <main class="content-shell">${body}</main>
      </div>
    </div>
  `}
</body>
</html>`;
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }
  next();
}

function parseProductName(rawName) {
  const base = rawName.replace(/\.zip$/i, "");
  const match = base.match(/spu\s*[_ -]*id\s*[：: ]*\s*(\d+)/i) || base.match(/SPUID\s*[：: ]*\s*(\d+)/i);
  if (!match) return { spuId: null, spuName: base.trim().replaceAll(":", "/").replaceAll("：", "/") };
  const left = base.slice(0, match.index);
  const right = base.slice(match.index + match[0].length);
  let name = `${left}${right}`.replace(/^[\s:：\-_]+/, "").replace(/[\s:：\-_]+$/, "");
  name = name.replaceAll(":", "/").replaceAll("：", "/").replace(/\s{2,}/g, " ");
  return { spuId: Number(match[1]), spuName: name || base };
}

function cnToInt(value, fallback) {
  const v = String(value).trim();
  if (/^\d+$/.test(v)) return Number(v);
  if (CN_NUM[v]) return CN_NUM[v];
  if (v.startsWith("十") && v.length === 2) return 10 + (CN_NUM[v[1]] || 0);
  if (v.endsWith("十") && v.length === 2) return (CN_NUM[v[0]] || 1) * 10;
  if (v.includes("十") && v.length === 3) return (CN_NUM[v[0]] || 1) * 10 + (CN_NUM[v[2]] || 0);
  return fallback;
}

function safeExtract(zipPath, destDir) {
  const zip = new AdmZip(zipPath);
  for (const entry of zip.getEntries()) {
    const target = path.resolve(destDir, entry.entryName);
    if (!target.startsWith(path.resolve(destDir) + path.sep) && target !== path.resolve(destDir)) {
      throw new Error(`压缩包包含不安全路径：${entry.entryName}`);
    }
  }
  zip.extractAllTo(destDir, true);
}

async function findProductRoot(extractDir, zipOriginalName) {
  const entries = await fsp.readdir(extractDir, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith("__MACOSX"));
  const docxAtRoot = entries.some((entry) => entry.isFile() && entry.name.endsWith(".docx") && !entry.name.startsWith(".~"));
  if (docxAtRoot) return { dir: extractDir, displayName: zipOriginalName.replace(/\.zip$/i, "") };
  if (dirs.length === 1) return { dir: path.join(extractDir, dirs[0].name), displayName: dirs[0].name };
  const spuDir = dirs.find((entry) => /spu\s*id|spuid/i.test(entry.name));
  if (spuDir) return { dir: path.join(extractDir, spuDir.name), displayName: spuDir.name };
  throw new Error("压缩包根目录需要包含 Word，或只包含一个产品文件夹");
}

async function findDocx(productDir) {
  const files = await fsp.readdir(productDir);
  const docs = files.filter((file) => file.toLowerCase().endsWith(".docx") && !file.startsWith(".~"));
  if (!docs.length) throw new Error("产品目录中未找到 .docx 文案文件");
  const preferred = docs.filter((file) => ["文案", "朋友圈", "内容"].some((key) => file.includes(key)));
  return path.join(productDir, (preferred.length ? preferred : docs).sort((a, b) => a.length - b.length || a.localeCompare(b))[0]);
}

async function parseDocxSections(docxPath, productName) {
  const raw = await mammoth.extractRawText({ path: docxPath });
  const lines = raw.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let current = null;
  const headingPattern = /^(?:.*?朋友圈\s*([一二三四五六七八九十\d]+))\s*[：:]?$/;
  for (const line of lines) {
    const match = line.match(headingPattern);
    if (match && line.length <= Math.max(30, productName.length + 12)) {
      if (current) sections.push(current);
      const marker = match[1];
      current = {
        momentsNo: line.replace(/[：:]$/, ""),
        sortOrder: cnToInt(marker, sections.length + 1),
        lines: [],
        folderHint: "",
      };
      continue;
    }
    const folder = line.match(/^[（(]文件夹：(.+?)[）)]$/);
    if (folder && current) {
      current.folderHint = folder[1].trim();
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  if (!sections.length) throw new Error("Word 中没有识别到“朋友圈一/朋友圈1”这样的段落标题");
  return sections;
}

function naturalImageSort(a, b) {
  const pa = path.parse(a).name.split(/(\d+)/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
  const pb = path.parse(b).name.split(/(\d+)/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return a.localeCompare(b);
}

async function findImageFolder(productDir, section) {
  const dirs = (await fsp.readdir(productDir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  const candidates = [section.folderHint, section.momentsNo].filter(Boolean);
  for (const candidate of candidates) {
    const direct = path.join(productDir, candidate);
    if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;
    const fuzzy = dirs.find((dir) => candidate.includes(dir.name) || dir.name.includes(candidate));
    if (fuzzy) return path.join(productDir, fuzzy.name);
  }
  return path.join(productDir, section.folderHint || section.momentsNo);
}

async function hasImages(dirPath) {
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  try {
    const files = await fsp.readdir(dirPath);
    return files.some((file) => allowed.has(path.extname(file).toLowerCase()));
  } catch {
    return false;
  }
}

function folderSortKey(name) {
  const match = name.match(/朋友圈\s*([一二三四五六七八九十\d]+)/);
  if (match) return cnToInt(match[1], Number.MAX_SAFE_INTEGER);
  const number = name.match(/(\d+)/);
  return number ? Number(number[1]) : Number.MAX_SAFE_INTEGER;
}

async function listImageFolders(productDir) {
  const dirs = (await fsp.readdir(productDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "__MACOSX");
  const withImages = [];
  for (const dir of dirs) {
    const dirPath = path.join(productDir, dir.name);
    if (await hasImages(dirPath)) withImages.push({ name: dir.name, path: dirPath });
  }
  return withImages.sort((a, b) => {
    const ka = folderSortKey(a.name);
    const kb = folderSortKey(b.name);
    if (ka !== kb) return ka - kb;
    return naturalImageSort(a.name, b.name);
  });
}

async function inspectImages(folder) {
  if (!fs.existsSync(folder)) {
    return { upload: [], reference: [], sizeMb: 0, issues: ["图片文件夹不存在"] };
  }
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
  const files = (await fsp.readdir(folder))
    .filter((file) => allowed.has(path.extname(file).toLowerCase()))
    .sort(naturalImageSort)
    .map((file) => path.join(folder, file));
  const reference = files.filter((file) => {
    const name = path.basename(file);
    return name.startsWith("0") || ["效果图", "预览", "参考图"].some((key) => name.includes(key));
  });
  const uploadFiles = files.filter((file) => !reference.includes(file));
  const sizes = await Promise.all(uploadFiles.map((file) => fsp.stat(file)));
  const issues = [];
  if (!uploadFiles.length) issues.push("无可上传图片");
  if (uploadFiles.length > 9) issues.push(`上传图片${uploadFiles.length}张，超过后台最多9张`);
  const oversized = uploadFiles.filter((_, index) => sizes[index].size > 20 * 1024 * 1024).map((file) => path.basename(file));
  if (oversized.length) issues.push(`单图超过20MB：${oversized.join("、")}`);
  const stems = new Map();
  for (const file of uploadFiles) {
    const match = path.parse(file).name.match(/^(\d+)/);
    if (match) stems.set(match[1], [...(stems.get(match[1]) || []), path.basename(file)]);
  }
  const duplicated = [...stems.entries()].filter(([, names]) => names.length > 1).map(([num, names]) => `${num}(${names.join(",")})`);
  if (duplicated.length) issues.push(`同序号重复：${duplicated.join("；")}`);
  if (reference.length && files.length > 9 && uploadFiles.length <= 9) issues.push("已将参考图归为参考图，不计入上传图片");
  return {
    upload: uploadFiles,
    reference,
    sizeMb: Math.round((sizes.reduce((sum, stat) => sum + stat.size, 0) / 1024 / 1024) * 100) / 100,
    issues,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function inferTags(text) {
  const tags = {
    "适用时机": ["日常"],
    "内容形式": [],
    "语气风格": [],
    "核心卖点": [],
    "目标人群": ["泛人群"],
  };
  if (["活动", "限时", "秒杀", "下单", "优惠", "价格", "元"].some((key) => text.includes(key))) {
    tags["适用时机"].push("活动");
    tags["内容形式"].push("促销");
  }
  if (["新品", "上新", "新款"].some((key) => text.includes(key))) tags["适用时机"].push("新品");
  if (["爆品", "销量", "好评", "口碑", "复购", "值得信赖"].some((key) => text.includes(key))) {
    tags["内容形式"].push("品牌宣传");
    tags["核心卖点"].push("品质");
  }
  if (["对比", "市面", "大品牌", "平替", "性价比", "价格优势"].some((key) => text.includes(key))) {
    tags["内容形式"].push("效果对比");
    tags["核心卖点"].push("省钱", "大牌平替");
  }
  if (["认证", "证书", "成分", "专利", "专业", "功效", "菌群", "酵素"].some((key) => text.includes(key))) {
    tags["语气风格"].push("专业测评");
    tags["核心卖点"].push("安全");
  }
  if (["姐妹", "放心", "安心", "冲", "咱就是说", "宝子"].some((key) => text.includes(key))) tags["语气风格"].push("闺蜜种草");
  if (["自信", "日常", "早晚", "生活", "家庭", "口气", "笑容", "场景"].some((key) => text.includes(key))) {
    tags["内容形式"].push("场景展示");
    tags["核心卖点"].push("便捷");
  }
  if (["不容质疑", "真效果", "真实力", "准没错", "必须"].some((key) => text.includes(key))) tags["语气风格"].push("促销强逼");
  if (!tags["内容形式"].length) tags["内容形式"].push("场景展示");
  if (!tags["语气风格"].length) tags["语气风格"].push("闺蜜种草");
  if (!tags["核心卖点"].length) tags["核心卖点"].push("品质");
  for (const group of Object.keys(tags)) {
    tags[group] = unique(tags[group]).filter((tag) => TAG_LIBRARY[group].includes(tag));
  }
  return tags;
}

async function imageSignature(file) {
  const stat = await fsp.stat(file);
  return `${path.basename(file)}:${stat.size}`;
}

async function materialFingerprint({ spuId, content, images }) {
  const imageParts = await Promise.all(images.map(imageSignature));
  return crypto.createHash("sha256").update(JSON.stringify({ spuId, content, imageParts })).digest("hex");
}

async function parsePackage(zipFile, originalName, startDate, publishTimesInput) {
  const displayName = decodeUploadName(originalName);
  const batchToken = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const dest = path.join(EXTRACT_DIR, batchToken);
  await fsp.mkdir(dest, { recursive: true });
  safeExtract(zipFile, dest);
  const root = await findProductRoot(dest, displayName);
  const parsedProduct = parseProductName(root.displayName);
  const docx = await findDocx(root.dir);
  const sections = await parseDocxSections(docx, parsedProduct.spuName);
  const fallbackImageFolders = await listImageFolders(root.dir);
  const scheduleDate = startDate || dateOnlyLocal();
  const publishTimes = normalizePublishTimes(publishTimesInput);
  const rows = [];
  for (const [index, section] of sections.sort((a, b) => a.sortOrder - b.sortOrder).entries()) {
    let folder = await findImageFolder(root.dir, section);
    if (!fs.existsSync(folder) && fallbackImageFolders[index]) {
      folder = fallbackImageFolders[index].path;
    }
    const imageInfo = await inspectImages(folder);
    const content = section.lines.join("\n").trim();
    const tags = inferTags(content);
    const tagNames = Object.values(tags).flat();
    const time = publishTimes[index % publishTimes.length];
    const publish = new Date(`${scheduleDate}T${time}:00`);
    publish.setDate(publish.getDate() + Math.floor(index / publishTimes.length));
    const fingerprint = await materialFingerprint({ spuId: parsedProduct.spuId, content, images: imageInfo.upload });
    const existing = db.prepare("SELECT id, batch_id, status, backend_material_id FROM materials WHERE fingerprint = ? ORDER BY id ASC").get(fingerprint);
    const existingStatus = existing?.status === "uploaded" ? "duplicate" : existing ? "duplicate_pending" : null;
    rows.push({
      fingerprint,
      momentsNo: section.momentsNo,
      sortOrder: section.sortOrder,
      spuId: parsedProduct.spuId,
      spuName: parsedProduct.spuName,
      content,
      imagePaths: imageInfo.upload,
      referenceImages: imageInfo.reference,
      imageCount: imageInfo.upload.length,
      sizeMb: imageInfo.sizeMb,
      tagNames,
      tagIds: tagNames.map((tag) => TAG_IDS[tag]).filter(Boolean),
      publishAt: dateTimeLocal(publish),
      validationMessage: imageInfo.issues.length ? imageInfo.issues.join("；") : "图片数量、格式、大小均通过",
      status: existingStatus || (imageInfo.issues.some((issue) => issue.startsWith("图片文件夹不存在") || issue.startsWith("无可上传图片") || issue.startsWith("上传图片") || issue.startsWith("单图超过20MB")) ? "needs_fix" : "pending"),
      existing,
    });
  }
  return { extractDir: dest, productDir: root.dir, fileName: displayName, spuId: parsedProduct.spuId, spuName: parsedProduct.spuName, rows };
}

function rowsForBatch(batchId) {
  return db.prepare("SELECT * FROM materials WHERE batch_id = ? ORDER BY sort_order ASC, id ASC").all(batchId).map((row) => ({
    ...row,
    image_paths: JSON.parse(row.image_paths || "[]"),
    image_urls: JSON.parse(row.image_urls || "[]"),
    tag_names: JSON.parse(row.tag_names || "[]"),
    tag_ids: JSON.parse(row.tag_ids || "[]"),
  }));
}

function statusLabel(status) {
  if (status === "uploaded") return `<span class="status ok">已上传</span>`;
  if (status === "duplicate") return `<span class="status warn">已存在</span>`;
  if (status === "duplicate_pending") return `<span class="status warn">已在待传批次</span>`;
  if (status === "needs_fix") return `<span class="status bad">需处理</span>`;
  if (status === "failed") return `<span class="status bad">失败</span>`;
  return `<span class="status warn">待上传</span>`;
}

function pendingBatches() {
  return db.prepare(`
    SELECT
      b.id,
      b.spu_id,
      b.spu_name,
      b.file_name,
      b.created_by,
      b.created_at,
      COUNT(m.id) AS pending_count,
      MIN(m.publish_at) AS first_publish_at,
      MAX(m.publish_at) AS last_publish_at
    FROM batches b
    JOIN materials m ON m.batch_id = b.id
    WHERE m.status = 'pending'
    GROUP BY b.id
    ORDER BY b.id DESC
  `).all();
}

function duplicateSourceBatches(batchId) {
  return db.prepare(`
    SELECT
      source.batch_id AS batch_id,
      COUNT(*) AS match_count
    FROM materials current
    JOIN materials source
      ON source.fingerprint = current.fingerprint
      AND source.status = 'pending'
      AND source.batch_id <> current.batch_id
    WHERE current.batch_id = ?
      AND current.status = 'duplicate_pending'
    GROUP BY source.batch_id
    ORDER BY match_count DESC, source.batch_id ASC
  `).all(batchId);
}

function duplicateSourceForRow(row) {
  if (row.status !== "duplicate_pending") return null;
  return db.prepare(`
    SELECT batch_id
    FROM materials
    WHERE fingerprint = ?
      AND status = 'pending'
      AND batch_id <> ?
    ORDER BY id ASC
    LIMIT 1
  `).get(row.fingerprint, row.batch_id);
}

function taskSummary(batchId) {
  return db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) AS uploaded,
      SUM(CASE WHEN status = 'needs_fix' THEN 1 ELSE 0 END) AS needs_fix,
      SUM(CASE WHEN status IN ('duplicate', 'duplicate_pending') THEN 1 ELSE 0 END) AS duplicate,
      SUM(json_array_length(image_paths)) AS image_count,
      MIN(publish_at) AS first_publish_at,
      MAX(publish_at) AS last_publish_at
    FROM materials
    WHERE batch_id = ?
  `).get(batchId);
}

function taskTone(summary, sourceBatches = []) {
  if ((summary.needs_fix || 0) > 0) {
    return {
      className: "danger",
      eyebrow: "素材包需调整",
      title: "有素材没有通过检查",
      body: "请根据下方提示调整图片或文案后重新上传。",
    };
  }
  if ((summary.pending || 0) + (summary.failed || 0) > 0) {
    return {
      className: "ready",
      eyebrow: "检查通过",
      title: "发布素材到供应链后台",
      body: "文案、图片、发布时间和标签已生成，确认后即可发布到供应链后台。",
    };
  }
  if ((summary.uploaded || 0) > 0 && (summary.uploaded || 0) === (summary.total || 0)) {
    return {
      className: "success",
      eyebrow: "发布完成",
      title: "素材已发布",
      body: "下方可以查看每条素材的后台 ID。",
    };
  }
  if (sourceBatches.length || (summary.duplicate || 0) > 0) {
    return {
      className: "notice",
      eyebrow: "已处理过",
      title: "这批素材不需要重复创建",
      body: sourceBatches.length ? "请前往已有任务继续完成。" : "系统识别到这些素材已在其他任务中处理过。",
    };
  }
  return {
    className: "notice",
    eyebrow: "无需操作",
    title: "当前没有可发布素材",
    body: "可以返回工作台上传新的素材包。",
  };
}

function materialStatusLabel(status) {
  const labels = {
    pending: ["待创建", "warn"],
    failed: ["创建失败", "bad"],
    uploaded: ["已创建", "ok"],
    needs_fix: ["需调整", "bad"],
    duplicate_pending: ["已合并", "warn"],
    duplicate: ["后台已存在", "warn"],
  };
  const [label, tone] = labels[status] || ["待检查", "warn"];
  return `<span class="status ${tone}">${label}</span>`;
}

function stepper(activeStep) {
  const steps = [
    ["1", "上传素材包", "选择 ZIP 和发布时间"],
    ["2", "检查内容", "确认文案、图片、标签"],
    ["3", "发布素材", "发布到供应链后台"],
  ];
  return `<nav class="stepper" aria-label="素材上传步骤">
    ${steps.map(([number, title, desc], index) => {
      const state = number === String(activeStep) ? "active" : index + 1 < activeStep ? "done" : "";
      return `<div class="step ${state}">
        <span class="step-number">${number}</span>
        <div><strong>${title}</strong><small>${desc}</small></div>
      </div>`;
    }).join("")}
  </nav>`;
}

function batchTaskStatus(summary, sourceBatches = []) {
  if ((summary.needs_fix || 0) > 0) return materialStatusLabel("needs_fix");
  if ((summary.pending || 0) + (summary.failed || 0) > 0) return materialStatusLabel("pending");
  if ((summary.uploaded || 0) > 0 && (summary.uploaded || 0) === (summary.total || 0)) return materialStatusLabel("uploaded");
  if (sourceBatches.length || (summary.duplicate || 0) > 0) return `<span class="status warn">已合并</span>`;
  return `<span class="status warn">待检查</span>`;
}

function backendCreateConfig(req) {
  const sessionAuth = req?.session?.user || {};
  const missing = [];
  const hasBearer = Boolean(sessionAuth.scmBearerToken || process.env.SCM_BEARER_TOKEN);
  const hasBusinessToken = Boolean(sessionAuth.businessToken || process.env.SCM_BUSINESS_TOKEN);
  if (!hasBearer) missing.push("SCM 登录授权");
  if (!hasBusinessToken) missing.push("SCM 业务 token");
  return {
    ready: missing.length === 0,
    missing,
    source: sessionAuth.scmBearerToken && sessionAuth.businessToken ? "login" : "env",
  };
}

async function mgLogin(account, password) {
  if (process.env.DEV_LOGIN_BYPASS === "1") {
    return {
      token: "dev-login-bypass",
      user: {
        id: 0,
        name: account || "本地测试账号",
        roles: ["dev"],
      },
    };
  }
  const baseUrl = process.env.MG_CENTER_BASE_URL || "https://mg-cli.meimeifa.com";
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, password, includeZentaoToken: false }),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`MG 登录返回异常：${text.slice(0, 100)}`);
  }
  if (!response.ok || data.success === false || !data.token) {
    throw new Error(data.error || data.msg || "MG 登录失败");
  }
  return data;
}

function normalizeScmTokenResponse(raw, fallbackUser = {}) {
  const data = raw?.response || raw?.data || raw;
  const account = data?.account || {};
  const user = account.user || data?.user || fallbackUser.user || {};
  const entity = account.entity || data?.entity || fallbackUser.entity || {};
  const bearerToken = data?.token;
  const businessToken = account?.token || data?.mgToken || data?.businessToken;
  if (!bearerToken || !businessToken) {
    throw new Error("SCM 登录成功但未返回完整创建素材授权");
  }
  return {
    bearerToken,
    businessToken,
    accountId: user.id || fallbackUser.user?.id || process.env.SCM_ACCOUNT_ID || 715,
    accountName: user.name || entity.staffName || fallbackUser.user?.name || process.env.SCM_ACCOUNT_NAME || "技术部刘敏",
    user,
    entity,
  };
}

function capHash(seed, size) {
  function fnv1a(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }
  let state = fnv1a(seed);
  let output = "";
  while (output.length < size) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    output += (state >>> 0).toString(16).padStart(8, "0");
  }
  return output.slice(0, size);
}

function solvePow(salt, targetHex) {
  const target = Buffer.from(targetHex, "hex");
  let nonce = 0;
  while (true) {
    const digest = crypto.createHash("sha256").update(`${salt}${nonce}`).digest();
    if (digest.subarray(0, target.length).equals(target)) return nonce;
    nonce += 1;
  }
}

async function getScmCapToken() {
  const endpoint = "https://fc-cap.meimeifa.com/2cb6e9e9b0/";
  const challengeResponse = await fetch(`${endpoint}challenge`, { method: "POST" });
  const challengeData = await challengeResponse.json();
  if (!challengeResponse.ok || !challengeData.token || !challengeData.challenge) {
    throw new Error("获取 SCM 登录验证 challenge 失败");
  }
  let challenges;
  if (Array.isArray(challengeData.challenge)) {
    challenges = challengeData.challenge;
  } else {
    let index = 0;
    const { c, s, d } = challengeData.challenge;
    challenges = Array.from({ length: c }, () => {
      index += 1;
      return [capHash(`${challengeData.token}${index}`, s), capHash(`${challengeData.token}${index}d`, d)];
    });
  }
  const solutions = challenges.map(([salt, target]) => solvePow(salt, target));
  const redeemResponse = await fetch(`${endpoint}redeem`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: challengeData.token, solutions }),
  });
  const redeemData = await redeemResponse.json();
  if (!redeemResponse.ok || !redeemData.success || !redeemData.token) {
    throw new Error("生成 SCM 登录验证 token 失败");
  }
  return redeemData.token;
}

async function scmAccountTokenLogin(account, password) {
  if (process.env.DEV_LOGIN_BYPASS === "1") {
    return null;
  }
  const capToken = await getScmCapToken();
  const response = await fetch("https://api-yz-prd.meimeifa.com/api/ydj-profit-share/mg/dianshang/account/token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "origin": "https://scm.meimeifa.com",
      "referer": "https://scm.meimeifa.com/",
      "accept": "application/json, text/plain, */*",
    },
    body: JSON.stringify({
      account,
      password,
      capToken,
    }),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`SCM 登录返回异常：${text.slice(0, 100)}`);
  }
  if (!response.ok || data.code !== 1) {
    throw new Error(data.msg || data.message || "SCM 登录失败，暂不能获取创建素材授权");
  }
  return normalizeScmTokenResponse(data);
}

async function fullFlowLogin(account, password) {
  const mgData = await mgLogin(account, password);
  let scmAuth = null;
  let scmAuthError = "";
  try {
    scmAuth = await scmAccountTokenLogin(account, password);
  } catch (error) {
    scmAuthError = error.message;
  }
  if (!scmAuth && process.env.DEV_LOGIN_BYPASS !== "1" && process.env.ALLOW_PREVIEW_ONLY !== "1") {
    throw new Error(`MG 登录成功，但 SCM 创建素材授权获取失败：${scmAuthError || "未知错误"}`);
  }
  return { mgData, scmAuth, scmAuthError };
}

async function qiniuToken() {
  const response = await fetch("https://api-sy.meimeifa.com/common/qiniu/getToken");
  const data = await response.json();
  if (data.code !== 1 || !data.response?.token) throw new Error("获取七牛 token 失败");
  return data.response;
}

async function uploadToQiniu(filePath) {
  const tokenInfo = await qiniuToken();
  const ext = path.extname(filePath);
  const key = `lite-${Date.now()}-${crypto.randomBytes(6).toString("base64url")}${ext}`;
  const bytes = await fsp.readFile(filePath);
  const form = new FormData();
  form.append("token", tokenInfo.token);
  form.append("key", key);
  form.append("file", new Blob([bytes]), path.basename(filePath));
  const response = await fetch("https://upload-z2.qiniup.com/", { method: "POST", body: form });
  const data = await response.json();
  if (!response.ok || !data.key) throw new Error(`七牛上传失败：${JSON.stringify(data)}`);
  return `${tokenInfo.domain.replace(/\/$/, "")}/${data.key}`;
}

async function createBackendMaterial(material, userAuth = {}) {
  const bearer = userAuth.scmBearerToken || process.env.SCM_BEARER_TOKEN;
  const token = userAuth.businessToken || process.env.SCM_BUSINESS_TOKEN;
  if (!bearer || !token) throw new Error("当前登录态没有完整的 SCM 创建素材授权，请重新登录或检查账号权限");
  const imageUrls = [];
  for (const file of JSON.parse(material.image_paths)) {
    imageUrls.push(await uploadToQiniu(file));
  }
  const payload = {
    spu_id: material.spu_id,
    spu_name: material.spu_name,
    content: material.content,
    images: imageUrls,
    publish_at: `${material.publish_at}:00`,
    tag_ids: JSON.parse(material.tag_ids || "[]"),
    account_id: Number(userAuth.accountId || process.env.SCM_ACCOUNT_ID || 715),
    account_name: userAuth.accountName || process.env.SCM_ACCOUNT_NAME || "技术部刘敏",
    token,
  };
  const response = await fetch("https://api-yz-prd.meimeifa.com/api/ydj-profit-share/mg/dianshang/sns-material/create", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${bearer}`,
      "content-type": "application/json",
      "origin": "https://scm.meimeifa.com",
      "referer": "https://scm.meimeifa.com/",
      "accept": "application/json, text/plain, */*",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (data.code !== 1) throw new Error(data.msg || JSON.stringify(data));
  return { id: data.response?.id, imageUrls };
}

app.get("/login", (req, res) => {
  res.send(layout(req, "登录", `
    <section class="panel login">
      <h2>MG 账号登录</h2>
      ${process.env.DEV_LOGIN_BYPASS === "1" ? `<div class="dev-banner">本地测试模式：已开启 DEV_LOGIN_BYPASS，任意账号密码可进入；部署时不要开启。</div>` : ""}
      ${req.query.error ? `<div class="alert">${esc(req.query.error)}</div>` : ""}
      <form method="post" action="/login">
        <label>账号</label>
        <input name="account" type="text" autocomplete="username" required>
        <div style="height:12px"></div>
        <label>密码</label>
        <input name="password" type="password" autocomplete="current-password" required>
        <div class="actions">
          <button type="submit">登录</button>
        </div>
      </form>
    </section>
  `));
});

app.post("/login", async (req, res) => {
  try {
    const { mgData, scmAuth, scmAuthError } = await fullFlowLogin(req.body.account, req.body.password);
    req.session.user = {
      id: scmAuth?.accountId || mgData.user?.id,
      name: scmAuth?.accountName || mgData.user?.name || req.body.account,
      roles: mgData.user?.roles || [],
      token: mgData.token,
      scmBearerToken: scmAuth?.bearerToken || "",
      businessToken: scmAuth?.businessToken || "",
      accountId: scmAuth?.accountId || mgData.user?.id,
      accountName: scmAuth?.accountName || mgData.user?.name || req.body.account,
      scmAuthReady: Boolean(scmAuth),
      scmAuthError,
    };
    res.redirect("/");
  } catch (error) {
    res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/", requireLogin, (req, res) => {
  const batches = db.prepare("SELECT * FROM batches ORDER BY id DESC LIMIT 20").all();
  const pendingBatchRows = pendingBatches();
  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'uploaded' THEN 1 ELSE 0 END) AS uploaded,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status IN ('duplicate', 'duplicate_pending') THEN 1 ELSE 0 END) AS duplicate
    FROM materials
  `).get();
  const createConfig = backendCreateConfig(req);
  res.send(layout(req, "素材上传", `
    ${createConfig.ready ? "" : `<div class="notice-strip">当前账号还没有拿到创建授权：${esc(req.session.user.scmAuthError || createConfig.missing.join(" / "))}。可以先检查素材包，创建前需要重新登录或检查账号权限。</div>`}
    ${stepper(1)}
    <section class="wizard-grid">
      <div class="wizard-main">
        <section class="panel upload-panel">
          <span class="eyebrow">步骤 1</span>
          <h2>上传产品素材包</h2>
          <p class="lead">选择运营整理好的 ZIP。系统下一步会自动检查文案、图片、标签和发布时间。</p>
          <form method="post" action="/upload" enctype="multipart/form-data">
            <div class="stacked-form">
              <div>
                <label>素材包</label>
                <input class="file-input" type="file" name="package" accept=".zip" required>
              </div>
              <div>
                <label>从哪天开始发布</label>
                <input type="date" name="startDate" value="${dateOnlyLocal()}">
              </div>
              <div>
                <label>发布的时间点</label>
                ${publishTimeChoices(["12:00"])}
                <p class="form-help">可多选。系统会按素材顺序轮流使用这些时间点，排满后自动进入下一天。</p>
              </div>
            </div>
            <div class="hint-box">
              <strong>素材包格式</strong>
              <span>一个产品一个 ZIP，文件名建议包含 SPU ID，例如：<span class="mono">SPUID：316 产品名称.zip</span></span>
            </div>
            <div class="actions"><button type="submit">下一步：检查素材</button></div>
          </form>
        </section>
      </div>
      <aside class="wizard-side">
        <section class="panel compact-panel">
          <h2>继续上次任务</h2>
          <p class="note">检查通过但还没创建的任务会出现在这里。</p>
          <div class="mini-task-list">
            ${pendingBatchRows.slice(0, 4).map((batch) => `
              <a class="mini-task" href="/batches/${batch.id}">
                <strong>${esc(batch.spu_name)}</strong>
                <span>${batch.pending_count} 条待创建 · ${esc(batch.first_publish_at)}</span>
              </a>
            `).join("") || `<div class="empty-state compact">暂无待创建任务</div>`}
          </div>
        </section>
        <section class="panel compact-panel">
          <h2>素材概览</h2>
          <div class="side-stats">
            <div><strong>${counts.pending || 0}</strong><span>待创建</span></div>
            <div><strong>${counts.uploaded || 0}</strong><span>已创建</span></div>
            <div><strong>${counts.duplicate || 0}</strong><span>已合并</span></div>
          </div>
        </section>
      </aside>
    </section>
    <details class="history-details">
      <summary>查看最近任务</summary>
      <section class="panel">
        <table>
          <thead><tr><th>任务</th><th>产品</th><th>SPU ID</th><th>状态</th><th>创建人</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            ${batches.map((batch) => {
              const summary = taskSummary(batch.id);
              const sources = duplicateSourceBatches(batch.id);
              return `
              <tr>
                <td>#${batch.id}</td>
                <td>${esc(batch.spu_name)}</td>
                <td>${esc(batch.spu_id || "")}</td>
                <td>${batchTaskStatus(summary, sources)}</td>
                <td>${esc(batch.created_by)}</td>
                <td>${esc(batch.created_at)}</td>
                <td><a href="/batches/${batch.id}">查看任务</a></td>
              </tr>
            `;
            }).join("") || `<tr><td colspan="7" class="note">还没有上传记录</td></tr>`}
          </tbody>
        </table>
      </section>
    </details>
  `));
});

app.post("/upload", requireLogin, upload.single("package"), async (req, res) => {
  try {
    if (!req.file) throw new Error("请上传 zip 文件");
    const parsed = await parsePackage(req.file.path, req.file.originalname, req.body.startDate, req.body.publishTimes);
    const createdAt = now();
    const batch = db.prepare(`
      INSERT INTO batches (file_name, product_dir, spu_id, spu_name, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(parsed.fileName, parsed.productDir, parsed.spuId, parsed.spuName, "parsed", req.session.user.name, createdAt);
    const insertMaterial = db.prepare(`
      INSERT INTO materials (
        batch_id, fingerprint, moments_no, sort_order, spu_id, spu_name, content,
        image_paths, image_urls, tag_names, tag_ids, publish_at, status,
        validation_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const row of parsed.rows) {
      const existingUploaded = db.prepare("SELECT backend_material_id FROM materials WHERE fingerprint = ? AND status = 'uploaded' LIMIT 1").get(row.fingerprint);
      const status = existingUploaded ? "duplicate" : row.status;
      insertMaterial.run(
        batch.lastInsertRowid,
        row.fingerprint,
        row.momentsNo,
        row.sortOrder,
        row.spuId,
        row.spuName,
        row.content,
        JSON.stringify(row.imagePaths),
        JSON.stringify([]),
        JSON.stringify(row.tagNames),
        JSON.stringify(row.tagIds),
        row.publishAt,
        status,
        row.validationMessage,
        createdAt,
        createdAt,
      );
    }
    res.redirect(`/batches/${batch.lastInsertRowid}`);
  } catch (error) {
    res.send(layout(req, "解析失败", `<div class="alert">${esc(error.message)}</div><a class="button secondary" href="/">返回上传</a>`));
  }
});

app.get("/batches/:id", requireLogin, (req, res) => {
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id);
  if (!batch) {
    res.status(404).send(layout(req, "未找到", `<div class="alert">批次不存在</div>`));
    return;
  }
  const rows = rowsForBatch(batch.id);
  const summary = taskSummary(batch.id);
  const uploadable = rows.filter((row) => row.status === "pending" || row.status === "failed").length;
  const sourceBatches = duplicateSourceBatches(batch.id);
  const tone = taskTone(summary, sourceBatches);
  const createConfig = backendCreateConfig(req);
  const canCreate = uploadable > 0 && createConfig.ready;
  const activeStep = (summary.uploaded || 0) > 0 && (summary.uploaded || 0) === (summary.total || 0) ? 3 : 2;
  res.send(layout(req, "任务详情", `
    ${stepper(activeStep)}
    <section class="result-hero ${tone.className}">
      <div>
        <span class="eyebrow">${esc(tone.eyebrow)}</span>
        <h2>${esc(tone.title)}</h2>
        <p>${esc(tone.body)}</p>
      </div>
      <div class="actions hero-actions">
        <a class="button secondary" href="/">返回工作台</a>
        ${sourceBatches[0] ? `<a class="button" href="/batches/${sourceBatches[0].batch_id}">去已有任务继续创建</a>` : ""}
        ${uploadable > 0 ? `<form method="post" action="/batches/${batch.id}/create"><button type="submit" ${canCreate ? "" : "disabled"}>${summary.failed ? "重试失败项" : "发布素材到供应链后台"}（${uploadable}）</button></form>` : ""}
      </div>
    </section>
    ${createConfig.ready ? "" : `<div class="notice-strip">当前账号缺少创建授权：${esc(req.session.user.scmAuthError || createConfig.missing.join(" / "))}。重新登录后可继续创建，已检查的素材不会丢。</div>`}
    ${sourceBatches.length ? `<div class="notice-strip">这批素材已合并到已有任务：${sourceBatches.map((source) => `<a href="/batches/${source.batch_id}">任务 #${source.batch_id}（${source.match_count} 条）</a>`).join("、")}。当前任务不会重复创建。</div>` : ""}
    <section class="panel wizard-card">
      <div class="section-head">
        <div>
          <span class="eyebrow">步骤 ${activeStep}</span>
          <h2>${activeStep === 3 ? "发布结果" : "检查结果"}</h2>
          <p>${esc(batch.spu_name)}</p>
        </div>
      </div>
      <div class="summary-grid">
        <div><strong>${summary.total || 0}</strong><span>识别素材</span></div>
        <div><strong>${summary.image_count || 0}</strong><span>图片总数</span></div>
        <div><strong>${summary.pending || 0}</strong><span>待创建</span></div>
        <div><strong>${summary.failed || 0}</strong><span>发布失败</span></div>
      </div>
      <div class="check-summary">
        <div><strong>产品</strong><span>SPU ID：${esc(batch.spu_id || "未识别")}</span></div>
        <div><strong>发布时间</strong><span>${esc(summary.first_publish_at || "-")} 至 ${esc(summary.last_publish_at || "-")}</span></div>
        <div><strong>素材包</strong><span>${esc(batch.file_name)}</span></div>
      </div>
    </section>
    <section class="panel material-detail-panel">
      <div class="section-head">
        <div>
          <h2>素材明细</h2>
          <p>逐条确认发布时间、文案、图片和标签。</p>
        </div>
      </div>
        <table>
          <thead><tr><th>状态</th><th>朋友圈</th><th>发布时间</th><th>文案</th><th>图片</th><th>标签</th><th>结果</th></tr></thead>
          <tbody>
            ${rows.map((row) => {
              const duplicateSource = duplicateSourceForRow(row);
              return `
              <tr>
                <td>${materialStatusLabel(row.status)}</td>
                <td>${esc(row.moments_no)}</td>
                <td>${esc(row.publish_at)}</td>
                <td class="copy">${esc(row.content)}</td>
                <td>${row.image_paths.length} 张<br><span class="note">${esc(row.validation_message)}</span></td>
                <td><div class="chips">${row.tag_names.map((tag) => `<span class="chip">${esc(tag)}</span>`).join("")}</div></td>
                <td>${row.backend_material_id ? `后台 ID：#${row.backend_material_id}` : ""}${duplicateSource ? `<a href="/batches/${duplicateSource.batch_id}">已在任务 #${duplicateSource.batch_id} 待创建</a>` : ""}${row.error_message ? `<div class="inline-error">${esc(row.error_message)}</div>` : ""}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
    </section>
  `));
});

app.post("/batches/:id/create", requireLogin, async (req, res) => {
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id);
  if (!batch) {
    res.status(404).send(layout(req, "未找到", `<div class="alert">批次不存在</div>`));
    return;
  }
  const createConfig = backendCreateConfig(req);
  if (!createConfig.ready) {
    res.redirect(`/batches/${batch.id}`);
    return;
  }
  const pending = db.prepare("SELECT * FROM materials WHERE batch_id = ? AND status IN ('pending', 'failed') ORDER BY sort_order ASC").all(batch.id);
  for (const material of pending) {
    try {
      const result = await createBackendMaterial(material, req.session.user);
      db.prepare(`
        UPDATE materials
        SET status = 'uploaded', backend_material_id = ?, image_urls = ?, error_message = NULL, updated_at = ?
        WHERE id = ?
      `).run(result.id || null, JSON.stringify(result.imageUrls), now(), material.id);
    } catch (error) {
      db.prepare("UPDATE materials SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?").run(error.message, now(), material.id);
    }
  }
  db.prepare("UPDATE batches SET status = 'processed', uploaded_at = ? WHERE id = ?").run(now(), batch.id);
  res.redirect(`/batches/${batch.id}`);
});

app.listen(PORT, () => {
  console.log(`Moments uploader running at http://localhost:${PORT}`);
});
