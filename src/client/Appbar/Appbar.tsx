import React, { PureComponent, ReactElement } from 'react'
import MuiAppBar from '@material-ui/core/AppBar'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import MenuIcon from '@material-ui/icons/Menu'

interface AppBarProps {
  openSidebar: () => void
}

export default class AppBar extends PureComponent<AppBarProps> {
  render(): ReactElement {
    return (
      <MuiAppBar position="static">
        <Toolbar>
          <Hidden smUp>
            <IconButton
              color="inherit"
              edge="start"
              onClick={this.props.openSidebar}
            >
              <MenuIcon />
            </IconButton>
          </Hidden>
          <Typography variant="h4">Väyläopas</Typography>
        </Toolbar>
      </MuiAppBar>
    )
  }
}
