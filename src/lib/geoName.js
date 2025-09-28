export async function resolvePlace(lat, lng) {
  try {
    if (typeof lat !== 'number' || typeof lng !== 'number') return '';
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const j = await res.json();
    // BigDataCloud trả về nhiều cấp; ghép gọn ưu tiên suburb/locality/city, district, province, country
    const parts = [
      j.localityInfo?.administrative?.find(x => x.order === 5)?.name || j.locality || j.city || j.suburb, // phường/xã/thị trấn
      j.localityInfo?.administrative?.find(x => x.order === 6)?.name || j.postcode || j.principalSubdivisionLocal || j.principalSubdivision, // quận/huyện/thị xã
      j.principalSubdivisionLocal || j.principalSubdivision, // tỉnh/thành phố
      j.countryName || j.countryNameNative || j.countryCode // quốc gia
    ].filter(Boolean);
    // Lọc trùng và rỗng
    const seen = new Set();
    const pretty = parts.filter(p => { const k = String(p).trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; }).join(', ');
    return pretty;
  } catch {
    return '';
  }
}
