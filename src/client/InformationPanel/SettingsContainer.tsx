import React, { FunctionComponent } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import SettingField from './SettingField'
import { settingsSelector } from '../redux/selectors'
import { Settings } from '../../common/types'
import { settingsSetAction } from '../redux/actions'

const Container = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
})

const SettingsContainer: FunctionComponent = () => {
  const dispatch = useDispatch()
  const { depth, height, speed, consumption } = useSelector(settingsSelector)
  const updateSetting =
    (key: keyof Settings) =>
    (value?: number): void => {
      const posValue = value && Math.max(0, value)
      dispatch(settingsSetAction({ key, value: posValue }))
    }
  return (
    <Container>
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
    </Container>
  )
}

export default SettingsContainer
