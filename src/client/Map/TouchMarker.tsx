import React, { Component, ReactElement } from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'

const interval = 20

interface TouchMarkerState {
  progress: number
}

interface TouchMarkerProps {
  direction: 'up' | 'down'
  duration: number
  top: number
  left: number
}

export default class TouchMarker extends Component<
  TouchMarkerProps,
  TouchMarkerState
> {
  timer = 0
  constructor(props: TouchMarkerProps) {
    super(props)
    this.state = {
      progress: 0,
    }
    this.tick = this.tick.bind(this)
  }

  nextProgress(progress: number): number {
    const next = progress + (interval / this.props.duration) * 100
    return next < 100 ? next : 100
  }

  tick(): void {
    if (this.state.progress >= 100) {
      window.clearInterval(this.timer)
    } else {
      this.setState(
        ({ progress }): TouchMarkerState => ({
          progress: this.nextProgress(progress),
        })
      )
    }
  }

  componentDidMount(): void {
    this.timer = window.setInterval(this.tick, interval)
  }

  componentWillUnmount(): void {
    window.clearInterval(this.timer)
  }

  render(): ReactElement {
    const { top, left, direction } = this.props
    const progress = this.state.progress >= 20 ? this.state.progress : 0
    const value = direction === 'up' ? progress : 100 - progress
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
}
