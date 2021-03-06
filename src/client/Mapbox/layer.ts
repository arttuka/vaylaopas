import { Map } from 'mapbox-gl'
import indigo from '@material-ui/core/colors/indigo'
import { DragStartHandler, Event, SourceId } from './types'
import { throttle } from '../../common/util'

export const addLayers = (map: Map): void => {
  map.addLayer({
    id: 'route',
    source: 'route',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ff3333',
      'line-width': 3,
    },
  })
  map.addLayer({
    id: 'notFoundRoute',
    source: 'notFoundRoute',
    type: 'line',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#ff0000',
      'line-width': 4,
      'line-dasharray': [0.5, 2],
    },
  })
  map.addLayer({
    id: 'routeStartAndEnd',
    source: 'routeStartAndEnd',
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
  map.addLayer({
    id: 'dragIndicator',
    source: 'dragIndicator',
    type: 'symbol',
    layout: {
      'icon-image': 'circle',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  })
  map.addLayer({
    id: 'waypoint',
    source: 'waypoint',
    type: 'symbol',
    layout: {
      'icon-image': ['match', ['get', 'type'], 'destination', 'pin', 'circle'],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-anchor': [
        'match',
        ['get', 'type'],
        'destination',
        'bottom',
        'center',
      ],
      'icon-size': ['case', ['get', 'dragged'], 1.5, 1],
      'text-field': ['get', 'letter'],
      'text-font': ['Roboto Medium'],
      'text-size': ['case', ['get', 'dragged'], 36, 24],
      'text-offset': [0, -1.5],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': indigo[500],
    },
  })
}

export const makeLayerDraggable = (
  map: Map,
  id: SourceId,
  handler: DragStartHandler
): void => {
  const canvas = map.getCanvasContainer()
  const onDragStart = (e: Event, type: 'mouse' | 'touch'): void => {
    e.preventDefault()
    canvas.style.cursor = 'grab'
    const [move, end] =
      type === 'mouse' ? ['mousemove', 'mouseup'] : ['touchmove', 'touchend']
    const feature = e.features && e.features[0]
    if (feature !== undefined) {
      const { onMove, onMoveEnd } = handler(e, feature, type)
      const throttledOnMove = throttle(onMove, 50)
      map.on(move, throttledOnMove)
      map.once(end, (e: Event): void => {
        map.off(move, throttledOnMove)
        onMoveEnd(e)
        canvas.style.cursor = ''
      })
    }
  }
  map
    .on('mouseenter', id, (): void => {
      canvas.style.cursor = 'move'
    })
    .on('mouseleave', id, (): void => {
      canvas.style.cursor = ''
    })
    .on('mousedown', id, (e): void => {
      if (e.originalEvent.button === 0) {
        onDragStart(e, 'mouse')
      }
    })
    .on('touchstart', id, (e): void => onDragStart(e, 'touch'))
}
