// src/api/ops.js
import http from "./http";

// ✅ 触发一次备份
export function runBackup() {
  return http.post("/admin/ops/backup/run");
}

// ✅ 备份列表
export function listBackups() {
  return http.get("/admin/ops/backup/list");
}

// ✅ 下载备份（用 blob 下载，带 Authorization）
export async function downloadBackup(name) {
  const res = await http.get(`/admin/ops/backup/download/${encodeURIComponent(name)}`, {
    responseType: "blob",
  });

  // res 是 blob（因为 http.js 对非 R 结构会直接 return res）
  const blob = res instanceof Blob ? res : new Blob([res]);

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}