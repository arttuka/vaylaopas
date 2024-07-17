import React, { FC, ReactElement } from 'react'
import { useShallow } from 'zustand/react/shallow'
import List from '@mui/material/List'
import { styled } from '@mui/material/styles'
import RouteSegment from './RouteSegment'
import { useStore } from '../store/store'
import { combineSegments, hasProperty, mergeRoutes } from '../../common/util'

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
  const { routes, waypoints, editWaypoints } = useStore(
    useShallow((state) => ({
      routes: state.routes,
      waypoints: state.waypoints,
      editWaypoints: state.editWaypoints,
    }))
  )
  const destinations = waypoints.filter(hasProperty('type', 'destination'))
  const combinedRoutes = combineSegments(routes)
  const totals = mergeRoutes(combinedRoutes)

  const onDelete = (id: string): void => {
    editWaypoints({
      type: 'remove',
      id,
    })
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
