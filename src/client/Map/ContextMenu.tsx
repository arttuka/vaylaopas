import React, { FunctionComponent, ReactElement } from 'react'
import MenuList from '@material-ui/core/MenuList'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'

interface ContextMenuProps {
  open: boolean
  top: number
  left: number
  onAdd: () => void
}

const ContextMenu: FunctionComponent<ContextMenuProps> = ({
  open,
  top,
  left,
  onAdd,
}: ContextMenuProps): ReactElement | null =>
  open ? (
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
  ) : null

export default ContextMenu
