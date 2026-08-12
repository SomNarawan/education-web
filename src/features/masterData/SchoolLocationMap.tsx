import { useEffect } from 'react'
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet'
import type { LatLngExpression, Marker as LeafletMarker } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const thailandCenter: LatLngExpression = [13.0, 101.0]

interface SchoolLocationMapProps {
    latitude?: string | number | null
    longitude?: string | number | null
    editable?: boolean
    onPositionChange?: (latitude: number, longitude: number) => void
}

function parseCoordinate(value?: string | number | null) {
    if (value === null || value === undefined || value === '') return null

    const coordinate = Number(value)
    return Number.isFinite(coordinate) ? coordinate : null
}

function MapPositionUpdater({
    latitude,
    longitude,
}: {
    latitude: number | null
    longitude: number | null
}) {
    const map = useMap()

    useEffect(() => {
        if (latitude === null || longitude === null) return

        map.setView([latitude, longitude], 15)
    }, [latitude, longitude, map])

    return null
}

function MapClickHandler({
    onPositionChange,
}: {
    onPositionChange: (latitude: number, longitude: number) => void
}) {
    useMapEvents({
        click: ({ latlng }) => {
            onPositionChange(latlng.lat, latlng.lng)
        },
    })

    return null
}

export default function SchoolLocationMap({
    latitude,
    longitude,
    editable = false,
    onPositionChange,
}: SchoolLocationMapProps) {
    const parsedLatitude = parseCoordinate(latitude)
    const parsedLongitude = parseCoordinate(longitude)
    const hasValidPosition =
        parsedLatitude !== null &&
        parsedLongitude !== null &&
        parsedLatitude >= -90 &&
        parsedLatitude <= 90 &&
        parsedLongitude >= -180 &&
        parsedLongitude <= 180
    const markerPosition: LatLngExpression | null = hasValidPosition
        ? [parsedLatitude, parsedLongitude]
        : null

    if (!editable && !markerPosition) {
        return (
            <div className="school-location-map-empty">
                ไม่พบข้อมูลตำแหน่งของโรงเรียน
            </div>
        )
    }

    const handlePositionChange = (nextLatitude: number, nextLongitude: number) => {
        onPositionChange?.(nextLatitude, nextLongitude)
    }

    return (
        <div className="school-location-map">
            <MapContainer
                center={markerPosition ?? thailandCenter}
                zoom={markerPosition ? 15 : 6}
                scrollWheelZoom
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapPositionUpdater
                    latitude={hasValidPosition ? parsedLatitude : null}
                    longitude={hasValidPosition ? parsedLongitude : null}
                />

                {editable && (
                    <MapClickHandler
                        onPositionChange={handlePositionChange}
                    />
                )}

                {markerPosition && (
                    <Marker
                        position={markerPosition}
                        draggable={editable}
                        eventHandlers={
                            editable
                                ? {
                                      dragend: (event) => {
                                          const marker =
                                              event.target as LeafletMarker
                                          const nextPosition =
                                              marker.getLatLng()

                                          handlePositionChange(
                                              nextPosition.lat,
                                              nextPosition.lng,
                                          )
                                      },
                                  }
                                : undefined
                        }
                    />
                )}
            </MapContainer>
        </div>
    )
}
