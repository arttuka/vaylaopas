import React, { FunctionComponent } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { MenuState, WaypointType } from '../../common/types'

interface ContextMenuProps extends MenuState {
  onAdd: () => void
  onClose: () => void
  onDelete: (id: string) => void
  onChange: (id: string, type: WaypointType) => void
}

const ContextMenu: FunctionComponent<ContextMenuProps> = ({
  open,
  top,
  left,
  waypoint,
  isDestination,
  onAdd,
  onClose,
  onDelete,
  onChange,
}) => (
  <Menu
    keepMounted
    open={open}
    onClose={onClose}
    anchorReference="anchorPosition"
    anchorPosition={{ top, left }}
  >
    {waypoint === undefined ? (
      <MenuItem onClick={onAdd}>Lisää reitille</MenuItem>
    ) : (
      [
        isDestination ? (
          <MenuItem
            key="change-to-waypoint"
            onClick={() => onChange(waypoint, 'waypoint')}
          >
            Muuta välipisteeksi
          </MenuItem>
        ) : (
          <MenuItem
            key="change-to-destination"
            onClick={() => onChange(waypoint, 'destination')}
          >
            Muuta määränpääksi
          </MenuItem>
        ),
        <MenuItem key="delete-waypoint" onClick={() => onDelete(waypoint)}>
          Poista reittipiste
        </MenuItem>,
      ]
    )}
  </Menu>
)

export default ContextMenu
