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

CREATE OR REPLACE FUNCTION split_linestring(id1 int, id2 int, vertex_id int, geom GEOMETRY(LINESTRING), source int, target int, length float, point GEOMETRY(POINT))
RETURNS SETOF RECORD
AS $$
  WITH midpoint AS (
    SELECT ST_LineLocatePoint(geom, point) AS distance
  )
  SELECT
    case t.id
      WHEN source THEN id1
      WHEN target THEN id2
    END AS id,
    vertex_id AS source,
    t.id AS target,
    CASE t.id
      WHEN source THEN length * distance
      WHEN target THEN length * (1 - distance)
    END AS length,
    CASE t.id
      WHEN source THEN ST_LineSubstring(geom, 0, distance)
      WHEN target THEN ST_LineSubstring(geom, distance, 1)
    END AS geom
  FROM UNNEST(ARRAY[source, target]) t(id), midpoint
$$
LANGUAGE SQL
IMMUTABLE;