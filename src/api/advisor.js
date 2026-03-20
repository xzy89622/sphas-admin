// src/api/advisor.js
import http from "./http";

// 拉取最近高风险用户
export function fetchHighRiskUsersApi(limit = 20) {
  return http.get("/advisor/high-risk-users", {
    params: { limit },
  });
}

// 拉取最近已发送建议记录
export function fetchAdviceRecordsApi(limit = 20) {
  return http.get("/advisor/advice-records", {
    params: { limit },
  });
}

// 发送健康建议
export function sendAdvisorAdviceApi(data) {
  return http.post("/advisor/send-advice", data);
}