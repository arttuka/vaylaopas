import { RouteNotFoundError, Route, Settings, Waypoint } from '../common/types'

export const getRoutes = async (
  waypoints: Waypoint[],
  { depth, height }: Settings
): Promise<Route[]> => {
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

  if (response.status === 404) {
    throw new RouteNotFoundError()
  } else if (response.status >= 400) {
    throw new Error(`Call to /api/route failed with code ${response.status}`)
  }
  return response.json()
}
