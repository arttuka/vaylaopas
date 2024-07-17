import React, { FC } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { LngLat, MenuState } from '../../common/types'
import { useStore } from '../store/store'

type ContextMenuProps = MenuState & {
  closeMenu: () => void
  point: LngLat
}

const ContextMenu: FC<ContextMenuProps> = ({
  open,
  top,
  left,
  waypoint,
  isDestination,
  closeMenu,
  point,
}) => {
  const editWaypoints = useStore((state) => state.editWaypoints)
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
            editWaypoints({
              type: 'add',
              point,
              waypointType: 'destination',
            })
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
              editWaypoints({
                type: 'change',
                id: waypoint,
                waypointType: isDestination ? 'via' : 'destination',
              })
              closeMenu()
            }}
          >
            {isDestination ? 'Muuta välipisteeksi' : 'Muuta määränpääksi'}
          </MenuItem>,
          <MenuItem
            key="delete-waypoint"
            onClick={() => {
              editWaypoints({
                type: 'remove',
                id: waypoint,
              })
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
