// src/api/notice.js
import http from "./http";

/**
 * ✅ 后端 NoticeController 映射：@RequestMapping("/api/notice")
 * 所以前端 baseURL="/api" 时，这里应该写 "/notice/..."
 *
 * 管理端接口：
 * - GET  /notice/admin/page
 * - POST /notice/admin/save
 * - POST /notice/admin/offline/{id}
 */

// 管理端分页（全部公告，可选 title 模糊）
export function noticeAdminPage(params) {
  return http.get("/notice/admin/page", { params });
}

// 管理端保存（新增/更新：id有值=更新；id为空=新增）
export function noticeSave(data) {
  return http.post("/notice/admin/save", data);
}

// 管理端下线（后端没有 delete，只有 offline）
export function noticeOffline(id) {
  return http.post(`/notice/admin/offline/${id}`);
}
