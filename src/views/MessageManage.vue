<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">消息提醒查看</div>
          <div class="desc">查看系统消息、风险预警、未登录提醒、审核通知、勋章通知</div>
        </div>

        <div class="actions">
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="用户名 / 标题 / 内容 / 业务ID"
        clearable
        style="width: 280px"
      />

      <el-select v-model="query.type" placeholder="消息类型" clearable style="width: 160px">
        <el-option label="风险预警" value="RISK" />
        <el-option label="未登录提醒" value="INACTIVE" />
        <el-option label="审核通知" value="AUDIT" />
        <el-option label="勋章通知" value="BADGE" />
        <el-option label="健康建议" value="ADVICE" />
      </el-select>

      <el-select v-model="query.isRead" placeholder="阅读状态" clearable style="width: 140px">
        <el-option :value="0" label="未读" />
        <el-option :value="1" label="已读" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="消息ID" width="90" />

      <el-table-column label="用户信息" min-width="180">
        <template #default="{ row }">
          <div>{{ row.nickname || "-" }}</div>
          <div class="sub-text">{{ row.username || "-" }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip />

      <el-table-column prop="bizId" label="业务ID" width="100">
        <template #default="{ row }">
          {{ row.bizId || "-" }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.isRead === 1" type="success">已读</el-tag>
          <el-tag v-else type="info">未读</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="readTime" label="阅读时间" width="180">
        <template #default="{ row }">
          {{ row.readTime || "-" }}
        </template>
      </el-table-column>

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
    title="消息详情"
    width="760px"
    :close-on-click-modal="false"
  >
    <div v-if="currentRow" class="detail-wrap">
      <div class="detail-item"><span class="label">用户：</span>{{ currentRow.nickname || "-" }}（{{ currentRow.username || "-" }}）</div>
      <div class="detail-item"><span class="label">类型：</span>{{ typeText(currentRow.type) }}</div>
      <div class="detail-item"><span class="label">标题：</span>{{ currentRow.title || "-" }}</div>
      <div class="detail-item"><span class="label">业务ID：</span>{{ currentRow.bizId || "-" }}</div>
      <div class="detail-item"><span class="label">创建时间：</span>{{ currentRow.createTime || "-" }}</div>
      <div class="detail-item"><span class="label">阅读时间：</span>{{ currentRow.readTime || "-" }}</div>

      <div class="content-block">
        <div class="content-title">消息内容</div>
        <el-input :model-value="currentRow.content || ''" type="textarea" :rows="8" readonly />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { usePage } from "../hooks/usePage";
import { messageAdminPage } from "../api/messageAdmin";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
  type: "",
  isRead: null,
});

const detailDialogVisible = ref(false);
const currentRow = ref(null);

function typeText(v) {
  const map = {
    RISK: "风险预警",
    INACTIVE: "未登录提醒",
    AUDIT: "审核通知",
    BADGE: "勋章通知",
    ADVICE: "健康建议",
  };
  return map[v] || v || "-";
}

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await messageAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      keyword: query.keyword || undefined,
      type: query.type || undefined,
      isRead: query.isRead ?? undefined,
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
  query.isRead = null;
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

.content-block {
  margin-top: 14px;
}

.content-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #111827;
}
</style>