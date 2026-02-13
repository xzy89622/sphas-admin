import http from "./http";

export function bmiAdminPage(params) {
  return http.get("/standards/bmi/admin/page", { params });
}

export function bmiSave(data) {
  return http.post("/standards/bmi/admin/save", data);
}

export function bmiDelete(id) {
  return http.delete(`/standards/bmi/admin/${id}`);
}
