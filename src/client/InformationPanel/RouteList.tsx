import React, { FunctionComponent, ReactElement } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import List from '@material-ui/core/List'
import { withStyles } from '@material-ui/core/styles'
import RouteSegment from './RouteSegment'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import { Route } from '../../common/types'
import { add, combineSegments } from '../../common/util'
import { waypointRemoveAction } from '../redux/actions'

interface Totals {
  totalDuration?: number
  totalFuel?: number
  totalLength?: number
}

const calculateTotals = (routes: Route[]): Totals =>
  routes.reduce<Totals>(
    (
      { totalDuration, totalFuel, totalLength },
      { duration, fuel, length }
    ) => ({
      totalDuration: add(duration, totalDuration),
      totalFuel: add(fuel, totalFuel),
      totalLength: add(length, totalLength),
    }),
    { totalDuration: 0, totalFuel: 0, totalLength: 0 }
  )

const OuterList = withStyles({
  root: {
    height: '100%',
  },
})(List)

const ScrollingList = withStyles({
  root: {
    overflow: 'auto',
    height: 'calc(100% - 61px)',
  },
})(List)

interface RouteListProps {
  onClick?: () => void
}

const RouteList: FunctionComponent<RouteListProps> = ({
  onClick,
}: RouteListProps) => {
  const dispatch = useDispatch()
  const routes = useSelector(routesSelector)
  const waypoints = useSelector(waypointsSelector)
  const destinations = waypoints.filter(({ type }) => type === 'destination')
  const combinedRoutes = combineSegments(routes)
  const { totalDuration, totalFuel, totalLength } = calculateTotals(routes)

  const onDelete = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
  }

  return (
    <OuterList disablePadding={true}>
      <RouteSegment
        length={totalLength}
        duration={totalDuration}
        fuel={totalFuel}
        kind="totals"
        onClick={onClick}
      />
      <ScrollingList disablePadding={true}>
        {destinations.map(
          ({ id }, i): ReactElement => {
            const key = `route-segment-${i}`
            if (i > 0 && i <= combinedRoutes.length) {
              const { length, duration, fuel, found } = combinedRoutes[i - 1]
              return (
                <RouteSegment
                  key={key}
                  length={length}
                  duration={duration}
                  fuel={fuel}
                  index={i}
                  found={found}
                  onDelete={(): void => onDelete(id)}
                />
              )
            } else {
              return (
                <RouteSegment
                  key={key}
                  index={i}
                  found
                  onDelete={(): void => onDelete(id)}
                />
              )
            }
          }
        )}
      </ScrollingList>
    </OuterList>
  )
}

export default RouteList
