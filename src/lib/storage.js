export function loadList() {
  try { return JSON.parse(localStorage.getItem('qr_attendance_list') || '[]'); }
  catch { return []; }
}
export function saveList(list) {
  localStorage.setItem('qr_attendance_list', JSON.stringify(list));
}
export function addRecord(rec) {
  const list = loadList();
  list.unshift(rec);
  saveList(list);
}
export function clearAll() {
  localStorage.removeItem('qr_attendance_list');
}

export const DEDUPE_DEFAULT = { mode: 'daily', windowSec: 60 };

function sameDay(isoA, isoB) {
  if (!isoA || !isoB) return false;
  const a = new Date(isoA), b = new Date(isoB);
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function upsertRecord(newRec, dedupe = DEDUPE_DEFAULT) {
  const list = loadList();
  const nowISO = newRec.timeISO;
  const mssv = newRec.mssv;

  const indices = list
    .map((r, i) => ({ r, i }))
    .filter(x => x.r.mssv === mssv);

  const latest = indices.length ? indices[0] : null; // vì list.unshift nên [0] là mới nhất

  if (dedupe.mode === 'daily') {
    if (latest && sameDay(latest.r.timeISO || latest.r.firstTimeISO || latest.r.lastTimeISO, nowISO)) {
      return { action: 'ignore', reason: 'DUP_DAILY', existing: latest.r };
    }
    list.unshift({ ...newRec, count: 1 }); // lưu bình thường
    saveList(list);
    return { action: 'insert', record: list[0] };
  }

  if (dedupe.mode === 'window') {
    const sec = Number(dedupe.windowSec || 60);
    if (latest) {
      const lastTime = new Date(latest.r.timeISO || latest.r.lastTimeISO || latest.r.firstTimeISO).getTime();
      const now = new Date(nowISO).getTime();
      if (!isNaN(lastTime) && now - lastTime < sec * 1000) {
        return { action: 'ignore', reason: 'DUP_WINDOW', existing: latest.r };
      }
    }
    list.unshift({ ...newRec, count: 1 });
    saveList(list);
    return { action: 'insert', record: list[0] };
  }

  if (dedupe.mode === 'unique') {
    if (latest) {
      const updated = {
        ...latest.r,
        lastTimeISO: nowISO,
        count: (latest.r.count || 1) + 1,
        lat: (typeof newRec.lat === 'number') ? newRec.lat : latest.r.lat,
        lng: (typeof newRec.lng === 'number') ? newRec.lng : latest.r.lng,
        place: newRec.place || latest.r.place,
      };
      list[latest.i] = updated;
      saveList(list);
      return { action: 'update', record: updated };
    } else {
      list.unshift({
        ...newRec,
        firstTimeISO: nowISO,
        lastTimeISO: nowISO,
        count: 1
      });
      saveList(list);
      return { action: 'insert', record: list[0] };
    }
  }

  list.unshift({ ...newRec, count: 1 });
  saveList(list);
  return { action: 'insert', record: list[0] };
}
export function updateRecordById(id, patch) {
  const list = loadList();
  const idx = list.findIndex(r => r.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    saveList(list);
    return list[idx];
  }
  return null;
}

