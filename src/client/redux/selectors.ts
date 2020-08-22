import {
  Notification,
  RootState,
  Route,
  Settings,
  Waypoint,
} from '../../common/types'

export const waypointsSelector = (state: RootState): Waypoint[] =>
  state.waypoints
export const routesSelector = (state: RootState): Route[] => state.routes
export const settingsSelector = (state: RootState): Settings => state.settings
export const notificationsSelector = (state: RootState): Notification[] =>
  state.notifications
