import React, { Component, ComponentType, ReactElement } from 'react'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import MuiExpansionPanelSummary, {
  ExpansionPanelSummaryProps,
} from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SettingField from './SettingField'
import { Settings } from '../../common/types'

const ExpansionPanelSummary: ComponentType<
  ExpansionPanelSummaryProps
> = withStyles({
  root: {
    minHeight: 48,
    '&$expanded': {
      minHeight: 48,
    },
  },
  content: {
    '&$expanded': {
      margin: '12px 0',
    },
  },
  expanded: {},
})(MuiExpansionPanelSummary)

type ChangeHandler = (value?: number) => void

interface SettingsProps {
  settings: Settings
  updateSetting: (key: keyof Settings, value?: number) => void
}

class SettingsContainer extends Component<SettingsProps, {}> {
  handleUpdateDepth: ChangeHandler
  handleUpdateHeight: ChangeHandler
  constructor(props: SettingsProps) {
    super(props)
    this.handleUpdateDepth = (value?: number): void =>
      this.handleUpdate('depth', value)
    this.handleUpdateHeight = (value?: number): void =>
      this.handleUpdate('height', value)
  }

  handleUpdate(key: keyof Settings, value?: number): void {
    this.props.updateSetting(key, value)
  }

  render(): ReactElement {
    const {
      settings: { depth, height },
    } = this.props
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
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
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

export default SettingsContainer
