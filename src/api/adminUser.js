// src/api/adminUser.js
import http from "./http";

// 创建管理员
export function createAdminApi(data) {
  return http.post("/admin/users/create-admin", data);
}

// 创建 AI 健康顾问
export function createAiAdvisorApi(data) {
  return http.post("/admin/users/create-ai-advisor", data);
}

// 最近管理员
export function fetchRecentAdminsApi(limit = 10) {
  return http.get("/admin/users/recent", { params: { limit } });
}

// 最近 AI 健康顾问
export function fetchRecentAiAdvisorsApi(limit = 10) {
  return http.get("/admin/users/recent-ai-advisors", { params: { limit } });
}