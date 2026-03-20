// src/api/pointRecord.js
import http from "./http";

// 积分流水分页
export function pointRecordAdminPage(params) {
  return http.get("/point-record/admin/page", { params });
}