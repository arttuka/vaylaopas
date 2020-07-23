import React, { FunctionComponent, useState } from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import { useInterval } from '../../common/util'

const interval = 20

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
}: TouchMarkerProps) => {
  const [progress, setProgress] = useState(0)

  useInterval(() => {
    const next = progress + (interval / duration) * 100
    setProgress(Math.min(next, 100))
  }, interval)

  const visibleProgress = progress >= 20 ? progress : 0
  const value = direction === 'up' ? visibleProgress : 100 - visibleProgress
  return (
    <CircularProgress
      variant="determinate"
      value={value}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        position: 'absolute',
        transform: 'translate(-50%, -50%) rotate(270deg)',
      }}
      size={100}
    />
  )
}

export default TouchMarker
