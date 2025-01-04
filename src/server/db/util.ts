import {
  AliasableExpression,
  Compilable,
  Expression,
  ExpressionBuilder,
  ExtractTypeFromReferenceExpression,
  FunctionModule,
  Kysely,
  SelectQueryBuilder,
  SelectQueryBuilderWithInnerJoin,
  StringReference,
  TableExpression,
  Transaction,
  isExpression,
  sql,
} from 'kysely'
import { LineString } from 'geojson'
import {
  PgrDijkstra,
  SplitLinestring,
  TypedReferenceExpression,
  ValuesExpression,
} from './types'
import { NotEmptyArray } from '../../common/types'
import { splitLast } from '../../common/util'

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
      return 'real'
    }
  }
  return null
}

export const joinList = (array: unknown[]) => sql`(${sql.join(array)})`

export const values = <T extends Record<string, unknown>>(
  records: T[]
): AliasableExpression<T> => new ValuesExpression(records)

type AggExpression<Db, Tb extends keyof Db> =
  | StringReference<Db, Tb>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | Expression<any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseAggExpression = (exp: AggExpression<any, any>) =>
  isExpression(exp) ? exp : sql.ref(exp)

export const aggBuilder =
  <Db, Tb extends keyof Db>(fn: FunctionModule<Db, Tb>, name: string) =>
  <
    O,
    RE extends AggExpression<Db, Tb> = AggExpression<Db, Tb>,
    OE extends AggExpression<Db, Tb> = AggExpression<Db, Tb>,
  >(
    args: Readonly<NotEmptyArray<RE>>,
    orderBy: OE,
    dir: 'asc' | 'desc' = 'asc'
  ) => {
    const [firstArgs, lastArg] = splitLast(args)
    return fn.agg<O, RE>(name, [
      ...firstArgs,
      sql`${parseAggExpression(lastArg)} ORDER BY ${parseAggExpression(orderBy)} ${sql.raw(dir)}` as unknown as RE,
    ])
  }

export const splitLinestring = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  vertexIds: TypedReferenceExpression<Db, Tb, number[]>,
  points: TypedReferenceExpression<Db, Tb, string[]>,
  geom: TypedReferenceExpression<Db, Tb, string>,
  source: TypedReferenceExpression<Db, Tb, number>,
  target: TypedReferenceExpression<Db, Tb, number>,
  length: TypedReferenceExpression<Db, Tb, number>
): AliasableExpression<SplitLinestring[]> =>
  eb.fn<SplitLinestring[]>('split_linestring', [
    vertexIds,
    points,
    geom,
    source,
    target,
    length,
  ])

export const pgrDijkstra = <Db>(
  db: Transaction<Db>,
  laneSql: string,
  vertexSql: string
): AliasableExpression<PgrDijkstra> =>
  db.fn('pgr_dijkstra', [sql.lit(laneSql), sql.lit(vertexSql), sql.lit(false)])

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

export const asJSON = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  expr: TypedReferenceExpression<Db, Tb, string>
) => eb.cast<LineString>(eb.fn('AsJSON', [expr]), 'jsonb')

export const makeLine = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  ...exprs: TypedReferenceExpression<Db, Tb, string>[]
) => asJSON(eb, eb.fn('ST_MakeLine', exprs))

export const makeLineAgg = <Db, Tb extends keyof Db>(
  eb: ExpressionBuilder<Db, Tb>,
  expr: TypedReferenceExpression<Db, Tb, string>,
  orderBy: AggExpression<Db, Tb>
) => asJSON(eb, aggBuilder(eb.fn, 'ST_MakeLine')([expr], orderBy))

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

export const unnest = <Db, Tb extends keyof Db, T, A extends string>(
  eb: ExpressionBuilder<Db, Tb>,
  expr: TypedReferenceExpression<Db, Tb, T[]>,
  alias: A
) => eb.fn<T>('unnest', [expr]).as(alias)

declare module 'kysely/dist/cjs/query-builder/select-query-builder' {
  interface SelectQueryBuilder<DB, TB extends keyof DB, O> {
    crossJoinLateral<TE extends TableExpression<DB, TB>>(
      table: TE
    ): SelectQueryBuilderWithInnerJoin<DB, TB, O, TE>
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extendKysely = (db: Kysely<any>) => {
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
