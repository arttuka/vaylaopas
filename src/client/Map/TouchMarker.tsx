import React, { VFC, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import { TouchMarkerState } from '../../common/types'
import { useInterval } from '../../common/util'

const interval = 20

const StyledCircularProgress = styled(CircularProgress)({
  position: 'absolute',
  '& .MuiCircularProgress-circleDeterminate': {
    transition: 'none',
  },
})

type TouchMarkerProps = TouchMarkerState & {
  duration: number
}

const TouchMarker: VFC<TouchMarkerProps> = ({
  direction,
  duration,
  top,
  left,
}) => {
  const [progress, setProgress] = useState(0)

  useInterval((ms) => {
    const next = progress + (ms / duration) * 100
    setProgress(Math.min(next, 100))
  }, interval)

  const visibleProgress = progress >= 20 ? progress : 0
  const value = direction === 'up' ? visibleProgress : 100 - visibleProgress
  return (
    <StyledCircularProgress
      variant="determinate"
      value={value}
      sx={{
        top: `${top}px`,
        left: `${left}px`,
      }}
      style={{
        transform: 'translate(-50%, -50%) rotate(-90deg)',
      }}
      size={100}
    />
  )
}

export default TouchMarker
