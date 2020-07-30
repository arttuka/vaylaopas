import { Layer, Map } from 'mapbox-gl'
import blue from '@material-ui/core/colors/blue'
import { DragStartHandler, Event, LayerId, SourceId } from './types'
import { throttle } from '../../common/util'

const addLayer = (
  map: Map,
  id: LayerId,
  source: SourceId,
  options: Partial<Layer>
): void => {
  map.addLayer({
    id,
    source,
    ...options,
  })
}

export const addLayers = (map: Map): void => {
  addLayer(map, 'route', 'route', {
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ff0000',
      'line-width': 3,
    },
  })
  addLayer(map, 'routeStartAndEnd', 'routeStartAndEnd', {
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ff0000',
      'line-width': 3,
      'line-dasharray': [0.5, 3],
    },
  })
  addLayer(map, 'dragIndicator', 'dragIndicator', {
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#000000',
    },
  })
  addLayer(map, 'location', 'location', {
    type: 'circle',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ff0000',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })
  addLayer(map, 'waypoint', 'waypoint', {
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
  addLayer(map, 'waypointText', 'waypoint', {
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
}

export const makeLayerDraggable = (
  map: Map,
  layer: LayerId,
  handler: DragStartHandler
): void => {
  const canvas = map.getCanvasContainer()
  const onDragStart = (e: Event, type: 'mouse' | 'touch'): void => {
    e.preventDefault()
    canvas.style.cursor = 'grab'
    const [move, end] =
      type === 'mouse' ? ['mousemove', 'mouseup'] : ['touchmove', 'touchend']
    const feature = e.features && e.features[0]
    const { onMove, onMoveEnd } = handler(e.target, feature)
    const throttledOnMove = throttle(onMove, 50)
    map.on(move, throttledOnMove)
    map.once(end, (e: Event): void => {
      map.off(move, throttledOnMove)
      onMoveEnd(e)
      canvas.style.cursor = ''
    })
  }
  map
    .on('mouseenter', layer, (): void => {
      canvas.style.cursor = 'move'
    })
    .on('mouseleave', layer, (): void => {
      canvas.style.cursor = ''
    })
    .on('mousedown', layer, (e): void => onDragStart(e, 'mouse'))
    .on('touchstart', layer, (e): void => onDragStart(e, 'touch'))
}
