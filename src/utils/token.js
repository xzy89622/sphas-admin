// src/utils/token.js
// ✅ 项目唯一 token 工具（统一 KEY、统一格式、统一校验）
const KEY = "TOKEN";

export function isJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

/** 兼容 "Bearer xxx" / 空格等情况 */
export function normalizeToken(token) {
  if (!token) return null;
  const t = String(token).trim();
  if (!t) return null;
  return t.startsWith("Bearer ") ? t.slice(7).trim() : t;
}

export function getToken() {
  const raw = localStorage.getItem(KEY);
  const t = normalizeToken(raw);

  if (!t) return null;
  if (t === "undefined" || t === "null") return null;
  if (!isJwt(t)) return null;

  return t;
}

export function setToken(token) {
  const t = normalizeToken(token);
  if (!t || !isJwt(t)) {
    throw new Error("登录返回的 token 非法（不是 JWT）");
  }
  localStorage.setItem(KEY, t);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}
