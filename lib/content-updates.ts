/** Accept stored timestamps, never substitute the time a page was requested. */
export function contentTimestamp(value: unknown): string | undefined {
  if (!(typeof value === "string" && value.trim()) && !(value instanceof Date)) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() <= Date.now() ? date.toISOString() : undefined;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => JSON.parse(stable(item))));
  if (value && typeof value === "object") {
    return JSON.stringify(Object.fromEntries(Object.entries(value)
      .filter(([key, item]) => key !== "updatedAt" && item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, JSON.parse(stable(item))])));
  }
  return JSON.stringify(value ?? null);
}

export function sameContent(left: unknown, right: unknown): boolean {
  return stable(left) === stable(right);
}

export function stampContent<T extends { id: string; updatedAt?: string }>(items: T[], previous: T[]): T[] {
  const existing = new Map(previous.map((item) => [item.id, item]));
  const now = new Date().toISOString();
  return items.map((item) => {
    const old = existing.get(item.id);
    return { ...item, updatedAt: old && sameContent(item, old) ? old.updatedAt : now };
  });
}
