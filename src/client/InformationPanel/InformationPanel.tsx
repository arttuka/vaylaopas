import React, { FC } from 'react'
import MuiPaper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import RouteList from './RouteList'
import SettingsAccordion from './SettingsAccordion'

const Paper = styled(MuiPaper)(({ theme: { spacing } }) => ({
  width: 280,
  position: 'absolute',
  top: spacing(10),
  left: spacing(2),
  zIndex: 10,
}))

const InformationPanel: FC = () => (
  <Paper elevation={3} sx={{ display: { xs: 'none', md: 'block' } }}>
    <RouteList />
    <SettingsAccordion />
  </Paper>
)

export default InformationPanel
