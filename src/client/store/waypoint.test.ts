import { getNewWaypoints } from './waypoint'
import { Waypoint, WaypointType } from '../../common/types'

const makeWaypoint = (
  i: number,
  type: WaypointType,
  letter?: string
): Waypoint => ({
  lng: i,
  lat: i,
  id: i.toString(),
  type,
  letter,
})

const expectWaypoint = (i: number, type: WaypointType, letter?: string) =>
  expect.objectContaining({
    lng: i,
    lat: i,
    type,
    letter,
  })

const w1 = makeWaypoint(1, 'destination', 'A')
const w2 = makeWaypoint(2, 'destination', 'B')
const w3 = makeWaypoint(3, 'via')
const w4 = makeWaypoint(4, 'via')
const w5 = makeWaypoint(5, 'destination', 'C')
const waypoints = [w1, w2, w3, w4, w5]

describe('waypointReducer', () => {
  it('can add a new waypoint to the end', () => {
    expect(
      getNewWaypoints(waypoints, {
        type: 'add',
        point: { lng: 6, lat: 6 },
        waypointType: 'destination',
      })
    ).toEqual([w1, w2, w3, w4, w5, expectWaypoint(6, 'destination', 'D')])
  })
  it('can add a new waypoint in the middle', () => {
    expect(
      getNewWaypoints(waypoints, {
        type: 'add',
        index: 2,
        point: { lng: 6, lat: 6 },
        waypointType: 'via',
      })
    ).toEqual([w1, w2, expectWaypoint(6, 'via'), w3, w4, w5])
  })
  it('can remove a waypoint', () => {
    expect(getNewWaypoints(waypoints, { type: 'remove', id: '1' })).toEqual([
      { ...w2, letter: 'A' },
      w3,
      w4,
      { ...w5, letter: 'B' },
    ])
  })
  it('removes via waypoints adjacent to a removed destination', () => {
    expect(getNewWaypoints(waypoints, { type: 'remove', id: '2' })).toEqual([
      w1,
      { ...w5, letter: 'B' },
    ])
  })
  it("doesn't remove waypoints adjacent to a removed via waypoint", () => {
    expect(getNewWaypoints(waypoints, { type: 'remove', id: '3' })).toEqual([
      w1,
      w2,
      w4,
      w5,
    ])
  })
  it('can move a waypoint', () => {
    expect(
      getNewWaypoints(waypoints, {
        type: 'move',
        point: { lng: 6, lat: 6 },
        id: '2',
      })
    ).toEqual([w1, { ...w2, lng: 6, lat: 6 }, w3, w4, w5])
  })
})
