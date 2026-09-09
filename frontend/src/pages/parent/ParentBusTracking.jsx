import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bus, MapPin, Phone, Radio, Navigation, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import BusTrackingMap from '../../components/BusTrackingMap';

const ParentBusTracking = () => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchTracking = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/transport/parent-tracking', config);
      setTrackingData(res.data);
    } catch (error) {
      toast.error('Failed to load bus tracking info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTracking();
    }
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Bus Location...</div>;
  }

  if (!trackingData || !trackingData.assigned) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-800">No Transport Assignment Found</h3>
        <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
          Your child is not currently assigned to any active school bus route. Please contact School Admin to enroll.
        </p>
      </div>
    );
  }

  const { student, transport, driver, routeStops, activeTrip } = trackingData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live Child School Bus Tracker</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Parent Portal</span>
          <span>-</span>
          <span className="text-blue-600">Student: {student.student_name}</span>
        </div>
      </div>

      {/* Driver & Route Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Vehicle</span>
            <h3 className="text-lg font-black text-slate-800">{transport.bus_id?.bus_name}</h3>
            <p className="text-xs font-bold text-blue-600 mt-0.5">{transport.bus_id?.bus_number} ({transport.bus_id?.vehicle_reg_number})</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pickup Stop</span>
            <h3 className="text-lg font-black text-slate-800">{transport.pickup_stop_id?.stop_name}</h3>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">ETA: {transport.pickup_stop_id?.estimated_arrival_time || '07:30 AM'}</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Driver Details</span>
            <h3 className="text-lg font-black text-slate-800">{driver ? driver.name : 'Driver Assigned'}</h3>
            {driver?.mobile_number && (
              <a href={`tel:${driver.mobile_number}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> {driver.mobile_number}
              </a>
            )}
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" /> Live Bus Location Map
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              {activeTrip ? `Bus is currently on the move (${activeTrip.current_speed || 0} km/h)` : 'Bus trip has not started yet today.'}
            </p>
          </div>
          {activeTrip && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5" /> Live GPS Streaming
            </span>
          )}
        </div>

        <BusTrackingMap
          center={activeTrip?.current_latitude ? { lat: activeTrip.current_latitude, lng: activeTrip.current_longitude } : { lat: 12.9716, lng: 77.5946 }}
          activeBusLocation={activeTrip}
          routeStops={routeStops}
          height="450px"
        />

        {/* Live Trip Status Details */}
        {activeTrip && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Previous Stop</span>
              <p className="text-base font-black text-slate-700 mt-1">{activeTrip.previous_stop}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Current Stop</span>
              <p className="text-base font-black text-blue-700 mt-1">{activeTrip.current_stop}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Next Stop</span>
              <p className="text-base font-black text-slate-700 mt-1">{activeTrip.next_stop}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentBusTracking;
