import { StateCreator } from 'zustand'
import { Route } from '../../common/types'
import { enrichRoutes } from '../../common/util'
import { getRoutes } from '../api'
import type { State } from './store'

export type RouteSlice = {
  routes: Route[]
  fetchRoutes: () => Promise<void>
}

export const createRouteSlice: StateCreator<State, [], [], RouteSlice> = (
  set,
  get
) => ({
  routes: [],
  fetchRoutes: async () => {
    const waypoints = get().waypoints
    const settings = get().settings
    if (waypoints.length > 1) {
      try {
        const routes: Route[] = await getRoutes(waypoints, settings)
        if (routes.some((route) => !route.found)) {
          get().enqueueNotification({
            message: 'Reittiä ei löytynyt',
            variant: 'warning',
          })
        }
        set({ routes: enrichRoutes(routes, settings) })
      } catch (err) {
        get().enqueueNotification({
          message: 'Reitinhaussa tapahtui odottamaton virhe',
          variant: 'error',
        })
        set({ routes: [] })
      }
    } else {
      set({ routes: [] })
    }
  },
})
