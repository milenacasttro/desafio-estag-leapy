-- Schemas fornecidos pelo usuário
-- Ordem de criação: target_roles -> internship_leaders -> talents

-- 1. Criação primeiro da tabela target_roles (sem dependências de outras tabelas personalizadas)
create table if not exists public.target_roles (
  id serial not null,
  date_created timestamp with time zone null,
  date_updated timestamp with time zone null,
  date_deleted timestamp without time zone null,
  name character varying(255) not null,
  description text null,
  important_skills json null,
  success_criteria character varying(255) null,
  talent_id uuid null,
  required_skills json null,
  talent_current_skills json null,
  match real null default '0'::real,
  constraint target_roles_pkey primary key (id)
) tablespace pg_default;

-- 2. Criação da tabela internship_leaders (sem dependências de outras tabelas personalizadas)
create table if not exists public.internship_leaders (
  id serial not null,
  status character varying(255) not null default 'draft'::character varying,
  date_created timestamp with time zone null,
  date_updated timestamp with time zone null,
  date_deleted timestamp without time zone null,
  phone_number character varying(255) not null,
  user_id uuid not null,
  position character varying(255) null,
  department character varying(255) null,
  constraint internship_leaders_pkey primary key (id)
) tablespace pg_default;

create index if not exists internship_leaders_status_idx on public.internship_leaders using btree (status) tablespace pg_default;
create index if not exists internship_leaders_department_idx on public.internship_leaders using btree (department) tablespace pg_default;
create index if not exists internship_leaders_user_id_idx on public.internship_leaders using btree (user_id) tablespace pg_default;
create index if not exists internship_leaders_phone_idx on public.internship_leaders using btree (phone_number) tablespace pg_default;

-- 3. Criação da tabela talents (depende de target_roles e internship_leaders)
create table if not exists public.talents (
  id uuid not null,
  date_created timestamp with time zone null,
  date_updated timestamp with time zone null,
  date_deleted timestamp without time zone null,
  user_id uuid not null,
  phone_number character varying(255) not null,
  start_date timestamp without time zone null,
  end_date timestamp without time zone null,
  graduation_course character varying(255) null,
  graduation_institution character varying(255) null,
  target_role_id integer null,
  leader_id integer null,
  department character varying(255) null,
  current_status character varying(255) null default 'PENDING_FIRST_ACCESS'::character varying,
  last_status_change_at timestamp without time zone null,
  verified_phone_number character varying(255) null,
  orchestrator_state character varying(50) null default null::character varying,
  reset_count integer not null default 0,
  last_reset_at timestamp without time zone null,
  pdi_plan_ready boolean null default false,
  current_cycle integer not null default 1,
  current_cycle_id uuid null,
  constraint talents_pkey primary key (id),
  constraint talents_phone_number_unique unique (phone_number),
  constraint talents_user_id_unique unique (user_id),
  constraint talents_leader_id_foreign foreign key (leader_id) references internship_leaders (id) on delete set null,
  constraint talents_target_role_id_foreign foreign key (target_role_id) references target_roles (id) on delete set null
) tablespace pg_default;

create index if not exists talents_user_id_idx on public.talents using btree (user_id) tablespace pg_default;
create index if not exists talents_department_idx on public.talents using btree (department) tablespace pg_default;
create index if not exists talents_leader_id_idx on public.talents using btree (leader_id) tablespace pg_default;
create index if not exists talents_date_range_idx on public.talents using btree (start_date, end_date) tablespace pg_default;
create index if not exists idx_talents_orchestrator_state on public.talents using btree (orchestrator_state) tablespace pg_default;
create index if not exists idx_talents_reset_count on public.talents using btree (reset_count) tablespace pg_default;
create index if not exists idx_talents_pdi_plan_ready on public.talents using btree (pdi_plan_ready) tablespace pg_default where (pdi_plan_ready = true);
create index if not exists talents_target_role_id_idx on public.talents using btree (target_role_id) tablespace pg_default;
create index if not exists talents_phone_idx on public.talents using btree (phone_number) tablespace pg_default;

-- 4. Adição da foreign key da tabela target_roles para a tabela talents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'target_roles_talent_id_foreign'
  ) THEN
    ALTER TABLE public.target_roles 
    ADD CONSTRAINT target_roles_talent_id_foreign 
    FOREIGN KEY (talent_id) REFERENCES talents (id) ON DELETE CASCADE;
  END IF;
END $$;
