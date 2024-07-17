import React, {
  MouseEvent,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { styled } from '@mui/material/styles'
import indigo from '@mui/material/colors/indigo'
import { Marker as MaplibreMarker, LngLat } from 'maplibre-gl'
import { Point, Waypoint } from '../../common/types'
import { useMap } from './map-context'

const Pin = () => (
  <svg
    version="1.1"
    id="Capa_1"
    x="0px"
    y="0px"
    viewBox="0 0 36 57.15"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle fill="#ffffff" cx="18" cy="18" r="16" />
    <path
      fill="#3f51b5"
      d="M 18 4.07 C 25.679 4.07 31.93 10.319 31.93 18 C 31.93 25.679 25.679 31.926 18 31.926 C 10.321 31.926 4.072 25.679 4.072 18 C 4.072 10.319 10.319 4.07 18 4.07 M 18 0 C 8.058 0 0 8.06 0 18 C 0 27.94 18 57.138 18 57.138 C 18 57.138 36 27.94 36 18 C 36 8.058 27.942 0 18 0 Z"
    />
  </svg>
)

const Destination = styled('div')({
  width: 36,
  height: 58,
  fontSize: 24,
  position: 'relative',
  transform: '',
  transition: 'transform 100ms ease-in-out',
  '&.marker-dragged': {
    transform: 'scale(1.5, 1.5)',
  },
})

const Letter = styled('div')({
  position: 'absolute',
  zIndex: 10,
  top: 6,
  left: 18,
  color: indigo[500],
  fontWeight: 'bold',
  transform: 'translateX(-50%)',
})

const WaypointMarker = styled('div')({
  width: 24,
  height: 24,
  backgroundColor: 'white',
  border: '2px solid black',
  borderRadius: 999,
  transition: 'transform 100ms ease-in-out',
  '&.marker-dragged': {
    transform: 'scale(1.5, 1.5)',
  },
})

type MarkerProps = {
  draggingRef: React.MutableRefObject<boolean>
  waypoint: Waypoint
  onDragEnd: (id: string, lngLat: LngLat) => void
  onContextMenu: (waypoint: Waypoint, lngLat: LngLat, point: Point) => void
}

const Marker: FC<MarkerProps> = (props) => {
  const propsRef = useRef(props)
  propsRef.current = props
  const { waypoint, onContextMenu } = props
  const { lng, lat, type, letter } = waypoint
  const [isDragged, setIsDragged] = useState(false)
  const map = useMap()

  const marker: MaplibreMarker = useMemo(() => {
    const element = document.createElement('div')
    return new MaplibreMarker({ element, draggable: true, anchor: 'bottom' })
      .setLngLat({ lng, lat })
      .on('dragstart', () => {
        propsRef.current.draggingRef.current = true
        setIsDragged(true)
      })
      .on('dragend', () => {
        propsRef.current.draggingRef.current = false
        setIsDragged(false)
        propsRef.current.onDragEnd(
          propsRef.current.waypoint.id,
          marker.getLngLat()
        )
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    marker.addTo(map)
    return () => {
      marker.remove()
    }
  }, [map, marker])
  const onDivClick = useCallback(
    (e: MouseEvent) => {
      e.nativeEvent.stopImmediatePropagation()
      onContextMenu(waypoint, marker.getLngLat(), {
        x: e.pageX,
        y: e.pageY - 64,
      })
    },
    [onContextMenu, waypoint, marker]
  )
  const onDivContextMenu = useCallback(
    (e: MouseEvent) => {
      e.nativeEvent.stopImmediatePropagation()
      e.preventDefault()
      onContextMenu(waypoint, marker.getLngLat(), {
        x: e.pageX,
        y: e.pageY - 64,
      })
    },
    [onContextMenu, waypoint, marker]
  )
  const onDivMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 2) {
      e.nativeEvent.stopImmediatePropagation()
    }
  }, [])

  return createPortal(
    <div
      onClick={onDivClick}
      onContextMenu={onDivContextMenu}
      onMouseDown={onDivMouseDown}
    >
      {type === 'destination' ? (
        <Destination className={isDragged ? 'marker-dragged' : ''}>
          <Pin />
          <Letter>{letter}</Letter>
        </Destination>
      ) : (
        <WaypointMarker className={isDragged ? 'marker-dragged' : ''} />
      )}
    </div>,
    marker.getElement()
  )
}

export default Marker
