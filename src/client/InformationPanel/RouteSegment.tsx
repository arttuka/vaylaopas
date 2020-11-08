import React, { FunctionComponent } from 'react'
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

const Point: FunctionComponent<{ text: string }> = ({ text }) => (
  <ListItemAvatar>
    <Avatar>{text}</Avatar>
  </ListItemAvatar>
)

const Delete: FunctionComponent<{ onClick: () => void }> = ({ onClick }) => (
  <ListItemSecondaryAction>
    <IconButton onClick={onClick}>
      <DeleteIcon />
    </IconButton>
  </ListItemSecondaryAction>
)

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

const RouteSegment: FunctionComponent<RouteSegmentProps> = (props) => {
  const { length, duration, fuel, found, onClick } = props
  const durationStr = duration ? formatDuration(duration) : ''
  const fuelStr = fuel ? `, ${round(fuel, 1)} l` : ''
  const listItemTextProps = found
    ? {
        primary: length ? `${round(toNM(length), 1)} mpk` : '\u00a0',
        secondary: durationStr + fuelStr || '\u00a0',
      }
    : {
        primary: (
          <>
            <NotFoundIcon color="error" /> Ei reittiä
          </>
        ),
      }
  if (props.kind === 'totals') {
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
    const { index, onDelete } = props
    return (
      <ListItem>
        <Point text={numToLetter(index)} />
        <OffsetListItemText {...listItemTextProps} />
        <Delete onClick={onDelete} />
      </ListItem>
    )
  }
}

export default RouteSegment
