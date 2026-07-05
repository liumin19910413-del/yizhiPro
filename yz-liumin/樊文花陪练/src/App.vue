<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toReportViewModel } from "./adapter";
import { fetchMemoryProfile, parseUrlContext, unwrapMemory } from "./api";
import { demoViewModel } from "./mock";
import type { PracticeReport, ReportViewModel, Status } from "./types";

const loading = ref(true);
const error = ref("");
const vm = ref<ReportViewModel>(demoViewModel);
const selectedId = ref(demoViewModel.latestReportId);
const pickerOpen = ref(false);
const toast = ref("");

const selectedReport = computed<PracticeReport>(() => {
  return vm.value.reports.find((report) => report.id === selectedId.value) || vm.value.reports[0];
});

const sortedDimensions = computed(() => {
  return selectedReport.value.dimensions.slice().sort((a, b) => a.score - b.score);
});

const passGap = computed(() => Math.max(vm.value.brand.passScore - selectedReport.value.totalScore, 0));

const lowDimension = computed(() => sortedDimensions.value[0]?.name || "当前模块");

const reportCommand = computed(() => selectedReport.value.nextTask || `再练一次 ${selectedReport.value.moduleName}`);

function statusText(status: Status) {
  return {
    passed: "已达标",
    not_pass: "待加强",
    locked: "未解锁",
    not_started: "未开始"
  }[status];
}

function statusClass(status: Status) {
  return `status-${status.replace("_", "-")}`;
}

function scoreClass(score: number) {
  if (score >= vm.value.brand.passScore) return "score-pass";
  if (score >= 60) return "score-warn";
  return "score-risk";
}

function selectReport(id: string) {
  selectedId.value = id;
  pickerOpen.value = false;
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(reportCommand.value);
    showToast(`已复制：${reportCommand.value}`);
  } catch {
    showToast(`口令：${reportCommand.value}`);
  }
}

function showToast(message: string) {
  toast.value = message;
  window.setTimeout(() => {
    toast.value = "";
  }, 2400);
}

async function boot() {
  const context = parseUrlContext();
  if (context.isDemo) {
    vm.value = demoViewModel;
    selectedId.value = demoViewModel.latestReportId;
    loading.value = false;
    return;
  }

  try {
    const raw = await fetchMemoryProfile(context.oneId, context.apiBase);
    const unwrapped = unwrapMemory(raw);
    vm.value = toReportViewModel(unwrapped.profile, context.oneId, "live");
    selectedId.value = vm.value.latestReportId;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "报告加载失败";
    vm.value = demoViewModel;
    selectedId.value = demoViewModel.latestReportId;
  } finally {
    loading.value = false;
  }
}

onMounted(boot);
</script>

<template>
  <main class="page" :style="{ '--brand': vm.brand.primaryColor, '--accent': vm.brand.accentColor }">
    <section v-if="loading" class="state-card">
      <span class="spinner"></span>
      <strong>正在加载成长报告</strong>
      <p>会根据员工 oneId 读取最近一次陪练记录。</p>
    </section>

    <template v-else>
      <section v-if="error" class="inline-error">
        <strong>实时数据加载失败，当前显示演示数据</strong>
        <span>{{ error }}</span>
      </section>

      <header class="report-header">
        <div class="brand-lockup">
          <span class="brand-mark" aria-hidden="true"></span>
          <div>
            <h1>{{ vm.brand.brandName }} · {{ vm.brand.reportTitle }}</h1>
            <p>{{ vm.employeeName }}｜最近更新 {{ vm.updatedAt }}</p>
          </div>
        </div>
        <button class="report-switch" type="button" @click="pickerOpen = true">本次报告⌄</button>
      </header>

      <section class="summary-card">
        <div class="summary-main">
          <div class="summary-score">
            <span :class="scoreClass(selectedReport.totalScore)">{{ selectedReport.totalScore }}</span>
            <small>/100</small>
          </div>
          <div>
            <em :class="['summary-status', statusClass(selectedReport.status)]">{{ statusText(selectedReport.status) }}</em>
            <p>
              <template v-if="selectedReport.status === 'passed'">这场已达标，可以继续解锁下一块</template>
              <template v-else>差{{ passGap }}分达标，优先补「{{ lowDimension }}」</template>
            </p>
          </div>
          <div class="summary-badge" aria-hidden="true">
            <span>★</span>
          </div>
        </div>
        <div class="summary-stats">
          <span><i class="stat-icon icon-unlocked" aria-hidden="true"></i><b>{{ vm.unlockedCount }}/{{ vm.modules.length }}</b><small>已解锁</small></span>
          <span><i class="stat-icon icon-count" aria-hidden="true"></i><b>{{ vm.reports.length }}场</b><small>累计</small></span>
          <span><i class="stat-icon icon-best" aria-hidden="true"></i><b>{{ vm.bestScore }}分</b><small>最高</small></span>
        </div>
      </section>

      <section class="next-card">
        <div>
          <strong><span class="flag-icon">⚑</span> 下一步</strong>
          <p>再练一次：{{ selectedReport.moduleName }}</p>
        </div>
        <button type="button" @click="copyCommand">开始复练</button>
      </section>

      <section class="panel">
        <div class="section-head">
          <div>
            <h2>成长路径</h2>
            <p>达标{{ vm.brand.passScore }}分后解锁下一模块</p>
          </div>
        </div>
        <div class="module-list">
          <button
            v-for="(item, index) in vm.modules"
            :key="item.id"
            class="module-row"
            type="button"
          >
            <span :class="['module-index', statusClass(item.status)]">{{ index + 1 }}</span>
            <strong>{{ item.name }}</strong>
            <div class="module-progress">
              <span :style="{ width: `${Math.min(item.bestScore, 100)}%` }"></span>
            </div>
            <b>{{ item.bestScore || "-" }}</b>
            <em :class="['chip small', statusClass(item.status)]">{{ statusText(item.status) }}</em>
            <i aria-hidden="true">›</i>
          </button>
        </div>
      </section>

      <section class="panel practice-card">
        <div class="section-head">
          <div>
            <h2>本次练的是什么</h2>
            <p>当前查看的是 {{ selectedReport.date }} 的报告</p>
          </div>
        </div>
        <div class="meta-grid">
          <span><i class="meta-icon icon-module" aria-hidden="true"></i><b>模块</b>{{ selectedReport.moduleName }}</span>
          <span><i class="meta-icon icon-scene" aria-hidden="true"></i><b>场景</b>{{ selectedReport.scene }}</span>
          <span><i class="meta-icon icon-project" aria-hidden="true"></i><b>项目</b>{{ selectedReport.project }}</span>
          <span><i class="meta-icon icon-customer" aria-hidden="true"></i><b>顾客</b>{{ selectedReport.customerType }}</span>
        </div>
      </section>

      <section class="panel ability-card">
        <div class="section-head">
          <div>
            <h2>能力短板</h2>
            <p>按低分优先排序，先补最短的一块</p>
          </div>
        </div>
        <div class="dimension-list">
          <article v-for="(item, index) in sortedDimensions" :key="item.id" class="dim-row">
            <i :class="index === 0 && selectedReport.status !== 'passed' ? 'warn-icon' : ''">!</i>
            <div>
              <strong>{{ item.name }}</strong>
              <em v-if="index === 0 && selectedReport.status !== 'passed'">需要补</em>
            </div>
            <div class="bar">
              <span :style="{ width: `${(item.score / item.max) * 100}%` }"></span>
            </div>
            <b>{{ item.score }}/{{ item.max }}</b>
          </article>
        </div>
      </section>

      <section class="panel review-panel">
        <div class="review-block good">
          <h2>做得好的</h2>
          <p v-for="item in selectedReport.strengths" :key="item.quote">
            <b>“{{ item.quote }}”</b>
            <span>{{ item.comment }}</span>
          </p>
        </div>
        <div class="review-block weak">
          <h2>要改的</h2>
          <p v-for="item in selectedReport.weaknesses" :key="item.quote">
            <b>“{{ item.quote }}”</b>
            <span>{{ item.comment }}</span>
          </p>
        </div>
      </section>

      <section class="suggestion">
        <span>下次照这个说</span>
        <article v-for="(item, index) in selectedReport.improvements.slice(0, 3)" :key="`${item.title}-${index}`" class="suggestion-item">
          <h2>{{ item.title || `建议${index + 1}` }}</h2>
          <p>{{ item.sample || reportCommand }}</p>
        </article>
      </section>

      <section class="panel history-panel">
        <div class="section-head inline">
          <div>
            <h2>历史报告</h2>
          </div>
          <button type="button" @click="pickerOpen = true">全部</button>
        </div>
        <button
          v-for="report in vm.reports.slice(0, 5)"
          :key="report.id"
          :class="['history-row', { active: report.id === selectedReport.id }]"
          type="button"
          @click="selectReport(report.id)"
        >
          <span>{{ report.date.slice(5, 16) }}</span>
          <strong>{{ report.moduleName }}</strong>
          <b :class="scoreClass(report.totalScore)">{{ report.totalScore }}</b>
          <em :class="['chip small', statusClass(report.status)]">{{ report.id === selectedReport.id ? "当前" : statusText(report.status) }}</em>
        </button>
      </section>

      <div v-if="pickerOpen" class="sheet-mask" @click.self="pickerOpen = false">
        <section class="sheet">
          <header>
            <h2>选择报告</h2>
            <button type="button" @click="pickerOpen = false">关闭</button>
          </header>
          <button
            v-for="report in vm.reports"
            :key="report.id"
            :class="['sheet-row', { active: report.id === selectedReport.id }]"
            type="button"
            @click="selectReport(report.id)"
          >
            <span>{{ report.date }}</span>
            <strong>{{ report.moduleName }}</strong>
            <b>{{ report.totalScore }}分</b>
            <em>{{ report.id === selectedReport.id ? "当前查看" : statusText(report.status) }}</em>
          </button>
        </section>
      </div>

      <div v-if="toast" class="toast">{{ toast }}</div>
    </template>
  </main>
</template>
