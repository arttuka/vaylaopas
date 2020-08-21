import React, { PureComponent, ReactNode } from 'react'
import MenuList from '@material-ui/core/MenuList'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import { MenuState } from '../../common/types'

interface ContextMenuProps extends MenuState {
  onAdd: () => void
  onDelete: (id: string) => void
}

export default class ContextMenu extends PureComponent<ContextMenuProps> {
  render(): ReactNode {
    const { open, top, left, waypoint, onAdd, onDelete } = this.props
    return (
      open && (
        <Paper
          style={{
            top: `${top}px`,
            left: `${left}px`,
            position: 'absolute',
          }}
        >
          <MenuList>
            {waypoint === undefined ? (
              <MenuItem onClick={onAdd}>Lisää reitille</MenuItem>
            ) : (
              <MenuItem onClick={() => onDelete(waypoint)}>
                Poista reittipiste
              </MenuItem>
            )}
          </MenuList>
        </Paper>
      )
    )
  }
}
