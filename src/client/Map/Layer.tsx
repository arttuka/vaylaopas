import { LayerProps, useLayer } from '../Mapbox/layer'
import { LayerId } from '../Mapbox/types'
import { useMap } from './map-context'

const Layer = <L extends LayerId>(props: LayerProps<L>): null => {
  const map = useMap()
  useLayer(map, props)
  return null
}

export default Layer
