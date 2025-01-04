import {
  AliasableExpression,
  AliasedExpression,
  AliasNode,
  Expression,
  ExtractTypeFromStringReference,
  Generated,
  isExpression,
  OperandExpression,
  OperationNode,
  sql,
  StringReference,
} from 'kysely'
import { joinList, getSqlType } from './util'

export type Database = {
  lane: LaneTable
  lane_vertices_pgr: LaneVerticesPgrTable
  extra_lane: ExtraLaneTable
}

export type BaseLaneTable = {
  id: number
  source: number
  target: number
  length: number
  depth: number
  height: number
  geom: string
}

export type LaneTable = BaseLaneTable & {
  segment: number
  jnro: number
  jnropart: number
  name: string
}

export type LaneVerticesPgrTable = {
  id: Generated<number>
  the_geom: string
}

export type ExtraLaneTable = BaseLaneTable & {
  laneid: number
}

export type SplitLinestring = {
  id: number
  source: number
  target: number
  length: number
  geom: string
}

export type PgrDijkstra = {
  seq: number
  path_seq: number
  start_vid: number
  end_vid: number
  node: number
  edge: number
  cost: number
  agg_cost: number
}

export type TypedStringReference<Db, Tb extends keyof Db, T> = {
  [Re in StringReference<Db, Tb>]: T extends ExtractTypeFromStringReference<
    Db,
    Tb,
    Re
  >
    ? Re
    : never
}[StringReference<Db, Tb>]

export type TypedReferenceExpression<Db, Tb extends keyof Db, T> =
  | TypedStringReference<Db, Tb, T>
  | OperandExpression<T>

type RecordWithExpression<T extends Record<string, unknown>> = {
  [K in keyof T]: Expression<T[K]>
}

export type RecordWithValueOrExpression<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] | Expression<T[K]>
}

const wrapRecord = <T extends Record<string, unknown>>(
  r: RecordWithValueOrExpression<T>
) => {
  const ret: Record<string, unknown> = {}
  for (const k in r) {
    ret[k] = isExpression(r[k]) ? r[k] : sql.val(r[k])
  }
  return ret as RecordWithExpression<T>
}

export class ValuesExpression<T extends Record<string, unknown>>
  implements AliasableExpression<T>
{
  #expression: Expression<T>
  #keys: (keyof T & string)[]

  constructor(records: RecordWithValueOrExpression<T>[]) {
    const recs = records.map(wrapRecord)
    if (recs.length === 0) {
      throw new Error('Empty values list')
    } else {
      const keys = Object.keys(recs[0])
      const types = keys.map((k) => getSqlType(records, k))
      const values = recs.map((r) =>
        joinList(
          keys.map((k, i) => {
            const t = types[i]
            return t != null ? sql`${r[k]}::${sql.raw(t)}` : r[k]
          })
        )
      )
      this.#expression = sql<T>`(values ${sql.join(values)})`
      this.#keys = keys as (keyof T & string)[]
    }
  }

  get expression(): Expression<T> {
    return this.#expression
  }

  get expressionType(): T | undefined {
    return undefined
  }

  toOperationNode(): OperationNode {
    return this.#expression.toOperationNode()
  }

  as<A extends string>(alias: A): AliasedExpression<T, A> {
    return new AliasListExpression(this.#expression, alias, this.#keys)
  }
}

export class AliasListExpression<T, A extends string>
  implements AliasedExpression<T, A>
{
  #expression: Expression<T>
  #alias: Expression<unknown>

  constructor(
    expression: Expression<T>,
    alias: A,
    columns: (keyof T & string)[] | [keyof T & string, string][]
  ) {
    this.#expression = expression
    const wrappedAlias = sql.ref(alias)
    const wrappedColumns = columns.map((c) =>
      typeof c === 'string'
        ? sql.ref(c)
        : sql`${sql.ref(c[0])} ${sql.raw(c[1])}`
    )
    this.#alias = sql`${wrappedAlias}${joinList(wrappedColumns)}`
  }

  get expression(): Expression<T> {
    return this.#expression
  }

  get alias(): Expression<unknown> {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#expression.toOperationNode(),
      this.#alias.toOperationNode()
    )
  }
}
