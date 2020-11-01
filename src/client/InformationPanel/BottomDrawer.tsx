import React, { FunctionComponent, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import Button from '@material-ui/core/Button'
import Drawer from '@material-ui/core/Drawer'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp'
import RouteList from './RouteList'
import { waypointsSelector } from '../redux/selectors'
import { hasProperty } from '../../common/util'

const openHeight = ({ items }: { items: number }): number => 62 + items * 60

const useStyles = makeStyles(({ transitions }) => ({
  drawer: {
    position: 'relative',
    height: 62,
  },
  drawerOpen: {
    height: openHeight,
    transition: transitions.create('height', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: transitions.create('height', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),
  },
  paper: {
    overflowY: 'visible',
    height: 62,
  },
}))

const DrawerButton = withStyles(({ palette, spacing }) => ({
  root: {
    backgroundColor: '#ffffff',
    color: palette.text.primary,
    padding: spacing(0, 1),
    width: 48,
    alignSelf: 'center',
    position: 'absolute',
    top: -24,
    left: '50%',
    transform: 'translate(-50%, 0)',
    boxShadow: 'none',
    borderColor: palette.divider,
    borderWidth: '1px 1px 0 1px',
    borderStyle: 'solid',
    borderRadius: '8px 8px 0 0',
    '&:active': {
      backgroundColor: '#ffffff',
      boxShadow: 'none',
    },
    '&:hover': {
      backgroundColor: '#ffffff',
      boxShadow: 'none',
    },
  },
}))(Button)

const BottomDrawer: FunctionComponent = () => {
  const waypoints = useSelector(waypointsSelector)
  const items = Math.min(
    waypoints.filter(hasProperty('type', 'destination')).length,
    4
  )
  const classes = useStyles({ items })
  const [open, setOpen] = useState(false)
  const onClick = () => setOpen(!open)

  useEffect(() => {
    if (items === 0 && open) {
      setOpen(false)
    }
  }, [items, open])

  return (
    <Drawer
      variant="permanent"
      anchor="bottom"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open,
      })}
      classes={{
        paper: clsx(classes.paper, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        }),
      }}
    >
      {items > 0 && (
        <DrawerButton onClick={onClick} variant="contained" size="small">
          {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
        </DrawerButton>
      )}
      <RouteList onClick={items > 0 ? onClick : undefined} />
    </Drawer>
  )
}

export default BottomDrawer
