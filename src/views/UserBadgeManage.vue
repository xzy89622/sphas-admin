<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">用户勋章查看</div>
          <div class="desc">查看勋章发放记录，支持按用户和勋章筛选</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称 / 勋章编码 / 勋章名称"
        clearable
        style="width: 280px"
      />

      <el-select v-model="query.badgeCode" placeholder="勋章编码" clearable style="width: 180px">
        <el-option label="FIRST_CHALLENGE" value="FIRST_CHALLENGE" />
        <el-option label="POINTS_50" value="POINTS_50" />
        <el-option label="POST_3" value="POST_3" />
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

      <el-table-column prop="badgeCode" label="勋章编码" width="160" />
      <el-table-column prop="badgeName" label="勋章名称" width="140" />
      <el-table-column prop="badgeDescription" label="勋章描述" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.badgeDescription || "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="获得时间" width="180" />
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
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { usePage } from "../hooks/usePage";
import { userBadgeAdminPage } from "../api/badge";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  badgeCode: "",
});

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await userBadgeAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      badgeCode: query.badgeCode || undefined,
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
  query.badgeCode = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
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
</style>