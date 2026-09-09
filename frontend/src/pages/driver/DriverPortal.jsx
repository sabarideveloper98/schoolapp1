import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Bus, MapPin, Users, Play, Square, AlertTriangle, Radio, LogOut,
  Clock, Navigation, CheckCircle2, Phone, ArrowRight
} from 'lucide-react';
import BusTrackingMap from '../../components/BusTrackingMap';

const DriverPortal = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  const driverToken = localStorage.getItem('driverToken');

  const fetchPortalData = async () => {
    try {
      if (!driverToken) {
        navigate('/driver/login');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${driverToken}` } };
      const res = await axios.get('http://localhost:5005/api/transport/driver/portal-data', config);
      setData(res.data);

      if (res.data.activeTrip) {
        setIsTripActive(true);
        setCurrentTrip(res.data.activeTrip);
        startGeolocationWatcher();
      }
    } catch (error) {
      toast.error('Failed to load driver portal data');
      if (error.response?.status === 401) {
        navigate('/driver/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Continuous HTML5 Geolocation Tracking Watcher
  const startGeolocationWatcher = () => {
    if (!navigator.geolocation) {
      toast.error('GPS Geolocation is not supported by your browser');
      return;
    }

    setIsBroadcasting(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setLiveLocation({ latitude, longitude, speed: speed || 0 });

        try {
          const config = { headers: { Authorization: `Bearer ${driverToken}` } };
          await axios.post('http://localhost:5005/api/transport/driver/update-location', {
            latitude,
            longitude,
            speed: speed ? Math.round(speed * 3.6) : 0 // km/h
          }, config);
        } catch (err) {
          console.error('Failed to broadcast GPS location:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.warning('Unable to access current GPS position. Please check location permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleStartTrip = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${driverToken}` } };
      const res = await axios.post('http://localhost:5005/api/transport/driver/start-trip', {}, config);
      
      toast.success('🚀 Trip Started! GPS Live Tracking is active.');
      setIsTripActive(true);
      setCurrentTrip(res.data.trip);
      startGeolocationWatcher();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    }
  };

  const handleEndTrip = async () => {
    if (!window.confirm('Are you sure you want to end today\'s bus trip?')) return;

    try {
      const config = { headers: { Authorization: `Bearer ${driverToken}` } };
      await axios.post('http://localhost:5005/api/transport/driver/end-trip', {}, config);

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      toast.success('🏁 Trip Ended Safely!');
      setIsTripActive(false);
      setIsBroadcasting(false);
      setCurrentTrip(null);
      fetchPortalData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end trip');
    }
  };

  const handleEmergencyAlert = async () => {
    if (!window.confirm('🚨 Trigger EMERGENCY ALERT to School Administration?')) return;

    try {
      const config = { headers: { Authorization: `Bearer ${driverToken}` } };
      await axios.post('http://localhost:5005/api/transport/driver/emergency', {}, config);
      toast.error('🚨 EMERGENCY ALERT SENT TO SCHOOL ADMIN!');
    } catch (error) {
      toast.error('Failed to send emergency alert');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverData');
    navigate('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        Loading Driver App...
      </div>
    );
  }

  const { driver, assignedBus, assignedRoute, routeStops, assignedStudents } = data || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Navbar Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">{driver?.name}</h2>
            <span className="text-[11px] font-bold text-slate-400">ID: {driver?.driver_id} • Bus Driver</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-2">
        {/* Status Card */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle & Route Assignment</span>
            {isBroadcasting ? (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" /> GPS Live
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[11px] font-bold">
                Standby
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Bus</span>
              <p className="text-lg font-black text-white">{assignedBus ? assignedBus.bus_name : 'No Bus Assigned'}</p>
              <p className="text-xs font-semibold text-blue-400 mt-0.5">{assignedBus?.vehicle_reg_number || 'N/A'}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Route</span>
              <p className="text-lg font-black text-white">{assignedRoute ? assignedRoute.route_name : 'No Route Assigned'}</p>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">{assignedRoute ? `${assignedRoute.start_point} ➔ ${assignedRoute.end_point}` : 'N/A'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isTripActive ? (
              <button
                onClick={handleStartTrip}
                disabled={!assignedBus || !assignedRoute}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Bus Trip</span>
              </button>
            ) : (
              <button
                onClick={handleEndTrip}
                className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-black py-4 rounded-2xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all text-sm"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>End Bus Trip</span>
              </button>
            )}

            <button
              onClick={handleEmergencyAlert}
              className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Alert</span>
            </button>
          </div>
        </div>

        {/* Live GPS Map */}
        {isTripActive && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" /> Live GPS Navigation Map
              </h3>
              {liveLocation && (
                <span className="text-xs font-bold text-slate-400">
                  Speed: {liveLocation.speed} km/h
                </span>
              )}
            </div>
            <BusTrackingMap
              center={liveLocation ? { lat: liveLocation.latitude, lng: liveLocation.longitude } : { lat: 12.9716, lng: 77.5946 }}
              activeBusLocation={liveLocation}
              routeStops={routeStops}
              height="340px"
            />
          </div>
        )}

        {/* Route Stops Sequence */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Route Pickup & Drop Stops ({routeStops.length})
          </h3>

          {routeStops.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">No stops configured for this route.</p>
          ) : (
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {routeStops.map((stop, idx) => (
                <div key={stop._id} className="relative flex items-center gap-4 pl-8">
                  <div className="absolute left-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white">
                    {stop.stop_order}
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{stop.stop_name}</p>
                      <p className="text-xs font-medium text-slate-400">{stop.stop_address || 'School Bus Route Stop'}</p>
                    </div>
                    {stop.estimated_arrival_time && (
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {stop.estimated_arrival_time}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Students Roster */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Today's Transport Students ({assignedStudents.length})
          </h3>

          {assignedStudents.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">No students assigned to this route yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedStudents.map((alloc) => (
                <div key={alloc._id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{alloc.student_id?.student_name}</p>
                    <p className="text-xs font-medium text-slate-400">Roll No: {alloc.student_id?.roll_no || 'N/A'}</p>
                    <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {alloc.pickup_stop_id?.stop_name}
                    </p>
                  </div>
                  {alloc.student_id?.parent_phone && (
                    <a
                      href={`tel:${alloc.student_id.parent_phone}`}
                      className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl transition-colors"
                      title="Call Parent"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DriverPortal;
