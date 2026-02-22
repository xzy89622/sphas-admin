<template>
  <div class="wrap">
    <div class="top">
      <div class="title">社区内容审核</div>

      <div class="actions">
        <el-select v-model="status" style="width: 160px" @change="onStatusChange">
          <el-option :value="2" label="待审核" />
          <el-option :value="1" label="已通过" />
          <el-option :value="3" label="已驳回" />
          <el-option :value="0" label="已隐藏" />
        </el-select>

        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="userId" label="用户ID" width="110" />
      <el-table-column label="内容">
        <template #default="{ row }">
          <div class="content">
            <div class="text">{{ row.content }}</div>
            <div v-if="row.imagesJson" class="imgHint">imagesJson: {{ row.imagesJson }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button v-if="status === 2" type="success" size="small" @click="approve(row.id)">通过</el-button>
          <el-button v-if="status === 2" type="danger" size="small" @click="openReject(row.id)">驳回</el-button>

          <el-button v-if="status === 1" type="warning" size="small" @click="openHide(row.id)">隐藏</el-button>

          <el-button v-if="status === 0" type="primary" size="small" @click="restore(row.id)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        :page-sizes="[10, 20, 30, 50]"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="驳回原因" width="420px">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 隐藏弹窗 -->
    <el-dialog v-model="hideVisible" title="隐藏原因" width="420px">
      <el-input v-model="hideReason" type="textarea" :rows="4" placeholder="请输入隐藏原因" />
      <template #footer>
        <el-button @click="hideVisible = false">取消</el-button>
        <el-button type="warning" @click="doHide">确认隐藏</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

import {
  fetchPostsByStatus,
  approvePost,
  rejectPost,
  hidePost,
  restorePost,
} from "../api/socialAudit";

const status = ref(2); // 默认待审
const pageNum = ref(1);
const pageSize = ref(10);
const total = ref(0);
const rows = ref([]);

const rejectVisible = ref(false);
const rejectReason = ref("内容不符合规范");
const rejectPostId = ref(null);

const hideVisible = ref(false);
const hideReason = ref("管理员下架处理");
const hidePostId = ref(null);

async function load() {
  const data = await fetchPostsByStatus(status.value, pageNum.value, pageSize.value);
  rows.value = data?.records || [];
  total.value = data?.total || 0;
}

function onStatusChange() {
  pageNum.value = 1;
  load();
}

function onPageChange(p) {
  pageNum.value = p;
  load();
}

function onSizeChange(s) {
  pageSize.value = s;
  pageNum.value = 1;
  load();
}

async function approve(id) {
  await approvePost(id);
  ElMessage.success("已通过");
  load();
}

function openReject(id) {
  rejectPostId.value = id;
  rejectReason.value = "内容不符合规范";
  rejectVisible.value = true;
}

async function doReject() {
  await rejectPost(rejectPostId.value, rejectReason.value || "内容不符合规范");
  ElMessage.success("已驳回");
  rejectVisible.value = false;
  load();
}

function openHide(id) {
  hidePostId.value = id;
  hideReason.value = "管理员下架处理";
  hideVisible.value = true;
}

async function doHide() {
  await hidePost(hidePostId.value, hideReason.value || "管理员下架处理");
  ElMessage.success("已隐藏");
  hideVisible.value = false;
  load();
}

async function restore(id) {
  await restorePost(id);
  ElMessage.success("已恢复");
  load();
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
  margin-bottom: 14px;
}

.title {
  font-size: 16px;
  font-weight: 800;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.content .text {
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
}

.imgHint {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
}

.pager {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
</style>