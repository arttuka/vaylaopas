import {
  getNewWaypoints,
  getVias,
  reorderVias,
  reorderWaypoints,
} from './waypoint'
import { Waypoint, WaypointType } from '../../common/types'

const makeWaypoint = (
  i: number,
  type: WaypointType,
  letter?: string
): Waypoint => ({ lng: i, lat: i, id: i.toString(), type, letter })

const expectWaypoint = (i: number, type: WaypointType, letter?: string) =>
  expect.objectContaining({ lng: i, lat: i, type, letter })

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

const getIds = (waypoints: Waypoint[][]): string[][] =>
  waypoints.map((l) => l.map((w) => w.id))

describe('getVias', () => {
  it('returns lists of via points between destinations', () => {
    const waypoints = [
      makeWaypoint(1, 'destination', 'A'),
      makeWaypoint(2, 'via'),
      makeWaypoint(3, 'via'),
      makeWaypoint(4, 'destination', 'B'),
      makeWaypoint(5, 'destination', 'C'),
      makeWaypoint(6, 'via'),
      makeWaypoint(7, 'destination', 'D'),
    ]
    const vias = getVias(waypoints)
    expect(getIds(vias)).toEqual([['2', '3'], [], ['6']])
  })
})

describe('reorderVias', () => {
  const input = [
    ['0A', '0B'],
    ['1A', '1B'],
    ['2A', '2B'],
    ['3A', '3B'],
    ['4A', '4B'],
    ['5A', '5B'],
    ['6A', '6B'],
  ]
  it('move from start to end', () => {
    expect(reorderVias(input, 0, 7)).toEqual([
      ['1A', '1B'],
      ['2A', '2B'],
      ['3A', '3B'],
      ['4A', '4B'],
      ['5A', '5B'],
      ['6A', '6B'],
      [],
    ])
  })
  it('move from end to start', () => {
    expect(reorderVias(input, 7, 0)).toEqual([
      [],
      ['0A', '0B'],
      ['1A', '1B'],
      ['2A', '2B'],
      ['3A', '3B'],
      ['4A', '4B'],
      ['5A', '5B'],
    ])
  })
  it('move one step forward', () => {
    expect(reorderVias(input, 2, 3)).toEqual([
      ['0A', '0B'],
      [],
      ['2B', '2A'],
      [],
      ['4A', '4B'],
      ['5A', '5B'],
      ['6A', '6B'],
    ])
  })
  it('move one step backward', () => {
    expect(reorderVias(input, 3, 2)).toEqual([
      ['0A', '0B'],
      [],
      ['2B', '2A'],
      [],
      ['4A', '4B'],
      ['5A', '5B'],
      ['6A', '6B'],
    ])
  })
  it('move forward', () => {
    expect(reorderVias(input, 1, 4)).toEqual([
      [],
      ['2A', '2B'],
      ['3A', '3B'],
      [],
      [],
      ['5A', '5B'],
      ['6A', '6B'],
    ])
  })
  it('move backward', () => {
    expect(reorderVias(input, 4, 1)).toEqual([
      [],
      [],
      ['1A', '1B'],
      ['2A', '2B'],
      [],
      ['5A', '5B'],
      ['6A', '6B'],
    ])
  })
})

describe('reorderWaypoints', () => {
  it('moves waypoint and reorders via points', () => {
    const waypoints = [
      makeWaypoint(1, 'destination', 'A'),
      makeWaypoint(2, 'via'),
      makeWaypoint(3, 'destination', 'B'),
      makeWaypoint(4, 'via'),
      makeWaypoint(5, 'destination', 'C'),
      makeWaypoint(6, 'via'),
      makeWaypoint(7, 'destination', 'D'),
      makeWaypoint(8, 'via'),
      makeWaypoint(9, 'destination', 'E'),
    ]
    const reordered = reorderWaypoints(waypoints, 0, 2)
    expect(reordered.map((w) => w.id)).toEqual([
      '3',
      '4',
      '5',
      '1',
      '7',
      '8',
      '9',
    ])
  })
})
