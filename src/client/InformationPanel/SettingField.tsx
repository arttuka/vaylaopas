import React, { ChangeEvent, FunctionComponent } from 'react'
import CancelIcon from '@material-ui/icons/Cancel'
import MuiIconButton from '@material-ui/core/IconButton'
import InputAdornment from '@material-ui/core/InputAdornment'
import { withStyles } from '@material-ui/core/styles'
import MuiTextField from '@material-ui/core/TextField'

const IconButton = withStyles({
  root: {
    padding: 0,
  },
})(MuiIconButton)

interface ClearButtonProps {
  disabled: boolean
  onClick: () => void
}

const ClearButton: FunctionComponent<ClearButtonProps> = ({
  disabled,
  onClick,
}) => (
  <InputAdornment position="start">
    <IconButton disabled={disabled} onClick={onClick}>
      <CancelIcon />
    </IconButton>
  </InputAdornment>
)

const TextField = withStyles({
  root: {
    flexBasis: '40%',
  },
})(MuiTextField)

interface SettingFieldProps {
  id: string
  label: string
  value?: number
  onChange: (value?: number) => void
}

const SettingField: FunctionComponent<SettingFieldProps> = (props) => {
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.currentTarget.value)
    props.onChange(isNaN(value) ? undefined : value)
  }
  const onClear = (): void => {
    props.onChange(undefined)
  }
  const { id, label, value } = props
  return (
    <TextField
      id={id}
      label={label}
      value={value !== undefined ? value : ''}
      onChange={onChange}
      type="number"
      fullWidth
      InputProps={{
        startAdornment: (
          <ClearButton disabled={value === undefined} onClick={onClear} />
        ),
      }}
      inputProps={{
        step: 0.1,
      }}
    />
  )
}

export default SettingField
