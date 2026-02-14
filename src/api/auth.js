// src/api/auth.js
// 登录相关接口
import http from "./http";

// 管理员登录
export function loginApi(data) {
  // 对应你后端：POST /api/auth/login
  return http.post("/auth/login", data);
}
//wangong