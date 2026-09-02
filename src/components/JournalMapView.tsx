import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { JournalLocation } from '../types';

interface JournalMapViewProps {
  location: JournalLocation;
  height?: string;
  zoom?: number;
  interactive?: boolean;
}

export const JournalMapView: React.FC<JournalMapViewProps> = ({
  location,
  height = '200px',
  zoom = 13,
  interactive = true,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const position = { lat: location.lat, lng: location.lng };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
      style={{ height }}
    >
      {apiKey ? (
        <APIProvider apiKey={apiKey} solutionChannel="gmp_mcp_codeassist_v1_aistudio">
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={position}
            center={position}
            defaultZoom={zoom}
            gestureHandling={interactive ? 'auto' : 'none'}
            disableDefaultUI={!interactive}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            <AdvancedMarker position={position} title={location.placeName}>
              <Pin background="#4f46e5" glyphColor="#ffffff" borderColor="#3730a3" />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      ) : (
        /* Visual Fallback Canvas when zero-config prototyping */
        <div className="w-full h-full bg-linear-to-br from-slate-100 via-indigo-50/40 to-slate-200 flex flex-col items-center justify-center p-4 text-center relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md animate-bounce">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">{location.placeName}</h4>
              {location.address && (
                <p className="text-[11px] text-slate-500 max-w-xs truncate">{location.address}</p>
              )}
              <p className="text-[10px] font-mono text-indigo-600 mt-0.5">
                {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Badge Overlay */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-3 py-1.5 rounded-lg flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 truncate">
            {location.placeName}
          </span>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 ml-2"
        >
          <span>Open Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
