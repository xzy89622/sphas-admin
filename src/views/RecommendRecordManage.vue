<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">推荐记录查看</div>
          <div class="desc">查看系统历史推荐记录，追踪推荐依据、推荐方案和推荐时间</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称 / 方案名 / 推荐理由"
        clearable
        style="width: 260px"
      />

      <el-select
        v-model="query.bmiLevel"
        placeholder="BMI等级"
        clearable
        filterable
        allow-create
        default-first-option
        style="width: 180px"
      >
        <el-option label="偏瘦" value="偏瘦" />
        <el-option label="正常" value="正常" />
        <el-option label="超重" value="超重" />
        <el-option label="肥胖" value="肥胖" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="记录ID" width="90" />

      <el-table-column label="用户信息" min-width="180">
        <template #default="{ row }">
          <div>{{ row.nickname || "-" }}</div>
          <div class="sub-text">{{ row.username || "-" }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="bmi" label="BMI" width="90" />
      <el-table-column prop="bmiLevel" label="BMI等级" width="110">
        <template #default="{ row }">
          <el-tag>{{ row.bmiLevel || "-" }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="dietPlanName" label="饮食方案" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.dietPlanName || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="sportPlanName" label="运动方案" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.sportPlanName || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="reason" label="推荐理由" min-width="280" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.reason || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="推荐时间" width="180" />

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showScores(row)">评分详情</el-button>
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
    v-model="scoreDialogVisible"
    title="评分详情"
    width="620px"
    :close-on-click-modal="false"
  >
    <div v-if="currentRow" class="dialog-top">
      <div>用户：{{ currentRow.nickname || "-" }}（{{ currentRow.username || "-" }}）</div>
      <div>BMI：{{ currentRow.bmi || "-" }} / {{ currentRow.bmiLevel || "-" }}</div>
      <div>推荐时间：{{ currentRow.createTime || "-" }}</div>
    </div>

    <el-input
      v-model="scoreJsonText"
      type="textarea"
      :rows="12"
      readonly
    />
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { usePage } from "../hooks/usePage";
import { recommendAdminPage } from "../api/recommendAdmin";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  bmiLevel: "",
});

const scoreDialogVisible = ref(false);
const currentRow = ref(null);
const scoreJsonText = ref("");

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await recommendAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      bmiLevel: query.bmiLevel || undefined,
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
  query.keyword = "";
  query.bmiLevel = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
}

function showScores(row) {
  currentRow.value = row;

  let pretty = "";
  try {
    pretty = row.scoresJson ? JSON.stringify(JSON.parse(row.scoresJson), null, 2) : "{}";
  } catch (e) {
    pretty = row.scoresJson || "{}";
  }

  scoreJsonText.value = pretty;
  scoreDialogVisible.value = true;
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

.sub-text {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.dialog-top {
  margin-bottom: 14px;
  color: #374151;
  line-height: 1.8;
}
</style>