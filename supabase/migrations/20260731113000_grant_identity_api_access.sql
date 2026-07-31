begin;

grant usage on schema public
to authenticated, service_role;

grant select, insert, update, delete
on table public.profiles
to authenticated, service_role;

grant select, insert, update, delete
on table public.organizations
to authenticated, service_role;

grant select, insert, update, delete
on table public.organization_memberships
to authenticated, service_role;

grant select, insert, update, delete
on table public.permissions
to authenticated, service_role;

grant select, insert, update, delete
on table public.roles
to authenticated, service_role;

grant select, insert, update, delete
on table public.role_permissions
to authenticated, service_role;

grant select, insert, update, delete
on table public.membership_roles
to authenticated, service_role;

grant select, insert, update, delete
on table public.user_permission_overrides
to authenticated, service_role;

grant select, insert, update, delete
on table public.platform_administrators
to authenticated, service_role;

grant usage, select
on all sequences in schema public
to authenticated, service_role;

grant execute
on function public.is_platform_administrator(uuid)
to authenticated, service_role;

grant execute
on function public.has_active_organization_membership(uuid, uuid)
to authenticated, service_role;

grant execute
on function public.has_organization_permission(uuid, text, uuid)
to authenticated, service_role;

commit;
