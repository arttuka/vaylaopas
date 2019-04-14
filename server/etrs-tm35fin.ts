import { Position } from 'geojson'
import { Coordinate } from '../common/lane'

// https://www.maanmittauslaitos.fi/sites/maanmittauslaitos.fi/files/fgi/GLtiedote30.pdf

const degToRad = (deg: number): number => deg * Math.PI / 180
const radToDeg = (rad: number): number => (rad * 180 / Math.PI)

const a = 6378137
const f = 1/298.257222101
const k0 = 0.9996
const l0 = degToRad(27)
const E0 = 500000
const n = f / (2 - f)
const A1 = (a / (1 + n)) * (1 + Math.pow(n, 2) / 4 + Math.pow(n, 4) / 64)
const e = Math.sqrt(2 * f - Math.pow(f, 2))
const h1 = n / 2 - 2 / 3 * Math.pow(n, 2) + 37 / 96 * Math.pow(n, 3) - Math.pow(n, 4) / 360
const h2 = Math.pow(n, 2) / 48 + Math.pow(n, 3) / 15 - 437 / 1440 * Math.pow(n, 4)
const h3 = 17 / 480 * Math.pow(n, 3) - 37 / 840 * Math.pow(n, 4)
const h4 = 4397 / 161280 * Math.pow(n, 4)

const toWgs84 = (coords: Position): Coordinate => {
  const [E, N] = coords
  const xi = N / (A1 * k0)
  const eta = (E - E0) / (A1 * k0)
  const xi1p = h1 * Math.sin(2 * xi) * Math.cosh(2 * eta)
  const xi2p = h2 * Math.sin(4 * xi) * Math.cosh(4 * eta)
  const xi3p = h3 * Math.sin(6 * xi) * Math.cosh(6 * eta)
  const xi4p = h4 * Math.sin(8 * xi) * Math.cosh(8 * eta)
  const eta1p = h1 * Math.cos(2 * xi) * Math.sinh(2 * eta)
  const eta2p = h2 * Math.cos(4 * xi) * Math.sinh(4 * eta)
  const eta3p = h3 * Math.cos(6 * xi) * Math.sinh(6 * eta)
  const eta4p = h4 * Math.cos(8 * xi) * Math.sinh(8 * eta)
  const xip = xi - (xi1p + xi2p + xi3p + xi4p)
  const etap = eta - (eta1p + eta2p + eta3p + eta4p)
  const beta = Math.asin(Math.sin(xip) / Math.cosh(etap))
  const l = Math.asin(Math.tanh(etap) / Math.cos(beta))
  const Q = Math.asinh(Math.tan(beta))
  let Qp = Q + e * Math.atanh(e * Math.tanh(Q))
  Qp = Q + e * Math.atanh(e * Math.tanh(Qp))
  Qp = Q + e * Math.atanh(e * Math.tanh(Qp))
  Qp = Q + e * Math.atanh(e * Math.tanh(Qp))
  const lat = Math.atan(Math.sinh(Qp))
  const lon = l0 + l
  return {
    x: radToDeg(lon),
    y: radToDeg(lat)
  }
}

export default toWgs84
