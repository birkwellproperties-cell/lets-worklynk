begin;

create type public.organization_profile_visibility as enum (
  'private',
  'marketplace',
  'public'
);

create type public.organization_location_type as enum (
  'headquarters',
  'office',
  'facility',
  'worksite',
  'billing',
  'remote'
);

create type public.organization_record_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.contractor_business_type as enum (
  'individual',
  'sole_proprietorship',
  'llc',
  'partnership',
  'corporation',
  'other'
);

create type public.rate_visibility as enum (
  'private',
  'selected_clients',
  'marketplace'
);

create table public.organization_profiles (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  profile_visibility
    public.organization_profile_visibility
    not null
    default 'private',

  short_description text,
  full_description text,
  industry_code text,
  industry_name text,
  employee_size_range text,
  year_established integer,
  marketplace_headline text,

  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,

  support_email text,
  support_phone text,

  timezone text not null default 'America/Chicago',
  locale text not null default 'en-US',
  currency_code text not null default 'USD',

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint organization_profiles_year_established_check
    check (
      year_established is null
      or year_established between 1800 and 2200
    ),

  constraint organization_profiles_currency_code_check
    check (
      currency_code ~ '^[A-Z]{3}$'
    )
);

create table public.client_organization_profiles (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  procurement_email text,
  accounts_payable_email text,
  default_payment_terms_days integer
    not null
    default 30,

  purchase_order_required boolean
    not null
    default false,

  worker_approval_required boolean
    not null
    default true,

  timesheet_approval_required boolean
    not null
    default true,

  allows_direct_contractor_contact boolean
    not null
    default true,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint client_profiles_payment_terms_check
    check (
      default_payment_terms_days
      between 0 and 365
    )
);

create table public.contractor_organization_profiles (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  business_type
    public.contractor_business_type
    not null
    default 'individual',

  rate_visibility
    public.rate_visibility
    not null
    default 'private',

  accepts_marketplace_invites boolean
    not null
    default true,

  accepts_direct_client_invites boolean
    not null
    default true,

  team_dispatch_enabled boolean
    not null
    default false,

  workers_compensation_exempt boolean
    not null
    default false,

  default_service_radius_miles integer,
  minimum_engagement_hours numeric(8, 2),

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint contractor_profiles_radius_check
    check (
      default_service_radius_miles is null
      or default_service_radius_miles
        between 0 and 5000
    ),

  constraint contractor_profiles_minimum_hours_check
    check (
      minimum_engagement_hours is null
      or minimum_engagement_hours >= 0
    )
);

create table public.organization_locations (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  location_number bigint
    generated always as identity,

  name text not null,

  location_type
    public.organization_location_type
    not null
    default 'office',

  status
    public.organization_record_status
    not null
    default 'active',

  is_primary boolean not null default false,

  email text,
  phone text,

  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text not null default 'US',

  latitude numeric(9, 6),
  longitude numeric(9, 6),

  timezone text not null default 'America/Chicago',

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),

  constraint organization_locations_number_unique
    unique (location_number),

  constraint organization_locations_name_unique
    unique (organization_id, name),

  constraint organization_locations_country_check
    check (
      country_code ~ '^[A-Z]{2}$'
    ),

  constraint organization_locations_latitude_check
    check (
      latitude is null
      or latitude between -90 and 90
    ),

  constraint organization_locations_longitude_check
    check (
      longitude is null
      or longitude between -180 and 180
    )
);

create unique index organization_locations_primary_unique
  on public.organization_locations (
    organization_id
  )
  where
    is_primary = true
    and archived_at is null;

create index organization_locations_org_status_idx
  on public.organization_locations (
    organization_id,
    status
  );

create index organization_locations_location_type_idx
  on public.organization_locations (
    organization_id,
    location_type
  );

create table public.organization_departments (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  location_id uuid
    references public.organization_locations(id)
    on delete set null,

  parent_department_id uuid
    references public.organization_departments(id)
    on delete set null,

  code text,
  name text not null,
  description text,

  status
    public.organization_record_status
    not null
    default 'active',

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),

  constraint organization_departments_name_unique
    unique (
      organization_id,
      location_id,
      name
    )
);

create unique index organization_departments_code_unique
  on public.organization_departments (
    organization_id,
    code
  )
  where code is not null;

create index organization_departments_org_status_idx
  on public.organization_departments (
    organization_id,
    status
  );

create index organization_departments_location_idx
  on public.organization_departments (
    location_id
  );

create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,

  is_sensitive boolean not null default false,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint organization_settings_unique
    unique (
      organization_id,
      setting_key
    ),

  constraint organization_settings_key_check
    check (
      setting_key ~
      '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'
    )
);

create table public.organization_branding (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  logo_path text,
  logo_mark_path text,
  cover_image_path text,

  primary_color text,
  secondary_color text,
  accent_color text,

  display_name_override text,
  tagline text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint organization_branding_primary_color_check
    check (
      primary_color is null
      or primary_color ~ '^#[0-9A-Fa-f]{6}$'
    ),

  constraint organization_branding_secondary_color_check
    check (
      secondary_color is null
      or secondary_color ~ '^#[0-9A-Fa-f]{6}$'
    ),

  constraint organization_branding_accent_color_check
    check (
      accent_color is null
      or accent_color ~ '^#[0-9A-Fa-f]{6}$'
    )
);

create table public.organization_billing_profiles (
  organization_id uuid primary key
    references public.organizations(id)
    on delete cascade,

  billing_legal_name text,
  billing_email text,
  billing_phone text,

  address_line_1 text,
  address_line_2 text,
  city text,
  state_region text,
  postal_code text,
  country_code text not null default 'US',

  currency_code text not null default 'USD',
  payment_terms_days integer not null default 30,
  invoice_prefix text,
  purchase_order_required boolean not null default false,

  tax_id_last_four text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint organization_billing_country_check
    check (
      country_code ~ '^[A-Z]{2}$'
    ),

  constraint organization_billing_currency_check
    check (
      currency_code ~ '^[A-Z]{3}$'
    ),

  constraint organization_billing_payment_terms_check
    check (
      payment_terms_days between 0 and 365
    ),

  constraint organization_billing_tax_id_check
    check (
      tax_id_last_four is null
      or tax_id_last_four ~ '^[0-9]{4}$'
    ),

  constraint organization_billing_invoice_prefix_check
    check (
      invoice_prefix is null
      or invoice_prefix ~ '^[A-Za-z0-9_-]{1,20}$'
    )
);

create or replace function
public.validate_organization_profile_type()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organization_type
    public.organization_type;
begin
  select organization_type
  into v_organization_type
  from public.organizations
  where id = new.organization_id;

  if v_organization_type is null then
    raise exception
      'Organization % does not exist.',
      new.organization_id;
  end if;

  if tg_table_name =
       'client_organization_profiles'
     and v_organization_type <> 'client'
  then
    raise exception
      'Client profiles require a client organization.';
  end if;

  if tg_table_name =
       'contractor_organization_profiles'
     and v_organization_type <> 'contractor'
  then
    raise exception
      'Contractor profiles require a contractor organization.';
  end if;

  return new;
end;
$$;

create or replace function
public.validate_organization_department()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_location_organization_id uuid;
  v_parent_organization_id uuid;
begin
  if new.location_id is not null then
    select organization_id
    into v_location_organization_id
    from public.organization_locations
    where id = new.location_id;

    if v_location_organization_id
       is distinct from
       new.organization_id
    then
      raise exception
        'Department location must belong to the same organization.';
    end if;
  end if;

  if new.parent_department_id
     is not null
  then
    select organization_id
    into v_parent_organization_id
    from public.organization_departments
    where id = new.parent_department_id;

    if v_parent_organization_id
       is distinct from
       new.organization_id
    then
      raise exception
        'Parent department must belong to the same organization.';
    end if;

    if new.parent_department_id = new.id then
      raise exception
        'A department cannot be its own parent.';
    end if;
  end if;

  return new;
end;
$$;

create trigger organization_profiles_set_audit_fields
before insert or update
on public.organization_profiles
for each row
execute function public.set_audit_fields();

create trigger client_profiles_set_audit_fields
before insert or update
on public.client_organization_profiles
for each row
execute function public.set_audit_fields();

create trigger contractor_profiles_set_audit_fields
before insert or update
on public.contractor_organization_profiles
for each row
execute function public.set_audit_fields();

create trigger organization_locations_set_audit_fields
before insert or update
on public.organization_locations
for each row
execute function public.set_audit_fields();

create trigger organization_departments_set_audit_fields
before insert or update
on public.organization_departments
for each row
execute function public.set_audit_fields();

create trigger organization_settings_set_audit_fields
before insert or update
on public.organization_settings
for each row
execute function public.set_audit_fields();

create trigger organization_branding_set_audit_fields
before insert or update
on public.organization_branding
for each row
execute function public.set_audit_fields();

create trigger organization_billing_set_audit_fields
before insert or update
on public.organization_billing_profiles
for each row
execute function public.set_audit_fields();

create trigger client_profiles_validate_type
before insert or update
on public.client_organization_profiles
for each row
execute function
public.validate_organization_profile_type();

create trigger contractor_profiles_validate_type
before insert or update
on public.contractor_organization_profiles
for each row
execute function
public.validate_organization_profile_type();

create trigger organization_departments_validate
before insert or update
on public.organization_departments
for each row
execute function
public.validate_organization_department();

alter table public.organization_profiles
enable row level security;

alter table public.client_organization_profiles
enable row level security;

alter table public.contractor_organization_profiles
enable row level security;

alter table public.organization_locations
enable row level security;

alter table public.organization_departments
enable row level security;

alter table public.organization_settings
enable row level security;

alter table public.organization_branding
enable row level security;

alter table public.organization_billing_profiles
enable row level security;

create policy organization_profiles_select
on public.organization_profiles
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or profile_visibility in (
    'marketplace',
    'public'
  )
  or public.is_platform_administrator()
);

create policy organization_profiles_manage
on public.organization_profiles
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
);

create policy client_profiles_select
on public.client_organization_profiles
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy client_profiles_manage
on public.client_organization_profiles
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
);

create policy contractor_profiles_select
on public.contractor_organization_profiles
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy contractor_profiles_manage
on public.contractor_organization_profiles
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
);

create policy organization_locations_select
on public.organization_locations
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy organization_locations_manage
on public.organization_locations
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'locations.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'locations.manage'
  )
  or public.is_platform_administrator()
);

create policy organization_departments_select
on public.organization_departments
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy organization_departments_manage
on public.organization_departments
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'departments.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'departments.manage'
  )
  or public.is_platform_administrator()
);

create policy organization_settings_select
on public.organization_settings
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy organization_settings_manage
on public.organization_settings
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'settings.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'settings.manage'
  )
  or public.is_platform_administrator()
);

create policy organization_branding_select
on public.organization_branding
for select
to authenticated
using (
  public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy organization_branding_manage
on public.organization_branding
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'branding.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'branding.manage'
  )
  or public.is_platform_administrator()
);

create policy organization_billing_select
on public.organization_billing_profiles
for select
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'billing.view'
  )
  or public.is_platform_administrator()
);

create policy organization_billing_manage
on public.organization_billing_profiles
for all
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'billing.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'billing.manage'
  )
  or public.is_platform_administrator()
);

insert into public.permissions (
  code,
  module,
  action,
  description
)
values
  (
    'locations.view',
    'locations',
    'view',
    'View organization locations.'
  ),
  (
    'locations.manage',
    'locations',
    'manage',
    'Create and manage organization locations.'
  ),
  (
    'departments.view',
    'departments',
    'view',
    'View organization departments.'
  ),
  (
    'departments.manage',
    'departments',
    'manage',
    'Create and manage organization departments.'
  ),
  (
    'settings.view',
    'settings',
    'view',
    'View organization settings.'
  ),
  (
    'settings.manage',
    'settings',
    'manage',
    'Manage organization settings.'
  ),
  (
    'branding.view',
    'branding',
    'view',
    'View organization branding.'
  ),
  (
    'branding.manage',
    'branding',
    'manage',
    'Manage organization branding.'
  ),
  (
    'billing.view',
    'billing',
    'view',
    'View organization billing information.'
  ),
  (
    'billing.manage',
    'billing',
    'manage',
    'Manage organization billing information.'
  )
on conflict (code)
do update set
  module = excluded.module,
  action = excluded.action,
  description = excluded.description,
  updated_at = now();

grant select, insert, update, delete
on table public.organization_profiles
to authenticated, service_role;

grant select, insert, update, delete
on table public.client_organization_profiles
to authenticated, service_role;

grant select, insert, update, delete
on table public.contractor_organization_profiles
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_locations
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_departments
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_settings
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_branding
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_billing_profiles
to authenticated, service_role;

grant usage, select
on all sequences in schema public
to authenticated, service_role;

grant execute
on function
public.validate_organization_profile_type()
to authenticated, service_role;

grant execute
on function
public.validate_organization_department()
to authenticated, service_role;

insert into public.role_permissions (
  role_id,
  permission_id,
  created_by
)
select
  r.id,
  p.id,
  r.created_by
from public.roles r
cross join public.permissions p
where r.code = 'platform-admin'
  and r.is_active = true
on conflict (
  role_id,
  permission_id
)
do nothing;

commit;
