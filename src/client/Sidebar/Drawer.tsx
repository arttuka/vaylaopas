import React, { PureComponent, ReactNode } from 'react'
import { default as MuiDrawer } from '@material-ui/core/Drawer'
import { createStyles, withStyles } from '@material-ui/core/styles'

const width = 240
const styles = createStyles({
  drawer: {
    width,
  },
  drawerPaper: {
    width,
  },
})

interface RouteDrawerProps {
  classes: {
    drawer: string
    drawerPaper: string
  }
}

class Drawer extends PureComponent<RouteDrawerProps> {
  render(): ReactNode {
    const { classes, children } = this.props
    return (
      <MuiDrawer
        variant="permanent"
        anchor="left"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
      >
        {children}
      </MuiDrawer>
    )
  }
}

export default withStyles(styles)(Drawer)
