// src/api/dashboard.js
import http from "./http";

// ✅ 管理端：看指定用户趋势
export function fetchAdminDashboardOverview(userId) {
  return http.get("/admin/dashboard/overview", { params: { userId } });
}

export function fetchAdminDashboardTrend(userId, days = 30) {
  return http.get("/admin/dashboard/trend", { params: { userId, days } });
}

// ✅ 管理端：全站统计（柱状图/饼图）
export function fetchAdminStatsSummary() {
  return http.get("/admin/stats/summary");
}