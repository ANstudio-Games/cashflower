/**
 * Date formatting helpers in Indonesian (id-ID)
 */

const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${day} ${BULAN_SINGKAT[monthIdx] || ''} ${year}`;
}

export function formatDateFull(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T00:00:00');
  if (isNaN(d.getTime())) return isoDate;
  const dayName = HARI_INDO[d.getDay()];
  const day = d.getDate();
  const month = BULAN_INDO[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatMonthYear(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length < 2) return isoDate;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${BULAN_INDO[monthIdx] || ''} ${year}`;
}

export function getRelativeDateLabel(isoDate: string): string {
  const today = getTodayISO();
  if (isoDate === today) return 'Hari Ini';

  const dToday = new Date(today + 'T00:00:00');
  const dTarget = new Date(isoDate + 'T00:00:00');
  const diffDays = Math.round((dToday.getTime() - dTarget.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Kemarin';
  if (diffDays === -1) return 'Besok';
  return formatDateShort(isoDate);
}
