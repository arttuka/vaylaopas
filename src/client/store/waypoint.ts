import { StateCreator } from 'zustand'
import { LngLat, Waypoint, WaypointType } from '../../common/types'
import {
  insertIndex,
  removeWhere,
  updateWhere,
  hasId,
  hasAnyId,
  makeIdGenerator,
  numToLetter,
} from '../../common/util'
import type { State } from './store'

export type WaypointAction =
  | {
      type: 'add'
      index?: number
      point: LngLat
      waypointType: WaypointType
    }
  | {
      type: 'change'
      id: string
      waypointType: WaypointType
    }
  | {
      type: 'remove'
      id: string
    }
  | {
      type: 'move'
      id: string
      point: LngLat
    }

export type WaypointSlice = {
  waypoints: Waypoint[]
  editWaypoints: (action: WaypointAction) => void
}

const getAdjacentViaIds = (waypoints: Waypoint[], id: string): string[] => {
  const idx = waypoints.findIndex(hasId(id))
  if (waypoints[idx].type === 'via') {
    return [id]
  }
  const result = [id]
  let i = idx + 1
  while (i < waypoints.length && waypoints[i].type === 'via') {
    result.push(waypoints[i].id)
    i++
  }
  i = idx - 1
  while (i >= 0 && waypoints[i].type === 'via') {
    result.push(waypoints[i].id)
    i--
  }
  return result
}

const updateLetters = (waypoints: Waypoint[]): Waypoint[] => {
  let i = 0
  return waypoints.map((waypoint) => ({
    ...waypoint,
    letter: waypoint.type === 'destination' ? numToLetter(i++) : undefined,
  }))
}

const generateWaypointId = makeIdGenerator('waypoint')

export const getNewWaypoints = (
  waypoints: Waypoint[],
  action: WaypointAction
): Waypoint[] => {
  switch (action.type) {
    case 'add': {
      const { point, index, waypointType } = action
      return updateLetters(
        insertIndex(waypoints, index ?? waypoints.length, {
          ...point,
          id: generateWaypointId(),
          type: waypointType,
        })
      )
    }
    case 'change':
      const { id, waypointType } = action
      return updateLetters(
        updateWhere(waypoints, hasId(id), { type: waypointType })
      )
    case 'remove':
      const ids = getAdjacentViaIds(waypoints, action.id)
      return updateLetters(removeWhere(waypoints, hasAnyId(ids)))
    case 'move': {
      const { point, id } = action
      return updateLetters(updateWhere(waypoints, hasId(id), point))
    }
    default:
      return waypoints
  }
}

export const createWaypointSlice: StateCreator<State, [], [], WaypointSlice> = (
  set,
  get
) => ({
  waypoints: [],
  editWaypoints: (action) => {
    set((state) => {
      return { waypoints: getNewWaypoints(state.waypoints, action) }
    })
    get().fetchRoutes()
  },
})
