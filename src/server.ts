import express from 'express';
import { normalizeMenuResponse } from './menu-data';

const app = express();
const port = Number(process.env.PORT || 3000);

type ApiDay = {
  date?: string | null;
  menu_items?: Array<{
    is_section_title?: boolean;
    text?: string | null;
    food?: {
      name?: string | null;
    } | null;
  }> | null;
};

const mealConfig = {
  breakfast: { label: 'Breakfast', url: 'https://wayzata.api.nutrislice.com/menu/api/weeks/school/north-woods-elementary/menu-type/breakfast' },
  lunch: { label: 'Lunch', url: 'https://wayzata.api.nutrislice.com/menu/api/weeks/school/north-woods-elementary/menu-type/lunch' },
};

const maxDaysAhead = 60;

app.use(express.static('public'));

app.get('/api/menu', async (_req, res) => {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDaysAhead);

  const results = await Promise.all(
    Object.entries(mealConfig).map(async ([key, config]) => {
      const payloads: Array<{ days?: ApiDay[] | null }> = [];
      let cursor = new Date(today);

      while (cursor <= maxDate) {
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, '0');
        const day = String(cursor.getDate()).padStart(2, '0');
        const url = `${config.url}/${year}/${month}/${day}/`;
        const response = await fetch(url, {
          headers: {
            accept: 'application/json, text/plain, */*',
            origin: 'https://wayzata.nutrislice.com',
            referer: 'https://wayzata.nutrislice.com/',
            'x-nutrislice-origin': 'wayzata.nutrislice.com',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
          },
        });

        if (!response.ok) {
          break;
        }

        const payload = (await response.json()) as { days?: ApiDay[] | null };
        const days = Array.isArray(payload?.days) ? payload.days : [];

        if (days.length === 0 || days.every((day) => Array.isArray(day?.menu_items) && day.menu_items!.length === 0)) {
          break;
        }

        payloads.push(payload);
        cursor.setDate(cursor.getDate() + 7);
      }

      return {
        meal: key,
        label: config.label,
        days: normalizeMenuResponse({ days: payloads.flatMap((payload) => payload.days ?? []) }, today, maxDate),
      };
    }),
  );

  res.json({ today: today.toISOString(), meals: results });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
