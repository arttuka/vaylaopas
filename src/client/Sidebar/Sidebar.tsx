import React, { ComponentType, PureComponent, ReactElement } from 'react'
import MuiDrawer, { DrawerProps } from '@material-ui/core/Drawer'
import { withStyles } from '@material-ui/core/styles'

const Drawer: ComponentType<DrawerProps> = withStyles({
  docked: {
    width: 280,
  },
  paper: {
    width: 280,
  },
})(MuiDrawer)

export default class Sidebar extends PureComponent<{}> {
  render(): ReactElement {
    return (
      <Drawer variant="permanent" anchor="left">
        {this.props.children}
      </Drawer>
    )
  }
}
