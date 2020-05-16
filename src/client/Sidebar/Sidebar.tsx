import React, { ComponentType, PureComponent, ReactElement } from 'react'
import Hidden from '@material-ui/core/Hidden'
import MuiPaper, { PaperProps } from '@material-ui/core/Paper'
import MuiSwipeableDrawer, {
  SwipeableDrawerProps,
} from '@material-ui/core/SwipeableDrawer'
import { withStyles } from '@material-ui/core/styles'

const Paper: ComponentType<PaperProps> = withStyles({
  root: {
    width: 280,
    position: 'absolute',
    top: 76,
    left: 16,
    zIndex: 10,
  },
})(MuiPaper)

const styles = {
  docked: {
    width: 280,
  },
  paper: {
    width: 280,
  },
}

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
          <Paper elevation={3}>{this.props.children}</Paper>
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
