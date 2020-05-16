import React, {
  ComponentType,
  PureComponent,
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
import MuiListItemText, {
  ListItemTextProps,
} from '@material-ui/core/ListItemText'
import { withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import DirectionsBoatIcon from '@material-ui/icons/DirectionsBoat'
import { LngLat } from 'mapbox-gl'
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

const ListItemText: ComponentType<ListItemTextProps> = withStyles({
  root: {
    margin: 0,
  },
})(MuiListItemText)

const OffsetListItemText: ComponentType<ListItemTextProps> = withStyles({
  root: {
    margin: 0,
    position: 'relative',
    top: -24,
  },
})(MuiListItemText)

interface SegmentProps {
  length: number
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
    ): Totals => ({
      totalDuration: add(duration, totalDuration),
      totalFuel: add(fuel, totalFuel),
      totalLength: totalLength + length,
    }),
    { totalDuration: 0, totalFuel: 0, totalLength: 0 }
  )

interface RouteListProps {
  routes: Route[]
  waypoints: LngLat[]
  onDelete: (index: number) => void
}

export default class RouteList extends PureComponent<RouteListProps> {
  render(): ReactElement | null {
    const { routes, waypoints, onDelete } = this.props
    const { totalDuration, totalFuel, totalLength } = calculateTotals(routes)
    return waypoints.length > 0 ? (
      <List disablePadding={true}>
        <RouteSegment
          length={totalLength}
          duration={totalDuration}
          fuel={totalFuel}
          kind="totals"
        />
        <ListItem>
          <Point text="A" />
          <Delete onClick={(): void => onDelete(0)} />
        </ListItem>
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
      </List>
    ) : null
  }
}
