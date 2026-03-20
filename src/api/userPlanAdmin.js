// src/api/userPlanAdmin.js
import http from "./http";

// 执行计划分页
export function userPlanAdminPage(params) {
  return http.get("/user-plan/admin/page", { params });
}

// 打卡明细分页
export function userPlanCheckinPage(params) {
  return http.get("/user-plan/admin/checkin-page", { params });
}