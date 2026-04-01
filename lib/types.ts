export type Role = "ADMIN" | "ENCARGADO" | "SUBENCARGADO" | "USUARIO";

export type AreaSlug =
  | "COMUNICACIONES"
  | "DESARROLLO"
  | "ESTUDIOS"
  | "INTERNACIONAL"
  | "EDITORIAL"
  | "FORMACION";

export type FunnelStage =
  | "CAPTACION"
  | "CONTACTO_ACTIVO"
  | "EN_RUTA"
  | "EGRESADO"
  | "VOLUNTARIO"
  | "DONANTE"
  | "DATO_DORMIDO";

export type Person = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  area: AreaSlug;
  region: string;
  roleScope: Role;
  funnelStage: FunnelStage;
  tags: string[];
  assignedTo: string;
  routeId?: string;
  institution?: string;
  lastActivityAt: string;
};

export type Activity = {
  id: string;
  title: string;
  area: AreaSlug;
  modality: "PRESENCIAL" | "ONLINE" | "HIBRIDA";
  routeIds: string[];
  milestoneIds: string[];
  sessions: number;
  approvalThreshold: number;
  specialApproval: boolean;
  dateLabel: string;
  attendees: number;
};

export type RouteMilestone = {
  id: string;
  label: string;
  description: string;
};

export type FormationRoute = {
  id: string;
  name: string;
  campus: string;
  participants: number;
  milestones: RouteMilestone[];
};

export type RouteBoardCard = {
  personId: string;
  personName: string;
  currentMilestoneId: string;
  status: "AL_DIA" | "EN_RIESGO" | "REQUIERE_CONTACTO";
  nextAction: string;
};

export type Donation = {
  id: string;
  donor: string;
  amount: number;
  date: string;
  campaign: string;
  status: "COMPROMETIDA" | "PAGADA" | "POR_GESTIONAR";
};

export type Opportunity = {
  id: string;
  title: string;
  area: AreaSlug;
  owner: string;
  status: "SCOUTING" | "POSTULACION" | "SEGUIMIENTO";
  closeDate: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type Snapshot = {
  metrics: DashboardMetric[];
  people: Person[];
  activities: Activity[];
  routes: FormationRoute[];
  routeBoard: RouteBoardCard[];
  donations: Donation[];
  opportunities: Opportunity[];
};
