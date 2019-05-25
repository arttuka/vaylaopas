import React, {
  FunctionComponent,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react'
import blue from '@material-ui/core/colors/blue'
import Avatar from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import { createStyles, withStyles } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import { Route } from '../../common/types'
import { toNM, numToLetter } from '../../common/util'

const styles = createStyles({
  avatar: {
    color: '#ffffff',
    backgroundColor: blue[500],
    fontWeight: 'bold',
  },
})

interface PointProps {
  text: string
  className: string
}

const Point: FunctionComponent<PointProps> = ({
  text,
  className,
}: PointProps): ReactElement => (
  <ListItemAvatar>
    <Avatar className={className}>{text}</Avatar>
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

interface RouteDrawerProps {
  routes: Route[]
  classes: {
    avatar: string
  }
  onDelete: (index: number) => void
}

class RouteList extends PureComponent<RouteDrawerProps> {
  render(): ReactNode {
    const { routes, classes, onDelete } = this.props
    const totalLength = routes.reduce(
      (sum, { length }): number => sum + length,
      0
    )
    return (
      <List>
        {routes.length > 0 && (
          <ListItem>
            <Point className={classes.avatar} text="A" />
            <Delete onClick={(): void => onDelete(0)} />
          </ListItem>
        )}
        {routes.map(
          ({ length }, i): ReactNode => (
            <ListItem key={`route-segment-${i}`}>
              <Point className={classes.avatar} text={numToLetter(i + 1)} />
              <ListItemText primary={`${toNM(length)} mpk`} />
              <Delete onClick={(): void => onDelete(i + 1)} />
            </ListItem>
          )
        )}
        <ListItem>
          <Point className={classes.avatar} text="=" />
          <ListItemText primary={`${toNM(totalLength)} mpk`} />
        </ListItem>
      </List>
    )
  }
}

export default withStyles(styles)(RouteList)
