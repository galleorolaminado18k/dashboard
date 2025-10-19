"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type CityData = {
  city: string
  sales: number
  buyers: number
  avgTicket: number
  coordinates: [number, number]
}

type SalesMapProps = {
  cities: CityData[]
  onCityClick?: (city: string) => void
}

function createCustomIcon(sales: number) {
  const salesText = `$${(sales / 1000000).toFixed(1)}M COP`

  return L.divIcon({
    html: `
      <div style="
        background: white;
        padding: 6px 12px;
        border-radius: 9999px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        border: 1px solid #e5e7eb;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s;
        font-family: system-ui, -apple-system, sans-serif;
      " onmouseover="this.style.boxShadow='0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'" onmouseout="this.style.boxShadow='0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'">
        <span style="font-size: 14px; font-weight: 600; color: #111827;">${salesText}</span>
      </div>
    `,
    className: "custom-marker-icon",
    iconSize: [120, 40],
    iconAnchor: [60, 20],
  })
}

export default function SalesMap({ cities, onCityClick }: SalesMapProps) {
  const [mounted, setMounted] = useState(false)

  // Coordenadas del centro de Colombia
  const colombiaCenter: [number, number] = [4.5709, -74.2973]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-300" />
          <p className="mt-4 text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={colombiaCenter}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cities.map((city) => (
          <Marker
            key={city.city}
            position={city.coordinates}
            icon={createCustomIcon(city.sales)}
            eventHandlers={{
              click: () => {
                if (onCityClick) onCityClick(city.city)
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900">{city.city}</h3>
                <p className="text-sm text-gray-600">Ventas: ${(city.sales / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-gray-600">Compradores: {city.buyers}</p>
                <p className="text-sm text-gray-600">Ticket: ${city.avgTicket.toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        
        .custom-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 12px;
          font-family: inherit;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .leaflet-control-zoom a {
          background-color: white !important;
          color: #111827 !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 20px !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: #f9fafb !important;
        }
        
        .leaflet-control-zoom a:first-child {
          border-bottom: 1px solid #e5e7eb !important;
        }
      `}</style>
    </div>
  )
}
