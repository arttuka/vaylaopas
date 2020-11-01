import React, { FunctionComponent, useState } from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import { withStyles } from '@material-ui/core/styles'
import { useInterval } from '../../common/util'

const interval = 20

const StyledCircularProgress = withStyles({
  determinate: {
    position: 'absolute',
  },
  circleDeterminate: {
    transition: 'none',
  },
})(CircularProgress)

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
    <StyledCircularProgress
      variant="determinate"
      value={value}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translate(-50%, -50%) rotate(-90deg)',
      }}
      size={100}
    />
  )
}

export default TouchMarker
