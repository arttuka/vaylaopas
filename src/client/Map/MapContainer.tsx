import React, { FunctionComponent } from 'react'
import { styled } from '@material-ui/styles'
import MapFeatures from './MapFeatures'
import { useMap } from '../Mapbox/map'

const Container = styled('div')({
  flex: 1,
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
