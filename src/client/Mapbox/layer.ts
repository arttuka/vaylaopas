import { Map } from 'maplibre-gl'
import {
  DragStartHandler,
  EventType,
  EventTypes,
  EventHandler,
  Layer,
  SourceId,
  SourceFeature,
} from './types'
import { IsFeature } from '../../common/types'
import { throttle } from '../../common/util'

const addLayer = <S extends SourceId>(map: Map, layer: Layer<S>): void => {
  map.addLayer(layer)
}

export const addLayers = (map: Map): void => {
  addLayer(map, {
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
  addLayer(map, {
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
  addLayer(map, {
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
  addLayer(map, {
    id: 'dragIndicator',
    source: 'dragIndicator',
    type: 'symbol',
    layout: {
      'icon-image': 'circle',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['case', ['get', 'dragged'], 1.5, 1],
    },
  })
}

export const makeLayerDraggable = <S extends SourceId>(
  map: Map,
  id: S,
  handler: DragStartHandler<SourceFeature<S>>,
  isFeature: IsFeature<SourceFeature<S>>
): void => {
  const canvas = map.getCanvasContainer()
  const onDragStart =
    <T extends EventType>(type: T): EventHandler<T> =>
    (e) => {
      e.preventDefault()
      canvas.style.cursor = 'grab'
      const move = type === 'mouse' ? 'mousemove' : 'touchmove'
      const end = type === 'mouse' ? 'mouseup' : 'touchend'
      const feature = e.features && e.features[0]
      if (isFeature(feature)) {
        const { onMove, onMoveEnd } = handler(e, feature, type)
        const throttledOnMove = throttle(onMove, 50)
        map.on(move, throttledOnMove)
        map.once(end, (e: EventTypes[T]) => {
          map.off(move, throttledOnMove)
          onMoveEnd(e)
          canvas.style.cursor = ''
        })
      }
    }
  const onMouseStart = onDragStart('mouse')
  const onTouchStart = onDragStart('touch')
  map
    .on('mouseenter', id, () => {
      canvas.style.cursor = 'move'
    })
    .on('mouseleave', id, () => {
      canvas.style.cursor = ''
    })
    .on('mousedown', id, (e) => {
      if (e.originalEvent.button === 0) {
        onMouseStart(e)
      }
    })
    .on('touchstart', id, onTouchStart)
}
