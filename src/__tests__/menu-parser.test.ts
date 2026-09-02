import { describe, expect, it } from 'vitest';
import { parseNutrislicePageHtml } from '../menu-parser';

describe('parseNutrislicePageHtml', () => {
  it('keeps days with items even when they are before today', () => {
    const today = new Date('2026-09-02T12:00:00Z');
    const html = `
      <html>
        <body>
          <div class="menu-date">Tue, Sep 1, 2026</div>
          <h3>Choice 1</h3>
          <ul><li>Salad</li></ul>
          <div class="menu-date">Wed, Sep 2, 2026</div>
          <h3>Choice 1</h3>
          <ul><li>Eggs</li><li>Toast</li></ul>
          <h3>Choice 2</h3>
          <ul><li>Pancakes</li></ul>
          <div class="menu-date">Thu, Sep 3, 2026</div>
          <h3>Choice 1</h3>
          <ul><li>Soup</li></ul>
        </body>
      </html>
    `;

    const result = parseNutrislicePageHtml(html, today);
    expect(result.map((day) => day.date.toISOString().slice(0, 10))).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    expect(result[0].items).toEqual(['Salad']);
    expect(result[1].items).toEqual(['Eggs', 'Toast', 'Pancakes']);
    expect(result[2].items).toEqual(['Soup']);
  });
});
