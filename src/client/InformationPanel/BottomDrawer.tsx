import React, { FC, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'
import Button from '@mui/material/Button'
import { default as MuiDrawer } from '@mui/material/Drawer'
import { styled } from '@mui/material/styles'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import RouteList from './RouteList'
import { waypointsSelector } from '../redux/selectors'
import { hasProperty } from '../../common/util'

const openHeight = (items: number): number => 62 + items * 60

const openDrawer = 'bottomDrawer-open'
const closedDrawer = 'bottomDrawer-closed'

const Drawer = styled(MuiDrawer)(({ theme: { transitions } }) => {
  const openStyle = {
    transition: transitions.create('height', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.enteringScreen,
    }),
  }
  const closedStyle = {
    transition: transitions.create('height', {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),
  }
  return {
    position: 'relative',
    height: 62,
    [`&.${openDrawer}`]: openStyle,
    [`&.${closedDrawer}`]: closedStyle,
    '& .MuiDrawer-paper': {
      overflowY: 'visible',
      height: 62,
      [`&.${openDrawer}`]: openStyle,
      [`&.${closedDrawer}`]: closedStyle,
    },
  }
})

const DrawerButton = styled(Button)(({ theme: { palette, spacing } }) => ({
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
}))

const BottomDrawer: FC = () => {
  const waypoints = useSelector(waypointsSelector)
  const items = Math.min(
    waypoints.filter(hasProperty('type', 'destination')).length,
    4
  )
  const [open, setOpen] = useState(false)
  const onClick = () => setOpen(!open)

  useEffect(() => {
    if (items === 0 && open) {
      setOpen(false)
    }
  }, [items, open])

  const className = clsx({
    [openDrawer]: open,
    [closedDrawer]: !open,
  })
  const height = open ? openHeight(items) : undefined

  return (
    <Drawer
      variant="permanent"
      anchor="bottom"
      data-items={items}
      classes={{
        root: className,
        paper: className,
      }}
      sx={{
        display: { xs: 'block', sm: 'none' },
        height,
        '& .MuiDrawer-paper': {
          height,
        },
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
