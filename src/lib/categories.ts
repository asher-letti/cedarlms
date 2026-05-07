/**
 * Canonical course categories. Catalog filter and instructor "Other (custom)"
 * also accept any string outside this list, so this is the *suggested* list,
 * not an exhaustive enum.
 */
export const CATEGORIES = [
  "IT",
  "Software Development",
  "Data Science",
  "AI & Machine Learning",
  "Business",
  "Marketing",
  "Finance",
  "Entrepreneurship",
  "Design",
  "Photography",
  "Music",
  "Film & Video",
  "Writing",
  "Languages",
  "Arts & Crafts",
  "Health & Wellness",
  "Cooking",
  "Personal Development",
  "Education",
  "Engineering",
  "Science",
  "Mathematics",
  "Law",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** True only for canonical categories — custom values return false. */
export function isCanonicalCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** Loose runtime check used by the catalog filter URL handler. */
export function isCategory(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
