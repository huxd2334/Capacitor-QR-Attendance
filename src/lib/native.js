import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNativePermissions() {
  try { await LocalNotifications.requestPermissions(); } catch {}
  try { await Geolocation.requestPermissions(); } catch {}
}

export async function getPositionNative(timeoutMs = 6000) {
  const useNative = Capacitor.isNativePlatform?.() || Capacitor.getPlatform?.() === 'android';
  // Native trước, web fallback
  if (useNative) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), timeoutMs);
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: timeoutMs,
      });
      clearTimeout(t);
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}
  }
  // Fallback web
  if (!('geolocation' in navigator)) return {};
  return new Promise((resolve) => {
    const done = (o) => resolve(o);
    const timer = setTimeout(() => done({}), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      p => { clearTimeout(timer); done({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      _ => { clearTimeout(timer); done({}); },
      { enableHighAccuracy: true, timeout: timeoutMs }
    );
  });
}

export async function hapticSuccess() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    try { navigator.vibrate && navigator.vibrate(60); } catch {}
  }
}
export async function hapticDuplicate() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    try { navigator.vibrate && navigator.vibrate([40,30,40]); } catch {}
  }
}
export async function hapticError() {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    try { navigator.vibrate && navigator.vibrate([90,60,90]); } catch {}
  }
}

export async function notifyNative(title, body) {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 1e9),
        title,
        body,
        schedule: { at: new Date(Date.now() + 10) } // ngay lập tức
      }]
    });
  } catch {
    // Fallback web
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'default') await Notification.requestPermission();
        if (Notification.permission === 'granted') new Notification(title, { body });
      }
    } catch {}
  }
}
