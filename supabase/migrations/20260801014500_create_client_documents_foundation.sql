begin;

do $$
begin
  create type public.client_document_type as enum (
    'master_service_agreement',
    'business_associate_agreement',
    'non_disclosure_agreement',
    'certificate_of_insurance',
    'w9',
    'ach_authorization',
    'rate_agreement',
    'facility_requirements',
    'orientation_packet',
    'compliance_document',
    'vendor_packet',
    'other'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.client_document_status as enum (
    'draft',
    'uploaded',
    'under_review',
    'approved',
    'rejected',
    'expired',
    'archived'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.client_document_activity_type as enum (
    'created',
    'uploaded',
    'version_uploaded',
    'submitted_for_review',
    'approved',
    'rejected',
    'expiration_updated',
    'note_added',
    'downloaded',
    'archived',
    'restored',
    'metadata_updated'
  );
exception
  when duplicate_object then null;
end;
$$;

create table public.client_documents (
  id uuid primary key default gen_random_uuid(),

  client_relationship_id uuid not null
    references public.client_relationships(id)
    on delete cascade,

  client_organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  document_number bigint
    generated always as identity,

  document_type public.client_document_type
    not null
    default 'other',

  title text not null,
  description text,

  status public.client_document_status
    not null
    default 'draft',

  is_required boolean
    not null
    default false,

  effective_date date,
  expiration_date date,

  current_version_number integer
    not null
    default 0,

  current_version_id uuid,

  review_notes text,

  approved_at timestamptz,
  approved_by uuid
    references auth.users(id)
    on delete set null,

  rejected_at timestamptz,
  rejected_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz
    not null
    default now(),

  created_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz
    not null
    default now(),

  updated_by uuid
    references auth.users(id)
    on delete set null,

  archived_at timestamptz,

  archived_by uuid
    references auth.users(id)
    on delete set null,

  constraint client_documents_number_unique
    unique (document_number),

  constraint client_documents_title_not_blank
    check (
      btrim(title) <> ''
    ),

  constraint client_documents_version_nonnegative
    check (
      current_version_number >= 0
    ),

  constraint client_documents_dates_valid
    check (
      expiration_date is null
      or effective_date is null
      or expiration_date >= effective_date
    )
);

create table public.client_document_versions (
  id uuid primary key default gen_random_uuid(),

  client_document_id uuid not null
    references public.client_documents(id)
    on delete cascade,

  version_number integer not null,

  storage_bucket text not null,
  storage_path text not null,

  original_file_name text not null,
  stored_file_name text not null,

  mime_type text not null,
  file_size_bytes bigint not null,

  checksum text,

  change_summary text,

  uploaded_at timestamptz
    not null
    default now(),

  uploaded_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz
    not null
    default now(),

  created_by uuid
    references auth.users(id)
    on delete set null,

  constraint client_document_versions_unique
    unique (
      client_document_id,
      version_number
    ),

  constraint client_document_versions_storage_unique
    unique (
      storage_bucket,
      storage_path
    ),

  constraint client_document_versions_version_positive
    check (
      version_number > 0
    ),

  constraint client_document_versions_size_positive
    check (
      file_size_bytes > 0
    ),

  constraint client_document_versions_file_name_not_blank
    check (
      btrim(original_file_name) <> ''
      and btrim(stored_file_name) <> ''
    )
);

alter table public.client_documents
  add constraint client_documents_current_version_fk
  foreign key (current_version_id)
  references public.client_document_versions(id)
  on delete set null;

create table public.client_document_notes (
  id uuid primary key default gen_random_uuid(),

  client_document_id uuid not null
    references public.client_documents(id)
    on delete cascade,

  note text not null,

  is_internal boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now(),

  created_by uuid
    references auth.users(id)
    on delete set null,

  updated_at timestamptz
    not null
    default now(),

  updated_by uuid
    references auth.users(id)
    on delete set null,

  archived_at timestamptz,

  archived_by uuid
    references auth.users(id)
    on delete set null,

  constraint client_document_notes_not_blank
    check (
      btrim(note) <> ''
    )
);

create table public.client_document_activity (
  id uuid primary key default gen_random_uuid(),

  client_document_id uuid not null
    references public.client_documents(id)
    on delete cascade,

  activity_type public.client_document_activity_type
    not null,

  summary text not null,

  metadata jsonb
    not null
    default '{}'::jsonb,

  actor_user_id uuid
    references auth.users(id)
    on delete set null,

  occurred_at timestamptz
    not null
    default now(),

  constraint client_document_activity_summary_not_blank
    check (
      btrim(summary) <> ''
    )
);

create index client_documents_relationship_status_idx
  on public.client_documents (
    client_relationship_id,
    status
  );

create index client_documents_organization_type_idx
  on public.client_documents (
    client_organization_id,
    document_type
  );

create index client_documents_expiration_idx
  on public.client_documents (
    expiration_date
  )
  where expiration_date is not null
    and archived_at is null;

create index client_documents_required_idx
  on public.client_documents (
    client_relationship_id,
    is_required
  )
  where archived_at is null;

create index client_document_versions_document_idx
  on public.client_document_versions (
    client_document_id,
    version_number desc
  );

create index client_document_notes_document_idx
  on public.client_document_notes (
    client_document_id,
    created_at desc
  );

create index client_document_activity_document_idx
  on public.client_document_activity (
    client_document_id,
    occurred_at desc
  );

create or replace function public.validate_client_document()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_relationship_client_organization_id uuid;
  v_organization_type public.organization_type;
begin
  select
    relationship.client_organization_id
  into
    v_relationship_client_organization_id
  from public.client_relationships relationship
  where relationship.id =
    new.client_relationship_id;

  if v_relationship_client_organization_id is null then
    raise exception
      'Client relationship was not found.';
  end if;

  if v_relationship_client_organization_id <>
    new.client_organization_id then
    raise exception
      'Client organization does not match the client relationship.';
  end if;

  select
    organization.organization_type
  into
    v_organization_type
  from public.organizations organization
  where organization.id =
    new.client_organization_id;

  if v_organization_type is distinct from 'client' then
    raise exception
      'Client documents require a client organization.';
  end if;

  if new.status = 'approved' then
    if new.approved_at is null then
      new.approved_at := now();
    end if;

    new.rejected_at := null;
    new.rejected_by := null;
  end if;

  if new.status = 'rejected' then
    if new.rejected_at is null then
      new.rejected_at := now();
    end if;

    new.approved_at := null;
    new.approved_by := null;
  end if;

  if new.status = 'archived' and
    new.archived_at is null then
    new.archived_at := now();
  end if;

  return new;
end;
$$;

create or replace function public.validate_client_document_version()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected_version integer;
begin
  select
    coalesce(
      max(version.version_number),
      0
    ) + 1
  into
    v_expected_version
  from public.client_document_versions version
  where version.client_document_id =
    new.client_document_id;

  if new.version_number <>
    v_expected_version then
    raise exception
      'Expected document version %, received %.',
      v_expected_version,
      new.version_number;
  end if;

  return new;
end;
$$;

create or replace function public.apply_client_document_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.client_documents
  set
    current_version_id = new.id,
    current_version_number =
      new.version_number,
    status = case
      when status = 'draft'
        then 'uploaded'::public.client_document_status
      when status = 'expired'
        then 'uploaded'::public.client_document_status
      else status
    end,
    updated_at = now(),
    updated_by = new.uploaded_by
  where id =
    new.client_document_id;

  insert into public.client_document_activity (
    client_document_id,
    activity_type,
    summary,
    metadata,
    actor_user_id
  )
  values (
    new.client_document_id,
    case
      when new.version_number = 1
        then 'uploaded'::public.client_document_activity_type
      else 'version_uploaded'::public.client_document_activity_type
    end,
    case
      when new.version_number = 1
        then 'Initial document version uploaded.'
      else format(
        'Document version %s uploaded.',
        new.version_number
      )
    end,
    jsonb_build_object(
      'version_id',
      new.id,
      'version_number',
      new.version_number,
      'file_name',
      new.original_file_name,
      'mime_type',
      new.mime_type,
      'file_size_bytes',
      new.file_size_bytes
    ),
    new.uploaded_by
  );

  return new;
end;
$$;

create or replace function public.record_client_document_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.client_document_activity (
    client_document_id,
    activity_type,
    summary,
    actor_user_id
  )
  values (
    new.id,
    'created',
    'Client document record created.',
    new.created_by
  );

  return new;
end;
$$;

create trigger client_documents_set_audit_fields
before insert or update
on public.client_documents
for each row
execute function public.set_audit_fields();

create trigger client_document_notes_set_audit_fields
before insert or update
on public.client_document_notes
for each row
execute function public.set_audit_fields();

create trigger client_documents_validate
before insert or update
on public.client_documents
for each row
execute function public.validate_client_document();

create trigger client_document_versions_validate
before insert
on public.client_document_versions
for each row
execute function public.validate_client_document_version();

create trigger client_documents_record_creation
after insert
on public.client_documents
for each row
execute function public.record_client_document_creation();

create trigger client_document_versions_apply
after insert
on public.client_document_versions
for each row
execute function public.apply_client_document_version();

alter table public.client_documents
enable row level security;

alter table public.client_document_versions
enable row level security;

alter table public.client_document_notes
enable row level security;

alter table public.client_document_activity
enable row level security;

insert into public.permissions (
  code,
  module,
  action,
  description
)
values
  (
    'client_documents.view',
    'client_documents',
    'view',
    'View client documents, versions, notes, and activity.'
  ),
  (
    'client_documents.upload',
    'client_documents',
    'upload',
    'Upload client documents and document versions.'
  ),
  (
    'client_documents.update',
    'client_documents',
    'update',
    'Update client document metadata and lifecycle status.'
  ),
  (
    'client_documents.delete',
    'client_documents',
    'delete',
    'Archive and restore client documents.'
  ),
  (
    'client_documents.manage',
    'client_documents',
    'manage',
    'Manage all client document operations.'
  )
on conflict (code)
do update set
  module = excluded.module,
  action = excluded.action,
  description = excluded.description;

create policy client_documents_select
on public.client_documents
for select
to authenticated
using (
  public.has_active_organization_membership(
    client_organization_id
  )
  or exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_documents.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.view'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_documents_insert
on public.client_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_documents.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.upload'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_documents_update
on public.client_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.client_relationships relationship
    where relationship.id =
      client_documents.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.delete'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
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
      client_documents.client_relationship_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.delete'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_document_versions_select
on public.client_document_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.client_documents document
    where document.id =
      client_document_versions.client_document_id
      and (
        public.has_active_organization_membership(
          document.client_organization_id
        )
        or exists (
          select 1
          from public.client_relationships relationship
          where relationship.id =
            document.client_relationship_id
            and (
              public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.view'
              )
              or public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.manage'
              )
            )
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_document_versions_insert
on public.client_document_versions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.client_documents document
    join public.client_relationships relationship
      on relationship.id =
        document.client_relationship_id
    where document.id =
      client_document_versions.client_document_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.upload'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_document_notes_select
on public.client_document_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.client_documents document
    where document.id =
      client_document_notes.client_document_id
      and (
        public.has_active_organization_membership(
          document.client_organization_id
        )
        or exists (
          select 1
          from public.client_relationships relationship
          where relationship.id =
            document.client_relationship_id
            and (
              public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.view'
              )
              or public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.manage'
              )
            )
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_document_notes_manage
on public.client_document_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.client_documents document
    join public.client_relationships relationship
      on relationship.id =
        document.client_relationship_id
    where document.id =
      client_document_notes.client_document_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
)
with check (
  exists (
    select 1
    from public.client_documents document
    join public.client_relationships relationship
      on relationship.id =
        document.client_relationship_id
    where document.id =
      client_document_notes.client_document_id
      and (
        public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.update'
        )
        or public.has_organization_permission(
          relationship.platform_organization_id,
          'client_documents.manage'
        )
      )
  )
  or public.is_platform_administrator()
);

create policy client_document_activity_select
on public.client_document_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.client_documents document
    where document.id =
      client_document_activity.client_document_id
      and (
        public.has_active_organization_membership(
          document.client_organization_id
        )
        or exists (
          select 1
          from public.client_relationships relationship
          where relationship.id =
            document.client_relationship_id
            and (
              public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.view'
              )
              or public.has_organization_permission(
                relationship.platform_organization_id,
                'client_documents.manage'
              )
            )
        )
      )
  )
  or public.is_platform_administrator()
);

grant select, insert, update
on table public.client_documents
to authenticated, service_role;

grant select, insert
on table public.client_document_versions
to authenticated, service_role;

grant select, insert, update, delete
on table public.client_document_notes
to authenticated, service_role;

grant select
on table public.client_document_activity
to authenticated, service_role;

grant usage, select
on all sequences in schema public
to authenticated, service_role;

grant execute
on function public.validate_client_document()
to authenticated, service_role;

grant execute
on function public.validate_client_document_version()
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
    'client_documents.view',
    'client_documents.upload',
    'client_documents.update',
    'client_documents.delete',
    'client_documents.manage'
  )
on conflict (
  role_id,
  permission_id
)
do nothing;

commit;
