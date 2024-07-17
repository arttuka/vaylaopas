import React, { FC } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { styled } from '@mui/material/styles'
import SettingField from './SettingField'
import { Settings } from '../../common/types'
import { useStore } from '../store/store'

const Container = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
})

const SettingsContainer: FC = () => {
  const { settings, setSetting } = useStore(
    useShallow((state) => ({
      settings: state.settings,
      setSetting: state.setSetting,
    }))
  )
  const { depth, height, speed, consumption } = settings
  const updateSetting =
    (key: keyof Settings) =>
    (value?: number): void => {
      const posValue = value && Math.max(0, value)
      setSetting(key, posValue)
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
