<template>
  <div class="app-shell">
    <aside class="primary-nav">
      <div class="edition">定制版 plus</div>
      <div class="brand-mark">Y</div>
      <div class="brand-name">恒奕美源商城平台</div>
      <button
        v-for="item in primaryMenus"
        :key="item.label"
        class="primary-item"
        :class="{ active: item.label === '营销' }"
        type="button"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </button>
      <button class="search-entry" type="button">
        <Search />
        <span>搜索(ctrl+Q)</span>
      </button>
    </aside>

    <aside class="partner-nav">
      <button
        v-for="item in partnerMenus"
        :key="item.section"
        class="partner-item"
        :class="{ active: activeSection === item.section, disabled: item.disabled }"
        type="button"
        :aria-disabled="item.disabled"
        @click="go(item.path)"
      >
        <span>{{ item.label }}</span>
        <ArrowRight v-if="item.hasChildren" />
      </button>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <span>营销应用</span>
        <span>/</span>
        <span>超级合伙人</span>
      </header>

      <section class="content">
        <PartnersView v-if="activeSection === 'partners'" />
        <LocalMerchantsView v-else-if="activeSection === 'local'" />
        <AnalyticsView v-else-if="activeSection === 'analytics'" />
        <ProjectsView v-else-if="activeSection === 'projects'" />
        <RelationsView v-else-if="activeSection === 'relations'" />
        <ContractTemplateView v-else-if="activeSection === 'contract'" />
        <SettingsView v-else />
      </section>
    </main>
  </div>
</template>

<script setup lang="tsx">
import { computed, defineComponent, h, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  AlarmClock,
  ArrowRight,
  Box,
  Briefcase,
  ChatDotRound,
  CopyDocument,
  DataAnalysis,
  Delete,
  Download,
  EditPen,
  PieChart,
  Plus,
  Promotion,
  QuestionFilled,
  Search,
  Setting,
  TrendCharts,
  User,
  Watermelon
} from '@element-plus/icons-vue'
import type { PartnerSection } from './router'

type BusinessRuleChainLevel = {
  level: string
  enabled: boolean
  directRatio: string
}

type BusinessRuleRow = {
  item: string
  merchantNo: string
  ratio: string
  chainLevels: BusinessRuleChainLevel[]
}

const route = useRoute()
const router = useRouter()

const primaryMenus = [
  { label: '预约', icon: AlarmClock },
  { label: '开单', icon: Promotion },
  { label: '顾客', icon: User },
  { label: '公域', icon: Watermelon },
  { label: '私域', icon: ChatDotRound },
  { label: '智能体', icon: Briefcase },
  { label: '营销', icon: EditPen },
  { label: '报表', icon: DataAnalysis },
  { label: '库存', icon: Box },
  { label: '设置', icon: Setting }
]

const partnerMenus: Array<{
  label: string
  section: PartnerSection
  path: string
  hasChildren?: boolean
  disabled?: boolean
}> = [
  { label: '合伙人列表', section: 'partners', path: '/partners', hasChildren: true },
  { label: '本地商家', section: 'local', path: '/local-merchants', disabled: true },
  { label: '推广数据', section: 'analytics', path: '/analytics', hasChildren: true },
  { label: '推广项目', section: 'projects', path: '/projects', hasChildren: true },
  { label: '客户关系', section: 'relations', path: '/relations', disabled: true },
  { label: '合同签约', section: 'contract', path: '/contract-signing', hasChildren: true },
  { label: '合伙人设置', section: 'settings', path: '/settings', hasChildren: true }
]

const activeSection = computed(() => (route.meta.section || 'partners') as PartnerSection)

function go(path: string) {
  const target = partnerMenus.find((item) => item.path === path)
  if (target?.disabled) return
  void router.push(path)
}

const EmptyBlock = defineComponent({
  props: {
    title: { type: String, required: true },
    text: { type: String, default: '页面内容后续补充，本期先完成菜单入口和模块位置。' }
  },
  setup(props) {
    return () =>
      h('div', { class: 'empty-block' }, [
        h('div', { class: 'empty-title' }, props.title),
        h('div', { class: 'empty-text' }, props.text)
      ])
  }
})

const PartnersView = defineComponent({
  setup() {
    const rows = [
      {
        name: '恒奕-郭小云',
        phone: '15831704477',
        level: '商城共建',
        levelTag: 'V2',
        parent: '恒奕-李奇',
        parentPhone: '18631713311',
        childCount: 0,
        directCustomer: 0,
        indirectCustomer: 0,
        directSales: 0,
        indirectSales: 0,
        directProfit: 0,
        indirectProfit: 0,
        cashIncome: 0,
        pointIncome: 0,
        selfCommission: 0,
        partnerIncome: 0,
        settled: 0,
        pendingSettle: 0,
        withdrawn: 0,
        pendingWithdraw: 0,
        frozen: 0,
        joinedAt: '2026-06-25 09:41:07',
        expiredAt: '永久',
        contractStatus: '生效中',
        signed: true,
        dealerId: '-'
      }
    ]

    return () => (
      <div>
        <el-tabs model-value="list">
          <el-tab-pane label="合伙人列表" name="list" />
          <el-tab-pane label="操作记录" name="records" disabled />
        </el-tabs>
        <div class="toolbar partner-list-toolbar">
          <el-select model-value="first" class="filter small-filter" placeholder="首次加入时间">
            <el-option label="首次加入时间" value="first" />
          </el-select>
          <el-date-picker type="daterange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
          <el-select model-value="" class="filter" placeholder="全部等级">
            <el-option label="全部等级" value="" />
            <el-option label="商城共建" value="co" />
            <el-option label="店家" value="store" />
          </el-select>
          <el-select model-value="" class="filter" placeholder="合约状态">
            <el-option label="全部合约状态" value="" />
            <el-option label="生效中" value="active" />
            <el-option label="待签约" value="pending" />
            <el-option label="已失效" value="invalid" />
          </el-select>
          <el-select model-value="" class="filter wide-filter" placeholder="是否绑分账账户">
            <el-option label="全部" value="" />
            <el-option label="已绑定" value="yes" />
            <el-option label="未绑定" value="no" />
          </el-select>
          <el-select model-value="" class="filter" placeholder="不限商家">
            <el-option label="不限商家" value="" />
          </el-select>
          <el-input class="search-box" placeholder="合伙人的手机号/昵称" />
          <el-button>查询</el-button>
          <el-button>导出</el-button>
          <el-button>批量导入</el-button>
          <el-button type="primary">添加合伙人</el-button>
        </div>
        <el-table data={rows} border class="main-table partner-table">
          <el-table-column type="selection" width="46" fixed="left" />
          <el-table-column label="昵称" width="150" fixed="left">
            {{
              default: ({ row }: { row: { name: string; phone: string; signed: boolean } }) => (
                <div>
                  <div class="name-line">
                    <span>{row.name}</span>
                    {row.signed ? <el-tag size="small" type="success">已签约</el-tag> : null}
                  </div>
                  <div class="sub-value">{row.phone}</div>
                </div>
              )
            }}
          </el-table-column>
          <el-table-column label="等级" width="140">
            {{
              default: ({ row }: { row: { level: string; levelTag: string } }) => (
                <div class="level-cell">
                  <span>{row.level}</span>
                  <el-tag size="small" type="primary">{row.levelTag}</el-tag>
                </div>
              )
            }}
          </el-table-column>
          <el-table-column label="上级合伙人" width="150">
            {{
              default: ({ row }: { row: { parent: string; parentPhone: string } }) => (
                <div>
                  <div>{row.parent}</div>
                  <div class="sub-value">{row.parentPhone}</div>
                </div>
              )
            }}
          </el-table-column>
          <el-table-column prop="childCount" label="下级合伙人数(人)" width="150" />
          <el-table-column prop="directCustomer" label="直接客户数(人)" width="140" />
          <el-table-column prop="indirectCustomer" label="间接客户数(人)" width="140" />
          <el-table-column prop="directSales" label="累计直接推广业绩(元)" width="170" />
          <el-table-column prop="indirectSales" label="累计间接推广业绩(元)" width="170" />
          <el-table-column prop="directProfit" label="累计直接贡献毛利(元)" width="180" />
          <el-table-column prop="indirectProfit" label="累计间接贡献毛利(元)" width="180" />
          <el-table-column prop="cashIncome" label="累计现金收益(元)" width="150" />
          <el-table-column prop="pointIncome" label="累计积分收益(分)" width="150" />
          <el-table-column prop="selfCommission" label="累计自购返佣" width="140" />
          <el-table-column prop="partnerIncome" label="累计合伙收入(元)" width="150" />
          <el-table-column prop="settled" label="已结算" width="100" />
          <el-table-column prop="pendingSettle" label="待结算" width="100" />
          <el-table-column prop="withdrawn" label="已提现" width="100" />
          <el-table-column prop="pendingWithdraw" label="待提现" width="100" />
          <el-table-column prop="frozen" label="冻结" width="90" />
          <el-table-column prop="joinedAt" label="加入时间" width="170" />
          <el-table-column prop="expiredAt" label="合约到期时间" width="140" />
          <el-table-column label="合约状态" width="120">
            {{
              default: ({ row }: { row: { contractStatus: string } }) => (
                <el-tag size="small" type="primary">{row.contractStatus}</el-tag>
              )
            }}
          </el-table-column>
          <el-table-column prop="dealerId" label="外部经销商ID" width="150" />
          <el-table-column label="操作" width="190" fixed="right">
            {{
              default: () => (
                <div class="link-actions">
                  <el-button link type="primary">详情</el-button>
                  <el-button link type="primary">编辑</el-button>
                  <el-button link type="primary">奖励</el-button>
                  <el-button link type="primary">结算</el-button>
                  <el-button link type="primary">编辑收款账户</el-button>
                </div>
              )
            }}
          </el-table-column>
        </el-table>
      </div>
    )
  }
})

const LocalMerchantsView = defineComponent({
  setup() {
    return () => (
      <div>
        <el-tabs model-value="merchant">
          <el-tab-pane label="商家列表" name="merchant" />
          <el-tab-pane label="对账报表" name="report" disabled />
        </el-tabs>
        <EmptyBlock title="本地商家" text="保持原有菜单位置，本次不新增页面细节。" />
      </div>
    )
  }
})

const AnalyticsView = defineComponent({
  setup() {
    const active = ref('ledger')
    const ledgerTab = ref('overview')
    const rewardDataView = ref('overview')
    const ledgerDateRange = ref<[string, string] | []>([])
    const rewardNameFilter = ref('')
    const focusedEntryKey = ref('')
    const detailVisible = ref(false)
    const importExpenseVisible = ref(false)
    const rewardRuleDialogVisible = ref(false)
    const rewardRuleMode = ref<'create' | 'edit'>('create')
    const editingRewardRuleIndex = ref<number | null>(null)
    const currentEntry = ref<{
      time: string
      book: string
      type: string
      amount: string
      source: string
      people: Array<{ name: string; phone: string; level: string; amount: string; status: string; push: string }>
    } | null>(null)
    const incomeNameOptions = ['共建奖励', '联盟店奖励', '总部成本', '销售提成']
    const rewardRuleForm = ref({
      name: '',
      incomeName: '',
      transactionTypes: ['进账', '出账'],
      autoPush: true,
      roles: ['商城共建'],
      content: '本次奖励池入账{本次奖励池入账金额}元，当前余额{当前余额}元。'
    })
    const rewardAccounts = [
      { name: '共建奖励', incomeName: '共建奖励', balance: '¥ 26,800.00', income: '¥ 30,000.00', expense: '¥ 3,200.00', last: '2026-06-30 18:00' },
      { name: '联盟店奖励', incomeName: '联盟店奖励', balance: '¥ 120,000.00', income: '¥ 120,000.00', expense: '¥ 0.00', last: '2026-06-25 15:10' }
    ]
    const rewardRules = ref([
      {
        name: '共建奖励',
        incomeName: '共建奖励',
        transactionTypes: ['进账', '出账'],
        autoPush: true,
        roles: ['商城共建'],
        content: '本次奖励池入账{本次奖励池入账金额}元，当前余额{当前余额}元。'
      },
      {
        name: '联盟店奖励',
        incomeName: '联盟店奖励',
        transactionTypes: ['进账', '出账'],
        autoPush: true,
        roles: ['联盟店'],
        content: '本次奖励池入账{本次奖励池入账金额}元，当前余额{当前余额}元。'
      }
    ])
    const incomePushFields = [
      { label: '本次奖励池入账金额', token: '{本次奖励池入账金额}' },
      { label: '当前余额', token: '{当前余额}' }
    ]
    const partnerLevelOptions = ['商城共建', '联盟店']
    const entries = [
      {
        time: '2026-06-25 14:20',
        book: '共建奖励账户',
        type: '进账',
        amount: '+1000.00',
        source: '1万共建办理单',
        people: [{ name: '恒奕-郭小云', phone: '15831704477', level: '商城共建', amount: '1000.00', status: '已入账', push: '已推送' }]
      },
      {
        time: '2026-06-25 15:10',
        book: '联盟店奖励账户',
        type: '进账',
        amount: '+60000.00',
        source: '30万联盟店办理单',
        people: [{ name: '恒奕-李明', phone: '18631713311', level: '联盟店', amount: '60000.00', status: '已入账', push: '已推送' }]
      },
      {
        time: '2026-06-30 18:00',
        book: '共建奖励账户',
        type: '出账',
        amount: '-3200.00',
        source: '发放奖励',
        people: [
          { name: '恒奕-郭小云', phone: '15831704477', level: '商城共建', amount: '1800.00', status: '已发放', push: '已推送' },
          { name: '恒奕-王静', phone: '13700008888', level: '商城共建', amount: '1400.00', status: '已发放', push: '已推送' }
        ]
      }
    ]
    const filteredEntries = computed(() =>
      entries.filter((entry) => {
        const rewardName = entry.book.replace('账户', '')
        const matchesName = !rewardNameFilter.value || rewardName === rewardNameFilter.value
        const [startDate, endDate] = ledgerDateRange.value
        const entryDate = entry.time.slice(0, 10)
        const matchesDate = !startDate || !endDate || (entryDate >= startDate && entryDate <= endDate)
        return matchesName && matchesDate
      })
    )
    const rewardDetailRows = computed(() =>
      filteredEntries.value
        .filter((entry) => !focusedEntryKey.value || `${entry.time}-${entry.book}-${entry.source}` === focusedEntryKey.value)
        .flatMap((entry) =>
          entry.people.map((person) => ({
            time: entry.time,
            rewardName: entry.book.replace('账户', ''),
            type: entry.type,
            partner: person.name,
            phone: person.phone,
            level: person.level,
            amount: entry.type === '出账' ? `-${person.amount}` : `+${person.amount}`,
            source: entry.source,
            status: person.status,
            push: person.push
          }))
        )
    )

    function openEntryDetail(row: (typeof entries)[number]) {
      const rewardName = row.book.replace('账户', '')
      const entryDate = row.time.slice(0, 10)
      rewardNameFilter.value = rewardName
      ledgerDateRange.value = [entryDate, entryDate]
      focusedEntryKey.value = `${row.time}-${row.book}-${row.source}`
      rewardDataView.value = 'detail'
    }

    function openRewardRuleCreate() {
      rewardRuleMode.value = 'create'
      editingRewardRuleIndex.value = null
      rewardRuleForm.value = {
        name: '',
        incomeName: '',
        transactionTypes: ['进账', '出账'],
        autoPush: true,
        roles: ['商城共建'],
        content: '本次奖励池入账{本次奖励池入账金额}元，当前余额{当前余额}元。'
      }
      rewardRuleDialogVisible.value = true
    }

    function openRewardRuleEdit(rule: (typeof rewardRules.value)[number], index: number) {
      rewardRuleMode.value = 'edit'
      editingRewardRuleIndex.value = index
      rewardRuleForm.value = {
        name: rule.name,
        incomeName: rule.incomeName,
        transactionTypes: [...rule.transactionTypes],
        autoPush: rule.autoPush,
        roles: [...rule.roles],
        content: rule.content
      }
      rewardRuleDialogVisible.value = true
    }

    function updateRewardIncome(value: string) {
      rewardRuleForm.value.incomeName = value
      if (!rewardRuleForm.value.name) {
        rewardRuleForm.value.name = value
      }
    }

    function saveRewardRule() {
      const nextRule = { ...rewardRuleForm.value, roles: [...rewardRuleForm.value.roles] }
      if (rewardRuleMode.value === 'edit' && editingRewardRuleIndex.value !== null) {
        rewardRules.value.splice(editingRewardRuleIndex.value, 1, nextRule)
      } else {
        rewardRules.value.push(nextRule)
      }
      rewardRuleDialogVisible.value = false
    }

    function removeRewardRule(index: number) {
      rewardRules.value.splice(index, 1)
    }

    function insertPushField(token: string) {
      rewardRuleForm.value.content = `${rewardRuleForm.value.content}${token}`
    }

    function handlePushFieldDrop(event: DragEvent) {
      event.preventDefault()
      const token = event.dataTransfer?.getData('text/plain')
      if (token) {
        insertPushField(token)
      }
    }

    return () => (
      <div>
        <el-tabs v-model={active.value}>
          <el-tab-pane label="推广分佣总览" name="summary" disabled />
          <el-tab-pane label="推广分佣明细" name="commission" disabled />
          <el-tab-pane label="奖励数据" name="ledger" />
        </el-tabs>
        {active.value === 'ledger' ? (
          ledgerTab.value === 'overview' ? (
              <>
                <div class="reward-summary-panel">
                  <div class="metric-strip">
                    <div class="metric">
                      <span>共建奖励余额</span>
                      <strong>¥ 26,800.00</strong>
                    </div>
                    <div class="metric">
                      <span>联盟店奖励余额</span>
                      <strong>¥ 120,000.00</strong>
                    </div>
                    <div class="metric">
                      <span>本月动账记录</span>
                      <strong>3</strong>
                    </div>
                  </div>
                </div>
                <el-tabs v-model={rewardDataView.value} class="sub-tabs reward-data-sub-tabs">
                  <el-tab-pane label="奖励总览" name="overview" />
                  <el-tab-pane label="收支明细" name="detail" />
                  <el-tab-pane label="奖励设置" name="settings" />
                </el-tabs>
                {rewardDataView.value !== 'settings' ? (
                  <div class="toolbar">
                    <el-date-picker v-model={ledgerDateRange.value} class="compact-date-range" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" />
                    <el-select v-model={rewardNameFilter.value} class="filter" placeholder="奖励名称">
                      <el-option label="全部奖励名称" value="" />
                      <el-option label="共建奖励" value="共建奖励" />
                      <el-option label="联盟店奖励" value="联盟店奖励" />
                    </el-select>
                    {rewardDataView.value === 'overview' ? <el-button>导出总览</el-button> : <el-button>导出明细</el-button>}
                    <el-button type="primary" onClick={() => (importExpenseVisible.value = true)}>Excel导入支出</el-button>
                  </div>
                ) : null}
                {rewardDataView.value === 'overview' ? (
                  <el-table data={filteredEntries.value} border class="main-table">
                    <el-table-column prop="time" label="动账时间" width="180" />
                    <el-table-column prop="book" label="奖励名称" width="160" />
                    <el-table-column prop="type" label="动账类型" width="100" />
                    <el-table-column prop="amount" label="动账金额" width="130" />
                    <el-table-column prop="source" label="来源/批次" min-width="180" />
                    <el-table-column label="操作" width="100">
                      {{ default: ({ row }: { row: (typeof entries)[number] }) => <el-button link type="primary" onClick={() => openEntryDetail(row)}>详情</el-button> }}
                    </el-table-column>
                  </el-table>
                ) : rewardDataView.value === 'detail' ? (
                  <el-table data={rewardDetailRows.value} border class="main-table">
                    <el-table-column prop="time" label="动账时间" width="180" />
                    <el-table-column prop="rewardName" label="奖励名称" width="130" />
                    <el-table-column prop="type" label="收支类型" width="100" />
                    <el-table-column label="合伙人" width="180">
                      {{
                        default: ({ row }: { row: (typeof rewardDetailRows.value)[number] }) => (
                          <div>
                            <div>{row.partner}</div>
                            <div class="sub-value">{row.phone}</div>
                          </div>
                        )
                      }}
                    </el-table-column>
                    <el-table-column prop="level" label="合伙人等级" width="120" />
                    <el-table-column prop="source" label="贡献来源/支出批次" min-width="180" />
                    <el-table-column prop="amount" label="明细金额" width="120" />
                    <el-table-column prop="status" label="状态" width="100" />
                    <el-table-column prop="push" label="推送结果" width="100" />
                  </el-table>
                ) : (
                  <>
                    <div class="toolbar settings-toolbar">
                      <el-button type="primary" onClick={openRewardRuleCreate}>新增奖励</el-button>
                    </div>
                    <el-table data={rewardRules.value} border class="main-table reward-rules-table">
                      <el-table-column prop="name" label="奖励名称" min-width="130" />
                      <el-table-column prop="incomeName" label="关联收益名称" min-width="140" />
                      <el-table-column label="动账推送" width="110">
                        {{
                          default: ({ row }: { row: (typeof rewardRules.value)[number] }) => (
                            <el-tag size="small" type={row.autoPush ? 'success' : 'info'}>{row.autoPush ? '已开启' : '已关闭'}</el-tag>
                          )
                        }}
                      </el-table-column>
                      <el-table-column label="推送对象" min-width="170">
                        {{
                          default: ({ row }: { row: (typeof rewardRules.value)[number] }) => (
                            <div class="tag-list">
                              {row.roles.map((role) => (
                                <el-tag size="small" key={`${row.name}-${role}`}>{role}</el-tag>
                              ))}
                            </div>
                          )
                        }}
                      </el-table-column>
                      <el-table-column prop="content" label="推送内容" min-width="220" show-overflow-tooltip />
                      <el-table-column label="操作" width="170">
                        {{
                          default: ({ row, $index }: { row: (typeof rewardRules.value)[number]; $index: number }) => (
                            <div class="link-actions">
                              <el-button link type="primary" onClick={() => openRewardRuleEdit(row, $index)}>编辑</el-button>
                              <el-button link type="primary">停用</el-button>
                              <el-button link type="danger" onClick={() => removeRewardRule($index)}>删除</el-button>
                            </div>
                          )
                        }}
                      </el-table-column>
                    </el-table>
                  </>
                )}
              </>
          ) : null
        ) : (
          <EmptyBlock title={active.value === 'summary' ? '推广分佣总览' : '推广分佣明细'} text="沿用现有推广数据页面，本次只新增奖励数据入口。" />
        )}
        <el-drawer v-model={rewardRuleDialogVisible.value} title={rewardRuleMode.value === 'create' ? '新增奖励' : `编辑奖励：${rewardRuleForm.value.name || '未命名奖励'}`} size="560px">
          {{
              default: () => (
                <el-form label-width="110px" class="reward-rule-form">
                        <el-form-item label="奖励名称" required>
                          <el-input v-model={rewardRuleForm.value.name} placeholder="请输入奖励名称，如：共建奖励" />
                        </el-form-item>
                        <el-form-item label="关联收益名称" required>
                          <el-select model-value={rewardRuleForm.value.incomeName} placeholder="选择收益名称" class="full-control" onChange={(value: string) => updateRewardIncome(value)}>
                            {incomeNameOptions.map((name) => (
                              <el-option label={name} value={name} key={name} />
                            ))}
                          </el-select>
                        </el-form-item>
                        <el-form-item label="动账推送">
                          <el-switch v-model={rewardRuleForm.value.autoPush} active-text="账户动账自动推送" />
                        </el-form-item>
                        {rewardRuleForm.value.autoPush ? (
                          <>
                            <el-form-item label="推送对象">
                              <el-checkbox-group v-model={rewardRuleForm.value.roles}>
                                {partnerLevelOptions.map((level) => (
                                  <el-checkbox label={level} key={level} />
                                ))}
                              </el-checkbox-group>
                            </el-form-item>
                            <el-form-item label="推送内容">
                              <div class="push-content-editor" onDragover={(event: DragEvent) => event.preventDefault()} onDrop={handlePushFieldDrop}>
                                <el-input v-model={rewardRuleForm.value.content} type="textarea" autosize={{ minRows: 3, maxRows: 4 }} />
                                <div class="push-field-list">
                                  {incomePushFields.map((field) => (
                                    <button
                                      type="button"
                                      class="push-field-token"
                                      draggable="true"
                                      onClick={() => insertPushField(field.token)}
                                      onDragstart={(event: DragEvent) => event.dataTransfer?.setData('text/plain', field.token)}
                                    >
                                      {field.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </el-form-item>
                          </>
                        ) : null}
              </el-form>
            ),
            footer: () => (
              <div class="drawer-footer">
                <el-button onClick={() => (rewardRuleDialogVisible.value = false)}>取消</el-button>
                <el-button type="primary" onClick={saveRewardRule}>保存</el-button>
              </div>
            )
          }}
        </el-drawer>
        <el-drawer v-model={importExpenseVisible.value} title="Excel导入支出" size="520px">
          {{
            default: () => (
              <div class="expense-import-panel">
                <el-upload drag action="#" auto-upload={false} accept=".xlsx,.xls">
                  {{
                    default: () => (
                      <div class="expense-upload-box">
                        <Download />
                        <strong>上传支出明细文件</strong>
                        <span>支持 .xlsx / .xls 文件</span>
                      </div>
                    )
                  }}
                </el-upload>
                <div class="import-template-block">
                  <div class="import-template-head">
                    <strong>导入模板字段</strong>
                    <el-button icon={Download}>下载模板</el-button>
                  </div>
                  <el-table
                    data={[
                      { field: '发放时间', example: '2026-06-30 18:00' },
                      { field: '发放合伙人名字', example: '恒奕-郭小云' },
                      { field: '手机号', example: '15831704477' },
                      { field: '发放金额', example: '1800.00' }
                    ]}
                    border
                    class="main-table"
                  >
                    <el-table-column prop="field" label="字段" width="170" />
                    <el-table-column prop="example" label="示例" min-width="180" />
                  </el-table>
                </div>
              </div>
            ),
            footer: () => (
              <div class="drawer-footer">
                <el-button onClick={() => (importExpenseVisible.value = false)}>取消</el-button>
                <el-button type="primary">确认导入</el-button>
              </div>
            )
          }}
        </el-drawer>
        <el-drawer v-model={detailVisible.value} title="动账明细" size="640px">
              {currentEntry.value ? (
                <div class="entry-detail">
                  <div class="entry-summary">
                    <span>{currentEntry.value.book}</span>
                    <strong>{currentEntry.value.amount}</strong>
                    <em>{currentEntry.value.source}</em>
                  </div>
                  <el-table data={currentEntry.value.people} border class="main-table">
                    <el-table-column prop="name" label="发放人员" width="130" />
                    <el-table-column prop="phone" label="手机号" width="130" />
                    <el-table-column prop="level" label="身份" width="110" />
                    <el-table-column prop="amount" label="金额" width="110" />
                    <el-table-column prop="status" label="发放状态" width="110" />
                    <el-table-column prop="push" label="推送结果" min-width="110" />
                  </el-table>
                </div>
              ) : null}
        </el-drawer>
      </div>
    )
  }
})

const ProjectsView = defineComponent({
  setup() {
    const active = ref('star')
    const incomeInfoByName: Record<string, { company: string; merchantNo: string; calculate: string; linkPartnerChain?: boolean }> = {
      总部成本: { company: '恒奕美源总部运营公司', merchantNo: 'LKL-10001001', calculate: '按销售金额算' },
      共建奖励: { company: '恒奕美源共建奖励池', merchantNo: 'LKL-10001002', calculate: '按销售金额算' },
      联盟店奖励: { company: '恒奕美源联盟店奖励池', merchantNo: 'LKL-10001003', calculate: '按销售金额算' },
      销售提成: { company: '恒奕美源销售收益账户', merchantNo: 'LKL-10001004', calculate: '按销售金额算', linkPartnerChain: true },
      商城营销推广费: { company: '恒奕美源商城营销推广费账户', merchantNo: 'LKL-10001005', calculate: '按推广业绩算' },
      技术服务费: { company: '恒奕美源技术服务费账户', merchantNo: 'LKL-10001006', calculate: '按销售金额算' },
      总部交付成本: { company: '恒奕美源总部交付成本账户', merchantNo: 'LKL-10001007', calculate: '按销售金额算' }
    }
    const merchantNameByNo: Record<string, string> = {
      'LKL-10001001': '恒奕美源总部运营公司',
      'LKL-10001002': '恒奕美源共建奖励池',
      'LKL-10001003': '恒奕美源联盟店奖励池',
      'LKL-10001004': '恒奕美源销售收益账户',
      'LKL-10001005': '恒奕美源商城营销推广费账户',
      'LKL-10001006': '恒奕美源技术服务费账户',
      'LKL-10001007': '恒奕美源总部交付成本账户'
    }
    const partnerChainLevels = ['商城共建', '联盟店']
    const createPartnerChainLevels = () => partnerChainLevels.map((level) => ({ level, enabled: false, directRatio: '' }))
    const createRuleRow = (item = '', merchantNo = '', ratio = ''): BusinessRuleRow => ({
      item,
      merchantNo,
      ratio,
      chainLevels: incomeInfoByName[item]?.linkPartnerChain ? createPartnerChainLevels() : []
    })
    const drawerVisible = ref(false)
    const drawerMode = ref<'create' | 'edit'>('create')
    const codeVisible = ref(false)
    const productDrawerVisible = ref(false)
    const productDrawerMode = ref<'create' | 'edit'>('edit')
    const currentBusiness = ref('1万共建')
    const currentProductBusiness = ref('399控制糖卡')
    const ruleRows = ref<BusinessRuleRow[]>([
      createRuleRow('共建奖励', 'LKL-10001002', '10'),
      createRuleRow('总部成本', 'LKL-10001001', '39'),
      createRuleRow('销售提成', 'LKL-10001004', '40')
    ])
    const form = ref({
      name: '1万共建',
      amount: '10000',
      level: '商城共建',
      benefit: '1万共建权益套餐'
    })
    const rows = [
      {
        name: '1万共建',
        amount: '¥10,000',
        level: '商城共建',
        benefit: '1万共建权益套餐',
        rules: [
          { item: '共建奖励', ratio: '10%' },
          { item: '总部成本', ratio: '39%' },
          { item: '销售提成', ratio: '40%' }
        ],
        code: '已生成'
      },
      {
        name: '30万联盟店',
        amount: '¥300,000',
        level: '联盟店',
        benefit: '30万联盟店权益套餐',
        rules: [
          { item: '联盟店奖励', ratio: '20%' },
          { item: '总部成本', ratio: '45%' },
          { item: '销售提成', ratio: '24%' }
        ],
        code: '已生成'
      }
    ]
    const productForm = ref({
      name: '399控制糖卡',
      product: '399控制糖卡',
      amount: '399',
      promotionRate: '10',
      marketingAccount: '商城营销推广费',
      commissionRate: '40',
      commissionAccount: '销售提成',
      reserveRate: '10',
      techRate: '1.12',
      techAccount: '技术服务费',
      deliveryRate: '38.88',
      deliveryAccount: '总部交付成本'
    })
    const productLayerRows = ref<BusinessRuleRow[]>([
      createRuleRow('商城营销推广费', 'LKL-10001005', '10'),
      createRuleRow('销售提成', 'LKL-10001004', '40'),
      createRuleRow('技术服务费', 'LKL-10001006', '1.12'),
      createRuleRow('总部交付成本', 'LKL-10001007', '38.88')
    ])
    const productRows = [
      {
        name: '399控制糖卡',
        product: '399控制糖卡',
        amount: '¥399',
        promotion: '推广业绩 10%',
        marketing: '商城营销推广费承接剩余',
        commission: '销售提成 40%',
        settlement: '预留10% / 技术1.12% / 交付38.88%',
        status: '已启用'
      }
    ]
    const productLayerOptions = ['商城营销推广费', '销售提成', '技术服务费', '总部交付成本']

    function openCreate() {
      drawerMode.value = 'create'
      form.value = {
        name: '',
        amount: '',
        level: '',
        benefit: ''
      }
      ruleRows.value = [createRuleRow()]
      drawerVisible.value = true
    }

    function openEdit(row: (typeof rows)[number]) {
      drawerMode.value = 'edit'
      currentBusiness.value = row.name
      form.value = {
        name: row.name,
        amount: row.name === '1万共建' ? '10000' : '300000',
        level: row.level,
        benefit: row.benefit
      }
      ruleRows.value =
        row.name === '1万共建'
          ? [
              createRuleRow('共建奖励', 'LKL-10001002', '10'),
              createRuleRow('总部成本', 'LKL-10001001', '39'),
              createRuleRow('销售提成', 'LKL-10001004', '40')
            ]
          : [
              createRuleRow('联盟店奖励', 'LKL-10001003', '20'),
              createRuleRow('总部成本', 'LKL-10001001', '45'),
              createRuleRow('销售提成', 'LKL-10001004', '24')
            ]
      drawerVisible.value = true
    }

    function openCode(rowName?: string) {
      currentBusiness.value = rowName || form.value.name || '未命名业务'
      codeVisible.value = true
    }

    function addRule() {
      ruleRows.value.push(createRuleRow())
    }

    function removeRule(index: number) {
      if (ruleRows.value.length === 1) return
      ruleRows.value.splice(index, 1)
    }

    function saveBusiness() {
      currentBusiness.value = form.value.name || '未命名业务'
      drawerVisible.value = false
      codeVisible.value = true
    }

    function updateRuleItem(rule: BusinessRuleRow, value: string) {
      rule.item = value
      rule.merchantNo = incomeInfoByName[value]?.merchantNo || ''
      rule.chainLevels = incomeInfoByName[value]?.linkPartnerChain ? createPartnerChainLevels() : []
    }

    function addProductLayerRule() {
      productLayerRows.value.push(createRuleRow())
    }

    function removeProductLayerRule(index: number) {
      if (productLayerRows.value.length === 1) return
      productLayerRows.value.splice(index, 1)
    }

    function updateProductLayerItem(rule: BusinessRuleRow, value: string) {
      rule.item = value
      rule.merchantNo = incomeInfoByName[value]?.merchantNo || ''
      rule.chainLevels = incomeInfoByName[value]?.linkPartnerChain ? createPartnerChainLevels() : []
    }

    function renderPartnerChainConfig(rule: BusinessRuleRow) {
      if (!incomeInfoByName[rule.item]?.linkPartnerChain) return null
      const maxRatio = Number.parseFloat(rule.ratio) || 0
      const usedRatio = rule.chainLevels.reduce((sum, chain) => sum + (chain.enabled ? Number.parseFloat(chain.directRatio) || 0 : 0), 0)
      const isOverLimit = maxRatio > 0 && usedRatio > maxRatio
      return (
        <div class="linked-chain-config">
          <div class="linked-chain-title-row">
            <div class="linked-chain-title">关联合伙人关系链路</div>
            <div class={['linked-chain-limit', isOverLimit ? 'is-over' : '']}>
              销售提成最多 {rule.ratio || 0}%
            </div>
          </div>
          <div class="linked-chain-levels">
            {rule.chainLevels.map((chain) => (
              <div class="linked-chain-level" key={chain.level}>
                <el-checkbox v-model={chain.enabled}>{chain.level}</el-checkbox>
                {chain.enabled ? (
                  <el-input v-model={chain.directRatio} placeholder="直推提成比例">
                    {{ append: () => '%' }}
                  </el-input>
                ) : null}
              </div>
            ))}
          </div>
          <p>
            勾选等级后配置该等级直推提成比例，直推优先，剩余部分按间推处理；无人直推时归属总部的保底账户。
            {isOverLimit ? <span class="linked-chain-over-tip"> 当前已超过可分配比例。</span> : null}
          </p>
        </div>
      )
    }

    function openProductCreate() {
      productDrawerMode.value = 'create'
      currentProductBusiness.value = '新建产品销售业务'
      productForm.value = {
        name: '',
        product: '',
        amount: '',
        promotionRate: '10',
        marketingAccount: '商城营销推广费',
        commissionRate: '40',
        commissionAccount: '销售提成',
        reserveRate: '10',
        techRate: '1.12',
        techAccount: '技术服务费',
        deliveryRate: '38.88',
        deliveryAccount: '总部交付成本'
      }
      productLayerRows.value = [
        createRuleRow('商城营销推广费', 'LKL-10001005', '10'),
        createRuleRow('销售提成', 'LKL-10001004', '40'),
        createRuleRow('技术服务费', 'LKL-10001006', '1.12'),
        createRuleRow('总部交付成本', 'LKL-10001007', '38.88')
      ]
      productDrawerVisible.value = true
    }

    function openProductEdit(row: (typeof productRows)[number]) {
      productDrawerMode.value = 'edit'
      currentProductBusiness.value = row.name
      productForm.value = {
        name: row.name,
        product: row.product,
        amount: '399',
        promotionRate: '10',
        marketingAccount: '商城营销推广费',
        commissionRate: '40',
        commissionAccount: '销售提成',
        reserveRate: '10',
        techRate: '1.12',
        techAccount: '技术服务费',
        deliveryRate: '38.88',
        deliveryAccount: '总部交付成本'
      }
      productLayerRows.value = [
        createRuleRow('商城营销推广费', 'LKL-10001005', '10'),
        createRuleRow('销售提成', 'LKL-10001004', '40'),
        createRuleRow('技术服务费', 'LKL-10001006', '1.12'),
        createRuleRow('总部交付成本', 'LKL-10001007', '38.88')
      ]
      productDrawerVisible.value = true
    }

    return () => (
      <div>
        <el-tabs v-model={active.value}>
          <el-tab-pane label="微商城商品/套餐" name="mall" disabled />
          <el-tab-pane label="线下服务" name="service" disabled />
          <el-tab-pane label="线下商品" name="goods" disabled />
          <el-tab-pane label="线下套餐" name="package" disabled />
          <el-tab-pane label="会员卡" name="card" disabled />
          <el-tab-pane label="供应链商品" name="supply" disabled />
          <el-tab-pane label="市场招商业务" name="star" />
          <el-tab-pane label="产品销售业务" name="product" />
        </el-tabs>
        {active.value === 'star' ? (
          <div>
            <div class="module-head">
              <div>
                <h2>市场招商业务</h2>
                <p>用于配置特殊业务的办理码、权益套餐和区别于分销推广佣金外的固化特殊分成机制配置。</p>
                <div class="business-rule-note">
                  <p>该业务统一都是按销售金额来计算，与佣金推广业绩基数和消费者的支付方式无关。</p>
                  <p>该分成金额按收益名称结算到对应收益账本，再按余额分账提现到对应收款账户中。</p>
                </div>
              </div>
              <el-button type="primary" onClick={openCreate}>
                新增业务
              </el-button>
            </div>
            <el-table data={rows} border class="main-table">
              <el-table-column prop="name" label="业务名称" width="150" />
              <el-table-column prop="amount" label="业务金额" width="130" />
              <el-table-column prop="level" label="绑定身份" width="130" />
              <el-table-column prop="benefit" label="关联权益套餐" min-width="190" />
              <el-table-column label="分成规则" min-width="270">
                {{
                  default: ({ row }: { row: (typeof rows)[number] }) => (
                    <div class="business-rule-tags">
                      {row.rules.map((rule) => (
                        <span class="business-rule-tag" key={`${row.name}-${rule.item}`}>
                          <span>{rule.item}</span>
                          <strong>{rule.ratio}</strong>
                        </span>
                      ))}
                    </div>
                  )
                }}
              </el-table-column>
              <el-table-column prop="code" label="办理码" width="110" />
              <el-table-column label="操作" width="160" fixed="right">
                {{
                  default: ({ row }: { row: (typeof rows)[number] }) => (
                    <div class="link-actions">
                      <el-button link type="primary" onClick={() => openEdit(row)}>
                        编辑
                      </el-button>
                      <el-button link type="primary" onClick={() => openCode(row.name)}>
                        办理码
                      </el-button>
                    </div>
                  )
                }}
              </el-table-column>
            </el-table>
            <el-drawer v-model={drawerVisible.value} title={drawerMode.value === 'create' ? '新建业务' : `编辑业务：${currentBusiness.value}`} size="720px">
              {{
                default: () => (
                  <div class="business-drawer">
                    <section class="business-section">
                      <div class="business-section-title">基础信息</div>
                      <el-form label-width="110px" class="business-form">
                        <el-form-item label="业务名称" required>
                          <el-input v-model={form.value.name} placeholder="请输入业务名称，例如：1万共建" />
                        </el-form-item>
                        <el-form-item label="业务金额" required>
                          <el-input v-model={form.value.amount} placeholder="请输入业务金额">
                            {{ append: () => '元' }}
                          </el-input>
                        </el-form-item>
                        <el-form-item label="绑定身份" required>
                          <el-select v-model={form.value.level} placeholder="请选择身份" class="full-control">
                            <el-option label="商城共建" value="商城共建" />
                            <el-option label="联盟店" value="联盟店" />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="关联权益套餐" required>
                          <el-select v-model={form.value.benefit} placeholder="请选择系统已配置的权益套餐" class="full-control">
                            <el-option label="1万共建权益套餐" value="1万共建权益套餐" />
                            <el-option label="30万联盟店权益套餐" value="30万联盟店权益套餐" />
                          </el-select>
                        </el-form-item>
                      </el-form>
                    </section>
                    <section class="business-section">
                      <div class="business-section-title">分成规则</div>
                      <div class="rule-editor-table business-rule-editor-table">
                        <div class="rule-editor-head">
                          <span>收益名称</span>
                          <span>核算方式</span>
                          <span>自动获取收款商户号/收款方名称</span>
                          <span>分账比例</span>
                          <span>操作</span>
                        </div>
                        {ruleRows.value.map((rule, index) => (
                          <div class={['rule-editor-group', incomeInfoByName[rule.item]?.linkPartnerChain ? 'is-linked' : '']} key={`rule-group-${index}`}>
                            <div class="rule-editor-row" key={`rule-${index}`}>
                              <el-select model-value={rule.item} placeholder="选择收益名称" onChange={(value: string) => updateRuleItem(rule, value)}>
                                <el-option label="总部成本" value="总部成本" />
                                <el-option label="共建奖励" value="共建奖励" />
                                <el-option label="联盟店奖励" value="联盟店奖励" />
                                <el-option label="销售提成" value="销售提成" />
                              </el-select>
                              <div class="rule-calc-cell">{incomeInfoByName[rule.item]?.calculate || '选择收益名称后自动获取'}</div>
                              <div class="merchant-info-cell">
                                {rule.merchantNo ? (
                                  <>
                                    <strong>{rule.merchantNo}</strong>
                                    <span class={merchantNameByNo[rule.merchantNo] ? 'merchant-name-preview' : 'empty-merchant-info'}>
                                      {merchantNameByNo[rule.merchantNo] || '未匹配到收款方名称'}
                                    </span>
                                  </>
                                ) : (
                                  <span class="empty-merchant-info">选择收益名称后自动获取</span>
                                )}
                              </div>
                              <el-input v-model={rule.ratio} placeholder="比例">
                                {{ append: () => '%' }}
                              </el-input>
                              <el-button link type="danger" disabled={ruleRows.value.length === 1} onClick={() => removeRule(index)}>
                                删除
                              </el-button>
                            </div>
                            {renderPartnerChainConfig(rule)}
                          </div>
                        ))}
                      </div>
                      <el-button class="add-rule-button" icon={Plus} onClick={addRule}>
                        添加收益名称
                      </el-button>
                      <p class="business-note">收益名称在合伙人设置中维护，业务这里选择收益名称后自动获取收款商户号，并配置分账比例。</p>
                    </section>
                  </div>
                ),
                footer: () => (
                  <div class="drawer-footer">
                    <el-button onClick={() => (drawerVisible.value = false)}>取消</el-button>
                    <el-button type="primary" onClick={saveBusiness}>
                      {drawerMode.value === 'create' ? '保存并生成办理码' : '保存'}
                    </el-button>
                  </div>
                )
              }}
            </el-drawer>
            <el-dialog v-model={codeVisible.value} title="业务办理码" width="420px" class="business-code-dialog">
              <div class="business-code-preview">
                <div class="business-code-name">{currentBusiness.value}</div>
                <div class="fake-qr" aria-label={`${currentBusiness.value}办理二维码`}>
                  {Array.from({ length: 49 }).map((_, index) => (
                    <span class={(index + currentBusiness.value.length) % 3 === 0 || [0, 1, 7, 8, 40, 41, 47, 48].includes(index) ? 'dark' : ''} />
                  ))}
                </div>
                <p>员工使用移动商家版扫码后进入指定业务办理流程</p>
                <div class="code-actions">
                  <el-button icon={CopyDocument}>复制图片</el-button>
                  <el-button type="primary" icon={Download}>
                    下载二维码
                  </el-button>
                </div>
              </div>
            </el-dialog>
          </div>
        ) : active.value === 'product' ? (
          <div>
            <div class="module-head">
              <div>
                <h2>产品销售业务</h2>
                <p>用于配置 399 控制糖卡这类商品销售后的额外收益拆分，不改变原直推、间推分销链路。</p>
                <div class="business-rule-note">
                  <p>分层规则统一从收益账本选择，系统自动带出核算方式、收款商户号和收款方名称。</p>
                  <p>这里仅设置业务分账比例；如收益名称已关联合伙人关系链路，再配置对应等级的直推提成比例。</p>
                </div>
              </div>
              <el-button type="primary" onClick={openProductCreate}>
                新增产品销售业务
              </el-button>
            </div>
            <el-table data={productRows} border class="main-table product-business-table">
              <el-table-column prop="name" label="业务名称" width="150" />
              <el-table-column prop="product" label="关联套餐" width="150" />
              <el-table-column prop="amount" label="销售金额" width="110" />
              <el-table-column prop="promotion" label="推广业绩" width="130" />
              <el-table-column prop="marketing" label="商城营销推广费" min-width="170" />
              <el-table-column prop="commission" label="销售提成" width="130" />
              <el-table-column prop="settlement" label="总部结算" min-width="230" />
              <el-table-column label="状态" width="100">
                {{ default: ({ row }: { row: (typeof productRows)[number] }) => <el-tag type="success">{row.status}</el-tag> }}
              </el-table-column>
              <el-table-column label="操作" width="110" fixed="right">
                {{
                  default: ({ row }: { row: (typeof productRows)[number] }) => (
                    <div class="link-actions">
                      <el-button link type="primary" onClick={() => openProductEdit(row)}>
                        编辑
                      </el-button>
                      <el-button link type="danger">
                        停用
                      </el-button>
                    </div>
                  )
                }}
              </el-table-column>
            </el-table>
            <el-drawer
              v-model={productDrawerVisible.value}
              title={productDrawerMode.value === 'create' ? '新建产品销售业务' : `编辑产品销售业务：${currentProductBusiness.value}`}
              size="760px"
            >
              {{
                default: () => (
                  <div class="business-drawer product-business-drawer">
                    <section class="business-section">
                      <div class="business-section-title">基础信息</div>
                      <el-form label-width="120px" class="business-form">
                        <el-form-item label="业务名称" required>
                          <el-input v-model={productForm.value.name} placeholder="请输入业务名称，例如：399控制糖卡" />
                        </el-form-item>
                        <el-form-item label="关联套餐" required>
                          <el-select v-model={productForm.value.product} placeholder="请选择商城套餐" class="full-control">
                            <el-option label="399控制糖卡" value="399控制糖卡" />
                            <el-option label="980团购套餐卡" value="980团购套餐卡" disabled />
                          </el-select>
                        </el-form-item>
                      </el-form>
                    </section>
                    <section class="business-section">
                      <div class="business-section-title">分层规则设置</div>
                      <div class="rule-editor-table product-layer-rule-table">
                        <div class="rule-editor-head">
                          <span>收益名称</span>
                          <span>核算方式</span>
                          <span>自动获取收款商户号/收款方名称</span>
                          <span>分账比例</span>
                          <span>操作</span>
                        </div>
                        {productLayerRows.value.map((rule, index) => (
                          <div class={['rule-editor-group', incomeInfoByName[rule.item]?.linkPartnerChain ? 'is-linked' : '']} key={`product-rule-group-${index}`}>
                            <div class="rule-editor-row" key={`product-rule-${index}`}>
                              <el-select model-value={rule.item} placeholder="选择收益名称" onChange={(value: string) => updateProductLayerItem(rule, value)}>
                                {productLayerOptions.map((option) => (
                                  <el-option label={option} value={option} />
                                ))}
                              </el-select>
                              <div class="rule-calc-cell">{incomeInfoByName[rule.item]?.calculate || '选择收益名称后自动获取'}</div>
                              <div class="merchant-info-cell">
                                {rule.merchantNo ? (
                                  <>
                                    <strong>{rule.merchantNo}</strong>
                                    <span class={merchantNameByNo[rule.merchantNo] ? 'merchant-name-preview' : 'empty-merchant-info'}>
                                      {merchantNameByNo[rule.merchantNo] || '未匹配到收款方名称'}
                                    </span>
                                  </>
                                ) : (
                                  <span class="empty-merchant-info">选择收益名称后自动获取</span>
                                )}
                              </div>
                              <el-input v-model={rule.ratio} placeholder="比例">
                                {{ append: () => '%' }}
                              </el-input>
                              <el-button link type="danger" disabled={productLayerRows.value.length === 1} onClick={() => removeProductLayerRule(index)}>
                                删除
                              </el-button>
                            </div>
                            {renderPartnerChainConfig(rule)}
                          </div>
                        ))}
                      </div>
                      <el-button class="add-rule-button" icon={Plus} onClick={addProductLayerRule}>
                        添加收益名称
                      </el-button>
                      <p class="business-note">收益名称在收益账本中维护；选择后自动获取核算方式和收款账户，这里只配置分账比例。</p>
                    </section>
                  </div>
                ),
                footer: () => (
                  <div class="drawer-footer">
                    <el-button onClick={() => (productDrawerVisible.value = false)}>取消</el-button>
                    <el-button type="primary" onClick={() => (productDrawerVisible.value = false)}>
                      保存
                    </el-button>
                  </div>
                )
              }}
            </el-drawer>
          </div>
        ) : (
          <EmptyBlock title="原推广项目" text="原有推广项目保持不变，市场招商业务作为新增 tab 放在这里。" />
        )}
      </div>
    )
  }
})

const RelationsView = defineComponent({
  setup() {
    return () => <EmptyBlock title="客户关系" text="保持原有菜单位置，本次不新增页面细节。" />
  }
})

const LevelEditor = defineComponent({
  props: {
    mode: { type: String, default: 'edit' }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const itemTypes = ['线下服务', '线下商品', '线下疗程套餐', '线下会员卡', '微商城商品', '微商城疗程', '供应链商品']
    const title = props.mode === 'create' ? '添加等级' : '编辑等级'

    return () => (
      <div class="level-editor">
        <div class="level-editor-top">
          <strong>{title}</strong>
          <el-button onClick={() => emit('close')}>关闭</el-button>
        </div>
        <div class="level-editor-shell">
          <div class="level-editor-panel">
            <section class="editor-section">
              <div class="editor-section-title">基本信息</div>
              <div class="editor-form">
                <div class="editor-form-row">
                  <label>
                    <span>*</span>等级名称
                  </label>
                  <el-input model-value={props.mode === 'create' ? '' : '初级合伙人'} class="level-name-input" placeholder="请输入等级名称">
                    {{
                      suffix: () => <span class="input-count">{props.mode === 'create' ? '0/15' : '5/15'}</span>
                    }}
                  </el-input>
                  <span class="current-level">当前等级：1级</span>
                  <span class="level-badge orange">V1</span>
                </div>
                <div class="editor-form-row compact-row">
                  <label></label>
                  <el-checkbox model-value={true}>C端可让非本人查看该等级及等级权益</el-checkbox>
                  <button class="sample-link">示例</button>
                </div>
                <div class="editor-form-row">
                  <label>
                    <span>*</span>线上提现
                  </label>
                  <el-radio-group model-value="disabled">
                    <el-radio value="enabled">支持</el-radio>
                    <el-radio value="disabled">不支持</el-radio>
                  </el-radio-group>
                </div>
                <div class="editor-form-row textarea-row">
                  <label></label>
                  <div>
                    <div class="copy-tabs">
                      <button class="active">使用默认文案</button>
                      <button>示例</button>
                    </div>
                    <el-input
                      model-value="本店为测试方案，所有的数据均为测试数据，无法产生真实收益。"
                      type="textarea"
                      rows={4}
                      class="level-copy-input"
                    />
                    <span class="textarea-count">29/30</span>
                  </div>
                </div>
                <div class="editor-form-row">
                  <label>
                    <span>*</span>签约设置
                  </label>
                  <el-radio-group model-value="none">
                    <el-radio value="none">无需签署</el-radio>
                    <el-radio value="online">线上签署</el-radio>
                    <el-radio value="offline">线下签署</el-radio>
                  </el-radio-group>
                </div>
                <div class="editor-form-row">
                  <label>
                    <span>*</span>合约期
                  </label>
                  <el-radio-group model-value="forever">
                    <el-radio value="forever">永久</el-radio>
                    <el-radio value="custom">自定义</el-radio>
                  </el-radio-group>
                </div>
                <div class="editor-form-row">
                  <label>是否可分享</label>
                  <el-radio-group model-value="share">
                    <el-radio value="share">可分享</el-radio>
                    <el-radio value="forbid">禁用分享</el-radio>
                  </el-radio-group>
                </div>
                <div class="editor-form-row">
                  <label>
                    <span>*</span>等级类型
                  </label>
                  <el-select model-value="customer" class="level-type-select">
                    <el-option label="客户" value="customer" />
                    <el-option label="员工" value="staff" />
                  </el-select>
                </div>
                <div class="editor-form-row compact-row">
                  <label></label>
                  <el-checkbox model-value={false}>引导绑定收款账户</el-checkbox>
                </div>
              </div>
            </section>

            <section class="editor-section">
              <div class="editor-section-title long-title">
                该等级合伙人购买商品的折扣权益
                <span>（不勾选，则不做任何升级，勾选，则自动将该对应的合伙人权益卡自动升级为该卡，如还无分销权益卡则自动赠送该卡）</span>
              </div>
              <div class="editor-form discount-row">
                <label>折扣权益</label>
                <el-checkbox model-value={true}>当合伙人升级为该等级时，折扣权益将自动升级为</el-checkbox>
                <el-select model-value="" class="member-card-select" placeholder="选择对应权益的会员卡">
                  <el-option label="选择对应权益的会员卡" value="" />
                </el-select>
              </div>
            </section>

            <section class="editor-section">
              <div class="editor-section-title">推广佣金奖励比例设置</div>
              <div class="project-editor">
                <p>请先选择项目</p>
                <div class="project-config">
                  <aside>
                    {itemTypes.map((item, index) => (
                      <button class={index === 6 ? 'unchecked' : ''}>
                        <el-checkbox model-value={index !== 6} />
                        <span>{item}</span>
                        {index === 2 ? <QuestionFilled /> : null}
                        <ArrowRight />
                      </button>
                    ))}
                  </aside>
                  <div class="project-empty"></div>
                </div>
                <div class="batch-rule">
                  <span>对下方勾选的 0 项批量设置：</span>
                  <button>批量删除</button>
                  <span>直接推广佣金奖励通用规则:</span>
                  <el-input model-value="" placeholder="请输入" />
                  <el-select model-value="percent">
                    <el-option label="%元" value="percent" />
                  </el-select>
                  <span class="plus">+</span>
                  <span>间接推广佣金奖励通用规则:</span>
                  <el-input model-value="" placeholder="请输入" />
                  <el-select model-value="percent">
                    <el-option label="%元" value="percent" />
                  </el-select>
                  <span class="plus">+</span>
                  <span>自购返佣奖励:</span>
                  <el-input model-value="" placeholder="请输入" />
                  <el-select model-value="percent">
                    <el-option label="%元" value="percent" />
                  </el-select>
                </div>
              </div>
            </section>
          </div>
        </div>
        <div class="level-editor-footer">
          <el-button type="primary">保存</el-button>
        </div>
      </div>
    )
  }
})

const ContractTemplateView = defineComponent({
  setup() {
    const previewStep = ref('confirm')
    const contractPage = ref<'list' | 'editor'>('list')
    const activeTemplate = ref('natural')
    const templates = ref([
      { id: 'natural', name: '商城共建者合作协议-自然人版', type: '自然人合同', level: '商城共建', enabled: true, amount: '10000元', valid: '1年', updatedAt: '2026-06-25 16:10' },
      { id: 'company', name: '商城共建者合作协议-企业版', type: '企业合同', level: '商城共建', enabled: false, amount: '10000元', valid: '1年', updatedAt: '未配置' }
    ])
    const contractBody = [
      '乙方支付人民币10000元后，甲方将向乙方交付等值恒奕美源自主品牌产品。',
      '乙方完成付款和业务办理后，系统生成待签约身份；乙方完成本协议线上签署后，共建者身份正式激活。',
      '乙方作为商城共建者，可就本人消费及直接绑定客户消费获得平台实际经营利润的30%作为共建经营分红。',
      '乙方通过注册手机号验证码、阅读合同内容并签署确认的行为，视为乙方本人真实有效的签署行为。'
    ].join('\n\n')

    function openEditor(id?: string) {
      if (id) activeTemplate.value = id
      previewStep.value = 'confirm'
      contractPage.value = 'editor'
    }

    async function confirmDelete(row: (typeof templates.value)[number]) {
      try {
        await ElMessageBox.confirm(`删除后，该合同模板将不再出现在模板列表中。确认删除「${row.name}」吗？`, '删除合同模板', {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning'
        })
        templates.value = templates.value.filter((item) => item.id !== row.id)
        ElMessage.success('已删除合同模板')
      } catch {
        // user cancelled
      }
    }

    function copyTemplate(row: (typeof templates.value)[number]) {
      templates.value = [
        ...templates.value,
        {
          ...row,
          id: `${row.id}-copy-${Date.now()}`,
          name: `${row.name} 副本`,
          enabled: false,
          updatedAt: '刚刚'
        }
      ]
      ElMessage.success('已复制合同模板')
    }

    return () => {
      if (contractPage.value === 'list') {
        return (
          <div class="contract-page contract-list-page">
            <div class="module-head">
              <div>
                <h2>合同签约</h2>
                <p>管理自然人和企业合同模板，可新建、编辑、删除模板。</p>
              </div>
              <el-button type="primary" onClick={() => openEditor()}>
                新建模板
              </el-button>
            </div>
            <div class="contract-list-panel">
              <el-table data={templates.value} border class="main-table contract-list-table">
                <el-table-column prop="name" label="合同模板名称" min-width="240" />
                <el-table-column prop="type" label="合同类型" width="120" />
                <el-table-column prop="level" label="适用身份" width="120" />
                <el-table-column prop="amount" label="合同金额" width="110" />
                <el-table-column prop="valid" label="有效期" width="90" />
                <el-table-column label="状态" width="120">
                  {{
                    default: ({ row }: { row: (typeof templates.value)[number] }) => (
                      <el-switch
                        v-model={row.enabled}
                        active-text="启用"
                        inactive-text="禁用"
                        inline-prompt
                        style="--el-switch-on-color: var(--pink); --el-switch-off-color: #b9bdc5"
                      />
                    )
                  }}
                </el-table-column>
                <el-table-column prop="updatedAt" label="更新时间" width="150" />
                <el-table-column label="操作" width="190" fixed="right" align="right">
                  {{
                    default: ({ row }: { row: (typeof templates.value)[number] }) => (
                      <div class="contract-row-actions">
                        <el-button link type="primary" onClick={() => openEditor(row.id)}>
                          编辑
                        </el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="primary" onClick={() => copyTemplate(row)}>
                          复制
                        </el-button>
                        <el-divider direction="vertical" />
                        <el-button link type="danger" onClick={() => void confirmDelete(row)}>
                          删除
                        </el-button>
                      </div>
                    )
                  }}
                </el-table-column>
              </el-table>
            </div>
          </div>
        )
      }

      return (
      <div class="contract-page simple-contract-page">
        <div class="module-head">
          <div>
            <h2>合同签约</h2>
            <p>管理自然人和企业合同模板，配置甲方信息、合同金额、有效期、适用身份和正文。</p>
          </div>
          <div class="contract-actions">
            <el-button onClick={() => (contractPage.value = 'list')}>返回列表</el-button>
            <el-button type="primary">保存配置</el-button>
          </div>
        </div>

        <div class="contract-config-preview">
          <section class="contract-config-column">
            <div class="contract-step-block">
              <div class="simple-step-title">
                <span>1</span>
                <strong>设置合同类型和适用身份</strong>
              </div>
              <div class="natural-contract-form compact">
                <label>
                  <span>合同名称</span>
                  <el-input model-value="商城共建者合作协议-自然人版" />
                </label>
                <label>
                  <span>合同类型</span>
                  <el-select model-value="自然人合同">
                    <el-option label="自然人合同" value="自然人合同" />
                    <el-option label="企业合同" value="企业合同" />
                  </el-select>
                </label>
                <label>
                  <span>适用身份</span>
                  <el-select model-value="商城共建">
                    <el-option label="商城共建" value="商城共建" />
                    <el-option label="联盟店" value="联盟店" />
                  </el-select>
                </label>
              </div>
            </div>

            <div class="contract-step-block">
              <div class="simple-step-title">
                <span>2</span>
                <strong>填写甲方信息</strong>
              </div>
              <div class="natural-contract-form">
                <label>
                  <span>甲方名称</span>
                  <el-input model-value="恒奕美源运营主体" />
                </label>
                <label>
                  <span>统一社会信用代码</span>
                  <el-input model-value="9113************2X" />
                </label>
                <label>
                  <span>法定代表人</span>
                  <el-input model-value="李明" placeholder="请输入法定代表人姓名" />
                </label>
                <label>
                  <span>电子邮箱地址</span>
                  <el-input model-value="contract@hengyimeiyuan.com" />
                </label>
                <label>
                  <span>联系电话</span>
                  <el-input model-value="400-000-0000" />
                </label>
              </div>
            </div>

            <div class="contract-step-block">
              <div class="simple-step-title">
                <span>3</span>
                <strong>填写合同金额和有效期</strong>
              </div>
              <div class="natural-contract-form compact">
                <label>
                  <span>合同金额</span>
                  <el-input model-value="10000">
                    {{ append: () => '元' }}
                  </el-input>
                </label>
                <label>
                  <span>合同有效期</span>
                  <el-input model-value="1">
                    {{ append: () => '年' }}
                  </el-input>
                </label>
              </div>
            </div>

            <div class="contract-step-block">
              <div class="simple-step-title">
                <span>4</span>
                <strong>维护合同正文</strong>
              </div>
              <el-input model-value={contractBody} type="textarea" rows={11} class="contract-body-editor" />
              <div class="simple-footer-note">
                <span>乙方姓名、手机号、身份证号、签署时间由客户签约时自动带出。</span>
              </div>
            </div>
          </section>

          <aside class="sign-preview-column">
            <div class="preview-title-line">
              <strong>客户扫码签约预览</strong>
              <span>专属签约码打开后的页面</span>
            </div>
            <div class="sign-step-tabs">
              <button class={previewStep.value === 'confirm' ? 'active' : ''} type="button" onClick={() => (previewStep.value = 'confirm')}>
                1 核对签约信息
              </button>
              <button class={previewStep.value === 'contract' ? 'active' : ''} type="button" onClick={() => (previewStep.value = 'contract')}>
                2 阅读合同内容
              </button>
              <button class={previewStep.value === 'sign' ? 'active' : ''} type="button" onClick={() => (previewStep.value = 'sign')}>
                3 签名并验证
              </button>
            </div>
            <div class="phone-preview">
              {previewStep.value === 'confirm' ? (
                <div class="phone-page formal-sign-page">
                  <div class="sign-status-bar">
                    <span>待签署</span>
                    <em>合同编号 HY-GJ-20260625-0001</em>
                  </div>
                  <h3>商城共建者合作协议</h3>
                  <div class="contract-summary-card">
                    <div>
                      <span>合同金额</span>
                      <strong>¥10,000.00</strong>
                    </div>
                    <div>
                      <span>有效期</span>
                      <strong>1年</strong>
                    </div>
                  </div>
                  <div class="party-info-card">
                    <div class="party-info-title">甲方信息</div>
                    <p><span>甲方</span><strong>恒奕美源运营主体</strong></p>
                    <p><span>统一社会信用代码</span><strong>9113************2X</strong></p>
                    <p><span>法定代表人</span><strong>李明</strong></p>
                    <p><span>电子邮箱</span><strong>contract@hengyimeiyuan.com</strong></p>
                    <p><span>联系电话</span><strong>400-000-0000</strong></p>
                  </div>
                  <div class="contract-next-note">
                    下一页将展示完整合同正文，请仔细阅读后再进行签署。
                  </div>
                  <el-button type="primary" class="phone-full-button" onClick={() => (previewStep.value = 'contract')}>
                    信息无误，查看合同
                  </el-button>
                </div>
              ) : previewStep.value === 'contract' ? (
                <div class="phone-page formal-sign-page">
                  <div class="sign-status-bar">
                    <span>合同阅读</span>
                    <em>请完整阅读</em>
                  </div>
                  <h3>商城共建者合作协议</h3>
                  <div class="phone-contract-text full-contract-text">
                    <p>合同正文</p>
                    <span>乙方支付人民币10000元后，甲方将向乙方交付等值恒奕美源自主品牌产品。</span>
                    <span>乙方完成付款和业务办理后，系统生成待签约身份；乙方完成本协议线上签署后，共建者身份正式激活。</span>
                    <span>乙方作为商城共建者，可就本人消费及直接绑定客户消费获得平台实际经营利润的30%作为共建经营分红。</span>
                    <span>乙方通过手机号验证码、阅读合同内容并签署确认的行为，视为乙方本人真实有效的签署行为。</span>
                    <span>系统将保存合同编号、模板版本、签署时间、签约手机号、IP、设备信息和合同快照。</span>
                  </div>
                  <div class="sign-agree-row">
                    <el-checkbox model-value={true}>我已阅读并同意合同内容</el-checkbox>
                  </div>
                  <el-button type="primary" class="phone-full-button" onClick={() => (previewStep.value = 'sign')}>
                    下一步，签署验证
                  </el-button>
                </div>
              ) : (
                <div class="phone-page formal-sign-page">
                  <div class="sign-status-bar">
                    <span>签署验证</span>
                    <em>手机号实名认证</em>
                  </div>
                  <h3>签署确认</h3>
                  <div class="signature-panel">
                    <div class="signature-panel-title">签署区</div>
                    <div class="signature-box">郭小云</div>
                    <p>请确认该签名为本人真实签署。</p>
                  </div>
                  <label class="mobile-verify-label">签约人姓名</label>
                  <el-input model-value="郭小云" class="phone-input" />
                  <label class="mobile-verify-label">身份证号码</label>
                  <el-input model-value="130************428" class="phone-input" />
                  <label class="mobile-verify-label">签约手机号</label>
                  <div class="readonly-phone-field">
                    <strong>15831704477</strong>
                    <span>由办理单对应会员自动带出</span>
                  </div>
                  <label class="mobile-verify-label">短信验证码</label>
                  <div class="verify-row">
                    <el-input placeholder="请输入验证码" />
                    <el-button>获取验证码</el-button>
                  </div>
                  <div class="sign-legal-note">提交后，系统将记录签署时间、手机号、合同编号、IP、设备信息和合同快照。</div>
                  <el-button type="primary" class="phone-full-button">确认签署</el-button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    )
  }
    }
})

const SettingsView = defineComponent({
  setup() {
    const active = ref('level')
    const editorMode = ref<'create' | 'edit' | ''>('')
    const merchantNameByNo: Record<string, string> = {
      'LKL-10001001': '恒奕美源总部运营公司',
      'LKL-10001002': '恒奕美源共建奖励池',
      'LKL-10001003': '恒奕美源联盟店奖励池',
      'LKL-10001004': '恒奕美源销售收益账户',
      'LKL-10001005': '恒奕美源门店收益账户'
    }
    const incomeForm = ref({
      name: '',
      bookType: '合伙人收益类',
      calculate: '按销售金额算',
      book: '合伙人收益账本',
      merchantNo: '',
      remark: '',
      linkPartnerChain: false
    })
    const incomeDialogVisible = ref(false)
    const merchantName = computed(() => merchantNameByNo[incomeForm.value.merchantNo] || '')
    const incomeRows = [
      {
        name: '直推奖',
        bookType: '合伙人收益类',
        calculate: '按推广业绩算',
        book: '合伙人收益账本',
        merchantNo: 'LKL-10001002',
        merchantName: '恒奕美源共建奖励池',
        remark: '合伙人直接推广收益'
      },
      {
        name: '销售提成',
        bookType: '合伙人收益类',
        calculate: '按销售金额算',
        book: '合伙人收益账本',
        merchantNo: 'LKL-10001004',
        merchantName: '恒奕美源销售收益账户',
        remark: '特殊推广业务销售收益'
      },
      {
        name: '合作收入',
        bookType: '门店收入类',
        calculate: '按销售金额算',
        book: '门店收益账本',
        merchantNo: 'LKL-10001005',
        merchantName: '恒奕美源门店收益账户',
        remark: '门店合作业务收入'
      }
    ]
    function openIncomeCreate() {
      incomeForm.value = {
        name: '',
        bookType: '合伙人收益类',
        calculate: '按销售金额算',
        book: '合伙人收益账本',
        merchantNo: '',
        remark: '',
        linkPartnerChain: false
      }
      incomeDialogVisible.value = true
    }

    function saveIncomeName() {
      incomeDialogVisible.value = false
    }

    function updateIncomeBookType(value: string) {
      incomeForm.value.bookType = value
      if (value !== '合伙人收益类') {
        incomeForm.value.linkPartnerChain = false
      }
    }

    const levelRows = [
      {
        level: '等级1',
        badge: 'V1',
        badgeClass: 'orange',
        name: '初级合伙人',
        rules: '默认成为合伙人后即为该等级',
        commission: '查看佣金奖励',
        withdraw: '不支持',
        contract: '永久有效',
        removable: false
      },
      {
        level: '等级2',
        badge: 'V2',
        badgeClass: 'blue',
        name: '中级合伙人',
        rules: [
          '满足以下【任意】条件：',
          '1. 推广业绩（到店）累积满 4999 元（含间接推广业绩）',
          '2. 推广业绩（微商城）累积满 4999 元（含间接推广业绩）',
          '3. 成为合伙人后消费（到店）累积满 4999 元',
          '4. 成为合伙人后消费（微商城）累积满 4999 元'
        ],
        commission: '查看佣金奖励',
        withdraw: '不支持',
        contract: '永久有效',
        removable: true
      }
    ]
    return () => (
      <div>
        {editorMode.value ? <LevelEditor mode={editorMode.value} onClose={() => (editorMode.value = '')} /> : null}
        <el-tabs v-model={active.value}>
          <el-tab-pane label="身份等级" name="level" />
          <el-tab-pane label="招募规则" name="rule" disabled />
          <el-tab-pane label="招募页设置" name="page" disabled />
          <el-tab-pane label="客户绑定设置" name="bind" disabled />
          <el-tab-pane label="项目上架设置" name="project" disabled />
          <el-tab-pane label="结算&打款设置" name="settle" disabled />
          <el-tab-pane label="收益账本" name="income" />
          <el-tab-pane label="推广海报设置" name="poster" disabled />
          <el-tab-pane label="推送通知设置" name="push" disabled />
          <el-tab-pane label="其他设置" name="other" disabled />
        </el-tabs>
        {active.value === 'level' ? (
          <div class="level-page">
            <div class="level-tips">
              <p>
                1.合伙人等级最多只能设置 20 级；
                <span>佣金奖励说明</span>
              </p>
              <p>2. 等级设置必须按等级顺序逐一设置，例如：“初级 -&gt; 中级 -&gt; 高级”，不要出现“初级 -&gt; 高级 -&gt; 中级”的顺序。</p>
            </div>
            <div class="level-action">
              <el-button type="primary" onClick={() => (editorMode.value = 'create')}>
                添加等级
              </el-button>
            </div>
            <el-table data={levelRows} class="level-table" row-class-name="level-row">
              <el-table-column label="等级值" width="90">
                {{
                  default: ({ row }: { row: (typeof levelRows)[number] }) => (
                    <div class="level-value">
                      <span>{row.level}</span>
                      <span class={['level-badge', row.badgeClass]}>{row.badge}</span>
                    </div>
                  )
                }}
              </el-table-column>
              <el-table-column prop="name" label="等级名称" width="120" />
              <el-table-column min-width="300">
                {{
                  header: () => (
                    <span class="head-with-tip">
                      升级规则
                      <QuestionFilled />
                    </span>
                  ),
                  default: ({ row }: { row: (typeof levelRows)[number] }) =>
                    Array.isArray(row.rules) ? (
                      <div class="rule-list">
                        <p>{row.rules[0]}</p>
                        {row.rules.slice(1).map((rule) => (
                          <p>{rule}</p>
                        ))}
                      </div>
                    ) : (
                      <span>{row.rules}</span>
                    )
                }}
              </el-table-column>
              <el-table-column min-width="140">
                {{
                  header: () => (
                    <span class="head-with-tip">
                      推广佣金奖励
                      <QuestionFilled />
                    </span>
                  ),
                  default: ({ row }: { row: (typeof levelRows)[number] }) => <button class="text-link">{row.commission}</button>
                }}
              </el-table-column>
              <el-table-column prop="withdraw" label="线上提现" width="90" />
              <el-table-column prop="contract" label="合约期" width="90" />
              <el-table-column label="操作" width="80">
                {{
                  default: ({ row }: { row: (typeof levelRows)[number] }) => (
                    <div class="level-actions">
                      <el-button link type="primary" onClick={() => (editorMode.value = 'edit')}>
                        编辑
                      </el-button>
                      {row.removable ? <el-button link type="primary">删除</el-button> : null}
                    </div>
                  )
                }}
              </el-table-column>
            </el-table>
          </div>
        ) : active.value === 'income' ? (
          <div class="income-page">
            <div class="module-head">
              <div>
                <h2>收益账本</h2>
                <p>维护业务可选择的收益名称，并绑定账本类型、核算方式和收款商户号。</p>
              </div>
              <el-button type="primary" onClick={openIncomeCreate}>
                <Plus />
                新建收益名称
              </el-button>
            </div>
            <el-table data={incomeRows} border class="main-table income-table">
              <el-table-column prop="name" label="收益名称" width="120" />
              <el-table-column prop="bookType" label="账本类型" width="140" />
              <el-table-column prop="calculate" label="核算方式" width="130" />
              <el-table-column prop="merchantNo" label="收款商户号" width="140" />
              <el-table-column prop="merchantName" label="收款方名称" min-width="180" />
              <el-table-column prop="remark" label="备注说明" min-width="170" />
              <el-table-column label="操作" width="120">
                {{
                  default: () => (
                    <div class="link-actions">
                      <el-button link type="primary">编辑</el-button>
                      <el-button link type="primary">停用</el-button>
                    </div>
                  )
                }}
              </el-table-column>
            </el-table>
            <el-drawer v-model={incomeDialogVisible.value} title="新建收益名称" size="680px" class="income-dialog">
              {{
                default: () => (
                  <el-form label-width="108px" class="income-form">
                    <el-form-item label="收益名称" required>
                      <el-input v-model={incomeForm.value.name} placeholder="请输入收益名称，如：履约服务费" />
                    </el-form-item>
                    <el-form-item label="账本类型" required>
                      <el-select model-value={incomeForm.value.bookType} class="full-control" onChange={updateIncomeBookType}>
                        <el-option label="合伙人收益类" value="合伙人收益类" />
                        <el-option label="门店收入类" value="门店收入类" />
                        <el-option label="门店奖励类" value="门店奖励类" />
                        <el-option label="门店营销类" value="门店营销类" />
                        <el-option label="其它类" value="其它类" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="核算方式" required>
                      <el-select v-model={incomeForm.value.calculate} class="full-control">
                        <el-option label="按销售金额算" value="按销售金额算" />
                        <el-option label="按推广业绩算" value="按推广业绩算" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="收款商户号" required>
                      <el-input v-model={incomeForm.value.merchantNo} placeholder="填写后自动带出收款方名称" />
                    </el-form-item>
                    <el-form-item label="收款方名称">
                      <div class="readonly-merchant-name">{merchantName.value || '填写有效商户号后自动带出'}</div>
                    </el-form-item>
                    {incomeForm.value.bookType === '合伙人收益类' ? (
                      <el-form-item label="" class="income-chain-item">
                        <div class="income-chain-control">
                          <el-checkbox v-model={incomeForm.value.linkPartnerChain}>收益计算与合伙人关系链路相关</el-checkbox>
                        </div>
                      </el-form-item>
                    ) : null}
                    <el-form-item label="备注说明" class="income-remark-item">
                      <el-input v-model={incomeForm.value.remark} type="textarea" placeholder="非必填" />
                    </el-form-item>
                  </el-form>
                ),
                footer: () => (
                  <div class="drawer-footer">
                    <el-button onClick={() => (incomeDialogVisible.value = false)}>取消</el-button>
                    <el-button type="primary" onClick={saveIncomeName}>
                      保存
                    </el-button>
                  </div>
                )
              }}
            </el-drawer>
          </div>
        ) : (
          <EmptyBlock title="原有设置" text="原设置项保留，本次只补新增入口。" />
        )}
      </div>
    )
  }
})
</script>
