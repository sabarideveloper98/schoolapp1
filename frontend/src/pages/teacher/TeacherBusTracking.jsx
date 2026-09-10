import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Bus, Radio, Navigation, Clock, Users } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import BusTrackingMap from '../../components/BusTrackingMap';

const TeacherBusTracking = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchTrips = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('/api/transport/active-trips', config);
      setActiveTrips(res.data);
    } catch (error) {
      toast.error('Failed to load active school bus trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchTrips();
    }
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Loading Live Bus Tracking...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Live School Bus Fleet Monitor</h2>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span>Teacher Portal</span>
          <span>-</span>
          <span className="text-blue-600">Active School Buses & ETA to School</span>
        </div>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" /> Live Fleet Tracking
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {activeTrips.length} Active Bus Trips
          </span>
        </div>

        <BusTrackingMap
          center={activeTrips[0]?.current_latitude ? { lat: activeTrips[0].current_latitude, lng: activeTrips[0].current_longitude } : { lat: 12.9716, lng: 77.5946 }}
          activeBusLocation={activeTrips[0]}
          routeStops={activeTrips[0]?.routeStops || []}
          height="450px"
        />
      </div>

      {/* Active Trips Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeTrips.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 font-semibold shadow-sm">
            No school buses are currently running trips right now.
          </div>
        ) : (
          activeTrips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-black text-slate-800">{trip.bus_id?.bus_name}</h4>
                  <p className="text-xs font-bold text-blue-600">{trip.bus_id?.bus_number} • Driver: {trip.driver_id?.name}</p>
                </div>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {trip.arrival_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Previous Stop</span>
                  <span className="font-black text-slate-700">{trip.previous_stop}</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-[10px] text-blue-600 font-black uppercase block">Current Stop</span>
                  <span className="font-black text-blue-700">{trip.current_stop}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Stop</span>
                  <span className="font-black text-slate-700">{trip.next_stop}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherBusTracking;
