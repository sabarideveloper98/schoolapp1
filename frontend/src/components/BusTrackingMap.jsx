import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAT5BvpuwQ0ExOiORTr8IDMr_iqGwW4_qQ';

const BusTrackingMap = ({
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 13,
  activeBusLocation = null, // { latitude, longitude, speed, bus_number, current_stop, next_stop, eta_minutes }
  routeStops = [], // [{ latitude, longitude, stop_name, stop_order }]
  height = '500px'
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const polylineRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamically load Google Maps JS API script safely
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
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps script');
    document.head.appendChild(script);
  }, []);

  // Initialize Map safely
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google || !window.google.maps) return;

    try {
      if (!googleMapRef.current) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ]
        });
      }
    } catch (e) {
      console.error('Error initializing Google Map:', e);
    }
  }, [isLoaded, center, zoom]);

  // Update Route Polyline & Stop Markers
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing stop markers
    stopMarkersRef.current.forEach(m => m.setMap(null));
    stopMarkersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (routeStops && routeStops.length > 0) {
      const pathCoordinates = routeStops.map(s => ({
        lat: Number(s.latitude),
        lng: Number(s.longitude)
      }));

      // Draw Polyline
      polylineRef.current = new window.google.maps.Polyline({
        path: pathCoordinates,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: googleMapRef.current
      });

      // Add Stop Markers
      routeStops.forEach((stop, index) => {
        const marker = new window.google.maps.Marker({
          position: { lat: Number(stop.latitude), lng: Number(stop.longitude) },
          map: googleMapRef.current,
          title: `Stop ${stop.stop_order}: ${stop.stop_name}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: index === 0 ? '#10b981' : index === routeStops.length - 1 ? '#ef4444' : '#3b82f6',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding:6px;font-family:sans-serif;">
            <b style="color:#1e293b;">Stop ${stop.stop_order}: ${stop.stop_name}</b>
            ${stop.estimated_arrival_time ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b;">ETA: ${stop.estimated_arrival_time}</p>` : ''}
          </div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        stopMarkersRef.current.push(marker);
      });

      // Fit bounds to show route
      const bounds = new window.google.maps.LatLngBounds();
      pathCoordinates.forEach(coord => bounds.extend(coord));
      if (activeBusLocation?.latitude && activeBusLocation?.longitude) {
        bounds.extend({ lat: Number(activeBusLocation.latitude), lng: Number(activeBusLocation.longitude) });
      }
      googleMapRef.current.fitBounds(bounds);
    }
  }, [isLoaded, routeStops, activeBusLocation]);

  // Update Live Bus Location Marker
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !activeBusLocation) return;

    const busPos = {
      lat: Number(activeBusLocation.latitude),
      lng: Number(activeBusLocation.longitude)
    };

    if (!busMarkerRef.current) {
      busMarkerRef.current = new window.google.maps.Marker({
        position: busPos,
        map: googleMapRef.current,
        title: `Bus ${activeBusLocation.bus_number || ''}`,
        icon: {
          path: 'M 0,-15 L 12,15 L 0,10 L -12,15 Z', // Custom arrow / bus direction symbol
          scale: 1.2,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          rotation: activeBusLocation.heading || 0
        }
      });
    } else {
      busMarkerRef.current.setPosition(busPos);
    }

    googleMapRef.current.panTo(busPos);
  }, [isLoaded, activeBusLocation]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
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
