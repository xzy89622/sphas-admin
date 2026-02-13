<!-- src/views/FeedbackManage.vue -->
<template>
  <el-card title="反馈管理" desc="查看用户反馈、管理员回复、一键标记已处理">
    <template #extra>
      <el-button @click="fetchList">刷新</el-button>
    </template>

    <!-- ✅ 筛选区 -->
    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索标题/内容"
        clearable
        style="width: 280px"
        @keyup.enter="applyFilter"
      />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 160px">
        <el-option label="待处理（OPEN）" value="OPEN" />
        <el-option label="已处理（CLOSED）" value="CLOSED" />
      </el-select>

      <el-button type="primary" @click="applyFilter">查询</el-button>
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- ✅ 表格 -->
    <el-table :data="pageRows" border v-loading="tableLoading" @row-dblclick="openDetail">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />

      <el-table-column label="内容摘要" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          {{ brief(row.content) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="140">
        <template #default="{ row }">
          <el-tag :type="row.status === 'OPEN' ? 'warning' : 'success'">
            {{ row.status === "OPEN" ? "待处理" : "已处理" }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />

      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openDetail(row)">查看</el-button>

          <el-button
            size="small"
            type="success"
            plain
            :disabled="row.status !== 'OPEN'"
            :loading="closingId === row.id"
            @click="closeFromList(row)"
          >
            标记已处理
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ✅ 前端分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="filteredRows.length"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50]"
        @current-change="noop"
        @size-change="onSizeChange"
      />
    </div>

    <!-- ✅ 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="反馈详情" size="620px">
      <template v-if="detail">
        <div class="d-title">{{ detail.feedback?.title }}</div>
        <div class="d-meta">
          用户ID：{{ detail.feedback?.userId }}
          <span class="sep">|</span>
          状态：
          <el-tag :type="detail.feedback?.status === 'OPEN' ? 'warning' : 'success'">
            {{ detail.feedback?.status === "OPEN" ? "待处理" : "已处理" }}
          </el-tag>
          <span class="sep">|</span>
          创建：{{ detail.feedback?.createTime }}
        </div>

        <!-- ✅ 顶部操作 -->
        <div class="top-actions">
          <el-button
            v-if="detail.feedback?.status === 'OPEN'"
            type="success"
            :loading="closeLoading"
            @click="closeFromDetail"
          >
            标记已处理
          </el-button>
          <el-button v-else disabled>已处理</el-button>
        </div>

        <el-divider />

        <div class="d-section-title">反馈内容</div>
        <div class="d-content">{{ detail.feedback?.content }}</div>

        <el-divider />

        <div class="d-section-title">附件</div>
        <div v-if="(detail.attachments || []).length === 0" class="empty">无</div>
        <div v-else class="attachments">
          <el-image
            v-for="a in detail.attachments"
            :key="a.id"
            :src="a.fileUrl"
            style="width:120px;height:120px;"
            fit="cover"
            :preview-src-list="previewList"
            :initial-index="0"
          />
        </div>

        <el-divider />

        <div class="d-section-title">回复记录</div>
        <div v-if="(detail.replies || []).length === 0" class="empty">暂无回复</div>
        <el-timeline v-else>
          <el-timeline-item v-for="r in detail.replies" :key="r.id" :timestamp="r.createTime">
            <div class="reply-item">
              <b>{{ r.senderRole }}</b>
              <span class="sub">（{{ r.senderId }}）</span>：
              <span>{{ r.content }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>

        <el-divider />

        <div class="d-section-title">管理员回复</div>
        <el-input v-model="replyContent" type="textarea" :rows="3" placeholder="请输入回复内容" />
        <div class="reply-actions">
          <el-button
            type="primary"
            :loading="replyLoading"
            :disabled="!replyContent.trim()"
            @click="sendReply"
          >
            发送回复
          </el-button>
        </div>
      </template>

      <template v-else>
        <div class="empty">请选择一条反馈查看</div>
      </template>
    </el-drawer>
  </el-card>
</template>

<script setup>
import { ref, computed, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import PageContainer from "../components/PageContainer.vue";
import { usePage } from "../hooks/usePage";

import {
  feedbackAdminList,
  feedbackAdminDetail,
  feedbackAdminReply,
  feedbackAdminClose,
} from "../api/feedback";

const list = ref([]);
const tableLoading = ref(false);

const drawerVisible = ref(false);
const detail = ref(null);

const replyContent = ref("");
const replyLoading = ref(false);

const closeLoading = ref(false);
const closingId = ref(null);

// ✅ 查询条件
const query = reactive({
  keyword: "",
  status: "", // OPEN/CLOSED/""
});

// ✅ 前端分页
const { page, resetToFirstPage } = usePage(10);

const previewList = computed(() => (detail.value?.attachments || []).map((x) => x.fileUrl));

function brief(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length > 60 ? t.slice(0, 60) + "..." : t;
}

// ✅ 过滤后的全量数据
const filteredRows = computed(() => {
  const kw = query.keyword.trim().toLowerCase();
  const st = query.status;

  return (list.value || []).filter((x) => {
    const hitStatus = st ? x.status === st : true;
    const text = `${x.title || ""} ${x.content || ""}`.toLowerCase();
    const hitKw = kw ? text.includes(kw) : true;
    return hitStatus && hitKw;
  });
});

// ✅ 当前页数据
const pageRows = computed(() => {
  const start = (page.pageNum - 1) * page.pageSize;
  const end = start + page.pageSize;
  return filteredRows.value.slice(start, end);
});

const fetchList = async () => {
  tableLoading.value = true;
  try {
    list.value = await feedbackAdminList();
    resetToFirstPage();
  } finally {
    tableLoading.value = false;
  }
};

const applyFilter = () => {
  resetToFirstPage();
};

const resetFilter = () => {
  query.keyword = "";
  query.status = "";
  resetToFirstPage();
};

const onSizeChange = () => {
  resetToFirstPage();
};

const noop = () => {};

// 打开详情
const openDetail = async (row) => {
  drawerVisible.value = true;
  replyContent.value = "";
  detail.value = null;
  detail.value = await feedbackAdminDetail(row.id);
};

// 回复
const sendReply = async () => {
  const id = detail.value?.feedback?.id;
  if (!id) return;

  replyLoading.value = true;
  try {
    await feedbackAdminReply(id, replyContent.value);
    ElMessage.success("回复成功");
    replyContent.value = "";
    detail.value = await feedbackAdminDetail(id);
    await fetchList();
  } finally {
    replyLoading.value = false;
  }
};

// ✅ 列表中关闭
const closeFromList = async (row) => {
  await ElMessageBox.confirm("确认将该反馈标记为已处理？", "提示", { type: "warning" });
  closingId.value = row.id;
  try {
    await feedbackAdminClose(row.id);
    ElMessage.success("已标记为已处理");
    await fetchList();

    // 如果抽屉打开且是同一条，也刷新抽屉
    if (detail.value?.feedback?.id === row.id) {
      detail.value = await feedbackAdminDetail(row.id);
    }
  } finally {
    closingId.value = null;
  }
};

// ✅ 详情中关闭
const closeFromDetail = async () => {
  const id = detail.value?.feedback?.id;
  if (!id) return;

  await ElMessageBox.confirm("确认将该反馈标记为已处理？", "提示", { type: "warning" });
  closeLoading.value = true;
  try {
    await feedbackAdminClose(id);
    ElMessage.success("已标记为已处理");
    detail.value = await feedbackAdminDetail(id);
    await fetchList();
  } finally {
    closeLoading.value = false;
  }
};

// 初始化加载
fetchList();
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.d-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}
.d-meta {
  font-size: 12px;
  color: #666;
}
.sep {
  margin: 0 8px;
  color: #bbb;
}
.top-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
.d-section-title {
  font-weight: 800;
  margin-bottom: 8px;
}
.d-content {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #333;
}
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.empty {
  color: #999;
  font-size: 13px;
}
.reply-item .sub {
  color: #999;
  font-weight: 400;
}
.reply-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
