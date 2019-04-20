import React, {
  FunctionComponent,
  PureComponent,
  ReactElement,
  ReactNode,
} from 'react'
import Avatar from '@material-ui/core/Avatar'
import Drawer from '@material-ui/core/Drawer'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import { createStyles, withStyles, Theme } from '@material-ui/core/styles'
import DeleteIcon from '@material-ui/icons/Delete'
import { LngLat } from 'mapbox-gl'
import { toNM, numToLetter } from '../../common/util'

const drawerWidth = 240
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const styles = (theme: Theme) =>
  createStyles({
    drawer: {
      width: drawerWidth,
    },
    drawerPaper: {
      width: drawerWidth,
    },
  })
/* eslint-enable */

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

interface RouteDrawerProps {
  points: LngLat[]
  lengths: number[]
  classes: {
    drawer: string
    drawerPaper: string
  }
  onDelete: (i: number) => void
}

class RouteDrawer extends PureComponent<RouteDrawerProps> {
  render(): ReactNode {
    const { points, lengths, classes, onDelete } = this.props
    const segments = []
    let totalLength = 0
    for (let i = 0; i < lengths.length; i += 1) {
      segments.push({
        point: points[i + 1],
        length: lengths[i],
      })
      totalLength += lengths[i]
    }
    return (
      <Drawer
        variant="permanent"
        anchor="left"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
      >
        <List>
          {points.length > 0 && (
            <ListItem>
              <Point text="A" />
              <Delete onClick={(): void => onDelete(0)} />
            </ListItem>
          )}
          {segments.map(
            ({ length }, i): ReactNode => (
              <ListItem>
                <Point text={numToLetter(i + 1)} />
                <ListItemText primary={`${toNM(length)} mpk`} />
                <Delete onClick={(): void => onDelete(i + 1)} />
              </ListItem>
            )
          )}
          <ListItem>
            <Point text="=" />
            <ListItemText primary={`${toNM(totalLength)} mpk`} />
          </ListItem>
        </List>
      </Drawer>
    )
  }
}

export default withStyles(styles)(RouteDrawer)
