import { DedupeCase, DedupeSignalType, Person } from "@/lib/types";

export function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function normalizePhone(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("56")) return digits;
  if (digits.length === 9) return `56${digits}`;
  return digits;
}

export function normalizeRut(value: string | null | undefined) {
  const cleaned = (value ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (!cleaned) return "";
  if (cleaned.length <= 1) return cleaned;
  return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
}

export function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueSignals(signals: DedupeSignalType[]) {
  return Array.from(new Set(signals));
}

export function inferDedupeCasesFromPeople(people: Person[]): DedupeCase[] {
  const cases: DedupeCase[] = [];

  for (let index = 0; index < people.length; index += 1) {
    for (let candidateIndex = index + 1; candidateIndex < people.length; candidateIndex += 1) {
      const primary = people[index];
      const candidate = people[candidateIndex];
      const signals: DedupeSignalType[] = [];

      const primaryEmail = normalizeEmail(primary.email);
      const candidateEmail = normalizeEmail(candidate.email);
      const primaryPhone = normalizePhone(primary.phone);
      const candidatePhone = normalizePhone(candidate.phone);
      const primaryName = normalizeName(primary.fullName);
      const candidateName = normalizeName(candidate.fullName);
      const primaryRut = normalizeRut((primary as Person & { rut?: string }).rut);
      const candidateRut = normalizeRut((candidate as Person & { rut?: string }).rut);

      if (primaryRut && candidateRut && primaryRut === candidateRut) signals.push("RUT");
      if (primaryEmail && candidateEmail && primaryEmail === candidateEmail) signals.push("EMAIL");
      if (primaryPhone && candidatePhone && primaryPhone === candidatePhone) signals.push("PHONE");
      if (primaryName && candidateName && primaryName === candidateName) signals.push("NAME");

      const unique = uniqueSignals(signals);
      if (!unique.length) continue;

      const autoMerged = unique.includes("RUT") || unique.includes("EMAIL") || unique.includes("PHONE");
      const confidence =
        unique.includes("RUT") ? 1 : unique.includes("EMAIL") ? 0.99 : unique.includes("PHONE") ? 0.95 : 0.72;

      cases.push({
        id: `${primary.id}-${candidate.id}`,
        status: autoMerged ? "AUTO_MERGED" : "PENDING_REVIEW",
        confidence,
        primaryPersonId: primary.id,
        primaryName: primary.fullName,
        candidatePersonId: candidate.id,
        candidateName: candidate.fullName,
        matchedSignals: unique,
        summary: buildSummary(unique, autoMerged),
        createdAt: new Date().toISOString()
      });
    }
  }

  return cases;
}

function buildSummary(signals: DedupeSignalType[], autoMerged: boolean) {
  const labels = {
    RUT: "RUT",
    EMAIL: "email",
    PHONE: "teléfono",
    NAME: "nombre completo"
  };

  const matched = signals.map((signal) => labels[signal]).join(", ");

  if (autoMerged) {
    return `Coincidencia fuerte por ${matched}. Debe quedar auditada aunque se fusione bajo el mismo ID canónico.`;
  }

  return `Coincidencia débil por ${matched}. Se requiere callback humano antes de fusionar registros.`;
}
