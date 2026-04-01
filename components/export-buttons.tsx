"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { Snapshot } from "@/lib/types";

type ExportKind = "people" | "donations" | "activities";

const columnPresets: Record<ExportKind, string[]> = {
  people: ["fullName", "email", "phone", "area", "region", "funnelStage", "assignedTo"],
  donations: ["donor", "amount", "date", "campaign", "status"],
  activities: ["title", "area", "modality", "sessions", "approvalThreshold", "dateLabel", "attendees"]
};

function downloadWorkbook(filename: string, rows: Array<Record<string, unknown>>) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Datos");
  XLSX.writeFile(workbook, filename);
}

export function ExportButtons({ snapshot }: { snapshot: Snapshot }) {
  const exportRows = (kind: ExportKind) => {
    const columns = columnPresets[kind];
    const source =
      kind === "people" ? snapshot.people : kind === "donations" ? snapshot.donations : snapshot.activities;

    const rows = source.map((item) =>
      Object.fromEntries(columns.map((column) => [column, item[column as keyof typeof item]]))
    );

    downloadWorkbook(`ideapais_${kind}.xlsx`, rows);
  };

  const templates = {
    personas: [{ fullName: "", email: "", phone: "", area: "", region: "", funnelStage: "", assignedTo: "", routeName: "", tags: "" }],
    donaciones: [{ donor: "", amount: "", date: "", campaign: "", status: "" }],
    asistencias: [{ activityTitle: "", sessionNumber: "", personEmail: "", attended: "", specialApprovalPassed: "", notes: "" }]
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => exportRows("people")} className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm font-semibold text-white">
        <Download className="h-4 w-4" />
        Exportar personas
      </button>
      <button type="button" onClick={() => exportRows("donations")} className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink">
        <Download className="h-4 w-4" />
        Exportar donaciones
      </button>
      <button type="button" onClick={() => exportRows("activities")} className="inline-flex items-center gap-2 rounded-full border border-brand-ink/15 px-4 py-2 text-sm font-semibold text-brand-ink">
        <Download className="h-4 w-4" />
        Exportar actividades
      </button>
      <button type="button" onClick={() => downloadWorkbook("plantilla_personas.xlsx", templates.personas)} className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-sand px-4 py-2 text-sm font-semibold text-brand-ink">
        <Download className="h-4 w-4" />
        Plantilla personas
      </button>
      <button type="button" onClick={() => downloadWorkbook("plantilla_donaciones.xlsx", templates.donaciones)} className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-sand px-4 py-2 text-sm font-semibold text-brand-ink">
        <Download className="h-4 w-4" />
        Plantilla donaciones
      </button>
      <button type="button" onClick={() => downloadWorkbook("plantilla_asistencias.xlsx", templates.asistencias)} className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-sand px-4 py-2 text-sm font-semibold text-brand-ink">
        <Download className="h-4 w-4" />
        Plantilla asistencias
      </button>
    </div>
  );
}
