import { Routes, Settings, Waypoints } from '../common/types'

export const getRoutes = async (
  waypoints: Waypoints,
  { depth, height }: Settings
): Promise<Routes> => {
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
  return response.json()
}
