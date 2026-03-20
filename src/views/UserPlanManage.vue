<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">执行计划查看</div>
          <div class="desc">查看用户采纳的饮食 / 运动计划，以及每日打卡情况</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称 / 方案名"
        clearable
        style="width: 240px"
      />

      <el-select v-model="query.status" placeholder="计划状态" clearable style="width: 160px">
        <el-option label="执行中" value="ACTIVE" />
        <el-option label="已完成" value="DONE" />
        <el-option label="已停止" value="STOPPED" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="计划ID" width="90" />

      <el-table-column label="用户信息" min-width="180">
        <template #default="{ row }">
          <div>{{ row.nickname || "-" }}</div>
          <div class="sub-text">{{ row.username || "-" }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="dietPlanName" label="饮食方案" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.dietPlanName || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="sportPlanName" label="运动方案" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.sportPlanName || "-" }}
        </template>
      </el-table-column>

      <el-table-column label="执行周期" width="220">
        <template #default="{ row }">
          {{ row.startDate || "-" }} ~ {{ row.endDate || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="checkinCount" label="打卡天数" width="100" />
      <el-table-column prop="totalDays" label="计划天数" width="100" />

      <el-table-column label="完成率" width="110">
        <template #default="{ row }">
          {{ row.completionRate }}%
        </template>
      </el-table-column>

      <el-table-column label="今日打卡" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.todayChecked === 1" type="success">已打卡</el-tag>
          <el-tag v-else type="info">未打卡</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="lastCheckinDate" label="最近打卡" width="120" />

      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openCheckins(row)">打卡明细</el-button>
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
    v-model="checkinDialogVisible"
    title="打卡明细"
    width="860px"
    :close-on-click-modal="false"
  >
    <div class="dialog-top" v-if="currentRow">
      <div>用户：{{ currentRow.nickname || "-" }}（{{ currentRow.username || "-" }}）</div>
      <div>计划：{{ currentRow.dietPlanName || "-" }} / {{ currentRow.sportPlanName || "-" }}</div>
    </div>

    <el-table :data="checkinList" border v-loading="checkinLoading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="checkinDate" label="打卡日期" width="140" />

      <el-table-column label="饮食完成" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.dietDone === 1" type="success">已完成</el-tag>
          <el-tag v-else type="info">未完成</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="运动完成" width="110">
        <template #default="{ row }">
          <el-tag v-if="row.sportDone === 1" type="success">已完成</el-tag>
          <el-tag v-else type="info">未完成</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.remark || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="checkinPage.pageNum"
        v-model:page-size="checkinPage.pageSize"
        :total="checkinPage.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[5, 10, 20]"
        @current-change="fetchCheckins"
        @size-change="onCheckinSizeChange"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { usePage } from "../hooks/usePage";
import { userPlanAdminPage, userPlanCheckinPage } from "../api/userPlanAdmin";

const { page, resetToFirstPage } = usePage(10);
const { page: checkinPage, resetToFirstPage: resetCheckinToFirstPage } = usePage(5);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  status: "",
});

const checkinDialogVisible = ref(false);
const checkinLoading = ref(false);
const checkinList = ref([]);
const currentRow = ref(null);

function statusText(v) {
  const map = {
    ACTIVE: "执行中",
    DONE: "已完成",
    STOPPED: "已停止",
  };
  return map[v] || v || "-";
}

function statusType(v) {
  const map = {
    ACTIVE: "primary",
    DONE: "success",
    STOPPED: "info",
  };
  return map[v] || "";
}

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await userPlanAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      status: query.status || undefined,
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
  query.status = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
}

async function fetchCheckins() {
  if (!currentRow.value?.id) return;

  checkinLoading.value = true;
  try {
    const pageData = await userPlanCheckinPage({
      userPlanId: currentRow.value.id,
      pageNum: checkinPage.pageNum,
      pageSize: checkinPage.pageSize,
    });

    checkinList.value = pageData?.records || [];
    checkinPage.total = pageData?.total || 0;
  } finally {
    checkinLoading.value = false;
  }
}

function onCheckinSizeChange() {
  resetCheckinToFirstPage();
  fetchCheckins();
}

function openCheckins(row) {
  currentRow.value = row;
  checkinDialogVisible.value = true;
  resetCheckinToFirstPage();
  fetchCheckins();
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