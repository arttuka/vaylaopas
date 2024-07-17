import { z } from 'zod'

const pointSchema = z.tuple([z.number(), z.number()])

const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(pointSchema),
})

const lanePropertiesSchema = z.object({
  routeIndex: z.number().int(),
})

const laneSchema = z.object({
  type: z.literal('Feature'),
  properties: lanePropertiesSchema,
  geometry: lineStringSchema,
})

const routeSchema = z.object({
  found: z.boolean(),
  length: z.number().optional(),
  startAndEnd: z.tuple([laneSchema, laneSchema]),
  route: laneSchema,
  type: z.enum(['destination', 'via']),
})

export const routesSchema = z.array(routeSchema)
