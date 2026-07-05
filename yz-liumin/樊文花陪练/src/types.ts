export type Status = "passed" | "not_pass" | "locked" | "not_started";

export interface BrandModule {
  id: string;
  name: string;
  order?: number;
  passScore?: number;
}

export interface BrandDimension {
  id: string;
  name: string;
  max: number;
}

export interface BrandConfig {
  brandName: string;
  reportTitle: string;
  slogan?: string;
  primaryColor?: string;
  accentColor?: string;
  passScore: number;
  modules: BrandModule[];
  dimensions: BrandDimension[];
}

export interface ModuleProgress {
  id: string;
  name: string;
  status: Status;
  bestScore: number;
  latestScore: number;
  practiceCount: number;
}

export interface DimensionScore {
  id: string;
  name: string;
  score: number;
  max: number;
}

export interface ReviewItem {
  quote: string;
  comment: string;
}

export interface ImprovementItem {
  title: string;
  sample: string;
}

export interface PracticeReport {
  id: string;
  date: string;
  moduleId: string;
  moduleName: string;
  scene: string;
  project: string;
  customerType: string;
  totalRounds: number;
  totalScore: number;
  status: Status;
  dimensions: DimensionScore[];
  strengths: ReviewItem[];
  weaknesses: ReviewItem[];
  improvements: ImprovementItem[];
  nextTask: string;
  conversation: string[];
}

export interface ReportViewModel {
  sourceMode: "live" | "demo";
  oneId: string;
  employeeName: string;
  region: string;
  brand: BrandConfig;
  modules: ModuleProgress[];
  reports: PracticeReport[];
  latestReportId: string;
  unlockedCount: number;
  pendingCount: number;
  bestScore: number;
  updatedAt: string;
}
