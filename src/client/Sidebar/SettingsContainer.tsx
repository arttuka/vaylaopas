import React, { FunctionComponent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MuiAccordion from '@material-ui/core/Accordion'
import MuiAccordionSummary from '@material-ui/core/AccordionSummary'
import MuiAccordionDetails from '@material-ui/core/AccordionDetails'
import { withStyles } from '@material-ui/core/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SettingField from './SettingField'
import { settingsSelector } from '../redux/selectors'
import { Settings } from '../../common/types'
import { settingsSetAction } from '../redux/actions'

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

const AccordionDetails = withStyles({
  root: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})(MuiAccordionDetails)

const SettingsContainer: FunctionComponent = () => {
  const dispatch = useDispatch()
  const { depth, height, speed, consumption } = useSelector(settingsSelector)
  const updateSetting = (key: keyof Settings) => (value?: number): void => {
    const posValue = value && Math.max(0, value)
    dispatch(settingsSetAction({ key, value: posValue }))
  }
  return (
    <Accordion>
      <AccordionSummary expandIcon={<SettingsIcon />}>
        Asetukset
      </AccordionSummary>
      <AccordionDetails>
        <SettingField
          id="settingfield-depth"
          label="Syväys (m)"
          value={depth}
          onChange={updateSetting('depth')}
        />
        <SettingField
          id="settingfield-height"
          label="Korkeus (m)"
          value={height}
          onChange={updateSetting('height')}
        />
        <SettingField
          id="settingfield-speed"
          label="Nopeus (kn)"
          value={speed}
          onChange={updateSetting('speed')}
        />
        <SettingField
          id="settingfield-consumption"
          label="Kulutus (l/h)"
          value={consumption}
          onChange={updateSetting('consumption')}
        />
      </AccordionDetails>
    </Accordion>
  )
}

export default SettingsContainer
