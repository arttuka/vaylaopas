import React, { PureComponent, ReactElement } from 'react'
import MuiAvatar from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import MuiListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import DirectionsBoatIcon from '@material-ui/icons/DirectionsBoat'
import WarningIcon from '@material-ui/icons/Warning'
import { formatDuration, toNM, numToLetter, round } from '../../common/util'

const Avatar = withStyles(({ palette }) => ({
  root: {
    color: '#ffffff',
    backgroundColor: palette.primary.main,
    fontWeight: 'bold',
  },
}))(MuiAvatar)

class Point extends PureComponent<{ text: string }> {
  render(): ReactElement {
    return (
      <ListItemAvatar>
        <Avatar>{this.props.text}</Avatar>
      </ListItemAvatar>
    )
  }
}

class Delete extends PureComponent<{ onClick: () => void }> {
  render(): ReactElement {
    return (
      <ListItemSecondaryAction>
        <IconButton onClick={this.props.onClick}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    )
  }
}

const ListItemText = withStyles({
  root: {
    margin: 0,
  },
})(MuiListItemText)

const OffsetListItemText = withStyles({
  root: {
    margin: 0,
    position: 'relative',
    top: -24,
  },
})(MuiListItemText)

const NotFoundIcon = withStyles({
  root: {
    verticalAlign: 'top',
  },
})(WarningIcon)

interface SegmentProps {
  length?: number
  duration?: number
  fuel?: number
  index: number
  found: boolean
  onDelete: () => void
  kind?: 'segment'
}

interface TotalsProps {
  length?: number
  duration?: number
  fuel?: number
  found: boolean
  kind: 'totals'
}

type RouteSegmentProps = (SegmentProps | TotalsProps) & {
  onClick?: () => void
}

class RouteSegment extends PureComponent<RouteSegmentProps> {
  render(): ReactElement {
    const { length, duration, fuel, found, onClick } = this.props
    const durationStr = duration ? formatDuration(duration) : ''
    const fuelStr = fuel ? `, ${round(fuel, 1)} l` : ''
    const listItemTextProps = found
      ? {
          primary: length ? `${toNM(length)} mpk` : '\u00a0',
          secondary: durationStr + fuelStr || '\u00a0',
        }
      : {
          primary: (
            <>
              <NotFoundIcon color="error" /> Ei reittiä
            </>
          ),
        }
    if (this.props.kind === 'totals') {
      return (
        <ListItem divider={true} onClick={onClick}>
          <ListItemAvatar>
            <Avatar>
              <DirectionsBoatIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText {...listItemTextProps} />
        </ListItem>
      )
    } else {
      const { index, onDelete } = this.props
      return (
        <ListItem>
          <Point text={numToLetter(index)} />
          <OffsetListItemText {...listItemTextProps} />
          <Delete onClick={onDelete} />
        </ListItem>
      )
    }
  }
}

export default RouteSegment
