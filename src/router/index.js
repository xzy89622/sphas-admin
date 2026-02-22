// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { ElMessage } from "element-plus";

import Login from "../views/Login.vue";
import AdminLayout from "../layouts/AdminLayout.vue";

import Dashboard from "../views/Dashboard.vue";
import NoticeManage from "../views/NoticeManage.vue";
import FeedbackManage from "../views/FeedbackManage.vue";
import BmiStandardManage from "../views/BmiStandardManage.vue";
import QuestionBankManage from "../views/QuestionBankManage.vue";
import AdminUserManage from "../views/AdminUserManage.vue";
import HealthArticleManage from "../views/HealthArticleManage.vue";

// ✅ 新增页面
import SocialAuditManage from "../views/SocialAuditManage.vue";
import OpsBackup from "../views/OpsBackup.vue";

import { getToken } from "../utils/token";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },

    { path: "/login", component: Login },

    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "dashboard", component: Dashboard, meta: { title: "数据看板", requiresAuth: true, order: 1 } },

        { path: "notice", component: NoticeManage, meta: { title: "公告管理", requiresAuth: true, order: 2 } },
        { path: "health-articles", component: HealthArticleManage, meta: { title: "健康科普", requiresAuth: true, order: 3 } },
        { path: "feedback", component: FeedbackManage, meta: { title: "反馈管理", requiresAuth: true, order: 4 } },

        { path: "bmi-standards", component: BmiStandardManage, meta: { title: "BMI 标准", requiresAuth: true, order: 5 } },
        { path: "question-bank", component: QuestionBankManage, meta: { title: "题库管理", requiresAuth: true, order: 6 } },

        // ✅ 社区审核（任务2：审核流）
        { path: "social-audit", component: SocialAuditManage, meta: { title: "社区内容审核", requiresAuth: true, order: 7 } },

        // ✅ 运维备份（任务4：系统维护）
        { path: "ops-backup", component: OpsBackup, meta: { title: "系统备份运维", requiresAuth: true, order: 8 } },

        { path: "admin-users", component: AdminUserManage, meta: { title: "创建管理员", requiresAuth: true, order: 9 } },
      ],
    },

    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

// ✅ 防止“请先登录”弹窗刷屏
let lastMsg = "";
let lastTime = 0;
function toastOnce(msg, gap = 1200) {
  const now = Date.now();
  if (msg === lastMsg && now - lastTime < gap) return;
  lastMsg = msg;
  lastTime = now;
  ElMessage.warning(msg);
}

function requiresAuth(to) {
  return to.matched.some((r) => r.meta?.requiresAuth);
}

// ✅ 路由守卫：未登录不能进后台；已登录访问 /login 自动去 /dashboard
router.beforeEach((to, from, next) => {
  const token = getToken();

  if (to.path === "/login" && token) {
    return next("/dashboard");
  }

  if (requiresAuth(to) && !token) {
    toastOnce("请先登录");
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }

  next();
});

export default router;