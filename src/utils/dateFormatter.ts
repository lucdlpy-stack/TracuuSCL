/**
 * Formats ISO date string or timestamp into clean Vietnamese Date & Time string.
 * Example:
 * "2026-10-16T14:45:10.000Z" -> "14:45:10 16/10/2026"
 */
export function formatVietnameseDateTime(dateStr?: string | number | Date | null): string {
  if (!dateStr) return 'Mới khởi tạo';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Short date format without seconds: "14:45 16/10/2026"
 */
export function formatShortDateTime(dateStr?: string | number | Date | null): string {
  if (!dateStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}
