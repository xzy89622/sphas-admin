<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">挑战管理</div>
          <div class="desc">管理健康挑战活动，支持新增、编辑、上架、下架</div>
        </div>

        <div class="actions">
          <el-button type="primary" @click="openAdd">新增挑战</el-button>
          <el-button @click="fetchList">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="filter-bar">
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
        <el-option :value="1" label="已上架" />
        <el-option :value="0" label="已下架" />
      </el-select>

      <el-select v-model="query.type" placeholder="类型" clearable style="width: 160px">
        <el-option label="步数挑战" value="STEP" />
        <el-option label="跑步挑战" value="RUN" />
        <el-option label="饮食挑战" value="DIET" />
        <el-option label="自定义挑战" value="CUSTOM" />
      </el-select>

      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onReset">重置</el-button>
    </div>

    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />

      <el-table-column prop="title" label="挑战标题" min-width="220" show-overflow-tooltip />

      <el-table-column label="挑战描述" min-width="260" show-overflow-tooltip>
        <template #default="{ row }">
          {{ brief(row.description) }}
        </template>
      </el-table-column>

      <el-table-column prop="type" label="类型" width="120">
        <template #default="{ row }">
          <el-tag>{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="targetValue" label="目标值" width="100" />
      <el-table-column prop="rewardPoints" label="奖励积分" width="100" />

      <el-table-column label="挑战周期" width="220">
        <template #default="{ row }">
          {{ row.startDate || "-" }} ~ {{ row.endDate || "-" }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">已上架</el-tag>
          <el-tag v-else type="info">已下架</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />

      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>

          <el-button
            v-if="row.status === 1"
            size="small"
            type="warning"
            :loading="statusLoadingId === row.id"
            @click="changeStatus(row, 0)"
          >
            下架
          </el-button>

          <el-button
            v-else
            size="small"
            type="success"
            :loading="statusLoadingId === row.id"
            @click="changeStatus(row, 1)"
          >
            上架
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

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑挑战' : '新增挑战'"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="挑战标题" required>
          <el-input v-model="form.title" placeholder="请输入挑战标题" />
        </el-form-item>

        <el-form-item label="挑战描述" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入挑战描述"
          />
        </el-form-item>

        <el-form-item label="挑战类型" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="步数挑战" value="STEP" />
            <el-option label="跑步挑战" value="RUN" />
            <el-option label="饮食挑战" value="DIET" />
            <el-option label="自定义挑战" value="CUSTOM" />
          </el-select>
        </el-form-item>

        <el-form-item label="目标值" required>
          <el-input-number v-model="form.targetValue" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="奖励积分" required>
          <el-input-number v-model="form.rewardPoints" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="form.startDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择开始日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期" required>
          <el-date-picker
            v-model="form.endDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择结束日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option :value="1" label="上架" />
            <el-option :value="0" label="下架" />
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
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePage } from "../hooks/usePage";
import {
  challengeAdminPage,
  challengeAdminCreate,
  challengeAdminUpdate,
  challengeAdminStatus,
} from "../api/challenge";

const { page, resetToFirstPage } = usePage(10);

const loading = ref(false);
const list = ref([]);

const dialogVisible = ref(false);
const saveLoading = ref(false);
const statusLoadingId = ref(null);

const query = reactive({
  status: null,
  type: "",
});

const form = reactive({
  id: null,
  title: "",
  description: "",
  type: "STEP",
  targetValue: 1,
  rewardPoints: 50,
  startDate: "",
  endDate: "",
  status: 1,
});

function brief(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > 60 ? value.slice(0, 60) + "..." : value;
}

function typeText(type) {
  const map = {
    STEP: "步数挑战",
    RUN: "跑步挑战",
    DIET: "饮食挑战",
    CUSTOM: "自定义挑战",
  };
  return map[type] || type || "-";
}

async function fetchList() {
  loading.value = true;
  try {
    const pageData = await challengeAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      status: query.status ?? undefined,
      type: query.type || undefined,
    });

    list.value = pageData?.records || [];
    page.total = pageData?.total || 0;
  } catch (e) {
    console.warn("challengeAdminPage failed:", e);
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  resetToFirstPage();
  fetchList();
}

function onReset() {
  query.status = null;
  query.type = "";
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
    title: "",
    description: "",
    type: "STEP",
    targetValue: 1,
    rewardPoints: 50,
    startDate: "",
    endDate: "",
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
    title: row.title || "",
    description: row.description || "",
    type: row.type || "STEP",
    targetValue: row.targetValue ?? 1,
    rewardPoints: row.rewardPoints ?? 50,
    startDate: row.startDate || "",
    endDate: row.endDate || "",
    status: row.status ?? 1,
  });
  dialogVisible.value = true;
}

function validateForm() {
  if (!form.title.trim()) {
    ElMessage.warning("请输入挑战标题");
    return false;
  }
  if (!form.description.trim()) {
    ElMessage.warning("请输入挑战描述");
    return false;
  }
  if (!form.type) {
    ElMessage.warning("请选择挑战类型");
    return false;
  }
  if (!form.targetValue || form.targetValue <= 0) {
    ElMessage.warning("目标值必须大于 0");
    return false;
  }
  if (!form.rewardPoints || form.rewardPoints <= 0) {
    ElMessage.warning("奖励积分必须大于 0");
    return false;
  }
  if (!form.startDate || !form.endDate) {
    ElMessage.warning("请选择挑战开始和结束日期");
    return false;
  }
  if (form.endDate < form.startDate) {
    ElMessage.warning("结束日期不能早于开始日期");
    return false;
  }
  return true;
}

async function save() {
  if (!validateForm()) return;

  saveLoading.value = true;
  try {
    const payload = {
      id: form.id,
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      targetValue: form.targetValue,
      rewardPoints: form.rewardPoints,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    };

    if (form.id) {
      await challengeAdminUpdate(payload);
      ElMessage.success("编辑成功");
    } else {
      await challengeAdminCreate(payload);
      ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    fetchList();
  } catch (e) {
    console.warn("save challenge failed:", e);
  } finally {
    saveLoading.value = false;
  }
}

async function changeStatus(row, status) {
  const text = status === 1 ? "上架" : "下架";

  try {
    await ElMessageBox.confirm(`确认要${text}这个挑战吗？`, "提示", {
      type: "warning",
    });

    statusLoadingId.value = row.id;
    await challengeAdminStatus({
      challengeId: row.id,
      status,
    });

    ElMessage.success(`${text}成功`);
    fetchList();
  } catch (e) {
    if (e !== "cancel") {
      console.warn("change challenge status failed:", e);
    }
  } finally {
    statusLoadingId.value = null;
  }
}

onMounted(() => {
  fetchList();
});
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