import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { addRecord } from '../lib/storage';
import { getLocationOnce, notify } from '../lib/permissions';

export default function Scanner({ onScanned }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState('');
  const [running, setRunning] = useState(false);
  const qrRef = useRef(null);
  const lastHitRef = useRef('');

  useEffect(() => {
    const qr = new BrowserQRCodeReader();
    qrRef.current = qr;

    let stopCtrl;

    (async () => {
      try {
        setRunning(true);
        setErr('');
        stopCtrl = await qr.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          async (result, _e, controls) => {
            if (result) {
              const text = (result.getText() || '').trim();
              if (!text.startsWith('ATTEND:')) return;
              if (lastHitRef.current === text) return; // tránh spam trùng
              lastHitRef.current = text;

              const mssv = text.replace('ATTEND:', '').trim();
              if (!/^[A-Za-z0-9_-]{3,}$/.test(mssv)) return;

              const timeISO = new Date().toISOString();
              const { lat, lng } = await getLocationOnce();

              addRecord({
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                mssv, timeISO, lat, lng
              });

              if ('vibrate' in navigator && navigator.vibrate) navigator.vibrate(60);
              await notify('Điểm danh thành công', `${mssv} • ${new Date(timeISO).toLocaleString()}`);

              onScanned?.();
            }
          }
        );
      } catch (e) {
        setErr(e?.message || 'Không thể mở camera. Hãy cấp quyền hoặc thử trên https/ứng dụng.');
        setRunning(false);
      }
    })();

    return () => {
      try {
        if (stopCtrl && stopCtrl.stop) stopCtrl.stop();
        qrRef.current?.reset?.();
      } catch {}
    };
  }, [onScanned]);

  return (
    <div className="card">
      <h2>Quét QR</h2>
      <video ref={videoRef} className="video" muted playsInline />
      {!running && <p className="muted">Nếu camera không mở, thử reload hoặc cấp quyền.</p>}
      {err && <p className="error">{err}</p>}
      <p className="muted">
        Định dạng hợp lệ: <code>ATTEND:&lt;MSSV&gt;</code>
      </p>
    </div>
  );
}
