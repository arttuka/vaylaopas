import React, { FunctionComponent } from 'react'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
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
}: ContextMenuProps) => (
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
      <>
        {isDestination ? (
          <MenuItem onClick={() => onChange(waypoint, 'waypoint')}>
            Muuta välipisteeksi
          </MenuItem>
        ) : (
          <MenuItem onClick={() => onChange(waypoint, 'destination')}>
            Muuta määränpääksi
          </MenuItem>
        )}
        <MenuItem onClick={() => onDelete(waypoint)}>
          Poista reittipiste
        </MenuItem>
      </>
    )}
  </Menu>
)

export default ContextMenu
