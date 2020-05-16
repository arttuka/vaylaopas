import React, { ComponentType, PureComponent, ReactElement } from 'react'
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
import { Settings } from '../../common/types'

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

type ChangeHandler = (value?: number) => void

interface SettingsProps {
  settings: Settings
  updateSetting: (key: keyof Settings, value?: number) => void
}

export default class SettingsContainer extends PureComponent<SettingsProps> {
  handleUpdateDepth: ChangeHandler
  handleUpdateHeight: ChangeHandler
  handleUpdateSpeed: ChangeHandler
  handleUpdateConsumption: ChangeHandler
  constructor(props: SettingsProps) {
    super(props)
    this.handleUpdateDepth = (value?: number): void =>
      this.handleUpdate('depth', value)
    this.handleUpdateHeight = (value?: number): void =>
      this.handleUpdate('height', value)
    this.handleUpdateSpeed = (value?: number): void =>
      this.handleUpdate('speed', value)
    this.handleUpdateConsumption = (value?: number): void =>
      this.handleUpdate('consumption', value)
  }

  handleUpdate(key: keyof Settings, value?: number): void {
    this.props.updateSetting(key, value)
  }

  render(): ReactElement {
    const { depth, height, speed, consumption } = this.props.settings
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
            onChange={this.handleUpdateDepth}
          />
          <SettingField
            id="settingfield-height"
            label="Korkeus (m)"
            value={height}
            onChange={this.handleUpdateHeight}
          />
          <SettingField
            id="settingfield-speed"
            label="Nopeus (kn)"
            value={speed}
            onChange={this.handleUpdateSpeed}
          />
          <SettingField
            id="settingfield-consumption"
            label="Kulutus (l/h)"
            value={consumption}
            onChange={this.handleUpdateConsumption}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}
