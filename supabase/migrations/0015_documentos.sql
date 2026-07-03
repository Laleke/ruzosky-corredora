-- =============================================================
-- 0015_documentos.sql
-- Centro Documental: documentos + versiones + bucket de Storage.
-- Multitenant (empresa_id) + RLS solo admin, igual al resto del sistema.
-- No modifica tablas existentes.
--
-- Última modificación: 2026-07-02
-- Notas:
--   - Un `documento` es la entidad lógica (metadatos + relaciones).
--   - Cada archivo subido es una fila en `documento_versiones` (versionado).
--   - Los archivos viven en el bucket privado `documentos` de Storage; el
--     acceso se hace con signed URLs generadas server-side. El aislamiento por
--     tenant se refuerza con políticas RLS sobre storage.objects (primera
--     carpeta del path = empresa_id).
-- =============================================================

create type public.categoria_documento as enum (
  'contrato',
  'anexo',
  'inventario',
  'acta_entrega',
  'acta_recepcion',
  'liquidacion',
  'comprobante_pago',
  'factura',
  'boleta',
  'gasto',
  'mantencion',
  'otro'
);

-- ----- Documentos (entidad lógica + metadatos) ---------------
create table public.documentos (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete restrict,
  nombre           text not null,
  categoria        public.categoria_documento not null,
  -- Relaciones opcionales (un documento puede asociarse a cualquier combinación).
  propietario_id   uuid references public.propietarios(id) on delete set null,
  arrendatario_id  uuid references public.arrendatarios(id) on delete set null,
  propiedad_id     uuid references public.propiedades(id) on delete set null,
  contrato_id      uuid references public.contratos(id) on delete set null,
  observaciones    text,
  fecha_documento  date,                          -- fecha del documento en sí
  version_actual   int not null default 1,        -- puntero a la versión vigente
  subido_por       uuid,                          -- creador (auth.users.id)
  subido_por_email text,
  created_at       timestamptz not null default now(),  -- fecha de subida
  updated_at       timestamptz not null default now()
);

create index idx_documentos_empresa on public.documentos(empresa_id);
create index idx_documentos_categoria on public.documentos(empresa_id, categoria);
create index idx_documentos_propiedad on public.documentos(propiedad_id);
create index idx_documentos_contrato on public.documentos(contrato_id);
create index idx_documentos_propietario on public.documentos(propietario_id);
create index idx_documentos_arrendatario on public.documentos(arrendatario_id);
create index idx_documentos_fecha on public.documentos(empresa_id, fecha_documento);

create trigger trg_documentos_updated
  before update on public.documentos
  for each row execute function public.set_updated_at();

-- ----- Versiones (cada archivo subido) -----------------------
create table public.documento_versiones (
  id               uuid primary key default gen_random_uuid(),
  empresa_id       uuid not null references public.empresas(id) on delete restrict,
  documento_id     uuid not null references public.documentos(id) on delete cascade,
  version          int not null,
  storage_path     text not null,                 -- ruta en el bucket 'documentos'
  nombre_archivo   text not null,                 -- nombre original del archivo
  tamano_bytes     bigint not null default 0,
  mime_type        text,
  subido_por       uuid,
  subido_por_email text,
  created_at       timestamptz not null default now(),
  unique (documento_id, version)
);

create index idx_doc_versiones_documento on public.documento_versiones(documento_id);
create index idx_doc_versiones_empresa on public.documento_versiones(empresa_id);

-- ----- RLS: solo admin de la empresa -------------------------
alter table public.documentos enable row level security;
create policy "documentos_select_admin" on public.documentos for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "documentos_insert_admin" on public.documentos for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "documentos_update_admin" on public.documentos for update to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin')
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "documentos_delete_admin" on public.documentos for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

alter table public.documento_versiones enable row level security;
create policy "doc_versiones_select_admin" on public.documento_versiones for select to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "doc_versiones_insert_admin" on public.documento_versiones for insert to authenticated
  with check (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');
create policy "doc_versiones_delete_admin" on public.documento_versiones for delete to authenticated
  using (empresa_id = public.auth_empresa_id() and public.auth_rol() = 'admin');

-- ----- Bucket privado de Storage -----------------------------
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- ----- RLS sobre storage.objects (aislamiento por tenant) ----
-- El path de cada archivo es `<empresa_id>/<uuid>.<ext>`, así que la primera
-- carpeta identifica al tenant. Solo el admin de esa empresa opera sus objetos.
create policy "documentos_storage_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.auth_empresa_id()::text
    and public.auth_rol() = 'admin'
  );
create policy "documentos_storage_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.auth_empresa_id()::text
    and public.auth_rol() = 'admin'
  );
create policy "documentos_storage_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = public.auth_empresa_id()::text
    and public.auth_rol() = 'admin'
  );
