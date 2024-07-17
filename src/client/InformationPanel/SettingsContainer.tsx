import React, { FC } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { styled } from '@mui/material/styles'
import SettingField from './SettingField'
import { Settings } from '../../common/types'
import { debounce } from '../../common/util'
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
  const updateSetting = (key: keyof Settings) =>
    debounce((value?: number): void => {
      const posValue = value && Math.max(0, value)
      setSetting(key, posValue)
    }, 200)
  return (
    <Container>
      <SettingField
        id="settingfield-depth"
        label="Syväys (m)"
        initialValue={depth}
        onChange={updateSetting('depth')}
      />
      <SettingField
        id="settingfield-height"
        label="Korkeus (m)"
        initialValue={height}
        onChange={updateSetting('height')}
      />
      <SettingField
        id="settingfield-speed"
        label="Nopeus (kn)"
        initialValue={speed}
        onChange={updateSetting('speed')}
      />
      <SettingField
        id="settingfield-consumption"
        label="Kulutus (l/h)"
        initialValue={consumption}
        onChange={updateSetting('consumption')}
      />
    </Container>
  )
}

export default SettingsContainer
