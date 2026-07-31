begin;

create extension if not exists pgcrypto;

create type public.organization_type as enum (
  'platform',
  'client',
  'contractor'
);

create type public.organization_status as enum (
  'pending',
  'active',
  'suspended',
  'rejected',
  'archived'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'revoked',
  'archived'
);

create type public.permission_override_effect as enum (
  'allow',
  'deny'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  avatar_url text,
  account_status text not null default 'active'
    check (
      account_status in (
        'pending',
        'active',
        'suspended',
        'disabled'
      )
    ),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_number bigint generated always as identity,
  organization_type public.organization_type not null,
  legal_name text not null,
  display_name text not null,
  slug text not null,
  status public.organization_status not null default 'pending',
  email text,
  phone text,
  website_url text,
  tax_id_last_four text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  constraint organizations_slug_unique unique (slug),
  constraint organizations_number_unique unique (organization_number),
  constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_tax_id_last_four_format
    check (
      tax_id_last_four is null
      or tax_id_last_four ~ '^[0-9]{4}$'
    )
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  status public.membership_status not null default 'invited',
  title text,
  invited_at timestamptz,
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  suspended_at timestamptz,
  suspended_by uuid references auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  constraint organization_memberships_unique
    unique (organization_id, user_id)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  module text not null,
  action text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint permissions_code_format
    check (code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$')
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid
    references public.organizations(id)
    on delete cascade,
  code text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  archived_by uuid references auth.users(id),
  constraint roles_code_format
    check (code ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$')
);

create unique index roles_system_code_unique
  on public.roles (code)
  where organization_id is null;

create unique index roles_organization_code_unique
  on public.roles (organization_id, code)
  where organization_id is not null;

create table public.role_permissions (
  role_id uuid not null
    references public.roles(id)
    on delete cascade,
  permission_id uuid not null
    references public.permissions(id)
    on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  primary key (role_id, permission_id)
);

create table public.membership_roles (
  membership_id uuid not null
    references public.organization_memberships(id)
    on delete cascade,
  role_id uuid not null
    references public.roles(id)
    on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  primary key (membership_id, role_id)
);

create table public.user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null
    references public.organization_memberships(id)
    on delete cascade,
  permission_id uuid not null
    references public.permissions(id)
    on delete cascade,
  effect public.permission_override_effect not null,
  reason text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint user_permission_overrides_unique
    unique (membership_id, permission_id)
);

create table public.platform_administrators (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,
  is_active boolean not null default true,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_type_status_idx
  on public.organizations (
    organization_type,
    status
  );

create index organization_memberships_user_status_idx
  on public.organization_memberships (
    user_id,
    status
  );

create index organization_memberships_org_status_idx
  on public.organization_memberships (
    organization_id,
    status
  );

create index permissions_module_action_idx
  on public.permissions (
    module,
    action
  );

create index roles_organization_active_idx
  on public.roles (
    organization_id,
    is_active
  );

create index membership_roles_role_idx
  on public.membership_roles (
    role_id
  );

create index user_permission_overrides_membership_idx
  on public.user_permission_overrides (
    membership_id
  );

create or replace function public.set_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();

  return new;
end;
$$;

create or replace function public.set_timestamp_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
  end if;

  new.updated_at := now();

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    display_name,
    created_by,
    updated_by
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.id,
    new.id
  )
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = now(),
    updated_by = excluded.id;

  return new;
end;
$$;

create or replace function public.is_platform_administrator(
  requested_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_administrators pa
    where pa.user_id = requested_user_id
      and pa.is_active = true
      and pa.revoked_at is null
  );
$$;

create or replace function public.has_active_organization_membership(
  requested_organization_id uuid,
  requested_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    join public.organizations o
      on o.id = om.organization_id
    where om.organization_id = requested_organization_id
      and om.user_id = requested_user_id
      and om.status = 'active'
      and om.archived_at is null
      and o.status = 'active'
      and o.archived_at is null
  );
$$;

create or replace function public.has_organization_permission(
  requested_organization_id uuid,
  requested_permission_code text,
  requested_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with active_membership as (
    select om.id
    from public.organization_memberships om
    join public.organizations o
      on o.id = om.organization_id
    where om.organization_id = requested_organization_id
      and om.user_id = requested_user_id
      and om.status = 'active'
      and om.archived_at is null
      and o.status = 'active'
      and o.archived_at is null
    limit 1
  ),
  requested_permission as (
    select p.id
    from public.permissions p
    where p.code = requested_permission_code
    limit 1
  ),
  explicit_override as (
    select upo.effect
    from public.user_permission_overrides upo
    join active_membership am
      on am.id = upo.membership_id
    join requested_permission rp
      on rp.id = upo.permission_id
    limit 1
  ),
  role_grant as (
    select true as granted
    from active_membership am
    join public.membership_roles mr
      on mr.membership_id = am.id
    join public.roles r
      on r.id = mr.role_id
     and r.is_active = true
     and r.archived_at is null
    join public.role_permissions rp
      on rp.role_id = r.id
    join requested_permission p
      on p.id = rp.permission_id
    limit 1
  )
  select
    case
      when public.is_platform_administrator(requested_user_id)
        then true
      when exists (
        select 1
        from explicit_override
        where effect = 'deny'
      )
        then false
      when exists (
        select 1
        from explicit_override
        where effect = 'allow'
      )
        then true
      else exists (
        select 1
        from role_grant
      )
    end;
$$;

create trigger profiles_set_audit_fields
before insert or update
on public.profiles
for each row
execute function public.set_audit_fields();

create trigger organizations_set_audit_fields
before insert or update
on public.organizations
for each row
execute function public.set_audit_fields();

create trigger organization_memberships_set_audit_fields
before insert or update
on public.organization_memberships
for each row
execute function public.set_audit_fields();

create trigger permissions_set_audit_fields
before insert or update
on public.permissions
for each row
execute function public.set_audit_fields();

create trigger roles_set_audit_fields
before insert or update
on public.roles
for each row
execute function public.set_audit_fields();

create trigger user_permission_overrides_set_audit_fields
before insert or update
on public.user_permission_overrides
for each row
execute function public.set_audit_fields();

create trigger platform_administrators_set_timestamp_fields
before insert or update
on public.platform_administrators
for each row
execute function public.set_timestamp_fields();

create trigger auth_user_created_profile
after insert
on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.user_permission_overrides enable row level security;
alter table public.platform_administrators enable row level security;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_platform_administrator()
);

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_platform_administrator()
)
with check (
  id = auth.uid()
  or public.is_platform_administrator()
);

create policy organizations_select_members
on public.organizations
for select
to authenticated
using (
  public.has_active_organization_membership(id)
  or public.is_platform_administrator()
);

create policy organizations_insert_authenticated
on public.organizations
for insert
to authenticated
with check (
  created_by = auth.uid()
  or created_by is null
  or public.is_platform_administrator()
);

create policy organizations_update_authorized
on public.organizations
for update
to authenticated
using (
  public.has_organization_permission(
    id,
    'organizations.update'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    id,
    'organizations.update'
  )
  or public.is_platform_administrator()
);

create policy organization_memberships_select
on public.organization_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy organization_memberships_insert
on public.organization_memberships
for insert
to authenticated
with check (
  user_id = auth.uid()
  or public.has_organization_permission(
    organization_id,
    'memberships.manage'
  )
  or public.is_platform_administrator()
);

create policy organization_memberships_update
on public.organization_memberships
for update
to authenticated
using (
  public.has_organization_permission(
    organization_id,
    'memberships.manage'
  )
  or public.is_platform_administrator()
)
with check (
  public.has_organization_permission(
    organization_id,
    'memberships.manage'
  )
  or public.is_platform_administrator()
);

create policy permissions_select_authenticated
on public.permissions
for select
to authenticated
using (true);

create policy permissions_manage_platform
on public.permissions
for all
to authenticated
using (
  public.is_platform_administrator()
)
with check (
  public.is_platform_administrator()
);

create policy roles_select
on public.roles
for select
to authenticated
using (
  organization_id is null
  or public.has_active_organization_membership(
    organization_id
  )
  or public.is_platform_administrator()
);

create policy roles_manage
on public.roles
for all
to authenticated
using (
  public.is_platform_administrator()
  or (
    organization_id is not null
    and public.has_organization_permission(
      organization_id,
      'roles.manage'
    )
  )
)
with check (
  public.is_platform_administrator()
  or (
    organization_id is not null
    and public.has_organization_permission(
      organization_id,
      'roles.manage'
    )
  )
);

create policy role_permissions_select
on public.role_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and (
        r.organization_id is null
        or public.has_active_organization_membership(
          r.organization_id
        )
        or public.is_platform_administrator()
      )
  )
);

create policy role_permissions_manage
on public.role_permissions
for all
to authenticated
using (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id is not null
      and public.has_organization_permission(
        r.organization_id,
        'roles.manage'
      )
  )
)
with check (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.roles r
    where r.id = role_permissions.role_id
      and r.organization_id is not null
      and public.has_organization_permission(
        r.organization_id,
        'roles.manage'
      )
  )
);

create policy membership_roles_select
on public.membership_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = membership_roles.membership_id
      and (
        om.user_id = auth.uid()
        or public.has_active_organization_membership(
          om.organization_id
        )
        or public.is_platform_administrator()
      )
  )
);

create policy membership_roles_manage
on public.membership_roles
for all
to authenticated
using (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.organization_memberships om
    where om.id = membership_roles.membership_id
      and public.has_organization_permission(
        om.organization_id,
        'roles.manage'
      )
  )
)
with check (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.organization_memberships om
    where om.id = membership_roles.membership_id
      and public.has_organization_permission(
        om.organization_id,
        'roles.manage'
      )
  )
);

create policy permission_overrides_select
on public.user_permission_overrides
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships om
    where om.id = user_permission_overrides.membership_id
      and (
        om.user_id = auth.uid()
        or public.has_organization_permission(
          om.organization_id,
          'roles.manage'
        )
        or public.is_platform_administrator()
      )
  )
);

create policy permission_overrides_manage
on public.user_permission_overrides
for all
to authenticated
using (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.organization_memberships om
    where om.id = user_permission_overrides.membership_id
      and public.has_organization_permission(
        om.organization_id,
        'roles.manage'
      )
  )
)
with check (
  public.is_platform_administrator()
  or exists (
    select 1
    from public.organization_memberships om
    where om.id = user_permission_overrides.membership_id
      and public.has_organization_permission(
        om.organization_id,
        'roles.manage'
      )
  )
);

create policy platform_administrators_select_self
on public.platform_administrators
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_platform_administrator()
);

create policy platform_administrators_manage
on public.platform_administrators
for all
to authenticated
using (
  public.is_platform_administrator()
)
with check (
  public.is_platform_administrator()
);

insert into public.permissions (
  code,
  module,
  action,
  description
)
values
  (
    'organizations.view',
    'organizations',
    'view',
    'View organization information.'
  ),
  (
    'organizations.update',
    'organizations',
    'update',
    'Update organization information.'
  ),
  (
    'memberships.view',
    'memberships',
    'view',
    'View organization memberships.'
  ),
  (
    'memberships.manage',
    'memberships',
    'manage',
    'Invite, suspend, revoke, and manage memberships.'
  ),
  (
    'roles.view',
    'roles',
    'view',
    'View roles and permission assignments.'
  ),
  (
    'roles.manage',
    'roles',
    'manage',
    'Create roles and manage permission assignments.'
  ),
  (
    'marketplace.access',
    'marketplace',
    'access',
    'Access marketplace functionality.'
  ),
  (
    'jobs.view',
    'jobs',
    'view',
    'View job opportunities.'
  ),
  (
    'jobs.create',
    'jobs',
    'create',
    'Create job opportunities.'
  ),
  (
    'jobs.update',
    'jobs',
    'update',
    'Update job opportunities.'
  ),
  (
    'proposals.view',
    'proposals',
    'view',
    'View proposals.'
  ),
  (
    'proposals.create',
    'proposals',
    'create',
    'Create proposals.'
  ),
  (
    'assignments.view',
    'assignments',
    'view',
    'View assignments.'
  ),
  (
    'timekeeping.view',
    'timekeeping',
    'view',
    'View time records.'
  ),
  (
    'payments.view',
    'payments',
    'view',
    'View payment activity.'
  );

commit;
