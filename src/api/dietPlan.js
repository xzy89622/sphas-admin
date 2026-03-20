// src/api/dietPlan.js
import http from "./http";

// 管理端分页
export function dietPlanAdminPage(params) {
  return http.get("/diet-plan/admin/page", { params });
}

// 保存
export function dietPlanSave(data) {
  return http.post("/diet-plan/admin/save", data);
}

// 删除
export function dietPlanDelete(id) {
  return http.delete(`/diet-plan/admin/${id}`);
}