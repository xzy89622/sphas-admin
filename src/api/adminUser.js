// src/api/adminUser.js
import http from "./http";

/**
 * 创建管理员
 * 后端：POST /api/admin/users/create-admin
 * body: { username, password, nickname, phone }
 */
export function createAdminApi(data) {
  return http.post("/admin/users/create-admin", data);
}

/**
 * 获取最近创建的管理员（倒序）
 * 后端建议：GET /api/admin/users/recent?limit=10
 * 返回：[{ id, username, nickname, phone, createTime }]
 */
export function fetchRecentAdminsApi(limit = 10) {
  return http.get("/admin/users/recent", { params: { limit } });
}
