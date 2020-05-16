import React, { Component, ReactElement } from 'react'
import axios from 'axios'
import { LngLat } from 'mapbox-gl'
import AppBar from './Appbar/Appbar'
import Map from './Map/Map'
import Sidebar from './Sidebar/Sidebar'
import RouteList from './Sidebar/RouteList'
import SettingsContainer from './Sidebar/SettingsContainer'
import { Route, Settings } from '../common/types'
import {
  removeIndex,
  replaceIndex,
  insertIndex,
  calculateDuration,
} from '../common/util'

/* eslint-disable @typescript-eslint/explicit-function-return-type */

const enrichRoutes = (routes: Route[], settings: Settings): Route[] => {
  const { speed, consumption } = settings
  return routes.map(
    (route): Route => {
      const duration = speed && calculateDuration(route.length, speed)
      const fuel = duration && consumption && (duration * consumption) / 60
      return {
        ...route,
        duration,
        fuel,
      }
    }
  )
}

const fetchRoutes = async (
  waypoints: LngLat[],
  settings: Settings
): Promise<Route[]> => {
  if (waypoints.length > 1) {
    const routes: Route[] = (
      await axios.post('/api/route', {
        points: waypoints,
        depth: settings.depth,
        height: settings.height,
      })
    ).data
    return enrichRoutes(routes, settings)
  }
  return []
}

const getStoredSetting = (key: keyof Settings): number | undefined => {
  const value = localStorage.getItem(key)
  return value ? parseFloat(value) : undefined
}

interface AppState {
  waypoints: LngLat[]
  routes: Route[]
  settings: Settings
  sidebarOpen: boolean
}

export default class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      waypoints: [],
      routes: [],
      settings: {
        height: getStoredSetting('height'),
        depth: getStoredSetting('depth'),
        speed: getStoredSetting('speed'),
        consumption: getStoredSetting('consumption'),
      },
      sidebarOpen: false,
    }
    this.addWaypoint = this.addWaypoint.bind(this)
    this.deleteWaypoint = this.deleteWaypoint.bind(this)
    this.moveWaypoint = this.moveWaypoint.bind(this)
    this.updateSetting = this.updateSetting.bind(this)
    this.openSidebar = this.openSidebar.bind(this)
    this.closeSidebar = this.closeSidebar.bind(this)
  }

  addWaypoint(point: LngLat, index?: number): void {
    this.setState(
      ({ waypoints }) => ({
        waypoints: insertIndex(
          waypoints,
          index !== undefined ? index : waypoints.length,
          point
        ),
      }),
      this.updateRoutes
    )
  }

  deleteWaypoint(index: number): void {
    this.setState(
      ({ waypoints }) => ({
        waypoints: removeIndex(waypoints, index),
      }),
      this.updateRoutes
    )
  }

  moveWaypoint(point: LngLat, index: number): void {
    this.setState(
      ({ waypoints }) => ({
        waypoints: replaceIndex(waypoints, index, point),
      }),
      this.updateRoutes
    )
  }

  async updateRoutes(): Promise<void> {
    const { settings, waypoints } = this.state
    this.setState({ routes: await fetchRoutes(waypoints, settings) })
  }

  openSidebar(): void {
    this.setState({ sidebarOpen: true })
  }

  closeSidebar(): void {
    this.setState({ sidebarOpen: false })
  }

  updateSetting(key: keyof Settings, value?: number): void {
    if (['depth', 'height'].includes(key)) {
      this.setState(
        ({ settings }) => ({
          settings: { ...settings, [key]: value },
        }),
        this.updateRoutes
      )
    } else {
      this.setState(({ routes, settings }) => {
        const newSettings = { ...settings, [key]: value }
        return {
          settings: newSettings,
          routes: enrichRoutes(routes, newSettings),
        }
      })
    }
    if (value !== undefined) {
      localStorage.setItem(key, value.toString())
    } else {
      localStorage.removeItem(key)
    }
  }

  render(): ReactElement {
    const { settings, routes, waypoints } = this.state
    return (
      <div>
        <AppBar openSidebar={this.openSidebar} />
        <Sidebar
          open={this.state.sidebarOpen}
          onOpen={this.openSidebar}
          onClose={this.closeSidebar}
        >
          <RouteList
            onDelete={this.deleteWaypoint}
            routes={routes}
            waypoints={waypoints}
          />
          <SettingsContainer
            settings={settings}
            updateSetting={this.updateSetting}
          />
        </Sidebar>
        <Map
          routes={routes}
          waypoints={waypoints}
          onAddWaypoint={this.addWaypoint}
          onMoveWaypoint={this.moveWaypoint}
        />
      </div>
    )
  }
}
