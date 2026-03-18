import { MapContainer, Marker as LeafletMarker, Polyline as LeafletPolyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let defaultIconConfigured = false;

if (!defaultIconConfigured) {
  const defaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  L.Marker.prototype.options.icon = defaultIcon;
  defaultIconConfigured = true;
}

interface LocalMapProps {
  objects: Array<{ id: number; lat: number; lng: number; name: string; type: string; markerColor?: string }>;
  onSelect: (object: any) => void;
  routePoints: Array<{ lat: number; lng: number }>;
}

const markerIconByColor = new Map<string, L.DivIcon>();

const getCategoryIcon = (color: string) => {
  const key = color || '#3b82f6';
  const cached = markerIconByColor.get(key);
  if (cached) return cached;

  const iconInstance = L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${key};border:2px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,.35);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  markerIconByColor.set(key, iconInstance);
  return iconInstance;
};

export function LocalMap({ objects, onSelect, routePoints }: LocalMapProps) {
  return (
    <div className="w-full h-full rounded-[40px] overflow-hidden">
      <MapContainer center={[44.9521, 34.1024]} zoom={8} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {objects.map((obj) => (
          <LeafletMarker
            key={obj.id}
            position={[obj.lat, obj.lng]}
            icon={obj.markerColor ? getCategoryIcon(obj.markerColor) : undefined}
            eventHandlers={{
              click: () => onSelect(obj),
            }}
          >
            <Popup>
              <div className="text-xs font-bold">{obj.name}</div>
              <div className="text-[10px] opacity-60">{obj.type}</div>
            </Popup>
          </LeafletMarker>
        ))}
        {routePoints.length > 1 && (
          <LeafletPolyline
            positions={routePoints.map((point) => [point.lat, point.lng])}
            color="#A855F7"
            weight={4}
            opacity={0.6}
          />
        )}
      </MapContainer>
    </div>
  );
}
