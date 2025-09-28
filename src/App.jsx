import { useEffect, useState } from 'react';
import Scanner from './components/Scanner';
import History from './components/History';
import { askNotificationPermission } from './lib/permissions';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('scan');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Hỏi quyền thông báo (không bắt buộc). Bỏ qua nếu người dùng từ chối.
    askNotificationPermission().catch(() => {});
  }, []);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="wrapper">
      <div className="header">
        <h1>QR Attendance</h1>
        <span className="muted">React (JS) + ZXing + Capacitor</span>
      </div>

      <div className="tabs">
        <button onClick={() => setTab('scan')} className={tab === 'scan' ? 'active' : ''}>Quét</button>
        <button onClick={() => setTab('history')} className={tab === 'history' ? 'active' : ''}>Lịch sử</button>
        <button onClick={() => setTab('settings')} className={tab === 'settings' ? 'active' : ''}>Cài đặt</button>
      </div>

      {tab === 'scan' && <Scanner onScanned={bump} />}
      {tab === 'history' && <History refreshKey={refreshKey} />}

      {tab === 'settings' && (
        <div className="card">
          <h2>Cài đặt & Quyền</h2>
          <ul>
            <li className="muted">Camera: xin quyền khi mở tab Quét. Nếu bị chặn, mở cài đặt để bật lại.</li>
            <li className="muted">Vị trí: chỉ lấy một lần khi quét (nếu bạn cho phép).</li>
            <li className="muted">Thông báo: dùng để báo “điểm danh thành công” (nếu thiết bị hỗ trợ).</li>
          </ul>
          <p className="muted">
            Gợi ý: chạy trên HTTPS hoặc trong app Capacitor để camera hoạt động ổn định.
          </p>
        </div>
      )}
    </div>
  );
}
