import { FC, JSX, forwardRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { formatDuration, toNM, round } from '../../common/util'

const Avatar = styled(MuiAvatar)(({ theme: { palette } }) => ({
  color: '#ffffff',
  backgroundColor: palette.primary.main,
  fontWeight: 'bold',
}))

const Point = forwardRef<HTMLElement, { text: string }>(function Point(
  { text, ...props },
  ref
) {
  return (
    <ListItemAvatar ref={ref} {...props}>
      <Avatar>{text}</Avatar>
    </ListItemAvatar>
  )
})

const Delete: FC<{ onClick: () => void }> = ({ onClick }) => (
  <ListItemSecondaryAction>
    <IconButton onClick={onClick}>
      <DeleteIcon />
    </IconButton>
  </ListItemSecondaryAction>
)

const ListItemText = styled(MuiListItemText)({ margin: 0 })

const OffsetListItemText = styled(MuiListItemText)({
  margin: 0,
  position: 'relative',
  top: -24,
})

const NotFoundIcon = styled(WarningIcon)({ verticalAlign: 'top' })

type SegmentProps = {
  length?: number
  duration?: number
  fuel?: number
  letter: string
  found: boolean
  onDelete?: () => void
  id: string
  kind?: 'segment'
}

type TotalsProps = {
  length?: number
  duration?: number
  fuel?: number
  found: boolean
  id: string
  kind: 'totals'
}

type RouteSegmentProps = (SegmentProps | TotalsProps) & {
  onClick?: () => void
  dragHandle?: JSX.Element
}

export const RouteSegment: FC<RouteSegmentProps> = (props) => {
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
    const { letter = '', onDelete, dragHandle } = props
    return (
      <ListItem>
        {dragHandle || <Point text={letter} />}
        <OffsetListItemText {...listItemTextProps} />
        {onDelete && <Delete onClick={onDelete} />}
      </ListItem>
    )
  }
}

export const SortableRouteSegment: FC<RouteSegmentProps> = (props) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <RouteSegment
        {...props}
        dragHandle={
          props.kind !== 'totals' ? (
            <Point
              text={props.letter}
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
            />
          ) : undefined
        }
      />
    </div>
  )
}
