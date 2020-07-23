import React, { ComponentType, FunctionComponent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MuiAccordion, { AccordionProps } from '@material-ui/core/Accordion'
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from '@material-ui/core/AccordionSummary'
import MuiAccordionDetails, {
  AccordionDetailsProps,
} from '@material-ui/core/AccordionDetails'
import { withStyles } from '@material-ui/core/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SettingField from './SettingField'
import { settingsSelector } from '../redux/selectors'
import { Settings } from '../../common/types'
import { settingsSetAction } from '../redux/actions'

const Accordion: ComponentType<AccordionProps> = withStyles({
  root: {
    '&$expanded': {
      margin: 0,
    },
  },
  expanded: {},
})(MuiAccordion)

const AccordionSummary: ComponentType<AccordionSummaryProps> = withStyles({
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

const AccordionDetails: ComponentType<AccordionDetailsProps> = withStyles({
  root: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
})(MuiAccordionDetails)

const SettingsContainer: FunctionComponent = () => {
  const dispatch = useDispatch()
  const { depth, height, speed, consumption } = useSelector(settingsSelector)
  const updateSetting = (key: keyof Settings) => (value?: number): void => {
    dispatch(settingsSetAction({ key, value }))
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
