export async function askNotificationPermission() {
  try {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function notify(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification(title, { body });
  } catch {}
}

export async function getLocationOnce() {
  if (!('geolocation' in navigator)) return {};
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      _ => resolve({}),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}
