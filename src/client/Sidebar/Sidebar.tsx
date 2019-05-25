import React, {
  ComponentType,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from 'react'
import MuiDrawer, { DrawerProps } from '@material-ui/core/Drawer'
import { withStyles } from '@material-ui/core/styles'

const Drawer: ComponentType<DrawerProps> = withStyles({
  docked: {
    width: 240,
  },
  paper: {
    width: 240,
  },
})(MuiDrawer)

const Sidebar: FunctionComponent = ({
  children,
}: {
  children?: ReactNode
}): ReactElement => (
  <Drawer variant="permanent" anchor="left">
    {children}
  </Drawer>
)

export default Sidebar
