// Local calendar dates: date-only API values must not shift across time zones.
export const parseTaskDate = (value) => {
  if (!value) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const addDays = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
};

export const startOfWeek = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return addDays(start, -((start.getDay() + 6) % 7));
};

export const calendarDays = (date, view) => {
  const start =
    view === 'month'
      ? startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1))
      : startOfWeek(date);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const count =
    view === 'month' ? Math.round((startOfWeek(last) - start) / 86400000 / 7) * 7 + 7 : 7;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
};

export const taskStatusLabel = (status) =>
  ({
    pending: 'Pendiente',
    in_progress: 'En progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
    rejected: 'Rechazada',
  })[status] ||
  status ||
  'Pendiente';
