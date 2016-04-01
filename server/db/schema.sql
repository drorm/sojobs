----------------- Loopback tables ----------------- 

CREATE TABLE accesstoken (
    id character varying(1024) NOT NULL,
    ttl integer,
    created timestamp with time zone,
    userid integer
);


--
-- Name: acl; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

CREATE TABLE acl (
    model character varying(1024),
    property character varying(1024),
    accesstype character varying(1024),
    permission character varying(1024),
    principaltype character varying(1024),
    principalid character varying(1024),
    id integer NOT NULL
);


--
-- Name: acl_id_seq; Type: SEQUENCE; Schema: public; Owner: jobs
--

CREATE SEQUENCE acl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: acl_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobs
--

ALTER SEQUENCE acl_id_seq OWNED BY acl.id;


-- Name: role; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

CREATE TABLE role (
    id integer NOT NULL,
    name character varying(1024) NOT NULL,
    description character varying(1024),
    created timestamp with time zone,
    modified timestamp with time zone
);

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: jobs
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobs
--

ALTER SEQUENCE role_id_seq OWNED BY role.id;


--
-- Name: rolemapping; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

CREATE TABLE rolemapping (
    id integer NOT NULL,
    principaltype character varying(1024),
    principalid character varying(1024),
    roleid integer
);


--
-- Name: rolemapping_id_seq; Type: SEQUENCE; Schema: public; Owner: jobs
--

CREATE SEQUENCE rolemapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rolemapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobs
--

ALTER SEQUENCE rolemapping_id_seq OWNED BY rolemapping.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

CREATE TABLE "user" (
    realm character varying(1024),
    username character varying(1024),
    password character varying(1024) NOT NULL,
    credentials character varying(1024),
    challenges character varying(1024),
    email character varying(1024) NOT NULL,
    emailverified boolean,
    verificationtoken character varying(1024),
    status character varying(1024),
    created timestamp with time zone,
    lastupdated timestamp with time zone,
    first text,
    last text,
    id integer NOT NULL
);

----------------- End of Loopback tables ----------------- 

----------------- Jobs Application  tables ----------------- 
-- Cities/locations imported from http://download.geonames.org/export/dump/readme.txt
create table if not exists city (
        id serial,
        -- From geonames. Position indicates the position in "The main 'geoname'" table
        -- Generate the import file using "cut cities15000.txt -f 1,2,3,5,6,9,11,15,19 > cities.txt"
        geonames_id int not null, -- id in the geoname database, position 1
        name text not null, -- name in the geoname database, position 2
        ascii_name text not null, -- ascii name in the geoname database, position 3
        location point not null, -- latitude and longitude positions 5,6
        country char(2) not null, -- ISO-3166 2-letter country code, position 9
        province text not null, -- Province/state admin1 code position 11
        population int not null, -- population position 15
        date_collected date not null, -- date entered in geonames position 19
        -- Local to the app
        popularity int not null default 0, -- how often have we had a listing in this city
        PRIMARY KEY (id)
);

create unique index city_geo_idx on city(geonames_id);

CREATE INDEX city_population ON city(population); 
--
-- Name: city_alias; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

-- Alias names for cities. 
create table if not exists city_alias (
    geonames_id int references city(geonames_id), -- which city
    name text not null -- what is the alias. NYC for New York SF for San Francisco, etc
);


-- every time we start a job we create an entry in this table

CREATE TABLE fetch_job (
    id serial,
    created timestamp with time zone NOT NULL, -- when was this job started
    type text, -- Currently always 'Hackernews', but maybe others later
    state text, -- Can be RUNNING or DONE
    tried integer, -- how many listings tried
    fetched integer, -- how many actuall fetched
    finished timestamp with time zone, -- when was this job finished
    PRIMARY KEY (id)
);



--
-- Name: listing; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
--

CREATE TABLE listing (
    id serial,
    created timestamp with time zone NOT NULL, -- when did we create in our system
    author text, -- author on original site 
    title text, -- Title of the listing
    description text NOT NULL, -- full text of the listing
    visa boolean DEFAULT false, -- Offers VISA help
    remote boolean DEFAULT false, -- Takes remote employees
    fetch_job_id integer NOT NULL, -- what fetch_job is this part on
    date_posted timestamp with time zone, -- when was it originally posted
    original_id integer NOT NULL, -- What was the id on the original site
    PRIMARY KEY (id)
);

create unique index listing_original_id on listing(original_id);

CREATE INDEX listing_fts ON listing USING gist(to_tsvector('english', description));


-- Many to many join table between listing and city. In other words, a listing can offer jobs in
-- multiple cities

CREATE TABLE listing_city (
    geonames_id int references city(geonames_id), -- which city
    listing_id integer references listing(id) -- which listing
);

--
-- Name: subscription; Type: TABLE; Schema: public; Owner: jobs; Tablespace: 
-- Email subscription to a specific search
--

CREATE TABLE subscription (
    id serial,
    last_run timestamp with time zone NOT NULL default now(), -- when did we last run the search
    owner int references public.user(id), -- which user
    search json, -- the search params
    PRIMARY KEY (id)
);


-- A view that joins city and listing

CREATE VIEW listing_loc AS
 SELECT listing.*,
    city.name AS city,
    city.location AS loc
   FROM listing,
    city,
    listing_city
  WHERE ((city.geonames_id = listing_city.geonames_id) AND (listing.id = listing_city.listing_id));




-- Adapated from https://gist.github.com/chanmix51/1999886
-- figure out the distance between two points
CREATE FUNCTION geo_distance(point, point) RETURNS double precision
    LANGUAGE sql IMMUTABLE
    AS $_$
     SELECT acos(sin(radians($1[0])) * sin(radians($2[0])) +
      cos(radians($1[0])) * cos(radians($2[0])) *
      cos(radians($2[1]) - radians($1[1]))) * 6370.0;
$_$;

CREATE OR REPLACE FUNCTION clean_fts(text) RETURNS text AS $_$
  select 
  regexp_replace(
    trim(
      regexp_replace($1, '\W+', ' ', 'g') -- replace one or more non-chars with a space
    ), -- remove spaces in beginning and end
        '\s+', '&', 'g') -- replace one or more space with '&' such as 'Los Angeles' becomes 'Los&Angeles'
$_$ LANGUAGE sql IMMUTABLE;

-- Simple shortcut for doing search with our standard features: english, replace non-chars with space
CREATE OR REPLACE FUNCTION search_fts(text, text) RETURNS boolean AS $_$
  select ts_rank(to_tsvector('english', regexp_replace($1, '\W+', ' ', 'g')),  to_tsquery(clean_fts($2)))  > 0.05 
$_$ LANGUAGE sql IMMUTABLE;

-- Make sure we only insert unique values into listing_city
CREATE OR REPLACE FUNCTION not_listing_city(int, int) RETURNS boolean AS $_$
  select not exists ( select * from listing_city where (listing_city.geonames_id = $1) and (listing_city.listing_id = $2));
$_$ LANGUAGE sql IMMUTABLE;


CREATE OR REPLACE FUNCTION process_fetch_job(int) RETURNS VOID AS $_$
-- Start with cities over 250,000 population
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where fetch_job_id = $1 and search_fts(title, city.name) and population > 250000;

-- Handle aliases like NYC and SF
insert into listing_city select city_alias.geonames_id, listing.id from city_alias, listing where fetch_job_id = $1 and search_fts(title, city_alias.name) and not_listing_city(city_alias.geonames_id, listing.id);

-- Special case for the S.F. Bay area: all cities between S.F. and San Jose
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where fetch_job_id = $1 and search_fts(title, city.name) and  city.id in ( select b.id from city a, city b where a.name = 'San Jose' and a.country = 'US' and a.name <> b.name and geo_distance(a.location, b.location) < 35);
insert into listing_city select city.geonames_id, listing.id as listing_id from listing, city  where fetch_job_id = $1 and search_fts(title, city.name) and  city.id in ( select b.id from city a, city b where a.name = 'San Francisco' and a.country = 'US' and a.name <> b.name and geo_distance(a.location, b.location) < 35);

-- cities with population 100,000 - 250,000 that we haven't yet inserted
insert into listing_city  select city.geonames_id, listing.id from listing, 
  city  where fetch_job_id = $1 and search_fts(title, city.name)  and population < 250000 and population > 100000 and 
  listing.id not in (select listing_id from listing_city) 
  and city.name not in ('Mobile', 'Metro', 'Providence', 'Billings', 'Enterprise', 'Sale', 'York');

-- Look deeper into the  description
insert into listing_city select city.geonames_id, listing.id from listing, city  
  where fetch_job_id = $1 and ts_rank(to_tsvector('english', regexp_replace(substr(description, 1, 300) , '\W+', ' ', 'g')),  to_tsquery(clean_fts(city.name)))  > 0.05 
  and population > 100000  and listing.id not in (select listing_id from listing_city) and remote is not true
  and city.name not in ('Mobile', 'Metro', 'Providence', 'Billings', 'Enterprise', 'Sale', 'York');

-- Visa and remote
update listing set visa = true  where fetch_job_id = $1 and  ts_rank(to_tsvector('english', description),  to_tsquery('visa'))  > 0.05 ;
update listing set remote = true  where fetch_job_id = $1 and  ts_rank(to_tsvector('english', description),  to_tsquery('remote'))  > 0.05 ;
$_$ LANGUAGE sql;


----------------- End of So Jobs Application tables ----------------- 

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: jobs
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobs
--

ALTER SEQUENCE user_id_seq OWNED BY "user".id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jobs
--

ALTER TABLE ONLY acl ALTER COLUMN id SET DEFAULT nextval('acl_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jobs
--

ALTER TABLE ONLY city ALTER COLUMN id SET DEFAULT nextval('city_id_seq'::regclass);



--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jobs
--

ALTER TABLE ONLY role ALTER COLUMN id SET DEFAULT nextval('role_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jobs
--

ALTER TABLE ONLY rolemapping ALTER COLUMN id SET DEFAULT nextval('rolemapping_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: jobs
--

ALTER TABLE ONLY "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq'::regclass);


--
-- Name: accesstoken_pkey; Type: CONSTRAINT; Schema: public; Owner: jobs; Tablespace: 
--

ALTER TABLE ONLY accesstoken
    ADD CONSTRAINT accesstoken_pkey PRIMARY KEY (id);


--
-- Name: acl_pkey; Type: CONSTRAINT; Schema: public; Owner: jobs; Tablespace: 
--

ALTER TABLE ONLY acl
    ADD CONSTRAINT acl_pkey PRIMARY KEY (id);


--
-- Name: role_pkey; Type: CONSTRAINT; Schema: public; Owner: jobs; Tablespace: 
--

ALTER TABLE ONLY role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: rolemapping_pkey; Type: CONSTRAINT; Schema: public; Owner: jobs; Tablespace: 
--

ALTER TABLE ONLY rolemapping
    ADD CONSTRAINT rolemapping_pkey PRIMARY KEY (id);


--
-- Name: user_pkey; Type: CONSTRAINT; Schema: public; Owner: jobs; Tablespace: 
--

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);



