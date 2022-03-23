import React, { VFC, useState } from 'react'
import MuiAppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import TopDrawer from '../InformationPanel/TopDrawer'

const AppBar: VFC = () => {
  const [open, setOpen] = useState(false)
  return (
    <MuiAppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          color="inherit"
          edge="start"
          onClick={() => setOpen(true)}
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <SettingsIcon />
        </IconButton>
        <TopDrawer open={open} onClose={() => setOpen(false)} />
        <Typography variant="h4">Väyläopas</Typography>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
