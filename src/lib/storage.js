export function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(`kavach:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function writeLocal(key, value) {
  try {
    localStorage.setItem(`kavach:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function clearLocal() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("kavach:"))
      .forEach((k) => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
export function downloadJson(data, filename) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
