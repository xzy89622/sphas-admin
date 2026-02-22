<template>
  <div class="page">
    <div class="container">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="left">
          <div class="title">数据看板</div>
          <div class="sub">全站统计 + 用户健康趋势（ECharts）</div>
        </div>

        <div class="right">
          <el-input v-model="userId" class="uid" clearable>
            <template #prepend>userId</template>
          </el-input>

          <el-segmented v-model="days" :options="dayOptions" />

          <el-button type="primary" @click="loadAll">刷新</el-button>
        </div>
      </div>

      <!-- 全站概览 -->
      <div class="section">
        <div class="section-head">
          <div class="section-title">全站概览</div>
          <div class="hint">说明：用于展示系统规模与运行情况（公告/题库/社区/挑战/预警/积分流水）</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="k">用户数</div>
            <div class="v">{{ fmt(stats?.userTotal) }}</div>
            <div class="d">普通用户</div>
          </div>

          <div class="stat-card">
            <div class="k">管理员</div>
            <div class="v">{{ fmt(stats?.adminTotal) }}</div>
            <div class="d">后台账号</div>
          </div>

          <div class="stat-card">
            <div class="k">公告数</div>
            <div class="v">{{ fmt(stats?.noticeTotal) }}</div>
            <div class="d">Notice</div>
          </div>

          <div class="stat-card">
            <div class="k">健康科普</div>
            <div class="v">{{ fmt(stats?.articleTotal) }}</div>
            <div class="d">Health Article</div>
          </div>

          <div class="stat-card">
            <div class="k">反馈数</div>
            <div class="v">{{ fmt(stats?.feedbackTotal) }}</div>
            <div class="d">Feedback</div>
          </div>

          <div class="stat-card">
            <div class="k">题库题目</div>
            <div class="v">{{ fmt(stats?.questionTotal) }}</div>
            <div class="d">Question Bank</div>
          </div>

          <div class="stat-card">
            <div class="k">挑战数</div>
            <div class="v">{{ fmt(stats?.challengeTotal) }}</div>
            <div class="d">Challenge</div>
          </div>

          <div class="stat-card">
            <div class="k">社区帖子</div>
            <div class="v">{{ fmt(stats?.postTotal) }}</div>
            <div class="d">Social Post</div>
          </div>

          <div class="stat-card">
            <div class="k">积分流水</div>
            <div class="v">{{ fmt(stats?.pointRecordTotal) }}</div>
            <div class="d">Points Record</div>
          </div>

          <div class="stat-card">
            <div class="k">风险预警</div>
            <div class="v">{{ fmt(stats?.riskAlertTotal) }}</div>
            <div class="d">Risk Alert</div>
          </div>
        </div>

        <div class="chart-grid">
          <div class="panel">
            <div class="panel-title">内容总量对比（柱状图）</div>
            <div ref="chartBar" class="chart h320"></div>
          </div>

          <div class="panel">
            <div class="panel-title">社区审核状态（环形图）</div>
            <div ref="chartPie" class="chart h320"></div>
          </div>
        </div>
      </div>

      <!-- 用户趋势 -->
      <div class="section">
        <div class="section-head">
          <div class="section-title">用户健康趋势</div>
          <div class="hint">按 userId 查看：体重/BMI/步数/睡眠/血压/血糖</div>
        </div>

        <el-empty v-if="overview && overview.hasData === false" :description="overview.msg || '暂无数据'" />

        <div v-else class="chart-grid">
          <div class="panel">
            <div class="panel-title">体重 / BMI</div>
            <div ref="chartWb" class="chart h280"></div>
          </div>

          <div class="panel">
            <div class="panel-title">步数 / 睡眠</div>
            <div ref="chartStepSleep" class="chart h280"></div>
          </div>

          <div class="panel">
            <div class="panel-title">血压（收缩压/舒张压）</div>
            <div ref="chartBp" class="chart h280"></div>
          </div>

          <div class="panel">
            <div class="panel-title">血糖</div>
            <div ref="chartSugar" class="chart h280"></div>
          </div>
        </div>

        <div class="footer-note">
          <span>更新时间：{{ updatedAt }}</span>
          <span class="dot">•</span>
          <span>提示：没有数据时，请先用小程序/用户端录入体质数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { ElMessage } from "element-plus";

import {
  fetchAdminDashboardOverview,
  fetchAdminDashboardTrend,
  fetchAdminStatsSummary,
} from "../api/dashboard";

const stats = ref(null);
const overview = ref(null);
const trend = ref([]);
const updatedAt = ref("-");

const userId = ref("1");
const days = ref(30);
const dayOptions = [
  { label: "近7天", value: 7 },
  { label: "近30天", value: 30 },
  { label: "近90天", value: 90 },
];

const chartBar = ref(null);
const chartPie = ref(null);
const chartWb = ref(null);
const chartStepSleep = ref(null);
const chartBp = ref(null);
const chartSugar = ref(null);

let insBar = null;
let insPie = null;
let insWb = null;
let insStepSleep = null;
let insBp = null;
let insSugar = null;

function fmt(v) {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

// ✅ 压缩时间显示，避免X轴太长
function shortTime(t) {
  if (!t) return "";
  // 例：2026-01-29 10:00 -> 01-29 10:00
  if (t.length >= 16) return t.slice(5, 16);
  return t;
}

function buildX(list) {
  return list.map((x) => shortTime(x.time));
}

function buildSeries(list, key) {
  return list.map((x) => (x[key] === null || x[key] === undefined ? null : x[key]));
}

function renderStatsCharts() {
  // 柱状图
  insBar && insBar.dispose();
  insBar = echarts.init(chartBar.value);

  const barLabels = ["公告", "科普", "反馈", "题库", "挑战", "帖子"];
  const barValues = [
    stats.value?.noticeTotal || 0,
    stats.value?.articleTotal || 0,
    stats.value?.feedbackTotal || 0,
    stats.value?.questionTotal || 0,
    stats.value?.challengeTotal || 0,
    stats.value?.postTotal || 0,
  ];

  insBar.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 18, top: 24, bottom: 35 },
    xAxis: { type: "category", data: barLabels },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: barValues,
        label: { show: true, position: "top" },
      },
    ],
  });

  // 环形图（状态）
  insPie && insPie.dispose();
  insPie = echarts.init(chartPie.value);

  const ps = stats.value?.postStatus || {};
  const pieData = [
    { name: "通过", value: ps.approved || 0 },
    { name: "待审", value: ps.pending || 0 },
    { name: "驳回", value: ps.rejected || 0 },
    { name: "隐藏", value: ps.hidden || 0 },
  ];

  insPie.setOption({
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", right: 10, top: "middle" },
    series: [
      {
        type: "pie",
        radius: ["42%", "72%"],
        center: ["42%", "50%"],
        data: pieData,
        label: { formatter: "{b}\n{c}" },
      },
    ],
  });
}

function renderTrendCharts() {
  const x = buildX(trend.value);

  const common = {
    tooltip: { trigger: "axis" },
    grid: { left: 46, right: 18, top: 30, bottom: 52 },
    xAxis: {
      type: "category",
      data: x,
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: "value" },
  };

  // 体重/BMI
  insWb && insWb.dispose();
  insWb = echarts.init(chartWb.value);
  insWb.setOption({
    ...common,
    legend: { data: ["体重", "BMI"] },
    series: [
      { name: "体重", type: "line", data: buildSeries(trend.value, "weightKg"), connectNulls: true, smooth: true },
      { name: "BMI", type: "line", data: buildSeries(trend.value, "bmi"), connectNulls: true, smooth: true },
    ],
  });

  // 步数/睡眠
  insStepSleep && insStepSleep.dispose();
  insStepSleep = echarts.init(chartStepSleep.value);
  insStepSleep.setOption({
    ...common,
    legend: { data: ["步数", "睡眠"] },
    series: [
      { name: "步数", type: "line", data: buildSeries(trend.value, "steps"), connectNulls: true, smooth: true },
      { name: "睡眠", type: "line", data: buildSeries(trend.value, "sleepHours"), connectNulls: true, smooth: true },
    ],
  });

  // 血压
  insBp && insBp.dispose();
  insBp = echarts.init(chartBp.value);
  insBp.setOption({
    ...common,
    legend: { data: ["收缩压", "舒张压"] },
    series: [
      { name: "收缩压", type: "line", data: buildSeries(trend.value, "systolic"), connectNulls: true, smooth: true },
      { name: "舒张压", type: "line", data: buildSeries(trend.value, "diastolic"), connectNulls: true, smooth: true },
    ],
  });

  // 血糖
  insSugar && insSugar.dispose();
  insSugar = echarts.init(chartSugar.value);
  insSugar.setOption({
    ...common,
    legend: { data: ["血糖"] },
    series: [
      { name: "血糖", type: "line", data: buildSeries(trend.value, "bloodSugar"), connectNulls: true, smooth: true },
    ],
  });
}

function onResize() {
  try {
    insBar && insBar.resize();
    insPie && insPie.resize();
    insWb && insWb.resize();
    insStepSleep && insStepSleep.resize();
    insBp && insBp.resize();
    insSugar && insSugar.resize();
  } catch (e) {}
}

async function loadAll() {
  try {
    stats.value = await fetchAdminStatsSummary();

    const uid = Number(userId.value);
    if (!uid) {
      ElMessage.warning("请输入有效的 userId");
      return;
    }

    overview.value = await fetchAdminDashboardOverview(uid);
    trend.value = await fetchAdminDashboardTrend(uid, days.value);

    updatedAt.value = new Date().toLocaleString();

    await nextTick();
    renderStatsCharts();

    if (!(overview.value && overview.value.hasData === false)) {
      renderTrendCharts();
    }

    window.addEventListener("resize", onResize);
  } catch (e) {
    ElMessage.error("加载失败：请检查后端是否启动、管理员token是否有效");
  }
}

onMounted(loadAll);

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  insBar && insBar.dispose();
  insPie && insPie.dispose();
  insWb && insWb.dispose();
  insStepSleep && insStepSleep.dispose();
  insBp && insBp.dispose();
  insSugar && insSugar.dispose();
});
</script>

<style scoped>
.page {
  background: #f6f7fb;
  min-height: 100vh;
  padding: 14px 0;
}

/* ✅ 居中容器，解决你截图里“太空”的问题 */
.container {
  width: min(1280px, calc(100% - 28px));
  margin: 0 auto;
}

/* 顶部工具栏 */
.toolbar {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.left .title {
  font-size: 16px;
  font-weight: 800;
}

.left .sub {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.uid {
  width: 190px;
}

/* 分区 */
.section {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.section-title {
  font-weight: 800;
}

.hint {
  font-size: 12px;
  color: #888;
}

/* 概览卡片：更紧凑更统一 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 12px;
  height: 92px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.k {
  font-size: 12px;
  color: #666;
}

.v {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
}

.d {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}

/* 图表网格：卡片统一样式 */
.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 12px;
}

.panel-title {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 8px;
}

.chart {
  width: 100%;
}

.h320 { height: 320px; }
.h280 { height: 280px; }

.footer-note {
  margin-top: 10px;
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  opacity: 0.6;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .chart-grid { grid-template-columns: 1fr; }
}
</style>