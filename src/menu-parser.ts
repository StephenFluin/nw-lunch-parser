export type MenuDay = {
  date: Date;
  items: string[];
};

export function parseNutrislicePageHtml(html: string, referenceDate: Date = new Date()): MenuDay[] {
  const matches = Array.from(html.matchAll(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}/gi));
  const days: MenuDay[] = [];
  const seenDates = new Set<string>();

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? html.length;
    const block = html.slice(start, end);
    const dateText = match[0].trim();
    const date = parseFriendlyDate(dateText);

    if (!date) {
      continue;
    }

    const dateKey = date.toISOString().slice(0, 10);
    if (seenDates.has(dateKey)) continue;
    seenDates.add(dateKey);

    const items = extractMenuItems(block);
    if (items.length === 0) continue;

    days.push({ date, items });
  }

  return days.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function parseFriendlyDate(value: string): Date | null {
  const normalized = value.replace(/\s+/g, ' ').trim();
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function extractMenuItems(section: string): string[] {
  const listItems = Array.from(section.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && !/^choice\s*\d*$/i.test(value));

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const item of listItems) {
    const clean = item.replace(/\s+/g, ' ').trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    deduped.push(clean);
  }

  return deduped;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
