<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">积分流水查看</div>
          <div class="desc">查看用户积分变动记录，支持按用户、类型、备注筛选</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称 / 备注 / 业务ID"
        clearable
        style="width: 260px"
      />

      <el-select v-model="query.type" placeholder="积分类型" clearable style="width: 180px">
        <el-option label="挑战完成" value="CHALLENGE_FINISH" />
        <el-option label="发帖" value="POST_CREATE" />
        <el-option label="评论" value="POST_COMMENT" />
        <el-option label="点赞" value="POST_LIKE" />
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

      <el-table-column prop="points" label="积分变动" width="100">
        <template #default="{ row }">
          <span class="point-text">+{{ row.points }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="type" label="类型" width="140">
        <template #default="{ row }">
          <el-tag>{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="bizId" label="业务ID" width="100" />

      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.remark || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />
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
import { pointRecordAdminPage } from "../api/pointRecord";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  type: "",
});

function typeText(v) {
  const map = {
    CHALLENGE_FINISH: "挑战完成",
    POST_CREATE: "发帖",
    POST_COMMENT: "评论",
    POST_LIKE: "点赞",
  };
  return map[v] || v || "-";
}

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await pointRecordAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      type: query.type || undefined,
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
  query.type = "";
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

.point-text {
  font-weight: 700;
  color: #16a34a;
}
</style>