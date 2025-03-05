import { ApiRoutes, ClientConfig, Settings, Waypoint } from '../common/types'
import { apiRoutesSchema } from './schema'

export const getRoutes = async (
  waypoints: Waypoint[],
  { depth, height }: Settings
): Promise<ApiRoutes> => {
  const response = await fetch('/api/route', {
    method: 'POST',
    body: JSON.stringify({
      points: waypoints,
      depth,
      height,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (response.status >= 400) {
    throw new Error(`Call to /api/route failed with code ${response.status}`)
  }
  const parsed = apiRoutesSchema.safeParse(await response.json())
  if (parsed.success) {
    return parsed.data
  } else {
    console.log('Invalid data', parsed.error.issues)
    throw new Error(`Invalid data`)
  }
}

export const addMapLoad = async (): Promise<void> => {
  await fetch('/api/map-load', { method: 'POST' })
}

export const getConfig = async (): Promise<ClientConfig> => {
  const response = await fetch('/api/config', {
    method: 'GET',
  })

  if (response.status >= 400) {
    throw new Error(`Call to /api/config failed with code ${response.status}`)
  }
  return response.json()
}
