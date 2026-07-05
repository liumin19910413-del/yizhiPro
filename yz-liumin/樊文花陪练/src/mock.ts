import type { ReportViewModel } from "./types";

export const demoViewModel: ReportViewModel = {
  sourceMode: "demo",
  oneId: "demo",
  employeeName: "小李",
  region: "广州番禺店",
  updatedAt: "2026-06-19 21:11",
  unlockedCount: 3,
  pendingCount: 2,
  bestScore: 88,
  latestReportId: "r-20260619",
  brand: {
    brandName: "樊文花",
    reportTitle: "陪练成长报告",
    slogan: "面部护理服务成长路径",
    primaryColor: "#159A86",
    accentColor: "#F0795C",
    passScore: 80,
    modules: [
      { id: "brand_basic", name: "品牌与服务基础", order: 1, passScore: 80 },
      { id: "new_customer", name: "新客接待与需求挖掘", order: 2, passScore: 80 },
      { id: "skin_basic", name: "面部肌肤基础", order: 3, passScore: 80 },
      { id: "diagnosis", name: "面诊检测与问题分析", order: 4, passScore: 80 },
      { id: "basic_care", name: "基础护理项目推荐", order: 5, passScore: 80 },
      { id: "advanced_care", name: "功效护理项目推荐", order: 6, passScore: 80 },
      { id: "home_care", name: "产品搭配与居家护理", order: 7, passScore: 80 },
      { id: "objection", name: "异议处理与成交推进", order: 8, passScore: 80 }
    ],
    dimensions: [
      { id: "need", name: "需求挖掘", max: 20 },
      { id: "professional", name: "专业表达", max: 20 },
      { id: "friendly", name: "沟通亲和", max: 20 },
      { id: "objection", name: "异议处理", max: 20 },
      { id: "conversion", name: "转化推进", max: 20 }
    ]
  },
  modules: [
    { id: "brand_basic", name: "品牌与服务基础", status: "passed", bestScore: 82, latestScore: 82, practiceCount: 1 },
    { id: "new_customer", name: "新客接待与需求挖掘", status: "not_pass", bestScore: 76, latestScore: 76, practiceCount: 2 },
    { id: "skin_basic", name: "面部肌肤基础", status: "passed", bestScore: 88, latestScore: 88, practiceCount: 1 },
    { id: "diagnosis", name: "面诊检测与问题分析", status: "locked", bestScore: 0, latestScore: 0, practiceCount: 0 },
    { id: "basic_care", name: "基础护理项目推荐", status: "not_started", bestScore: 0, latestScore: 0, practiceCount: 0 },
    { id: "advanced_care", name: "功效护理项目推荐", status: "locked", bestScore: 0, latestScore: 0, practiceCount: 0 },
    { id: "home_care", name: "产品搭配与居家护理", status: "locked", bestScore: 0, latestScore: 0, practiceCount: 0 },
    { id: "objection", name: "异议处理与成交推进", status: "locked", bestScore: 0, latestScore: 0, practiceCount: 0 }
  ],
  reports: [
    {
      id: "r-20260619",
      date: "2026-06-19 21:11",
      moduleId: "new_customer",
      moduleName: "新客接待与需求挖掘",
      scene: "新客首次到店",
      project: "基础补水护理",
      customerType: "谨慎观望型",
      totalRounds: 8,
      totalScore: 76,
      status: "not_pass",
      dimensions: [
        { id: "objection", name: "异议处理", score: 13, max: 20 },
        { id: "need", name: "需求挖掘", score: 14, max: 20 },
        { id: "professional", name: "专业表达", score: 15, max: 20 },
        { id: "friendly", name: "沟通亲和", score: 17, max: 20 },
        { id: "conversion", name: "转化推进", score: 17, max: 20 }
      ],
      strengths: [
        { quote: "先问了最近皮肤状态", comment: "没有一上来推项目，先把需求打开。" },
        { quote: "接住了敏感顾虑", comment: "顾客担心刺激时，你有先回应情绪。" }
      ],
      weaknesses: [
        { quote: "这个补水挺好的，很多人都做", comment: "表达偏泛，没有说清为什么适合这位顾客。" },
        { quote: "你可以办个疗程", comment: "推进太快，缺少理由和选择空间。" }
      ],
      improvements: [
        {
          title: "先接住顾虑，再给方案",
          sample: "姐，你担心敏感是对的。咱们先不急着做强功效，先把皮肤稳定下来，再看后面怎么提亮。"
        },
        {
          title: "把适合原因说具体",
          sample: "你现在主要是干和容易泛红，所以这次先选基础补水舒缓，目标是让皮肤先舒服、稳定。"
        },
        {
          title: "推进时给选择",
          sample: "今天可以先体验一次，看做完后的紧绷感和泛红有没有缓下来，再决定后面要不要连续做。"
        }
      ],
      nextTask: "再练一次 新客接待与需求挖掘",
      conversation: []
    },
    {
      id: "r-20260618",
      date: "2026-06-18 18:30",
      moduleId: "basic_care",
      moduleName: "基础护理项目推荐",
      scene: "基础护理推荐",
      project: "基础补水护理",
      customerType: "效果怀疑型",
      totalRounds: 7,
      totalScore: 82,
      status: "passed",
      dimensions: [
        { id: "need", name: "需求挖掘", score: 16, max: 20 },
        { id: "professional", name: "专业表达", score: 17, max: 20 },
        { id: "friendly", name: "沟通亲和", score: 17, max: 20 },
        { id: "objection", name: "异议处理", score: 15, max: 20 },
        { id: "conversion", name: "转化推进", score: 17, max: 20 }
      ],
      strengths: [{ quote: "先做一次短护理看看", comment: "行动门槛低，顾客更容易接受。" }],
      weaknesses: [{ quote: "效果挺明显的", comment: "可以更具体，避免听起来像承诺。" }],
      improvements: [
        { title: "把效果说成观察点", sample: "做完先看紧绷感和泛红有没有缓下来，咱们不夸大，按皮肤反馈调整。" },
        { title: "补一句护理边界", sample: "这次先做基础护理，不做强刺激，皮肤反应稳定了再考虑功效型项目。" }
      ],
      nextTask: "继续解锁 面诊检测与问题分析",
      conversation: []
    },
    {
      id: "r-20260617",
      date: "2026-06-17 20:05",
      moduleId: "objection",
      moduleName: "异议处理与成交推进",
      scene: "顾客异议处理",
      project: "价格异议",
      customerType: "价格敏感型",
      totalRounds: 8,
      totalScore: 69,
      status: "not_pass",
      dimensions: [
        { id: "objection", name: "异议处理", score: 11, max: 20 },
        { id: "conversion", name: "转化推进", score: 13, max: 20 },
        { id: "need", name: "需求挖掘", score: 14, max: 20 },
        { id: "professional", name: "专业表达", score: 15, max: 20 },
        { id: "friendly", name: "沟通亲和", score: 16, max: 20 }
      ],
      strengths: [{ quote: "我理解你觉得贵", comment: "先认可顾虑是对的。" }],
      weaknesses: [{ quote: "我们现在活动很划算", comment: "只说划算，不够支撑价值。" }],
      improvements: [
        { title: "价格异议要换算价值", sample: "姐，我们先不看总价，先看你现在最想改善哪一块，再选最低负担的方案。" },
        { title: "别急着让价", sample: "如果只是想先试试，可以先做单次体验，觉得适合再考虑后面的周期护理。" }
      ],
      nextTask: "再练一次 异议处理与成交推进",
      conversation: []
    }
  ]
};
