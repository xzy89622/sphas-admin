<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">勋章管理</div>
          <div class="desc">维护勋章库，支持新增、编辑、删除</div>
        </div>

        <div class="actions">
          <el-button type="primary" @click="openAdd">新增勋章</el-button>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.keyword"
        placeholder="勋章编码 / 名称 / 描述"
        clearable
        style="width: 260px"
      />
      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="勋章编码" width="160" />
      <el-table-column prop="name" label="勋章名称" width="140" />
      <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
      <el-table-column prop="icon" label="图标" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.icon || "-" }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />

      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="removeRow(row)">删除</el-button>
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
    v-model="dialogVisible"
    :title="form.id ? '编辑勋章' : '新增勋章'"
    width="680px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="90px">
      <el-form-item label="勋章编码" required>
        <el-input v-model="form.code" placeholder="例如：POINTS_50" />
      </el-form-item>

      <el-form-item label="勋章名称" required>
        <el-input v-model="form.name" placeholder="例如：积分达人" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入勋章描述"
        />
      </el-form-item>

      <el-form-item label="图标">
        <el-input v-model="form.icon" placeholder="可以填写图标URL或图标名称" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saveLoading" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePage } from "../hooks/usePage";
import { badgeAdminPage, badgeSave, badgeDelete } from "../api/badge";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const query = reactive({
  keyword: "",
});

const dialogVisible = ref(false);
const saveLoading = ref(false);

const form = reactive({
  id: null,
  code: "",
  name: "",
  description: "",
  icon: "",
});

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await badgeAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
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
  query.keyword = "";
  resetToFirstPage();
  fetchList();
}

function onSizeChange() {
  resetToFirstPage();
  fetchList();
}

function resetForm() {
  Object.assign(form, {
    id: null,
    code: "",
    name: "",
    description: "",
    icon: "",
  });
}

function openAdd() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    code: row.code || "",
    name: row.name || "",
    description: row.description || "",
    icon: row.icon || "",
  });
  dialogVisible.value = true;
}

function validateForm() {
  if (!String(form.code).trim()) {
    ElMessage.warning("请输入勋章编码");
    return false;
  }
  if (!String(form.name).trim()) {
    ElMessage.warning("请输入勋章名称");
    return false;
  }
  return true;
}

async function save() {
  if (!validateForm()) return;

  saveLoading.value = true;
  try {
    await badgeSave({
      id: form.id,
      code: String(form.code).trim(),
      name: String(form.name).trim(),
      description: form.description ? String(form.description).trim() : "",
      icon: form.icon ? String(form.icon).trim() : "",
    });

    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } finally {
    saveLoading.value = false;
  }
}

async function removeRow(row) {
  await ElMessageBox.confirm(`确认删除勋章【${row.name}】吗？`, "提示", {
    type: "warning",
  });

  await badgeDelete(row.id);
  ElMessage.success("删除成功");
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
</style>