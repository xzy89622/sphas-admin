import http from "./http";

export function feedbackAdminList() {
  return http.get("/feedback/admin/list");
}

export function feedbackAdminDetail(id) {
  return http.get("/feedback/admin/detail", { params: { id } });
}

export function feedbackAdminReply(id, content) {
  return http.post(`/feedback/${id}/reply`, { content });
}

/**
 * ✅ 管理员：关闭反馈（标记已处理）
 * POST /api/feedback/admin/close?id=xxx
 */
export function feedbackAdminClose(id) {
  return http.post("/feedback/admin/close", null, { params: { id } });
}
