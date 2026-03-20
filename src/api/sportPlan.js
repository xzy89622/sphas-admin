// src/api/sportPlan.js
import http from "./http";

// 管理端分页
export function sportPlanAdminPage(params) {
  return http.get("/sport-plan/admin/page", { params });
}

// 保存
export function sportPlanSave(data) {
  return http.post("/sport-plan/admin/save", data);
}

// 删除
export function sportPlanDelete(id) {
  return http.delete(`/sport-plan/admin/${id}`);
}