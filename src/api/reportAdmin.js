// src/api/reportAdmin.js
import http from "./http";

// 报告分页
export function reportAdminPage(params) {
  return http.get("/health/report/admin/page", { params });
}

// 生成报告
export function reportAdminGenerate(data) {
  return http.post("/health/report/admin/generate", data);
}