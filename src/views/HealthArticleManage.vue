<template>
  <el-card class="page-card">
    <!-- ✅ Element Plus 标准 header：按钮一定能显示 -->
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">健康科普</div>
          <div class="desc">管理健康科普文章：新增/编辑/预览/上下线（富文本）</div>
        </div>

        <div class="actions">
          <el-button type="primary" @click="openAdd">新增文章</el-button>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
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
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 160px">
        <el-option :value="1" label="已发布" />
        <el-option :value="0" label="已下线" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <!-- ✅ 列表 -->
    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />

      <el-table-column label="封面" width="140">
        <template #default="{ row }">
          <el-image
            v-if="row.coverUrl"
            :src="row.coverUrl"
            fit="cover"
            style="width: 110px; height: 62px; border-radius: 10px"
            :preview-src-list="[row.coverUrl]"
            preview-teleported
          >
            <!-- ✅ 加载失败时显示占位，不再看到“加载失败” -->
            <template #error>
              <div class="img-fallback">无封面</div>
            </template>
          </el-image>

          <div v-else class="img-fallback">无封面</div>
        </template>
      </el-table-column>

      <el-table-column label="摘要" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          {{ (row.summary || stripHtml(row.content)).slice(0, 80) }}
          <span v-if="(row.summary || stripHtml(row.content)).length > 80">...</span>
        </template>
      </el-table-column>

      <el-table-column prop="publishTime" label="发布时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />

      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">已发布</el-tag>
          <el-tag v-else type="info">已下线</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="360">
        <template #default="{ row }">
          <el-button size="small" @click="openPreview(row)">预览</el-button>
          <el-button size="small" @click="openEdit(row)">编辑</el-button>

          <el-button
            size="small"
            type="success"
            :disabled="row.status === 1"
            @click="online(row)"
          >
            上线
          </el-button>

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
    <el-dialog v-model="previewVisible" title="文章预览" width="920px" destroy-on-close>
      <div class="preview-title">{{ previewRow?.title }}</div>

      <div class="preview-meta">
        状态：
        <el-tag v-if="previewRow?.status === 1" type="success">已发布</el-tag>
        <el-tag v-else type="info">已下线</el-tag>
        <span class="sep">|</span>
        发布时间：{{ previewRow?.publishTime || "-" }}
        <span class="sep">|</span>
        更新：{{ previewRow?.updateTime || "-" }}
      </div>

      <el-divider />

      <div v-if="previewRow?.coverUrl" class="cover-wrap">
        <el-image
          :src="previewRow.coverUrl"
          fit="cover"
          style="width: 100%; height: 240px; border-radius: 12px"
          :preview-src-list="[previewRow.coverUrl]"
          preview-teleported
        >
          <template #error>
            <div class="img-fallback big">封面加载失败</div>
          </template>
        </el-image>
      </div>

      <div v-if="previewRow?.summary" class="preview-summary">
        {{ previewRow.summary }}
      </div>

      <div class="preview-content" v-html="previewRow?.content"></div>
    </el-dialog>

    <!-- ✅ 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑文章' : '新增文章'"
      width="920px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="96px" :model="form">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="3"
            placeholder="可选：用于列表摘要展示；不填则自动截取正文"
          />
        </el-form-item>

        <el-form-item label="封面图 URL">
          <el-input v-model="form.coverUrl" placeholder="粘贴图片直链（以 .jpg/.png 结尾最好）" />
          <div v-if="form.coverUrl" style="margin-top: 10px; width: 100%">
            <el-image
              :src="form.coverUrl"
              fit="cover"
              style="width: 100%; height: 180px; border-radius: 12px"
              :preview-src-list="[form.coverUrl]"
              preview-teleported
            >
              <template #error>
                <div class="img-fallback big">封面加载失败（请换图片直链）</div>
              </template>
            </el-image>
          </div>
        </el-form-item>

        <el-form-item label="正文" required>
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
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

import RichEditor from "../components/RichEditor.vue";
import { usePage } from "../hooks/usePage";
import { articleAdminPage, articleSave, articleOffline, articleOnline } from "../api/healthArticle";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const loading = ref(false);

const dialogVisible = ref(false);
const saveLoading = ref(false);

const previewVisible = ref(false);
const previewRow = ref(null);

const query = reactive({
  title: "",
  status: null,
});

const form = reactive({
  id: null,
  title: "",
  summary: "",
  coverUrl: "",
  content: "",
  status: 1,
});

function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const fetchList = async () => {
  loading.value = true;
  try {
    const pageData = await articleAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      title: query.title?.trim() || undefined,
      status: query.status ?? undefined,
    });

    list.value = pageData?.records || [];
    page.total = pageData?.total || 0;
  } catch (e) {
    console.warn("articleAdminPage failed:", e);
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
  Object.assign(form, {
    id: null,
    title: "",
    summary: "",
    coverUrl: "",
    content: "",
    status: 1,
  });
  dialogVisible.value = true;
};

const openEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    title: row.title || "",
    summary: row.summary || "",
    coverUrl: row.coverUrl || "",
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
  if (!form.title.trim()) return ElMessage.warning("请输入标题");
  if (!String(form.content || "").trim()) return ElMessage.warning("请输入正文内容");

  saveLoading.value = true;
  try {
    await articleSave({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } finally {
    saveLoading.value = false;
  }
};

const offline = async (row) => {
  try {
    await ElMessageBox.confirm("确认下线该文章？", "提示", { type: "warning" });
    await articleOffline(row.id);
    ElMessage.success("已下线");
    fetchList();
  } catch (e) {
    if (String(e).includes("cancel")) return;
  }
};

const online = async (row) => {
  try {
    await ElMessageBox.confirm("确认上线该文章？", "提示", { type: "success" });
    await articleOnline(row.id);
    ElMessage.success("已上线");
    fetchList();
  } catch (e) {
    if (String(e).includes("cancel")) return;
  }
};

onMounted(fetchList);
</script>

<style scoped>
.page-card {
  border-radius: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.title-wrap .title {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
}
.title-wrap .desc {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.img-fallback {
  width: 110px;
  height: 62px;
  border-radius: 10px;
  background: #f3f4f6;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.img-fallback.big {
  width: 100%;
  height: 180px;
}

.preview-title {
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
}

.preview-meta {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sep {
  opacity: 0.5;
}

.cover-wrap {
  margin-bottom: 12px;
}

.preview-summary {
  padding: 12px;
  border-radius: 10px;
  background: #f6f7fb;
  color: rgba(0, 0, 0, 0.72);
  margin-bottom: 12px;
}

.preview-content {
  line-height: 1.8;
}
</style>
