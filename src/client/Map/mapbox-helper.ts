import blue from '@material-ui/core/colors/blue'
import { Feature, MultiPoint } from 'geojson'
import mapboxgl, {
  GeoJSONSource,
  GeoJSONSourceRaw,
  Layer,
  LinePaint,
  LngLat,
  Map,
  Marker,
} from 'mapbox-gl'
import { featureIsLane, Lane, LaneCollection, Route } from '../../common/lane'
import { numToLetter } from '../../common/util'

export type MouseEvent = mapboxgl.MapMouseEvent & mapboxgl.EventData
export type MouseLayerEvent = mapboxgl.MapLayerMouseEvent & mapboxgl.EventData

const laneCollection = (lanes: Lane[] = []): LaneCollection => ({
  type: 'FeatureCollection',
  features: lanes,
})

const pointFeature = (point?: LngLat): Feature<MultiPoint, {}> => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: point ? [[point.lng, point.lat]] : [],
  },
  properties: {},
})

const lineLayer = (data: {
  id: string
  source: string | GeoJSONSourceRaw
  paint: LinePaint
}): Layer => {
  const { id, source, paint } = data
  return {
    id,
    source,
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint,
  }
}

export const initializeMap = (
  map: Map,
  handleClick: (e: MouseEvent) => void,
  handleContextMenu: (e: MouseEvent) => void,
  handleDragRoute: (e: MouseEvent, route: number) => void,
  allLanes: LaneCollection
): void => {
  const canvas = map.getCanvasContainer()
  map.addLayer(
    lineLayer({
      id: 'allLanes',
      source: {
        type: 'geojson',
        data: allLanes,
      },
      paint: {
        'line-color': '#000000',
        'line-width': 1,
      },
    })
  )
  map.addSource('route', {
    type: 'geojson',
    data: laneCollection(),
  })
  map.addLayer(
    lineLayer({
      id: 'route',
      source: 'route',
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
      },
    })
  )
  map.addSource('routeStartAndEnd', {
    type: 'geojson',
    data: laneCollection(),
  })
  map.addLayer(
    lineLayer({
      id: 'routeStartAndEnd',
      source: 'routeStartAndEnd',
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
        'line-dasharray': [0.5, 3],
      },
    })
  )
  map.addSource('dragIndicator', {
    type: 'geojson',
    data: pointFeature(),
  })
  map.addLayer({
    id: 'dragIndicator',
    source: 'dragIndicator',
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#000000',
    },
  })
  map.on('contextmenu', handleContextMenu)
  map.on('click', handleClick)
  map.on(
    'mouseenter',
    'route',
    (): void => {
      canvas.style.cursor = 'move'
    }
  )
  map.on(
    'mouseleave',
    'route',
    (): void => {
      canvas.style.cursor = ''
    }
  )
  const onMove = (e: MouseEvent): void => {
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature(e.lngLat))
  }
  const onUp = (route: number): ((e: MouseEvent) => void) => (
    e: MouseEvent
  ): void => {
    map.off('mousemove', onMove)
    const dragIndicatorSource = map.getSource('dragIndicator') as GeoJSONSource
    dragIndicatorSource.setData(pointFeature())
    handleDragRoute(e, route)
  }
  map.on(
    'mousedown',
    'route',
    (e): void => {
      e.preventDefault()
      canvas.style.cursor = 'grab'
      const feature = e.features && e.features[0]
      if (feature && featureIsLane(feature)) {
        map.on('mousemove', onMove)
        map.once('mouseup', onUp(feature.properties.route))
      }
    }
  )
}

export const updateRoute = (map: Map, routes: Route[] = []): void => {
  const startAndEndSource = map.getSource('routeStartAndEnd') as GeoJSONSource
  const routeSource = map.getSource('route') as GeoJSONSource
  if (routes.length) {
    const { route, startAndEnd } = routes.reduce(
      (acc, route): Route => ({
        route: acc.route.concat(route.route),
        startAndEnd: [...acc.startAndEnd, route.startAndEnd[1]],
        length: acc.length + route.length,
      }),
      { route: [], startAndEnd: [routes[0].startAndEnd[0]], length: 0 }
    )
    routeSource.setData(laneCollection(route))
    startAndEndSource.setData(laneCollection(startAndEnd))
  } else {
    routeSource.setData(laneCollection())
    startAndEndSource.setData(laneCollection())
  }
}

export const createMarker = (i: number): Marker => {
  const element = document.createElement('div')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttributeNS(null, 'stroke', 'none')
  svg.setAttributeNS(null, 'height', '48px')
  svg.setAttributeNS(null, 'width', '32px')
  svg.setAttributeNS(null, 'viewBox', '0 0 32 48')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttributeNS(
    null,
    'd',
    'm15.998888,47.721162c0,0.008747 0.017495,0.026242 0.017495,0.026242s15.325378,-23.530404 15.325378,-31.263072c0,-11.380318 -7.767658,-16.331325 -15.342873,-16.34882c-7.575216,0.017495 -15.342873,4.968502 -15.342873,16.34882c0,7.732668 15.334126,31.263072 15.334126,31.263072s0.008747,-0.026242 0.008747,-0.026242z'
  )
  path.setAttributeNS(null, 'fill', blue[500])
  svg.appendChild(path)
  const label = document.createElement('label')
  label.appendChild(document.createTextNode(numToLetter(i)))
  element.appendChild(label)
  element.appendChild(svg)

  const marker = new Marker({
    element,
    offset: [0, -20],
  })
  return marker
}

const updateMarker = (
  marker: Marker,
  movePoint: (i: number, point: LngLat) => void,
  i: number
): void => {
  marker.off('dragend').on(
    'dragend',
    (): void => {
      movePoint(i, marker.getLngLat())
    }
  )
  const label = marker.getElement().firstChild
  if (label) {
    label.textContent = numToLetter(i)
  }
}

export const updateMarkers = (
  markers: Marker[],
  movePoint: (i: number, point: LngLat) => void
): void => {
  markers.forEach(
    (marker, i): void => {
      updateMarker(marker, movePoint, i)
    }
  )
}
