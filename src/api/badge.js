// src/api/badge.js
import http from "./http";

// 勋章库分页
export function badgeAdminPage(params) {
  return http.get("/badge/admin/page", { params });
}

// 保存勋章
export function badgeSave(data) {
  return http.post("/badge/admin/save", data);
}

// 删除勋章
export function badgeDelete(id) {
  return http.delete(`/badge/admin/${id}`);
}

// 用户勋章分页
export function userBadgeAdminPage(params) {
  return http.get("/badge/admin/user-page", { params });
}