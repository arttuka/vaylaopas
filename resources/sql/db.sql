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
