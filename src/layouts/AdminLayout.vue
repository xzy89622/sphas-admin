<template>
  <el-container class="layout">
    <el-aside :width="asideWidth" class="aside">
      <AppSidebar :collapsed="collapsed" />
    </el-aside>

    <el-container class="content">
      <el-header class="header" height="56px">
        <AppHeader :collapsed="collapsed" @toggle="toggleCollapsed" />
      </el-header>

      <el-main class="main">
        <el-scrollbar class="main-scroll">
          <div class="page">
            <router-view />
          </div>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";

import AppSidebar from "./components/AppSidebar.vue";
import AppHeader from "./components/AppHeader.vue";

const STORAGE_KEY = "SPHAS_ADMIN_SIDEBAR_COLLAPSED";

// 记住用户折叠状态（刷新不丢）
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === "1");

// ✅ 小屏自动折叠（避免侧边栏占满屏幕）
onMounted(() => {
  if (window.innerWidth <= 992) {
    collapsed.value = true;
    localStorage.setItem(STORAGE_KEY, "1");
  }
});

const asideWidth = computed(() => (collapsed.value ? "64px" : "220px"));

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
  localStorage.setItem(STORAGE_KEY, collapsed.value ? "1" : "0");
};
</script>

<style scoped>
.layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.aside {
  background: #0f172a;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.content {
  min-width: 0;
}

.header {
  padding: 0;
}

.main {
  padding: 0;
  background: #f5f7fa;
}

.main-scroll {
  height: calc(100vh - 56px);
}

.page {
  padding: 16px;
  min-height: calc(100vh - 56px);
}
</style>
