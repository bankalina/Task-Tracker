export const PRIORITIES = ["High", "Medium", "Low"];
export const STATUSES = ["To do", "In progress", "Done"];
export const ROLES = ["Owner", "Assigned", "Viewer"];

export function toKebab(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "-");
}
