<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">周报 / 月报管理</div>
          <div class="desc">生成并查看系统周报、月报，重点展示异常指标和改善建议</div>
        </div>

        <div class="actions">
          <el-button type="primary" :loading="generateWeekLoading" @click="generateWeek">
            生成周报
          </el-button>
          <el-button type="success" :loading="generateMonthLoading" @click="generateMonth">
            生成月报
          </el-button>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-select v-model="query.reportType" placeholder="报告类型" clearable style="width: 160px">
        <el-option label="周报" value="WEEK" />
        <el-option label="月报" value="MONTH" />
      </el-select>

      <el-input
        v-model="query.keyword"
        placeholder="标题 / 总结关键字"
        clearable
        style="width: 240px"
      />

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="ID" width="80" />

      <el-table-column prop="reportType" label="类型" width="100">
        <template #default="{ row }">
          <el-tag>{{ row.reportType === 'MONTH' ? '月报' : '周报' }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="报告标题" min-width="260" show-overflow-tooltip />

      <el-table-column label="统计区间" width="220">
        <template #default="{ row }">
          {{ row.weekStart || "-" }} ~ {{ row.weekEnd || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="recordCount" label="记录数" width="90" />
      <el-table-column prop="userCount" label="用户数" width="90" />

      <el-table-column prop="avgWeight" label="平均体重" width="100">
        <template #default="{ row }">
          {{ row.avgWeight == null ? "-" : row.avgWeight + "kg" }}
        </template>
      </el-table-column>

      <el-table-column prop="avgSteps" label="平均步数" width="100">
        <template #default="{ row }">
          {{ row.avgSteps == null ? "-" : row.avgSteps }}
        </template>
      </el-table-column>

      <el-table-column prop="avgSleepHours" label="平均睡眠" width="100">
        <template #default="{ row }">
          {{ row.avgSleepHours == null ? "-" : row.avgSleepHours + "h" }}
        </template>
      </el-table-column>

      <el-table-column prop="weightTrend" label="体重趋势" width="100" />
      <el-table-column prop="bpRiskCount" label="风险条数" width="100" />

      <el-table-column prop="summary" label="总结" min-width="260" show-overflow-tooltip />
      <el-table-column prop="updatedAt" label="生成时间" width="180" />

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50]"
        @current-change="fetchList"
        @size-change="onSizeChange"
      />
    </div>
  </el-card>

  <el-dialog
    v-model="detailDialogVisible"
    title="报告详情"
    width="860px"
    :close-on-click-modal="false"
  >
    <div v-if="currentRow" class="detail-wrap">
      <div class="detail-item"><span class="label">标题：</span>{{ currentRow.title || "-" }}</div>
      <div class="detail-item"><span class="label">类型：</span>{{ currentRow.reportType === 'MONTH' ? '月报' : '周报' }}</div>
      <div class="detail-item"><span class="label">统计区间：</span>{{ currentRow.weekStart || "-" }} ~ {{ currentRow.weekEnd || "-" }}</div>
      <div class="detail-item"><span class="label">总结：</span>{{ currentRow.summary || "-" }}</div>

      <div class="block">
        <div class="block-title">风险提示</div>
        <div v-if="riskTips.length === 0" class="empty-text">暂无风险提示</div>
        <div v-for="(item, index) in riskTips" :key="'r-' + index" class="tip-item">
          {{ index + 1 }}. {{ item }}
        </div>
      </div>

      <div class="block">
        <div class="block-title">改善建议</div>
        <div v-if="suggestions.length === 0" class="empty-text">暂无建议</div>
        <div v-for="(item, index) in suggestions" :key="'s-' + index" class="tip-item">
          {{ index + 1 }}. {{ item }}
        </div>
      </div>

      <div class="block">
        <div class="block-title">指标明细 JSON</div>
        <el-input v-model="metricsJsonText" type="textarea" :rows="10" readonly />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { usePage } from "../hooks/usePage";
import { reportAdminPage, reportAdminGenerate } from "../api/reportAdmin";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const generateWeekLoading = ref(false);
const generateMonthLoading = ref(false);

const detailDialogVisible = ref(false);
const currentRow = ref(null);
const metricsJsonText = ref("");

const query = reactive({
  reportType: "",
  keyword: "",
});

const riskTips = computed(() => {
  const value = currentRow.value?.riskTips;
  return Array.isArray(value) ? value : [];
});

const suggestions = computed(() => {
  const value = currentRow.value?.suggestions;
  return Array.isArray(value) ? value : [];
});

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await reportAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      reportType: query.reportType || undefined,
      keyword: query.keyword || undefined,
    });

    list.value = pageData?.records || [];
    page.total = pageData?.total || 0;
  } finally {
    tableLoading.value = false;
  }
}

function onSearch() {
  resetToFirstPage();
  fetchList();
}

function onReset() {
  query.reportType = "";
  query.keyword = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
}

async function generateWeek() {
  generateWeekLoading.value = true;
  try {
    await reportAdminGenerate({ reportType: "WEEK" });
    ElMessage.success("周报生成成功");
    fetchList();
  } finally {
    generateWeekLoading.value = false;
  }
}

async function generateMonth() {
  generateMonthLoading.value = true;
  try {
    await reportAdminGenerate({ reportType: "MONTH" });
    ElMessage.success("月报生成成功");
    fetchList();
  } finally {
    generateMonthLoading.value = false;
  }
}

function showDetail(row) {
  currentRow.value = row;

  let pretty = "";
  try {
    pretty = row.metricsJson ? JSON.stringify(JSON.parse(row.metricsJson), null, 2) : "{}";
  } catch (e) {
    pretty = row.metricsJson || "{}";
  }

  metricsJsonText.value = pretty;
  detailDialogVisible.value = true;
}

onMounted(fetchList);
</script>

<style scoped>
.page-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-wrap .title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.title-wrap .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-wrap {
  color: #374151;
}

.detail-item {
  margin-bottom: 10px;
  line-height: 1.8;
}

.label {
  font-weight: 600;
  color: #111827;
}

.block {
  margin-top: 16px;
}

.block-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #111827;
}

.tip-item {
  margin-bottom: 6px;
  line-height: 1.7;
}

.empty-text {
  color: #6b7280;
}
</style>