import React, { FunctionComponent, useState } from 'react'
import MuiAppBar from '@material-ui/core/AppBar'
import Hidden from '@material-ui/core/Hidden'
import IconButton from '@material-ui/core/IconButton'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import SettingsIcon from '@material-ui/icons/Settings'
import TopDrawer from '../InformationPanel/TopDrawer'

const AppBar: FunctionComponent = () => {
  const [open, setOpen] = useState(false)
  return (
    <MuiAppBar position="static">
      <Toolbar>
        <Hidden smUp>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(true)}
          >
            <SettingsIcon />
          </IconButton>
          <TopDrawer open={open} onClose={() => setOpen(false)} />
        </Hidden>
        <Typography variant="h4">Väyläopas</Typography>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
