// Newest first: anything still going (no end date) on top, then by end date, then by start date.
// The backend already sorts this way; the frontend sorts too, so the mock API's order doesn't matter.
export function newestFirst<T extends { startDate: Date; endDate: Date }>(list: T[]): T[] {
  const time = (date: Date) => date ? +new Date(date) : Infinity;
  return [...list].sort((a, b) => (time(b.endDate) - time(a.endDate)) || (time(b.startDate) - time(a.startDate)));
}
