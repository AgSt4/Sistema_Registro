import { demoSnapshot } from "@/lib/demo-data";
import { inferDedupeCasesFromPeople } from "@/lib/dedupe";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { Snapshot } from "@/lib/types";

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  default_role: Snapshot["people"][number]["roleScope"];
};

type PersonRow = {
  id: string;
  full_name: string;
  rut: string | null;
  email: string | null;
  phone: string | null;
  area: Snapshot["people"][number]["area"];
  region_label: string | null;
  institution_name: string | null;
  assigned_profile_id: string | null;
  funnel_stage: Snapshot["people"][number]["funnelStage"];
  created_at: string;
};

type RouteRow = {
  id: string;
  name: string;
  campus: string;
};

type MilestoneRow = {
  id: string;
  route_id: string;
  label: string;
  description: string | null;
  sort_order: number;
};

type AssignmentRow = {
  person_id: string;
  route_id: string;
  current_milestone_id: string | null;
};

type ActivityRow = {
  id: string;
  title: string;
  area: Snapshot["activities"][number]["area"];
  modality: Snapshot["activities"][number]["modality"];
  session_count: number;
  approval_threshold: number;
  requires_special_approval: boolean;
  scheduled_at: string | null;
};

type ActivityLinkRow = {
  activity_id: string;
  route_id: string | null;
  milestone_id: string | null;
};

type AttendanceRow = {
  activity_id: string;
  person_id: string;
  attended_sessions: number;
  special_approval_passed: boolean;
};

type DonationRow = {
  id: string;
  donor_name: string;
  amount: number;
  donation_date: string;
  campaign: string | null;
  status: Snapshot["donations"][number]["status"];
};

type OpportunityRow = {
  id: string;
  title: string;
  area: Snapshot["opportunities"][number]["area"];
  owner_profile_id: string | null;
  status: Snapshot["opportunities"][number]["status"];
  closes_on: string | null;
};

type DedupeCaseRow = {
  id: string;
  primary_person_id: string;
  candidate_person_id: string;
  status: Snapshot["dedupeCases"][number]["status"];
  confidence: number;
  matched_signal_types: Snapshot["dedupeCases"][number]["matchedSignals"] | null;
  summary: string | null;
  created_at: string;
};

export async function getSnapshot(): Promise<Snapshot> {
  if (!hasSupabaseEnv()) {
    return demoSnapshot;
  }

  const supabase = await createClient();
  if (!supabase) {
    return demoSnapshot;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return demoSnapshot;
  }

  const [profilesRes, peopleRes, routesRes, milestonesRes, assignmentsRes, activitiesRes, activityLinksRes, attendanceRes, donationsRes, opportunitiesRes, dedupeCasesRes] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email, default_role"),
      supabase.from("people").select("id, full_name, rut, email, phone, area, region_label, institution_name, assigned_profile_id, funnel_stage, created_at"),
      supabase.from("formation_routes").select("id, name, campus"),
      supabase.from("route_milestones").select("id, route_id, label, description, sort_order").order("sort_order"),
      supabase.from("person_route_assignments").select("person_id, route_id, current_milestone_id"),
      supabase.from("activities").select("id, title, area, modality, session_count, approval_threshold, requires_special_approval, scheduled_at"),
      supabase.from("activity_route_links").select("activity_id, route_id, milestone_id"),
      supabase.from("attendance_records").select("activity_id, person_id, attended_sessions, special_approval_passed"),
      supabase.from("donations").select("id, donor_name, amount, donation_date, campaign, status"),
      supabase.from("funding_opportunities").select("id, title, area, owner_profile_id, status, closes_on"),
      supabase.from("dedupe_cases").select("id, primary_person_id, candidate_person_id, status, confidence, matched_signal_types, summary, created_at")
    ]);

  const hasError = [
    profilesRes.error,
    peopleRes.error,
    routesRes.error,
    milestonesRes.error,
    assignmentsRes.error,
    activitiesRes.error,
    activityLinksRes.error,
    attendanceRes.error,
    donationsRes.error,
    opportunitiesRes.error
  ].some(Boolean);

  if (hasError) {
    return demoSnapshot;
  }

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const people = (peopleRes.data ?? []) as PersonRow[];
  const routes = (routesRes.data ?? []) as RouteRow[];
  const milestones = (milestonesRes.data ?? []) as MilestoneRow[];
  const assignments = (assignmentsRes.data ?? []) as AssignmentRow[];
  const activities = (activitiesRes.data ?? []) as ActivityRow[];
  const activityLinks = (activityLinksRes.data ?? []) as ActivityLinkRow[];
  const attendance = (attendanceRes.data ?? []) as AttendanceRow[];
  const donations = (donationsRes.data ?? []) as DonationRow[];
  const opportunities = (opportunitiesRes.data ?? []) as OpportunityRow[];
  const dedupeCases = !dedupeCasesRes.error ? ((dedupeCasesRes.data ?? []) as DedupeCaseRow[]) : [];

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
  const personMap = new Map(people.map((person) => [person.id, person]));
  const milestonesByRoute = new Map<string, MilestoneRow[]>();

  for (const milestone of milestones) {
    const list = milestonesByRoute.get(milestone.route_id) ?? [];
    list.push(milestone);
    milestonesByRoute.set(milestone.route_id, list);
  }

  const attendanceByActivity = new Map<string, AttendanceRow[]>();
  for (const row of attendance) {
    const list = attendanceByActivity.get(row.activity_id) ?? [];
    list.push(row);
    attendanceByActivity.set(row.activity_id, list);
  }

  const linksByActivity = new Map<string, ActivityLinkRow[]>();
  for (const row of activityLinks) {
    const list = linksByActivity.get(row.activity_id) ?? [];
    list.push(row);
    linksByActivity.set(row.activity_id, list);
  }

  return {
    metrics: [
      { label: "Personas activas", value: String(people.length), detail: "Registros visibles según permisos y asignaciones." },
      { label: "Jóvenes en ruta", value: String(assignments.length), detail: "Asignaciones activas en rutas formativas." },
      { label: "Asistencias del semestre", value: String(attendance.length), detail: "Registros consolidados en actividades y sesiones." },
      {
        label: "Donaciones vigentes",
        value: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(
          donations.reduce((sum, item) => sum + item.amount, 0)
        ),
        detail: "Suma de donaciones visibles para el usuario actual."
      }
    ],
    people: people.map((person) => ({
      id: person.id,
      fullName: person.full_name,
      rut: person.rut ?? undefined,
      email: person.email ?? "",
      phone: person.phone ?? "",
      area: person.area,
      region: person.region_label ?? "Sin región",
      roleScope: profiles.find((profile) => profile.id === person.assigned_profile_id)?.default_role ?? "USUARIO",
      funnelStage: person.funnel_stage,
      tags: [],
      assignedTo: person.assigned_profile_id ? profileMap.get(person.assigned_profile_id) ?? "Sin responsable" : "Sin responsable",
      routeId: assignments.find((assignment) => assignment.person_id === person.id)?.route_id,
      institution: person.institution_name ?? undefined,
      lastActivityAt: person.created_at
    })),
    routes: routes.map((route) => ({
      id: route.id,
      name: route.name,
      campus: route.campus,
      participants: assignments.filter((assignment) => assignment.route_id === route.id).length,
      milestones: (milestonesByRoute.get(route.id) ?? []).map((milestone) => ({
        id: milestone.id,
        label: milestone.label,
        description: milestone.description ?? ""
      }))
    })),
    routeBoard: assignments
      .map((assignment) => {
        const person = personMap.get(assignment.person_id);
        const milestone = milestones.find((item) => item.id === assignment.current_milestone_id);

        if (!person || !milestone) {
          return null;
        }

        return {
          personId: assignment.person_id,
          personName: person.full_name,
          currentMilestoneId: milestone.id,
          status: "AL_DIA" as const,
          nextAction: `Continuar con ${milestone.label}.`
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    activities: activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      area: activity.area,
      modality: activity.modality,
      routeIds: (linksByActivity.get(activity.id) ?? []).map((link) => link.route_id).filter((value): value is string => Boolean(value)),
      milestoneIds: (linksByActivity.get(activity.id) ?? []).map((link) => link.milestone_id).filter((value): value is string => Boolean(value)),
      sessions: activity.session_count,
      approvalThreshold: activity.approval_threshold,
      specialApproval: activity.requires_special_approval,
      dateLabel: activity.scheduled_at ? new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(activity.scheduled_at)) : "Sin fecha",
      attendees: attendanceByActivity.get(activity.id)?.length ?? 0
    })),
    donations: donations.map((donation) => ({
      id: donation.id,
      donor: donation.donor_name,
      amount: donation.amount,
      date: donation.donation_date,
      campaign: donation.campaign ?? "Sin campaña",
      status: donation.status
    })),
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      area: opportunity.area,
      owner: opportunity.owner_profile_id ? profileMap.get(opportunity.owner_profile_id) ?? "Sin responsable" : "Sin responsable",
      status: opportunity.status,
      closeDate: opportunity.closes_on ?? ""
    })),
    dedupeCases:
      dedupeCases.length > 0
        ? dedupeCases
            .map((dedupeCase) => {
              const primary = personMap.get(dedupeCase.primary_person_id);
              const candidate = personMap.get(dedupeCase.candidate_person_id);

              if (!primary || !candidate) {
                return null;
              }

              return {
                id: dedupeCase.id,
                status: dedupeCase.status,
                confidence: dedupeCase.confidence,
                primaryPersonId: dedupeCase.primary_person_id,
                primaryName: primary.full_name,
                candidatePersonId: dedupeCase.candidate_person_id,
                candidateName: candidate.full_name,
                matchedSignals: dedupeCase.matched_signal_types ?? [],
                summary: dedupeCase.summary ?? "Caso generado por coincidencias de identidad.",
                createdAt: dedupeCase.created_at
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
        : inferDedupeCasesFromPeople(
            people.map((person) => ({
              id: person.id,
              fullName: person.full_name,
              rut: person.rut ?? undefined,
              email: person.email ?? "",
              phone: person.phone ?? "",
              area: person.area,
              region: person.region_label ?? "Sin región",
              roleScope: "USUARIO",
              funnelStage: person.funnel_stage,
              tags: [],
              assignedTo: person.assigned_profile_id ? profileMap.get(person.assigned_profile_id) ?? "Sin responsable" : "Sin responsable",
              routeId: assignments.find((assignment) => assignment.person_id === person.id)?.route_id,
              institution: person.institution_name ?? undefined,
              lastActivityAt: person.created_at
            }))
          )
  };
}
