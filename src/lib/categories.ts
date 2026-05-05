export const CATEGORIES = [
  "IT",
  "Business",
  "Design",
  "Languages",
  "Arts",
  "Health",
  "Science",
  "General",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}
