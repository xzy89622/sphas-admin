<template>
  <div class="page">
    <el-row :gutter="16">
      <!-- 左侧：创建表单 -->
      <el-col :xs="24" :md="14">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">创建管理员</div>
                <div class="sub">
                  用于后台管理端登录，默认角色为 <el-tag type="danger">ADMIN</el-tag>
                </div>
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
            description="点击生成密码后，系统将自行生成密码，生成后的密码请牢记！"
          />

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            style="max-width: 640px"
            status-icon
          >
            <el-form-item label="账号" prop="username">
              <el-input v-model="form.username" placeholder="例如：admin03 / admin_2026" clearable />
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
              <el-input v-model="form.nickname" placeholder="例如：管理员3号 / 李四" clearable />
            </el-form-item>

            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="可选：11位手机号" clearable />
              <div class="help">为空允许创建；不为空需符合 11 位手机号格式</div>
            </el-form-item>

            <el-form-item label="角色">
              <el-tag type="danger">ADMIN</el-tag>
              <div class="help" style="margin-left: 10px">本页用于创建管理员（固定 ADMIN）</div>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧：最近创建列表 -->
      <el-col :xs="24" :md="10">
        <el-card class="card">
          <template #header>
            <div class="header">
              <div>
                <div class="h1">最近创建的管理员</div>
                <div class="sub">用于快速确认新建结果（按创建时间倒序）</div>
              </div>
              <div class="actions">
                <el-button :loading="recentLoading" @click="loadRecent">刷新</el-button>
              </div>
            </div>
          </template>

          <el-table
            :data="recentAdmins"
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

          <div class="help mt-10">
            列表为最近创建的管理员，如需具体操作请联系后台管理员操作。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ✅ A：创建成功弹窗 + 一键复制 -->
    <el-dialog v-model="successDialogVisible" title="创建成功" width="520px" :close-on-click-modal="false">
      <el-alert
        type="success"
        show-icon
        :closable="false"
        title="管理员已创建"
        description="请妥善保存账号与密码。建议首次登录后尽快修改密码。"
        class="mb-12"
      />

      <el-descriptions :column="1" border>
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
            <span class="mono">{{ createdInfo.phone || "-" }}</span>
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
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createAdminApi, fetchRecentAdminsApi } from "../api/adminUser";

/**
 * ✅ 表单
 */
const form = reactive({
  username: "",
  password: "",
  nickname: "",
  phone: "",
});

const formRef = ref(null);
const submitting = ref(false);

/**
 * ✅ 最近管理员列表
 */
const recentAdmins = ref([]);
const recentLoading = ref(false);

/**
 * ✅ 创建成功弹窗数据
 */
const successDialogVisible = ref(false);
const createdInfo = reactive({
  username: "",
  password: "",
  nickname: "",
  phone: "",
});

/**
 * ✅ 校验
 */
const rules = {
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
        if (!value) return cb(); // 允许空
        const ok = /^1\d{10}$/.test(String(value).trim());
        if (!ok) return cb(new Error("手机号格式不正确（需 11 位）"));
        cb();
      },
      trigger: "blur",
    },
  ],
};

function genPassword() {
  // 排除易混淆字符（0/O、1/l 等）
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 10; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  form.password = pwd + "!";
  ElMessage.success("已生成密码");
}

/**
 * ✅ 提交创建
 */
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

    await createAdminApi(payload);

    // ✅ 保存用于弹窗展示（密码只在前端本次显示，后端不会返回明文）
    createdInfo.username = payload.username;
    createdInfo.password = payload.password;
    createdInfo.nickname = payload.nickname;
    createdInfo.phone = payload.phone;

    successDialogVisible.value = true;

    ElMessage.success("创建成功");
    reset();
    await loadRecent(); // ✅ 刷新右侧列表
  } finally {
    submitting.value = false;
  }
}

function reset() {
  form.username = "";
  form.password = "";
  form.nickname = "";
  form.phone = "";
  formRef.value?.clearValidate?.();
}

/**
 * ✅ 复制工具：优先 clipboard API；不支持则降级
 */
async function copyText(text) {
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(text));
    } else {
      // 降级方案
      const input = document.createElement("input");
      input.value = String(text);
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请手动复制");
  }
}

function copyAll() {
  const lines = [
    `账号：${createdInfo.username}`,
    `密码：${createdInfo.password}`,
    `昵称：${createdInfo.nickname}`,
    `手机号：${createdInfo.phone || "-"}`,
  ];
  copyText(lines.join("\n"));
}

/**
 * ✅ 加载最近管理员
 * 注意：这需要后端提供接口；如果没有会提示失败但不影响创建功能
 */
async function loadRecent() {
  recentLoading.value = true;
  try {
    const list = await fetchRecentAdminsApi(10);
    recentAdmins.value = Array.isArray(list) ? list : [];
  } catch {
    // 失败不强弹（全局 http.js 会提示真实 msg）
    recentAdmins.value = [];
  } finally {
    recentLoading.value = false;
  }
}

onMounted(() => {
  loadRecent();
});
</script>

<style scoped>
.page {
  padding: 0;
}

.card {
  border-radius: 14px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.h1 {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.2;
}

.sub {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.help {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.help-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mt-10 {
  margin-top: 10px;
}

.copy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
