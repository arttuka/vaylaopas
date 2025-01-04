CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

CREATE OR REPLACE FUNCTION Endpoints(g geometry) RETURNS geometry
AS $$
  DECLARE
    points geometry;
  BEGIN
    CASE
      WHEN GeometryType(g) = 'POINT' THEN
        points = g;
      WHEN GeometryType(g) = 'MULTIPOINT' THEN
        points = g;
      WHEN GeometryType(g) = 'LINESTRING' THEN
        points = ST_Collect(ST_StartPoint(g), ST_EndPoint(g));
      WHEN GeometryType(g) IN ('MULTILINESTRING', 'GEOMETRYCOLLECTION') THEN
        SELECT INTO points
        ST_Collect(array_agg(p.geom))
        FROM ST_Dump(g) AS l, ST_Dump(Endpoints(l.geom)) AS p;
      ELSE
        RAISE EXCEPTION 'Unknown geometry type %', GeometryType(g);
    END CASE;
    RETURN points;
  END
$$
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION AsJSON(g geometry) RETURNS text
AS $$
  SELECT ST_AsGeoJSON(ST_Transform(g, 4326), 6)
$$
LANGUAGE SQL
IMMUTABLE
RETURNS NULL ON NULL INPUT;

CREATE SEQUENCE extra_lane_id_seq INCREMENT -1 MINVALUE -2147483648 MAXVALUE -2 START -2 CYCLE;

CREATE TYPE split_linestring_result AS (id int, source int, target int, length real, geom Geometry(LineString, 3067));

CREATE OR REPLACE FUNCTION split_linestring(vertex_ids INT[], points GEOMETRY(POINT)[], geom GEOMETRY(LINESTRING, 3067), source INT, target INT, length REAL)
RETURNS split_linestring_result[]
AS $$
BEGIN
  RETURN ARRAY(
    SELECT row(
      nextval('extra_lane_id_seq')::INTEGER,
      LAG(vertex_id, 1, source) OVER (ORDER BY distance ASC),
      vertex_id,
      length * (distance - LAG(distance, 1, 0.0) OVER (ORDER BY distance ASC)),
      ST_LineSubstring(geom, LAG(distance, 1, 0.0) OVER (ORDER BY distance ASC), distance)
    )
    FROM
      (
        SELECT v.vertex_id, ST_LineLocatePoint(geom, v.point) AS distance
        FROM UNNEST(vertex_ids, points) v(vertex_id, point)
        UNION
        (VALUES (target, 1.0))
      ) v(vertex_id, distance)
    ORDER BY distance ASC
  );
END
$$
LANGUAGE plpgsql
VOLATILE;

CREATE TABLE IF NOT EXISTS map_load (id BIGSERIAL PRIMARY KEY, timestamp TIMESTAMPTZ DEFAULT NOW());

CREATE OR REPLACE PROCEDURE create_temp_tables()
AS $$
  CREATE TEMPORARY TABLE extra_lane (
    id integer PRIMARY KEY,
    laneid integer,
    source integer,
    target integer,
    length real,
    depth real,
    height real,
    geom Geometry(LineString, 3067)
  ) ON COMMIT DROP;

  CREATE TEMPORARY TABLE endpoint (
    seq integer PRIMARY KEY,
    lane integer,
    vertex integer,
    geometry Geometry(LineString, 3067),
    point Geometry(Point, 3067),
    type text
  ) ON COMMIT DROP;

  CREATE TEMPORARY VIEW segment AS (
    SELECT
      source.seq,
      source.vertex AS source, target.vertex AS target,
      source.point AS source_point, target.point AS target_point,
      source.geometry AS source_geometry, target.geometry AS target_geometry,
      source.type,
      source.type = 'viadirect' OR target.type = 'viadirect' AS direct
    FROM endpoint AS source
    JOIN endpoint AS target
    ON target.seq = source.seq + 1
  );
$$
LANGUAGE SQL;
