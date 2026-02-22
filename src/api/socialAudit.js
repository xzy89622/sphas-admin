// src/api/socialAudit.js
import http from "./http";

// ✅ 待审核分页
export function fetchPendingPosts(pageNum = 1, pageSize = 10) {
  return http.get("/admin/social/audit/pending/page", {
    params: { pageNum, pageSize },
  });
}

// ✅ 按状态分页（0隐藏 1通过 2待审 3驳回）
export function fetchPostsByStatus(status, pageNum = 1, pageSize = 10) {
  return http.get("/admin/social/audit/page", {
    params: { status, pageNum, pageSize },
  });
}

// ✅ 审核通过
export function approvePost(postId) {
  return http.post("/admin/social/audit/approve", null, {
    params: { postId },
  });
}

// ✅ 审核驳回
export function rejectPost(postId, reason = "内容不符合规范") {
  return http.post("/admin/social/audit/reject", null, {
    params: { postId, reason },
  });
}

// ✅ 隐藏下架
export function hidePost(postId, reason = "管理员下架处理") {
  return http.post("/admin/social/audit/hide", null, {
    params: { postId, reason },
  });
}

// ✅ 恢复上架
export function restorePost(postId) {
  return http.post("/admin/social/audit/restore", null, {
    params: { postId },
  });
}