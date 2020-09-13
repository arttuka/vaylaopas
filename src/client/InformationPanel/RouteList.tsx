import React, { FunctionComponent, ReactElement } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import List from '@material-ui/core/List'
import { withStyles } from '@material-ui/core/styles'
import RouteSegment from './RouteSegment'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import { combineSegments, hasProperty, mergeRoutes } from '../../common/util'
import { waypointRemoveAction } from '../redux/actions'

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
  const destinations = waypoints.filter(hasProperty('type', 'destination'))
  const combinedRoutes = combineSegments(routes)
  const totals = mergeRoutes(combinedRoutes)

  const onDelete = (id: string): void => {
    dispatch(waypointRemoveAction({ id }))
  }

  return (
    <OuterList disablePadding={true}>
      <RouteSegment {...totals} kind="totals" onClick={onClick} />
      <ScrollingList disablePadding={true}>
        {destinations.map(
          ({ id }, i): ReactElement => {
            const props = i > 0 ? combinedRoutes[i - 1] : { found: true }
            return (
              <RouteSegment
                key={`route-segment-${i}`}
                index={i}
                onDelete={(): void => onDelete(id)}
                {...props}
              />
            )
          }
        )}
      </ScrollingList>
    </OuterList>
  )
}

export default RouteList
