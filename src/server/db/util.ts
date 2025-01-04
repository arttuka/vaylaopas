import {
  AliasedRawBuilder,
  Compilable,
  CompiledQuery,
  Expression,
  sql,
} from 'kysely'
import { PgrDijkstra, SplitLinestring } from './types'

const getSqlType = <R extends Record<string, unknown>, K extends keyof R>(
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

export const values = <R extends Record<string, unknown>, A extends string>(
  records: R[],
  alias: A
): AliasedRawBuilder<R, A> => {
  // Assume there's at least one record and all records
  // have the same keys.
  const keys = Object.keys(records[0])
  const types = keys.map((k) => getSqlType(records, k))

  // Transform the records into a list of lists such as
  // ($1, $2, $3), ($4, $5, $6)
  const values = sql.join(
    records.map(
      (r) =>
        sql`(${sql.join(
          keys.map((k, i) => {
            const t = types[i]
            if (t != null) {
              return sql`${r[k]}::${sql.raw(t)}`
            } else {
              return r[k]
            }
          })
        )})`
    )
  )

  // Create the alias `v(id, v1, v2)` that specifies the table alias
  // AND a name for each column.
  const wrappedAlias = sql.ref(alias)
  const wrappedColumns = sql.join(keys.map(sql.ref))
  const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`

  // Finally create a single `AliasedRawBuilder` instance of the
  // whole thing. Note that we need to explicitly specify
  // the alias type using `.as<A>` because we are using a
  // raw sql snippet as the alias.
  return sql<R>`(values ${values})`.as<A>(aliasSql)
}

export const splitLinestring = <A extends string>(
  vertexIds: Expression<number[]>,
  points: Expression<string[]>,
  geom: Expression<string>,
  source: Expression<number>,
  target: Expression<number>,
  length: Expression<number>,
  alias: A
): AliasedRawBuilder<SplitLinestring, A> => {
  const wrappedAlias = sql.ref(alias)
  const wrappedColumns = sql.join(
    [
      ['id', 'integer'],
      ['source', 'integer'],
      ['target', 'integer'],
      ['length', 'float'],
      ['geom', 'geometry'],
    ].map(([k, t]) => sql`${sql.ref(k)}  ${sql.raw(t)}`)
  )
  const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`

  return sql<SplitLinestring>`split_linestring(${vertexIds}, ${points}, ${geom}, ${source}, ${target}, ${length})`.as<A>(
    aliasSql
  )
}

export const pgrDijkstra = <A extends string>(
  laneSql: string,
  vertexSql: string,
  alias: A
): AliasedRawBuilder<PgrDijkstra, A> =>
  sql<PgrDijkstra>`pgr_dijkstra(${sql.lit(laneSql)}, ${sql.lit(vertexSql)}, directed := false)`.as(
    alias
  )

export const hydrate = (query: CompiledQuery): string =>
  query.sql.replace(/(\$\d+)/g, (arg) =>
    String(query.parameters[parseInt(arg.slice(1)) - 1])
  )

export const logQuery = <T extends Compilable>(qb: T): T => {
  console.log(qb.compile())
  return qb
}
