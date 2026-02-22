<template>
  <div class="wrap">
    <div class="top">
      <div class="title">系统备份运维</div>
      <div class="actions">
        <el-button type="primary" @click="doRunBackup">触发备份</el-button>
        <el-button @click="load">刷新列表</el-button>
      </div>
    </div>

    <el-alert
      title="说明：点击“触发备份”会在服务器生成 .sql 文件；列表可下载备份。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 12px"
    />

    <el-table :data="rows" border style="width: 100%">
      <el-table-column label="备份文件名">
        <template #default="{ row }">
          <span class="name">{{ row }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="doDownload(row)">下载</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

import { runBackup, listBackups, downloadBackup } from "../api/ops";

const rows = ref([]);

async function load() {
  const list = await listBackups();
  rows.value = Array.isArray(list) ? list : [];
}

async function doRunBackup() {
  const name = await runBackup();
  ElMessage.success("备份完成：" + name);
  load();
}

async function doDownload(name) {
  await downloadBackup(name);
  ElMessage.success("开始下载：" + name);
}

onMounted(load);
</script>

<style scoped>
.wrap {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  font-size: 16px;
  font-weight: 800;
}

.actions {
  display: flex;
  gap: 10px;
}

.name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
}
</style>