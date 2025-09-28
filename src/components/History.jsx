import { useEffect, useState } from 'react';
import { loadList, clearAll } from '../lib/storage';
import { exportCSV } from '../lib/csv';
import { resolvePlace } from '../lib/geoName';
import { fmtCoord } from '../lib/format';


export default function History({ refreshKey }) {
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setList(loadList());
  }, [refreshKey]);

  const handleExport = () => exportCSV();

  const handleReset = () => {
    if (confirm('Xoá toàn bộ lịch sử điểm danh?')) {
      clearAll();
      setList([]);
    }
  };

  // Tuỳ chọn: điền tên địa điểm cho bản ghi cũ
  const backfillPlaces = async () => {
    const rows = loadList();
    setBusy(true);
    for (const r of rows) {
      if (!r.place && typeof r.lat === 'number' && typeof r.lng === 'number') {
        r.place = await resolvePlace(r.lat, r.lng).catch(() => '');
        await new Promise(res => setTimeout(res, 200)); // tránh rate limit
      }
    }
    localStorage.setItem('qr_attendance_list', JSON.stringify(rows));
    setBusy(false);
    setList(loadList());
  };

  return (
    <div className="card">
      <div className="row">
        <h2>Lịch sử điểm danh</h2>
        <div className="spacer" />
        <button onClick={handleExport}>Xuất CSV</button>
        <button onClick={backfillPlaces} disabled={busy}>
          {busy ? 'Đang cập nhật…' : 'Cập nhật tên địa điểm'}
        </button>
        <button className="danger" onClick={handleReset}>Reset</button>
      </div>

      {list.length === 0 ? (
        <p className="muted">Chưa có bản ghi.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>MSSV</th><th>Thời gian</th><th>Vĩ độ</th><th>Kinh độ</th><th>Địa điểm</th><th>Lượt</th>
            </tr></thead>
            <tbody>
              {list.map((r, idx) => (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>{r.mssv}</td>
                  <td>{new Date((r.lastTimeISO || r.timeISO)).toLocaleString()}</td>
                  <td title={String(r.lat ?? '')}>{fmtCoord(r.lat, 5) || <span className="muted">(đang xác định…)</span>}</td>
                  <td title={String(r.lng ?? '')}>{fmtCoord(r.lng, 5) || <span className="muted">(đang xác định…)</span>}</td>
                  <td>{r.place || (r.lat ? '(đang xác định tên…)' : '')}</td>
                  <td>{r.count || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">Dữ liệu lưu cục bộ (localStorage) — không cần backend.</p>
    </div>
  );
}
