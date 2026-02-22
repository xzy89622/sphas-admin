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

import { getToken } from "../utils/token";


const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 默认进后台首页
    { path: "/", redirect: "/dashboard" },

    // 登录页
    { path: "/login", component: Login },

    // 后台布局（需要登录）
    {
      path: "/",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "dashboard", component: Dashboard, meta: { title: "数据看板", requiresAuth: true } },
        { path: "notice", component: NoticeManage, meta: { title: "公告管理", requiresAuth: true } },
        { path: "feedback", component: FeedbackManage, meta: { title: "反馈管理", requiresAuth: true } },
        { path: "bmi-standards", component: BmiStandardManage, meta: { title: "BMI 标准", requiresAuth: true } },
        { path: "question-bank", component: QuestionBankManage, meta: { title: "题库管理", requiresAuth: true } },
        { path: "admin-users", component: AdminUserManage, meta: { title: "创建管理员", requiresAuth: true } },
        { path: "health-articles", component: HealthArticleManage, meta: { title: "健康科普", requiresAuth: true, order: 3 } },
      
      ],
    },

    // 兜底：未知路径回看板
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

// ✅ 是否需要登录
function requiresAuth(to) {
  return to.matched.some((r) => r.meta?.requiresAuth);
}

// ✅ 路由守卫：未登录不能进后台；已登录访问 /login 自动去 /dashboard
router.beforeEach((to, from, next) => {
  const token = getToken(); // 统一使用 utils/token.js

  // 已登录还去登录页 => 送回首页
  if (to.path === "/login" && token) {
    return next("/dashboard");
  }

  // 需要登录但没有 token => 去登录页，并带 redirect
  if (requiresAuth(to) && !token) {
    toastOnce("请先登录");
    return next({ path: "/login", query: { redirect: to.fullPath } });
  }

  next();
});

export default router;
