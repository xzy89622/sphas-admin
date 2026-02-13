import http from "./http";

export function qbAdminPage(params) {
  return http.get("/questions/admin/page", { params });
}

export function qbSave(data) {
  return http.post("/questions/admin/save", data);
}

export function qbDelete(id) {
  return http.delete(`/questions/admin/${id}`);
}
