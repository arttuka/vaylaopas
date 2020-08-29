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

CREATE SEQUENCE extra_lane_id_seq INCREMENT -1 MINVALUE -2147483648 MAXVALUE -1 START -1 CYCLE;

CREATE OR REPLACE FUNCTION split_linestring(vertex_ids INT[], points GEOMETRY(POINT)[], geom GEOMETRY(LINESTRING), source INT, target INT, length FLOAT)
RETURNS SETOF RECORD
AS $$
  SELECT
    nextval('extra_lane_id_seq')::INTEGER AS id,
    LAG(vertex_id, 1, source) OVER (ORDER BY distance ASC) AS source,
    vertex_id AS target,
    length * (distance - LAG(distance, 1, 0.0::double precision) OVER (ORDER BY distance ASC)) AS length,
    ST_LineSubstring(geom, LAG(distance, 1, 0.0::double precision) OVER (ORDER BY distance ASC), distance) AS geom
  FROM
    (
      SELECT v.vertex_id, ST_LineLocatePoint(geom, v.point) AS distance
      FROM UNNEST(vertex_ids, points) v(vertex_id, point)
      UNION
      (VALUES (target, 1.0))
    ) v(vertex_id, distance)
  ORDER BY distance ASC
$$
LANGUAGE SQL
IMMUTABLE;