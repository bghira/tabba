import type { TabbaProject } from "../types";

export function createProjectFileName(project: TabbaProject): string {
  const normalizedName = project.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedName || "tabba-project"}.tabba.json`;
}
