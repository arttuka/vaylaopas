import { Pool } from 'pg'
import { LineString, Position } from 'geojson'
import {
  Expression,
  ExpressionBuilder,
  Kysely,
  PostgresDialect,
  SelectQueryBuilder,
  SqlBool,
  Transaction,
  sql,
} from 'kysely'
import config from '../config'
import { Lane, Route, Waypoint, WaypointType } from '../../common/types'
import { partition } from '../../common/util'
import { Database, BaseLaneTable } from './types'
import { hydrate, pgrDijkstra, splitLinestring, values } from './util'

const dialect = new PostgresDialect({
  pool: new Pool(config.db),
})

const db = new Kysely<Database>({
  dialect,
})

const formatLane = (
  geometry: LineString,
  routeIndex: number,
  routeType: 'regular' | 'outside'
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
    lng: p.lng,
    lat: p.lat,
    type: p.type,
    seq: i,
  }))
  return tx
    .with('origin', (db) =>
      db.selectFrom(values(ps, 'ps')).select(({ ref }) => [
        'type',
        'seq',
        sql<string>`
          ST_Transform(
            ST_SetSRID(
              ST_MakePoint(${ref('lng')}, ${ref('lat')}),
              4326
            ),
            3067
          )`.as('geom'),
      ])
    )
    .selectFrom('origin')
    .innerJoinLateral(
      (db) => {
        let query = db.selectFrom('lane').select(({ ref }) => [
          'id',
          'source',
          'target',
          sql<string>`
            CASE ${ref('origin.type')}
              WHEN 'viadirect' THEN ${ref('origin.geom')}
              ELSE ST_ClosestPoint(${ref('lane.geom')}, ${ref('origin.geom')})
            END`.as('point'),
        ])
        if (depth !== undefined) {
          query = query.where((eb) =>
            eb.or([eb('depth', 'is', null), eb('depth', '>=', depth)])
          )
        }
        return query
          .orderBy(
            ({ ref }) => sql`${ref('lane.geom')} <-> ${ref('origin.geom')}`
          )
          .limit(1)
          .as('l')
      },
      (join) => join.onTrue()
    )
    .innerJoin('lane_vertices_pgr as s', 'l.source', 's.id')
    .innerJoin('lane_vertices_pgr as t', 'l.target', 't.id')
    .select(({ ref }) => [
      'l.id as lane',
      'l.point',
      sql<LineString>`AsJSON(ST_MakeLine(${ref('origin.geom')}, ${ref('l.point')}))::jsonb`.as(
        'geometry'
      ),
      'origin.type',
      sql<number>`
        CASE ${ref('l.point')}
          WHEN ${ref('s.the_geom')} THEN ${ref('l.source')}
          WHEN ${ref('t.the_geom')} THEN ${ref('l.target')}
          ELSE -(${ref('origin.seq')} + 1)
        END`.as('vertex'),
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
  const filteredEndpoints = endpoints.filter(
    ({ type, vertex }) => type !== 'viadirect' && vertex < 0
  )
  const ps = filteredEndpoints.length
    ? filteredEndpoints.map((p) => ({
        id: p.vertex,
        laneid: p.lane,
        point: p.point,
      }))
    : [
        {
          id: 0,
          laneid: -1,
          point: '',
        },
      ]
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
  await tx
    .with('lanepoints', (db) =>
      db
        .selectFrom(values(ps, 'p'))
        .innerJoin('lane as l', 'p.laneid', 'l.id')
        .select(({ fn }) => [
          fn.agg<number[]>('array_agg', ['p.id']).as('vertex_ids'),
          fn.agg<string[]>('array_agg', ['p.point']).as('points'),
          'l.id as laneid',
          'l.geom',
          'l.source',
          'l.target',
          'l.length',
          'l.depth',
          'l.height',
        ])
        .groupBy('l.id')
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
    .expression((eb) => {
      let qb = eb
        .selectFrom('lanepoints as p')
        .innerJoinLateral(
          ({ ref }) =>
            splitLinestring(
              ref('p.vertex_ids'),
              ref('p.points'),
              ref('p.geom'),
              ref('p.source'),
              ref('p.target'),
              ref('p.length'),
              's'
            ),
          (join) => join.onTrue()
        )
        .select([
          's.id',
          'p.laneid',
          's.source',
          's.target',
          's.length',
          'p.depth',
          'p.height',
          's.geom',
        ])
      if (directLanes.length) {
        qb = qb.union(
          tx.selectFrom(values(directLanes, 'lanes')).select(({ fn, ref }) => [
            fn<number>('nextval', [sql.lit('extra_lane_id_seq')]).as('id'),
            sql.lit<number>(null as any).as('laneid'), //eslint-disable-line
            'source',
            'target',
            sql<number>`ST_Distance(${ref('sourcePoint')}, ${ref('targetPoint')})`.as(
              'length'
            ),
            sql.lit<number>(null as any).as('depth'), //eslint-disable-line
            sql.lit<number>(null as any).as('height'), //eslint-disable-line
            sql<string>`ST_Makeline(${ref('sourcePoint')}, ${ref('targetPoint')})`.as(
              'geom'
            ),
          ])
        )
      }
      return qb
    })
    .execute()
}

const getRouteBetweenVertices = async (
  tx: Transaction<Database>,
  endpoints: RouteEndpoint[],
  depth?: number,
  height?: number
): Promise<Route[]> => {
  const whereSettings = (
    eb: ExpressionBuilder<Database, 'lane' | 'extra_lane'>
  ) => {
    const ands: Expression<SqlBool>[] = []
    if (depth !== undefined) {
      ands.push(
        eb.or([eb('depth', 'is', null), eb('depth', '>=', sql.lit(depth))])
      )
    }
    if (height !== undefined) {
      ands.push(
        eb.or([eb('height', 'is', null), eb('height', '>=', sql.lit(height))])
      )
    }
    return eb.and(ands)
  }

  const laneSql = tx
    .selectFrom('lane')
    .select(['id', 'source', 'target', 'length as cost'])
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom('extra_lane')
            .select(['id'])
            .whereRef('laneid', '=', 'lane.id')
        )
      )
    )
    .where(whereSettings)
    .unionAll(
      tx
        .selectFrom('extra_lane')
        .select(['id', 'source', 'target', 'length as cost'])
        .where(whereSettings)
    )
    .compile().sql

  const segments = partition(endpoints, 2, 1).map(([from, to], i) => ({
    v_from: from.vertex,
    v_to: to.vertex,
    v_num: i,
  }))

  const vertexSql = hydrate(
    tx
      .selectFrom(values(segments, 'v'))
      .select(['v_from as source', 'v_to as target'])
      .compile()
  )

  type WithIds<Db, M extends BaseLaneTable> = Db & {
    ids: {
      seq: number
      start_vid: number
      end_vid: number
      node: number
      id: number
    }
    l: M
  }

  const makeLaneSelect = <M extends BaseLaneTable, Db, O>(
    qb: SelectQueryBuilder<WithIds<Db, M>, 'l', O>
  ) =>
    qb
      .innerJoin('ids', 'l.id', 'ids.id')
      .select((eb) => [
        'l.length',
        'l.geom',
        sql<SqlBool>`${eb.ref('l.source')} = ${eb.ref('ids.node')}`.as(
          'forward'
        ),
        'ids.seq',
        'ids.start_vid',
        'ids.end_vid',
      ])

  const result = await tx
    .with('ids', (db) =>
      db
        .selectFrom(pgrDijkstra(laneSql, vertexSql, 'i'))
        .select(['edge as id', 'node', 'seq', 'start_vid', 'end_vid'])
    )
    .with('lanes', (db) =>
      db
        .selectFrom('lane as l')
        .$call(makeLaneSelect)
        .select([sql.lit<SqlBool>(false).as('outside')])
        .unionAll(
          db
            .selectFrom('extra_lane as l')
            .$call(makeLaneSelect)
            .select((eb) => [eb('laneid', 'is', null).as('outside')])
        )
    )
    .selectFrom(values(segments, 'v'))
    .leftJoin('lanes', (join) =>
      join.onRef('start_vid', '=', 'v_from').onRef('end_vid', '=', 'v_to')
    )
    .select((eb) => [
      eb(eb.fn<number>('count', ['length']), '>', sql.lit(0)).as('found'),
      eb.fn<number>('sum', ['length']).as('length'),
      sql<LineString>`AsJSON(ST_MakeLine(CASE WHEN ${eb.ref('forward')} THEN ${eb.ref('geom')} ELSE ST_Reverse(${eb.ref('geom')}) END ORDER BY ${eb.ref('seq')} ASC))::jsonb`.as(
        'geometry'
      ),
      sql<
        'outside' | 'regular'
      >`CASE WHEN BOOL_OR(${eb.ref('lanes.outside')}) THEN 'outside' ELSE 'regular' END`.as(
        'type'
      ),
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
