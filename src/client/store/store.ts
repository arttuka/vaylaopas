import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'
import type {} from '@redux-devtools/extension'
import { NotificationSlice, createNotificationSlice } from './notification'
import { RouteSlice, createRouteSlice } from './route'
import { SettingsSlice, createSettingsSlice } from './settings'
import { WaypointSlice, createWaypointSlice } from './waypoint'

export type State = NotificationSlice &
  RouteSlice &
  SettingsSlice &
  WaypointSlice

export const useStore = create<State>()(
  devtools(
    persist(
      (...a) => ({
        ...createNotificationSlice(...a),
        ...createRouteSlice(...a),
        ...createSettingsSlice(...a),
        ...createWaypointSlice(...a),
      }),
      {
        name: 'vaylaopas',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ waypoints: state.waypoints }),
        onRehydrateStorage: () => (state) => state?.fetchRoutes(),
      }
    )
  )
)
