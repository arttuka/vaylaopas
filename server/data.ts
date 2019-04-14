import { Feature, GeoJsonProperties, Geometry, LineString, MultiLineString, Position } from 'geojson'
import * as path from 'path'
import * as shapefile from 'shapefile'
import toWgs84 from './etrs-tm35fin'
import { toMonotoneChains, findAllIntersections } from './intersect'
import { Lane, LanesAndIntersections, nextLaneId } from '../common/lane'

const isLineString = (g: Geometry): g is LineString => g.type === 'LineString'
const isMultiLineString = (g: Geometry): g is MultiLineString => g.type === 'MultiLineString'

const formatLanes = (value: Feature<Geometry, GeoJsonProperties>): Lane[] => {
  const { geometry, properties } = value
  const depth: number = properties!.KULKUSYV1 || 0
  const laneid: number = properties!.JNRO
  let coordinates: Position[][]
  if (isLineString(geometry)) {
    coordinates = [geometry.coordinates]
  } else if (isMultiLineString(geometry)) {
    coordinates = geometry.coordinates
  } else {
    throw new Error(`Unexpected geometry type ${geometry.type}`)
  }
  return coordinates.map(line => ({
    id: nextLaneId(),
    laneid,
    depth,
    coordinates: line.map(toWgs84)
  }))
}

export const loadData = async (): Promise<LanesAndIntersections> => {
  const lanes: Lane[] = []
  const source = await shapefile.open(
    path.join(__dirname, '..', '..', 'vaylat_0', 'vaylat.shp'),
    path.join(__dirname, '..', '..', 'vaylat_0', 'vaylat.dbf'),
  )
  let { done, value } = await source.read()
  while (!done) {
    formatLanes(value).forEach((lane) => {
      lanes.push(...toMonotoneChains(lane))
    });
    ({ done, value } = await source.read())
  }

  const start = new Date()
  const intersections = findAllIntersections(lanes)
  const end = new Date()
  console.log(`Took ${end.getTime() - start.getTime()} ms, found ${intersections.length} intersections from ${lanes.length} chains`)
  return { lanes, intersections }
}
