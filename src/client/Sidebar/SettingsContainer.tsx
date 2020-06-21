import React, { ComponentType, FunctionComponent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MuiExpansionPanel, {
  ExpansionPanelProps,
} from '@material-ui/core/ExpansionPanel'
import MuiExpansionPanelSummary, {
  ExpansionPanelSummaryProps,
} from '@material-ui/core/ExpansionPanelSummary'
import MuiExpansionPanelDetails, {
  ExpansionPanelDetailsProps,
} from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'
import SettingsIcon from '@material-ui/icons/Settings'
import SettingField from './SettingField'
import { settingsSelector } from '../redux/selectors'
import { Settings } from '../../common/types'
import { settingsSetAction } from '../redux/actions'

const ExpansionPanel: ComponentType<ExpansionPanelProps> = withStyles({
  root: {
    '&$expanded': {
      margin: 0,
    },
  },
  expanded: {},
})(MuiExpansionPanel)

const ExpansionPanelSummary: ComponentType<ExpansionPanelSummaryProps> = withStyles(
  {
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
  }
)(MuiExpansionPanelSummary)

const ExpansionPanelDetails: ComponentType<ExpansionPanelDetailsProps> = withStyles(
  {
    root: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
  }
)(MuiExpansionPanelDetails)

const SettingsContainer: FunctionComponent = () => {
  const dispatch = useDispatch()
  const { depth, height, speed, consumption } = useSelector(settingsSelector)
  const updateSetting = (key: keyof Settings) => (value?: number): void => {
    dispatch(settingsSetAction({ key, value }))
  }
  return (
    <ExpansionPanel>
      <ExpansionPanelSummary expandIcon={<SettingsIcon />}>
        Asetukset
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
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
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}

export default SettingsContainer
