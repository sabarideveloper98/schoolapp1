import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAT5BvpuwQ0ExOiORTr8IDMr_iqGwW4_qQ';

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

const isValidCoordinate = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const getCoordinates = (latitude, longitude) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return {
    lat: Number(latitude),
    lng: Number(longitude)
  };
};

const BusTrackingMap = ({
  center = DEFAULT_CENTER,
  zoom = 13,
  activeBusLocation = null,
  routeStops = [],
  height = '500px'
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const polylineRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamically load Google Maps JS API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let existingScript = document.getElementById(scriptId);

    if (existingScript) {
      const handleLoad = () => setIsLoaded(true);

      existingScript.addEventListener('load', handleLoad);

      if (window.google && window.google.maps) {
        setIsLoaded(true);
      }

      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    const script = document.createElement('script');

    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (
      !isLoaded ||
      !mapRef.current ||
      !window.google ||
      !window.google.maps
    ) {
      return;
    }

    try {
      if (!googleMapRef.current) {
        const safeCenter =
          getCoordinates(center?.lat, center?.lng) || DEFAULT_CENTER;

        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: safeCenter,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });
      }
    } catch (e) {
      console.error('Error initializing Google Map:', e);
    }
  }, [isLoaded, center, zoom]);

  // Update route polyline and stop markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google) {
      return;
    }

    // Clear existing stop markers
    stopMarkersRef.current.forEach((marker) => marker.setMap(null));
    stopMarkersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Only use stops with valid coordinates
    const validStops = (routeStops || [])
      .map((stop) => ({
        ...stop,
        coordinates: getCoordinates(
          stop?.latitude,
          stop?.longitude
        )
      }))
      .filter((stop) => stop.coordinates !== null);

    if (validStops.length === 0) {
      return;
    }

    const pathCoordinates = validStops.map(
      (stop) => stop.coordinates
    );

    // Draw route polyline
    if (pathCoordinates.length >= 2) {
      polylineRef.current = new window.google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: googleMapRef.current
      });
    }

    // Add stop markers
    validStops.forEach((stop, index) => {
      const marker = new window.google.maps.Marker({
        position: stop.coordinates,
        map: googleMapRef.current,
        title: `Stop ${stop.stop_order || index + 1}: ${stop.stop_name || ''
          }`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor:
            index === 0
              ? '#10b981'
              : index === validStops.length - 1
                ? '#ef4444'
                : '#3b82f6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding:6px;font-family:sans-serif;">
          <b style="color:#1e293b;">
            Stop ${stop.stop_order || index + 1}: ${stop.stop_name || ''}
          </b>
          ${stop.estimated_arrival_time
            ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">
                  ETA: ${stop.estimated_arrival_time}
                </p>`
            : ''
          }
        </div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      stopMarkersRef.current.push(marker);
    });

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();

    pathCoordinates.forEach((coordinate) => {
      bounds.extend(coordinate);
    });

    const busCoordinates = getCoordinates(
      activeBusLocation?.latitude !== undefined ? activeBusLocation.latitude : activeBusLocation?.current_latitude,
      activeBusLocation?.longitude !== undefined ? activeBusLocation.longitude : activeBusLocation?.current_longitude
    );

    if (busCoordinates) {
      bounds.extend(busCoordinates);
    }

    googleMapRef.current.fitBounds(bounds);
  }, [isLoaded, routeStops, activeBusLocation]);

  // Update live bus location
  useEffect(() => {
    if (
      !googleMapRef.current ||
      !window.google ||
      !activeBusLocation
    ) {
      return;
    }

    const lat = activeBusLocation.latitude !== undefined ? activeBusLocation.latitude : activeBusLocation.current_latitude;
    const lng = activeBusLocation.longitude !== undefined ? activeBusLocation.longitude : activeBusLocation.current_longitude;
    const busPos = getCoordinates(lat, lng);

    // Ignore invalid/missing GPS coordinates
    if (!busPos) {
      console.warn(
        'Invalid bus GPS coordinates:',
        lat,
        lng
      );
      return;
    }

    if (!busMarkerRef.current) {
      busMarkerRef.current = new window.google.maps.Marker({
        position: busPos,
        map: googleMapRef.current,
        title: `Bus ${activeBusLocation.bus_number || ''}`,
        icon: {
          path: 'M 0,-15 L 12,15 L 0,10 L -12,15 Z',
          scale: 1.2,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          rotation: Number(activeBusLocation.heading) || 0
        }
      });
    } else {
      busMarkerRef.current.setPosition(busPos);
    }

    googleMapRef.current.panTo(busPos);
  }, [isLoaded, activeBusLocation]);

// Cleanup
useEffect(() => {
  return () => {
    stopMarkersRef.current.forEach((marker) => marker.setMap(null));

    if (busMarkerRef.current) {
      busMarkerRef.current.setMap(null);
    }

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
  };
}, []);

return (
  <div
    className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
    style={{ height }}
  >
    {!isLoaded && (
      <div className="absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
        Loading Google Maps...
      </div>
    )}

    <div ref={mapRef} className="w-full h-full" />
  </div>
);
};

export default BusTrackingMap;