import { demoViewModel } from "./mock";
import type {
  BrandConfig,
  DimensionScore,
  ImprovementItem,
  ModuleProgress,
  PracticeReport,
  ReportViewModel,
  ReviewItem,
  Status
} from "./types";

const DEFAULT_DIMENSIONS = [
  { id: "need", name: "需求挖掘", max: 20 },
  { id: "professional", name: "专业表达", max: 20 },
  { id: "friendly", name: "沟通亲和", max: 20 },
  { id: "objection", name: "异议处理", max: 20 },
  { id: "conversion", name: "转化推进", max: 20 }
];

const DEFAULT_MODULES = [
  { id: "brand_basic", name: "品牌与服务基础", order: 1, passScore: 80 },
  { id: "new_customer", name: "新客接待与需求挖掘", order: 2, passScore: 80 },
  { id: "skin_basic", name: "面部肌肤基础", order: 3, passScore: 80 },
  { id: "diagnosis", name: "面诊检测与问题分析", order: 4, passScore: 80 },
  { id: "basic_care", name: "基础护理项目推荐", order: 5, passScore: 80 },
  { id: "advanced_care", name: "功效护理项目推荐", order: 6, passScore: 80 },
  { id: "home_care", name: "产品搭配与居家护理", order: 7, passScore: 80 },
  { id: "objection", name: "异议处理与成交推进", order: 8, passScore: 80 }
];

const LEGACY_MODULES = [
  "企业文化",
  "接待流程",
  "头皮检测",
  "汤养体系",
  "头部专业",
  "引火归元",
  "蜂养减痛",
  "品项体系",
  "销售升单"
].map((name, index) => ({ id: `legacy_${index + 1}`, name, order: index + 1, passScore: 80 }));

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

function num(value: unknown, fallback = 0): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function statusFromScore(score: number, passScore: number): Status {
  if (score <= 0) return "not_started";
  return score >= passScore ? "passed" : "not_pass";
}

function normalizeStatus(value: unknown, score: number, passScore: number): Status {
  const raw = str(value);
  if (["passed", "not_pass", "locked", "not_started"].includes(raw)) return raw as Status;
  return statusFromScore(score, passScore);
}

function brandFromProfile(profile: UnknownRecord): BrandConfig {
  const config = asRecord(profile.brandConfig);
  const configuredModules = asArray<UnknownRecord>(config.modules).map((item, index) => ({
    id: str(item.id, `module_${index + 1}`),
    name: str(item.name, `模块${index + 1}`),
    order: num(item.order, index + 1),
    passScore: num(item.passScore, num(config.passScore, 80))
  }));
  const configuredDimensions = asArray<UnknownRecord>(config.dimensions).map((item, index) => ({
    id: str(item.id, `dim_${index + 1}`),
    name: str(item.name, `维度${index + 1}`),
    max: num(item.max, 20)
  }));
  const legacyKnowledge = asArray(profile.knowledgeMap);
  const modules = configuredModules.length ? configuredModules : legacyKnowledge.length ? LEGACY_MODULES : DEFAULT_MODULES;

  return {
    brandName: str(config.brandName ?? profile.brandName ?? profile.storeName, "樊文花"),
    reportTitle: str(config.reportTitle, "陪练成长报告"),
    slogan: str(config.slogan, "员工服务能力成长路径"),
    primaryColor: str(config.primaryColor, "#159A86"),
    accentColor: str(config.accentColor, "#F0795C"),
    passScore: num(config.passScore, 80),
    modules,
    dimensions: configuredDimensions.length ? configuredDimensions : DEFAULT_DIMENSIONS
  };
}

function normalizeModules(profile: UnknownRecord, brand: BrandConfig, reports: PracticeReport[]): ModuleProgress[] {
  const progress = asRecord(profile.moduleProgress);
  const legacyKnowledge = new Set(asArray(profile.knowledgeMap).map((item) => str(item)));

  return brand.modules
    .slice()
    .sort((a, b) => num(a.order) - num(b.order))
    .map((module, index) => {
      const byId = asRecord(progress[module.id]);
      const byName = asRecord(progress[module.name]);
      const item = Object.keys(byId).length ? byId : byName;
      const moduleReports = reports.filter((report) => report.moduleId === module.id || report.moduleName === module.name);
      const latestScore = num(item.latestScore, moduleReports[0]?.totalScore || 0);
      const bestScore = Math.max(num(item.bestScore, 0), ...moduleReports.map((report) => report.totalScore), legacyKnowledge.has(module.name) ? 80 : 0);
      const passedByLegacy = legacyKnowledge.has(module.name);
      const status = passedByLegacy
        ? "passed"
        : normalizeStatus(item.status, bestScore || latestScore, module.passScore || brand.passScore);
      const locked = index > 0 && !passedByLegacy && bestScore <= 0 && !moduleReports.length;

      return {
        id: module.id,
        name: str(item.name, module.name),
        status: locked ? "locked" : status,
        bestScore,
        latestScore,
        practiceCount: num(item.practiceCount ?? item.passCount, moduleReports.length)
      };
    });
}

function dimensionFromObject(dimensions: BrandConfig["dimensions"], source: unknown): DimensionScore[] {
  const record = asRecord(source);
  const rows = dimensions.map((dim) => ({
    id: dim.id,
    name: dim.name,
    score: num(record[dim.name] ?? record[dim.id], 0),
    max: dim.max
  }));
  return rows.sort((a, b) => a.score - b.score);
}

function reviewList(value: unknown, fallbackPrefix: string): ReviewItem[] {
  return asArray(value).slice(0, 4).map((item, index) => {
    if (typeof item === "string") return { quote: item, comment: fallbackPrefix };
    const record = asRecord(item);
    return {
      quote: str(record.quote ?? record.text ?? record.title ?? record.detail, `第${index + 1}条记录`),
      comment: str(record.comment ?? record.reason ?? record.detail, fallbackPrefix)
    };
  });
}

function improvementList(value: unknown): ImprovementItem[] {
  return asArray(value).slice(0, 3).map((item, index) => {
    if (typeof item === "string") return { title: `建议${index + 1}`, sample: item };
    const record = asRecord(item);
    return {
      title: str(record.title, `建议${index + 1}`),
      sample: str(record.sample ?? record.text ?? record.detail, "")
    };
  });
}

function completeImprovements(items: ImprovementItem[], weaknesses: ReviewItem[], moduleName: string): ImprovementItem[] {
  const completed = items.filter((item) => item.sample).slice(0, 3);
  const fallbackSamples = [
    {
      title: "先接住顾虑，再补专业解释",
      sample: "姐，你这个担心是对的。咱们先不急着做决定，我先把你现在的皮肤状态和适合的护理方式讲清楚。"
    },
    {
      title: "把适合原因说具体",
      sample: `你现在练的是${moduleName}，推荐时别只说项目好，要说清楚它为什么适合这位顾客当前的问题。`
    },
    {
      title: "推进时给顾客选择",
      sample: "如果你今天想先稳一点，可以先体验一次；觉得舒服、方向对了，再考虑后面的连续护理。"
    }
  ];
  for (const weakness of weaknesses) {
    if (completed.length >= 3) break;
    completed.push({
      title: "针对这句再具体一点",
      sample: `刚才“${weakness.quote}”这句可以再补一句原因，让顾客知道你不是硬推，而是在按她的问题给建议。`
    });
  }
  for (const fallback of fallbackSamples) {
    if (completed.length >= 3) break;
    completed.push(fallback);
  }
  return completed;
}

function normalizeReport(raw: UnknownRecord, index: number, profile: UnknownRecord, brand: BrandConfig): PracticeReport {
  const reportData = asRecord(raw.reportData);
  const base = Object.keys(reportData).length ? reportData : raw;
  const moduleName = str(base.module ?? base.moduleName ?? base.currentModule ?? base.topic, str(profile.currentModule, "新客接待与需求挖掘"));
  const module = brand.modules.find((item) => item.name === moduleName || item.id === str(base.moduleId)) || brand.modules[0];
  const score = num(base.ts ?? base.totalScore ?? base.score, num(profile.totalScore ?? profile.latestScore, 0));
  const date = str(base.dt ?? base.date, str(profile.lastPracticeDate, ""));
  const dimensions = dimensionFromObject(brand.dimensions, base.newFiveDim ?? base.dimensionScores ?? base);

  const weaknesses = reviewList(base.weaknesses ?? profile.weaknesses, "这里还可以说得更具体");
  const improvements = completeImprovements(improvementList(base.improvements ?? profile.improvements), weaknesses, moduleName);

  return {
    id: str(base.id ?? base.session ?? base.round, `report_${index}`),
    date: date || "最近一次",
    moduleId: str(base.moduleId, module?.id || `module_${index + 1}`),
    moduleName,
    scene: str(base.trainingScene ?? base.scene, str(profile.trainingScene, "-")),
    project: str(base.currentProject ?? base.project, str(profile.currentProject, "-")),
    customerType: str(base.customerType, str(profile.customerType, "-")),
    totalRounds: num(base.totalRounds, num(profile.roundIndex, 0)),
    totalScore: score,
    status: normalizeStatus(base.taskStatus ?? base.status, score, brand.passScore),
    dimensions,
    strengths: reviewList(base.strengths ?? base.conversationHighlights, "这句处理得不错"),
    weaknesses,
    improvements,
    nextTask: str(base.nextTask, score >= brand.passScore ? `继续解锁 ${brand.modules[index + 1]?.name || "下一模块"}` : `再练一次 ${moduleName}`),
    conversation: asArray<string>(base.conversation ?? profile.conversationLog)
  };
}

function reportsFromProfile(profile: UnknownRecord, brand: BrandConfig): PracticeReport[] {
  const reportData = asRecord(profile.reportData);
  const history = asArray<UnknownRecord>(profile.practiceHistory);
  const rows: UnknownRecord[] = Object.keys(reportData).length ? [reportData, ...history] : history;

  if (!rows.length && (profile.dimensionScores || profile.totalScore || profile.latestScore)) {
    rows.push(profile);
  }

  const reports = rows.map((row, index) => normalizeReport(row, index, profile, brand));
  return reports.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function toReportViewModel(profileInput: unknown, oneId: string, sourceMode: "live" | "demo"): ReportViewModel {
  const profile = asRecord(profileInput);
  const brand = brandFromProfile(profile);
  const reports = reportsFromProfile(profile, brand);

  if (!reports.length) {
    return { ...demoViewModel, sourceMode, oneId: oneId || demoViewModel.oneId };
  }

  const modules = normalizeModules(profile, brand, reports);
  const passed = modules.filter((item) => item.status === "passed").length;
  const pending = modules.filter((item) => item.status === "not_pass").length;
  const bestScore = Math.max(...reports.map((report) => report.totalScore), 0);
  const latest = reports[0];

  return {
    sourceMode,
    oneId: str(profile.oneId, oneId),
    employeeName: str(profile.name ?? profile.n, "员工"),
    region: str(profile.region, ""),
    brand,
    modules,
    reports,
    latestReportId: latest.id,
    unlockedCount: modules.filter((item) => item.status !== "locked").length || passed,
    pendingCount: pending,
    bestScore,
    updatedAt: latest.date
  };
}
