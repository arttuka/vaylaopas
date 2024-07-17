import React, { ChangeEvent, FC, useState } from 'react'
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

const ClearButton: FC<ClearButtonProps> = ({ disabled, onClick }) => (
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
  initialValue?: number
  onChange: (value?: number) => void
}

const SettingField: FC<SettingFieldProps> = ({
  id,
  label,
  onChange,
  initialValue,
}) => {
  const [value, setValue] = useState(initialValue)
  const onFieldChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const v = parseFloat(e.currentTarget.value)
    setValue(v)
    onChange(isNaN(v) ? undefined : v)
  }
  const clearField = (): void => {
    setValue(undefined)
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
