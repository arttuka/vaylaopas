import { Dispatch } from 'redux'
import { Feature, FeatureCollection, Geometry, MultiPoint } from 'geojson'
import mapboxgl, {
  AnySourceImpl,
  GeoJSONSource,
  GeoJSONSourceRaw,
  Layer,
  LinePaint,
  LngLat as MapboxLngLat,
  Map,
  MapboxGeoJSONFeature,
} from 'mapbox-gl'
import blue from '@material-ui/core/colors/blue'
import { waypointAddAction, waypointMoveAction } from '../redux/actions'
import {
  ClientConfig,
  featureIsLane,
  featureIsWaypoint,
  Lane,
  LaneCollection,
  LngLat,
  MenuState,
  Route,
  SetState,
  TouchMarkerState,
  WaypointCollection,
  Waypoints,
} from '../../common/types'
import { numToLetter } from '../../common/util'

declare const clientConfig: ClientConfig

export type MouseEvent = mapboxgl.MapMouseEvent & mapboxgl.EventData
export type MouseLayerEvent = mapboxgl.MapLayerMouseEvent & mapboxgl.EventData
export type TouchEvent = mapboxgl.MapTouchEvent & mapboxgl.EventData
export type Event = MouseEvent | MouseLayerEvent | TouchEvent

export const longTouchDuration = 750

const toLngLat = (e: Event): LngLat => ({
  lng: e.lngLat.lng,
  lat: e.lngLat.lat,
})

const laneCollection = (lanes: Lane[] = []): LaneCollection => ({
  type: 'FeatureCollection',
  features: lanes,
})

const pointFeature = (point?: MapboxLngLat): Feature<MultiPoint, {}> => ({
  type: 'Feature',
  geometry: {
    type: 'MultiPoint',
    coordinates: point ? [[point.lng, point.lat]] : [],
  },
  properties: {},
})

const makeWaypointCollection = (waypoints: Waypoints): WaypointCollection => {
  let i = 0
  return {
    type: 'FeatureCollection',
    features: waypoints.map(({ id, type, lng, lat }) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        id,
        letter: type === 'destination' ? numToLetter(i++) : undefined,
        type,
      },
    })),
  }
}

let waypointCollection = makeWaypointCollection([])

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

const sourceIsGeoJSONSource = (
  source?: AnySourceImpl
): source is GeoJSONSource => source !== undefined && source.type === 'geojson'

const setSourceData = (
  map: Map,
  sourceName: string,
  data: Feature<Geometry> | FeatureCollection<Geometry>
): void => {
  const source = map.getSource(sourceName)
  if (sourceIsGeoJSONSource(source)) {
    source.setData(data)
  }
}

const makeDraggable = (
  map: Map,
  layer: string,
  handler: (feature?: MapboxGeoJSONFeature) => void
): void => {
  const canvas = map.getCanvasContainer()
  map
    .on('mouseenter', layer, (): void => {
      canvas.style.cursor = 'move'
    })
    .on('mouseleave', layer, (): void => {
      canvas.style.cursor = ''
    })
    .on('mousedown', layer, (e): void => {
      e.preventDefault()
      canvas.style.cursor = 'grab'
      const feature = e.features && e.features[0]
      handler(feature)
    })
}

interface EventHandlers {
  handleClick: (e: MouseEvent) => void
  handleLongTouch: (e: TouchEvent) => void
  handleContextMenu: (e: MouseEvent) => void
  handleDragRoute: (e: MouseEvent, route: number) => void
  handleTouchStart: (e: TouchEvent) => void
  handleTouchEnd: () => void
  handleMoveWaypoint: (e: MouseEvent, id: string) => void
}

export const initializeMap = (map: Map, eventHandlers: EventHandlers): void => {
  const {
    handleClick,
    handleLongTouch,
    handleContextMenu,
    handleDragRoute,
    handleTouchStart,
    handleTouchEnd,
    handleMoveWaypoint,
  } = eventHandlers
  let longTouchTimer = 0
  const onTouchEnd = (): void => {
    window.clearTimeout(longTouchTimer)
    handleTouchEnd()
  }
  map.touchZoomRotate.disableRotation()
  map.dragRotate.disable()
  map
    .addSource('route', {
      type: 'geojson',
      data: laneCollection(),
    })
    .addLayer(
      lineLayer({
        id: 'route',
        source: 'route',
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
        },
      })
    )
    .addSource('routeStartAndEnd', {
      type: 'geojson',
      data: laneCollection(),
    })
    .addLayer(
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
    .addSource('dragIndicator', {
      type: 'geojson',
      data: pointFeature(),
    })
    .addLayer({
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
    .addSource('waypoint', {
      type: 'geojson',
      data: waypointCollection,
    })
    .addLayer({
      id: 'waypoint',
      source: 'waypoint',
      type: 'circle',
      paint: {
        'circle-radius': ['match', ['get', 'type'], 'destination', 16, 10],
        'circle-color': [
          'match',
          ['get', 'type'],
          'destination',
          blue[500],
          '#ffffff',
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000',
      },
    })
    .addLayer({
      id: 'waypointText',
      source: 'waypoint',
      type: 'symbol',
      layout: {
        'text-field': ['get', 'letter'],
        'text-font': ['Roboto Medium'],
        'text-size': 24,
        'text-offset': [0, 0.15],
      },
      paint: {
        'text-color': '#ffffff',
      },
    })
    .on('contextmenu', handleContextMenu)
    .on('click', handleClick)
    .on('touchstart', (e): void => {
      window.clearTimeout(longTouchTimer)
      handleTouchStart(e)
      longTouchTimer = window.setTimeout((): void => {
        handleLongTouch(e)
      }, longTouchDuration)
    })
    .on('touchend', onTouchEnd)
    .on('touchcancel', onTouchEnd)
    .on('touchmove', onTouchEnd)

  makeDraggable(map, 'route', (feature?: MapboxGeoJSONFeature): void => {
    if (featureIsLane(feature)) {
      const onMove = (e: MouseEvent): void => {
        setSourceData(map, 'dragIndicator', pointFeature(e.lngLat))
      }
      map.on('mousemove', onMove)
      map.once('mouseup', (e: MouseEvent): void => {
        map.off('mousemove', onMove)
        setSourceData(map, 'dragIndicator', pointFeature())
        handleDragRoute(e, feature.properties.route)
      })
    }
  })

  makeDraggable(map, 'waypoint', (feature?: MapboxGeoJSONFeature): void => {
    if (featureIsWaypoint(feature)) {
      const waypointId = feature.properties.id
      const index = waypointCollection.features.findIndex(
        ({ properties }) => properties.id === waypointId
      )
      if (index >= 0) {
        const onMove = (e: MouseEvent): void => {
          const { lng, lat } = e.lngLat
          waypointCollection.features[index].geometry.coordinates = [lng, lat]
          setSourceData(map, 'waypoint', waypointCollection)
        }
        map.on('mousemove', onMove)
        map.once('mouseup', (e: MouseEvent): void => {
          map.off('mousemove', onMove)
          handleMoveWaypoint(e, waypointId)
        })
      }
    }
  })
}

export const createMap = ({
  container,
  dispatch,
  setLastClick,
  setMenu,
  setTouchMarker,
}: {
  container: HTMLDivElement
  dispatch: Dispatch
  setLastClick: SetState<LngLat>
  setMenu: SetState<MenuState>
  setTouchMarker: SetState<TouchMarkerState | undefined>
}): Map => {
  const map = new Map({
    container,
    style: clientConfig.mapserver,
    hash: true,
    zoom: 7,
    center: [24.94, 60.17],
    dragRotate: false,
  })
  const handleClick = (): void => {
    setMenu({
      open: false,
      top: 0,
      left: 0,
    })
  }
  const handleLongTouch = (e: TouchEvent): void => {
    e.preventDefault()
    dispatch(waypointAddAction({ point: toLngLat(e), type: 'destination' }))
    setTouchMarker(undefined)
  }
  const handleContextMenu = (e: MouseEvent): void => {
    setLastClick(toLngLat(e))
    setMenu({
      open: true,
      top: e.point.y,
      left: e.point.x,
    })
  }
  const handleDragRoute = (e: MouseEvent, n: number): void => {
    dispatch(
      waypointAddAction({
        point: toLngLat(e),
        index: n + 1,
        type: 'waypoint',
      })
    )
  }
  const handleTouchStart = (e: TouchEvent): void => {
    setTouchMarker({
      direction: 'up',
      top: e.point.y,
      left: e.point.x,
    })
  }
  const handleTouchEnd = (): void => {
    setTouchMarker(undefined)
  }
  const handleMoveWaypoint = (e: MouseEvent, id: string): void => {
    dispatch(
      waypointMoveAction({
        point: toLngLat(e),
        id,
      })
    )
  }
  map.on('load', (): void => {
    initializeMap(map, {
      handleClick,
      handleLongTouch,
      handleContextMenu,
      handleDragRoute,
      handleTouchStart,
      handleTouchEnd,
      handleMoveWaypoint,
    })
  })
  return map
}

export const updateWaypoints = (map: Map, waypoints: Waypoints): void => {
  waypointCollection = makeWaypointCollection(waypoints)
  setSourceData(map, 'waypoint', waypointCollection)
}

export const updateRoute = (map: Map, routes: Route[]): void => {
  if (routes.length) {
    const { route, startAndEnd } = routes.reduce(
      (acc, route): Route => ({
        route: acc.route.concat(route.route),
        startAndEnd: [...acc.startAndEnd, route.startAndEnd[1]],
        length: acc.length + route.length,
      }),
      { route: [], startAndEnd: [routes[0].startAndEnd[0]], length: 0 }
    )
    setSourceData(map, 'route', laneCollection(route))
    setSourceData(map, 'routeStartAndEnd', laneCollection(startAndEnd))
  } else {
    setSourceData(map, 'route', laneCollection())
    setSourceData(map, 'routeStartAndEnd', laneCollection())
  }
}
