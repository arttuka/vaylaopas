import React, { FunctionComponent } from 'react'
import { useDispatch } from 'react-redux'
import ContextMenu from './ContextMenu'
import TouchMarker from './TouchMarker'
import { longTouchDuration } from '../Mapbox/map'

import {
  waypointAddAction,
  waypointChangeAction,
  waypointRemoveAction,
} from '../redux/actions'
import {
  LngLat,
  MenuState,
  TouchMarkerState,
  WaypointType,
} from '../../common/types'

interface MapFeaturesProps {
  lastClick: LngLat
  touchMarker?: TouchMarkerState
  menu: MenuState
  closeMenu: () => void
}

const MapFeatures: FunctionComponent<MapFeaturesProps> = ({
  lastClick,
  touchMarker,
  menu,
  closeMenu,
}) => {
  const dispatch = useDispatch()

  const onAddWaypoint = (): void => {
    dispatch(waypointAddAction({ point: lastClick, type: 'destination' }))
    closeMenu()
  }

  const onDeleteWaypoint = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
    closeMenu()
  }

  const onChangeWaypoint = (id: string, type: WaypointType): void => {
    dispatch(waypointChangeAction({ id, type }))
    closeMenu()
  }

  return (
    <>
      <ContextMenu
        onAdd={onAddWaypoint}
        onChange={onChangeWaypoint}
        onDelete={onDeleteWaypoint}
        onClose={closeMenu}
        {...menu}
      />
      {touchMarker && (
        <TouchMarker
          top={touchMarker.top}
          left={touchMarker.left}
          direction={touchMarker.direction}
          duration={longTouchDuration}
        />
      )}
    </>
  )
}

export default MapFeatures
