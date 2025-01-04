import { Pool } from 'pg'
import { LineString, Position } from 'geojson'
import {
  Kysely,
  PostgresDialect,
  QueryCreator,
  SelectQueryBuilder,
  Transaction,
  expressionBuilder,
  sql,
} from 'kysely'
import config from '../config'
import {
  Lane,
  Route,
  RouteType,
  Waypoint,
  WaypointType,
} from '../../common/types'
import { partition } from '../../common/util'
import { Database, ExtraLaneTable, LaneTable, PgrDijkstra } from './types'
import {
  extendKysely,
  hydrate,
  makeLine,
  makeLineAgg,
  makePoint,
  maybeUnion,
  pgrDijkstra,
  splitLinestring,
  values,
  whereNullOrGreater,
} from './util'

const dialect = new PostgresDialect({
  pool: new Pool(config.db),
})

const db = new Kysely<Database>({
  dialect,
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

const makeLinestring = (p1: Position, p2: Position): LineString => ({
  type: 'LineString',
  coordinates: [p1, p2],
})

type RouteEndpoint = {
  lane: number
  vertex: number
  geometry: LineString
  point: string
  type: WaypointType
}

const getClosestPoints = async (
  tx: Transaction<Database>,
  points: Waypoint[],
  depth?: number
): Promise<RouteEndpoint[]> => {
  const ps = points.map((p, i) => ({
    geom: makePoint(expressionBuilder(), sql.val(p.lng), sql.val(p.lat)),
    type: p.type,
    seq: i,
  }))

  return tx
    .selectFrom(values(ps).as('origin'))
    .crossJoinLateral((eb) =>
      eb
        .selectFrom('lane')
        .select(({ eb, fn, ref }) => [
          'id',
          'source',
          'target',
          eb
            .case('origin.type')
            .when(sql.lit('viadirect'))
            .then(ref('origin.geom'))
            .else(fn<string>('ST_ClosestPoint', ['lane.geom', 'origin.geom']))
            .end()
            .as('point'),
        ])
        .$call(whereNullOrGreater('depth', depth))
        .orderBy(({ eb, ref }) => eb('lane.geom', '<->', ref('origin.geom')))
        .limit(sql.lit(1))
        .as('l')
    )
    .innerJoin('lane_vertices_pgr as s', 'l.source', 's.id')
    .innerJoin('lane_vertices_pgr as t', 'l.target', 't.id')
    .select(({ eb, lit, neg, parens, ref }) => [
      'l.id as lane',
      'l.point',
      makeLine(eb, 'origin.geom', 'l.point').as('geometry'),
      'origin.type',
      eb
        .case('l.point')
        .when(ref('s.the_geom'))
        .then(ref('l.source'))
        .when(ref('t.the_geom'))
        .then(ref('l.target'))
        .else(neg(parens('origin.seq', '+', lit(1))))
        .end()
        .as('vertex'),
    ])
    .orderBy('origin.seq asc')
    .execute()
}

const assertNumber = (n?: number): void => {
  if (n !== undefined && typeof n !== 'number') {
    throw new Error(`Expected ${n} to be a number, got ${typeof n}`)
  }
}

type DirectLane = {
  source: number
  target: number
  sourcePoint: string
  targetPoint: string
}

const insertExtraLanes = async (
  tx: Transaction<Database>,
  endpoints: RouteEndpoint[]
): Promise<void> => {
  const ps = endpoints
    .filter(({ type, vertex }) => type !== 'viadirect' && vertex < 0)
    .map((p) => ({
      id: p.vertex,
      laneid: p.lane,
      point: p.point,
    }))
  const directLanes: DirectLane[] = []
  for (let i = 0; i < endpoints.length - 1; ++i) {
    const from = endpoints[i]
    const to = endpoints[i + 1]
    if (from.type === 'viadirect' || to.type === 'viadirect') {
      directLanes.push({
        source: from.vertex,
        target: to.vertex,
        sourcePoint: from.point,
        targetPoint: to.point,
      })
    }
  }
  const hasPoints = ps.length > 0
  const hasDirect = directLanes.length > 0

  if (hasPoints || hasDirect) {
    await tx
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
      .expression((eb) => {
        const q1 = hasPoints
          ? eb
              .selectFrom((eb) =>
                eb
                  .selectFrom(values(ps).as('ps'))
                  .select(({ fn }) => [
                    'laneid',
                    fn.agg<number[]>('array_agg', ['ps.id']).as('vertex_ids'),
                    fn.agg<string[]>('array_agg', ['ps.point']).as('points'),
                  ])
                  .groupBy('laneid')
                  .as('p')
              )
              .innerJoin('lane as l', 'p.laneid', 'l.id')
              .crossJoinLateral((eb) =>
                splitLinestring(
                  eb,
                  'p.vertex_ids',
                  'p.points',
                  'l.geom',
                  'l.source',
                  'l.target',
                  'l.length',
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
          : null
        const q2 = hasDirect
          ? eb
              .selectFrom(values(directLanes).as('lanes'))
              .select(({ fn, lit }) => [
                fn<number>('nextval', [sql.lit('extra_lane_id_seq')]).as('id'),
                lit<number | null>(null).as('laneid'),
                'source',
                'target',
                fn<number>('ST_Distance', ['sourcePoint', 'targetPoint']).as(
                  'length'
                ),
                lit<number | null>(null).as('depth'),
                lit<number | null>(null).as('height'),
                fn<string>('ST_MakeLine', ['sourcePoint', 'targetPoint']).as(
                  'geom'
                ),
              ])
          : null
        return maybeUnion(q1, q2)
      })
      .execute()
  }
}

const getRouteBetweenVertices = async (
  tx: Transaction<Database>,
  endpoints: RouteEndpoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const makeSelect = <T extends 'lane' | 'extra_lane'>(
    db: QueryCreator<Database>,
    table: T
  ) =>
    db
      .selectFrom<'lane as l' | 'extra_lane as l'>(`${table} as l`)
      .select(['id', 'source', 'target', 'length as cost'])
      .$call(whereNullOrGreater('depth', depth))
      .$call(whereNullOrGreater('height', height))

  const laneSql = hydrate(
    maybeUnion(
      makeSelect(tx, 'lane').where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom('extra_lane')
              .select('id')
              .whereRef('laneid', '=', 'l.id')
          )
        )
      ),
      makeSelect(tx, 'extra_lane')
    )
  )

  const segments = partition(endpoints, 2, 1).map(([from, to], i) => ({
    v_from: from.vertex,
    v_to: to.vertex,
    v_num: i,
  }))

  const vertexSql = hydrate(
    tx
      .selectFrom(values(segments).as('v'))
      .select(['v_from as source', 'v_to as target'])
  )

  type Out = {
    length: number
    geom: string
    forward: boolean
    seq: number
    start_vid: number
    end_vid: number
  }

  type LaneT<T extends 'lane' | 'extra_lane'> = 'lane' extends T
    ? LaneTable
    : 'extra_lane' extends T
      ? ExtraLaneTable
      : never

  const makeLaneSelect = <T extends 'lane' | 'extra_lane'>(
    table: T,
    db: QueryCreator<Database & { ids: PgrDijkstra }>
  ) =>
    db
      .selectFrom<'lane as l' | 'extra_lane as l'>(`${table} as l`)
      .innerJoin('ids', 'ids.edge', 'l.id')
      .select(({ eb, ref }) => [
        'l.length',
        'l.geom',
        eb('l.source', '=', ref('ids.node')).as('forward'),
        'ids.seq',
        'ids.start_vid',
        'ids.end_vid',
      ]) as SelectQueryBuilder<
      Database & { ids: PgrDijkstra; l: LaneT<T> },
      'ids' | 'l',
      Out
    >

  const result = await tx
    .with('ids', (db) =>
      db.selectFrom(pgrDijkstra(tx, laneSql, vertexSql, 'i')).selectAll()
    )
    .with('lanes', (db) =>
      maybeUnion(
        makeLaneSelect('lane', db).select(sql.lit(false).as('outside')),
        makeLaneSelect('extra_lane', db).select((eb) =>
          eb('laneid', 'is', null).as('outside')
        )
      )
    )
    .selectFrom(values(segments).as('v'))
    .leftJoin('lanes', (join) =>
      join.onRef('start_vid', '=', 'v_from').onRef('end_vid', '=', 'v_to')
    )
    .select(({ eb, fn, lit, ref }) => [
      eb(fn.count('length'), '>', lit(0)).as('found'),
      fn.sum<number>('length').as('length'),
      makeLineAgg(
        eb,
        eb
          .case()
          .when(ref('forward'))
          .then(ref('geom').$notNull())
          .else(fn<string>('ST_Reverse', ['geom']))
          .end(),
        'seq'
      ).as('geometry'),
      eb
        .case()
        .when(fn.agg('bool_or', ['lanes.outside']))
        .then(sql.lit('outside' as const))
        .else(sql.lit('regular' as const))
        .end()
        .as('type'),
    ])
    .groupBy('v_num')
    .orderBy('v_num asc')
    .execute()

  return result.map(({ geometry, length, found, type }, i) => {
    const from = endpoints[i]
    const to = endpoints[i + 1]
    const route = formatLane(
      found
        ? geometry
        : makeLinestring(
            from.geometry.coordinates[1],
            to.geometry.coordinates[1]
          ),
      i,
      type
    )
    return {
      route,
      startAndEnd: [
        formatLane(from.geometry, i, 'regular'),
        formatLane(to.geometry, i, 'regular'),
      ],
      found: Boolean(found),
      type: to.type,
      length: length || undefined,
    }
  })
}

export const getRoute = async (
  points: Waypoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  assertNumber(depth)
  assertNumber(height)
  return db.transaction().execute<Route[]>(async (tx) => {
    await tx.schema
      .createTable('extra_lane')
      .temporary()
      .onCommit('drop')
      .addColumn('id', 'integer')
      .addColumn('laneid', 'integer')
      .addColumn('source', 'integer')
      .addColumn('target', 'integer')
      .addColumn('length', 'integer')
      .addColumn('depth', 'integer')
      .addColumn('height', 'integer')
      .addColumn('geom', sql`Geometry`)
      .execute()
    const endpoints = await getClosestPoints(tx, points, depth)
    await insertExtraLanes(tx, endpoints)
    return getRouteBetweenVertices(tx, endpoints, depth, height)
  })
}
