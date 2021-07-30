import React, { FunctionComponent } from 'react'
import MuiPaper from '@material-ui/core/Paper'
import { withStyles } from '@material-ui/core/styles'
import RouteList from './RouteList'
import SettingsAccordion from './SettingsAccordion'

const Paper = withStyles(({ spacing }) => ({
  root: {
    width: 280,
    position: 'absolute',
    top: spacing(10),
    left: spacing(2),
    zIndex: 10,
  },
}))(MuiPaper)

const InformationPanel: FunctionComponent = () => (
  <Paper elevation={3} sx={{ display: { xs: 'none', md: 'block' } }}>
    <RouteList />
    <SettingsAccordion />
  </Paper>
)

export default InformationPanel
