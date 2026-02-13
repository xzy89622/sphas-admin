<template>
  <el-card title="xxx" desc="xxx">
    <template #header>创建管理员</template>

    <el-form :model="form" label-width="90px" style="max-width: 520px;">
      <el-form-item label="账号">
        <el-input v-model="form.username" placeholder="admin_xxx" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submit">创建</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive } from "vue";
import { ElMessage } from "element-plus";
import { createAdminApi } from "../api/adminUser";

const form = reactive({
  username: "",
  password: "",
  nickname: "",
});

const submit = async () => {
  if (!form.username || !form.password || !form.nickname) {
    ElMessage.warning("请填写完整");
    return;
  }
  await createAdminApi({ ...form });
  ElMessage.success("创建成功");
  reset();
};

const reset = () => {
  form.username = "";
  form.password = "";
  form.nickname = "";
};
</script>
