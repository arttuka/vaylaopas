import React, { FC, ReactElement } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import List from '@mui/material/List'
import { styled } from '@mui/material/styles'
import RouteSegment from './RouteSegment'
import { routesSelector, waypointsSelector } from '../redux/selectors'
import { combineSegments, hasProperty, mergeRoutes } from '../../common/util'
import { waypointRemoveAction } from '../redux/actions'

const OuterList = styled(List)({
  height: '100%',
})

const ScrollingList = styled(List)({
  overflow: 'auto',
  height: 'calc(100% - 61px)',
})

type RouteListProps = {
  onClick?: () => void
}

const RouteList: FC<RouteListProps> = ({ onClick }) => {
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
        {destinations.map(({ id }, i): ReactElement => {
          const props = i > 0 ? combinedRoutes[i - 1] : { found: true }
          return (
            <RouteSegment
              key={`route-segment-${i}`}
              index={i}
              onDelete={(): void => onDelete(id)}
              {...props}
            />
          )
        })}
      </ScrollingList>
    </OuterList>
  )
}

export default RouteList
