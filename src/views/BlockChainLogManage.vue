<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">区块链日志查看</div>
          <div class="desc">查看敏感数据的链式日志，展示业务类型、数据指纹、前后区块哈希</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 昵称 / 业务ID / 操作"
        clearable
        style="width: 240px"
      />

      <el-select v-model="query.bizType" placeholder="业务类型" clearable style="width: 160px">
        <el-option label="风险预警" value="RISK_ALERT" />
        <el-option label="健康指标" value="METRIC" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="日志ID" width="90" />

      <el-table-column label="用户信息" min-width="180">
        <template #default="{ row }">
          <div>{{ row.nickname || "-" }}</div>
          <div class="sub-text">{{ row.username || "-" }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="bizType" label="业务类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ bizTypeText(row.bizType) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="bizId" label="业务ID" width="100" />
      <el-table-column prop="action" label="操作" width="100" />

      <el-table-column prop="dataHash" label="数据指纹" min-width="240" show-overflow-tooltip />
      <el-table-column prop="prevHash" label="前区块Hash" min-width="240" show-overflow-tooltip />
      <el-table-column prop="blockHash" label="当前区块Hash" min-width="240" show-overflow-tooltip />

      <el-table-column prop="createTime" label="创建时间" width="180" />

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
    title="区块链日志详情"
    width="760px"
    :close-on-click-modal="false"
  >
    <div v-if="currentRow" class="detail-wrap">
      <div class="detail-item"><span class="label">用户：</span>{{ currentRow.nickname || "-" }}（{{ currentRow.username || "-" }}）</div>
      <div class="detail-item"><span class="label">业务类型：</span>{{ bizTypeText(currentRow.bizType) }}</div>
      <div class="detail-item"><span class="label">业务ID：</span>{{ currentRow.bizId || "-" }}</div>
      <div class="detail-item"><span class="label">操作：</span>{{ currentRow.action || "-" }}</div>
      <div class="detail-item"><span class="label">创建时间：</span>{{ currentRow.createTime || "-" }}</div>

      <div class="hash-block">
        <div class="hash-title">数据指纹</div>
        <el-input :model-value="currentRow.dataHash || ''" type="textarea" :rows="3" readonly />
      </div>

      <div class="hash-block">
        <div class="hash-title">前区块 Hash</div>
        <el-input :model-value="currentRow.prevHash || ''" type="textarea" :rows="3" readonly />
      </div>

      <div class="hash-block">
        <div class="hash-title">当前区块 Hash</div>
        <el-input :model-value="currentRow.blockHash || ''" type="textarea" :rows="3" readonly />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { usePage } from "../hooks/usePage";
import { blockChainLogAdminPage } from "../api/blockChainLog";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  bizType: "",
});

const detailDialogVisible = ref(false);
const currentRow = ref(null);

function bizTypeText(v) {
  const map = {
    RISK_ALERT: "风险预警",
    METRIC: "健康指标",
  };
  return map[v] || v || "-";
}

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await blockChainLogAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      bizType: query.bizType || undefined,
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
  query.bizType = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
}

function showDetail(row) {
  currentRow.value = row;
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

.sub-text {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
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

.hash-block {
  margin-top: 14px;
}

.hash-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #111827;
}
</style>