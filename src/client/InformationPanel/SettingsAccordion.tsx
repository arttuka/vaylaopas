import React, { FC } from 'react'
import MuiAccordion from '@mui/material/Accordion'
import MuiAccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { styled } from '@mui/material/styles'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsContainer from './SettingsContainer'

const Accordion = styled(MuiAccordion)({
  '&.Mui-expanded': {
    margin: 0,
  },
})

const AccordionSummary = styled(MuiAccordionSummary)({
  minHeight: 48,
  '&.Mui-expanded': {
    minHeight: 48,
    margin: 0,
  },
  '& .MuiAccordionSummary-content': {
    '&.Mui-expanded': {
      margin: 0,
    },
  },
})

const SettingsAccordion: FC = () => (
  <Accordion>
    <AccordionSummary expandIcon={<SettingsIcon />}>Asetukset</AccordionSummary>
    <AccordionDetails>
      <SettingsContainer />
    </AccordionDetails>
  </Accordion>
)

export default SettingsAccordion
