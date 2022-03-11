import { useCallback, useState } from 'react'
import { Map } from 'maplibre-gl'
import { addLayers } from './layer'
import { addSources, useSource } from './source'
import { Sources } from './types'
import { addMapLoad } from '../api'

export const longTouchDuration = 750

type useMapProps = {
  onInit: (map: Map) => void
  center: [number, number]
  zoom: number
  sources: Sources
  mapserverUrl: string
}

type UseMap = {
  setContainerRef: (container: HTMLDivElement) => void
  map: Map | undefined
}

export const useMap = ({
  onInit,
  center,
  zoom,
  sources,
  mapserverUrl,
}: useMapProps): UseMap => {
  const [map, setMap] = useState<Map>()
  const setContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (container == null) {
        if (map) {
          map.remove()
          setMap(undefined)
        }
      } else if (map === undefined) {
        const map = new Map({
          container,
          style: mapserverUrl,
          hash: true,
          zoom,
          center,
          dragRotate: false,
        })
        map.on('load', (): void => {
          addSources(map, sources)
          addLayers(map)
          onInit(map)
          addMapLoad()
        })
        setMap(map)
      }
    },
    [map]
  )

  for (const source of Object.values(sources)) {
    useSource(map, source)
  }

  return { setContainerRef, map }
}
