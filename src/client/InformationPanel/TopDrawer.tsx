import React, { FunctionComponent } from 'react'
import MuiDrawer from '@material-ui/core/Drawer'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'
import SettingsContainer from '../InformationPanel/SettingsContainer'

const Drawer = withStyles(({ spacing }) => ({
  paper: {
    padding: spacing(2, 2, 0),
  },
}))(MuiDrawer)

const CloseButton = withStyles({
  root: {
    width: '100%',
  },
})(IconButton)

interface TopDrawerProps {
  open: boolean
  onClose: () => void
}

const TopDrawer: FunctionComponent<TopDrawerProps> = ({ open, onClose }) => (
  <Drawer anchor="top" open={open} onClose={onClose}>
    <SettingsContainer />
    <CloseButton onClick={onClose} size="small">
      <KeyboardArrowUpIcon />
    </CloseButton>
  </Drawer>
)

export default TopDrawer
