import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { loadList } from './storage';


export function toCSV(rows) {
  const header = ['id','mssv','timeISO','lat','lng','place'];
  const lines = [header.join(',')];
  const esc = (s) => (s == null) ? '' : `"${String(s).replace(/"/g,'""')}"`;
  for (const r of rows) {
    lines.push([
      r.id, r.mssv, r.timeISO,
      r.lat ?? '', r.lng ?? '',
      esc(r.place)
    ].join(','));
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


export async function exportCSV(rows = loadList()) {
  const csv = toCSV(rows);
  const filename = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
  if (Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    try {
      // Ghi vào Documents (nếu lỗi thì fallback Cache)
      let uri;
      try {
        const res = await Filesystem.writeFile({
          path: filename,
          data: csv,
          directory: Directory.Documents,
          encoding: 'utf8', // ghi text, không cần base64
        });
        uri = res.uri;
      } catch {
        const res = await Filesystem.writeFile({
          path: filename,
          data: csv,
          directory: Directory.Cache,
          encoding: 'utf8',
        });
        uri = res.uri;
      }

      // Mở share sheet để lưu/chia sẻ
      await Share.share({
        title: 'QR Attendance — CSV',
        text: filename,
        url: uri,              // content:// hoặc file:// hợp lệ
        dialogTitle: 'Chia sẻ CSV'
      });
      return;
    } catch (e) {
      console.warn('Native export failed, fallback to web download:', e);
    }
  }
  downloadCSV(filename, csv);
}

