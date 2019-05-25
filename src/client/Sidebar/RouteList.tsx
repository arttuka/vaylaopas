import React, {
  ComponentType,
  FunctionComponent,
  ReactElement,
  ReactNode,
} from 'react'
import blue from '@material-ui/core/colors/blue'
import MuiAvatar, { AvatarProps } from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import { Route } from '../../common/types'
import {
  add,
  formatDuration,
  toNM,
  numToLetter,
  round,
} from '../../common/util'

const Avatar: ComponentType<AvatarProps> = withStyles({
  root: {
    color: '#ffffff',
    backgroundColor: blue[500],
    fontWeight: 'bold',
  },
})(MuiAvatar)

interface PointProps {
  text: string
}

const Point: FunctionComponent<PointProps> = ({
  text,
}: PointProps): ReactElement => (
  <ListItemAvatar>
    <Avatar>{text}</Avatar>
  </ListItemAvatar>
)

interface DeleteProps {
  onClick: () => void
}

const Delete: FunctionComponent<DeleteProps> = ({
  onClick,
}: DeleteProps): ReactElement => (
  <ListItemSecondaryAction>
    <IconButton onClick={onClick}>
      <DeleteIcon />
    </IconButton>
  </ListItemSecondaryAction>
)

interface RouteSegmentProps {
  length: number
  duration?: number
  fuel?: number
  index?: number
  onDelete?: () => void
}

const RouteSegment: FunctionComponent<RouteSegmentProps> = ({
  index,
  length,
  duration,
  fuel,
  onDelete,
}: RouteSegmentProps): ReactElement => {
  const durationStr = duration !== undefined ? formatDuration(duration) : ''
  const fuelStr = fuel !== undefined ? `, ${round(fuel, 1)} l` : ''
  return (
    <ListItem>
      <Point text={index !== undefined ? numToLetter(index) : '='} />
      <ListItemText
        primary={`${toNM(length)} mpk`}
        secondary={durationStr + fuelStr}
      />
      {onDelete && <Delete onClick={onDelete} />}
    </ListItem>
  )
}

interface Totals {
  totalDuration?: number
  totalFuel?: number
  totalLength: number
}

const calculateTotals = (routes: Route[]): Totals =>
  routes.reduce<Totals>(
    (
      { totalDuration, totalFuel, totalLength },
      { duration, fuel, length }
    ): Totals => ({
      totalDuration: add(duration, totalDuration),
      totalFuel: add(fuel, totalFuel),
      totalLength: totalLength + length,
    }),
    { totalDuration: 0, totalFuel: 0, totalLength: 0 }
  )

interface RouteListProps {
  routes: Route[]
  onDelete: (index: number) => void
}

const RouteList: FunctionComponent<RouteListProps> = ({
  routes,
  onDelete,
}: RouteListProps): ReactElement => {
  const { totalDuration, totalFuel, totalLength } = calculateTotals(routes)
  return (
    <List>
      {routes.length > 0 && (
        <ListItem>
          <Point text="A" />
          <Delete onClick={(): void => onDelete(0)} />
        </ListItem>
      )}
      {routes.map(
        ({ length, duration, fuel }, i): ReactNode => (
          <RouteSegment
            key={`route-segment-${i}`}
            length={length}
            duration={duration}
            fuel={fuel}
            index={i + 1}
            onDelete={(): void => onDelete(i + 1)}
          />
        )
      )}
      <RouteSegment
        length={totalLength}
        duration={totalDuration}
        fuel={totalFuel}
      />
    </List>
  )
}

export default RouteList
