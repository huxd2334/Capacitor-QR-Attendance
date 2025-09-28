import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { upsertRecord, DEDUPE_DEFAULT, updateRecordById } from '../lib/storage';
import { resolvePlace } from '../lib/geoName';
import { requestNativePermissions, getPositionNative,
         hapticSuccess, hapticDuplicate, notifyNative } from '../lib/native';

export default function Scanner({ onScanned }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState('');
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const readerRef = useRef(null);
  const lastTextRef = useRef('');

  useEffect(() => {
    if (!started) return;
    let stop;
    const reader = new BrowserQRCodeReader();
    readerRef.current = reader;

    (async () => {
      try {
        setRunning(true);
        setErr('');

        // chọn camera sau nếu có
        let deviceId;
        try {
          const devices = await BrowserQRCodeReader.listVideoInputDevices();
          const cams = devices || [];
          const back = cams.find(d => /back|rear|environment/i.test(d.label));
          deviceId = (back || cams[cams.length - 1] || {}).deviceId;
        } catch {}

        stop = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          async (result) => {
            if (!result) return;

            const raw = (result.getText() || '').trim();
            if (!raw.startsWith('ATTEND:')) return;
            if (lastTextRef.current === raw) return;
            lastTextRef.current = raw;

            const mssv = raw.replace('ATTEND:', '').trim();
            if (!/^[A-Za-z0-9_-]{3,}$/.test(mssv)) return;

            const timeISO = new Date().toISOString();

            // 1) Lưu trước (lat/lng/place rỗng)
            const insertRes = upsertRecord({
              id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
              mssv, timeISO, lat: undefined, lng: undefined, place: ''
            }, DEDUPE_DEFAULT);

            if (insertRes.action === 'ignore') {
              await hapticDuplicate();
              const txt = insertRes.reason === 'DUP_DAILY'
                ? `MSSV ${mssv} đã điểm danh hôm nay.`
                : `MSSV ${mssv} vừa điểm danh gần đây.`;
              await notifyNative('Bỏ qua điểm danh trùng', txt);
              return;
            }

            // 2) Phản hồi ngay cho người dùng
            await hapticSuccess();
            await notifyNative('Điểm danh thành công', `${mssv} • ${new Date(timeISO).toLocaleString()}`);
            onScanned && onScanned();

            // 3) Enrich vị trí + địa điểm ASYNC (không chặn UI)
            (async () => {
              try {
                const pos = await getPositionNative(6000); // timeout 6s
                if (typeof pos.lat === 'number' && typeof pos.lng === 'number') {
                  const place = await resolvePlace(pos.lat, pos.lng);
                  const updated = updateRecordById(insertRes.record?.id || insertRes.id || mssv, {
                    lat: pos.lat, lng: pos.lng, place
                  });
                  // gọi refresh UI sau khi enrich
                  onScanned && onScanned();
                }
              } catch { /* im lặng */ }
            })();
          }
        );

        try { await videoRef.current?.play?.(); } catch {}
      } catch (e) {
        setErr(e?.message || 'Không thể mở camera. Vui lòng cấp quyền hoặc thử lại.');
        setRunning(false);
      }
    })();

    return () => {
      try { stop && stop.stop && stop.stop(); } catch {}
      try { readerRef.current && readerRef.current.reset && readerRef.current.reset(); } catch {}
      setRunning(false);
    };
  }, [started, onScanned]);

  return (
    <div className="card">
      <h2>Quét QR</h2>

      {!started && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={async () => {
            await requestNativePermissions(); // xin quyền native 1 lần
            setStarted(true);
          }}>
            Bắt đầu quét
          </button>
          <p className="muted" style={{ marginTop: 8 }}>
            Nhấn nút để cấp quyền camera/vị trí/thông báo và bắt đầu.
          </p>
        </div>
      )}

      <video ref={videoRef} className="video" muted playsInline />

      {!running && started && <p className="muted">Đang mở camera…</p>}
      {err && <p className="error">{String(err)}</p>}

      <p className="muted">
        Định dạng hợp lệ: <code>ATTEND:&lt;MSSV&gt;</code>
      </p>
    </div>
  );
}
