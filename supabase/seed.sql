insert into collections(id,source_id,name,owner,review_due) values
('10000000-0000-4000-8000-000000000001','demo-orders','Order integrations','Mere',current_date-7),
('10000000-0000-4000-8000-000000000002','demo-partners','Partner integrations','',current_date+21) on conflict do nothing;
insert into requests(id,collection_id,source_id,name,folder,method,url,lifecycle) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','orders-health','Order health','Orders','GET','https://orders.example.invalid/health','active'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','orders-status','Order status','Orders','GET','https://orders.example.invalid/status','active'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','partner-catalog','Partner catalog','Catalog','GET','https://partners.example.invalid/catalog','active'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','old-catalog','Old catalog','Catalog','GET','http://partners.example.invalid/v1/catalog','deprecated') on conflict do nothing;
insert into runs(id,request_id,revision,status,elapsed_ms,passed,error,actor,created_at) values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',1,200,120,true,'','Demo fixture',now()-interval '10 days'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002',1,503,180,false,'Unexpected status','Demo fixture',now()-interval '1 day') on conflict do nothing;
insert into actions(id,collection_id,title,owner,due) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Confirm order service recovery','Mere',current_date-2) on conflict do nothing;
