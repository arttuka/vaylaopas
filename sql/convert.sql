CREATE TABLE lane_single (
  id serial primary key,
  jnro integer,
  vay_nimisu varchar(254),
  vay_nimiru varchar(254),
  tila numeric,
  vaylalaji numeric,
  valaistus numeric,
  kulkusyv1 numeric,
  kulkusyv2 numeric,
  kulkusyv3 numeric,
  merial_nr numeric,
  seloste_al varchar(254),
  seloste_pa varchar(254),
  diaarinro varchar(254),
  vahv_pvm date,
  vayla_lk varchar(254),
  irrotus_pv varchar(254),
  source integer,
  target integer
);
SELECT AddGeometryColumn('public','lane_single','geom','3067','LINESTRING',2);
INSERT INTO lane_single
(jnro, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv, geom)
SELECT jnro::integer, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv, (ST_Dump(geom)).geom AS geom
FROM lane_tmp
ORDER BY jnro ASC;
DROP TABLE lane_tmp;

SELECT pgr_createTopology('lane_single', 10, 'geom', 'id');
SELECT pgr_analyzeGraph('lane_single', 10, 'geom', 'id');
SELECT pgr_nodeNetwork('lane_single', 10, 'id', 'geom');

DROP TABLE lane;
DROP TABLE lane_vertices_pgr;
CREATE TABLE lane (
  id serial primary key,
  jnro integer,
  sub_id integer,
  vay_nimisu varchar(254),
  vay_nimiru varchar(254),
  tila numeric,
  vaylalaji numeric,
  valaistus numeric,
  kulkusyv1 numeric,
  kulkusyv2 numeric,
  kulkusyv3 numeric,
  merial_nr numeric,
  seloste_al varchar(254),
  seloste_pa varchar(254),
  diaarinro varchar(254),
  vahv_pvm date,
  vayla_lk varchar(254),
  irrotus_pv varchar(254),
  length_m real,
  source integer,
  target integer
);
SELECT AddGeometryColumn('public','lane','geom','3067','LINESTRING',2);

INSERT INTO lane
(jnro, sub_id, vay_nimisu, vay_nimiru, tila, vaylalaji, valaistus, kulkusyv1, kulkusyv2, kulkusyv3, merial_nr, seloste_al, seloste_pa, diaarinro, vahv_pvm, vayla_lk, irrotus_pv, length_m, geom)
SELECT ls.jnro, ln.sub_id, ls.vay_nimisu, ls.vay_nimiru, ls.tila, ls.vaylalaji, ls.valaistus, ls.kulkusyv1, ls.kulkusyv2, ls.kulkusyv3, ls.merial_nr, ls.seloste_al, ls.seloste_pa, ls.diaarinro, ls.vahv_pvm, ls.vayla_lk, ls.irrotus_pv, ST_Length(ln.geom) AS length_m, ln.geom
FROM lane_single ls
JOIN lane_single_noded ln
ON ls.id = ln.old_id
WHERE NOT ST_IsEmpty(ln.geom);
DROP TABLE lane_single;
DROP TABLE lane_single_vertices_pgr;
DROP TABLE lane_single_noded;

SELECT pgr_createTopology('lane', 10, 'geom', 'id');
SELECT pgr_analyzeGraph('lane', 10, 'geom', 'id');

ALTER TABLE lane
ADD CONSTRAINT lane_source_fkey FOREIGN KEY(source) REFERENCES lane_vertices_pgr(id),
ADD CONSTRAINT lane_target_fkey FOREIGN KEY(target) REFERENCES lane_vertices_pgr(id);
