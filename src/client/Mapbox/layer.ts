import { useEffect } from 'react'
import { Map } from 'maplibre-gl'
import {
  DragStartHandler,
  EventType,
  EventTypes,
  EventHandler,
  Layer,
  Layers,
  LayerId,
  LayerFeature,
} from './types'
import { IsFeature } from '../../common/types'
import { throttle } from '../../common/util'

export const addLayer = <L extends LayerId>(
  map: Map,
  layer: Layer<L>
): void => {
  map.addLayer(layer)
}

export const layers: Layers = {
  route: {
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
  },
  notFoundRoute: {
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
  },
  routeStartAndEnd: {
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
  },
  dragIndicator: {
    id: 'dragIndicator',
    source: 'dragIndicator',
    type: 'symbol',
    layout: {
      'icon-image': 'circle',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-size': ['case', ['get', 'dragged'], 1.5, 1],
    },
  },
}

const makeLayerDraggable = <L extends LayerId>(
  map: Map,
  id: L,
  handler: DragStartHandler<LayerFeature<L>>,
  isFeature: IsFeature<LayerFeature<L>>
): void => {
  const canvas = map.getCanvasContainer()
  const makeDragStartHandler =
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
  const onMouseStart = makeDragStartHandler('mouse')
  const onTouchStart = makeDragStartHandler('touch')
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

export type LayerProps<L extends LayerId> = {
  layer: Layer<L>
  onDrag?: DragStartHandler<LayerFeature<L>>
  isFeature?: IsFeature<LayerFeature<L>>
}

export const useLayer = <L extends LayerId>(
  map: Map,
  { layer, onDrag, isFeature }: LayerProps<L>
): void => {
  useEffect(() => {
    const id = layer.id
    addLayer(map, layer)
    if (onDrag && isFeature) {
      makeLayerDraggable(map, id, onDrag, isFeature)
    }
    return () => {
      map.removeLayer(id)
    }
  }, [])
}
