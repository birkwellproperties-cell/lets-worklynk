begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'client-documents',
  'client-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id)
do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists
  client_documents_storage_select
on storage.objects;

drop policy if exists
  client_documents_storage_insert
on storage.objects;

drop policy if exists
  client_documents_storage_update
on storage.objects;

drop policy if exists
  client_documents_storage_delete
on storage.objects;

create policy client_documents_storage_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'client-documents'
  and exists (
    select 1
    from public.client_document_versions version
    join public.client_documents document
      on document.id =
        version.client_document_id
    where version.storage_bucket =
      storage.objects.bucket_id
      and version.storage_path =
        storage.objects.name
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
        or public.is_platform_administrator()
      )
  )
);

create policy client_documents_storage_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-documents'
  and (
    public.is_platform_administrator()
    or exists (
      select 1
      from public.client_relationships relationship
      where relationship.id =
        (storage.foldername(name))[1]::uuid
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
  )
);

create policy client_documents_storage_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'client-documents'
  and (
    public.is_platform_administrator()
    or exists (
      select 1
      from public.client_relationships relationship
      where relationship.id =
        (storage.foldername(name))[1]::uuid
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
  )
)
with check (
  bucket_id = 'client-documents'
  and (
    public.is_platform_administrator()
    or exists (
      select 1
      from public.client_relationships relationship
      where relationship.id =
        (storage.foldername(name))[1]::uuid
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
  )
);

create policy client_documents_storage_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'client-documents'
  and (
    public.is_platform_administrator()
    or exists (
      select 1
      from public.client_relationships relationship
      where relationship.id =
        (storage.foldername(name))[1]::uuid
        and (
          public.has_organization_permission(
            relationship.platform_organization_id,
            'client_documents.delete'
          )
          or public.has_organization_permission(
            relationship.platform_organization_id,
            'client_documents.manage'
          )
        )
    )
  )
);

commit;
