-- ======= Do a run======

-- Start with cities over 250,000 population
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where search_fts(title, city.name) and population > 250000;
-- Handle aliases like NYC and SF
insert into listing_city select city_alias.geonames_id, listing.id from city_alias, listing where search_fts(title, city_alias.name) and not_listing_city(city_alias.geonames_id, listing.id);

-- Special case for the S.F. Bay area
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where search_fts(title, city.name) and  city.id in ( select b.id from city a, city b where a.name = 'San Jose' and a.country = 'US' and a.name <> b.name and geo_distance(a.location, b.location) < 35);
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where search_fts(title, city.name) and  city.id in ( select b.id from city a, city b where a.name = 'San Francisco' and a.country = 'US' and a.name <> b.name and geo_distance(a.location, b.location) < 35);


-- Visa and remote
update listing set visa = true  where  ts_rank(to_tsvector('english', description),  to_tsquery('visa'))  > 0.05 ;
update listing set remote = true  where  ts_rank(to_tsvector('english', description),  to_tsquery('remote'))  > 0.05 ;

insert into listing_city  select city.geonames_id, listing.id from listing, 
  city  where search_fts(title, city.name)  and population < 250000 and population > 100000 and 
  listing.id not in (select listing_id from listing_city) 
  and city.name not in ('Mobile', 'Metro', 'Providence', 'Billings', 'Enterprise', 'Sale', 'York');

select city.geonames_id, listing.id, city.name, substr(description, 1, 300)  as listing_id from listing, city  
  where ts_rank(to_tsvector('english', regexp_replace(substr(description, 1, 300) , '\W+', ' ', 'g')),  to_tsquery(clean_fts(city.name)))  > 0.05 
  and population > 100000  and listing.id not in (select listing_id from listing_city) and remote is not true
  and city.name not in ('Mobile', 'Metro', 'Providence', 'Billings', 'Enterprise', 'Sale', 'York');

insert into listing_city select city.geonames_id, listing.id from listing, city  
  where ts_rank(to_tsvector('english', regexp_replace(substr(description, 1, 300) , '\W+', ' ', 'g')),  to_tsquery(clean_fts(city.name)))  > 0.05 
  and population > 100000  and listing.id not in (select listing_id from listing_city) and remote is not true
  and city.name not in ('Mobile', 'Metro', 'Providence', 'Billings', 'Enterprise', 'Sale', 'York');

select distinct city , count(*)from listing_loc where remote is false  group by 1 order by 2 desc;
select title from listing where id not in (select listing_id from listing_city) and remote is not true;

