<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">创建后台账号</div>
                <div class="sub">这里可以创建管理员和 AI 健康顾问账号</div>
              </div>

              <div class="actions">
                <el-button @click="reset">重置</el-button>
                <el-button type="primary" :loading="submitting" @click="submit">创建</el-button>
              </div>
            </div>
          </template>

          <el-alert
            class="mb-12"
            type="info"
            show-icon
            :closable="false"
            title="提示"
            description="建议由管理员统一创建 AI 健康顾问账号，避免直接走普通注册。"
          />

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            style="max-width: 640px"
            status-icon
          >
            <el-form-item label="角色" prop="role">
              <el-radio-group v-model="form.role">
                <el-radio-button label="ADMIN">管理员</el-radio-button>
                <el-radio-button label="AI_ADVISOR">AI健康顾问</el-radio-button>
              </el-radio-group>
              <div class="help">先把 AI 健康顾问作为真实账号角色落地，后面再接顾问专属能力</div>
            </el-form-item>

            <el-form-item label="账号" prop="username">
              <el-input v-model="form.username" placeholder="例如：admin03 / ai_advisor_01" clearable />
              <div class="help">建议 4~20 位：字母/数字/下划线</div>
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                show-password
                placeholder="至少 6 位，建议包含数字+字母"
              />
              <div class="help-row">
                <div class="help">可点击右侧按钮自动生成强密码</div>
                <el-button size="small" @click="genPassword">生成密码</el-button>
              </div>
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="form.nickname" placeholder="例如：管理员3号 / AI顾问小助手" clearable />
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="可选：11位手机号" clearable />
              <div class="help">为空允许创建；不为空需符合 11 位手机号格式</div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">最近创建账号</div>
                <div class="sub">可以切换查看管理员和 AI 健康顾问</div>
              </div>
              <div class="actions">
                <el-button :loading="recentLoading" @click="loadRecent">刷新</el-button>
              </div>
            </div>
          </template>

          <el-tabs v-model="recentRole" @tab-change="loadRecent">
            <el-tab-pane label="管理员" name="ADMIN" />
            <el-tab-pane label="AI健康顾问" name="AI_ADVISOR" />
          </el-tabs>

          <el-table
            :data="recentList"
            size="small"
            border
            style="width: 100%"
            v-loading="recentLoading"
            element-loading-text="加载中..."
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="username" label="账号" min-width="120" />
            <el-table-column prop="nickname" label="昵称" min-width="120" />
            <el-table-column prop="phone" label="手机号" min-width="130" />
            <el-table-column prop="createTime" label="创建时间" min-width="170" />
          </el-table>

          <div class="help mt-10">这一步先把角色闭环补上，后面再补顾问专属功能和工作台。</div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="successDialogVisible" title="创建成功" width="520px" :close-on-click-modal="false">
      <el-alert
        type="success"
        show-icon
        :closable="false"
        title="账号已创建"
        :description="successDesc"
        class="mb-12"
      />

      <el-descriptions :column="1" border>
        <el-descriptions-item label="角色">
          <div class="copy-row">
            <span class="mono">{{ createdInfo.roleText }}</span>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="账号">
          <div class="copy-row">
            <span class="mono">{{ createdInfo.username }}</span>
            <el-button size="small" @click="copyText(createdInfo.username)">复制</el-button>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="密码">
          <div class="copy-row">
            <span class="mono">{{ createdInfo.password }}</span>
            <el-button size="small" @click="copyText(createdInfo.password)">复制</el-button>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="昵称">
          <div class="copy-row">
            <span class="mono">{{ createdInfo.nickname }}</span>
            <el-button size="small" @click="copyText(createdInfo.nickname)">复制</el-button>
          </div>
        </el-descriptions-item>

        <el-descriptions-item label="手机号">
          <div class="copy-row">
            <span class="mono">{{ createdInfo.phone || '-' }}</span>
            <el-button size="small" :disabled="!createdInfo.phone" @click="copyText(createdInfo.phone)">
              复制
            </el-button>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="successDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyAll">一键复制全部</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createAdminApi,
  createAiAdvisorApi,
  fetchRecentAdminsApi,
  fetchRecentAiAdvisorsApi,
} from "../api/adminUser";

const form = reactive({
  role: "AI_ADVISOR",
  username: "",
  password: "",
  nickname: "",
  phone: "",
});

const formRef = ref(null);
const submitting = ref(false);
const recentRole = ref("AI_ADVISOR");
const recentList = ref([]);
const recentLoading = ref(false);

const successDialogVisible = ref(false);
const createdInfo = reactive({
  role: "",
  roleText: "",
  username: "",
  password: "",
  nickname: "",
  phone: "",
});

const successDesc = computed(() => {
  return createdInfo.role === "ADMIN"
    ? "管理员已创建，请妥善保存账号与密码。"
    : "AI 健康顾问账号已创建，后面可以继续补顾问专属页面和能力。";
});

const rules = {
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  username: [
    { required: true, message: "请输入账号", trigger: "blur" },
    { min: 4, max: 20, message: "账号长度需 4~20 位", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "账号只能包含字母/数字/下划线", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
  nickname: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 2, max: 20, message: "昵称长度需 2~20 位", trigger: "blur" },
  ],
  phone: [
    {
      validator: (_, value, cb) => {
        if (!value) return cb();
        const ok = /^1\d{10}$/.test(String(value).trim());
        if (!ok) return cb(new Error("手机号格式不正确（需 11 位）"));
        cb();
      },
      trigger: "blur",
    },
  ],
};

function roleText(role) {
  if (role === "ADMIN") return "管理员";
  if (role === "AI_ADVISOR") return "AI健康顾问";
  return role || "未知角色";
}

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  form.password = pwd + "!";
  ElMessage.success("已生成密码");
}

async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    ElMessage.warning("请先修正表单错误");
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      phone: form.phone ? form.phone.trim() : "",
    };

    if (form.role === "ADMIN") {
      await createAdminApi(payload);
    } else {
      await createAiAdvisorApi(payload);
    }

    createdInfo.role = form.role;
    createdInfo.roleText = roleText(form.role);
    createdInfo.username = payload.username;
    createdInfo.password = payload.password;
    createdInfo.nickname = payload.nickname;
    createdInfo.phone = payload.phone;

    successDialogVisible.value = true;
    ElMessage.success(`${createdInfo.roleText}创建成功`);

    recentRole.value = form.role;
    await loadRecent();
    reset(false);
  } finally {
    submitting.value = false;
  }
}

async function loadRecent() {
  recentLoading.value = true;
  try {
    recentList.value = recentRole.value === "ADMIN"
      ? await fetchRecentAdminsApi(10)
      : await fetchRecentAiAdvisorsApi(10);
  } finally {
    recentLoading.value = false;
  }
}

function reset(showMsg = true) {
  form.role = "AI_ADVISOR";
  form.username = "";
  form.password = "";
  form.nickname = "";
  form.phone = "";
  formRef.value?.clearValidate?.();
  if (showMsg) ElMessage.success("已重置");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text || "");
    ElMessage.success("复制成功");
  } catch {
    ElMessage.error("复制失败，请手动复制");
  }
}

function copyAll() {
  const text = [
    `角色：${createdInfo.roleText}`,
    `账号：${createdInfo.username}`,
    `密码：${createdInfo.password}`,
    `昵称：${createdInfo.nickname}`,
    `手机号：${createdInfo.phone || '-'}`,
  ].join("\n");
  copyText(text);
}

onMounted(() => {
  loadRecent();
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
  gap: 8px;
}

.help {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.help-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mono {
  font-family: Consolas, Monaco, monospace;
  word-break: break-all;
}

.mb-12 {
  margin-bottom: 12px;
}

.mt-10 {
  margin-top: 10px;
}
</style>