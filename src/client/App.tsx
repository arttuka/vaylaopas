import React, { Component, ReactElement } from 'react'
import { connect } from 'react-redux'
import AppBar from './Appbar/Appbar'
import Map from './Map/Map'
import Sidebar from './Sidebar/Sidebar'
import RouteList from './Sidebar/RouteList'
import SettingsContainer from './Sidebar/SettingsContainer'
import {
  waypointAddAction,
  waypointRemoveAction,
  waypointMoveAction,
  settingsSetAction,
} from './redux/actions'
import { LngLat, Route, Settings, RootState } from '../common/types'

interface AppState {
  sidebarOpen: boolean
}

interface ReduxAppProps {
  waypoints: LngLat[]
  routes: Route[]
  settings: Settings
}

interface AppProps extends ReduxAppProps {
  dispatch: Function
}

class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
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
    const { dispatch } = this.props
    dispatch(waypointAddAction({ point, index }))
  }

  deleteWaypoint(index: number): void {
    const { dispatch } = this.props
    dispatch(waypointRemoveAction({ index }))
  }

  moveWaypoint(point: LngLat, index: number): void {
    const { dispatch } = this.props
    dispatch(waypointMoveAction({ point, index }))
  }

  openSidebar(): void {
    this.setState({ sidebarOpen: true })
  }

  closeSidebar(): void {
    this.setState({ sidebarOpen: false })
  }

  updateSetting(key: keyof Settings, value?: number): void {
    const { dispatch } = this.props
    dispatch(settingsSetAction({ key, value }))
  }

  render(): ReactElement {
    const { settings, routes, waypoints } = this.props
    return (
      <>
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
      </>
    )
  }
}

const mapStateToProps = ({
  waypoints,
  routes,
  settings,
}: RootState): ReduxAppProps => ({
  waypoints,
  routes,
  settings,
})

const connectedApp = connect(mapStateToProps)(App)

export default connectedApp
