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
import SocialAuditManage from "../views/SocialAuditManage.vue";
import OpsBackup from "../views/OpsBackup.vue";
import AdvisorWorkbench from "../views/AdvisorWorkbench.vue";
import ChallengeManage from "../views/ChallengeManage.vue";
import DietPlanManage from "../views/DietPlanManage.vue";
import SportPlanManage from "../views/SportPlanManage.vue";
import UserPlanManage from "../views/UserPlanManage.vue";
import RecommendRecordManage from "../views/RecommendRecordManage.vue";
import BlockChainLogManage from "../views/BlockChainLogManage.vue";
import PointRecordManage from "../views/PointRecordManage.vue";
import BadgeManage from "../views/BadgeManage.vue";
import UserBadgeManage from "../views/UserBadgeManage.vue";
import LeaderboardManage from "../views/LeaderboardManage.vue";
import MessageManage from "../views/MessageManage.vue";
import ReportManage from "../views/ReportManage.vue";

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
        { path: "challenge-manage", component: ChallengeManage, meta: { title: "挑战管理", requiresAuth: true, order: 7 } },
        { path: "diet-plan-manage", component: DietPlanManage, meta: { title: "饮食方案管理", requiresAuth: true, order: 8 } },
        { path: "sport-plan-manage", component: SportPlanManage, meta: { title: "运动方案管理", requiresAuth: true, order: 9 } },
        { path: "user-plan-manage", component: UserPlanManage, meta: { title: "执行计划查看", requiresAuth: true, order: 10 } },
        { path: "recommend-record-manage", component: RecommendRecordManage, meta: { title: "推荐记录查看", requiresAuth: true, order: 11 } },
        { path: "block-chain-log-manage", component: BlockChainLogManage, meta: { title: "区块链日志查看", requiresAuth: true, order: 12 } },
        { path: "point-record-manage", component: PointRecordManage, meta: { title: "积分流水查看", requiresAuth: true, order: 13 } },
        { path: "badge-manage", component: BadgeManage, meta: { title: "勋章管理", requiresAuth: true, order: 14 } },
        { path: "user-badge-manage", component: UserBadgeManage, meta: { title: "用户勋章查看", requiresAuth: true, order: 15 } },
        { path: "leaderboard-manage", component: LeaderboardManage, meta: { title: "排行榜查看", requiresAuth: true, order: 16 } },
        { path: "message-manage", component: MessageManage, meta: { title: "消息提醒查看", requiresAuth: true, order: 17 } },
        { path: "report-manage", component: ReportManage, meta: { title: "周报月报管理", requiresAuth: true, order: 18 } },
        { path: "social-audit", component: SocialAuditManage, meta: { title: "社区内容审核", requiresAuth: true, order: 19 } },
        { path: "advisor-workbench", component: AdvisorWorkbench, meta: { title: "AI顾问工作台", requiresAuth: true, order: 20 } },
        { path: "ops-backup", component: OpsBackup, meta: { title: "系统备份运维", requiresAuth: true, order: 21 } },
        { path: "admin-users", component: AdminUserManage, meta: { title: "后台账号管理", requiresAuth: true, order: 22 } },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});

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