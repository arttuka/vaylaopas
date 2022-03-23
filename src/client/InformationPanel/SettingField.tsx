import React, { ChangeEvent, FunctionComponent } from 'react'
import CancelIcon from '@mui/icons-material/Cancel'
import MuiIconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import { styled } from '@mui/material/styles'
import MuiTextField from '@mui/material/TextField'

const IconButton = styled(MuiIconButton)({
  padding: 0,
})

type ClearButtonProps = {
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

const TextField = styled(MuiTextField)({
  flexBasis: '40%',
})

type SettingFieldProps = {
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
      variant="standard"
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
