type DateInput = string | null | undefined;

function parseDate(value: DateInput) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
) {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return parsed.toLocaleDateString(undefined, options);
}
