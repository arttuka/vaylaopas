import React, { FC, ReactElement, useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useShallow } from 'zustand/react/shallow'
import List from '@mui/material/List'
import { styled } from '@mui/material/styles'
import { RouteSegment, SortableRouteSegment } from './RouteSegment'
import { useStore } from '../store/store'
import {
  combineSegments,
  hasProperty,
  mergeRoutes,
  numToLetter,
} from '../../common/util'

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

type Active = {
  id: string
  letter: string
}

const RouteList: FC<RouteListProps> = ({ onClick }) => {
  const { routes, waypoints, editWaypoints } = useStore(
    useShallow((state) => ({
      routes: state.routes,
      waypoints: state.waypoints,
      editWaypoints: state.editWaypoints,
    }))
  )
  const [destinations, setDestinations] = useState(
    waypoints.filter(hasProperty('type', 'destination'))
  )
  useEffect(() => {
    setDestinations(waypoints.filter(hasProperty('type', 'destination')))
  }, [waypoints])
  const [active, setActive] = useState<Active | null>(null)
  const combinedRoutes = combineSegments(routes)
  const totals = mergeRoutes(combinedRoutes)

  const onDelete = (id: string): void => {
    editWaypoints({
      type: 'remove',
      id,
    })
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const from = destinations.findIndex((w) => w.id === active.id)
    const to = destinations.findIndex((w) => w.id === over?.id)
    if (from >= 0 && to >= 0 && from !== to) {
      setDestinations((dests) => arrayMove(dests, from, to))
      editWaypoints({ type: 'reorder', from, to })
    }
    setActive(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActive({
      id: event.active.id as string,
      letter: numToLetter(event.active.data.current?.sortable.index || 0),
    })
  }

  const handleDragCancel = () => {
    setActive(null)
  }

  return (
    <OuterList disablePadding={true}>
      <RouteSegment id="totals" {...totals} kind="totals" onClick={onClick} />
      <ScrollingList disablePadding={true}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={destinations}
            strategy={verticalListSortingStrategy}
          >
            {destinations.map(({ id, letter = '' }, i): ReactElement => {
              const props = i > 0 ? combinedRoutes[i - 1] : { found: true }
              return (
                <SortableRouteSegment
                  id={id}
                  key={id}
                  letter={letter}
                  onDelete={(): void => onDelete(id)}
                  {...props}
                />
              )
            })}
          </SortableContext>
          <DragOverlay>
            {active ? (
              <RouteSegment id={active.id} letter={active.letter} found />
            ) : null}
          </DragOverlay>
        </DndContext>
      </ScrollingList>
    </OuterList>
  )
}

export default RouteList
