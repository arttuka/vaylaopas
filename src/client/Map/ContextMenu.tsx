import React, { FunctionComponent } from 'react'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import { MenuState } from '../../common/types'

interface ContextMenuProps extends MenuState {
  onAdd: () => void
  onClose: () => void
  onDelete: (id: string) => void
}

const ContextMenu: FunctionComponent<ContextMenuProps> = ({
  open,
  top,
  left,
  waypoint,
  onAdd,
  onClose,
  onDelete,
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
      <MenuItem onClick={() => onDelete(waypoint)}>Poista reittipiste</MenuItem>
    )}
  </Menu>
)

export default ContextMenu
