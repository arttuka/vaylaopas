import React, { ReactElement, ReactNode } from 'react'
import { Source as SourceT, SourceId } from '../Mapbox/types'
import { useSource } from '../Mapbox/source'
import { useMap } from './map-context'

type SourceProps<S extends SourceId> = {
  source: SourceT<S>
  children: ReactNode
}

const Source = <S extends SourceId>({
  source,
  children,
}: SourceProps<S>): ReactElement | null => {
  const map = useMap()
  useSource(map, source)
  return map.getSource(source.id) ? <>{children}</> : null
}

export default Source
