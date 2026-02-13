<template>
  <div class="login-page">
    <el-card class="login-card">
      <template #header>
        <div class="title">管理员登录</div>
      </template>

      <el-form :model="form" label-width="80px">
        <el-form-item label="账号">
          <el-input v-model="form.username" placeholder="请输入管理员账号" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="btn"
          :loading="loading"
          @click="onLogin"
        >
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter, useRoute } from "vue-router";

import { loginApi } from "../api/auth";
import { setToken } from "../utils/token";

const router = useRouter();
const route = useRoute();

const loading = ref(false);

const form = reactive({
  username: "",
  password: "",
});

const onLogin = async () => {
  if (!form.username.trim() || !form.password.trim()) {
    ElMessage.warning("请输入账号和密码");
    return;
  }

  loading.value = true;
  try {
    // 后端返回 R<String>，http.js 会把 data 直接取出来
    const resp = await loginApi({
      username: form.username,
      password: form.password,
    });

    // 兼容：未来后端可能返回 { token: "..." }
    const token = typeof resp === "string" ? resp : resp?.token;
    if (!token) {
      ElMessage.error("登录成功但未获取到 token，请检查后端返回");
      return;
    }

    setToken(token);

    // ✅ 用于右上角显示
    localStorage.setItem("ADMIN_USERNAME", form.username.trim());

    ElMessage.success("登录成功");

    // ✅ 登录后跳回原来的页面（如果没有就去 dashboard）
    const redirect = route.query.redirect || "/dashboard";
    router.replace(redirect);
  } catch (e) {
    ElMessage.error(e?.message || "登录失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.login-card {
  width: 380px;
  border-radius: 12px;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.btn {
  width: 100%;
}
</style>
