import React, { VFC } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { MenuState, WaypointType } from '../../common/types'

type ContextMenuProps = MenuState & {
  closeMenu: () => void
  onAdd: () => void
  onDelete: (id: string) => void
  onChange: (id: string, type: WaypointType) => void
}

const ContextMenu: VFC<ContextMenuProps> = ({
  open,
  top,
  left,
  waypoint,
  isDestination,
  onAdd,
  closeMenu,
  onDelete,
  onChange,
}) => (
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
          onAdd()
          closeMenu()
        }}
      >
        Lisää reitille
      </MenuItem>
    ) : (
      [
        isDestination ? (
          <MenuItem
            key="change-to-waypoint"
            onClick={() => {
              onChange(waypoint, 'waypoint')
              closeMenu()
            }}
          >
            Muuta välipisteeksi
          </MenuItem>
        ) : (
          <MenuItem
            key="change-to-destination"
            onClick={() => {
              onChange(waypoint, 'destination')
              closeMenu()
            }}
          >
            Muuta määränpääksi
          </MenuItem>
        ),
        <MenuItem
          key="delete-waypoint"
          onClick={() => {
            onDelete(waypoint)
            closeMenu
          }}
        >
          Poista reittipiste
        </MenuItem>,
      ]
    )}
  </Menu>
)

export default ContextMenu
