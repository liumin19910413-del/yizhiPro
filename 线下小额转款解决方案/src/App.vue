<template>
  <div class="prototype-root">
    <header class="terminal-topbar">
      <el-segmented
        v-model="activeTerminal"
        :options="terminalOptions"
        class="terminal-switch"
      />
      <div v-if="inSolution && activeTerminal === 'B端'" class="view-switch">
        <span>当前视角</span>
        <el-segmented
          v-model="activeViewKey"
          :options="viewSwitchOptions"
          class="view-segmented"
          @change="syncDefaultMenu"
        />
      </div>
    </header>

    <div v-if="activeTerminal === 'B端'" class="app-shell with-terminal">
    <aside class="global-nav">
      <div class="brand-mark">伊</div>
      <button
        v-for="item in globalNav"
        :key="item"
        class="global-nav-item"
        :class="{ active: item === '营销中心' }"
      >
        <span class="global-dot"></span>
        <span>{{ item }}</span>
      </button>
    </aside>

    <main class="main-frame">
      <header class="topbar">
        <div class="topbar-left">
          <div class="breadcrumb">{{ inSolution ? '营销应用 / 微信小额打款解决方案' : '营销应用' }}</div>
        </div>
        <div class="topbar-actions">
          <el-button>分发日志</el-button>
          <el-button>下载中心</el-button>
        </div>
      </header>

      <template v-if="!inSolution">
        <section class="application-page">
          <nav class="product-tabs">
            <button class="tab active">营销应用</button>
            <button class="tab">小程序商城订单</button>
            <button class="tab">小程序商城装修</button>
            <button class="tab">电商数据</button>
          </nav>

          <div class="app-groups">
            <section v-for="group in appGroups" :key="group.title" class="app-group">
              <h2>
                <span :class="['section-symbol', group.tone]"></span>
                {{ group.title }}
              </h2>
              <div class="app-card-grid">
                <button
                  v-for="card in group.cards"
                  :key="card.title"
                  class="app-card"
                  :class="[group.tone, { featured: card.title === '微信小额打款解决方案' }]"
                  @click="card.title === '微信小额打款解决方案' && enterSolution()"
                >
                  <span class="card-icon">{{ card.icon }}</span>
                  <span class="card-copy">
                    <strong>{{ card.title }}</strong>
                    <small v-if="card.desc">{{ card.desc }}</small>
                  </span>
                  <el-tag v-if="card.recommend" size="small" type="danger">荐</el-tag>
                </button>
              </div>
            </section>
          </div>
        </section>
      </template>

      <template v-else-if="activeTerminal === 'B端'">
        <section class="solution-layout">
          <aside class="sub-nav">
            <button
              v-for="item in subMenus"
              :key="item.key"
              class="sub-nav-item"
              :class="{ active: activeMenu === item.key }"
              @click="activeMenu = item.key"
            >
              {{ item.label }}
            </button>
          </aside>

          <section class="solution-content">
            <div class="solution-workspace">
              <div class="solution-main">
            <section v-if="activeMenu === 'overview'" class="page-stack">
              <div class="metric-grid">
                <div v-for="metric in overviewMetrics" :key="metric.label" class="metric-panel">
                  <span class="metric-title">{{ metric.label }}</span>
                  <div class="metric-amounts">
                    <div>
                      <small>累计</small>
                      <strong>{{ metric.total }}</strong>
                    </div>
                    <div>
                      <small>本月</small>
                      <strong>{{ metric.month }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <section class="content-panel">
                <div class="panel-title-row">
                  <el-segmented v-model="overviewTableTab" :options="['打款统计', '打款明细']" class="table-switch" />
                  <div class="table-actions" v-if="overviewTableTab === '打款统计'">
                    <el-date-picker
                      v-model="statsFilters.dateRange"
                      type="daterange"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      size="default"
                    />
                    <el-select v-if="isHeadquarters" v-model="statsFilters.store" placeholder="门店" clearable>
                      <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                    </el-select>
                    <el-button>查询</el-button>
                    <el-button>导出</el-button>
                  </div>
                </div>
                <el-table v-if="overviewTableTab === '打款统计'" :data="visibleStoreStats" border>
                  <el-table-column prop="store" label="门店名称" min-width="120" />
                  <el-table-column prop="accountType" label="账户类型" min-width="120" />
                  <el-table-column prop="account" label="出款账户" min-width="150" />
                  <el-table-column prop="successAmount" label="成功金额" min-width="120" align="right" />
                  <el-table-column prop="failedAmount" label="失败金额" min-width="120" align="right" />
                  <el-table-column label="操作" width="110" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="primary" @click="openDetailsFromOverview(row)">查看明细</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <template v-else>
                  <div class="filter-row wide">
                    <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" />
                    <el-select v-if="isHeadquarters" v-model="detailFilters.store" placeholder="门店" clearable>
                      <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                    </el-select>
                    <el-select v-model="detailFilters.status" placeholder="状态" clearable>
                      <el-option label="成功" value="成功" />
                      <el-option label="失败" value="失败" />
                      <el-option label="待处理" value="待处理" />
                    </el-select>
                    <el-select v-model="detailFilters.business" placeholder="业务场景" clearable>
                      <el-option v-for="item in businessOptions" :key="item" :label="item" :value="item" />
                    </el-select>
                    <el-input v-model="detailFilters.keyword" placeholder="收款人/手机号/openid/单号" clearable />
                    <el-button>查询</el-button>
                    <el-button>导出</el-button>
                  </div>
                  <el-table :data="visiblePayoutDetails" border>
                    <el-table-column prop="paidAt" label="打款时间" min-width="150" />
                    <el-table-column prop="id" label="单据号" min-width="130" />
                    <el-table-column prop="store" label="门店" min-width="110" />
                    <el-table-column prop="accountType" label="账户类型" min-width="110" />
                    <el-table-column prop="account" label="出款账户" min-width="140" />
                    <el-table-column label="收款人" min-width="180">
                      <template #default="{ row }">
                        <div class="receiver-cell">
                          <strong>{{ row.receiver }}</strong>
                          <span>{{ row.phone }}</span>
                          <span>{{ row.openid }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column prop="business" label="业务场景" min-width="130" />
                    <el-table-column prop="amount" label="金额" align="right" width="112" />
                    <el-table-column prop="status" label="状态" width="90">
                      <template #default="{ row }">
                        <el-tag :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'warning'">
                          {{ row.status }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" fixed="right">
                      <template #default="{ row }">
                        <el-button v-if="row.status === '失败'" link type="primary" @click="retryPayout(row)">重新打款</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </section>
            </section>

            <section v-if="activeMenu === 'payout'" class="page-stack">
              <section class="content-panel">
                <div class="panel-title-row">
                  <h2>授权用户</h2>
                </div>
                <div class="filter-row">
                  <el-select v-model="authFilters.store" placeholder="所属门店" clearable>
                    <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                  </el-select>
                  <el-select v-model="authFilters.status" placeholder="授权状态" clearable>
                    <el-option label="已授权" value="已授权" />
                    <el-option label="已关闭" value="已关闭" />
                  </el-select>
                  <el-input v-model="authFilters.keyword" placeholder="微信昵称/会员姓名/手机号/openID搜索" clearable />
                  <el-button>查询</el-button>
                  <el-button v-if="!isHeadquarters" type="primary" @click="qrDialogVisible = true">生成授权码</el-button>
                </div>
                <el-table :data="visibleAuthUsers" border>
                  <el-table-column label="微信用户" min-width="170">
                    <template #default="{ row }">
                      <div class="receiver-cell">
                        <strong>{{ row.nickname }}</strong>
                        <span>{{ row.openid }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="会员信息" min-width="150">
                    <template #default="{ row }">
                      <div class="receiver-cell">
                        <strong>{{ row.name }}</strong>
                        <span>{{ row.phone || '-' }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="store" label="所属门店" width="130" />
                  <el-table-column prop="status" label="授权状态" width="110">
                    <template #default="{ row }">
                      <el-tag :type="authTagType(row.status)">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="scene" label="授权场景" width="120" />
                  <el-table-column prop="total" label="累计打款" align="right" width="120" />
                  <el-table-column prop="lastPaidAt" label="最近打款" width="130" />
                  <el-table-column label="操作" min-width="170" fixed="right">
                    <template #default="{ row }">
                      <el-button v-if="row.status === '已授权'" link type="primary" @click="openPayout(row)">发起打款</el-button>
                      <el-button v-if="row.status === '已关闭'" link type="primary" @click="qrDialogVisible = true">重新授权</el-button>
                      <el-button link type="primary" @click="focusDetail(row)">明细</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </section>
            </section>

            <section v-if="activeMenu === 'config'" class="page-stack">
              <div v-if="currentView.readonlyConfig" class="readonly-banner">
                <strong>当前门店已适用总部配置</strong>
                <span>配置来源：总部统一配置，生效时间：2026-07-01 17:26。门店不可修改商户号、证书等配置。</span>
              </div>

              <section class="content-panel">
                <div class="panel-title-row">
                  <h2>打款配置</h2>
                  <el-tag :type="currentView.configStatus === '未开通' ? 'info' : 'success'">{{ currentView.configStatus }}</el-tag>
                </div>

                <div v-if="!currentView.readonlyConfig" class="config-notice">
                  <span class="notice-icon">i</span>
                  <span>
                    请参考<button type="button" class="notice-doc-link" @click="openGuideDoc">开通说明文档</button>，先在微信商户平台完成商户号申请、商家转账开通和接口安全 IP 配置，再在本页填写系统配置并保存设置。
                  </span>
                </div>

                <section class="config-section">
                  <div class="config-section-title">
                    <h3>系统配置</h3>
                  </div>
                  <el-form :model="configForm" label-width="150px" class="config-form">
                    <el-form-item label="商户号 mchid">
                      <el-input v-model="configForm.mchid" :disabled="currentView.readonlyConfig">
                        <template #append><GuideLink /></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="AppID">
                      <el-input v-model="configForm.appid" :disabled="currentView.readonlyConfig">
                        <template #append><GuideLink /></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="API v3 密钥">
                      <el-input v-model="configForm.apiKey" show-password :disabled="currentView.readonlyConfig">
                        <template #append><GuideLink /></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="商户证书序列号">
                      <el-input v-model="configForm.certNo" :disabled="currentView.readonlyConfig">
                        <template #append><GuideLink /></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="商户私钥">
                      <el-input v-model="configForm.privateKey" type="textarea" :rows="3" :disabled="currentView.readonlyConfig" />
                    </el-form-item>
                    <el-form-item label="微信支付公钥ID">
                      <el-input v-model="configForm.publicKeyId" :disabled="currentView.readonlyConfig">
                        <template #append><GuideLink /></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="平台证书">
                      <el-input v-model="configForm.platformCert" type="textarea" :rows="3" :disabled="currentView.readonlyConfig" />
                    </el-form-item>
                  </el-form>
                </section>

                <section v-if="isHeadquarters" class="config-section">
                  <div class="config-section-title">
                    <h3>适用门店</h3>
                  </div>
                  <div class="store-link-row">
                    <el-button link type="primary" :disabled="currentView.readonlyConfig" @click="storeDrawerVisible = true">选择门店</el-button>
                  </div>
                  <p class="store-scope-desc">
                    分发到门店后门店配置将被覆盖，且门店不可更改只能查看
                  </p>
                  <div class="selected-store-tags">
                    <el-tag
                      v-for="store in selectedStores"
                      :key="store"
                      type="info"
                      closable
                      :disable-transitions="true"
                      @close="removeStore(store)"
                    >
                      {{ store }}
                    </el-tag>
                  </div>
                </section>

                <section class="config-section impact-section">
                  <div class="config-section-title">
                    <h3>打款处理规则</h3>
                  </div>
                  <p>保存打款设置后，幸运转盘、0元抽奖、刮刮卡中的现金奖励发放到微信零钱，以及合伙人佣金提现，将统一使用微信小额打款方案处理。</p>
                </section>

                <el-alert
                  v-if="configValidationError"
                  :title="configValidationError"
                  type="error"
                  show-icon
                  :closable="false"
                  class="config-validation-alert"
                />

                <div v-if="!currentView.readonlyConfig" class="wizard-actions">
                  <el-button type="primary" :loading="savingConfig" @click="saveSettings">保存设置</el-button>
                </div>
              </section>
            </section>
              </div>
              <aside class="requirement-notes">
                <h3>需求备注</h3>
                <p>{{ activeRequirementNote.title }}</p>
                <ul>
                  <li v-for="item in activeRequirementNote.items" :key="item">{{ item }}</li>
                </ul>
              </aside>
            </div>
          </section>
        </section>
      </template>

    </main>

    <el-dialog v-model="qrDialogVisible" title="收款授权码" width="420px" :show-close="false" class="qr-auth-dialog">
      <div class="qr-box">
        <svg class="qr-code" viewBox="0 0 180 180" role="img" aria-label="收款授权码">
          <rect width="180" height="180" fill="#fff" />
          <rect x="14" y="14" width="42" height="42" fill="#202631" />
          <rect x="22" y="22" width="26" height="26" fill="#fff" />
          <rect x="30" y="30" width="10" height="10" fill="#202631" />
          <rect x="124" y="14" width="42" height="42" fill="#202631" />
          <rect x="132" y="22" width="26" height="26" fill="#fff" />
          <rect x="140" y="30" width="10" height="10" fill="#202631" />
          <rect x="14" y="124" width="42" height="42" fill="#202631" />
          <rect x="22" y="132" width="26" height="26" fill="#fff" />
          <rect x="30" y="140" width="10" height="10" fill="#202631" />
          <path d="M72 18h10v10H72zM92 18h18v10H92zM72 38h28v10H72zM112 38h10v10h-10zM70 70h12v12H70zM92 70h10v10H92zM112 70h28v10h-28zM150 70h10v20h-10zM70 92h30v10H70zM112 92h10v10h-10zM132 92h28v10h-28zM82 112h10v28H82zM102 112h28v10h-28zM140 112h20v10h-20zM70 150h20v10H70zM102 142h10v20h-10zM122 132h38v10h-38zM132 152h10v10h-10zM152 152h10v10h-10z" fill="#202631" />
        </svg>
        <p class="qr-tip">使用微信扫码做收款授权确认</p>
      </div>
      <template #footer>
        <div class="qr-dialog-actions">
          <el-button type="primary" @click="copyQrImage">复制图片</el-button>
          <el-button @click="saveQrImage">保存图片</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="payoutDialogVisible" title="发起打款" width="560px">
      <div v-if="selectedUser" class="payee-summary">
        <span>微信用户：{{ selectedUser.nickname }}</span>
        <span>OpenID：{{ selectedUser.openid }}</span>
        <span>会员信息：{{ selectedUser.name }}{{ selectedUser.phone ? ` ${selectedUser.phone}` : '' }}</span>
        <span>所属门店：{{ selectedUser.store }}</span>
        <span>出款账户：{{ currentAccountName }}</span>
      </div>
      <el-form :model="payoutForm" label-width="120px">
        <el-form-item label="打款金额"><el-input-number v-model="payoutForm.amount" :min="1" :precision="2" style="width: 180px" /> 元</el-form-item>
        <el-form-item label="业务场景">
          <el-select v-model="payoutForm.business" style="width: 100%">
            <el-option v-for="item in businessOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="转账备注"><el-input v-model="payoutForm.remark" maxlength="32" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payoutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayout">确认打款</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="storeDrawerVisible" title="选择门店" width="760px" class="store-picker-dialog">
      <div class="store-picker-panel">
        <div class="store-picker-filters">
          <el-select v-model="storeTag" placeholder="全部门店标签" clearable>
            <el-option label="全部门店标签" value="" />
            <el-option label="广州门店" value="广州" />
            <el-option label="上海门店" value="上海" />
            <el-option label="测试门店" value="测试" />
          </el-select>
          <el-input v-model="storeSearch" placeholder="多个关键词用顿号或空格分隔" clearable class="store-search-input">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="store-check-all">
          <el-checkbox :model-value="selectedStores.length > 0" :indeterminate="selectedStores.length > 0 && selectedStores.length < totalStoreCount" @change="toggleAllStores" />
          <strong>全部（{{ selectedStores.length }} / {{ totalStoreCount }}）</strong>
        </div>
        <div class="store-option-list">
          <label v-for="store in filteredSelectableStores" :key="store.name" class="store-option-row">
            <el-checkbox :model-value="selectedStores.includes(store.name)" @change="toggleStore(store.name)" />
            <span class="store-option-name">{{ store.name }}</span>
            <span class="store-option-city">{{ store.city }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <el-button @click="storeDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="storeDrawerVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" title="打款详情" size="520px">
      <el-descriptions v-if="selectedDetail" :column="1" border>
        <el-descriptions-item label="打款单号">{{ selectedDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="微信转账单号">{{ selectedDetail.wechatNo }}</el-descriptions-item>
        <el-descriptions-item label="打款时间">{{ selectedDetail.paidAt }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ selectedDetail.store }}</el-descriptions-item>
        <el-descriptions-item label="收款人">{{ selectedDetail.receiver }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ selectedDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ selectedDetail.openid }}</el-descriptions-item>
        <el-descriptions-item label="业务场景">{{ selectedDetail.business }}</el-descriptions-item>
        <el-descriptions-item label="出款账户">{{ selectedDetail.account }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ selectedDetail.amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ selectedDetail.status }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>

    </div>

    <section v-else class="consumer-landing-gallery">
      <div class="landing-preview-card">
        <h2>商家生成授权码，客户扫码后进入授权</h2>
        <img src="/c端落地页/授权码扫码授权流程.png" alt="商家生成授权码客户扫码授权流程" />
      </div>
      <div class="landing-preview-card">
        <h2>抽奖红包领取收款流程</h2>
        <img src="/c端落地页/抽奖红包收款流程.png" alt="抽奖红包领取收款流程" />
      </div>
      <div class="landing-preview-card">
        <h2>合伙人提现入口授权流程</h2>
        <img src="/c端落地页/合伙人提现授权流程.png" alt="合伙人提现入口授权流程" />
      </div>
      <div class="landing-preview-card">
        <h2>B端合伙人结算打款设置</h2>
        <img src="/c端落地页/B端合伙人结算打款设置.png" alt="B端合伙人结算打款设置" />
      </div>
      <div class="landing-preview-card">
        <h2>B端抽奖余额管理</h2>
        <img src="/c端落地页/B端抽奖余额管理.png" alt="B端抽奖余额管理" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
type MenuKey = 'overview' | 'payout' | 'config';
type TerminalKey = 'B端' | 'C端';
type ViewKey = 'hq' | 'branchInherited' | 'branchIndependent';

interface ViewProfile {
  key: ViewKey;
  label: string;
  store?: string;
  configStatus: string;
  scene: string;
  accountSource: string;
  readonlyConfig: boolean;
}

interface StoreStat {
  store: string;
  accountType: string;
  account: string;
  successAmount: string;
  failedAmount: string;
}

interface AuthUser {
  nickname: string;
  name: string;
  phone?: string;
  openid: string;
  store: string;
  status: '已授权' | '已关闭';
  scene: string;
  total: string;
  lastPaidAt: string;
}

interface PayoutDetail {
  id: string;
  paidAt: string;
  store: string;
  accountType: string;
  account: string;
  receiver: string;
  phone: string;
  openid: string;
  business: string;
  amount: string;
  status: '成功' | '失败' | '待处理';
  wechatNo: string;
}

interface RequirementNote {
  title: string;
  items: string[];
}

interface AppCard {
  title: string;
  icon: string;
  desc?: string;
  recommend?: boolean;
}

interface AppGroup {
  title: string;
  tone: string;
  cards: AppCard[];
}

const FEISHU_HELP_URL = 'https://www.feishu.cn/docx/PLACEHOLDER_WECHAT_TRANSFER_GUIDE';
const globalNav = ['小红书', '连锁架构', '门店配置', '公域获客', '私域运营', 'AI 智能体', '营销中心', '数据报表', '库存管理'];
const terminalOptions: TerminalKey[] = ['B端', 'C端'];
const menuOptions: { key: MenuKey; label: string }[] = [
  { key: 'overview', label: '数据总览' },
  { key: 'payout', label: '授权列表' },
  { key: 'config', label: '打款配置' }
];
const businessOptions = ['幸运转盘', '0元抽奖', '刮刮卡', '合伙人佣金提现'];
const requirementNotes: Record<MenuKey, RequirementNote> = {
  overview: {
    title: '数据总览用于核对打款结果和财务统计。',
    items: [
      '顶部只展示成功打款金额和失败金额，每项区分累计与本月。',
      '总部可按门店筛选；分店视角固定查看本店，不展示门店筛选。',
      '打款统计按门店和出款账户拆行；同一门店多个账户都有出款时，需要展示多条记录。',
      '表格在打款统计和打款明细间切换，导出按钮跟随查询按钮。',
      '打款明细展示 OpenID、手机号、单据号、业务场景和实际出款账户。',
      '只有失败记录提供重新打款操作。'
    ]
  },
  payout: {
    title: '授权列表用于管理可收款用户并发起打款。',
    items: [
      '列表只展示已产生授权记录的用户，不展示待授权用户。',
      '微信用户信息展示昵称和 OpenID，真实打款以 OpenID 识别收款人。',
      '会员信息展示姓名和手机号，手机号可为空。',
      '总部只查看和发起打款；分店在查询后可生成授权码。',
      '已授权用户可发起打款，已关闭用户只能重新授权。'
    ]
  },
  config: {
    title: '打款配置用于保存微信商家转账接入参数。',
    items: [
      '总部和分店首次开通规则一致：未开通前默认进入打款配置，且只显示打款配置菜单。',
      '保存并开通后才展示数据总览和授权列表，再次进入默认展示数据总览。',
      '配置前需先参考开通说明文档完成微信商户号、商家转账和接口安全 IP。',
      '保存设置时校验必填项并模拟调用配置校验接口，失败时在页面内提示原因。',
      '总部可选择适用门店，分发后门店原配置会被覆盖且只能查看。',
      '分店连锁配置为只读；分店自主配置可维护本店参数。',
      '保存后，四个业务场景统一走微信小额打款方案处理。'
    ]
  }
};

const GuideLink = defineComponent({
  name: 'GuideLink',
  setup() {
    return () => h(
      ElButton,
      { link: true, type: 'primary', class: 'inline-help', onClick: openGuideDoc },
      () => '如何获取'
    );
  }
});

const appGroups: AppGroup[] = [
  {
    title: '开单',
    tone: 'orange',
    cards: [
      { title: '秒杀', icon: '秒', recommend: true },
      { title: '预定金', icon: '¥', recommend: true },
      { title: '积分营销', icon: '积', recommend: true },
      { title: '发券宝', icon: '券' },
      { title: '安心付·周期卡', icon: '卡' },
      { title: '会员等级', icon: '会' }
    ]
  },
  {
    title: '客情',
    tone: 'green',
    cards: [
      { title: '预约', icon: '约', recommend: true },
      { title: '短信营销', icon: '信' }
    ]
  },
  {
    title: '支付方案',
    tone: 'purple',
    cards: [
      { title: '微信小额打款解决方案', icon: '微', desc: '商家转账、授权收款、总部/门店打款与统计' },
      { title: '支付宝人资打款', icon: '支' },
      { title: '经销商出货分账解决方案', icon: '分' }
    ]
  },
  {
    title: '物流仓储解决方案',
    tone: 'cyan',
    cards: [
      { title: '自有发货解决方案', icon: '仓' },
      { title: '旺店通云仓发货解决方案', icon: '配' }
    ]
  }
];

const views = ref<ViewProfile[]>([
  {
    key: 'hq',
    label: '总部',
    configStatus: '未开通',
    scene: '佣金报酬',
    accountSource: '总部统一出资',
    readonlyConfig: false
  },
  {
    key: 'branchInherited',
    label: '分店(连锁配置)',
    store: '首款门店',
    configStatus: '已适用总部配置',
    scene: '佣金报酬',
    accountSource: '总部统一出资',
    readonlyConfig: true
  },
  {
    key: 'branchIndependent',
    label: '分店（自主配置）',
    store: '二号门店',
    configStatus: '已启用',
    scene: '现金营销',
    accountSource: '门店自有账户',
    readonlyConfig: false
  }
]);

const storeStats: StoreStat[] = [
  { store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', successAmount: '¥3,200.00', failedAmount: '¥0.00' },
  { store: '二号门店', accountType: '门店自有账户', account: '二号门店(2208)', successAmount: '¥5,100.00', failedAmount: '¥120.00' },
  { store: '三号门店', accountType: '总部账户', account: '总部商户号(1109)', successAmount: '¥4,280.00', failedAmount: '¥200.00' },
  { store: '三号门店', accountType: '门店自有账户', account: '三号门店(3306)', successAmount: '¥680.00', failedAmount: '¥0.00' }
];

const authUsers = ref<AuthUser[]>([
  { nickname: '云朵', name: '张三', phone: '138****0001', openid: 'oYz***a01', store: '首款门店', status: '已授权', scene: '佣金报酬', total: '¥800.00', lastPaidAt: '2026-07-01' },
  { nickname: '星河', name: '王五', openid: 'oYz***c03', store: '三号门店', status: '已关闭', scene: '佣金报酬', total: '¥300.00', lastPaidAt: '2026-06-20' },
  { nickname: '小赵', name: '赵六', phone: '136****0004', openid: 'oYz***d04', store: '首款门店', status: '已授权', scene: '佣金报酬', total: '¥50.00', lastPaidAt: '2026-07-01' }
]);

const payoutDetails = ref<PayoutDetail[]>([
  { id: 'P20260701001', paidAt: '2026-07-01 10:20', store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '张三', phone: '138****0001', openid: 'oYz***a01', business: '合伙人佣金提现', amount: '¥200.00', status: '成功', wechatNo: 'WX20260701099001' },
  { id: 'P20260701002', paidAt: '2026-07-01 11:05', store: '三号门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '王五', phone: '137****0003', openid: 'oYz***c03', business: '幸运转盘', amount: '¥120.00', status: '失败', wechatNo: '-' },
  { id: 'P20260701003', paidAt: '2026-07-01 14:18', store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '赵六', phone: '136****0004', openid: 'oYz***d04', business: '0元抽奖', amount: '¥50.00', status: '成功', wechatNo: 'WX20260701099003' },
  { id: 'P20260701004', paidAt: '2026-07-01 16:32', store: '二号门店', accountType: '门店自有账户', account: '二号门店(2208)', receiver: '钱七', phone: '135****0007', openid: 'oYz***g07', business: '刮刮卡', amount: '¥80.00', status: '成功', wechatNo: 'WX20260701099004' }
]);

const selectableStores = [
  { name: '热浪华穗（万达soho）', code: 'R000', city: '上海市', tag: '上海' },
  { name: '热浪林和西（第一国际）', code: 'R004', city: '广州市', tag: '广州' },
  { name: '热浪嘉禾（厚街）', code: 'R006', city: '清远市', tag: '广州' },
  { name: '热浪（白云店）', code: 'R001', city: '广州市', tag: '广州' },
  { name: '热浪（东山口店）', code: 'R007', city: '广州市', tag: '广州' },
  { name: '热浪（荔湾湖店）', code: 'R008', city: '广州市', tag: '广州' },
  { name: '热浪中山（虎门万达）', code: 'R009', city: '广州市', tag: '广州' },
  { name: '1区自动化测试自主店', code: 'T001', city: '市辖区', tag: '测试' },
  { name: '热浪（太古仓店）', code: 'R010', city: '广州市', tag: '广州' },
  { name: '热浪（机场店）', code: 'R002', city: '阳江市', tag: '广州' },
  { name: '热浪蔷薇（泰禾）', code: 'R003', city: '广州市', tag: '广州' },
  { name: '热浪测试1（卓越中寰）', code: 'R005', city: '广州市', tag: '测试' }
];

const inSolution = ref(false);
const activeTerminal = ref<TerminalKey>('B端');
const activeMenu = ref<MenuKey>('overview');
const activeViewKey = ref<ViewKey>('hq');
const overviewTableTab = ref<'打款统计' | '打款明细'>('打款统计');
const dateRange = ref<[Date, Date] | ''>('');

const qrDialogVisible = ref(false);
const payoutDialogVisible = ref(false);
const storeDrawerVisible = ref(false);
const detailDrawerVisible = ref(false);
const selectedUser = ref<AuthUser | null>(null);
const selectedDetail = ref<PayoutDetail | null>(null);
const savingConfig = ref(false);
const configValidationError = ref('');

const selectedStores = ref(['热浪（白云店）', '热浪（机场店）', '热浪蔷薇（泰禾）', '热浪林和西（第一国际）', '热浪测试1（卓越中寰）']);
const storeSearch = ref('');
const storeTag = ref('');
const totalStoreCount = 33;

const authFilters = ref({ store: '', status: '', keyword: '' });
const detailFilters = ref({ store: '', status: '', business: '', keyword: '' });
const statsFilters = ref<{ dateRange: [Date, Date] | ''; store: string }>({
  dateRange: [new Date('2026-07-01'), new Date('2026-07-31')],
  store: ''
});
const payoutForm = ref({ amount: 200, business: '合伙人佣金提现', remark: '7月分销佣金' });
const configForm = ref({
  mchid: '1900********1109',
  appid: 'wx************4356',
  apiKey: '************',
  certNo: '6B729D43********8F20',
  privateKey: '-----BEGIN PRIVATE KEY-----\n********\n-----END PRIVATE KEY-----',
  publicKeyId: 'PUB_KEY_ID_011423',
  platformCert: '-----BEGIN CERTIFICATE-----\n********\n-----END CERTIFICATE-----'
});

const currentView = computed(() => views.value.find((view) => view.key === activeViewKey.value) ?? views.value[0]);
const viewSwitchOptions = computed(() => views.value.map((view) => ({ label: view.label, value: view.key })));
const activeRequirementNote = computed(() => requirementNotes[activeMenu.value]);
const subMenus = menuOptions;
const isHeadquarters = computed(() => activeViewKey.value === 'hq');
const storeOptions = computed(() => isHeadquarters.value ? ['首款门店', '二号门店', '三号门店'] : [currentView.value.store ?? '当前门店']);
const currentAccountName = computed(() => currentView.value.accountSource === '门店自有账户' ? '二号门店(2208)' : '总部商户号(1109)');

const visibleStoreStats = computed(() => {
  const scopedRows = isHeadquarters.value
    ? storeStats
    : storeStats.filter((item) => item.store === currentView.value.store);
  if (!statsFilters.value.store) return scopedRows;
  return scopedRows.filter((item) => item.store === statsFilters.value.store);
});

const overviewMetrics = computed(() => {
  const rows = visibleStoreStats.value;
  const amount = rows.reduce((sum, row) => sum + currencyToNumber(row.successAmount), 0);
  const failed = rows.reduce((sum, row) => sum + currencyToNumber(row.failedAmount), 0);
  const successTotal = amount + (isHeadquarters.value ? 86240 : 12800);
  const failedTotal = failed + (isHeadquarters.value ? 1480 : 260);
  return [
    { label: '成功打款金额', total: formatCurrency(successTotal), month: formatCurrency(amount) },
    { label: '失败金额', total: formatCurrency(failedTotal), month: formatCurrency(failed) }
  ];
});

const visibleAuthUsers = computed(() => authUsers.value.filter((user) => {
  if (!isHeadquarters.value && user.store !== currentView.value.store) return false;
  if (authFilters.value.store && user.store !== authFilters.value.store) return false;
  if (authFilters.value.status && user.status !== authFilters.value.status) return false;
  if (authFilters.value.keyword && !`${user.nickname}${user.name}${user.phone ?? ''}${user.openid}`.includes(authFilters.value.keyword)) return false;
  return true;
}));

const visiblePayoutDetails = computed(() => payoutDetails.value.filter((detail) => {
  if (!isHeadquarters.value && detail.store !== currentView.value.store) return false;
  if (detailFilters.value.store && detail.store !== detailFilters.value.store) return false;
  if (detailFilters.value.status && detail.status !== detailFilters.value.status) return false;
  if (detailFilters.value.business && detail.business !== detailFilters.value.business) return false;
  if (detailFilters.value.keyword && !`${detail.receiver}${detail.phone}${detail.openid}${detail.id}`.includes(detailFilters.value.keyword)) return false;
  return true;
}));

const filteredSelectableStores = computed(() => selectableStores.filter((store) => {
  if (storeTag.value && store.tag !== storeTag.value) return false;
  if (storeSearch.value) {
    const keywords = storeSearch.value.split(/[、\s]+/).filter(Boolean);
    if (keywords.length && !keywords.some((keyword) => `${store.name}${store.code}${store.city}`.includes(keyword))) return false;
  }
  return true;
}));

function enterSolution() {
  inSolution.value = true;
  syncDefaultMenu();
}

function syncDefaultMenu() {
  activeMenu.value = 'overview';
  overviewTableTab.value = '打款统计';
  authFilters.value.store = '';
  detailFilters.value.store = isHeadquarters.value ? '' : currentView.value.store ?? '';
  statsFilters.value.store = isHeadquarters.value ? '' : currentView.value.store ?? '';
}

function openDetailsFromOverview(row: StoreStat) {
  activeMenu.value = 'overview';
  overviewTableTab.value = '打款明细';
  detailFilters.value.store = row.store;
}

function focusDetail(user: AuthUser) {
  activeMenu.value = 'overview';
  overviewTableTab.value = '打款明细';
  detailFilters.value.store = user.store;
  detailFilters.value.keyword = user.name;
}

function openPayout(user: AuthUser) {
  selectedUser.value = user;
  payoutDialogVisible.value = true;
}

function submitPayout() {
  if (!selectedUser.value) return;
  payoutDetails.value.unshift({
    id: `P20260701${String(payoutDetails.value.length + 5).padStart(3, '0')}`,
    store: selectedUser.value.store,
    accountType: currentView.value.accountSource === '门店自有账户' ? '门店自有账户' : '总部账户',
    account: currentAccountName.value,
    receiver: selectedUser.value.name,
    phone: selectedUser.value.phone ?? '-',
    openid: selectedUser.value.openid,
    business: payoutForm.value.business,
    paidAt: '2026-07-01 18:00',
    amount: formatCurrency(payoutForm.value.amount),
    status: '待处理',
    wechatNo: '-'
  });
  payoutDialogVisible.value = false;
  ElMessage.success('打款单已提交');
}

function copyQrImage() {
  ElMessage.success('已复制授权码图片');
}

function saveQrImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#fff"/><rect x="14" y="14" width="42" height="42" fill="#202631"/><rect x="22" y="22" width="26" height="26" fill="#fff"/><rect x="30" y="30" width="10" height="10" fill="#202631"/><rect x="124" y="14" width="42" height="42" fill="#202631"/><rect x="132" y="22" width="26" height="26" fill="#fff"/><rect x="140" y="30" width="10" height="10" fill="#202631"/><rect x="14" y="124" width="42" height="42" fill="#202631"/><rect x="22" y="132" width="26" height="26" fill="#fff"/><rect x="30" y="140" width="10" height="10" fill="#202631"/><path d="M72 18h10v10H72zM92 18h18v10H92zM72 38h28v10H72zM112 38h10v10h-10zM70 70h12v12H70zM92 70h10v10H92zM112 70h28v10h-28zM150 70h10v20h-10zM70 92h30v10H70zM112 92h10v10h-10zM132 92h28v10h-28zM82 112h10v28H82zM102 112h28v10h-28zM140 112h20v10h-20zM70 150h20v10H70zM102 142h10v20h-10zM122 132h38v10h-38zM132 152h10v10h-10zM152 152h10v10h-10z" fill="#202631"/></svg>`;
  const link = document.createElement('a');
  link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  link.download = '收款授权码.svg';
  link.click();
  ElMessage.success('已保存授权码图片');
}

function toggleStore(store: string) {
  selectedStores.value = selectedStores.value.includes(store)
    ? selectedStores.value.filter((item) => item !== store)
    : [...selectedStores.value, store];
}

function toggleAllStores(checked: string | number | boolean) {
  selectedStores.value = checked ? selectableStores.slice(0, 5).map((store) => store.name) : [];
}

function removeStore(store: string) {
  selectedStores.value = selectedStores.value.filter((item) => item !== store);
}

function openDetailDrawer(detail: PayoutDetail) {
  selectedDetail.value = detail;
  detailDrawerVisible.value = true;
}

function retryPayout(detail: PayoutDetail) {
  ElMessage.success(`已重新提交 ${detail.receiver} 的打款`);
}

function openGuideDoc() {
  window.open(FEISHU_HELP_URL, '_blank', 'noopener');
}

async function saveSettings() {
  configValidationError.value = '';
  const localError = validateRequiredConfig();
  if (localError) {
    configValidationError.value = localError;
    ElMessage.error(localError);
    return;
  }

  savingConfig.value = true;
  try {
    await mockValidateWechatConfig();
    const target = views.value.find((view) => view.key === activeViewKey.value);
    if (target) {
      target.configStatus = '已启用';
    }
    ElMessage.success('配置校验通过，设置已保存');
  } catch (error) {
    configValidationError.value = error instanceof Error ? error.message : '配置校验失败，请检查微信商户平台配置';
    ElMessage.error(configValidationError.value);
  } finally {
    savingConfig.value = false;
  }
}

function validateRequiredConfig() {
  const requiredFields = [
    ['商户号 mchid', configForm.value.mchid],
    ['AppID', configForm.value.appid],
    ['API v3 密钥', configForm.value.apiKey],
    ['商户证书序列号', configForm.value.certNo],
    ['商户私钥', configForm.value.privateKey],
    ['微信支付公钥ID', configForm.value.publicKeyId],
    ['平台证书', configForm.value.platformCert]
  ];
  const missingField = requiredFields.find(([, value]) => !String(value).trim());
  return missingField ? `请先填写${missingField[0]}，再保存设置` : '';
}

async function mockValidateWechatConfig() {
  await new Promise((resolve) => window.setTimeout(resolve, 500));
  if (configForm.value.mchid.includes('0000')) {
    throw new Error('微信配置校验失败：商户号与 AppID 未完成绑定，请按操作指引到微信商户平台检查。');
  }
  if (!configForm.value.privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('微信配置校验失败：商户私钥格式不正确，请重新粘贴完整私钥。');
  }
  if (!configForm.value.platformCert.includes('BEGIN CERTIFICATE')) {
    throw new Error('微信配置校验失败：平台证书格式不正确，请重新粘贴完整证书。');
  }
}

function authTagType(status: string) {
  if (status === '已授权') return 'success';
  return 'info';
}

function currencyToNumber(value: string) {
  return Number(value.replace(/[¥,]/g, '')) || 0;
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

</script>
