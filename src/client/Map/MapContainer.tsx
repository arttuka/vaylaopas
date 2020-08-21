import React, { FunctionComponent } from 'react'
import { styled } from '@material-ui/core/styles'
import MapFeatures from './MapFeatures'
import { useMap } from '../Mapbox/map'

const Container = styled('div')({
  width: '100%',
  height: '100vh',
})

const MapContainer: FunctionComponent = () => {
  const [setContainerRef, map] = useMap()

  return (
    <>
      <Container ref={setContainerRef} />
      {map && <MapFeatures map={map} />}
    </>
  )
}

export default MapContainer
