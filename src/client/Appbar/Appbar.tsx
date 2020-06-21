import React, { PureComponent, ReactElement } from 'react'
import MuiAppBar from '@material-ui/core/AppBar'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import MenuIcon from '@material-ui/icons/Menu'
import { withStyles } from '@material-ui/core/styles'

const StyledAppBar = withStyles({
  root: {
    zIndex: 1300,
  },
})(MuiAppBar)

interface AppBarProps {
  openSidebar: () => void
}

export default class AppBar extends PureComponent<AppBarProps> {
  render(): ReactElement {
    return (
      <div>
        <StyledAppBar position="fixed">
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
        </StyledAppBar>
      </div>
    )
  }
}
