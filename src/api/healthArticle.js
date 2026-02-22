// src/api/healthArticle.js
import http from "./http";

/**
 * 后端：@RequestMapping("/api/article")
 * 前端 http baseURL="/api"
 *
 * 管理端接口：
 * - GET  /article/admin/page
 * - POST /article/admin/save
 * - POST /article/admin/offline/{id}
 * - POST /article/admin/online/{id}
 */

// 管理端分页（看全部，可选 title/status）
export function articleAdminPage(params) {
  return http.get("/article/admin/page", { params });
}

// 管理端保存（新增/更新：id有值=更新；id为空=新增）
export function articleSave(data) {
  return http.post("/article/admin/save", data);
}

// 下线
export function articleOffline(id) {
  return http.post(`/article/admin/offline/${id}`);
}

// 上线
export function articleOnline(id) {
  return http.post(`/article/admin/online/${id}`);
}
