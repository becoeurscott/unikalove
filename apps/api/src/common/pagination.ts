/** Cursor pagination helpers — cursor is the last item's id. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export function toPage<T extends { id: string }>(items: T[], limit: number): Page<T> {
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  return { items: sliced, nextCursor: hasMore ? sliced[sliced.length - 1].id : null };
}

export function cursorArgs(cursor?: string): { cursor?: { id: string }; skip?: number } {
  return cursor ? { cursor: { id: cursor }, skip: 1 } : {};
}
