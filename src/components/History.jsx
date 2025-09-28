import { useEffect, useState } from 'react';
import { loadList, clearAll } from '../lib/storage';
import { exportCSV } from '../lib/csv';

export default function History({ refreshKey }) {
  const [list, setList] = useState([]);

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

  return (
    <div className="card">
      <div className="row">
        <h2>Lịch sử điểm danh</h2>
        <div className="spacer" />
        <button onClick={handleExport}>Xuất CSV</button>
        <button className="danger" onClick={handleReset}>Reset</button>
      </div>

      {list.length === 0 ? (
        <p className="muted">Chưa có bản ghi.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>MSSV</th>
                <th>Thời gian</th>
                <th>Vĩ độ</th>
                <th>Kinh độ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, idx) => (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>{r.mssv}</td>
                  <td>{new Date(r.timeISO).toLocaleString()}</td>
                  <td>{r.lat ?? ''}</td>
                  <td>{r.lng ?? ''}</td>
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
