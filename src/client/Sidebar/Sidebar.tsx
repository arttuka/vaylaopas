import React, { ComponentType, PureComponent, ReactElement } from 'react'
import MuiDrawer, { DrawerProps } from '@material-ui/core/Drawer'
import Hidden from '@material-ui/core/Hidden'
import MuiSwipeableDrawer, {
  SwipeableDrawerProps,
} from '@material-ui/core/SwipeableDrawer'
import Toolbar from '@material-ui/core/Toolbar'
import { withStyles } from '@material-ui/core/styles'

const styles = {
  docked: {
    width: 280,
  },
  paper: {
    width: 280,
  },
}

const Drawer: ComponentType<DrawerProps> = withStyles(styles)(MuiDrawer)

const SwipeableDrawer: ComponentType<SwipeableDrawerProps> = withStyles(styles)(
  MuiSwipeableDrawer
)

interface SidebarProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export default class Sidebar extends PureComponent<SidebarProps> {
  render(): ReactElement {
    return (
      <>
        <Hidden xsDown>
          <Drawer variant="permanent" anchor="left">
            <Toolbar />
            {this.props.children}
          </Drawer>
        </Hidden>
        <Hidden smUp>
          <SwipeableDrawer
            anchor="left"
            open={this.props.open}
            onClose={this.props.onClose}
            onOpen={this.props.onOpen}
          >
            {this.props.children}
          </SwipeableDrawer>
        </Hidden>
      </>
    )
  }
}
