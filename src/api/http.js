// src/api/http.js
import axios from "axios";
import { ElMessage, ElLoading } from "element-plus";
import router from "../router";
import { getToken, clearToken } from "../utils/token";

const http = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// ✅ 全局 Loading（和你原来的保持一致）
let loadingInstance = null;

// ✅ 防止重复弹消息（避免刷屏）
let lastMsg = "";
let lastMsgTime = 0;
function toastOnce(msg, type = "error", gap = 1200) {
  const now = Date.now();
  if (msg === lastMsg && now - lastMsgTime < gap) return;
  lastMsg = msg;
  lastMsgTime = now;
  ElMessage[type](msg);
}

function isLoginRoute() {
  return router?.currentRoute?.value?.path === "/login";
}

// 请求拦截：打开 Loading + 自动带 token
http.interceptors.request.use(
  (config) => {
    if (!loadingInstance) {
      loadingInstance = ElLoading.service({ fullscreen: true });
    }

    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截：关闭 Loading + 统一处理
http.interceptors.response.use(
  (response) => {
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }

    const res = response.data;

    // ✅ 兼容后端 R<T>：{ code, msg/message, data }
    if (res && typeof res === "object" && "code" in res) {
      const code = res.code;

      // ✅ 你的后端成功码就是 0
      if (code === 0) {
        return res.data;
      }

      // ✅ 失败提示：优先 msg，其次 message
      const msg = res.msg || res.message || "请求失败";
      toastOnce(msg, "error");

      // ✅ 业务上提示未登录/token 失效（你项目以前就是这么判断的）
      const lower = String(msg).toLowerCase();
      if (msg.includes("未登录") || lower.includes("token") || lower.includes("login")) {
        clearToken();
        if (!isLoginRoute()) router.push("/login");
      }

      return Promise.reject(new Error(msg));
    }

    // ✅ 非 R 结构：直接返回
    return res;
  },
  async (error) => {
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }

    const status = error?.response?.status;

    // ✅ 401：登录过期/未登录
    if (status === 401) {
      toastOnce("登录已过期，请重新登录", "error");
      clearToken();
      if (!isLoginRoute()) await router.push("/login");
      return Promise.reject(error);
    }

    // ✅ 403：权限不足
    if (status === 403) {
      toastOnce("权限不足（403）", "error");
      return Promise.reject(error);
    }

    // ✅ 404：接口不存在
    if (status === 404) {
      toastOnce("接口不存在（404）", "error");
      return Promise.reject(error);
    }

    // ✅ 5xx：服务器异常
    if (status >= 500) {
      toastOnce("服务器异常，请稍后再试", "error");
      return Promise.reject(error);
    }

    // ✅ 网络/超时
    if (error?.code === "ECONNABORTED") {
      toastOnce("请求超时，请稍后再试", "error");
      return Promise.reject(error);
    }

    // ✅ 其它：尽量从后端拿 msg/message
    const msg =
      error?.response?.data?.msg ||
      error?.response?.data?.message ||
      error?.message ||
      "请求失败";

    toastOnce(msg, "error");
    return Promise.reject(new Error(msg));
  }
);

export default http;
