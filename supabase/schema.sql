create extension if not exists "pgcrypto";

create type public.app_role as enum ('ADMIN', 'ENCARGADO', 'SUBENCARGADO', 'USUARIO');
create type public.area_slug as enum ('COMUNICACIONES', 'DESARROLLO', 'ESTUDIOS', 'INTERNACIONAL', 'EDITORIAL', 'FORMACION');
create type public.funnel_stage as enum ('CAPTACION', 'CONTACTO_ACTIVO', 'EN_RUTA', 'EGRESADO', 'VOLUNTARIO', 'DONANTE', 'DATO_DORMIDO');
create type public.opportunity_status as enum ('SCOUTING', 'POSTULACION', 'SEGUIMIENTO');
create type public.donation_status as enum ('COMPROMETIDA', 'PAGADA', 'POR_GESTIONAR');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  default_role public.app_role not null default 'USUARIO',
  created_at timestamptz not null default now()
);

create table if not exists public.area_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  area public.area_slug not null,
  region_label text,
  role public.app_role not null,
  can_export boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  area public.area_slug not null,
  region_label text,
  institution_name text,
  assigned_profile_id uuid references public.profiles (id),
  funnel_stage public.funnel_stage not null default 'CAPTACION',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.person_tags (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  tag text not null,
  unique (person_id, tag)
);

create table if not exists public.formation_routes (
  id uuid primary key default gen_random_uuid(),
  area public.area_slug not null default 'FORMACION',
  name text not null,
  campus text not null,
  semester_label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.route_milestones (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.formation_routes (id) on delete cascade,
  sort_order integer not null,
  label text not null,
  description text,
  unique (route_id, sort_order)
);

create table if not exists public.person_route_assignments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  route_id uuid not null references public.formation_routes (id) on delete cascade,
  current_milestone_id uuid references public.route_milestones (id),
  assigned_at timestamptz not null default now(),
  unique (person_id, route_id)
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  area public.area_slug not null,
  title text not null,
  description text,
  modality text not null check (modality in ('PRESENCIAL', 'ONLINE', 'HIBRIDA')),
  session_count integer not null default 1,
  approval_threshold integer not null default 1,
  requires_special_approval boolean not null default false,
  scheduled_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_route_links (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  route_id uuid references public.formation_routes (id) on delete cascade,
  milestone_id uuid references public.route_milestones (id) on delete cascade
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  attended_sessions integer not null default 0,
  special_approval_passed boolean not null default false,
  approval_notes text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  unique (activity_id, person_id)
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people (id),
  donor_name text not null,
  amount numeric(14, 0) not null,
  campaign text,
  donation_date date not null,
  status public.donation_status not null default 'POR_GESTIONAR',
  owner_profile_id uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  area public.area_slug not null,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions (id),
  title text not null,
  area public.area_slug not null,
  owner_profile_id uuid references public.profiles (id),
  status public.opportunity_status not null default 'SCOUTING',
  closes_on date,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists area_memberships_unique_scope
on public.area_memberships (profile_id, area, coalesce(region_label, ''));

alter table public.profiles enable row level security;
alter table public.area_memberships enable row level security;
alter table public.people enable row level security;
alter table public.person_tags enable row level security;
alter table public.formation_routes enable row level security;
alter table public.route_milestones enable row level security;
alter table public.person_route_assignments enable row level security;
alter table public.activities enable row level security;
alter table public.activity_route_links enable row level security;
alter table public.attendance_records enable row level security;
alter table public.donations enable row level security;
alter table public.institutions enable row level security;
alter table public.funding_opportunities enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and default_role = 'ADMIN'
  );
$$;

create or replace function public.has_area_access(target_area public.area_slug)
returns boolean
language sql
stable
as $$
  select public.is_admin() or exists (
    select 1 from public.area_memberships
    where profile_id = auth.uid() and area = target_area
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profiles_self_or_admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_insert" on public.profiles for insert with check (id = auth.uid() or public.is_admin());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "memberships_self_or_admin" on public.area_memberships for select using (profile_id = auth.uid() or public.is_admin());
create policy "memberships_admin_write" on public.area_memberships for all using (public.is_admin()) with check (public.is_admin());
create policy "people_visible_by_area" on public.people for select using (public.has_area_access(area) or assigned_profile_id = auth.uid());
create policy "people_editable_by_area" on public.people for all using (public.has_area_access(area) or assigned_profile_id = auth.uid()) with check (public.has_area_access(area) or assigned_profile_id = auth.uid());
create policy "routes_visible_to_formation" on public.formation_routes for select using (public.has_area_access('FORMACION'));
create policy "routes_editable_to_formation" on public.formation_routes for all using (public.has_area_access('FORMACION')) with check (public.has_area_access('FORMACION'));
create policy "milestones_visible_to_formation" on public.route_milestones for select using (public.has_area_access('FORMACION'));
create policy "milestones_editable_to_formation" on public.route_milestones for all using (public.has_area_access('FORMACION')) with check (public.has_area_access('FORMACION'));
create policy "assignments_visible_to_formation" on public.person_route_assignments for select using (public.has_area_access('FORMACION'));
create policy "assignments_editable_to_formation" on public.person_route_assignments for all using (public.has_area_access('FORMACION')) with check (public.has_area_access('FORMACION'));
create policy "activity_links_visible_by_formation" on public.activity_route_links for select using (public.has_area_access('FORMACION'));
create policy "activity_links_editable_by_formation" on public.activity_route_links for all using (public.has_area_access('FORMACION')) with check (public.has_area_access('FORMACION'));
create policy "activities_visible_by_area" on public.activities for select using (public.has_area_access(area));
create policy "activities_editable_by_area" on public.activities for all using (public.has_area_access(area)) with check (public.has_area_access(area));
create policy "attendance_visible_to_activity_area" on public.attendance_records for select using (exists (select 1 from public.activities where public.activities.id = attendance_records.activity_id and public.has_area_access(public.activities.area)));
create policy "attendance_editable_to_activity_area" on public.attendance_records for all using (exists (select 1 from public.activities where public.activities.id = attendance_records.activity_id and public.has_area_access(public.activities.area))) with check (exists (select 1 from public.activities where public.activities.id = attendance_records.activity_id and public.has_area_access(public.activities.area)));
create policy "donations_visible_to_development" on public.donations for select using (public.has_area_access('DESARROLLO') or public.is_admin());
create policy "donations_editable_to_development" on public.donations for all using (public.has_area_access('DESARROLLO') or public.is_admin()) with check (public.has_area_access('DESARROLLO') or public.is_admin());
create policy "institutions_visible_by_area" on public.institutions for select using (public.has_area_access(area));
create policy "institutions_editable_by_area" on public.institutions for all using (public.has_area_access(area)) with check (public.has_area_access(area));
create policy "funding_visible_by_area" on public.funding_opportunities for select using (public.has_area_access(area));
create policy "funding_editable_by_area" on public.funding_opportunities for all using (public.has_area_access(area)) with check (public.has_area_access(area));
