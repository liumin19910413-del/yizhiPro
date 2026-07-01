<template>
  <div class="app-shell">
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
        <div class="breadcrumb">{{ inSolution ? '营销应用 / 微信小额打款解决方案' : '营销应用' }}</div>
        <div class="topbar-actions">
          <div v-if="inSolution" class="view-switch">
            <span>当前视角</span>
            <el-select v-model="activeViewKey" size="default" style="width: 220px" @change="syncDefaultMenu">
              <el-option
                v-for="view in views"
                :key="view.key"
                :label="view.label"
                :value="view.key"
              />
            </el-select>
          </div>
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

      <template v-else>
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
            <section v-if="activeMenu === 'overview'" class="page-stack">
              <div class="metric-grid">
                <div v-for="metric in overviewMetrics" :key="metric.label" class="metric-panel">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                  <small>{{ metric.note }}</small>
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
                    <el-select v-model="statsFilters.store" placeholder="门店" clearable :disabled="!isHeadquarters">
                      <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                    </el-select>
                    <el-button>导出</el-button>
                  </div>
                  <el-button v-else>导出</el-button>
                </div>
                <el-table v-if="overviewTableTab === '打款统计'" :data="visibleStoreStats" border>
                  <el-table-column prop="store" label="门店名称" min-width="120" />
                  <el-table-column prop="accountType" label="账户类型" min-width="120" />
                  <el-table-column prop="account" label="出款账户" min-width="150" />
                  <el-table-column prop="successAmount" label="成功金额" min-width="120" align="right" />
                  <el-table-column prop="count" label="打款笔数" min-width="100" align="right" />
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
                    <el-select v-model="detailFilters.store" placeholder="门店" clearable :disabled="!isHeadquarters">
                      <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                    </el-select>
                    <el-select v-model="detailFilters.status" placeholder="状态" clearable>
                      <el-option label="成功" value="成功" />
                      <el-option label="失败" value="失败" />
                      <el-option label="待处理" value="待处理" />
                    </el-select>
                    <el-select v-model="detailFilters.business" placeholder="业务场景" clearable>
                      <el-option label="抽奖奖励" value="抽奖奖励" />
                      <el-option label="分销合伙人提现" value="分销合伙人提现" />
                    </el-select>
                    <el-input v-model="detailFilters.keyword" placeholder="收款人/手机号/openid/单号" clearable />
                    <el-button>查询</el-button>
                  </div>
                  <el-table :data="visiblePayoutDetails" border>
                    <el-table-column prop="paidAt" label="打款时间" min-width="150" />
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
                        <el-button link type="primary" @click="openDetailDrawer(row)">查看</el-button>
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
                  <el-button type="primary" @click="authDialogVisible = true">添加授权</el-button>
                </div>
                <div class="filter-row">
                  <el-select v-model="authFilters.store" placeholder="所属门店" clearable>
                    <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
                  </el-select>
                  <el-select v-model="authFilters.status" placeholder="授权状态" clearable>
                    <el-option label="已授权" value="已授权" />
                    <el-option label="待授权" value="待授权" />
                    <el-option label="已关闭" value="已关闭" />
                  </el-select>
                  <el-input v-model="authFilters.keyword" placeholder="收款人姓名/手机号搜索" clearable />
                  <el-button>查询</el-button>
                </div>
                <el-table :data="visibleAuthUsers" border>
                  <el-table-column prop="name" label="收款人" width="110" />
                  <el-table-column prop="phone" label="手机号" width="140" />
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
                      <el-button v-if="row.status === '待授权'" link type="primary" @click="qrDialogVisible = true">查看二维码</el-button>
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
                <span>配置来源：总部统一配置，生效时间：2026-07-01 17:26。门店不可修改商户号、证书、转账场景和接口安全 IP。</span>
              </div>

              <section class="content-panel">
                <div class="panel-title-row">
                  <h2>开通配置</h2>
                  <el-tag :type="currentView.configStatus === '未开通' ? 'info' : 'success'">{{ currentView.configStatus }}</el-tag>
                </div>

                <el-steps :active="activeConfigStep" finish-status="success" align-center class="setup-steps">
                  <el-step v-for="step in configSteps" :key="step.title" :title="step.title" />
                </el-steps>

                <div v-if="!currentView.readonlyConfig" class="setup-wizard">
                  <aside class="setup-side">
                    <span>当前步骤</span>
                    <strong>{{ activeConfigStep + 1 }} / {{ configSteps.length }}</strong>
                    <p>{{ configSteps[activeConfigStep].desc }}</p>
                    <div class="next-steps">
                      <span>后续步骤</span>
                      <ol>
                        <li v-for="step in upcomingConfigSteps" :key="step.title">{{ step.title }}</li>
                      </ol>
                    </div>
                  </aside>

                  <section class="setup-step-panel">
                    <template v-if="activeConfigStep === 0">
                      <h3>申请微信商户号</h3>
                      <p>如未申请微信支付商户号，请先前往微信支付商户平台申请。已拥有商户号的商家可直接进入下一步。</p>
                      <el-alert title="请确认商户号主体与实际出款主体一致，后续系统配置会使用该商户号出款。" type="info" show-icon :closable="false" />
                      <div class="step-actions-inline">
                        <el-button>查看申请指引</el-button>
                        <el-button>我已有商户号</el-button>
                      </div>
                    </template>

                    <template v-else-if="activeConfigStep === 1">
                      <h3>开通商家转账</h3>
                      <p>进入微信支付商户平台，开通「商家转账」能力，并按实际业务选择一个转账场景。</p>
                      <el-alert title="本期一个商户号只支持配置一个转账场景，请按当前主要业务选择。" type="info" show-icon :closable="false" />
                      <div class="scenario-cards">
                        <div>
                          <strong>抽奖奖励</strong>
                          <span>建议选择现金营销</span>
                        </div>
                        <div>
                          <strong>合伙人提现</strong>
                          <span>建议选择佣金报酬</span>
                        </div>
                      </div>
                    </template>

                    <template v-else-if="activeConfigStep === 2">
                      <h3>设置接口安全 IP</h3>
                      <p>请复制以下系统提供的 IP，到微信商户平台完成接口安全 IP 配置。</p>
                      <div v-for="ip in safeIps" :key="ip" class="copy-line">
                        <code>{{ ip }}</code>
                        <el-button size="small" @click="copyText(ip)">复制</el-button>
                      </div>
                      <el-checkbox v-model="ipConfirmed">我已在微信商户平台完成配置</el-checkbox>
                    </template>

                    <template v-else-if="activeConfigStep === 3">
                      <h3>填写系统配置</h3>
                      <p>请填写微信商户号、AppID、密钥和证书信息。每个字段都可以查看获取路径。</p>
                      <el-form :model="configForm" label-width="150px" class="config-form">
                        <el-form-item label="商户号 mchid">
                          <el-input v-model="configForm.mchid">
                            <template #append><el-button @click="openHelp('商户号 mchid')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="AppID">
                          <el-input v-model="configForm.appid">
                            <template #append><el-button @click="openHelp('AppID')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="API v3 密钥">
                          <el-input v-model="configForm.apiKey" show-password>
                            <template #append><el-button @click="openHelp('API v3 密钥')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="商户证书序列号">
                          <el-input v-model="configForm.certNo">
                            <template #append><el-button @click="openHelp('商户证书序列号')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="商户私钥">
                          <el-input v-model="configForm.privateKey" type="textarea" :rows="3" />
                        </el-form-item>
                        <el-form-item label="微信支付公钥ID">
                          <el-input v-model="configForm.publicKeyId">
                            <template #append><el-button @click="openHelp('微信支付公钥ID')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="转账场景ID">
                          <el-input v-model="configForm.sceneId">
                            <template #append><el-button @click="openHelp('转账场景ID')">如何获取</el-button></template>
                          </el-input>
                        </el-form-item>
                        <el-form-item label="转账场景名称">
                          <el-select v-model="configForm.sceneName" style="width: 100%">
                            <el-option label="现金营销" value="现金营销" />
                            <el-option label="佣金报酬" value="佣金报酬" />
                            <el-option label="企业赔付" value="企业赔付" />
                          </el-select>
                        </el-form-item>
                      </el-form>
                    </template>

                    <template v-else>
                      <h3>启用通道</h3>
                      <p>确认配置无误后，即可启用微信小额打款通道。启用后，微信零钱打款将使用新能力处理。</p>
                      <section v-if="isHeadquarters" class="setup-store-card">
                        <div class="panel-title-row compact">
                          <h2>适用门店</h2>
                          <div>
                            <el-button @click="storeDrawerVisible = true">选择门店</el-button>
                            <el-button>查看覆盖记录</el-button>
                          </div>
                        </div>
                        <div class="selected-stores">
                          <span>已适用门店：{{ selectedStores.length }} 家</span>
                          <el-tag v-for="store in selectedStores" :key="store" type="info">{{ store }}</el-tag>
                        </div>
                        <el-alert
                          title="被设置为适用门店的分店将使用总部当前配置；若分店此前已独立配置，保存后将被总部配置覆盖。"
                          type="warning"
                          show-icon
                          :closable="false"
                        />
                      </section>
                      <el-alert title="启用前建议先完成配置校验。原型中点击完成启用会进入确认弹窗。" type="success" show-icon :closable="false" />
                    </template>
                  </section>
                </div>

                <div v-if="!currentView.readonlyConfig" class="wizard-actions">
                  <el-button :disabled="activeConfigStep === 0" @click="prevConfigStep">上一步</el-button>
                  <el-button>保存草稿</el-button>
                  <el-button v-if="activeConfigStep < configSteps.length - 1" type="primary" @click="nextConfigStep">下一步</el-button>
                  <el-button v-else type="primary" @click="enableDialogVisible = true">完成并启用</el-button>
                </div>
              </section>
            </section>
          </section>
        </section>
      </template>
    </main>

    <el-dialog v-model="authDialogVisible" title="添加授权用户" width="520px">
      <el-form label-width="110px">
        <el-form-item label="所属门店">
          <el-select v-model="authForm.store" style="width: 100%" :disabled="!isHeadquarters">
            <el-option v-for="store in storeOptions" :key="store" :label="store" :value="store" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款人姓名"><el-input v-model="authForm.name" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="authForm.phone" /></el-form-item>
        <el-form-item label="用户展示名称"><el-input v-model="authForm.displayName" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="authForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="authDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="showQrFromAuth">生成授权二维码</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="qrDialogVisible" title="请让用户扫码完成收款授权" width="420px">
      <div class="qr-box">
        <div class="qr-code">
          <span v-for="cell in 81" :key="cell" :class="{ dark: cell % 2 === 0 || cell % 7 === 0 || cell % 11 === 0 }"></span>
        </div>
        <p>授权场景：{{ currentView.scene }}</p>
        <p>授权有效期：24小时</p>
        <p>配置来源：{{ currentView.accountSource }}</p>
      </div>
      <template #footer>
        <el-button>复制授权链接</el-button>
        <el-button type="primary" @click="qrDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="payoutDialogVisible" title="发起打款" width="560px">
      <div v-if="selectedUser" class="payee-summary">
        <span>收款人：{{ selectedUser.name }} {{ selectedUser.phone }}</span>
        <span>所属门店：{{ selectedUser.store }}</span>
        <span>出款账户：{{ currentAccountName }}</span>
      </div>
      <el-form :model="payoutForm" label-width="120px">
        <el-form-item label="打款金额"><el-input-number v-model="payoutForm.amount" :min="1" :precision="2" style="width: 180px" /> 元</el-form-item>
        <el-form-item label="业务场景">
          <el-select v-model="payoutForm.business" style="width: 100%">
            <el-option label="抽奖奖励" value="抽奖奖励" />
            <el-option label="分销合伙人提现" value="分销合伙人提现" />
            <el-option label="邮费补贴" value="邮费补贴" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源工具">
          <el-select v-model="payoutForm.source" style="width: 100%">
            <el-option label="幸运转盘" value="幸运转盘" />
            <el-option label="零元抽奖" value="零元抽奖" />
            <el-option label="刮刮乐" value="刮刮乐" />
            <el-option label="分销合伙人" value="分销合伙人" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源业务单号"><el-input v-model="payoutForm.sourceNo" /></el-form-item>
        <el-form-item label="转账备注"><el-input v-model="payoutForm.remark" maxlength="32" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payoutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayout">确认打款</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="storeDrawerVisible" title="选择适用门店" size="720px">
      <div class="filter-row">
        <el-input v-model="storeSearch" placeholder="门店名称/编号" clearable />
        <el-select v-model="storeArea" placeholder="区域" clearable>
          <el-option label="华东" value="华东" />
          <el-option label="华南" value="华南" />
          <el-option label="华北" value="华北" />
        </el-select>
        <el-select v-model="storeStatus" placeholder="配置状态" clearable>
          <el-option label="未启用" value="未启用" />
          <el-option label="独立配置" value="独立配置" />
          <el-option label="适用总部配置" value="适用总部配置" />
        </el-select>
      </div>
      <div class="drawer-summary">已选择：{{ selectedStores.length }} 家</div>
      <el-table :data="filteredSelectableStores" border>
        <el-table-column prop="name" label="门店名称" />
        <el-table-column prop="code" label="门店编号" width="110" />
        <el-table-column prop="area" label="区域" width="90" />
        <el-table-column prop="status" label="当前配置状态" width="130" />
        <el-table-column label="覆盖提示" min-width="150">
          <template #default="{ row }">
            <span class="risk-text">{{ row.status === '独立配置' ? '选择后将覆盖原配置' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-button link type="primary" @click="toggleStore(row.name)">
              {{ selectedStores.includes(row.name) ? '取消选择' : '选择' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="storeDrawerVisible = false">取消</el-button>
        <el-button type="primary" @click="storeDrawerVisible = false">确认选择</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="helpDrawerVisible" :title="helpTitle" size="420px">
      <div class="help-content">
        <p>请登录微信支付商户平台，在产品中心和账户中心中查看对应信息。</p>
        <p>填写后请确认商户号、AppID 与已开通商家转账的主体一致。</p>
      </div>
    </el-drawer>

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

    <el-dialog v-model="enableDialogVisible" title="确认启用微信小额打款通道？" width="560px">
      <p class="confirm-copy">
        启用后，幸运转盘、零元抽奖、刮刮乐中的现金奖励发放到微信零钱，以及合伙人提现中的“提现到微信零钱”，将统一使用微信小额打款方案处理。
      </p>
      <p class="confirm-copy muted">支付宝提现、空中分账等其他方式不受影响。</p>
      <template #footer>
        <el-button @click="enableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="enableDialogVisible = false">确认启用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
type MenuKey = 'overview' | 'payout' | 'config';
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
  count: number;
  failedAmount: string;
}

interface AuthUser {
  name: string;
  phone: string;
  store: string;
  status: '已授权' | '待授权' | '已关闭';
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

const globalNav = ['小红书', '连锁架构', '门店配置', '公域获客', '私域运营', 'AI 智能体', '营销中心', '数据报表', '库存管理'];
const subMenus: { key: MenuKey; label: string }[] = [
  { key: 'overview', label: '数据总览' },
  { key: 'payout', label: '授权打款' },
  { key: 'config', label: '开通配置' }
];

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

const views: ViewProfile[] = [
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
    label: '分店A-适用总部配置',
    store: '首款门店',
    configStatus: '已适用总部配置',
    scene: '佣金报酬',
    accountSource: '总部统一出资',
    readonlyConfig: true
  },
  {
    key: 'branchIndependent',
    label: '分店B-独立配置',
    store: '二号门店',
    configStatus: '已启用',
    scene: '现金营销',
    accountSource: '门店自有账户',
    readonlyConfig: false
  }
];

const storeStats: StoreStat[] = [
  { store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', successAmount: '¥3,200.00', count: 32, failedAmount: '¥0.00' },
  { store: '二号门店', accountType: '门店自有账户', account: '二号门店(2208)', successAmount: '¥5,100.00', count: 51, failedAmount: '¥120.00' },
  { store: '三号门店', accountType: '总部账户', account: '总部商户号(1109)', successAmount: '¥4,280.00', count: 45, failedAmount: '¥200.00' },
  { store: '三号门店', accountType: '门店自有账户', account: '三号门店(3306)', successAmount: '¥680.00', count: 8, failedAmount: '¥0.00' }
];

const authUsers = ref<AuthUser[]>([
  { name: '张三', phone: '138****0001', store: '首款门店', status: '已授权', scene: '佣金报酬', total: '¥800.00', lastPaidAt: '2026-07-01' },
  { name: '李四', phone: '139****0002', store: '二号门店', status: '待授权', scene: '现金营销', total: '¥0.00', lastPaidAt: '-' },
  { name: '王五', phone: '137****0003', store: '三号门店', status: '已关闭', scene: '佣金报酬', total: '¥300.00', lastPaidAt: '2026-06-20' },
  { name: '赵六', phone: '136****0004', store: '首款门店', status: '已授权', scene: '佣金报酬', total: '¥50.00', lastPaidAt: '2026-07-01' }
]);

const payoutDetails = ref<PayoutDetail[]>([
  { id: 'P20260701001', paidAt: '2026-07-01 10:20', store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '张三', phone: '138****0001', openid: 'oYz***a01', business: '分销合伙人提现', amount: '¥200.00', status: '成功', wechatNo: 'WX20260701099001' },
  { id: 'P20260701002', paidAt: '2026-07-01 11:05', store: '三号门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '王五', phone: '137****0003', openid: 'oYz***c03', business: '抽奖奖励', amount: '¥120.00', status: '失败', wechatNo: '-' },
  { id: 'P20260701003', paidAt: '2026-07-01 14:18', store: '首款门店', accountType: '总部账户', account: '总部商户号(1109)', receiver: '赵六', phone: '136****0004', openid: 'oYz***d04', business: '抽奖奖励', amount: '¥50.00', status: '成功', wechatNo: 'WX20260701099003' },
  { id: 'P20260701004', paidAt: '2026-07-01 16:32', store: '二号门店', accountType: '门店自有账户', account: '二号门店(2208)', receiver: '钱七', phone: '135****0007', openid: 'oYz***g07', business: '抽奖奖励', amount: '¥80.00', status: '成功', wechatNo: 'WX20260701099004' }
]);

const selectableStores = [
  { name: '首款门店', code: 'S001', area: '华东', status: '未启用' },
  { name: '三号门店', code: 'S003', area: '华南', status: '独立配置' },
  { name: '二号门店', code: 'S002', area: '华北', status: '独立配置' },
  { name: '湖滨门店', code: 'S018', area: '华东', status: '未启用' },
  { name: '星河门店', code: 'S026', area: '华南', status: '适用总部配置' }
];

const inSolution = ref(false);
const activeMenu = ref<MenuKey>('overview');
const activeViewKey = ref<ViewKey>('hq');
const overviewTableTab = ref<'打款统计' | '打款明细'>('打款统计');
const activeConfigStep = ref(0);
const dateRange = ref<[Date, Date] | ''>('');

const authDialogVisible = ref(false);
const qrDialogVisible = ref(false);
const payoutDialogVisible = ref(false);
const storeDrawerVisible = ref(false);
const helpDrawerVisible = ref(false);
const detailDrawerVisible = ref(false);
const enableDialogVisible = ref(false);
const helpTitle = ref('');
const selectedUser = ref<AuthUser | null>(null);
const selectedDetail = ref<PayoutDetail | null>(null);

const selectedStores = ref(['首款门店', '三号门店']);
const storeSearch = ref('');
const storeArea = ref('');
const storeStatus = ref('');
const safeIps = ['121.43.88.126', '47.98.21.205'];
const ipConfirmed = ref(true);

const authFilters = ref({ store: '', status: '', keyword: '' });
const detailFilters = ref({ store: '', status: '', business: '', keyword: '' });
const statsFilters = ref<{ dateRange: [Date, Date] | ''; store: string }>({
  dateRange: [new Date('2026-07-01'), new Date('2026-07-31')],
  store: ''
});
const authForm = ref({ store: '首款门店', name: '', phone: '', displayName: '', remark: '' });
const payoutForm = ref({ amount: 200, business: '分销合伙人提现', source: '分销合伙人', sourceNo: 'TX20260701005', remark: '7月分销佣金' });
const configForm = ref({
  mchid: '1900********1109',
  appid: 'wx************4356',
  apiKey: '************',
  certNo: '6B729D43********8F20',
  privateKey: '-----BEGIN PRIVATE KEY-----\n********\n-----END PRIVATE KEY-----',
  publicKeyId: 'PUB_KEY_ID_011423',
  sceneId: '1005',
  sceneName: '佣金报酬'
});

const configSteps = [
  { title: '申请微信商户号', desc: '确认商家是否已有可用于出款的微信支付商户号。' },
  { title: '开通商家转账', desc: '在微信商户平台开通商家转账，并选择一个转账场景。' },
  { title: '设置接口安全IP', desc: '复制系统提供的 IP，在微信商户平台完成安全配置。' },
  { title: '填写系统配置', desc: '录入商户号、AppID、密钥、证书和转账场景等系统参数。' },
  { title: '启用通道', desc: '确认适用门店和业务影响范围，完成新通道启用。' }
];

const currentView = computed(() => views.find((view) => view.key === activeViewKey.value) ?? views[0]);
const isHeadquarters = computed(() => activeViewKey.value === 'hq');
const storeOptions = computed(() => isHeadquarters.value ? ['首款门店', '二号门店', '三号门店'] : [currentView.value.store ?? '当前门店']);
const currentAccountName = computed(() => currentView.value.accountSource === '门店自有账户' ? '二号门店(2208)' : '总部商户号(1109)');
const upcomingConfigSteps = computed(() => configSteps.slice(activeConfigStep.value + 1));

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
  const count = rows.reduce((sum, row) => sum + row.count, 0);
  return [
    { label: '本月成功打款金额', value: formatCurrency(amount), note: isHeadquarters.value ? '全部门店' : '当前门店' },
    { label: '本月打款笔数', value: String(count), note: '成功打款' },
    { label: '失败金额', value: formatCurrency(failed), note: '不计入成功金额' }
  ];
});

const visibleAuthUsers = computed(() => authUsers.value.filter((user) => {
  if (!isHeadquarters.value && user.store !== currentView.value.store) return false;
  if (authFilters.value.store && user.store !== authFilters.value.store) return false;
  if (authFilters.value.status && user.status !== authFilters.value.status) return false;
  if (authFilters.value.keyword && !`${user.name}${user.phone}`.includes(authFilters.value.keyword)) return false;
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
  if (storeSearch.value && !`${store.name}${store.code}`.includes(storeSearch.value)) return false;
  if (storeArea.value && store.area !== storeArea.value) return false;
  if (storeStatus.value && store.status !== storeStatus.value) return false;
  return true;
}));

function enterSolution() {
  inSolution.value = true;
  syncDefaultMenu();
}

function syncDefaultMenu() {
  activeMenu.value = currentView.value.configStatus === '未开通' ? 'config' : 'overview';
  activeConfigStep.value = 0;
  overviewTableTab.value = '打款统计';
  authFilters.value.store = '';
  detailFilters.value.store = isHeadquarters.value ? '' : currentView.value.store ?? '';
  statsFilters.value.store = isHeadquarters.value ? '' : currentView.value.store ?? '';
}

function nextConfigStep() {
  activeConfigStep.value = Math.min(activeConfigStep.value + 1, configSteps.length - 1);
}

function prevConfigStep() {
  activeConfigStep.value = Math.max(activeConfigStep.value - 1, 0);
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
    phone: selectedUser.value.phone,
    openid: 'oYz***new',
    business: payoutForm.value.business,
    paidAt: '2026-07-01 18:00',
    amount: formatCurrency(payoutForm.value.amount),
    status: '待处理',
    wechatNo: '-'
  });
  payoutDialogVisible.value = false;
  ElMessage.success('打款单已提交');
}

function showQrFromAuth() {
  authDialogVisible.value = false;
  qrDialogVisible.value = true;
}

function toggleStore(store: string) {
  selectedStores.value = selectedStores.value.includes(store)
    ? selectedStores.value.filter((item) => item !== store)
    : [...selectedStores.value, store];
}

function openHelp(title: string) {
  helpTitle.value = title;
  helpDrawerVisible.value = true;
}

function openDetailDrawer(detail: PayoutDetail) {
  selectedDetail.value = detail;
  detailDrawerVisible.value = true;
}

function retryPayout(detail: PayoutDetail) {
  ElMessage.success(`已重新提交 ${detail.receiver} 的打款`);
}

async function copyText(text: string) {
  await navigator.clipboard?.writeText(text);
  ElMessage.success('已复制');
}

function authTagType(status: string) {
  if (status === '已授权') return 'success';
  if (status === '待授权') return 'warning';
  return 'info';
}

function currencyToNumber(value: string) {
  return Number(value.replace(/[¥,]/g, '')) || 0;
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

</script>
