import { describe, expect, it } from 'vitest';
import { mergeMenuDays, normalizeMenuResponse } from '../menu-data';

const sampleResponse = {
  start_date: '2026-08-31',
  days: [
    {
      date: '2026-08-30',
      menu_items: []
    },
    {
      date: '2026-08-31',
      menu_items: [
        { is_section_title: true, text: 'Choice 1', station_id: 1 },
        { is_section_title: false, food: { name: 'Smoothie' }, station_id: 1 },
        { is_section_title: false, food: { name: 'Fresh Fruit' }, station_id: 1 },
        { is_section_title: true, text: 'Choice 2', station_id: 2 },
        { is_section_title: false, food: { name: 'Bagel' }, station_id: 2 }
      ]
    },
    {
      date: '2026-09-01',
      menu_items: [
        { is_section_title: true, text: 'Hot Entree', station_id: 3 },
        { is_section_title: false, food: { name: 'Pancakes' }, station_id: 3 }
      ]
    }
  ]
};

describe('normalizeMenuResponse', () => {
  it('filters empty days and keeps only date groups with items', () => {
    const today = new Date('2026-08-31T12:00:00Z');
    const result = normalizeMenuResponse(sampleResponse, today);

    expect(result.map((day) => day.date.toISOString().slice(0, 10))).toEqual([
      '2026-08-31',
      '2026-09-01'
    ]);

    expect(result[0].sections).toEqual([
      { title: 'Choice 1', items: ['Smoothie', 'Fresh Fruit'] },
      { title: 'Choice 2', items: ['Bagel'] }
    ]);
  });

  it('excludes days before today', () => {
    const today = new Date('2026-09-01T12:00:00Z');
    const result = normalizeMenuResponse(sampleResponse, today);
    expect(result.map((day) => day.date.toISOString().slice(0, 10))).toEqual(['2026-09-01']);
  });

  it('keeps only dates within the selected horizon', () => {
    const today = new Date('2026-08-31T12:00:00Z');
    const maxDate = new Date('2026-09-13T12:00:00Z');
    const response = {
      days: [
        { date: '2026-08-30', menu_items: [{ is_section_title: true, text: 'Old', food: null }] },
        { date: '2026-08-31', menu_items: [{ is_section_title: true, text: 'Today', food: null }, { is_section_title: false, food: { name: 'Eggs' } }] },
        { date: '2026-09-02', menu_items: [{ is_section_title: true, text: 'Tomorrow', food: null }, { is_section_title: false, food: { name: 'Toast' } }] },
        { date: '2026-09-14', menu_items: [{ is_section_title: true, text: 'Too far', food: null }, { is_section_title: false, food: { name: 'Soup' } }] }
      ]
    };

    const result = normalizeMenuResponse(response, today, maxDate);
    expect(result.map((day) => day.date.toISOString().slice(0, 10))).toEqual(['2026-08-31', '2026-09-02']);
  });

  it('deduplicates overlapping weekly payloads', () => {
    const today = new Date('2026-09-02T12:00:00Z');
    const maxDate = new Date('2026-09-30T12:00:00Z');
    const payloads = [
      {
        days: [
          { date: '2026-09-02', menu_items: [{ is_section_title: true, text: 'Choice 1', food: null }, { is_section_title: false, food: { name: 'Eggs' } }] },
          { date: '2026-09-03', menu_items: [{ is_section_title: true, text: 'Choice 1', food: null }, { is_section_title: false, food: { name: 'Toast' } }] }
        ]
      },
      {
        days: [
          { date: '2026-09-02', menu_items: [{ is_section_title: true, text: 'Choice 1', food: null }, { is_section_title: false, food: { name: 'Eggs' } }] },
          { date: '2026-09-04', menu_items: [{ is_section_title: true, text: 'Choice 1', food: null }, { is_section_title: false, food: { name: 'Oats' } }] }
        ]
      }
    ];

    const result = mergeMenuDays(payloads, today, maxDate);
    expect(result.map((day) => day.date.toISOString().slice(0, 10))).toEqual(['2026-09-02', '2026-09-03', '2026-09-04']);
  });
});
