<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const DEFAULT_ACCOUNT = 'demo@meimeifa.com'
const DEFAULT_PASSWORD = '123456'
const INIT_KEY = `ai-operation-brain.initialized.${DEFAULT_ACCOUNT}`
const INDUSTRY_KEY = `ai-operation-brain.industry.${DEFAULT_ACCOUNT}`

type PrimaryMenuKey = 'work' | 'customer' | 'public' | 'private' | 'agent' | 'marketing' | 'report' | 'stock' | 'settings'

interface PrimaryMenu {
  key: PrimaryMenuKey
  label: string
  icon: string
}

interface SecondaryMenuGroup {
  title: string
  items: string[]
}

interface InitStep {
  title: string
  desc: string
}

interface InitPanel {
  kind?: 'industry' | 'items' | 'consumption' | 'memory' | 'experience'
  helper: string
  cards: string[]
}

interface ItemStrategyGroup {
  label: string
  intent: string
  items: ItemStrategyItem[]
  progress: number
  created: number
}

interface ItemStrategyItem {
  name: string
  price: string
  category: string
  reason: string
}

type CleanStatus = 'pending' | 'active' | 'done'
type InitVersion = 'scheme1' | 'scheme2'
type Scheme2Step = 'industry' | 'auth' | 'initializing' | 'result'
type Scheme2TaskStatus = 'done' | 'active' | 'pending'

interface Scheme2Industry {
  name: string
  profileKey: string
  icon: string
  tags: string[]
}

interface Scheme2Task {
  title: string
  desc: string
  status: Scheme2TaskStatus
}

interface Scheme2Metric {
  label: string
  value: string
  icon: string
}

const account = ref(DEFAULT_ACCOUNT)
const password = ref(DEFAULT_PASSWORD)
const isLoggedIn = ref(false)
const showInitModal = ref(false)
const activeInitVersion = ref<InitVersion>('scheme1')
const activePrimary = ref<PrimaryMenuKey>('private')
const activePrivateMenu = ref('用户记忆')
const activeStepIndex = ref(0)
const selectedIndustries = ref(loadStoredIndustries())
const selectedIndustry = computed(() => selectedIndustries.value.join(' + '))
const expandedItemGroups = ref<string[]>([])
const hasAuthorizedServiceAccount = ref(false)
const showServiceAccountQr = ref(true)
const showMemoryMiningToast = ref(false)
const scheme2Step = ref<Scheme2Step>('industry')
const scheme2SelectedIndustry = ref('')
const scheme2Authorized = ref(false)
const scheme2TaskProgress = ref(0)
const memoryScreenshotUrl = './dist/user-memory-page.png'

const primaryMenus: PrimaryMenu[] = [
  { key: 'work', label: '工作', icon: 'work' },
  { key: 'customer', label: '顾客', icon: 'customer' },
  { key: 'public', label: '公域', icon: 'public' },
  { key: 'private', label: '私域', icon: 'private' },
  { key: 'agent', label: '智能体', icon: 'bot' },
  { key: 'marketing', label: '营销', icon: 'tag' },
  { key: 'report', label: '报表', icon: 'chart' },
  { key: 'stock', label: '库存', icon: 'stock' },
  { key: 'settings', label: '设置', icon: 'gear' },
]

const secondaryMenuGroups: SecondaryMenuGroup[] = [
  { title: '客户旅程', items: ['用户记忆'] },
  { title: 'AI私域宝', items: ['账号管理', '微信素材', '业务素材'] },
  { title: '品牌私域池', items: ['新客进池', '老客绑定', '渠道活码', '群报单', '智能加好友', '到店明细'] },
  { title: '精细化客情维护', items: ['顾客雷达', '朋友圈营销', '社群运营', '批量触达', 'AI私域宝设置', '员工任务分析', 'AI智能接管', 'AI舆情监控'] },
]

const initSteps: InitStep[] = [
  { title: '选择行业', desc: '请选择门店涉及的行业，系统会按行业组合生成初始化模型。' },
  { title: '品项初始化', desc: '按引流、体验、升单、复购、高价值和利润生成行业品项结构。' },
  { title: '会员数据初始化', desc: '授权门店客服号后，同步通讯录、自动建档并模拟生命周期消费数据。' },
  { title: '清洗用户记忆', desc: '逐项清洗会员、订单、卡项、聊天和回访数据，沉淀可用于AI分析的客户记忆。' },
]

const initProgress = ref(initSteps.map(() => 0))
let progressTimer: ReturnType<typeof setInterval> | undefined
let authAutoTimer: ReturnType<typeof setTimeout> | undefined
let authTransitionTimer: ReturnType<typeof setTimeout> | undefined
let memoryMiningTimer: ReturnType<typeof setTimeout> | undefined
let scheme2AuthTimer: ReturnType<typeof setTimeout> | undefined
let scheme2TaskTimer: ReturnType<typeof setInterval> | undefined

const initPanels: InitPanel[] = [
  {
    kind: 'industry',
    helper: '行业会影响组织角色、服务项目、套餐模板、会员标签和AI运营策略。可选择一个或多个行业。',
    cards: ['美容', '美发', '美甲', '美睫', '养生SPA', '医美', '产康', '头皮养发', '综合店'],
  },
  {
    kind: 'items',
    helper: 'AI 会按品项旅程把行业服务拆成引流品、体验品、升单品、复购品、高价值品和利润品，让项目既能获客，也能承接复购和利润增长。',
    cards: ['引流品', '体验品', '升单品', '复购品', '高价值品', '利润品'],
  },
  {
    kind: 'consumption',
    helper: 'AI 正在模拟该行业客户从体验、升卡、复购到沉睡唤醒的生命周期，并生成连续消费流。',
    cards: ['近365天消费', '项目消耗记录', '储值余额', '到店频次', '客单价', '最近回访'],
  },
  {
    kind: 'memory',
    helper: 'AI 会清理重复标签和无效记录，把零散客户信息沉淀为可搜索、可分析的用户记忆。',
    cards: ['肤质标签', '护理偏好', '消费能力', '到店周期', '风险提醒', '回访建议'],
  },
]

const serviceAuthPoints = [
  { title: '同步客户关系', desc: '拉取客服号通讯录，识别微信客户' },
  { title: '自动会员建档', desc: '将微信客户沉淀为可运营会员档案' },
  { title: '模拟消费周期', desc: '生成体验、复购、唤醒等消费数据' },
]

const serviceAuthTrustBadges = ['仅用于本次 AI 运营体验', '当前仅同步通讯录建档', '后续授权后可接入聊天和朋友圈触点']

const scheme2Industries: Scheme2Industry[] = [
  { name: '面部美容', profileKey: '美容', icon: '💆', tags: ['面部护理', '皮肤管理', '补水修护', '抗衰'] },
  { name: '美甲美睫', profileKey: '美甲', icon: '💅', tags: ['美甲', '美睫', '手足护理', '款式升级'] },
  { name: '医疗美容', profileKey: '医美', icon: '🏥', tags: ['皮肤管理', '光电项目', '抗衰', '术后修复'] },
  { name: '健康养生', profileKey: '养生SPA', icon: '🌿', tags: ['经络理疗', '艾灸调理', '肩颈养护', '睡眠调理'] },
]

const scheme2ResultMetricsByIndustry: Record<string, Scheme2Metric[]> = {
  医疗美容: [
    { label: '预计今日成交客户', value: '9', icon: 'user' },
    { label: '预计新增营业额', value: '¥12,800', icon: 'coin' },
    { label: '预计激活沉睡客户', value: '16', icon: 'clock' },
    { label: '预计复购机会', value: '7', icon: 'trend' },
  ],
  面部美容: [
    { label: '预计今日成交客户', value: '12', icon: 'user' },
    { label: '预计新增营业额', value: '¥9,600', icon: 'coin' },
    { label: '预计激活沉睡客户', value: '23', icon: 'clock' },
    { label: '预计复购机会', value: '11', icon: 'trend' },
  ],
  美甲美睫: [
    { label: '预计今日成交客户', value: '18', icon: 'user' },
    { label: '预计新增营业额', value: '¥5,200', icon: 'coin' },
    { label: '预计激活沉睡客户', value: '28', icon: 'clock' },
    { label: '预计复购机会', value: '19', icon: 'trend' },
  ],
  健康养生: [
    { label: '预计今日成交客户', value: '10', icon: 'user' },
    { label: '预计新增营业额', value: '¥8,900', icon: 'coin' },
    { label: '预计激活沉睡客户', value: '21', icon: 'clock' },
    { label: '预计复购机会', value: '12', icon: 'trend' },
  ],
}

const scheme2DefaultMetrics: Scheme2Metric[] = [
  { label: '预计今日成交客户', value: '11', icon: 'user' },
  { label: '预计新增营业额', value: '¥8,800', icon: 'coin' },
  { label: '预计激活沉睡客户', value: '19', icon: 'clock' },
  { label: '预计复购机会', value: '10', icon: 'trend' },
]

const lifecycleSegments = [
  { stage: '新客体验', count: '138', signal: '首次到店 / 体验项目', motion: '建档回访' },
  { stage: '活跃护理', count: '92', signal: '月均2次到店', motion: '疗程续购' },
  { stage: '高价值会员', count: '36', signal: '储值 + 套餐消耗', motion: '专属护理' },
  { stage: '沉睡唤醒', count: '57', signal: '45天未到店', motion: '分层召回' },
]

function loadStoredIndustries() {
  const storedValue = localStorage.getItem(INDUSTRY_KEY)
  if (!storedValue) {
    return []
  }
  try {
    const parsedValue = JSON.parse(storedValue)
    if (Array.isArray(parsedValue) && parsedValue.every((item) => typeof item === 'string') && parsedValue.length > 0) {
      return parsedValue
    }
  } catch {
    if (storedValue.trim()) {
      return [storedValue]
    }
  }
  return []
}

const industryDescriptions: Record<string, string> = {
  美容: '面护 / 身体 / 皮肤管理',
  美发: '剪染烫护 / 头皮养护',
  美甲: '款式偏好 / 到期复购',
  美睫: '眼型档案 / 补睫周期',
  养生SPA: '经络调理 / 睡眠反馈',
  医美: '皮肤检测 / 术后回访',
  产康: '修复疗程 / 周期复诊',
  头皮养发: '头皮检测 / 养护疗程',
  综合店: '跨品类经营 / 权益复购',
}

interface IndustryProfile {
  organization: { name: string; type: '角色' | '员工'; desc: string }[]
  services: string[]
  packages: string[]
  lifecycle: typeof lifecycleSegments
  memorySources: string[]
}

const baseMemorySources = ['会员资料', '消费订单', '卡项 / 套餐记录', '小程序行为', '微信聊天', '朋友圈动态', '服务记录', '员工回访记录']

const memorySourceDetails: Record<string, { total: number; details: string[] }> = {
  会员资料: { total: 12638, details: ['高价值客户', '生日关怀', '等级权益'] },
  消费订单: { total: 36920, details: ['升单机会', '高客单人群', '复购偏好'] },
  '卡项 / 套餐记录': { total: 8214, details: ['到期复购', '余次提醒', '沉睡预警'] },
  小程序行为: { total: 18506, details: ['预约意向', '项目关注', '流失召回'] },
  微信聊天: { total: 54218, details: ['需求意向', '异议跟进', '风险客户'] },
  朋友圈动态: { total: 9832, details: ['活跃客户', '兴趣偏好', '触达时机'] },
  服务记录: { total: 22104, details: ['护理周期', '效果反馈', '加项推荐'] },
  员工回访记录: { total: 15770, details: ['待跟进客户', '回访任务', '成交线索'] },
}

const industryProfiles: Record<string, IndustryProfile> = {
  美容: {
    organization: [
      { name: '店长', type: '角色', desc: '门店经营负责人' },
      { name: '美容顾问', type: '角色', desc: '客户咨询与转化跟进' },
      { name: '运营主管', type: '角色', desc: '私域运营和活动执行' },
      { name: '林小雅', type: '员工', desc: '前台 / 预约接待与开单协同' },
      { name: '周护理', type: '员工', desc: '护理师 / 项目服务与消耗记录' },
      { name: '陈运营', type: '员工', desc: '私域助手 / 回访提醒与客户触达' },
    ],
    services: ['面部补水护理', '头皮滋养护理', '敏感肌修护', '肩颈舒缓放松', '身体调理', '肤质检测'],
    packages: ['补水护理季卡', '头皮养护月卡', '敏感修护疗程', '新品体验包'],
    lifecycle: lifecycleSegments,
    memorySources: baseMemorySources,
  },
  美发: {
    organization: [
      { name: '店长', type: '角色', desc: '门店排班与业绩负责人' },
      { name: '发型顾问', type: '角色', desc: '发型方案与烫染转化' },
      { name: '养发主管', type: '角色', desc: '头皮护理和疗程管理' },
      { name: '阿杰', type: '员工', desc: '发型师 / 剪染烫服务' },
      { name: '小琪', type: '员工', desc: '助理 / 洗护与护理记录' },
      { name: 'Mia', type: '员工', desc: '私域助手 / 补染补护理提醒' },
    ],
    services: ['精剪造型', '冷棕染发', '纹理烫', '头皮净化护理', '发膜修护', '发质检测'],
    packages: ['剪染护理套卡', '头皮养护月卡', '烫染修护疗程', '补染焕新包'],
    lifecycle: [
      { stage: '新客剪发', count: '126', signal: '首次剪发 / 发质建档', motion: '造型回访' },
      { stage: '烫染活跃', count: '84', signal: '60天内烫染护理', motion: '护色复购' },
      { stage: '高价值会员', count: '41', signal: '储值 + 头皮疗程', motion: '专属发型方案' },
      { stage: '补染唤醒', count: '63', signal: '发色褪色期', motion: '补染提醒' },
    ],
    memorySources: ['会员资料', '剪染烫订单', '洗护 / 头皮记录', '发质检测', '微信聊天', '朋友圈发型偏好', '服务记录', '发型师回访记录'],
  },
  美甲: {
    organization: [
      { name: '店长', type: '角色', desc: '门店排期与会员经营' },
      { name: '美甲师', type: '角色', desc: '款式设计和服务执行' },
      { name: '款式运营', type: '角色', desc: '图库上新和节日活动' },
      { name: '小雅', type: '员工', desc: '美甲师 / 款式推荐' },
      { name: '露露', type: '员工', desc: '美甲师 / 卸甲养护' },
      { name: 'Nana', type: '员工', desc: '私域助手 / 到期复购提醒' },
    ],
    services: ['单色美甲', '法式款式', '猫眼美甲', '卸甲养护', '手部护理', '节日限定款'],
    packages: ['款式次卡', '卸甲养护卡', '节日焕新包', '会员储值权益'],
    lifecycle: [
      { stage: '新客试做', count: '112', signal: '首次款式 / 偏好建档', motion: '款式回访' },
      { stage: '活跃美甲', count: '76', signal: '30天内复做', motion: '新款推荐' },
      { stage: '高价值会员', count: '28', signal: '储值 + 节日款', motion: '专属款式' },
      { stage: '到期唤醒', count: '49', signal: '美甲周期到期', motion: '预约回店' },
    ],
    memorySources: ['会员资料', '美甲订单', '款式 / 套餐记录', '小程序预约', '微信聊天', '朋友圈款式偏好', '卸甲养护记录', '员工回访记录'],
  },
  养生SPA: {
    organization: [
      { name: '店长', type: '角色', desc: '调理项目和疗程经营' },
      { name: '理疗顾问', type: '角色', desc: '体质评估与疗程转化' },
      { name: '私域运营', type: '角色', desc: '睡眠反馈和复诊提醒' },
      { name: '林理疗', type: '员工', desc: '理疗师 / 肩颈调理' },
      { name: '周养生', type: '员工', desc: '理疗师 / 经络疏通' },
      { name: '小乔', type: '员工', desc: '私域助手 / 周期关怀' },
    ],
    services: ['肩颈舒缓', '经络疏通', '睡眠调理', '艾灸暖宫', '背部排湿', '体质评估'],
    packages: ['肩颈调理月卡', '经络疏通疗程', '睡眠改善套餐', '体质养护季卡'],
    lifecycle: [
      { stage: '新客体验', count: '96', signal: '肩颈体验 / 体质建档', motion: '状态回访' },
      { stage: '活跃调理', count: '69', signal: '月均2次调理', motion: '疗程续购' },
      { stage: '高价值会员', count: '34', signal: '储值 + 经络疗程', motion: '专属调理方案' },
      { stage: '疲劳唤醒', count: '58', signal: '45天未到店', motion: '关怀预约' },
    ],
    memorySources: ['会员资料', '调理订单', '疗程 / 套餐记录', '体质评估', '微信聊天', '睡眠反馈', '服务记录', '理疗师回访记录'],
  },
  美睫: {
    organization: [
      { name: '店长', type: '角色', desc: '门店排期与客户经营' },
      { name: '美睫师', type: '角色', desc: '眼型设计和嫁接服务' },
      { name: '补睫运营', type: '角色', desc: '补睫周期和回店提醒' },
      { name: '小雨', type: '员工', desc: '美睫师 / 自然款嫁接' },
      { name: '安安', type: '员工', desc: '美睫师 / 浓密款维护' },
      { name: 'Vivi', type: '员工', desc: '私域助手 / 补睫提醒' },
    ],
    services: ['自然款嫁接', '浓密款嫁接', '睫毛卸除', '睫毛养护', '眼型设计', '补睫维护'],
    packages: ['自然款月卡', '补睫维护卡', '眼型定制套餐', '睫毛养护包'],
    lifecycle: [
      { stage: '新客嫁接', count: '104', signal: '首次嫁接 / 眼型建档', motion: '补睫提醒' },
      { stage: '活跃维护', count: '81', signal: '28天内补睫', motion: '款式升级' },
      { stage: '高价值会员', count: '29', signal: '储值 + 定制款', motion: '专属眼型' },
      { stage: '补睫唤醒', count: '52', signal: '补睫周期逾期', motion: '预约回店' },
    ],
    memorySources: ['会员资料', '美睫订单', '款式 / 套餐记录', '眼型档案', '微信聊天', '朋友圈款式偏好', '服务记录', '美睫师回访记录'],
  },
  医美: {
    organization: [
      { name: '院长', type: '角色', desc: '机构经营和项目管理' },
      { name: '咨询师', type: '角色', desc: '面诊咨询和方案转化' },
      { name: '术后运营', type: '角色', desc: '术后随访和风险提醒' },
      { name: 'Kelly', type: '员工', desc: '咨询师 / 皮肤方案' },
      { name: '赵医生', type: '员工', desc: '医生 / 光电项目' },
      { name: 'Bella', type: '员工', desc: '术后客服 / 复查提醒' },
    ],
    services: ['皮肤检测', '光电嫩肤', '水光护理', '痘肌管理', '术后修复', '面诊咨询'],
    packages: ['光电疗程卡', '水光护理套餐', '术后修复包', '皮肤管理季卡'],
    lifecycle: [
      { stage: '新客面诊', count: '88', signal: '皮肤检测 / 方案咨询', motion: '面诊跟进' },
      { stage: '项目活跃', count: '64', signal: '光电 / 水光项目', motion: '术后回访' },
      { stage: '高价值会员', count: '31', signal: '疗程 + 储值', motion: '复诊方案' },
      { stage: '复查唤醒', count: '44', signal: '复查超期', motion: '风险提醒' },
    ],
    memorySources: ['会员资料', '医美订单', '项目 / 疗程记录', '皮肤检测', '微信聊天', '术后反馈', '服务记录', '咨询师回访记录'],
  },
  产康: {
    organization: [
      { name: '店长', type: '角色', desc: '产康项目和疗程经营' },
      { name: '康复顾问', type: '角色', desc: '评估建档与方案转化' },
      { name: '复诊运营', type: '角色', desc: '周期复诊和疗程提醒' },
      { name: '敏敏', type: '员工', desc: '康复师 / 体态评估' },
      { name: '佳佳', type: '员工', desc: '康复师 / 盆底修复' },
      { name: '小陈', type: '员工', desc: '私域助手 / 复诊关怀' },
    ],
    services: ['盆底修复', '腹直肌护理', '体态评估', '骨盆修复', '产后塑形', '私密养护'],
    packages: ['盆底修复疗程', '腹直肌修复卡', '体态改善套餐', '产后恢复季卡'],
    lifecycle: [
      { stage: '新客评估', count: '91', signal: '体态评估 / 修复建档', motion: '方案回访' },
      { stage: '活跃修复', count: '73', signal: '疗程中到店', motion: '周期复诊' },
      { stage: '高价值会员', count: '27', signal: '多疗程组合', motion: '专属恢复方案' },
      { stage: '中断唤醒', count: '39', signal: '修复周期中断', motion: '顾问关怀' },
    ],
    memorySources: ['会员资料', '产康订单', '修复 / 套餐记录', '体态评估', '微信聊天', '复诊反馈', '服务记录', '康复师回访记录'],
  },
  头皮养发: {
    organization: [
      { name: '店长', type: '角色', desc: '养发项目和疗程经营' },
      { name: '头皮顾问', type: '角色', desc: '检测咨询和疗程转化' },
      { name: '养护运营', type: '角色', desc: '护理周期和复购提醒' },
      { name: 'Leo', type: '员工', desc: '头皮顾问 / 检测建档' },
      { name: '吴师傅', type: '员工', desc: '养发师 / 控油护理' },
      { name: 'Amy', type: '员工', desc: '私域助手 / 回店检测提醒' },
    ],
    services: ['头皮检测', '控油净化', '毛囊养护', '防脱护理', '头皮舒缓', '养发疗程'],
    packages: ['头皮养护月卡', '控油净化疗程', '毛囊养护季卡', '防脱护理套餐'],
    lifecycle: [
      { stage: '新客检测', count: '118', signal: '头皮检测 / 清洁体验', motion: '报告回访' },
      { stage: '活跃养护', count: '86', signal: '月均2次护理', motion: '疗程复购' },
      { stage: '高价值会员', count: '37', signal: '储值 + 防脱疗程', motion: '专属养护' },
      { stage: '周期唤醒', count: '55', signal: '护理周期断档', motion: '回店检测' },
    ],
    memorySources: ['会员资料', '养发订单', '疗程 / 套餐记录', '头皮检测', '微信聊天', '护理反馈', '服务记录', '养发师回访记录'],
  },
  综合店: {
    organization: [
      { name: '店长', type: '角色', desc: '多品类经营负责人' },
      { name: '跨品类顾问', type: '角色', desc: '组合项目和权益转化' },
      { name: '私域运营', type: '角色', desc: '多项目复购和权益提醒' },
      { name: '小宋', type: '员工', desc: '顾问 / 多项目试购' },
      { name: '何姐', type: '员工', desc: '护理师 / 面护美睫协同' },
      { name: 'Lily', type: '员工', desc: '私域助手 / 组合回店提醒' },
    ],
    services: ['面部补水护理', '头皮检测', '美睫自然款', '肩颈舒缓', '美甲单色', '身体调理'],
    packages: ['跨品类体验包', '面护美睫组合卡', '储值权益包', '多项目复购套餐'],
    lifecycle: [
      { stage: '新客试购', count: '142', signal: '多项目体验 / 偏好建档', motion: '组合推荐' },
      { stage: '活跃复购', count: '99', signal: '跨品类到店', motion: '权益复购' },
      { stage: '高价值会员', count: '46', signal: '储值 + 多套餐', motion: '专属权益' },
      { stage: '组合唤醒', count: '61', signal: '多项目间隔拉长', motion: '权益提醒' },
    ],
    memorySources: ['会员资料', '跨品类订单', '权益 / 套餐记录', '小程序行为', '微信聊天', '朋友圈偏好', '服务记录', '员工回访记录'],
  },
}

const currentIndustryProfile = computed<IndustryProfile>(() => {
  const profiles = selectedIndustries.value.map((industry) => industryProfiles[industry]).filter(Boolean)
  if (profiles.length <= 0) {
    return industryProfiles.美容
  }
  return {
    organization: mergeUniqueBy(profiles.flatMap((profile) => profile.organization), (item) => `${item.type}-${item.name}`),
    services: mergeUnique(profiles.flatMap((profile) => profile.services)),
    packages: mergeUnique(profiles.flatMap((profile) => profile.packages)),
    lifecycle: mergeUniqueBy(profiles.flatMap((profile) => profile.lifecycle), (item) => item.stage),
    memorySources: mergeUnique(profiles.flatMap((profile) => profile.memorySources)),
  }
})
const organizationItems = computed(() => currentIndustryProfile.value.organization)
const organizationRoles = computed(() => organizationItems.value.map((item, index) => ({ ...item, index })).filter((item) => item.type === '角色'))
const serviceItems = computed(() => currentIndustryProfile.value.services)
const packageItems = computed(() => currentIndustryProfile.value.packages)
const currentLifecycleSegments = computed(() => currentIndustryProfile.value.lifecycle)
const currentMemorySources = computed(() => baseMemorySources)
const memorySourceStates = computed(() => {
  const segment = 100 / baseMemorySources.length

  return baseMemorySources.map((name, index) => {
    const start = index * segment
    const progress = Math.min(100, Math.max(0, Math.round(((currentStepProgress.value - start) / segment) * 100)))
    const status: CleanStatus = progress >= 100 ? 'done' : progress > 0 ? 'active' : 'pending'
    const detail = memorySourceDetails[name]
    const cleanedCount = Math.round(detail.total * (progress / 100))
    const visibleDetailCount = status === 'done' ? detail.details.length : status === 'active' ? Math.max(1, Math.ceil(detail.details.length * (progress / 100))) : 0

    return {
      name,
      progress,
      status,
      statusText: status === 'done' ? '已完成' : status === 'active' ? '清洗中' : '待清洗',
      cleanedCountText: `${formatNumber(cleanedCount)} / ${formatNumber(detail.total)} 条`,
      visibleDetails: detail.details.slice(0, visibleDetailCount),
    }
  })
})
const itemStrategyGroups = computed<ItemStrategyGroup[]>(() => {
  const services = serviceItems.value
  const packages = packageItems.value
  const item = (name: string | undefined, price: string, category: string, reason: string): ItemStrategyItem => ({
    name: name ?? `${selectedIndustry.value}品项`,
    price,
    category,
    reason,
  })
  const rawGroups = [
    {
      label: '引流品',
      intent: '低门槛进入，适合获取客户和识别需求。',
      items: [
        item(services[5], '¥0', `${selectedIndustry.value} / 检测类`, '低门槛进入，能识别后续护理机会。'),
        item(services[0], '¥39', `${selectedIndustry.value} / 基础体验`, '首次消费占比高，适合新客体验。'),
        item(services[3], '¥19.9', `${selectedIndustry.value} / 高频触点`, '低价体验转小卡概率高。'),
        item(services[1], '¥9.9', `${selectedIndustry.value} / 需求唤醒`, '容易承接清洁和养护项目。'),
      ],
    },
    {
      label: '体验品',
      intent: '适合让客户第一次感受服务，并进入后续复购或升单。',
      items: [
        item(services[1], '¥99', `${selectedIndustry.value} / 效果体验`, '能快速感知服务效果，适合承接顾问沟通。'),
        item(services[2], '¥128', `${selectedIndustry.value} / 方案体验`, '适合建立信任，后续可升级为套餐。'),
        item(services[4], '¥168', `${selectedIndustry.value} / 深度体验`, '体验价值感更强，便于转化周期护理。'),
      ],
    },
    {
      label: '升单品',
      intent: '更容易促成开卡、升单或方案转化的品项。',
      items: [
        item(packages[0], '¥680', `${selectedIndustry.value} / 入门套餐`, '适合从单次体验升级到小卡。'),
        item(packages[2], '¥1280', `${selectedIndustry.value} / 方案套餐`, '承接明确问题，提升客单价。'),
        item(services[2], '¥398', `${selectedIndustry.value} / 加项服务`, '可作为体验后的自然加项。'),
        item(packages[3], '¥1980', `${selectedIndustry.value} / 利润方案`, '高价值客户更容易接受组合方案。'),
      ],
    },
    {
      label: '复购品',
      intent: '有明确周期和消耗频次，适合复购提醒和轻触达。',
      items: [
        item(services[3], '¥198', `${selectedIndustry.value} / 周期护理`, '有固定消耗周期，适合自动回访。'),
        item(packages[1], '¥980', `${selectedIndustry.value} / 月卡复购`, '可绑定月度到店和项目消耗。'),
        item(services[4], '¥268', `${selectedIndustry.value} / 维护服务`, '适合在到期前提醒补做。'),
      ],
    },
    {
      label: '高价值品',
      intent: '客单较高，适合顾问承接或到店后转化。',
      items: [
        item(packages[2], '¥2680', `${selectedIndustry.value} / 深度方案`, '适合有明确需求的客户，便于顾问做方案承接。'),
        item(packages[3], '¥3980', `${selectedIndustry.value} / 高阶疗程`, '强化效果预期和服务周期，提升高价值转化。'),
        item(services[4], '¥699', `${selectedIndustry.value} / 专项服务`, '适合作为高价值客户的进阶项目。'),
        item(packages[1], '¥1680', `${selectedIndustry.value} / 周期卡`, '能锁定后续到店频次和项目消耗。'),
      ],
    },
    {
      label: '利润品',
      intent: '毛利较好，适合在合适人群中作为经营重点。',
      items: [
        item(packages[3], '¥4980', `${selectedIndustry.value} / 利润套餐`, '适合高信任客户，能拉动门店利润结构。'),
        item(services[2], '¥899', `${selectedIndustry.value} / 高毛利加项`, '适合在服务后自然推荐，增加单次收益。'),
      ],
    },
  ]

  return rawGroups.map((group, index) => {
    const progress = itemStrategyProgress(index)
    return {
      ...group,
      progress,
      created: itemStrategyCreatedCount(progress, group.items.length),
    }
  })
})
const currentExperienceCards = computed(() => {
  const primaryService = serviceItems.value[0] ?? `${selectedIndustry.value}服务`
  const primaryPackage = packageItems.value[0] ?? `${selectedIndustry.value}套餐`
  const lifecycleFocus = currentLifecycleSegments.value[0]?.stage ?? '新客经营'
  const recallFocus = currentLifecycleSegments.value[currentLifecycleSegments.value.length - 1]?.motion ?? '客户唤醒'
  const memoryFocus = currentMemorySources.value[1] ?? '消费记录'
  const advisorRole = organizationRoles.value[1]?.name ?? '顾问'

  return [
    `${selectedIndustry.value}自然语言找客`,
    `${lifecycleFocus}分层洞察`,
    `${primaryService}热销分析`,
    `${primaryPackage}复购建议`,
    `${memoryFocus}记忆检索`,
    `${advisorRole}AI跟进任务`,
    recallFocus,
    '客户资产沉淀',
  ]
})
const scheme2SelectedIndustryCard = computed(() => {
  return scheme2Industries.find((item) => item.name === scheme2SelectedIndustry.value) ?? scheme2Industries[2]
})
const scheme2IndustryName = computed(() => scheme2SelectedIndustry.value || scheme2SelectedIndustryCard.value.name)
const scheme2ResultMetrics = computed(() => scheme2ResultMetricsByIndustry[scheme2IndustryName.value] ?? scheme2DefaultMetrics)
const scheme2InitReady = computed(() => scheme2Step.value === 'initializing' && scheme2TaskProgress.value >= 100)
const scheme2PowerLeft = computed(() => {
  if (scheme2Step.value === 'industry') {
    return 50
  }
  if (scheme2Step.value === 'auth') {
    return 42
  }
  if (scheme2Step.value === 'initializing') {
    return Math.max(8, 42 - Math.round(scheme2TaskProgress.value * 0.34))
  }
  return 0
})
const scheme2Tasks = computed<Scheme2Task[]>(() => {
  const taskTitles = [
    '已选择行业',
    '匹配行业模型',
    '初始化行业主营品项',
    '初始化会员旅程',
    '初始化客户分层',
    '初始化行业经营模型',
  ]
  const taskDescriptions = [
    scheme2IndustryName.value,
    scheme2IndustryName.value,
    scheme2SelectedIndustryCard.value.tags.join(' / '),
    '新客体验 / 首次成交 / 复购 / 召回',
    '高意向 / 可复购 / 沉睡 / 流失预警',
    `${scheme2IndustryName.value}经营动作生成中`,
  ]

  return taskTitles.map((title, index) => {
    let status: Scheme2TaskStatus = 'pending'
    if (scheme2Step.value === 'result') {
      status = 'done'
    } else if (scheme2Step.value === 'initializing') {
      if (index < 2) {
        status = 'done'
      } else {
        const start = (index - 2) * 25
        status = scheme2TaskProgress.value >= start + 25 ? 'done' : scheme2TaskProgress.value >= start ? 'active' : 'pending'
      }
    } else if (scheme2Step.value === 'auth') {
      status = index === 0 ? 'done' : index === 1 && scheme2Authorized.value ? 'done' : index === 1 ? 'active' : 'pending'
    } else {
      status = index === 0 && scheme2SelectedIndustry.value ? 'done' : index === 0 ? 'active' : 'pending'
    }

    return {
      title,
      desc: taskDescriptions[index],
      status,
    }
  })
})
function mergeUnique(items: string[]) {
  return Array.from(new Set(items))
}

function mergeUniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const result: T[] = []
  const keys = new Set<string>()
  items.forEach((item) => {
    const key = getKey(item)
    if (!keys.has(key)) {
      keys.add(key)
      result.push(item)
    }
  })
  return result
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}

const currentInitIndex = computed(() => activeStepIndex.value)
const currentInitStep = computed(() => initSteps[currentInitIndex.value])
const currentInitPanel = computed(() => initPanels[currentInitIndex.value])
const isLastInitStep = computed(() => currentInitIndex.value === initSteps.length - 1)
const isChoiceStep = computed(() => currentInitPanel.value.kind === 'industry')
const isConsumptionStep = computed(() => currentInitPanel.value.kind === 'consumption')
const shouldRunProgress = computed(() => {
  return currentInitPanel.value.kind !== 'industry'
    && currentInitPanel.value.kind !== 'experience'
    && (!isConsumptionStep.value || (hasAuthorizedServiceAccount.value && !showServiceAccountQr.value))
})
const currentStepProgress = computed(() => initProgress.value[currentInitIndex.value] ?? 0)
const memberInitResultReady = computed(() => isConsumptionStep.value && hasAuthorizedServiceAccount.value && currentStepProgress.value >= 100)
const memberInitProgressText = computed(() => {
  if (!hasAuthorizedServiceAccount.value) {
    return '等待扫码授权'
  }
  if (currentStepProgress.value < 34) {
    return '正在同步企微通讯录'
  }
  if (currentStepProgress.value < 68) {
    return '正在自动生成会员档案'
  }
  if (currentStepProgress.value < 100) {
    return '正在模拟会员生命周期消费数据'
  }
  return '会员数据初始化完成'
})
const memberInitSummary = computed(() => {
  const base = selectedIndustries.value.length > 1 ? 1680 : 960
  const synced = hasAuthorizedServiceAccount.value ? Math.round(base * Math.min(currentStepProgress.value, 34) / 34) : 0
  const identified = hasAuthorizedServiceAccount.value ? Math.round(base * 0.92 * Math.min(Math.max(currentStepProgress.value - 18, 0), 40) / 40) : 0
  const filed = hasAuthorizedServiceAccount.value ? Math.round(base * 0.82 * Math.min(Math.max(currentStepProgress.value - 46, 0), 28) / 28) : 0
  const consumed = hasAuthorizedServiceAccount.value ? Math.round(base * 0.68 * Math.min(Math.max(currentStepProgress.value - 68, 0), 32) / 32) : 0

  return [
    { label: '已同步通讯录', value: `${formatNumber(synced)} 人` },
    { label: '已识别微信客户', value: `${formatNumber(identified)} 人` },
    { label: '建档成功会员', value: `${formatNumber(filed)} 人` },
    { label: '模拟消费记录', value: `${formatNumber(consumed)} 条` },
  ]
})
const isCurrentStepComplete = computed(() => {
  if (isChoiceStep.value) {
    return selectedIndustries.value.length > 0
  }
  if (isConsumptionStep.value) {
    return memberInitResultReady.value
  }
  if (!shouldRunProgress.value) {
    return true
  }
  return currentStepProgress.value >= 100
})
const initStatusLabel = computed(() => {
  if (isChoiceStep.value) {
    return selectedIndustries.value.length > 0 ? `已选择 ${selectedIndustry.value}` : '请选择行业'
  }
  if (isConsumptionStep.value && !hasAuthorizedServiceAccount.value) {
    return '等待扫码授权'
  }
  if (isConsumptionStep.value && hasAuthorizedServiceAccount.value && showServiceAccountQr.value) {
    return '扫码授权成功'
  }
  if (isConsumptionStep.value && !isCurrentStepComplete.value) {
    return '正在生成数据'
  }
  if (isLastInitStep.value && isCurrentStepComplete.value) {
    return '初始化完成，可以体验'
  }
  return isCurrentStepComplete.value ? '本步初始化完成' : 'AI正在初始化'
})
const nextInitLabel = computed(() => {
  const nextStep = initSteps[activeStepIndex.value + 1]
  return nextStep ? `下一步：${nextStep.title}` : '一切准备就绪，开始让AI运营大脑帮您打工吧！'
})

function handleLogin() {
  isLoggedIn.value = true
  activePrimary.value = 'work'
  activePrivateMenu.value = '用户记忆'
  localStorage.removeItem(INIT_KEY)
  localStorage.removeItem(INDUSTRY_KEY)
  selectedIndustries.value = []
  resetInitProgress()
  resetScheme2Flow()
  activeInitVersion.value = 'scheme2'
  showInitModal.value = false
  activeStepIndex.value = 0
}

function advanceInit() {
  if (!isCurrentStepComplete.value) {
    return
  }
  if (isLastInitStep.value) {
    finishInit()
    return
  }
  if (activeStepIndex.value < initSteps.length - 1) {
    activeStepIndex.value += 1
  }
}

function previousInit() {
  if (activeStepIndex.value > 0) {
    activeStepIndex.value -= 1
  }
}

function finishInit() {
  stopInitProgress()
  localStorage.setItem(INIT_KEY, 'true')
  localStorage.setItem(INDUSTRY_KEY, JSON.stringify(selectedIndustries.value))
  showInitModal.value = false
  activePrimary.value = 'private'
  activePrivateMenu.value = '用户记忆'
  showMemoryMiningHint()
}

function selectPrimary(key: PrimaryMenuKey) {
  activePrimary.value = key
  if (key === 'private') {
    activePrivateMenu.value = '用户记忆'
    openInitModal('scheme2')
  }
}

function resetDemoInit() {
  localStorage.removeItem(INIT_KEY)
  localStorage.removeItem(INDUSTRY_KEY)
  selectedIndustries.value = []
  openInitModal('scheme2')
}

function handleLogout() {
  stopInitProgress()
  clearAuthAutoTimer()
  clearAuthTransitionTimer()
  clearMemoryMiningTimer()
  clearScheme2AuthTimer()
  stopScheme2TaskProgress()
  showInitModal.value = false
  showMemoryMiningToast.value = false
  showServiceAccountQr.value = true
  hasAuthorizedServiceAccount.value = false
  scheme2Authorized.value = false
  isLoggedIn.value = false
  activePrimary.value = 'private'
  activePrivateMenu.value = '用户记忆'
}

function selectIndustry(industry: string) {
  if (selectedIndustries.value.includes(industry)) {
    if (selectedIndustries.value.length > 1) {
      selectedIndustries.value = selectedIndustries.value.filter((item) => item !== industry)
    }
  } else {
    selectedIndustries.value = [...selectedIndustries.value, industry]
  }
  localStorage.setItem(INDUSTRY_KEY, JSON.stringify(selectedIndustries.value))
}

function switchInitVersion(version: InitVersion) {
  if (activeInitVersion.value === version) {
    return
  }
  activeInitVersion.value = version
  if (version === 'scheme1') {
    resetScheme2Flow()
    resetInitProgress()
    activeStepIndex.value = 0
    startInitProgress()
    return
  }
  stopInitProgress()
  clearAuthAutoTimer()
  clearAuthTransitionTimer()
  resetScheme2Flow()
}

function selectScheme2Industry(industry: Scheme2Industry) {
  scheme2SelectedIndustry.value = industry.name
  selectedIndustries.value = [industry.profileKey]
  localStorage.setItem(INDUSTRY_KEY, JSON.stringify(selectedIndustries.value))
  scheme2Step.value = 'auth'
}

function resetInitProgress() {
  stopInitProgress()
  clearAuthAutoTimer()
  clearAuthTransitionTimer()
  clearMemoryMiningTimer()
  initProgress.value = initSteps.map(() => 0)
  hasAuthorizedServiceAccount.value = false
  showServiceAccountQr.value = true
  showMemoryMiningToast.value = false
}

function stopInitProgress() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = undefined
  }
}

function clearAuthTransitionTimer() {
  if (authTransitionTimer) {
    clearTimeout(authTransitionTimer)
    authTransitionTimer = undefined
  }
}

function clearAuthAutoTimer() {
  if (authAutoTimer) {
    clearTimeout(authAutoTimer)
    authAutoTimer = undefined
  }
}

function clearMemoryMiningTimer() {
  if (memoryMiningTimer) {
    clearTimeout(memoryMiningTimer)
    memoryMiningTimer = undefined
  }
}

function clearScheme2AuthTimer() {
  if (scheme2AuthTimer) {
    clearTimeout(scheme2AuthTimer)
    scheme2AuthTimer = undefined
  }
}

function stopScheme2TaskProgress() {
  if (scheme2TaskTimer) {
    clearInterval(scheme2TaskTimer)
    scheme2TaskTimer = undefined
  }
}

function resetScheme2Flow() {
  clearScheme2AuthTimer()
  stopScheme2TaskProgress()
  scheme2Step.value = 'industry'
  scheme2SelectedIndustry.value = ''
  scheme2Authorized.value = false
  scheme2TaskProgress.value = 0
}

function openInitModal(version: InitVersion = 'scheme2') {
  resetInitProgress()
  resetScheme2Flow()
  activeStepIndex.value = 0
  activeInitVersion.value = version
  showInitModal.value = true
  if (version === 'scheme1') {
    startInitProgress()
  }
}

function showMemoryMiningHint() {
  clearMemoryMiningTimer()
  showMemoryMiningToast.value = true
  memoryMiningTimer = setTimeout(() => {
    showMemoryMiningToast.value = false
    memoryMiningTimer = undefined
  }, 2800)
}

function scheduleServiceAccountAuth() {
  clearAuthAutoTimer()
  if (!showInitModal.value || !isConsumptionStep.value || hasAuthorizedServiceAccount.value) {
    return
  }
  showServiceAccountQr.value = true
  authAutoTimer = setTimeout(() => {
    authorizeServiceAccount()
  }, 3000)
}

function authorizeScheme2ServiceAccount() {
  if (activeInitVersion.value !== 'scheme2' || scheme2Step.value !== 'auth' || scheme2Authorized.value) {
    return
  }
  clearScheme2AuthTimer()
  scheme2Authorized.value = true
  scheme2AuthTimer = setTimeout(() => {
    if (!showInitModal.value || activeInitVersion.value !== 'scheme2') {
      return
    }
    scheme2Step.value = 'initializing'
    startScheme2TaskProgress()
  }, 600)
}

function startScheme2TaskProgress() {
  stopScheme2TaskProgress()
  if (scheme2TaskProgress.value >= 100) {
    return
  }
  if (scheme2TaskProgress.value < 4) {
    scheme2TaskProgress.value = 4
  }
  scheme2TaskTimer = setInterval(() => {
    const current = scheme2TaskProgress.value
    const increment = current < 44 ? 7 : current < 82 ? 5 : 3
    const next = Math.min(100, current + increment)
    scheme2TaskProgress.value = next
    if (next >= 100) {
      stopScheme2TaskProgress()
    }
  }, 340)
}

function viewScheme2Result() {
  if (!scheme2InitReady.value) {
    return
  }
  scheme2Step.value = 'result'
}

function finishScheme2Init() {
  clearScheme2AuthTimer()
  stopScheme2TaskProgress()
  selectedIndustries.value = [scheme2SelectedIndustryCard.value.profileKey]
  localStorage.setItem(INIT_KEY, 'true')
  localStorage.setItem(INDUSTRY_KEY, JSON.stringify(selectedIndustries.value))
  showInitModal.value = false
  activePrimary.value = 'private'
  activePrivateMenu.value = '用户记忆'
  showMemoryMiningHint()
}

function startInitProgress() {
  stopInitProgress()
  if (!shouldRunProgress.value) {
    return
  }
  const stepIndex = activeStepIndex.value
  if (initProgress.value[stepIndex] >= 100) {
    return
  }

  if (initProgress.value[stepIndex] < 8) {
    initProgress.value[stepIndex] = 8
  }

  progressTimer = setInterval(() => {
    const current = initProgress.value[stepIndex] ?? 0
    const increment = current < 55 ? 9 : current < 86 ? 6 : 3
    const next = Math.min(100, current + increment)
    initProgress.value[stepIndex] = next

    if (next >= 100) {
      stopInitProgress()
    }
  }, 180)
}

function authorizeServiceAccount() {
  if (!isConsumptionStep.value || hasAuthorizedServiceAccount.value) {
    return
  }
  clearAuthAutoTimer()
  clearAuthTransitionTimer()
  hasAuthorizedServiceAccount.value = true
  showServiceAccountQr.value = true
  authTransitionTimer = setTimeout(() => {
    if (!showInitModal.value || !isConsumptionStep.value) {
      return
    }
    showServiceAccountQr.value = false
    startInitProgress()
  }, 1500)
}

function itemStrategyProgress(index: number) {
  const segment = 100 / 6
  const start = index * segment
  const progress = ((currentStepProgress.value - start) / segment) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

function itemStrategyCreatedCount(progress: number, total: number) {
  if (progress <= 0) {
    return 0
  }
  return Math.min(total, Math.max(1, Math.floor((progress / 100) * total)))
}

function isItemGroupExpanded(label: string) {
  return expandedItemGroups.value.includes(label)
}

function toggleItemGroup(label: string) {
  expandedItemGroups.value = isItemGroupExpanded(label)
    ? expandedItemGroups.value.filter((item) => item !== label)
    : [...expandedItemGroups.value, label]
}

watch([showInitModal, activeStepIndex], () => {
  if (activeInitVersion.value !== 'scheme1') {
    stopInitProgress()
    clearAuthAutoTimer()
    clearAuthTransitionTimer()
    return
  }
  if (currentInitPanel.value.kind !== 'consumption') {
    clearAuthAutoTimer()
    clearAuthTransitionTimer()
  }
  if (showInitModal.value) {
    if (currentInitPanel.value.kind === 'consumption') {
      scheduleServiceAccountAuth()
    } else {
      startInitProgress()
    }
    if (currentInitPanel.value.kind === 'items') {
      expandedItemGroups.value = []
    }
  }
})

watch([showInitModal, activeInitVersion, scheme2Step], () => {
  if (!showInitModal.value || activeInitVersion.value !== 'scheme2') {
    clearScheme2AuthTimer()
    stopScheme2TaskProgress()
    return
  }
  if (scheme2Step.value === 'initializing') {
    startScheme2TaskProgress()
  }
})

onBeforeUnmount(() => {
  clearAuthAutoTimer()
  clearAuthTransitionTimer()
  clearMemoryMiningTimer()
  clearScheme2AuthTimer()
  stopInitProgress()
  stopScheme2TaskProgress()
})

</script>

<template>
  <main v-if="!isLoggedIn" class="login-page">
    <header class="login-brand" aria-label="伊智科技">
      <span class="brand-mark" aria-hidden="true"></span>
      <span>
        <strong>伊智科技</strong>
        <em>MEIMEIFA.COM</em>
      </span>
    </header>

    <section class="login-shell" aria-label="密码登录">
      <div class="login-visual" aria-hidden="true">
        <h1>让门店增长更轻松</h1>
        <div class="speech">智慧门店经营</div>
        <div class="visual-card">
          <span v-for="item in 8" :key="item" :class="{ active: item === 3 || item === 6 }"></span>
          <i></i>
        </div>
        <div class="rating">★★★★★</div>
        <div class="phone-chart"><span></span><span></span><span></span></div>
        <div class="beauty-head"><span></span><i></i></div>
        <div class="dryer-shape"></div>
        <div class="bottle-shape"></div>
      </div>

      <section class="login-form-panel">
        <div class="qr-corner" aria-hidden="true">
          <span v-for="item in 18" :key="item"></span>
        </div>
        <form class="login-form" @submit.prevent="handleLogin">
          <h2>密码登录</h2>
          <label class="field-row">
            <span class="field-icon user"></span>
            <input v-model="account" autocomplete="username" type="text" placeholder="请输入您的登录账号" />
          </label>
          <label class="field-row">
            <span class="field-icon lock"></span>
            <input v-model="password" autocomplete="current-password" type="password" placeholder="请输入密码" />
          </label>
          <div class="form-options">
            <label><input type="checkbox" /> 记住密码</label>
            <a href="#">忘记密码?</a>
          </div>
          <button class="primary-button login-submit" type="submit">登录</button>
        </form>
        <nav class="download-bar" aria-label="客户端下载">
          <a href="#">商家版下载 <span></span></a>
          <a href="#">大掌柜下载 <span></span></a>
          <a href="#">客户端下载 <span></span></a>
        </nav>
      </section>
    </section>

    <aside class="float-actions" aria-label="快捷入口">
      <a href="#"><i class="mini-icon coin"></i>移动收银</a>
      <a href="#"><i class="mini-icon globe"></i>官网首页</a>
      <a href="#"><i class="mini-icon service"></i>咨询建议</a>
      <a href="#"><i class="mini-icon trial"></i>申请试用</a>
    </aside>
  </main>

  <main v-else class="workspace">
    <aside class="primary-sidebar">
      <div class="product-badge">伊站专用版 plus</div>
      <div class="store-avatar">云</div>
      <p class="store-name">伊站医疗美容<span>a1467</span></p>
      <button
        v-for="menu in primaryMenus"
        :key="menu.key"
        class="primary-nav-item"
        :class="{ active: activePrimary === menu.key }"
        type="button"
        @click="selectPrimary(menu.key)"
      >
        <span class="nav-icon" :class="menu.icon"></span>
        <span>{{ menu.label }}</span>
      </button>
      <button class="sidebar-search" type="button">搜索(ctrl+Q)</button>
      <section class="account-popover" aria-label="账号操作">
        <button type="button"><i></i>开启高对比度模式</button>
        <button type="button"><i></i>版本更新日志</button>
        <button class="logout" type="button" @click="handleLogout"><i></i>退出登录</button>
      </section>
    </aside>

    <aside class="secondary-sidebar" :class="{ empty: activePrimary !== 'private' }">
      <section v-for="group in activePrimary === 'private' ? secondaryMenuGroups : []" :key="group.title" class="menu-group">
        <h3>{{ group.title }}</h3>
        <button
          v-for="item in group.items"
          :key="`${group.title}-${item}`"
          type="button"
          :class="{ active: activePrivateMenu === item }"
          @click="activePrivateMenu = item"
        >
          {{ item }}
        </button>
      </section>
    </aside>

    <section v-if="activePrimary === 'private'" class="content-shell memory-dashboard" :class="{ 'memory-live': !showInitModal }">
      <button class="demo-reset-button" type="button" @click="resetDemoInit">重新初始化</button>
      <div class="assistant-avatar" aria-hidden="true"></div>
      <div class="memory-screenshot-cover" aria-hidden="true">
        <img :src="memoryScreenshotUrl" alt="" />
      </div>
      <div v-if="showMemoryMiningToast" class="memory-mining-toast" role="status" aria-live="polite">
        <i></i>
        <strong>运营机会挖掘完成，任务生成中！</strong>
      </div>
    </section>
    <section v-else class="content-shell blank-workbench" aria-label="开单内容区"></section>

    <div v-if="showInitModal" class="modal-mask" role="dialog" aria-modal="true" aria-labelledby="init-title">
      <section class="init-modal" :class="{ 'scheme2-modal': activeInitVersion === 'scheme2' }">
        <nav class="init-version-tabs modal-version-tabs" aria-label="初始化方案选择">
          <button type="button" :class="{ active: activeInitVersion === 'scheme1' }" @click="switchInitVersion('scheme1')">方案1</button>
          <button type="button" :class="{ active: activeInitVersion === 'scheme2' }" @click="switchInitVersion('scheme2')">方案2</button>
        </nav>
        <template v-if="activeInitVersion === 'scheme1'">
        <aside class="init-step-sidebar">
          <h2>初始化步骤</h2>
          <button
            v-for="(step, index) in initSteps"
            :key="step.title"
            type="button"
            :class="{ done: index < activeStepIndex, active: index === currentInitIndex }"
          >
            <i>{{ index + 1 }}</i>
            <span>{{ step.title }}</span>
          </button>
        </aside>

        <section class="init-workbench">
          <header>
            <div>
              <span class="step-count">Step {{ currentInitIndex + 1 }} / {{ initSteps.length }}</span>
              <h2 id="init-title">{{ currentInitStep.title }}</h2>
              <p>{{ currentInitStep.desc }}</p>
            </div>
            <span class="modal-tag">{{ initStatusLabel }}</span>
          </header>

          <template v-if="currentInitPanel.kind !== 'experience'">
            <div v-if="currentInitPanel.kind === 'industry'" class="industry-choice-lab">
              <div class="industry-card-grid">
                <button
                  v-for="card in currentInitPanel.cards"
                  :key="card"
                  type="button"
                  :class="{ selected: selectedIndustries.includes(card) }"
                  @click="selectIndustry(card)"
                >
                  <strong>{{ card }}</strong>
                  <span>{{ industryDescriptions[card] }}</span>
                  <em>{{ selectedIndustries.includes(card) ? '已选择' : '选择' }}</em>
                </button>
              </div>
            </div>
            <div v-else-if="currentInitPanel.kind === 'items'" class="item-build-lab">
              <div class="strategy-accordion">
                <article
                  v-for="(group, groupIndex) in itemStrategyGroups"
                  :key="group.label"
                  class="strategy-accordion-card"
                  :class="[
                    `stage-${groupIndex + 1}`,
                    {
                      expanded: isItemGroupExpanded(group.label),
                      complete: group.progress >= 100,
                      active: group.progress > 0 && group.progress < 100,
                      waiting: group.progress <= 0,
                    },
                  ]"
                >
                  <button
                    type="button"
                    class="strategy-accordion-head"
                    :aria-expanded="isItemGroupExpanded(group.label)"
                    @click="toggleItemGroup(group.label)"
                  >
                    <i aria-hidden="true"></i>
                    <div>
                      <strong>{{ group.label }}</strong>
                      <span>{{ group.intent }}</span>
                    </div>
                    <div class="strategy-card-meta" aria-label="类目生成状态">
                      <em>{{ group.items.length }} 个品项</em>
                      <b class="strategy-card-progress">
                        <span :style="{ width: `${group.progress}%` }"></span>
                      </b>
                      <small>{{ group.progress >= 100 ? '已生成' : group.progress > 0 ? `${group.created}/${group.items.length}` : '待创建' }}</small>
                    </div>
                  </button>
                  <div v-if="isItemGroupExpanded(group.label)" class="strategy-detail-table">
                    <div
                      v-for="(item, index) in group.items"
                      :key="`${group.label}-${item.name}`"
                      class="strategy-detail-row"
                      :class="{ pending: index >= group.created }"
                    >
                      <strong>{{ item.name }}</strong>
                      <em>{{ item.price }}</em>
                      <span>{{ item.category }}</span>
                      <p>{{ item.reason }}</p>
                    </div>
                  </div>
                </article>
              </div>
            </div>
            <div v-else-if="currentInitPanel.kind === 'consumption'" class="member-sync-lab">
              <section class="wechat-auth-panel" :class="{ authorized: hasAuthorizedServiceAccount, 'qr-hidden': !showServiceAccountQr }">
                <div class="wechat-auth-copy">
                  <span>企微客服号授权</span>
                  <strong>授权客服号，先把客户关系建起来</strong>
                  <p>真实使用时，门店扫码授权成功后，系统会先同步客服号通讯录并自动生成会员档案；随后按所选行业模拟会员生命周期消费数据，让您完整体验 AI 自动化运营流程。</p>
                  <div class="auth-flow-line">
                    <span v-for="point in serviceAuthPoints" :key="point.title">
                      <i></i>
                      <b>{{ point.title }}</b>
                      <em>{{ point.desc }}</em>
                    </span>
                  </div>
                  <div class="auth-trust-row">
                    <small v-for="badge in serviceAuthTrustBadges" :key="badge">{{ badge }}</small>
                  </div>
                </div>
                <div v-if="showServiceAccountQr" class="wechat-qr-card" :class="{ authorized: hasAuthorizedServiceAccount }" aria-label="企微客服号二维码">
                  <div class="mock-qr" aria-hidden="true">
                    <i v-for="index in 25" :key="index"></i>
                  </div>
                  <strong>门店企微客服号</strong>
                  <span>{{ hasAuthorizedServiceAccount ? '扫码授权成功，开始初始化数据' : '请使用企微扫码授权' }}</span>
                </div>
              </section>

              <div v-if="hasAuthorizedServiceAccount && showServiceAccountQr" class="init-center-toast auth-success-toast" role="status" aria-live="polite">
                <i></i>
                <strong>授权成功</strong>
                <span>开始进入会员数据初始化</span>
              </div>

              <section v-if="hasAuthorizedServiceAccount && !showServiceAccountQr" class="member-sync-progress-panel">
                <div class="member-sync-head">
                  <div>
                    <strong>{{ memberInitProgressText }}</strong>
                    <span>同步通讯录、建档会员并模拟生成消费数据，完成后进入清洗用户记忆。</span>
                  </div>
                  <em>{{ currentStepProgress }}%</em>
                </div>
                <b class="member-sync-track">
                  <i :style="{ width: `${currentStepProgress}%` }"></i>
                </b>
                <div class="member-init-summary">
                  <span v-for="item in memberInitSummary" :key="item.label">
                    <strong>{{ item.value }}</strong>
                    <em>{{ item.label }}</em>
                  </span>
                </div>
              </section>
            </div>
            <div v-else-if="currentInitPanel.kind === 'memory'" class="memory-clean-lab">
              <div class="memory-source-grid">
                <article v-for="source in memorySourceStates" :key="source.name" :class="source.status">
                  <strong>{{ source.name }}</strong>
                  <span class="memory-source-status">
                    {{ source.statusText }}
                    <small>{{ source.cleanedCountText }}</small>
                  </span>
                  <div class="memory-source-tags">
                    <small v-for="detail in source.visibleDetails" :key="`${source.name}-${detail}`">{{ detail }}</small>
                    <small v-if="source.visibleDetails.length === 0" class="muted">等待接入</small>
                  </div>
                  <b class="memory-source-progress">
                    <em :style="{ width: `${source.progress}%` }"></em>
                  </b>
                  <i></i>
                </article>
              </div>
            </div>
            <div v-else class="generated-card-grid">
              <article v-for="card in currentInitPanel.cards" :key="card" :class="{ complete: isCurrentStepComplete }">
                <strong>{{ card }}</strong>
                <span>{{ isCurrentStepComplete ? '已生成' : '生成中' }}</span>
                <i></i>
              </article>
            </div>
          </template>

          <section v-else class="init-complete-panel">
            <span class="complete-mark">✓</span>
            <h3>可以开始体验 AI运营大脑</h3>
            <p>已按{{ selectedIndustry }}行业组合完成品项配置、会员消费和用户记忆初始化。</p>
            <div class="experience-grid">
              <span v-for="card in currentExperienceCards" :key="card">{{ card }}</span>
            </div>
          </section>

          <footer>
            <button class="ghost-button" type="button" :disabled="activeStepIndex <= 0" @click="previousInit">上一步</button>
            <div>
              <button class="primary-button small init-next-button" type="button" :disabled="!isCurrentStepComplete" @click="advanceInit">{{ nextInitLabel }}</button>
            </div>
          </footer>
        </section>
        </template>

        <section v-else class="scheme2-workbench">
          <section v-if="scheme2Step === 'industry'" class="scheme2-industry-stage">
            <aside class="scheme2-welcome-panel">
              <span>50 AI算力已到账</span>
              <h3>欢迎体验<br />AI运营大脑</h3>
              <p>60 秒，为你的门店生成专属 AI 经营方案。</p>
              <div class="scheme2-power-card">
                <small>本次体验免费使用</small>
                <strong>50 AI算力</strong>
                <i></i>
              </div>
            </aside>
            <div class="scheme2-industry-panel">
              <header>
                <span>请选择你的行业</span>
                <strong>AI 将初始化对应行业经营模型</strong>
              </header>
              <div class="scheme2-industry-grid">
                <button
                  v-for="industry in scheme2Industries"
                  :key="industry.name"
                  type="button"
                  :class="{ selected: scheme2SelectedIndustry === industry.name }"
                  @click="selectScheme2Industry(industry)"
                >
                  <i>{{ industry.icon }}</i>
                  <strong>{{ industry.name }}</strong>
                  <em></em>
                  <span>
                    <small v-for="tag in industry.tags" :key="`${industry.name}-${tag}`">{{ tag }}</small>
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section v-else-if="scheme2Step === 'auth'" class="scheme2-auth-stage">
            <div class="scheme2-auth-copy">
              <span>等待授权</span>
              <strong>让 AI 替你判断<br />今天该找谁</strong>
              <p>授权后，AI 会识别客户机会，直接生成跟进名单、理由和策略。</p>
              <div class="scheme2-auth-mini-result">
                <b>马上生成</b>
                <small>客户名单 / 跟进理由 / 预计收益</small>
              </div>
              <div class="scheme2-trust-line">不会自动群发 · 不会修改客户资料 · 可随时解除</div>
            </div>
            <div class="scheme2-qr-card" :class="{ authorized: scheme2Authorized }" aria-label="门店客服号授权二维码">
              <div class="mock-qr" aria-hidden="true">
                <i v-for="index in 25" :key="index"></i>
              </div>
              <strong>门店客服号授权</strong>
              <span>{{ scheme2Authorized ? '扫码授权成功，AI 正在准备初始化' : '请使用企微扫码授权门店客服号' }}</span>
              <p>扫码后约 60 秒，AI 会告诉你今天该找谁、怎么跟进、预计能多赚多少钱。</p>
              <button type="button" :disabled="scheme2Authorized" @click="authorizeScheme2ServiceAccount">
                {{ scheme2Authorized ? '已扫码授权' : '已扫码授权' }}
              </button>
            </div>
          </section>

          <section v-else-if="scheme2Step === 'initializing'" class="scheme2-init-layout">
            <div class="scheme2-initializing-stage">
              <aside class="scheme2-init-hero">
                <span>{{ scheme2InitReady ? '识别完成' : 'AI 正在工作' }}</span>
                <h3>AI 正在读取<br />你的客户资产</h3>
                <p>建档、分层、找机会，生成今天的经营任务。</p>
                <div class="scheme2-power-meter">
                  <strong>{{ scheme2PowerLeft }}</strong>
                  <small>剩余 AI算力</small>
                  <b><i :style="{ width: `${Math.max(0, 100 - scheme2TaskProgress)}%` }"></i></b>
                </div>
              </aside>
              <div class="scheme2-task-list">
                <article v-for="task in scheme2Tasks" :key="task.title" :class="task.status">
                  <i></i>
                  <div>
                    <strong>{{ task.title }}</strong>
                    <span>{{ task.desc }}</span>
                  </div>
                  <em>{{ task.status === 'done' ? '完成' : task.status === 'active' ? '处理中' : '待处理' }}</em>
                </article>
              </div>
            </div>
            <div v-if="scheme2InitReady" class="scheme2-ready-panel">
              <span>AI 已识别出今日客户机会，并测算了预计收益。</span>
              <button type="button" @click="viewScheme2Result">查看 AI 经营结果</button>
            </div>
          </section>

          <section v-else class="scheme2-result-stage">
            <span class="scheme2-complete-pill">✓ {{ scheme2IndustryName }}行业模型初始化完成</span>
            <h3>AI 已经理解你的门店</h3>
            <div class="scheme2-metric-grid">
              <article v-for="metric in scheme2ResultMetrics" :key="metric.label">
                <i :class="metric.icon"></i>
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
              </article>
            </div>
            <div class="scheme2-plan-banner">AI 已生成今日运营策略和任务编排，审批通过后将自动执行。</div>
            <button class="scheme2-profit-button" type="button" @click="finishScheme2Init">
              <span>前往审批今日策略</span>
              <i aria-hidden="true"></i>
            </button>
          </section>
        </section>
      </section>
    </div>
  </main>
</template>
