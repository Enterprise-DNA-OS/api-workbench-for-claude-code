create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table collections (
 id uuid primary key default gen_random_uuid(), source_id text not null unique, name text not null check(length(trim(name))>0),
 owner text not null default '', import_digest text, review_due date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references collections(id), source_id text not null,
 name text not null check(length(trim(name))>0), folder text not null default '', method text not null check(method in ('GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS')),
 url text not null, expected_status integer not null default 200 check(expected_status between 100 and 599), max_ms integer not null default 2000 check(max_ms between 1 and 60000),
 lifecycle text not null default 'active' check(lifecycle in ('active','deprecated','retired')), revision integer not null default 1,
 import_notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(collection_id,source_id)
);
create table runs (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references requests(id), revision integer not null,
 status integer check(status between 100 and 599), elapsed_ms integer not null check(elapsed_ms>=0), passed boolean not null,
 error text not null default '', actor text not null check(length(trim(actor))>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table actions (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references collections(id), title text not null check(length(trim(title))>0),
 owner text not null check(length(trim(owner))>0), due date not null, state text not null default 'open' check(state in ('open','closed')),
 resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(state='open' or length(trim(resolution))>0)
);
create table activity (
 id uuid primary key default gen_random_uuid(), actor text not null, event text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), collection_id uuid not null references collections(id), digest text not null, request_count integer not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(collection_id,digest)
);
do $$ declare t text; begin foreach t in array array['collections','requests','runs','actions','activity','imports'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
create index runs_latest on runs(request_id,revision,created_at desc);
create view request_health as
 select r.*,c.name as collection,c.owner,c.review_due,x.status as last_status,x.elapsed_ms,x.passed,x.created_at as last_run,
 case when x.id is null then 'untested' when not x.passed then 'failed' when x.created_at<now()-interval '7 days' then 'stale' else 'passed' end as health
 from requests r join collections c on c.id=r.collection_id
 left join lateral (select * from runs where request_id=r.id and revision=r.revision order by created_at desc,id desc limit 1) x on true;
create view collection_coverage as select c.id,c.name,c.owner,c.review_due,
 count(r.id) filter(where r.lifecycle='active')::integer as active,
 count(r.id) filter(where r.lifecycle='active' and r.health='passed')::integer as passing,
 count(r.id) filter(where r.lifecycle='active' and r.health='failed')::integer as failing,
 count(r.id) filter(where r.lifecycle='active' and r.health='untested')::integer as untested,
 count(r.id) filter(where r.lifecycle='active' and r.health='stale')::integer as stale
 from collections c left join request_health r on r.collection_id=c.id group by c.id;
create view attention_items as
 select 'review' as kind,c.name as item,c.owner,c.review_due as due,'Review date missing or overdue' as reason from collections c where c.review_due is null or c.review_due<current_date
 union all select 'request',r.collection||' / '||r.name,r.owner,null::date,r.health from request_health r where lifecycle='active' and health<>'passed'
 union all select 'action',a.title,a.owner,a.due,'Action overdue' from actions a where state='open' and due<current_date;
create view compliance_findings as
 select 'INV-OWNER' as rule,c.name as item,'No accountable owner' as finding,'https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/' as source from collections c where trim(owner)=''
 union all select 'INV-REVIEW',name,'Missing or overdue inventory review','https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/' from collections where review_due is null or review_due<current_date
 union all select 'INV-TRANSPORT',collection||' / '||name,'Non-HTTPS or unresolved address','https://owasp.org/API-Security/editions/2023/en/0xa8-security-misconfiguration/' from request_health where lifecycle<>'retired' and (url not like 'https://%' or url like '%{{%')
 union all select 'INV-DEPRECATED',collection||' / '||name,'Deprecated endpoint still recorded','https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/' from request_health where lifecycle='deprecated'
 union all select 'IMPORT-REVIEW',collection||' / '||name,import_notes,'https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data' from request_health where lifecycle<>'retired' and import_notes<>'';
