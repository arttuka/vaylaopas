import { StateCreator } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
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
  | {
      type: 'reorder'
      from: number
      to: number
    }

export type WaypointSlice = {
  waypoints: Waypoint[]
  editWaypoints: (action: WaypointAction) => void
}

export const getVias = (waypoints: Waypoint[]): Waypoint[][] => {
  const ret: Waypoint[][] = []
  let curr: Waypoint[] = []
  for (const w of waypoints.slice(1)) {
    if (w.type === 'destination') {
      ret.push(curr)
      curr = []
    } else {
      curr.push(w)
    }
  }
  return ret
}

export const reorderVias = <T>(
  vias: T[][],
  from: number,
  to: number
): T[][] => {
  if (to > from) {
    const start = from === 0 ? [] : [...vias.slice(0, from - 1), []]
    const end = to === vias.length ? [] : [[], ...vias.slice(to + 1)]
    if (from + 1 === to) {
      return [...start, vias[from].toReversed(), ...end]
    } else {
      const mid = vias.slice(from + 1, to)
      return [...start, ...mid, [], ...end]
    }
  } else {
    const start = to === 0 ? [] : [...vias.slice(0, to - 1), []]
    const end = from === vias.length ? [] : [[], ...vias.slice(from + 1)]
    if (from - 1 === to) {
      return [...start, vias[to].toReversed(), ...end]
    } else {
      const mid = vias.slice(to, from - 1)
      return [...start, [], ...mid, ...end]
    }
  }
}

export const reorderWaypoints = (
  waypoints: Waypoint[],
  from: number,
  to: number
): Waypoint[] => {
  const destinations = arrayMove(
    waypoints.filter((w) => w.type === 'destination'),
    from,
    to
  )
  const vias = reorderVias(getVias(waypoints), from, to)
  return destinations.flatMap((d, i) => [d, ...(vias[i] || [])])
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
    case 'reorder': {
      const { from, to } = action
      return updateLetters(reorderWaypoints(waypoints, from, to))
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
