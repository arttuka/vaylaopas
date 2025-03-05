import { ReactNode, FC, useRef } from 'react'
import { styled } from '@mui/material/styles'
import { MapProps, useMaplibreMap } from '../Mapbox/map'
import { MapContextProvider } from './map-context'

const Container = styled('div')({ flex: 1 })

const Map: FC<MapProps & { children: ReactNode }> = ({
  children,
  ...mapProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const map = useMaplibreMap(containerRef, mapProps)

  return (
    <>
      <Container ref={containerRef} />
      {map && !map._removed && (
        <MapContextProvider value={map}>{children}</MapContextProvider>
      )}
    </>
  )
}

export default Map
