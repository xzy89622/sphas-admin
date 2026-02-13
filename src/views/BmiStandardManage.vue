<!-- src/views/BmiStandardManage.vue -->
<template>
  <el-card title="xxx" desc="xxx">
    <template #header>
      <div class="header">
        <div class="title">BMI 标准管理</div>
        <el-button type="primary" @click="openAdd">新增标准</el-button>
      </div>
    </template>

    <!-- 表格 -->
    <el-table :data="list" border v-loading="tableLoading">
      <el-table-column prop="id" label="ID" width="80" />

      <el-table-column prop="minValue" label="最小值" width="110" />
      <el-table-column prop="maxValue" label="最大值" width="110" />

      <el-table-column prop="level" label="等级" width="140" />

      <el-table-column
        prop="advice"
        label="建议"
        min-width="260"
        show-overflow-tooltip
      />

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="info">停用</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
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

  <!-- 新增/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑 BMI 标准' : '新增 BMI 标准'"
    width="560px"
    :close-on-click-modal="false"
  >
    <el-form label-width="90px" :model="form">
      <el-form-item label="最小值" required>
        <el-input v-model="form.minValue" placeholder="例如 18.5" />
      </el-form-item>

      <el-form-item label="最大值" required>
        <el-input v-model="form.maxValue" placeholder="例如 23.9" />
      </el-form-item>

      <el-form-item label="等级" required>
        <el-input v-model="form.level" placeholder="例如 正常 / 偏瘦 / 超重" />
      </el-form-item>

      <el-form-item label="建议" required>
        <el-input v-model="form.advice" type="textarea" :rows="4" />
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="form.status" style="width:160px">
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

import { bmiAdminPage, bmiSave, bmiDelete } from "../api/bmiStandard";
import { usePage } from "../hooks/usePage";

// 分页
const { page, resetToFirstPage } = usePage(10);

// 列表
const list = ref([]);
const tableLoading = ref(false);

// 弹窗/表单
const dialogVisible = ref(false);
const saveLoading = ref(false);

const form = reactive({
  id: null,
  minValue: "",
  maxValue: "",
  level: "",
  advice: "",
  status: 1,
});

// 获取列表
const fetchList = async () => {
  tableLoading.value = true;
  try {
    const pageData = await bmiAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
    });
    list.value = pageData?.records || [];
    page.total = pageData?.total || 0;
  } finally {
    tableLoading.value = false;
  }
};

const onSizeChange = () => {
  resetToFirstPage();
  fetchList();
};

// 新增
const openAdd = () => {
  Object.assign(form, {
    id: null,
    minValue: "",
    maxValue: "",
    level: "",
    advice: "",
    status: 1,
  });
  dialogVisible.value = true;
};

// 编辑
const openEdit = (row) => {
  Object.assign(form, { ...row });
  dialogVisible.value = true;
};

// 保存
const save = async () => {
  if (!String(form.minValue).trim()) {
    ElMessage.warning("请输入最小值");
    return;
  }
  if (!String(form.maxValue).trim()) {
    ElMessage.warning("请输入最大值");
    return;
  }
  if (!String(form.level).trim()) {
    ElMessage.warning("请输入等级");
    return;
  }
  if (!String(form.advice).trim()) {
    ElMessage.warning("请输入建议");
    return;
  }

  saveLoading.value = true;
  try {
    await bmiSave({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } finally {
    saveLoading.value = false;
  }
};

// 删除
const remove = async (row) => {
  await ElMessageBox.confirm("确认删除该 BMI 标准？", "提示", {
    type: "warning",
  });

  await bmiDelete(row.id);
  ElMessage.success("删除成功");

  // ✅ 如果删除后当前页没数据，可回到上一页（简单处理：回第一页）
  resetToFirstPage();
  fetchList();
};

onMounted(fetchList);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: 700;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
