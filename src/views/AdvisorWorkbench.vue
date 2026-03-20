<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="15">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">AI顾问工作台</div>
                <div class="sub">查看最近高风险用户，并向用户发送健康建议</div>
              </div>

              <div class="actions">
                <el-select v-model="limit" style="width: 120px" @change="loadAll">
                  <el-option :value="10" label="最近10条" />
                  <el-option :value="20" label="最近20条" />
                  <el-option :value="30" label="最近30条" />
                </el-select>
                <el-button :loading="loading" @click="loadAll">刷新</el-button>
              </div>
            </div>
          </template>

          <el-alert
            class="mb-12"
            type="warning"
            show-icon
            :closable="false"
            title="说明"
            description="当前列表只展示最近高风险用户，每个用户只保留最新一条高风险记录，方便顾问优先干预。"
          />

          <el-table
            :data="tableData"
            border
            size="small"
            v-loading="loading"
            element-loading-text="加载中..."
            @row-click="selectRow"
          >
            <el-table-column prop="userId" label="用户ID" width="80" />
            <el-table-column prop="nickname" label="昵称" min-width="110" />
            <el-table-column prop="username" label="账号" min-width="120" />
            <el-table-column prop="phone" label="手机号" min-width="120" />
            <el-table-column prop="riskScore" label="风险分" width="90">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.riskScore ?? "-" }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.riskLevel || "-" }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="触发原因" min-width="180">
              <template #default="{ row }">
                <div class="reason-list">
                  <el-tag
                    v-for="(item, idx) in row.reasons || []"
                    :key="idx"
                    size="small"
                    class="reason-tag"
                  >
                    {{ item }}
                  </el-tag>
                  <span v-if="!row.reasons || !row.reasons.length" class="muted">暂无</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="预警时间" min-width="170" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click.stop="openAdviceDialog(row)">
                  发送建议
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="help mt-10">
            这一步先把“查看高风险用户 + 发建议 + 回看建议记录”打通，后面再补筛选器和顾问统计。
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="9">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">用户详情预览</div>
                <div class="sub">点击左侧任意一行可查看当前风险概况</div>
              </div>
            </div>
          </template>

          <div v-if="currentRow" class="detail-wrap">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户ID">{{ currentRow.userId }}</el-descriptions-item>
              <el-descriptions-item label="昵称">{{ currentRow.nickname || "-" }}</el-descriptions-item>
              <el-descriptions-item label="账号">{{ currentRow.username || "-" }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ currentRow.phone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ currentRow.age || "-" }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ currentRow.gender || "-" }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag type="danger">{{ currentRow.riskLevel || "-" }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风险分">
                <span class="score">{{ currentRow.riskScore ?? "-" }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="预警ID">{{ currentRow.riskAlertId || "-" }}</el-descriptions-item>
              <el-descriptions-item label="预警时间">{{ currentRow.createTime || "-" }}</el-descriptions-item>
            </el-descriptions>

            <div class="section">
              <div class="section-title">触发原因</div>
              <div class="reason-list">
                <el-tag
                  v-for="(item, idx) in currentRow.reasons || []"
                  :key="idx"
                  class="reason-tag"
                >
                  {{ item }}
                </el-tag>
                <span v-if="!currentRow.reasons || !currentRow.reasons.length" class="muted">暂无</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">系统原建议</div>
              <div class="content-box">
                {{ currentRow.advice || "暂无系统建议" }}
              </div>
            </div>

            <div class="section">
              <div class="section-title">AI解读</div>
              <div class="content-box">
                {{ currentRow.aiSummary || "暂无AI解读" }}
              </div>
            </div>

            <div class="footer-actions">
              <el-button type="primary" @click="openAdviceDialog(currentRow)">发送健康建议</el-button>
            </div>
          </div>

          <el-empty v-else description="请先在左侧选择一个高风险用户" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card mt-16">
      <template #header>
        <div class="header">
          <div>
            <div class="h1">最近已发送建议记录</div>
            <div class="sub">按发送时间倒序展示，方便回看顾问建议内容和阅读状态</div>
          </div>
          <div class="actions">
            <el-button :loading="recordLoading" @click="loadRecords">刷新记录</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="adviceRecords"
        border
        size="small"
        v-loading="recordLoading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="messageId" label="消息ID" width="90" />
        <el-table-column prop="nickname" label="用户昵称" min-width="120" />
        <el-table-column prop="username" label="用户账号" min-width="120" />
        <el-table-column prop="riskAlertId" label="关联预警ID" width="110" />
        <el-table-column label="风险信息" min-width="120">
          <template #default="{ row }">
            <div class="mini-col">
              <el-tag v-if="row.riskLevel" type="danger" size="small">{{ row.riskLevel }}</el-tag>
              <span class="mini-text">风险分：{{ row.riskScore ?? "-" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="建议标题" min-width="150" />
        <el-table-column label="建议内容" min-width="260">
          <template #default="{ row }">
            <div class="cell-multi">{{ row.content || "-" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="阅读状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.isRead || 0) === 1 ? 'success' : 'info'">
              {{ Number(row.isRead || 0) === 1 ? "已读" : "未读" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发送时间" min-width="170" />
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="发送健康建议"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="adviceForm"
        :rules="rules"
        label-width="90px"
        status-icon
      >
        <el-form-item label="目标用户">
          <el-input :model-value="targetUserText" disabled />
        </el-form-item>

        <el-form-item label="建议标题" prop="title">
          <el-input
            v-model="adviceForm.title"
            maxlength="50"
            show-word-limit
            placeholder="例如：本周饮食与运动干预建议"
          />
        </el-form-item>

        <el-form-item label="建议内容" prop="content">
          <el-input
            v-model="adviceForm.content"
            type="textarea"
            :rows="7"
            maxlength="1000"
            show-word-limit
            placeholder="这里写给用户的建议内容，例如控制高糖饮食、增加有氧运动、连续记录7天体重变化等。"
          />
        </el-form-item>
      </el-form>

      <div class="template-box">
        <div class="section-title">常用模板</div>
        <div class="template-actions">
          <el-button @click="fillTemplate('diet')">饮食干预</el-button>
          <el-button @click="fillTemplate('sport')">运动干预</el-button>
          <el-button @click="fillTemplate('sleep')">作息调整</el-button>
          <el-button @click="fillTemplate('recheck')">复查提醒</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="sending" @click="submitAdvice">发送建议</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchHighRiskUsersApi,
  fetchAdviceRecordsApi,
  sendAdvisorAdviceApi,
} from "../api/advisor";

const loading = ref(false);
const recordLoading = ref(false);
const sending = ref(false);
const limit = ref(20);

const tableData = ref([]);
const adviceRecords = ref([]);
const currentRow = ref(null);

const dialogVisible = ref(false);
const formRef = ref(null);

const adviceForm = reactive({
  userId: null,
  riskAlertId: null,
  title: "",
  content: "",
});

const rules = {
  title: [
    { required: true, message: "请输入建议标题", trigger: "blur" },
    { min: 2, max: 50, message: "标题长度需 2~50 位", trigger: "blur" },
  ],
  content: [
    { required: true, message: "请输入建议内容", trigger: "blur" },
    { min: 6, max: 1000, message: "内容长度需 6~1000 位", trigger: "blur" },
  ],
};

const targetUserText = computed(() => {
  if (!adviceForm.userId) return "";
  const row = currentRow.value || {};
  return `用户ID：${adviceForm.userId} / 昵称：${row.nickname || "-"} / 账号：${row.username || "-"}`;
});

async function loadHighRiskUsers() {
  loading.value = true;
  try {
    const res = await fetchHighRiskUsersApi(limit.value);
    tableData.value = Array.isArray(res) ? res : [];

    if (tableData.value.length) {
      if (!currentRow.value) {
        currentRow.value = tableData.value[0];
      } else {
        const hit = tableData.value.find((item) => item.userId === currentRow.value.userId);
        currentRow.value = hit || tableData.value[0];
      }
    } else {
      currentRow.value = null;
    }
  } catch (e) {
    console.log("[advisor workbench] loadHighRiskUsers fail", e);
    ElMessage.error(e?.msg || e?.message || "加载高风险用户失败");
  } finally {
    loading.value = false;
  }
}

async function loadRecords() {
  recordLoading.value = true;
  try {
    const res = await fetchAdviceRecordsApi(limit.value);
    adviceRecords.value = Array.isArray(res) ? res : [];
  } catch (e) {
    console.log("[advisor workbench] loadRecords fail", e);
    ElMessage.error(e?.msg || e?.message || "加载建议记录失败");
  } finally {
    recordLoading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadHighRiskUsers(), loadRecords()]);
}

function selectRow(row) {
  currentRow.value = row;
}

function openAdviceDialog(row) {
  currentRow.value = row;
  adviceForm.userId = row.userId;
  adviceForm.riskAlertId = row.riskAlertId;
  adviceForm.title = "本周健康干预建议";
  adviceForm.content = buildDefaultContent(row);
  dialogVisible.value = true;
  formRef.value?.clearValidate?.();
}

function buildDefaultContent(row) {
  const reasons = Array.isArray(row?.reasons) ? row.reasons.filter(Boolean) : [];
  const reasonText = reasons.length ? `当前主要风险点：${reasons.join("、")}。` : "";
  const summaryText = row?.aiSummary ? `系统解读：${row.aiSummary}。` : "";

  return [
    reasonText,
    summaryText,
    "建议你先从以下几个方面开始调整：",
    "1. 控制高糖、高油饮食，晚间尽量避免加餐；",
    "2. 每天增加 30 分钟左右中等强度运动；",
    "3. 连续记录 7 天体重、睡眠和饮食变化；",
    "4. 若出现明显不适或指标持续异常，请及时线下咨询专业医生。"
  ].filter(Boolean).join("\n");
}

function fillTemplate(type) {
  if (!currentRow.value) {
    ElMessage.warning("请先选择用户");
    return;
  }

  const nickname = currentRow.value.nickname || "该用户";

  if (type === "diet") {
    adviceForm.title = "饮食干预建议";
    adviceForm.content =
      `${nickname}，你最近的健康风险偏高，建议本周先从饮食调整开始：\n` +
      "1. 减少奶茶、甜饮和夜宵；\n" +
      "2. 主食不过量，晚餐尽量清淡；\n" +
      "3. 增加蔬菜、优质蛋白和饮水量；\n" +
      "4. 连续记录7天饮食情况。";
    return;
  }

  if (type === "sport") {
    adviceForm.title = "运动干预建议";
    adviceForm.content =
      `${nickname}，建议你这周先以可坚持的运动方案为主：\n` +
      "1. 每天快走或慢跑 30 分钟；\n" +
      "2. 每周至少 3 次轻力量训练；\n" +
      "3. 运动后及时补水并观察心率变化；\n" +
      "4. 先连续执行 7 天再评估。";
    return;
  }

  if (type === "sleep") {
    adviceForm.title = "作息调整建议";
    adviceForm.content =
      `${nickname}，建议你近期重点调整作息：\n` +
      "1. 尽量在 23:00 前入睡；\n" +
      "2. 睡前减少长时间看手机；\n" +
      "3. 保证 7 小时左右睡眠；\n" +
      "4. 连续观察一周精神状态和体重变化。";
    return;
  }

  adviceForm.title = "复查提醒";
  adviceForm.content =
    `${nickname}，建议你先按本周计划执行干预，并在 7 天后重新记录体重、饮食、运动和睡眠情况，方便继续评估风险变化。`;
}

async function submitAdvice() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    ElMessage.warning("请先把表单填写完整");
    return;
  }

  sending.value = true;
  try {
    await sendAdvisorAdviceApi({
      userId: adviceForm.userId,
      riskAlertId: adviceForm.riskAlertId,
      title: adviceForm.title.trim(),
      content: adviceForm.content.trim(),
    });

    ElMessage.success("健康建议已发送");
    dialogVisible.value = false;
    await loadRecords();
  } catch (e) {
    console.log("[advisor workbench] submitAdvice fail", e);
    ElMessage.error(e?.msg || e?.message || "发送建议失败");
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border-radius: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.h1 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.sub {
  margin-top: 4px;
  font-size: 13px;
  color: #6b7280;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.content-box {
  min-height: 72px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  color: #374151;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.reason-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reason-tag {
  margin-right: 0;
}

.score {
  font-size: 18px;
  font-weight: 700;
  color: #dc2626;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
}

.template-box {
  margin-top: 8px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.template-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.help {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.muted {
  font-size: 12px;
  color: #9ca3af;
}

.mini-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-text {
  font-size: 12px;
  color: #6b7280;
}

.cell-multi {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.mb-12 {
  margin-bottom: 12px;
}

.mt-10 {
  margin-top: 10px;
}

.mt-16 {
  margin-top: 16px;
}
</style>