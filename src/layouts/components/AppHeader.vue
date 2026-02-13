<template>
  <div class="header-bar">
    <div class="left">
      <el-button link class="toggle-btn" @click="emit('toggle')">
        <span class="toggle-icon">☰</span>
      </el-button>

      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item
          v-for="(bc, idx) in breadcrumbItems"
          :key="bc.path + '-' + idx"
          v-bind="idx === breadcrumbItems.length - 1 ? {} : { to: bc.path }"
        >
          {{ bc.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right">
      <!-- ✅ 快捷工具 -->
      <div class="tools">
        <el-tooltip content="刷新当前页面" placement="bottom">
          <el-button circle @click="refreshPage">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip content="全屏" placement="bottom">
          <el-button circle @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
      </div>

      <!-- ✅ 用户下拉 -->
      <el-dropdown @command="onCommand">
        <div class="user-trigger">
          <el-avatar :size="30" class="avatar">{{ initials }}</el-avatar>
          <span class="username">{{ username }}</span>
          <span class="caret">▾</span>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>当前账号：{{ username }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clearToken } from "../../utils/token";

// ✅ 图标
import { Refresh, FullScreen } from "@element-plus/icons-vue";

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggle"]);

const route = useRoute();
const router = useRouter();

const username = computed(() => {
  return localStorage.getItem("ADMIN_USERNAME") || "管理员";
});

const initials = computed(() => {
  const name = String(username.value || "").trim();
  if (!name) return "A";
  return name.slice(0, 1).toUpperCase();
});

const breadcrumbItems = computed(() => {
  const items = [{ title: "首页", path: "/dashboard" }];
  const matched = route.matched.filter((r) => r.meta?.title && r.path !== "/");

  for (const r of matched) {
    items.push({
      title: r.meta.title,
      path: r.path,
    });
  }

  return items;
});

const refreshPage = () => {
  // 轻量刷新：触发 router 重新渲染当前页面
  router.replace({ path: "/_refresh", query: { t: Date.now() } }).catch(() => {});
  router.replace(route.fullPath).catch(() => {});
};

const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // 某些浏览器/权限可能不支持
  }
};

const onCommand = (cmd) => {
  if (cmd === "logout") {
    clearToken();
    localStorage.removeItem("ADMIN_USERNAME");
    router.replace("/login");
  }
};
</script>

<style scoped>
.header-bar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.toggle-btn {
  padding: 0 6px;
}

.toggle-icon {
  font-size: 18px;
  line-height: 1;
}

.breadcrumb {
  min-width: 0;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.username {
  font-size: 14px;
  color: #333;
}

.caret {
  font-size: 12px;
  color: #999;
}

@media (max-width: 640px) {
  .username {
    display: none;
  }
}
</style>
