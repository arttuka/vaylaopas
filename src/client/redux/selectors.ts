import { RootState, Routes, Settings, Waypoints } from '../../common/types'

export const waypointsSelector = (state: RootState): Waypoints =>
  state.waypoints
export const routesSelector = (state: RootState): Routes => state.routes
export const settingsSelector = (state: RootState): Settings => state.settings
