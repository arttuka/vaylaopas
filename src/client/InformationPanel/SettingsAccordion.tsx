import React, { FunctionComponent } from 'react'
import MuiAccordion from '@material-ui/core/Accordion'
import MuiAccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import { withStyles } from '@material-ui/core/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SettingsContainer from './SettingsContainer'

const Accordion = withStyles({
  root: {
    '&$expanded': {
      margin: 0,
    },
  },
  expanded: {},
})(MuiAccordion)

const AccordionSummary = withStyles({
  root: {
    minHeight: 48,
    '&$expanded': {
      minHeight: 48,
      margin: 0,
    },
  },
  content: {
    '&$expanded': {
      margin: 0,
    },
  },
  expanded: {},
})(MuiAccordionSummary)

const SettingsAccordion: FunctionComponent = () => (
  <Accordion>
    <AccordionSummary expandIcon={<SettingsIcon />}>Asetukset</AccordionSummary>
    <AccordionDetails>
      <SettingsContainer />
    </AccordionDetails>
  </Accordion>
)

export default SettingsAccordion
