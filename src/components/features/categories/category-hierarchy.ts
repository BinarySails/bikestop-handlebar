import type { Category } from "@/lib/api/schemas";

export type CategoryOption = {
  category: Category;
  depth: number;
};

export function getDescendantIds(
  categories: Category[],
  categoryId: string
): Set<string> {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = children.get(category.parent_id) ?? [];
    siblings.push(category.id);
    children.set(category.parent_id, siblings);
  }

  const descendants = new Set<string>();
  const pending = [...(children.get(categoryId) ?? [])];
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id || descendants.has(id)) continue;
    descendants.add(id);
    pending.push(...(children.get(id) ?? []));
  }
  return descendants;
}

export function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const categoryMap = new Map(
    categories.map((category) => [category.id, category])
  );
  const children = new Map<string | null, Category[]>();

  for (const category of categories) {
    const parentKey =
      category.parent_id && categoryMap.has(category.parent_id)
        ? category.parent_id
        : null;
    const siblings = children.get(parentKey) ?? [];
    siblings.push(category);
    children.set(parentKey, siblings);
  }

  for (const siblings of children.values()) {
    siblings.sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
  }

  const options: CategoryOption[] = [];
  const visited = new Set<string>();

  function visit(category: Category, depth: number) {
    if (visited.has(category.id)) return;
    visited.add(category.id);
    options.push({ category, depth });
    for (const child of children.get(category.id) ?? [])
      visit(child, depth + 1);
  }

  for (const root of children.get(null) ?? []) visit(root, 0);
  for (const category of categories) visit(category, 0);

  return options;
}
