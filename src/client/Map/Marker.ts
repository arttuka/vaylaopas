import blue from '@material-ui/core/colors/blue'
import mapboxgl, { LngLat } from 'mapbox-gl'
import { numToLetter } from '../../common/util'

const createMarker = (i: number): mapboxgl.Marker => {
  const element = document.createElement('div')
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttributeNS(null, 'stroke', 'none')
  svg.setAttributeNS(null, 'height', '48px')
  svg.setAttributeNS(null, 'width', '32px')
  svg.setAttributeNS(null, 'viewBox', '0 0 32 48')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttributeNS(
    null,
    'd',
    'm15.998888,47.721162c0,0.008747 0.017495,0.026242 0.017495,0.026242s15.325378,-23.530404 15.325378,-31.263072c0,-11.380318 -7.767658,-16.331325 -15.342873,-16.34882c-7.575216,0.017495 -15.342873,4.968502 -15.342873,16.34882c0,7.732668 15.334126,31.263072 15.334126,31.263072s0.008747,-0.026242 0.008747,-0.026242z'
  )
  path.setAttributeNS(null, 'fill', blue[500])
  svg.appendChild(path)
  const label = document.createElement('label')
  label.appendChild(document.createTextNode(numToLetter(i)))
  element.appendChild(label)
  element.appendChild(svg)

  const marker = new mapboxgl.Marker({
    element,
    offset: [0, -20],
  })
  return marker
}

class Marker {
  i: number
  marker: mapboxgl.Marker
  movePoint: (i: number, point: LngLat) => void
  constructor(
    i: number,
    point: LngLat,
    movePoint: (i: number, point: LngLat) => void
  ) {
    this.i = i
    this.movePoint = movePoint
    this.onDragEnd = this.onDragEnd.bind(this)
    this.marker = createMarker(i)
      .setLngLat(point)
      .setDraggable(true)
    this.marker.on('dragend', this.onDragEnd)
  }

  onDragEnd(): void {
    this.movePoint(this.i, this.marker.getLngLat())
  }

  updateNumber(i: number): void {
    this.i = i
    const label = this.marker.getElement().firstChild
    if (label) {
      label.textContent = numToLetter(i)
    }
  }

  addTo(map: mapboxgl.Map): this {
    this.marker.addTo(map)
    return this
  }

  remove(): void {
    this.marker.remove()
  }
}

export default Marker

export const updateMarkers = (markers: Marker[]): void => {
  markers.forEach(
    (marker, i): void => {
      marker.updateNumber(i)
    }
  )
}
