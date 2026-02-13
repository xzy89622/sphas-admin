<!-- src/views/Dashboard.vue -->
<template>
  <div>
    <!-- 统计卡片（可点击跳转） -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" @click="go('/notice')">
          <div class="card-title">公告总数</div>
          <div class="card-value">{{ stats.noticeTotal }}</div>
          <div class="card-hint">点击进入公告管理</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" @click="go('/feedback')">
          <div class="card-title">反馈总数</div>
          <div class="card-value">{{ stats.feedbackTotal }}</div>
          <div class="card-hint">点击进入反馈管理</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" @click="go('/question-bank')">
          <div class="card-title">题库总数</div>
          <div class="card-value">{{ stats.questionTotal }}</div>
          <div class="card-hint">点击进入题库管理</div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" @click="go('/bmi-standards')">
          <div class="card-title">BMI 标准数</div>
          <div class="card-value">{{ stats.bmiTotal }}</div>
          <div class="card-hint">点击进入 BMI 标准</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近数据：公告 + 反馈 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <div>最近公告（最新 5 条）</div>
              <el-button size="small" @click="loadAll">刷新</el-button>
            </div>
          </template>

          <el-table :data="recentNotices" border v-loading="loading" @row-click="go('/notice')">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.status === 1" type="success">已发布</el-tag>
                <el-tag v-else type="info">已下线</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="180" />
          </el-table>

          <div class="table-hint">提示：点击任意一行可跳转到公告管理</div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <div>最近反馈（最新 5 条）</div>
              <el-button size="small" @click="loadAll">刷新</el-button>
            </div>
          </template>

          <el-table :data="recentFeedback" border v-loading="loading" @row-click="go('/feedback')">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'OPEN' ? 'warning' : 'success'">
                  {{ row.status === "OPEN" ? "待处理" : "已处理" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="180" />
          </el-table>

          <div class="table-hint">提示：点击任意一行可跳转到反馈管理</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <div>反馈趋势</div>
              <el-segmented v-model="trendDays" :options="trendOptions" size="small" />
            </div>
          </template>
          <div ref="chartFeedbackTrendRef" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>题库维度分布</template>
          <div ref="chartQuestionDimRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>BMI 等级分布</template>
          <div ref="chartBmiLevelRef" class="chart chart-wide"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card style="margin-top: 20px">
      <template #header>快捷入口</template>
      <div class="quick-actions">
        <el-button type="primary" @click="go('/notice')">发布公告</el-button>
        <el-button @click="go('/feedback')">处理反馈</el-button>
        <el-button @click="go('/question-bank')">维护题库</el-button>
        <el-button @click="go('/admin-users')">创建管理员</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";

import { noticeAdminPage } from "../api/notice";
import { feedbackAdminList } from "../api/feedback";
import { qbAdminPage } from "../api/questionBank";
import { bmiAdminPage } from "../api/bmiStandard";

const router = useRouter();
const go = (path) => router.push(path);

const loading = ref(false);

// ✅ 统计
const stats = reactive({
  noticeTotal: 0,
  feedbackTotal: 0,
  questionTotal: 0,
  bmiTotal: 0,
});

// ✅ 最近数据
const recentNotices = ref([]);
const recentFeedback = ref([]);
const feedbackCache = ref([]);

// ✅ 7/30 天切换
const trendOptions = [
  { label: "7 天", value: 7 },
  { label: "30 天", value: 30 },
];
const trendDays = ref(7);

// 图表 DOM 引用
const chartFeedbackTrendRef = ref(null);
const chartQuestionDimRef = ref(null);
const chartBmiLevelRef = ref(null);

// 图表实例
let chartFeedbackTrend = null;
let chartQuestionDim = null;
let chartBmiLevel = null;

// 兼容后端返回格式：有的接口返回 Page，有的返回 List
function extractTotalAndList(resp) {
  if (Array.isArray(resp)) return { total: resp.length, list: resp };
  const obj = resp?.data && typeof resp.data === "object" ? resp.data : resp;
  const total = Number(obj?.total ?? obj?.count ?? 0) || 0;
  const list = obj?.records ?? obj?.list ?? obj?.rows ?? obj?.items ?? [];
  return { total, list: Array.isArray(list) ? list : [] };
}

// 反馈趋势（按 createTime 统计）
function calcFeedbackTrend(list, daysCount) {
  const toYmd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const today = new Date();
  const days = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(toYmd(d));
  }

  const counter = new Map();
  for (const ymd of days) counter.set(ymd, 0);

  for (const item of list || []) {
    const ct = item?.createTime;
    if (!ct) continue;
    const ymd = String(ct).slice(0, 10);
    if (counter.has(ymd)) counter.set(ymd, counter.get(ymd) + 1);
  }

  return {
    labels: days.map((x) => x.slice(5)), // MM-DD
    values: days.map((x) => counter.get(x) || 0),
  };
}

function ensureCharts() {
  if (chartFeedbackTrendRef.value && !chartFeedbackTrend) {
    chartFeedbackTrend = echarts.init(chartFeedbackTrendRef.value);
  }
  if (chartQuestionDimRef.value && !chartQuestionDim) {
    chartQuestionDim = echarts.init(chartQuestionDimRef.value);
  }
  if (chartBmiLevelRef.value && !chartBmiLevel) {
    chartBmiLevel = echarts.init(chartBmiLevelRef.value);
  }
}

function renderFeedbackTrend(labels, values, daysCount) {
  if (!chartFeedbackTrend) return;
  chartFeedbackTrend.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: labels },
    yAxis: { type: "value", minInterval: 1 },
    series: [{ name: `反馈数量（${daysCount}天）`, type: "line", smooth: true, data: values }],
  });
}

function renderQuestionDim(dims, totals) {
  if (!chartQuestionDim) return;
  chartQuestionDim.setOption({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: dims },
    yAxis: { type: "value", minInterval: 1 },
    series: [{ name: "题目数量", type: "bar", data: totals }],
  });
}

function renderBmiLevels(pieData) {
  if (!chartBmiLevel) return;
  chartBmiLevel.setOption({
    tooltip: { trigger: "item" },
    legend: { top: "5%", left: "center" },
    series: [
      {
        name: "BMI 等级",
        type: "pie",
        radius: ["35%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: true, formatter: "{b}: {c}" },
        data: pieData,
      },
    ],
  });
}

// 题库维度统计（用分页 total）
async function fetchQuestionDimStats() {
  const dims = ["SPORT", "DIET", "SLEEP", "STRESS"];
  const totals = [];
  for (const dim of dims) {
    const resp = await qbAdminPage({ pageNum: 1, pageSize: 1, dimension: dim });
    const data = extractTotalAndList(resp);
    totals.push(data.total || data.list.length);
  }
  return { dims, totals };
}

// BMI 等级统计（取 1000 条按 level 聚合）
async function fetchBmiLevelStats() {
  const resp = await bmiAdminPage({ pageNum: 1, pageSize: 1000 });
  const data = extractTotalAndList(resp);
  const list = data.list || [];

  const map = new Map();
  for (const item of list) {
    const level = item?.level || "未分类";
    map.set(level, (map.get(level) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

const loadAll = async () => {
  loading.value = true;
  try {
    // ✅ 公告：拿总数 + 最近 5 条
    const noticeResp = await noticeAdminPage({ pageNum: 1, pageSize: 5 });
    const noticeData = extractTotalAndList(noticeResp);
    stats.noticeTotal = noticeData.total || noticeData.list.length;
    recentNotices.value = (noticeData.list || []).slice(0, 5);

    // ✅ 反馈：接口是 list（非分页），用长度当总数
    const feedbackResp = await feedbackAdminList();
    const feedbackData = extractTotalAndList(feedbackResp);
    stats.feedbackTotal = feedbackData.total || feedbackData.list.length;

    feedbackCache.value = feedbackData.list || [];
    recentFeedback.value = feedbackCache.value.slice(0, 5);

    // ✅ 题库：分页 total
    const qbResp = await qbAdminPage({ pageNum: 1, pageSize: 1 });
    const qbData = extractTotalAndList(qbResp);
    stats.questionTotal = qbData.total || qbData.list.length;

    // ✅ BMI：分页 total
    const bmiResp = await bmiAdminPage({ pageNum: 1, pageSize: 1 });
    const bmiData = extractTotalAndList(bmiResp);
    stats.bmiTotal = bmiData.total || bmiData.list.length;

    // ✅ 图表
    const trend = calcFeedbackTrend(feedbackCache.value, trendDays.value);
    const dimStats = await fetchQuestionDimStats();
    const bmiPie = await fetchBmiLevelStats();

    await nextTick();
    ensureCharts();

    renderFeedbackTrend(trend.labels, trend.values, trendDays.value);
    renderQuestionDim(dimStats.dims, dimStats.totals);
    renderBmiLevels(bmiPie);

    setTimeout(() => {
      chartFeedbackTrend?.resize();
      chartQuestionDim?.resize();
      chartBmiLevel?.resize();
    }, 0);
  } catch (e) {
    ElMessage.error(e?.message || "加载看板失败");
  } finally {
    loading.value = false;
  }
};

watch(trendDays, (newVal) => {
  if (!chartFeedbackTrend) return;
  const trend = calcFeedbackTrend(feedbackCache.value || [], newVal);
  renderFeedbackTrend(trend.labels, trend.values, newVal);
  setTimeout(() => chartFeedbackTrend?.resize(), 0);
});

function handleResize() {
  chartFeedbackTrend?.resize();
  chartQuestionDim?.resize();
  chartBmiLevel?.resize();
}

onMounted(() => {
  loadAll();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  chartFeedbackTrend?.dispose();
  chartQuestionDim?.dispose();
  chartBmiLevel?.dispose();
  chartFeedbackTrend = null;
  chartQuestionDim = null;
  chartBmiLevel = null;
});
</script>

<style scoped>
.card-title {
  font-size: 14px;
  color: #888;
}
.card-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 10px;
}
.stat-card {
  cursor: pointer;
  user-select: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
.card-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
.chart {
  width: 100%;
  height: 360px;
}
.chart-wide {
  height: 420px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
