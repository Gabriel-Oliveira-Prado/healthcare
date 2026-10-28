import { useEffect, useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Category = 'health' | 'pharmacy' | 'hospital'
type Filter = 'all' | Category
type Place = { id: string, name: string, lat: number, lon: number, category: Category }
type OsmElement = { type: string, id: number, lat?: number, lon?: number, center?: { lat: number, lon: number }, tags?: Record<string, string> }

const initialCenter: LatLngTuple = [-3.7305, -38.5218]
const categories: { key: Filter, label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'health', label: 'Unidades de saúde' },
  { key: 'pharmacy', label: 'Farmácias' },
  { key: 'hospital', label: 'Hospitais' },
]

function categoryOf(tags: Record<string, string>): Category {
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'hospital'
  if (tags.amenity === 'pharmacy' || tags.healthcare === 'pharmacy') return 'pharmacy'
  return 'health'
}

function categoryLabel(category: Category) {
  return category === 'hospital' ? 'Hospital' : category === 'pharmacy' ? 'Farmácia' : 'Unidade de saúde'
}

function colorOf(category: Category) {
  return category === 'hospital' ? '#638bb0' : category === 'pharmacy' ? '#df8260' : '#3f9477'
}

function MapWatcher({ onMove }: { onMove: (center: LatLngTuple) => void }) {
  useMapEvents({ moveend(event) { const center = event.target.getCenter(); onMove([center.lat, center.lng]) } })
  return null
}

function FocusPlace({ place }: { place: Place | null }) {
  const map = useMap()
  useEffect(() => { if (place) map.flyTo([place.lat, place.lon], 15) }, [map, place])
  return null
}

export default function Units() {
  const [viewCenter, setViewCenter] = useState<LatLngTuple>(initialCenter)
  const [searchCenter, setSearchCenter] = useState<LatLngTuple>(initialCenter)
  const [requestId, setRequestId] = useState(0)
  const [places, setPlaces] = useState<Place[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let disposed = false
    let activeController: AbortController | null = null
    const [lat, lon] = searchCenter
    const query = `[out:json][timeout:20];(nwr["amenity"~"^(hospital|pharmacy|clinic|doctors)$"](around:4000,${lat},${lon});nwr["healthcare"~"^(hospital|clinic|doctor|pharmacy)$"](around:4000,${lat},${lon}););out center 80;`
    setLoading(true)
    setError(false)
    setPlaces([])
    setSelectedPlace(null)

    async function loadPlaces() {
      let data: { elements: OsmElement[] } | null = null
      for (const endpoint of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
        const controller = new AbortController()
        activeController = controller
        const timeout = window.setTimeout(() => controller.abort(), 12000)
        try {
          const response = await fetch(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }), signal: controller.signal })
          if (!response.ok) throw new Error(`Overpass: ${response.status}`)
          data = await response.json() as { elements: OsmElement[] }
          window.clearTimeout(timeout)
          break
        } catch {
          window.clearTimeout(timeout)
          if (disposed) return
        }
      }
      if (disposed) return
      if (!data) { setError(true); setLoading(false); return }
      const unique = new Map<string, Place>()
      for (const element of data.elements) {
        const name = element.tags?.name || element.tags?.['name:pt']
        const latitude = element.lat ?? element.center?.lat
        const longitude = element.lon ?? element.center?.lon
        if (!name || latitude === undefined || longitude === undefined) continue
        const id = `${element.type}/${element.id}`
        unique.set(id, { id, name, lat: latitude, lon: longitude, category: categoryOf(element.tags ?? {}) })
      }
      const latitudeScale = Math.cos(lat * Math.PI / 180)
      setPlaces([...unique.values()].sort((a, b) =>
        ((a.lat - lat) ** 2 + ((a.lon - lon) * latitudeScale) ** 2) - ((b.lat - lat) ** 2 + ((b.lon - lon) * latitudeScale) ** 2)
      ))
      setLoading(false)
    }

    void loadPlaces()
    return () => { disposed = true; activeController?.abort() }
  }, [searchCenter, requestId])

  const visiblePlaces = places.filter(place => filter === 'all' || place.category === filter)

  return <div className="portal-page">
    <div className="portal-page-heading"><span className="portal-eyebrow">PERTO DE VOCÊ</span><h1>Encontre serviços de saúde</h1><p>Explore unidades de saúde, farmácias e hospitais no mapa.</p></div>
    <div className="units-toolbar"><div className="units-filters" aria-label="Filtrar locais">{categories.map(category => <button key={category.key} type="button" className={filter === category.key ? 'selected' : ''} onClick={() => setFilter(category.key)}>{category.label}</button>)}</div><button type="button" className="btn portal-primary-button" onClick={() => { setSearchCenter([...viewCenter]); setRequestId(value => value + 1) }}><i className="bi bi-search" aria-hidden="true" /> Buscar nesta área</button></div>
    <div className="portal-panel real-map-panel"><div className="row g-0"><div className="col-lg-8"><MapContainer center={initialCenter} zoom={13} scrollWheelZoom={false} className="real-map"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' /><MapWatcher onMove={setViewCenter} /><FocusPlace place={selectedPlace} />{visiblePlaces.map(place => <CircleMarker key={place.id} center={[place.lat, place.lon]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: colorOf(place.category), fillOpacity: 1 }}><Popup><strong>{place.name}</strong><br />{categoryLabel(place.category)}</Popup></CircleMarker>)}</MapContainer></div><div className="col-lg-4"><div className="real-map-list"><div className="real-map-list-heading"><h2>Locais encontrados</h2><span>OpenStreetMap</span></div>{loading ? <p className="map-message">Buscando serviços nesta área...</p> : error ? <p className="map-message">Não foi possível carregar os locais agora. O mapa continua disponível.</p> : visiblePlaces.length === 0 ? <p className="map-message">Nenhum local encontrado nesta área. Arraste o mapa e busque novamente.</p> : <div className="real-map-results">{visiblePlaces.slice(0, 10).map(place => <button key={place.id} type="button" className="real-map-result" onClick={() => setSelectedPlace(place)}><span className="result-dot" style={{ background: colorOf(place.category) }} /><span><strong>{place.name}</strong><small>{categoryLabel(place.category)}</small></span><i className="bi bi-chevron-right" aria-hidden="true" /></button>)}</div>}</div></div></div></div>
    <p className="map-source-note">Mapa iniciado em Fortaleza (exemplo). Arraste para outra região e clique em “Buscar nesta área”. Os dados vêm do OpenStreetMap e podem estar incompletos ou desatualizados.</p>
  </div>
}
