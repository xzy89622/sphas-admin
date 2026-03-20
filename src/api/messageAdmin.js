// src/api/messageAdmin.js
import http from "./http";

// 后台消息分页
export function messageAdminPage(params) {
  return http.get("/message/admin/page", { params });
}