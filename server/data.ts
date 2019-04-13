import { Feature, GeoJsonProperties, Geometry, LineString, MultiLineString } from 'geojson'
import * as path from 'path'
import * as shapefile from 'shapefile'
import toWgs84 from './etrs-tm35fin'

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
  if(isLineString(geometry)) {
    geometry.coordinates = geometry.coordinates.map(toWgs84)
  } else if(isMultiLineString(geometry)) {
    geometry.coordinates = geometry.coordinates.map(line => line.map(toWgs84))
  } else {
    console.log(`Unexpected geometry type ${geometry.type}`)
  }
  const name: string = properties && properties.VAY_NIMISU || ''
  const depth: number = properties && properties.KULKUSYV1 || 0
  const id: number = properties && properties.JNRO || 0
  return { type: 'Feature', geometry, properties: { id, name, depth } }
}

const data: Feature<Geometry, GeoJsonProperties>[] = []

export const initializeData = async (): Promise<void> => {
  const source = await shapefile.open(
    path.join(__dirname, '..', 'vaylat_0', 'vaylat.shp'),
    path.join(__dirname, '..', 'vaylat_0', 'vaylat.dbf'),
  )
  let { done, value } = await source.read()
  while(!done) {
    data.push(formatVayla(value));
    ({ done, value } = await source.read())
  }
}

export default data
