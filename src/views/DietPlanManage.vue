<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">饮食方案管理</div>
          <div class="desc">维护个性化饮食推荐方案，支持筛选、新增、编辑、删除</div>
        </div>

        <div class="actions">
          <el-button type="primary" @click="openAdd">新增方案</el-button>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-input
        v-model="query.name"
        placeholder="请输入方案名称"
        clearable
        style="width: 220px"
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

      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="停用" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="ID" width="80" />

      <el-table-column prop="name" label="方案名称" min-width="180" show-overflow-tooltip />

      <el-table-column prop="bmiLevel" label="BMI等级" width="120">
        <template #default="{ row }">
          <el-tag>{{ row.bmiLevel || "-" }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="content" label="方案内容" min-width="320" show-overflow-tooltip />

      <el-table-column prop="tags" label="标签" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.tags || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="info">停用</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />

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
    :title="form.id ? '编辑饮食方案' : '新增饮食方案'"
    width="720px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="90px">
      <el-form-item label="方案名称" required>
        <el-input v-model="form.name" placeholder="请输入方案名称" />
      </el-form-item>

      <el-form-item label="BMI等级" required>
        <el-select
          v-model="form.bmiLevel"
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入 BMI 等级"
          style="width: 100%"
        >
          <el-option label="偏瘦" value="偏瘦" />
          <el-option label="正常" value="正常" />
          <el-option label="超重" value="超重" />
          <el-option label="肥胖" value="肥胖" />
        </el-select>
      </el-form-item>

      <el-form-item label="方案内容" required>
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="6"
          placeholder="请输入饮食方案内容"
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-input v-model="form.tags" placeholder="例如：减脂,低糖,高蛋白" />
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 180px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="停用" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saveLoading" @click="save">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePage } from "../hooks/usePage";
import { dietPlanAdminPage, dietPlanSave, dietPlanDelete } from "../api/dietPlan";

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const saveLoading = ref(false);

const query = reactive({
  name: "",
  bmiLevel: "",
  status: null,
});

const form = reactive({
  id: null,
  name: "",
  bmiLevel: "",
  content: "",
  tags: "",
  status: 1,
});

async function fetchList() {
  tableLoading.value = true;
  try {
    const pageData = await dietPlanAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      name: query.name || undefined,
      bmiLevel: query.bmiLevel || undefined,
      status: query.status ?? undefined,
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
  query.name = "";
  query.bmiLevel = "";
  query.status = null;
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
    name: "",
    bmiLevel: "",
    content: "",
    tags: "",
    status: 1,
  });
}

function openAdd() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row) {
  Object.assign(form, {
    id: row.id,
    name: row.name || "",
    bmiLevel: row.bmiLevel || "",
    content: row.content || "",
    tags: row.tags || "",
    status: row.status ?? 1,
  });
  dialogVisible.value = true;
}

function validateForm() {
  if (!String(form.name).trim()) {
    ElMessage.warning("请输入方案名称");
    return false;
  }
  if (!String(form.bmiLevel).trim()) {
    ElMessage.warning("请输入 BMI 等级");
    return false;
  }
  if (!String(form.content).trim()) {
    ElMessage.warning("请输入方案内容");
    return false;
  }
  return true;
}

async function save() {
  if (!validateForm()) return;

  saveLoading.value = true;
  try {
    await dietPlanSave({
      id: form.id,
      name: String(form.name).trim(),
      bmiLevel: String(form.bmiLevel).trim(),
      content: String(form.content).trim(),
      tags: form.tags ? String(form.tags).trim() : "",
      status: form.status,
    });

    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } finally {
    saveLoading.value = false;
  }
}

async function removeRow(row) {
  await ElMessageBox.confirm(`确认删除饮食方案【${row.name}】吗？`, "提示", {
    type: "warning",
  });

  await dietPlanDelete(row.id);
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