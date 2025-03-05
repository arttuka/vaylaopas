import { z } from 'zod'

const pointSchema = z.tuple([z.number(), z.number()])

const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(pointSchema),
})

const routeFeaturePropertiesSchema = z.object({
  routeIndex: z.number().int(),
  routeType: z.enum(['regular', 'outside']),
})

const routeFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: routeFeaturePropertiesSchema,
  geometry: lineStringSchema,
})

const lineStringFeatureSchema = z.object({
  type: z.literal('Feature'),
  properties: z.record(z.never()),
  geometry: lineStringSchema,
})

const routeSchema = z.object({
  found: z.boolean(),
  length: z.number().optional(),
  geometry: routeFeatureSchema,
  type: z.enum(['destination', 'via', 'viadirect']),
})

export const apiRoutesSchema = z.object({
  routes: z.array(routeSchema),
  waypointLines: z.array(lineStringFeatureSchema),
})
