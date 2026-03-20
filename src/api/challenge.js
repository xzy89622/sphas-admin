// src/api/challenge.js
import http from "./http";

// 挑战分页
export function challengeAdminPage(params) {
  return http.get("/challenge/admin/page", { params });
}

// 新增挑战
export function challengeAdminCreate(data) {
  return http.post("/challenge/admin/create", data);
}

// 编辑挑战
export function challengeAdminUpdate(data) {
  return http.post("/challenge/admin/update", data);
}

// 上下架
export function challengeAdminStatus(params) {
  return http.post("/challenge/admin/status", null, { params });
}