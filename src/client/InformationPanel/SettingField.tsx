import React, { ChangeEvent, VFC } from 'react'
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

const ClearButton: VFC<ClearButtonProps> = ({ disabled, onClick }) => (
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

const SettingField: VFC<SettingFieldProps> = ({
  id,
  label,
  onChange,
  value,
}) => {
  const onFieldChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.currentTarget.value)
    onChange(isNaN(value) ? undefined : value)
  }
  const clearField = (): void => {
    onChange(undefined)
  }
  return (
    <TextField
      id={id}
      label={label}
      value={value ?? ''}
      onChange={onFieldChange}
      type="number"
      variant="standard"
      fullWidth
      InputProps={{
        startAdornment: (
          <ClearButton disabled={value === undefined} onClick={clearField} />
        ),
      }}
      inputProps={{
        step: 0.1,
      }}
    />
  )
}

export default SettingField
