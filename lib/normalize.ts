export function toTitleCase(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/(?:^|\s|-)\S/g, (letter) => letter.toUpperCase());
}

export function formatRutSimple(value: string | null | undefined) {
  const clean = (value ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export function formatPhone(value: string | null | undefined) {
  let digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("56") && digits.length >= 10) {
    digits = digits.slice(2);
  }
  if (digits.length === 8) {
    digits = `9${digits}`;
  }
  return digits;
}

export function formatEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}
