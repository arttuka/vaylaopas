import React, { FunctionComponent, useState } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import { useInterval } from '../../common/util'

const interval = 20

const StyledCircularProgress = styled(CircularProgress)({
  position: 'absolute',
  '& .MuiCircularProgress-circleDeterminate': {
    transition: 'none',
  },
})

interface TouchMarkerProps {
  direction: 'up' | 'down'
  duration: number
  top: number
  left: number
}

const TouchMarker: FunctionComponent<TouchMarkerProps> = ({
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
