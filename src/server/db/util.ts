import {
  AliasableExpression,
  AliasedExpression,
  Compilable,
  Expression,
  ExpressionBuilder,
  ExtractTypeFromReferenceExpression,
  Kysely,
  SelectQueryBuilder,
  SelectQueryBuilderWithInnerJoin,
  StringReference,
  TableExpression,
  Transaction,
  sql,
} from 'kysely'
import { LineString } from 'geojson'
import {
  AliasListExpression,
  PgrDijkstra,
  RecordWithValueOrExpression,
  SplitLinestring,
  TypedReferenceExpression,
  ValuesExpression,
} from './types'

export const getSqlType = <
  R extends Record<string, unknown>,
  K extends keyof R,
>(
  records: R[],
  key: K
) => {
  const vals = records.map((r) => r[key])
  if (vals.every((v) => typeof v === 'number')) {
    if (vals.every((v) => Number.isInteger(v))) {
      return 'integer'
    } else {
      return 'double precision'
    }
  }
  return null
}

export const joinList = (array: unknown[]) => sql`(${sql.join(array)})`

export const values = <T extends Record<string, unknown>>(
  records: RecordWithValueOrExpression<T>[]
): AliasableExpression<T> => {
  return new ValuesExpression(records)
}

export const splitLinestring = <Db, Tb extends keyof Db, A extends string>(
  eb: ExpressionBuilder<Db, Tb>,
  vertexIds: TypedReferenceExpression<Db, Tb, number[]>,
  points: TypedReferenceExpression<Db, Tb, string[]>,
  geom: TypedReferenceExpression<Db, Tb, string>,
  source: TypedReferenceExpression<Db, Tb, number>,
  target: TypedReferenceExpression<Db, Tb, number>,
  length: TypedReferenceExpression<Db, Tb, number>,
  alias: A
): AliasedExpression<SplitLinestring, A> =>
  new AliasListExpression(
    eb.fn<SplitLinestring>('split_linestring', [
      vertexIds,
      points,
      geom,
      source,
      target,
      length,
    ]),
    alias,
    [
      ['id', 'integer'],
      ['source', 'integer'],
      ['target', 'integer'],
      ['length', 'float'],
      ['geom', 'geometry'],
    ]
  )

export const pgrDijkstra = <Db, A extends string>(
  db: Transaction<Db>,
  laneSql: string,
  vertexSql: string,
  alias: A
): AliasedExpression<PgrDijkstra, A> =>
  new AliasListExpression(
    db.fn<PgrDijkstra>('pgr_dijkstra', [
      sql.lit(laneSql),
      sql.lit(vertexSql),
      sql.lit(false),
    ]),
    alias,
    [
      'seq',
      'path_seq',
      'start_vid',
      'end_vid',
      'node',
      'edge',
      'cost',
      'agg_cost',
    ]
  )

export const hydrate = <Db, Tb extends keyof Db, O>(
  qb: SelectQueryBuilder<Db, Tb, O>
) => {
  const query = qb.compile()
  return query.sql.replace(/(\$\d+)/g, (arg) =>
    String(query.parameters[parseInt(arg.slice(1)) - 1])
  )
}

export const logQuery = <T extends Compilable>(qb: T): T => {
  console.log(qb.compile())
  return qb
}

export const maybeUnion = <
  Db1,
  Tb1 extends keyof Db1,
  O,
  Db2,
  Tb2 extends keyof Db2,
>(
  q1: SelectQueryBuilder<Db1, Tb1, O> | null,
  q2: SelectQueryBuilder<Db2, Tb2, O> | null
) => {
  if (q1 && q2) {
    return q1.union(q2)
  } else if (q1) {
    return q1
  } else if (q2) {
    return q2
  }
  throw Error('both selects are empty')
}

export const asJSON = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  expr: Expression<string>
) => eb.cast<LineString>(eb.fn('AsJSON', [expr]), 'jsonb')

export const makeLine = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  ...exprs: TypedReferenceExpression<Db, Tb, string>[]
) => asJSON(eb, eb.fn('ST_MakeLine', exprs))

export const makeLineAgg = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  expr: Expression<string>,
  orderBy: StringReference<Db, Tb>
) =>
  asJSON(
    eb,
    eb.fn.agg('ST_MakeLine', [sql`${expr} ORDER BY ${eb.ref(orderBy)}`])
  )

export const makePoint = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  lng: TypedReferenceExpression<Db, Tb, number>,
  lat: TypedReferenceExpression<Db, Tb, number>
) =>
  eb.fn<string>('ST_Transform', [
    eb.fn('ST_SetSRID', [eb.fn('ST_MakePoint', [lng, lat]), eb.lit(4326)]),
    eb.lit(3067),
  ])

export const whereNullOrGreater =
  <Db, Tb extends keyof Db, O, Re extends StringReference<Db, Tb>>(
    col: Re,
    val?: ExtractTypeFromReferenceExpression<Db, Tb, Re> | null
  ) =>
  (qb: SelectQueryBuilder<Db, Tb, O>) =>
    val == null ? qb : qb.where((eb) => eb(col, 'is', null).or(col, '>=', val))

declare module 'kysely/dist/cjs/query-builder/select-query-builder' {
  interface SelectQueryBuilder<DB, TB extends keyof DB, O> {
    crossJoinLateral<TE extends TableExpression<DB, TB>>(
      table: TE
    ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>
  }
}

export const extendKysely = <T>(db: Kysely<T>) => {
  Object.getPrototypeOf(db.selectFrom(sql``.as('t'))).crossJoinLateral =
    function crossJoinLateral<
      Db,
      Tb extends keyof Db,
      O,
      Te extends TableExpression<Db, Tb>,
    >(this: SelectQueryBuilder<Db, Tb, O>, table: Te) {
      return this.innerJoinLateral(table, (join) => join.onTrue())
    }
}
