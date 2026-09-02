import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  X,
  Compass,
  Check,
  Building,
  TreePine,
  Coffee,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { JournalLocation } from '../types';
import { JournalMapView } from './JournalMapView';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: JournalLocation | null;
  onSelectLocation: (loc: JournalLocation | null) => void;
}

const PRESET_SANCTUARIES: Array<{ name: string; address: string; lat: number; lng: number; icon: any }> = [
  {
    name: 'Kyoto Bamboo Grove & Zen Gardens',
    address: 'Arashiyama, Ukyo Ward, Kyoto, Japan',
    lat: 35.0165,
    lng: 135.6713,
    icon: TreePine,
  },
  {
    name: 'Central Park Conservatory Water',
    address: 'New York, NY 10024, USA',
    lat: 40.7744,
    lng: -73.9698,
    icon: TreePine,
  },
  {
    name: 'Monastery of Saint John Retreat',
    address: 'Lake Como, Lombardy, Italy',
    lat: 45.9868,
    lng: 9.2572,
    icon: Building,
  },
  {
    name: 'Artisan Coffee & Library Nook',
    address: 'San Francisco, CA, USA',
    lat: 37.7749,
    lng: -122.4194,
    icon: Coffee,
  },
  {
    name: 'Redwood National Park Sanctuary',
    address: 'Crescent City, CA, USA',
    lat: 41.2132,
    lng: -124.0046,
    icon: TreePine,
  },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<JournalLocation | null>(
    currentLocation || null
  );
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        throw new Error('Location lookup failed. Please try a different query.');
      }

      const data = await res.json();
      const newLocation: JournalLocation = {
        placeName: data.placeName || searchQuery,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        placeId: data.placeId,
      };

      setSelectedLoc(newLocation);
    } catch (err: any) {
      setSearchError(err?.message || 'Could not find location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          const res = await fetch('/api/maps/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng }),
          });

          const data = await res.json();
          setSelectedLoc({
            placeName: data.placeName || 'Current Location',
            address: data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng,
            placeId: data.placeId,
          });
        } catch {
          setSelectedLoc({
            placeName: 'My Current Location',
            address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } finally {
          setIsLocatingUser(false);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        setSearchError('Location permission denied or unavailable.');
      },
      { timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onSelectLocation(selectedLoc);
    onClose();
  };

  const handleRemove = () => {
    onSelectLocation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pin Location to Reflection
              </h3>
              <p className="text-xs text-slate-500">
                Grounded with Google Maps Platform API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Search Bar & Current Location Button */}
          <div className="space-y-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, retreat, or address (e.g. Kyoto, Paris, Ubud)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Search</span>
              </button>
            </form>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingUser}
              className="w-full py-2 px-3 bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200/70 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLocatingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>Pin My Current Physical Location</span>
            </button>
          </div>

          {searchError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {searchError}
            </div>
          )}

          {/* Active Pinned Preview Map */}
          {selectedLoc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Selected Sanctuary Pin
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready to attach
                </span>
              </div>
              <JournalMapView location={selectedLoc} height="180px" />
            </div>
          )}

          {/* Preset Reflection Sanctuaries */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Recommended Reflection Sanctuaries</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SANCTUARIES.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedLoc?.placeName === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setSelectedLoc({
                        placeName: preset.name,
                        address: preset.address,
                        lat: preset.lat,
                        lng: preset.lng,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {preset.address}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div>
            {currentLocation && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
              >
                Remove Location
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedLoc}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40"
            >
              Save Pin to Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
