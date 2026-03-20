// src/api/leaderboard.js
import http from "./http";

// 挑战选项
export function leaderboardChallengeOptions() {
  return http.get("/leaderboard/admin/challenge-options");
}

// 挑战排行榜
export function leaderboardChallengeRank(params) {
  return http.get("/leaderboard/admin/challenge-rank", { params });
}

// 积分排行榜
export function leaderboardPointRank(params) {
  return http.get("/leaderboard/admin/point-rank", { params });
}