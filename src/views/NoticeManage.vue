<template>
  <el-card title="公告管理" desc="发布系统公告，支持富文本内容（新增/编辑/预览/下线）">
    <template #extra>
      <el-button type="primary" @click="openAdd">新增公告</el-button>
      <el-button @click="fetchList">刷新</el-button>
    </template>

    <!-- ✅ 筛选区 -->
    <div class="filter-bar">
      <el-input
        v-model="query.title"
        placeholder="按标题搜索"
        clearable
        style="width: 260px"
        @keyup.enter="onSearch"
      />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
        <el-option :value="1" label="已发布" />
        <el-option :value="0" label="已下线" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <!-- ✅ 列表 -->
    <el-table :data="filteredList" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />

      <!-- 内容列：只显示纯文本摘要 -->
      <el-table-column label="内容摘要" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          {{ stripHtml(row.content).slice(0, 80) }}
          <span v-if="stripHtml(row.content).length > 80">...</span>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />

      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">已发布</el-tag>
          <el-tag v-else type="info">已下线</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <el-button size="small" @click="openPreview(row)">预览</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>

          <el-button
            size="small"
            type="warning"
            :disabled="row.status !== 1"
            @click="offline(row)"
          >
            下线
          </el-button>
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

    <!-- ✅ 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="公告预览" width="860px" destroy-on-close>
      <div class="preview-title">{{ previewRow?.title }}</div>
      <div class="preview-meta">
        状态：
        <el-tag v-if="previewRow?.status === 1" type="success">已发布</el-tag>
        <el-tag v-else type="info">已下线</el-tag>
        <span class="sep">|</span>
        创建：{{ previewRow?.createTime }}
        <span class="sep">|</span>
        更新：{{ previewRow?.updateTime }}
      </div>
      <el-divider />
      <div class="preview-content" v-html="previewRow?.content"></div>
    </el-dialog>

    <!-- ✅ 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑公告' : '新增公告'"
      width="860px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="90px" :model="form">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="内容" required>
          <RichEditor v-model="form.content" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 160px">
            <el-option :value="1" label="发布" />
            <el-option :value="0" label="下线" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

import PageContainer from "../components/PageContainer.vue";
import RichEditor from "../components/RichEditor.vue";

import { noticeAdminPage, noticeSave, noticeOffline } from "../api/notice";
import { usePage } from "../hooks/usePage";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const saveLoading = ref(false);

const previewVisible = ref(false);
const previewRow = ref(null);

// ✅ 查询条件
const query = reactive({
  title: "",
  status: null, // 1/0/null
});

function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ✅ 前端 status 过滤（避免后端不支持 status 参数时也能正常筛选）
const filteredList = computed(() => {
  if (query.status === null || query.status === undefined || query.status === "") {
    return list.value;
  }
  return list.value.filter((x) => x.status === query.status);
});

const form = reactive({
  id: null,
  title: "",
  content: "",
  status: 1,
});

const fetchList = async () => {
  loading.value = true;
  try {
    const pageData = await noticeAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      title: query.title?.trim() || undefined,
    });

    list.value = pageData?.records || [];
    page.total = pageData?.total || 0;
  } catch (e) {
    console.warn("noticeAdminPage failed:", e);
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  resetToFirstPage();
  fetchList();
};

const onReset = () => {
  query.title = "";
  query.status = null;
  resetToFirstPage();
  fetchList();
};

const onSizeChange = () => {
  resetToFirstPage();
  fetchList();
};

const openAdd = () => {
  Object.assign(form, { id: null, title: "", content: "", status: 1 });
  dialogVisible.value = true;
};

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    title: row.title,
    content: row.content || "",
    status: row.status ?? 1,
  });
  dialogVisible.value = true;
};

const openPreview = (row) => {
  previewRow.value = row;
  previewVisible.value = true;
};

const save = async () => {
  if (!form.title.trim()) {
    ElMessage.warning("请输入标题");
    return;
  }
  if (!String(form.content || "").trim()) {
    ElMessage.warning("请输入内容");
    return;
  }

  saveLoading.value = true;
  try {
    await noticeSave({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } catch (e) {
    console.warn("noticeSave failed:", e);
  } finally {
    saveLoading.value = false;
  }
};

const offline = async (row) => {
  try {
    await ElMessageBox.confirm("确认下线该公告？", "提示", { type: "warning" });
    await noticeOffline(row.id);
    ElMessage.success("已下线");
    fetchList();
  } catch (e) {
    if (String(e).includes("cancel")) return;
    console.warn("noticeOffline failed:", e);
  }
};

onMounted(fetchList);
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

.preview-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}

.preview-meta {
  font-size: 12px;
  color: #666;
}

.sep {
  margin: 0 8px;
  color: #bbb;
}

.preview-content {
  line-height: 1.8;
}
</style>
