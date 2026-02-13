import http from "./http";

export function createAdminApi(data) {
  return http.post("/admin/users/create-admin", data);
}
