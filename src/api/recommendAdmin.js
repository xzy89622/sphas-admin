// src/api/recommendAdmin.js
import http from "./http";

// 推荐记录分页
export function recommendAdminPage(params) {
  return http.get("/recommend/admin/page", { params });
}