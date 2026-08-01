begin;

create type public.client_relationship_status as enum (
  'prospect',
  'onboarding',
  'active',
  'paused',
  'suspended',
  'terminated',
  'archived'
);

create type public.client_contact_type as enum (
  'primary',
  'operations',
  'procurement',
  'accounts_payable',
  'human_resources',
  'compliance',
  'scheduling',
  'executive',
  'other'
);

create type public.client_onboarding_status as enum (
  'not_started',
  'in_progress',
  'awaiting_client',
  'awaiting_platform',
  'completed',
  'cancelled'
);

create table public.client_relationships (
  id uuid primary key default gen_random_uuid(),

  platform_organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  client_organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  relationship_number bigint
    generated always as identity,

  status public.client_relationship_status
    not null
    default 'prospect',

  account_manager_user_id uuid
    references auth.users(id)
    on delete set null,

  external_reference text,
  notes text,

  started_at timestamptz,
  paused_at timestamptz,
  suspended_at timestamptz,
  terminated_at timestamptz,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  archived_at timestamptz,
  archived_by uuid references auth.users(id),

  constraint client_relationships_unique
    unique (
      platform_organization_id,
      client_organization_id
    ),

  constraint client_relationship_number_unique
    unique (relationship_number),

  constraint client_relationship_distinct_organizations
    check (
      platform_organization_id <>
      client_organization_id
    )
);

create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),

  client_organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  contact_number bigint
    generated always as identity,

  contact_type public.client_contact_type
    not null
    default 'other',

  first_name text not null,
  last_name text not null,

  job_title text,
  department_name text,

  email text,
  phone text,
  mobile_phone text,

  is_primary boolean not null default false,
  is_active boolean not null default true,

  notes text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  archived_at timestamptz,
  archived_by uuid references auth.users(id),

  constraint client_contacts_number_unique
    unique (contact_number),

  constraint client_contacts_name_check
    check (
      btrim(first_name) <> ''
      and btrim(last_name) <> ''
    )
);

create table public.client_onboarding_records (
  id uuid primary key default gen_random_uuid(),

  client_relationship_id uuid not null
    references public.client_relationships(id)
    on delete cascade,

  status public.client_onboarding_status
    not null
    default 'not_started',

  current_step text,
  completion_percentage integer
    not null
    default 0,

  requested_start_date date,
  target_launch_date date,
  completed_at timestamptz,

  assigned_user_id uuid
    references auth.users(id)
    on delete set null,

  internal_notes text,
  client_notes text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint client_onboarding_relationship_unique
    unique (client_relationship_id),

  constraint client_onboarding_completion_check
    check (
      completion_percentage
      between 0 and 100
    )
);

create index client_relationships_platform_status_idx
  on public.client_relationships (
    platform_organization_id,
    status
  );

create index client_relationships_client_status_idx
  on public.client_relationships (
    client_organization_id,
    status
  );

create index client_relationships_account_manager_idx
  on public.client_relationships (
    account_manager_user_id
  );

create index client_contacts_client_active_idx
  on public.client_contacts (
    client_organization_id,
    is_active
  );

create index client_contacts_type_idx
  on public.client_contacts (
    client_organization_id,
    contact_type
  );

create index client_onboarding_status_idx
  on public.client_onboarding_records (
    status
  );

create or replace function public.validate_client_relationship()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_platform_type public.organization_type;
  v_client_type public.organization_type;
begin
  select organization_type
  into v_platform_type
  from public.organizations
  where id = new.platform_organization_id;

  if v_platform_type is distinct from 'platform' then
    raise exception
      'Client relationship platform organization must be type platform.';
  end if;

  select organization_type
  into v_client_type
  from public.organizations
  where id = new.client_organization_id;

  if v_client_type is distinct from 'client' then
    raise exception
      'Client relationship client organization must be type client.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_client_contact()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organization_type public.organization_type;
begin
  select organization_type
  into v_organization_type
  from public.organizations
  where id = new.client_organization_id;

  if v_organization_type is distinct from 'client' then
    raise exception
      'Client contacts require a client organization.';
  end if;

  return new;
end;
$$;

create trigger client_relationships_set_audit_fields
before insert or update
on public.client_relationships
for each row
execute function public.set_audit_fields();

create trigger client_contacts_set_audit_fields
before insert or update
on public.client_contacts
for each row
execute function public.set_audit_fields();

create trigger client_onboarding_set_audit_fields
before insert or update
on public.client_onboarding_records
for each row
execute function public.set_audit_fields();

create trigger client_relationships_validate
before insert or update
on public.client_relationships
for each row
execute function public.validate_client_relationship();

create trigger client_contacts_validate
before insert or update
on public.client_contacts
for each row
execute function public.validate_client_contact();

alter table public.client_relationships
enable row level security;

alter table public.client_contacts
enable row level security;

alter table public.client_onboarding_records
enable row level security;

insert into public.permissions (
  code,
  module,
  action,
  description
)
values
  (
    'clients.view',
    'clients',
    'view',
    'View client organizations and client relationships.'
  ),
  (
    'clients.create',
    'clients',
    'create',
    'Create and onboard client organizations.'
  ),
  (
    'clients.update',
    'clients',
    'update',
    'Update client organizations and client relationships.'
  ),
  (
    'clients.manage',
    'clients',
    'manage',
    'Manage client organizations, contacts, onboarding, and status.'
  )
on conflict (code)
do update set
  module = excluded.module,
  action = excluded.action,
  description = excluded.description;

create policy client_relationships_select
on public.client_relationships
for select
to authenticated
using (
  public.has_organization_permission(
    platform_organization_id,
    'clients.view'
  )
  or public.has_organization_permission(
    platform_organization_id,
    'clients.manage'
  )
  or public.has_active_organization_membership(
    client_organization_id
  )
  or public.is_platform_administrator()
);

create policy client_relationships_insert
on public.client_relationships
for insert
to authenticated
with check (
  public.has_organization_permission(
    platform_organization_id,
    'clients.create'
  )
  or public.has_organization_permission(
    platform_organization_id,
    'clients.manage'
  )
  or public.is_platform_administrator()
);

create policy client_relationships_update
on public.client_relationships
for update
to authenticated
using (
  public.has_organization_permission(
    platform_organization_id,
    'clients.update'
  )
  or public.has_organization_permission(
    platform_organization_id,
    'clients.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    platform_organization_id,
    'clients.update'
  )
  or public.has_organization_permission(
    platform_organization_id,
    'clients.manage'
  )
  or public.is_platform_administrator()
);

create policy client_contacts_select
on public.client_contacts
for select
to authenticated
using (
  public.has_active_organization_membership(
    client_organization_id
  )
  or exists (
    select 1
    from public.client_relationships relationship
    where relationship.client_organization_id =
      client_contacts.client_organization_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.view'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_contacts_manage
on public.client_contacts
for all
to authenticated
using (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.client_organization_id =
      client_contacts.client_organization_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
      )
  )
  or public.has_organization_permission(
    client_organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
)
with check (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.client_organization_id =
      client_contacts.client_organization_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
      )
  )
  or public.has_organization_permission(
    client_organization_id,
    'organizations.update'
  )
  or public.is_platform_administrator()
);

create policy client_onboarding_select
on public.client_onboarding_records
for select
to authenticated
using (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_onboarding_records.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.view'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
        or public.has_active_organization_membership(
          relationship.client_organization_id
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_onboarding_manage
on public.client_onboarding_records
for all
to authenticated
using (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_onboarding_records.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
      )
  )
  or public.is_platform_administrator()
)
with check (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_onboarding_records.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'clients.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

grant select, insert, update
on table public.client_relationships
to authenticated, service_role;

grant select, insert, update, delete
on table public.client_contacts
to authenticated, service_role;

grant select, insert, update, delete
on table public.client_onboarding_records
to authenticated, service_role;

grant usage, select
on all sequences in schema public
to authenticated, service_role;

grant execute
on function public.validate_client_relationship()
to authenticated, service_role;

grant execute
on function public.validate_client_contact()
to authenticated, service_role;

insert into public.role_permissions (
  role_id,
  permission_id,
  created_by
)
select
  role.id,
  permission.id,
  auth.uid()
from public.roles role
cross join public.permissions permission
where role.code = 'platform-admin'
  and permission.code in (
    'clients.view',
    'clients.create',
    'clients.update',
    'clients.manage'
  )
on conflict (
  role_id,
  permission_id
)
do nothing;

commit;
