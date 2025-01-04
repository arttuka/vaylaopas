import {
  AliasedExpression,
  AliasNode,
  Expression,
  Generated,
  IdentifierNode,
  Insertable,
  OperationNode,
  Selectable,
  sql,
} from 'kysely'

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

export type DbLane = Selectable<LaneTable>
export type DbLaneVertex = Selectable<LaneVerticesPgrTable>
export type DbExtraLane = Selectable<ExtraLaneTable>
export type NewExtraLane = Insertable<ExtraLaneTable>

export class GeometryValue implements Expression<string> {
  #value: string

  constructor(value: string) {
    this.#value = value
  }

  get expressionType(): string | undefined {
    return undefined
  }

  toOperationNode(): OperationNode {
    return sql`CAST(${this.#value} AS Geometry)`.toOperationNode()
  }
}

export class AliasedGeometryValue<A extends string>
  implements AliasedExpression<string, A>
{
  #expression: Expression<string>
  #alias: A

  constructor(expression: Expression<string>, alias: A) {
    this.#expression = expression
    this.#alias = alias
  }

  get expression(): Expression<string> {
    return this.#expression
  }

  get alias(): A {
    return this.#alias
  }

  toOperationNode(): AliasNode {
    return AliasNode.create(
      this.#expression.toOperationNode(),
      IdentifierNode.create(this.#alias)
    )
  }
}
