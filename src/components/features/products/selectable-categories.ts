import type { Category } from "@/lib/api/schemas";

export function getSelectableCategories(categories: Category[]): Category[] {
  return categories.filter((category) => category.status === "enable");
}
