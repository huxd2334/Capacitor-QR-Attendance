import { loadList } from './storage';

export function toCSV(rows) {
  const header = ['id','mssv','timeISO','lat','lng'];
  const lines = [header.join(',')];
  for (const r of rows) {
    // CSV đơn giản (nếu có dấu phẩy, nên wrap thêm "..." và escape nếu cần)
    lines.push([r.id, r.mssv, r.timeISO, r.lat ?? '', r.lng ?? ''].join(','));
  }
  return lines.join('\n');
}

export function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV() {
  const csv = toCSV(loadList());
  const name = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
  downloadCSV(name, csv);
}
