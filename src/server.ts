import express from 'express';
import { normalizeMenuResponse } from './menu-data';

const app = express();
const port = Number(process.env.PORT || 3000);

const mealConfig = {
  breakfast: { label: 'Breakfast', url: 'https://wayzata.api.nutrislice.com/menu/api/weeks/school/north-woods-elementary/menu-type/breakfast' },
  lunch: { label: 'Lunch', url: 'https://wayzata.api.nutrislice.com/menu/api/weeks/school/north-woods-elementary/menu-type/lunch' },
};

app.use(express.static('public'));

app.get('/api/menu', async (_req, res) => {
  const today = new Date();
  const results = await Promise.all(
    Object.entries(mealConfig).map(async ([key, config]) => {
      const response = await fetch(`${config.url}/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/`, {
        headers: {
          accept: 'application/json, text/plain, */*',
          origin: 'https://wayzata.nutrislice.com',
          referer: 'https://wayzata.nutrislice.com/',
          'x-nutrislice-origin': 'wayzata.nutrislice.com',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${config.label}: ${response.status}`);
      }

      const payload = await response.json();
      return {
        meal: key,
        label: config.label,
        days: normalizeMenuResponse(payload, today),
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
