begin;

create or replace function public.get_organization_member_directory(
  requested_organization_id uuid
)
returns table (
  membership_id uuid,
  organization_id uuid,
  user_id uuid,
  membership_status public.membership_status,
  title text,
  invited_at timestamptz,
  joined_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  avatar_url text,
  account_status text,
  roles jsonb,
  permission_overrides jsonb
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if requested_organization_id is null then
    raise exception
      'Organization ID is required.';
  end if;

  if not (
    public.has_organization_permission(
      requested_organization_id,
      'memberships.view'
    )
    or public.has_organization_permission(
      requested_organization_id,
      'memberships.manage'
    )
    or public.has_organization_permission(
      requested_organization_id,
      'roles.view'
    )
    or public.has_organization_permission(
      requested_organization_id,
      'roles.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to view organization members.'
      using errcode = '42501';
  end if;

  return query
  select
    om.id as membership_id,
    om.organization_id,
    om.user_id,
    om.status as membership_status,
    om.title,
    om.invited_at,
    om.joined_at,
    om.suspended_at,
    om.revoked_at,
    om.archived_at,
    om.created_at,
    om.updated_at,
    p.email,
    p.first_name,
    p.last_name,
    p.display_name,
    p.phone,
    p.avatar_url,
    p.account_status,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'organization_id', r.organization_id,
            'code', r.code,
            'name', r.name,
            'description', r.description,
            'is_system', r.is_system,
            'is_active', r.is_active,
            'assigned_at', mr.assigned_at,
            'assigned_by', mr.assigned_by
          )
          order by r.name
        )
        from public.membership_roles mr
        join public.roles r
          on r.id = mr.role_id
        where mr.membership_id = om.id
          and r.archived_at is null
      ),
      '[]'::jsonb
    ) as roles,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', upo.id,
            'permission_id', perm.id,
            'permission_code', perm.code,
            'module', perm.module,
            'action', perm.action,
            'description', perm.description,
            'effect', upo.effect,
            'reason', upo.reason,
            'created_at', upo.created_at,
            'updated_at', upo.updated_at
          )
          order by perm.code
        )
        from public.user_permission_overrides upo
        join public.permissions perm
          on perm.id = upo.permission_id
        where upo.membership_id = om.id
      ),
      '[]'::jsonb
    ) as permission_overrides

  from public.organization_memberships om
  join public.profiles p
    on p.id = om.user_id
  where om.organization_id =
    requested_organization_id
  order by
    case om.status
      when 'active' then 1
      when 'invited' then 2
      when 'suspended' then 3
      when 'revoked' then 4
      else 5
    end,
    coalesce(
      p.display_name,
      p.email,
      om.user_id::text
    );
end;
$$;

create or replace function public.get_organization_roles(
  requested_organization_id uuid
)
returns table (
  id uuid,
  organization_id uuid,
  code text,
  name text,
  description text,
  is_system boolean,
  is_active boolean,
  permission_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if requested_organization_id is null then
    raise exception
      'Organization ID is required.';
  end if;

  if not (
    public.has_organization_permission(
      requested_organization_id,
      'roles.view'
    )
    or public.has_organization_permission(
      requested_organization_id,
      'roles.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to view organization roles.'
      using errcode = '42501';
  end if;

  return query
  select
    r.id,
    r.organization_id,
    r.code,
    r.name,
    r.description,
    r.is_system,
    r.is_active,
    count(rp.permission_id) as permission_count,
    r.created_at,
    r.updated_at
  from public.roles r
  left join public.role_permissions rp
    on rp.role_id = r.id
  where (
      r.organization_id =
        requested_organization_id
      or r.organization_id is null
    )
    and r.archived_at is null
  group by
    r.id,
    r.organization_id,
    r.code,
    r.name,
    r.description,
    r.is_system,
    r.is_active,
    r.created_at,
    r.updated_at
  order by
    r.is_system desc,
    r.name;
end;
$$;

create or replace function public.update_organization_membership_status(
  requested_membership_id uuid,
  requested_status public.membership_status,
  requested_title text default null
)
returns public.organization_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership public.organization_memberships;
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception
      'Authentication is required.'
      using errcode = '42501';
  end if;

  select *
  into v_membership
  from public.organization_memberships
  where id = requested_membership_id
  for update;

  if not found then
    raise exception
      'Organization membership was not found.';
  end if;

  if not (
    public.has_organization_permission(
      v_membership.organization_id,
      'memberships.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to manage this membership.'
      using errcode = '42501';
  end if;

  if (
    v_membership.user_id = v_actor_id
    and requested_status in (
      'suspended',
      'revoked'
    )
    and not public.is_platform_administrator()
  ) then
    raise exception
      'You cannot suspend or revoke your own membership.'
      using errcode = '42501';
  end if;

  update public.organization_memberships
  set
    status = requested_status,
    title = coalesce(
      nullif(
        btrim(requested_title),
        ''
      ),
      title
    ),

    invited_at =
      case
        when requested_status = 'invited'
          then coalesce(
            invited_at,
            now()
          )
        else invited_at
      end,

    invited_by =
      case
        when requested_status = 'invited'
          then coalesce(
            invited_by,
            v_actor_id
          )
        else invited_by
      end,

    joined_at =
      case
        when requested_status = 'active'
          then coalesce(
            joined_at,
            now()
          )
        else joined_at
      end,

    suspended_at =
      case
        when requested_status = 'suspended'
          then now()
        else null
      end,

    suspended_by =
      case
        when requested_status = 'suspended'
          then v_actor_id
        else null
      end,

    revoked_at =
      case
        when requested_status = 'revoked'
          then now()
        else null
      end,

    revoked_by =
      case
        when requested_status = 'revoked'
          then v_actor_id
        else null
      end,

    archived_at = null,
    archived_by = null,
    updated_at = now(),
    updated_by = v_actor_id

  where id = requested_membership_id
  returning *
  into v_membership;

  return v_membership;
end;
$$;

create or replace function public.replace_organization_membership_roles(
  requested_membership_id uuid,
  requested_role_ids uuid[]
)
returns table (
  membership_id uuid,
  role_id uuid,
  assigned_at timestamptz,
  assigned_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_actor_id uuid;
  v_role_ids uuid[];
  v_invalid_role_count integer;
begin
  v_actor_id := auth.uid();

  if v_actor_id is null then
    raise exception
      'Authentication is required.'
      using errcode = '42501';
  end if;

  select organization_id
  into v_organization_id
  from public.organization_memberships
  where id = requested_membership_id;

  if v_organization_id is null then
    raise exception
      'Organization membership was not found.';
  end if;

  if not (
    public.has_organization_permission(
      v_organization_id,
      'roles.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to assign roles.'
      using errcode = '42501';
  end if;

  select coalesce(
    array_agg(
      distinct requested_role.role_id
    ),
    array[]::uuid[]
  )
  into v_role_ids
  from unnest(
    coalesce(
      requested_role_ids,
      array[]::uuid[]
    )
  ) as requested_role(role_id);

  select count(*)
  into v_invalid_role_count
  from unnest(v_role_ids) as requested(role_id)
  left join public.roles r
    on r.id = requested.role_id
   and r.archived_at is null
   and r.is_active = true
   and (
     r.organization_id =
       v_organization_id
     or r.organization_id is null
   )
  where r.id is null;

  if v_invalid_role_count > 0 then
    raise exception
      'One or more roles are invalid for this organization.';
  end if;

  delete from public.membership_roles as existing_assignment
  where existing_assignment.membership_id =
    requested_membership_id
    and not (
      existing_assignment.role_id =
        any(v_role_ids)
    );

  insert into public.membership_roles (
    membership_id,
    role_id,
    assigned_at,
    assigned_by
  )
  select
    requested_membership_id,
    requested_role.role_id,
    now(),
    v_actor_id
  from unnest(
    v_role_ids
  ) as requested_role(role_id)
  on conflict on constraint membership_roles_pkey
  do nothing;

  return query
  select
    mr.membership_id,
    mr.role_id,
    mr.assigned_at,
    mr.assigned_by
  from public.membership_roles mr
  where mr.membership_id =
    requested_membership_id
  order by mr.assigned_at;
end;
$$;

create or replace function public.set_organization_permission_override(
  requested_membership_id uuid,
  requested_permission_code text,
  requested_effect public.permission_override_effect,
  requested_reason text default null
)
returns public.user_permission_overrides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_permission_id uuid;
  v_override public.user_permission_overrides;
begin
  select organization_id
  into v_organization_id
  from public.organization_memberships
  where id = requested_membership_id;

  if v_organization_id is null then
    raise exception
      'Organization membership was not found.';
  end if;

  if not (
    public.has_organization_permission(
      v_organization_id,
      'roles.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to manage permission overrides.'
      using errcode = '42501';
  end if;

  select id
  into v_permission_id
  from public.permissions
  where code =
    requested_permission_code
  limit 1;

  if v_permission_id is null then
    raise exception
      'Permission code was not found: %',
      requested_permission_code;
  end if;

  insert into public.user_permission_overrides (
    membership_id,
    permission_id,
    effect,
    reason,
    created_by,
    updated_by
  )
  values (
    requested_membership_id,
    v_permission_id,
    requested_effect,
    nullif(
      btrim(requested_reason),
      ''
    ),
    auth.uid(),
    auth.uid()
  )
  on conflict (
    membership_id,
    permission_id
  )
  do update set
    effect = excluded.effect,
    reason = excluded.reason,
    updated_at = now(),
    updated_by = auth.uid()
  returning *
  into v_override;

  return v_override;
end;
$$;

create or replace function public.remove_organization_permission_override(
  requested_membership_id uuid,
  requested_permission_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_permission_id uuid;
begin
  select organization_id
  into v_organization_id
  from public.organization_memberships
  where id = requested_membership_id;

  if v_organization_id is null then
    raise exception
      'Organization membership was not found.';
  end if;

  if not (
    public.has_organization_permission(
      v_organization_id,
      'roles.manage'
    )
    or public.is_platform_administrator()
  ) then
    raise exception
      'You do not have permission to manage permission overrides.'
      using errcode = '42501';
  end if;

  select id
  into v_permission_id
  from public.permissions
  where code =
    requested_permission_code
  limit 1;

  if v_permission_id is null then
    return false;
  end if;

  delete from public.user_permission_overrides
  where membership_id =
      requested_membership_id
    and permission_id =
      v_permission_id;

  return found;
end;
$$;

revoke all
on function public.get_organization_member_directory(uuid)
from public;

revoke all
on function public.get_organization_roles(uuid)
from public;

revoke all
on function public.update_organization_membership_status(
  uuid,
  public.membership_status,
  text
)
from public;

revoke all
on function public.replace_organization_membership_roles(
  uuid,
  uuid[]
)
from public;

revoke all
on function public.set_organization_permission_override(
  uuid,
  text,
  public.permission_override_effect,
  text
)
from public;

revoke all
on function public.remove_organization_permission_override(
  uuid,
  text
)
from public;

grant execute
on function public.get_organization_member_directory(uuid)
to authenticated, service_role;

grant execute
on function public.get_organization_roles(uuid)
to authenticated, service_role;

grant execute
on function public.update_organization_membership_status(
  uuid,
  public.membership_status,
  text
)
to authenticated, service_role;

grant execute
on function public.replace_organization_membership_roles(
  uuid,
  uuid[]
)
to authenticated, service_role;

grant execute
on function public.set_organization_permission_override(
  uuid,
  text,
  public.permission_override_effect,
  text
)
to authenticated, service_role;

grant execute
on function public.remove_organization_permission_override(
  uuid,
  text
)
to authenticated, service_role;

commit;
