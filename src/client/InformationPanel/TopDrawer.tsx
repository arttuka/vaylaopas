import React, { FunctionComponent } from 'react'
import MuiDrawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import SettingsContainer from '../InformationPanel/SettingsContainer'

const Drawer = styled(MuiDrawer)(({ theme: { spacing } }) => ({
  '& .MuiDrawer-paper': {
    padding: spacing(2, 2, 0),
  },
}))

const CloseButton = styled(IconButton)({
  width: '100%',
})

type TopDrawerProps = {
  open: boolean
  onClose: () => void
}

const TopDrawer: FunctionComponent<TopDrawerProps> = ({ open, onClose }) => (
  <Drawer
    anchor="top"
    open={open}
    onClose={onClose}
    sx={{ display: { xs: 'block', sm: 'none' } }}
  >
    <SettingsContainer />
    <CloseButton onClick={onClose} size="small">
      <KeyboardArrowUpIcon />
    </CloseButton>
  </Drawer>
)

export default TopDrawer
