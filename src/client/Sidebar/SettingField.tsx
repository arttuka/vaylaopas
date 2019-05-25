import React, {
  ChangeEvent,
  ComponentType,
  PureComponent,
  ReactElement,
} from 'react'
import CancelIcon from '@material-ui/icons/Cancel'
import MuiIconButton, { IconButtonProps } from '@material-ui/core/IconButton'
import InputAdornment from '@material-ui/core/InputAdornment'
import { withStyles } from '@material-ui/core/styles'
import MuiTextField, { TextFieldProps } from '@material-ui/core/TextField'

interface ClearButtonProps {
  disabled: boolean
  onClick: () => void
}

const IconButton: ComponentType<IconButtonProps> = withStyles({
  root: {
    padding: 0,
  },
})(MuiIconButton)

class ClearButton extends PureComponent<ClearButtonProps> {
  render(): ReactElement {
    const { disabled, onClick } = this.props
    return (
      <InputAdornment position="start">
        <IconButton disabled={disabled} onClick={onClick}>
          <CancelIcon />
        </IconButton>
      </InputAdornment>
    )
  }
}

const TextField: ComponentType<TextFieldProps> = withStyles({
  root: {
    flexBasis: 90,
  },
})(MuiTextField)

interface SettingFieldProps {
  id: string
  label: string
  value?: number
  onChange: (value?: number) => void
}

export default class SettingField extends PureComponent<SettingFieldProps> {
  constructor(props: SettingFieldProps) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.onClear = this.onClear.bind(this)
  }

  onChange(e: ChangeEvent<HTMLInputElement>): void {
    const value = parseFloat(e.currentTarget.value)
    this.props.onChange(isNaN(value) ? undefined : value)
  }

  onClear(): void {
    this.props.onChange(undefined)
  }

  render(): ReactElement {
    const { id, label, value } = this.props
    return (
      <TextField
        id={id}
        label={label}
        value={value !== undefined ? value : ''}
        onChange={this.onChange}
        type="number"
        fullWidth
        InputProps={{
          startAdornment: (
            <ClearButton
              disabled={value === undefined}
              onClick={this.onClear}
            />
          ),
        }}
        inputProps={{
          step: 0.1,
        }}
      />
    )
  }
}
