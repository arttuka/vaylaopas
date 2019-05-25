import React, { Component } from 'react'
import axios from 'axios'
import { LngLat } from 'mapbox-gl'
import styled from 'styled-components'
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

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
`

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

interface AppState {
  waypoints: LngLat[]
  routes: Route[]
  settings: Settings
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      waypoints: [],
      routes: [],
      settings: {},
    }
    this.addWaypoint = this.addWaypoint.bind(this)
    this.deleteWaypoint = this.deleteWaypoint.bind(this)
    this.moveWaypoint = this.moveWaypoint.bind(this)
    this.updateSetting = this.updateSetting.bind(this)
  }

  addWaypoint(point: LngLat, i?: number): void {
    const index = i !== undefined ? i : this.state.waypoints.length
    this.setState(
      state => ({
        waypoints: insertIndex(state.waypoints, index, point),
      }),
      this.fetchRoute
    )
  }

  deleteWaypoint(index: number): void {
    this.setState(
      state => ({
        waypoints: removeIndex(state.waypoints, index),
      }),
      this.fetchRoute
    )
  }

  moveWaypoint(point: LngLat, index: number): void {
    this.setState(
      state => ({
        waypoints: replaceIndex(state.waypoints, index, point),
      }),
      this.fetchRoute
    )
  }

  async fetchRoute(): Promise<void> {
    const {
      settings: { depth, height },
      waypoints,
    } = this.state
    if (waypoints.length > 1) {
      const routes: Route[] = (await axios.post('/api/route', {
        points: waypoints,
        depth,
        height,
      })).data
      this.setState(({ settings }) => ({
        routes: enrichRoutes(routes, settings),
      }))
    } else {
      this.setState({ routes: [] })
    }
  }

  updateSetting(key: keyof Settings, value?: number): void {
    if (['depth', 'height'].includes(key)) {
      this.setState(
        ({ settings }) => ({
          settings: { ...settings, [key]: value },
        }),
        this.fetchRoute
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
  }

  render(): React.ReactElement {
    const { settings, routes, waypoints } = this.state
    return (
      <Container>
        <Sidebar>
          <SettingsContainer
            settings={settings}
            updateSetting={this.updateSetting}
          />
          <RouteList onDelete={this.deleteWaypoint} routes={routes} />
        </Sidebar>
        <Map
          routes={routes}
          waypoints={waypoints}
          onAddWaypoint={this.addWaypoint}
          onMoveWaypoint={this.moveWaypoint}
        />
      </Container>
    )
  }
}

export default App
