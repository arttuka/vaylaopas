import { Pool } from 'pg'
import { LineString } from 'geojson'
import {
  AliasableExpression,
  ExpressionBuilder,
  Kysely,
  PostgresDialect,
  QueryCreator,
  SqlBool,
  Transaction,
  sql,
} from 'kysely'
import config from '../config'
import { Lane, Route, RouteType, Waypoint } from '../../common/types'
import { Database, PgrDijkstra } from './types'
import {
  arrayAgg,
  asJSON,
  distance,
  extendKysely,
  hydrate,
  makeLine,
  makeLineAgg,
  makePoint,
  pgrDijkstra,
  splitLinestring,
  unnest,
  values,
  whereNullOrGreater,
} from './util'

const dialect = new PostgresDialect({
  pool: new Pool(config.db),
})

const db = new Kysely<Database>({
  dialect,
  log(event) {
    if (event.level === 'error') {
      console.error('Query failed : ', {
        durationMs: event.queryDurationMillis,
        error: event.error,
        sql: event.query.sql,
        params: event.query.parameters,
      })
    }
  },
})

extendKysely(db)

const formatLane = (
  geometry: LineString,
  routeIndex: number,
  routeType: RouteType
): Lane => ({
  type: 'Feature',
  geometry,
  properties: {
    routeIndex,
    routeType,
  },
})

const insertEndpoints = async (
  tx: Transaction<Database>,
  points: Waypoint[],
  depth?: number
): Promise<void> => {
  const ps = points.map((p, i) => ({
    lng: p.lng,
    lat: p.lat,
    type: p.type,
    seq: i,
  }))

  await tx
    .with('origin', (db) =>
      db
        .selectFrom(values(ps).as('p'))
        .select((eb) => [
          'type',
          'seq',
          makePoint(eb, 'lng', 'lat').as('geom'),
          eb('type', '=', sql.lit('viadirect' as const)).as('direct'),
        ])
    )
    .insertInto('endpoint')
    .columns(['seq', 'lane', 'vertex', 'geometry', 'point', 'type'])
    .expression((eb) =>
      eb
        .selectFrom('origin')
        .crossJoinLateral((eb) =>
          eb
            .selectFrom('lane')
            .select(({ eb, fn, ref }) => [
              'id',
              'source',
              'target',
              eb
                .case()
                .when(ref('origin.direct'))
                .then(ref('origin.geom'))
                .else(
                  fn<string>('ST_ClosestPoint', ['lane.geom', 'origin.geom'])
                )
                .end()
                .as('point'),
            ])
            .$call(whereNullOrGreater('depth', depth))
            .orderBy((eb) => distance(eb, 'lane.geom', 'origin.geom'))
            .limit(sql.lit(1))
            .as('l')
        )
        .innerJoin('lane_vertices_pgr as s', 'l.source', 's.id')
        .innerJoin('lane_vertices_pgr as t', 'l.target', 't.id')
        .select(({ eb, fn, lit, neg, parens, ref }) => [
          'origin.seq',
          eb
            .case()
            .when(ref('origin.direct'))
            .then(null)
            .else(ref('l.id'))
            .end()
            .as('lane'),
          eb
            .case('l.point')
            .when(ref('s.the_geom'))
            .then(ref('l.source'))
            .when(ref('t.the_geom'))
            .then(ref('l.target'))
            .else(neg(parens('origin.seq', '+', lit(2))))
            .end()
            .as('vertex'),
          fn('ST_MakeLine', ['origin.geom', 'l.point']).as('geometry'),
          'l.point',
          'origin.type',
        ])
        .orderBy('origin.seq asc')
    )
    .execute()
}

const assertNumber = (n?: number): void => {
  if (n !== undefined && typeof n !== 'number') {
    throw new Error(`Expected ${n} to be a number, got ${typeof n}`)
  }
}

const insertExtraLanes = async (tx: Transaction<Database>): Promise<void> => {
  await tx
    .with('lane_endpoints', (db) =>
      db
        .selectFrom('endpoint')
        .select(({ fn }) => [
          'lane as laneid',
          arrayAgg(fn, ['vertex'], 'seq').as('vertex_ids'),
          arrayAgg(fn, ['point'], 'seq').as('points'),
        ])
        .where('type', '!=', sql.lit('viadirect' as const))
        .where('vertex', '<', sql.lit(0))
        .groupBy(['lane'])
    )
    .insertInto('extra_lane')
    .columns([
      'id',
      'laneid',
      'source',
      'target',
      'length',
      'depth',
      'height',
      'geom',
    ])
    .expression((eb) =>
      eb
        .selectFrom('segment')
        .select(({ fn, lit }) => [
          fn<number>('nextval', [sql.lit('extra_lane_id_seq')]).as('id'),
          lit<number | null>(null).as('laneid'),
          'source',
          'target',
          fn<number>('ST_Distance', ['source_point', 'target_point']).as(
            'length'
          ),
          lit<number | null>(null).as('depth'),
          lit<number | null>(null).as('height'),
          fn<string>('ST_MakeLine', ['source_point', 'target_point']).as(
            'geom'
          ),
        ])
        .where(({ ref }) => ref('direct'))
        .union(
          eb
            .selectFrom('lane as l')
            .innerJoin('lane_endpoints as p', 'p.laneid', 'l.id')
            .crossJoinLateral((eb) =>
              unnest(
                eb,
                splitLinestring(
                  eb,
                  'p.vertex_ids',
                  'p.points',
                  'l.geom',
                  'l.source',
                  'l.target',
                  'l.length'
                ),
                's'
              )
            )
            .select([
              's.id',
              'l.id as laneid',
              's.source',
              's.target',
              's.length',
              'l.depth',
              'l.height',
              's.geom',
            ])
        )
    )
    .execute()
}

const getRouteBetweenVertices = async (
  tx: Transaction<Database>,
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const makeSelect = <T extends 'lane' | 'extra_lane'>(
    db: QueryCreator<Database>,
    table: T
  ) =>
    db
      .selectFrom<'lane' | 'extra_lane'>(table)
      .select(['id', 'source', 'target', 'length as cost'])
      .$call(whereNullOrGreater('depth', depth))
      .$call(whereNullOrGreater('height', height))

  const laneSql = hydrate(
    makeSelect(tx, 'lane').union(makeSelect(tx, 'extra_lane'))
  )

  const vertexSql = hydrate(
    tx.selectFrom('segment').select(['source', 'target'])
  )

  type EB<T extends 'lane' | 'extra_lane'> = ExpressionBuilder<
    Database & { route: PgrDijkstra; l: Database[T] },
    'l' | 'route'
  >

  const makeLaneSelect = <T extends 'lane' | 'extra_lane'>(
    db: QueryCreator<Database & { route: PgrDijkstra }>,
    table: T,
    outside: (eb: EB<T>) => AliasableExpression<SqlBool>
  ) =>
    db
      .selectFrom<'lane' | 'extra_lane'>(table)
      .innerJoin('route', 'route.edge', 'id')
      .select(({ eb, fn, ref }) => [
        'length',
        eb
          .case()
          .when(eb('source', '=', ref('route.node')))
          .then(ref('geom'))
          .else(fn<string>('ST_Reverse', ['geom']))
          .end()
          .as('geom'),
        'route.seq',
        'route.start_vid as segment_source',
        'route.end_vid as segment_target',
        outside(eb as EB<T>).as('outside'),
      ])

  const result = await tx
    .with('route', (db) =>
      db
        .selectFrom(pgrDijkstra(tx, laneSql, vertexSql).as('r'))
        .select(['seq', 'start_vid', 'end_vid', 'node', 'edge'])
    )
    .with('lanes', (db) =>
      makeLaneSelect(db, 'lane', () => sql.lit(false)).union(
        makeLaneSelect(db, 'extra_lane', (eb) => eb('laneid', 'is', null))
      )
    )
    .selectFrom('segment as s')
    .leftJoin('lanes as l', (join) =>
      join
        .onRef('l.segment_source', '=', 's.source')
        .onRef('l.segment_target', '=', 's.target')
    )
    .select(({ eb, fn, lit }) => [
      's.seq',
      eb(fn.count('l.length'), '>', lit(0)).as('found'),
      fn.sum<number>('l.length').as('length'),
      fn
        .coalesce(
          makeLineAgg(eb, 'l.geom', 'l.seq'),
          makeLine(eb, 's.source_point', 's.target_point')
        )
        .as('geometry'),
      asJSON(eb, 's.source_geometry').as('source_geometry'),
      asJSON(eb, 's.target_geometry').as('target_geometry'),
      eb
        .case()
        .when(fn.agg('bool_or', ['l.outside']))
        .then(sql.lit('outside' as const))
        .else(sql.lit('regular' as const))
        .end()
        .as('route_type'),
      's.type',
    ])
    .groupBy([
      's.seq',
      's.source_geometry',
      's.target_geometry',
      's.source_point',
      's.target_point',
      's.type',
    ])
    .orderBy('s.seq asc')
    .execute()

  return result.map((r) => ({
    route: formatLane(r.geometry, r.seq, r.route_type),
    startAndEnd: [
      formatLane(r.source_geometry, r.seq, 'regular'),
      formatLane(r.target_geometry, r.seq, 'regular'),
    ],
    found: Boolean(r.found),
    type: r.type,
    length: r.length ?? undefined,
  }))
}

const createTempTables = (tx: Transaction<Database>) =>
  sql`CALL create_temp_tables()`.execute(tx)

export const getRoute = async (
  points: Waypoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  assertNumber(depth)
  assertNumber(height)
  return db.transaction().execute(async (tx) => {
    await createTempTables(tx)
    await insertEndpoints(tx, points, depth)
    await insertExtraLanes(tx)
    return getRouteBetweenVertices(tx, depth, height)
  })
}
