"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";

const initialRows = [
  { id: "1", name: "Catalina Rojas", attendance: 3, threshold: 3, specialApproval: true },
  { id: "2", name: "Benjamín Soto", attendance: 1, threshold: 3, specialApproval: false },
  { id: "3", name: "Martina Ruiz", attendance: 2, threshold: 3, specialApproval: true }
];

export function AttendanceBoard() {
  const [rows, setRows] = useState(initialRows);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const approved = row.attendance >= row.threshold && row.specialApproval;

        return (
          <div key={row.id} className="grid gap-3 rounded-3xl border border-brand-ink/10 bg-brand-sand/60 p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <div>
              <p className="font-semibold text-brand-ink">{row.name}</p>
              <p className="text-sm text-brand-ink/70">El sistema puede derivar automáticamente el hito cuando cumple asistencia + criterio especial.</p>
            </div>
            <label className="text-sm text-brand-ink/70">
              Sesiones asistidas
              <input
                type="number"
                min={0}
                max={4}
                value={row.attendance}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setRows((current) => current.map((item) => (item.id === row.id ? { ...item, attendance: next } : item)));
                }}
                className="mt-2 w-full rounded-2xl border border-brand-ink/15 bg-white px-3 py-2 text-brand-ink"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-brand-ink/10 bg-white px-3 py-2 text-sm text-brand-ink">
              <input
                type="checkbox"
                checked={row.specialApproval}
                onChange={(event) => {
                  setRows((current) => current.map((item) => (item.id === row.id ? { ...item, specialApproval: event.target.checked } : item)));
                }}
              />
              Aprobación especial
            </label>
            <div className="flex items-center justify-end">
              {approved ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Aprueba
                </span>
              ) : row.attendance >= row.threshold ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                  <TriangleAlert className="h-4 w-4" />
                  Falta validación
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-fog px-3 py-2 text-sm font-semibold text-brand-ink">
                  <CircleDashed className="h-4 w-4" />
                  En proceso
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
