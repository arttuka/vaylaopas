import React, { FunctionComponent } from 'react'
import MuiAvatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import MuiListItemText from '@mui/material/ListItemText'
import { styled } from '@mui/material/styles'
import DeleteIcon from '@mui/icons-material/Delete'
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat'
import WarningIcon from '@mui/icons-material/Warning'
import { formatDuration, toNM, numToLetter, round } from '../../common/util'

const Avatar = styled(MuiAvatar)(({ theme: { palette } }) => ({
  color: '#ffffff',
  backgroundColor: palette.primary.main,
  fontWeight: 'bold',
}))

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

const ListItemText = styled(MuiListItemText)({
  margin: 0,
})

const OffsetListItemText = styled(MuiListItemText)({
  margin: 0,
  position: 'relative',
  top: -24,
})

const NotFoundIcon = styled(WarningIcon)({
  verticalAlign: 'top',
})

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
