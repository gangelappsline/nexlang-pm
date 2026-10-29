import process from 'node:process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  calendarDays,
  dateKey,
  parseTaskDate,
  startOfWeek,
  taskStatusLabel,
} from '../src/utils/calendar.js';

test('date-only API values retain their local calendar day', () => {
  const previousTZ = process.env.TZ;
  try {
    for (const timezone of ['America/Mexico_City', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = timezone;
      assert.equal(dateKey(parseTaskDate('2026-10-29')), '2026-10-29');
    }
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test('missing and invalid task dates remain unscheduled', () => {
  for (const value of [null, undefined, '', 'invalid']) assert.equal(parseTaskDate(value), null);
});

test('weeks start on Monday and include exactly seven consecutive days', () => {
  const days = calendarDays(new Date(2026, 9, 29), 'week');
  assert.equal(days.length, 7);
  assert.equal(dateKey(days[0]), '2026-10-26');
  assert.equal(dateKey(days[6]), '2026-11-01');
  assert.equal(dateKey(startOfWeek(new Date(2026, 10, 1))), '2026-10-26');
});

test('month grids contain every day, complete weeks, and no duplicate dates', () => {
  for (const year of [2024, 2025, 2026, 2027]) {
    for (let month = 0; month < 12; month++) {
      const days = calendarDays(new Date(year, month, 15), 'month');
      assert.equal(days.length % 7, 0);
      assert.equal(days[0].getDay(), 1);
      assert.equal(days.at(-1).getDay(), 0);
      assert.equal(new Set(days.map(dateKey)).size, days.length);
      assert.equal(
        days.filter((date) => date.getMonth() === month).length,
        new Date(year, month + 1, 0).getDate()
      );
    }
  }
});

test('week navigation crosses year boundaries without mutating its input', () => {
  const date = new Date(2026, 11, 28);
  assert.equal(dateKey(addDays(date, 7)), '2027-01-04');
  assert.equal(dateKey(addDays(date, -7)), '2026-12-21');
  assert.equal(dateKey(date), '2026-12-28');
});

test('task states are displayed in Spanish with safe fallbacks', () => {
  assert.equal(taskStatusLabel('in_progress'), 'En progreso');
  assert.equal(taskStatusLabel('completed'), 'Completada');
  assert.equal(taskStatusLabel('custom'), 'custom');
  assert.equal(taskStatusLabel(null), 'Pendiente');
});
