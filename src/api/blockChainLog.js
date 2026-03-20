// src/api/blockChainLog.js
import http from "./http";

// 区块链日志分页
export function blockChainLogAdminPage(params) {
  return http.get("/block-chain-log/admin/page", { params });
}