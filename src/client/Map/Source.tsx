import { ReactElement } from 'react'
import {
  LayerProps,
  LayerId,
  Source as SourceT,
  SourceId,
} from '../Mapbox/types'
import { useSource } from '../Mapbox/source'
import { useMap } from './map-context'

type SourceProps<S extends SourceId, L extends LayerId> = {
  source: SourceT<S>
  layers: LayerProps<L>[]
}

const Source = <S extends SourceId, L extends LayerId>({
  source,
  layers,
}: SourceProps<S, L>): ReactElement | null => {
  const map = useMap()
  useSource(map, source, layers)
  return null
}

export default Source
