import { FC, useState } from 'react'
import MuiAppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import TopDrawer from '../InformationPanel/TopDrawer'

const AppBar: FC = () => {
  const [open, setOpen] = useState(false)
  return (
    <MuiAppBar position="static">
      <Toolbar sx={{ minHeight: { xs: 40, sm: 56 } }}>
        <IconButton
          size="medium"
          color="inherit"
          edge="start"
          onClick={() => setOpen(true)}
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <SettingsIcon />
        </IconButton>
        <TopDrawer open={open} onClose={() => setOpen(false)} />
        <Typography
          variant="h4"
          sx={{ fontWeight: 400, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Väyläopas
        </Typography>
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar
