import React, {
  FunctionComponent,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MuiAvatar from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import MuiListItemText from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import DirectionsBoatIcon from '@material-ui/icons/DirectionsBoat'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import { Route } from '../../common/types'
import {
  add,
  combineSegments,
  formatDuration,
  toNM,
  numToLetter,
  round,
} from '../../common/util'
import { waypointRemoveAction } from '../redux/actions'

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

interface SegmentProps {
  length?: number
  duration?: number
  fuel?: number
  index: number
  onDelete: () => void
  kind?: 'segment'
}

interface TotalsProps {
  length: number
  duration?: number
  fuel?: number
  kind: 'totals'
}

type RouteSegmentProps = SegmentProps | TotalsProps

class RouteSegment extends PureComponent<RouteSegmentProps> {
  render(): ReactElement {
    const { length, duration, fuel } = this.props
    const durationStr = duration ? formatDuration(duration) : ''
    const fuelStr = fuel ? `, ${round(fuel, 1)} l` : ''
    const listItemTextProps = {
      primary: length ? `${toNM(length)} mpk` : '\u00a0',
      secondary: durationStr + fuelStr || '\u00a0',
    }
    if (this.props.kind === 'totals') {
      return (
        <ListItem divider={true}>
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
    ) => ({
      totalDuration: add(duration, totalDuration),
      totalFuel: add(fuel, totalFuel),
      totalLength: totalLength + length,
    }),
    { totalDuration: 0, totalFuel: 0, totalLength: 0 }
  )

const RouteList: FunctionComponent = () => {
  const dispatch = useDispatch()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const destinations = waypoints.filter(({ type }) => type === 'destination')
  const combinedRoutes = combineSegments(routes)
  const { totalDuration, totalFuel, totalLength } = calculateTotals(routes)

  const onDelete = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
  }

  return waypoints.length > 0 ? (
    <List disablePadding={true}>
      <RouteSegment
        length={totalLength}
        duration={totalDuration}
        fuel={totalFuel}
        kind="totals"
      />
      {destinations.map(
        ({ id }, i): ReactNode => {
          const key = `route-segment-${i}`
          if (i > 0 && i <= combinedRoutes.length) {
            const { length, duration, fuel } = combinedRoutes[i - 1]
            return (
              <RouteSegment
                key={key}
                length={length}
                duration={duration}
                fuel={fuel}
                index={i}
                onDelete={(): void => onDelete(id)}
              />
            )
          } else {
            return (
              <RouteSegment
                key={key}
                index={i}
                onDelete={(): void => onDelete(id)}
              />
            )
          }
        }
      )}
    </List>
  ) : null
}

export default RouteList
