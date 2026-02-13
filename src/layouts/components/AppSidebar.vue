<template>
  <div class="sidebar">
    <div class="logo" :class="{ collapsed }">
      <div class="logo-mark">S</div>
      <div v-if="!collapsed" class="logo-text">
        <div class="name">SPHAS</div>
        <div class="sub">Admin</div>
      </div>
    </div>

    <el-scrollbar class="menu-scroll">
      <el-menu
        class="menu"
        :default-active="active"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        background-color="#0f172a"
        text-color="rgba(255,255,255,0.86)"
        active-text-color="#ffffff"
      >
        <template v-for="item in menuItems" :key="item.path">
          <!-- 折叠时：外层套 tooltip，让用户知道每个图标是啥 -->
          <el-tooltip
            v-if="collapsed"
            effect="dark"
            :content="item.title"
            placement="right"
          >
            <el-menu-item :index="item.path">
              <el-icon class="menu-icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-tooltip>

          <!-- 展开时：正常显示文字 -->
          <el-menu-item v-else :index="item.path">
            <el-icon class="menu-icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

// ✅ 图标
import {
  DataBoard,
  Bell,
  ChatLineRound,
  Histogram,
  Collection,
  User,
  Document,
} from "@element-plus/icons-vue";

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();

const active = computed(() => route.path);

/**
 * ✅ 统一定义：路由 path -> 图标
 * 没匹配到就给默认图标 Document
 */
const iconMap = {
  "/dashboard": DataBoard,
  "/notice": Bell,
  "/feedback": ChatLineRound,
  "/bmi-standards": Histogram,
  "/question-bank": Collection,
  "/admin-users": User,
};

const menuItems = computed(() => {
  const routes = router.getRoutes();

  return routes
    .filter((r) => {
      if (!r?.meta?.title) return false;
      if (r.meta.public) return false;
      if (r.meta.hideInMenu) return false;
      if (r.path === "/") return false;
      if (r.path.includes(":")) return false;
      return true;
    })
    .map((r) => ({
      path: r.path,
      title: r.meta.title,
      order: typeof r.meta.order === "number" ? r.meta.order : 999,
      icon: iconMap[r.path] || Document,
    }))
    .sort((a, b) => a.order - b.order);
});
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0f172a;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #fff;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo.collapsed {
  justify-content: center;
  padding: 0;
}

.logo-mark {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.12);
}

.logo-text {
  margin-left: 10px;
  line-height: 1.05;
}

.name {
  font-weight: 800;
  letter-spacing: 0.4px;
}

.sub {
  font-size: 12px;
  opacity: 0.7;
}

.menu-scroll {
  flex: 1;
}

.menu {
  border-right: none;
}

.menu-icon {
  margin-right: 8px;
}
</style>
