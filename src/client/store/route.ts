import { StateCreator } from 'zustand'
import { LineStringFeature, Route } from '../../common/types'
import { enrichRoutes } from '../../common/util'
import { getRoutes } from '../api'
import type { State } from './store'

export type RouteSlice = {
  routes: Route[]
  waypointLines: LineStringFeature[]
  fetchRoutes: () => Promise<void>
}

const emptyRoutes: Pick<RouteSlice, 'routes' | 'waypointLines'> = {
  routes: [],
  waypointLines: [],
}

export const createRouteSlice: StateCreator<State, [], [], RouteSlice> = (
  set,
  get
) => ({
  ...emptyRoutes,
  fetchRoutes: async () => {
    const waypoints = get().waypoints
    const settings = get().settings
    if (waypoints.length > 1) {
      try {
        const { routes, waypointLines } = await getRoutes(waypoints, settings)
        if (routes.some((route) => !route.found)) {
          get().enqueueNotification({
            message: 'Reittiä ei löytynyt',
            variant: 'warning',
          })
        }
        set({ routes: enrichRoutes(routes, settings), waypointLines })
      } catch (err) {
        get().enqueueNotification({
          message: 'Reitinhaussa tapahtui odottamaton virhe',
          variant: 'error',
        })
        set(emptyRoutes)
      }
    } else {
      set(emptyRoutes)
    }
  },
})
