const pad = (value: number) => String(value).padStart(2, "0");

const toDisplayDate = (value: string | Date): Date => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number) as [number, number, number];
    return new Date(year, month - 1, day);
  }

  return new Date(value);
};

export function formatDisplayDate(value: string | Date): string {
  const date = toDisplayDate(value);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDisplayDateTime(value: string | Date): string {
  const date = new Date(value);
  return `${formatDisplayDate(date)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
