import { Snapshot } from "@/lib/types";

export const demoSnapshot: Snapshot = {
  metrics: [
    { label: "Personas activas", value: "1.248", detail: "Con trazabilidad de área, responsable y etapa." },
    { label: "Jóvenes en ruta", value: "386", detail: "Distribuidos entre Santiago y regiones." },
    { label: "Asistencias del semestre", value: "2.931", detail: "Registrables por equipo y exportables a Excel." },
    { label: "Donaciones vigentes", value: "$48,5M", detail: "Con directorio de activación y estado transaccional." }
  ],
  people: [
    {
      id: "p-1",
      fullName: "Catalina Rojas",
      email: "catalina@ideapais.cl",
      phone: "+56 9 8888 1111",
      area: "FORMACION",
      region: "Santiago - Universitario",
      roleScope: "ENCARGADO",
      funnelStage: "EN_RUTA",
      tags: ["liderazgo", "universitario"],
      assignedTo: "Kevin Canales",
      routeId: "r-1",
      institution: "Universidad de los Andes",
      lastActivityAt: "2026-03-26"
    },
    {
      id: "p-2",
      fullName: "Tomás Fuentes",
      email: "tomas@ideapais.cl",
      phone: "+56 9 7777 2121",
      area: "DESARROLLO",
      region: "Santiago",
      roleScope: "USUARIO",
      funnelStage: "DONANTE",
      tags: ["aportante mensual", "hubspot"],
      assignedTo: "María Jesús del Río",
      lastActivityAt: "2026-03-30"
    },
    {
      id: "p-3",
      fullName: "Josefina Müller",
      email: "josefina@ideapais.cl",
      phone: "+56 9 6666 3434",
      area: "INTERNACIONAL",
      region: "Santiago",
      roleScope: "SUBENCARGADO",
      funnelStage: "CONTACTO_ACTIVO",
      tags: ["funding", "alianzas"],
      assignedTo: "Paula Echeverría",
      institution: "Konrad Adenauer Stiftung",
      lastActivityAt: "2026-03-18"
    },
    {
      id: "p-4",
      fullName: "Nicolás Saavedra",
      email: "nicolas@ideapais.cl",
      phone: "+56 9 5555 9898",
      area: "ESTUDIOS",
      region: "Biobío",
      roleScope: "USUARIO",
      funnelStage: "VOLUNTARIO",
      tags: ["seminarios", "investigación"],
      assignedTo: "Felipe Cortés",
      institution: "Universidad San Sebastián",
      lastActivityAt: "2026-03-29"
    },
    {
      id: "p-5",
      fullName: "Isidora Arancibia",
      email: "isidora@ideapais.cl",
      phone: "+56 9 4444 5656",
      area: "COMUNICACIONES",
      region: "Santiago",
      roleScope: "ADMIN",
      funnelStage: "CONTACTO_ACTIVO",
      tags: ["segmentación", "newsletter"],
      assignedTo: "Dirección Ejecutiva",
      lastActivityAt: "2026-03-31"
    }
  ],
  activities: [
    {
      id: "a-1",
      title: "Escuela Política | Módulo 1",
      area: "FORMACION",
      modality: "PRESENCIAL",
      routeIds: ["r-1"],
      milestoneIds: ["m-1"],
      sessions: 4,
      approvalThreshold: 3,
      specialApproval: true,
      dateLabel: "Abril 2026",
      attendees: 42
    },
    {
      id: "a-2",
      title: "Seminario Estado y Sociedad",
      area: "ESTUDIOS",
      modality: "HIBRIDA",
      routeIds: [],
      milestoneIds: [],
      sessions: 1,
      approvalThreshold: 1,
      specialApproval: false,
      dateLabel: "15 abril 2026",
      attendees: 86
    },
    {
      id: "a-3",
      title: "Encuentro de Aliados Internacionales",
      area: "INTERNACIONAL",
      modality: "ONLINE",
      routeIds: [],
      milestoneIds: [],
      sessions: 2,
      approvalThreshold: 2,
      specialApproval: true,
      dateLabel: "22 abril 2026",
      attendees: 19
    }
  ],
  routes: [
    {
      id: "r-1",
      name: "Ruta de Liderazgo Universitario",
      campus: "Santiago - Universitario",
      participants: 132,
      milestones: [
        { id: "m-1", label: "Ingreso y diagnóstico", description: "Captación, entrevista y asignación inicial." },
        { id: "m-2", label: "Formación base", description: "Escuela Política, lectura y asistencia mínima." },
        { id: "m-3", label: "Activación pública", description: "Participación en debates, seminarios y voluntariados." },
        { id: "m-4", label: "Fidelización", description: "Seguimiento, comunidad y derivación a donaciones o vocerías." }
      ]
    },
    {
      id: "r-2",
      name: "Ruta Escolar Santiago",
      campus: "Santiago - Escolar",
      participants: 91,
      milestones: [
        { id: "m-5", label: "Convocatoria", description: "Inscripción y primer contacto." },
        { id: "m-6", label: "Ciclo formativo", description: "Asistencia a talleres y acompañamiento." },
        { id: "m-7", label: "Proyección", description: "Derivación a siguiente programa o red de egresados." }
      ]
    }
  ],
  routeBoard: [
    { personId: "p-1", personName: "Catalina Rojas", currentMilestoneId: "m-2", status: "AL_DIA", nextAction: "Validar trabajo final y mover a activación pública." },
    { personId: "p-6", personName: "Benjamín Soto", currentMilestoneId: "m-1", status: "REQUIERE_CONTACTO", nextAction: "Confirmar asistencia al primer taller." },
    { personId: "p-7", personName: "Martina Ruiz", currentMilestoneId: "m-3", status: "EN_RIESGO", nextAction: "Le faltan 2 sesiones para aprobar el ciclo." }
  ],
  donations: [
    { id: "d-1", donor: "Tomás Fuentes", amount: 250000, date: "2026-03-18", campaign: "Aporte mensual", status: "PAGADA" },
    { id: "d-2", donor: "Fundación Norte", amount: 12500000, date: "2026-04-05", campaign: "Semestre 1", status: "COMPROMETIDA" },
    { id: "d-3", donor: "Red de Amigos IdeaPaís", amount: 4800000, date: "2026-04-11", campaign: "Captación 2026", status: "POR_GESTIONAR" }
  ],
  opportunities: [
    { id: "o-1", title: "Fondo de intercambio regional", area: "INTERNACIONAL", owner: "Josefina Müller", status: "POSTULACION", closeDate: "2026-04-25" },
    { id: "o-2", title: "Convenio seminarios académicos", area: "ESTUDIOS", owner: "Nicolás Saavedra", status: "SCOUTING", closeDate: "2026-05-12" }
  ]
};
