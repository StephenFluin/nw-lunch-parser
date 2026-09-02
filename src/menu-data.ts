export type MenuSection = {
  title: string;
  items: string[];
};

export type MenuDay = {
  date: Date;
  sections: MenuSection[];
};

type NutrisliceMenuItem = {
  is_section_title?: boolean;
  text?: string | null;
  food?: {
    name?: string | null;
  } | null;
};

type NutrisliceDay = {
  date?: string | null;
  menu_items?: NutrisliceMenuItem[] | null;
};

export function normalizeMenuResponse(
  payload: { days?: NutrisliceDay[] | null },
  referenceDate: Date = new Date(),
  maxDate: Date = addDays(referenceDate, 14),
): MenuDay[] {
  return mergeMenuDays([payload], referenceDate, maxDate);
}

export function mergeMenuDays(
  payloads: Array<{ days?: NutrisliceDay[] | null }>,
  referenceDate: Date = new Date(),
  maxDate: Date = addDays(referenceDate, 14),
): MenuDay[] {
  const uniqueDays = new Map<string, NutrisliceDay>();

  for (const payload of payloads) {
    for (const day of payload.days ?? []) {
      if (!day.date) continue;
      const parsedDate = new Date(`${day.date}T12:00:00Z`);
      if (Number.isNaN(parsedDate.getTime())) continue;
      if (parsedDate > startOfDay(maxDate)) continue;
      uniqueDays.set(day.date, day);
    }
  }

  const result: MenuDay[] = [];
  for (const day of uniqueDays.values()) {
    const sections = groupMenuItems(day.menu_items ?? []);
    if (sections.length === 0) continue;
    const parsedDate = new Date(`${day.date}T12:00:00Z`);
    result.push({ date: parsedDate, sections });
  }

  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function groupMenuItems(items: NutrisliceMenuItem[]): MenuSection[] {
  const sections: MenuSection[] = [];
  let currentTitle: string | null = null;
  let currentItems: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    const values = currentItems.filter((item) => item && item.trim().length > 0);
    if (values.length > 0) {
      sections.push({ title: currentTitle, items: values });
    }
    currentTitle = null;
    currentItems = [];
  };

  for (const item of items) {
    if (item.is_section_title) {
      flush();
      const title = (item.text ?? '').trim();
      if (title) {
        currentTitle = title;
      }
      continue;
    }

    const name = (item.food?.name ?? '').trim();
    if (!name) continue;

    if (currentTitle) {
      currentItems.push(name);
    } else {
      currentItems.push(name);
    }
  }

  flush();

  return sections;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
