export function loadList() {
  try {
    return JSON.parse(localStorage.getItem('qr_attendance_list') || '[]');
  } catch {
    return [];
  }
}

export function saveList(list) {
  localStorage.setItem('qr_attendance_list', JSON.stringify(list));
}

export function addRecord(rec) {
  const list = loadList();
  list.unshift(rec); // mới nhất lên đầu
  saveList(list);
}

export function clearAll() {
  localStorage.removeItem('qr_attendance_list');
}
