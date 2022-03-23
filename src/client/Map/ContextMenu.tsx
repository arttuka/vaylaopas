import React, { VFC } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { LngLat, MenuState } from '../../common/types'
import { useDispatch } from 'react-redux'
import {
  waypointAddAction,
  waypointChangeAction,
  waypointRemoveAction,
} from '../redux/actions'

type ContextMenuProps = MenuState & {
  closeMenu: () => void
  point: LngLat
}

const ContextMenu: VFC<ContextMenuProps> = ({
  open,
  top,
  left,
  waypoint,
  isDestination,
  closeMenu,
  point,
}) => {
  const dispatch = useDispatch()
  return (
    <Menu
      keepMounted
      open={open}
      onClose={closeMenu}
      anchorReference="anchorPosition"
      anchorPosition={{ top, left }}
    >
      {waypoint === undefined ? (
        <MenuItem
          onClick={() => {
            dispatch(waypointAddAction({ point, type: 'destination' }))
            closeMenu()
          }}
        >
          Lisää reitille
        </MenuItem>
      ) : (
        [
          <MenuItem
            key="change-waypoint"
            onClick={() => {
              dispatch(
                waypointChangeAction({
                  id: waypoint,
                  type: isDestination ? 'waypoint' : 'destination',
                })
              )
              closeMenu()
            }}
          >
            {isDestination ? 'Muuta välipisteeksi' : 'Muuta määränpääksi'}
          </MenuItem>,
          <MenuItem
            key="delete-waypoint"
            onClick={() => {
              dispatch(waypointRemoveAction({ id: waypoint }))
              closeMenu()
            }}
          >
            Poista reittipiste
          </MenuItem>,
        ]
      )}
    </Menu>
  )
}

export default ContextMenu
