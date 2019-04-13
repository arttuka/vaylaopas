import { Feature, GeoJsonProperties, Geometry, LineString, MultiLineString, Position } from 'geojson'
import * as path from 'path'
import * as shapefile from 'shapefile'
import toWgs84 from './etrs-tm35fin'
import { Chain, toMonotoneChains, findAllIntersections } from './intersect'

interface Vayla {
  type: 'Feature'
  geometry: Geometry
  properties: {
    id: number
    name: string
    depth: number
  }
}

const isLineString = (g: Geometry): g is LineString => g.type === 'LineString'
const isMultiLineString = (g: Geometry): g is MultiLineString => g.type === 'MultiLineString'

const formatVayla = (value: Feature<Geometry, GeoJsonProperties>): Vayla => {
  const { geometry, properties } = value
  if (isLineString(geometry)) {
    geometry.coordinates = geometry.coordinates.map(toWgs84)
  } else if (isMultiLineString(geometry)) {
    geometry.coordinates = geometry.coordinates.map(line => line.map(toWgs84))
  } else {
    console.log(`Unexpected geometry type ${geometry.type}`)
  }
  const name: string = properties && properties.VAY_NIMISU || ''
  const depth: number = properties && properties.KULKUSYV1 || 0
  const id: number = properties && properties.JNRO || 0
  return { type: 'Feature', geometry, properties: { id, name, depth } }
}

export const vaylat: Feature<Geometry, GeoJsonProperties>[] = []
export const intersections: Position[] = []

export const initializeData = async (): Promise<void> => {
  const chains: Chain[] = []
  const source = await shapefile.open(
    path.join(__dirname, '..', 'vaylat_0', 'vaylat.shp'),
    path.join(__dirname, '..', 'vaylat_0', 'vaylat.dbf'),
  )
  let { done, value } = await source.read()
  while (!done) {
    const vayla = formatVayla(value)
    const { geometry } = vayla
    if (isLineString(geometry)) {
      chains.push(...toMonotoneChains(geometry.coordinates))
    } else if (isMultiLineString(geometry)) {
      geometry.coordinates.forEach(line => {
        chains.push(...toMonotoneChains(line))
      })
    } else {
      console.log(`Unexpected geometry type ${geometry.type}`)
    }
    vaylat.push(vayla);
    ({ done, value } = await source.read())
  }

  const start = new Date()
  findAllIntersections(chains).forEach(intersection => {
    intersections.push([intersection.x, intersection.y])
  })
  const end = new Date()
  console.log(`Took ${end.getTime() - start.getTime()} ms, found ${intersections.length} intersections from ${chains.length} chains`)
}

