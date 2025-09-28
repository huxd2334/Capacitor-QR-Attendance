export function fmtCoord(v, max = 5) {
  if (v == null || v === '' || Number.isNaN(Number(v))) return '';
  return Number(v).toLocaleString('en-US', {
    maximumFractionDigits: max,
    useGrouping: false, // không chèn dấu phân cách hàng nghìn
  });
}
