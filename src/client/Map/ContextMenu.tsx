import React, { PureComponent, ReactNode } from 'react'
import MenuList from '@material-ui/core/MenuList'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'

interface ContextMenuProps {
  open: boolean
  top: number
  left: number
  onAdd: () => void
}

export default class ContextMenu extends PureComponent<ContextMenuProps> {
  render(): ReactNode {
    const { open, top, left, onAdd } = this.props
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
            <MenuItem onClick={onAdd}>Lisää reitille</MenuItem>
          </MenuList>
        </Paper>
      )
    )
  }
}
