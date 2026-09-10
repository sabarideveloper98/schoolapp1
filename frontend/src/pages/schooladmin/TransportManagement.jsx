import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Bus, Users, MapPin, Navigation, Plus, Trash2, Edit3, CheckCircle2,
  AlertTriangle, Phone, Radio, Shield, Clock, Search, X, Play, Square, Eye, ArrowRight
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import BusTrackingMap from '../../components/BusTrackingMap';

const TransportManagement = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, buses, drivers, routes, allocations, tracking, history
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [selectedClassFilterModal, setSelectedClassFilterModal] = useState('');
  const [selectedClassFilterAllocations, setSelectedClassFilterAllocations] = useState('');

  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Modals state
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busForm, setBusForm] = useState({
    bus_number: '',
    vehicle_reg_number: '',
    bus_name: '',
    bus_type: 'Bus',
    total_seats: 40,
    gps_enabled: true,
    status: 'Active'
  });

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    driver_id: '',
    name: '',
    mobile_number: '',
    email: '',
    address: '',
    license_number: '',
    license_expiry: '',
    password: '',
    status: 'Active'
  });

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    route_id: '',
    route_name: '',
    start_point: '',
    end_point: '',
    total_distance_km: '',
    estimated_duration_mins: '',
    assigned_bus_id: '',
    status: 'Active'
  });

  const [selectedRouteForStops, setSelectedRouteForStops] = useState(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopForm, setStopForm] = useState({
    stop_name: '',
    stop_address: '',
    latitude: '',
    longitude: '',
    stop_order: 1,
    estimated_arrival_time: ''
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    student_id: '',
    admission_number: '',
    class_id: '',
    route_id: '',
    bus_id: '',
    pickup_stop_id: '',
    drop_stop_id: ''
  });

  const [assignDriverBusForm, setAssignDriverBusForm] = useState({
    driver_id: '',
    bus_id: '',
    route_id: ''
  });
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);

  const fetchAllData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const [statsRes, busesRes, driversRes, routesRes, allocRes, tripsRes, historyRes] = await Promise.all([
        axios.get('/api/transport/stats', config),
        axios.get('/api/transport/buses', config),
        axios.get('/api/transport/drivers', config),
        axios.get('/api/transport/routes', config),
        axios.get('/api/transport/student-allocations', config),
        axios.get('/api/transport/active-trips', config),
        axios.get('/api/transport/trip-history', config)
      ]);

      setStats(statsRes.data);
      setBuses(busesRes.data);
      setDrivers(driversRes.data);
      setRoutes(routesRes.data);
      setAllocations(allocRes.data);
      setActiveTrips(tripsRes.data);
      setTripHistory(historyRes.data);

      // Fetch students & classes for dropdowns
      const [studentsApi, classesApi] = await Promise.all([
        axios.get('/api/schooladmin/students', config),
        axios.get('/api/schooladmin/classes', config)
      ]);
      setStudentsList(studentsApi.data || []);
      setClassesList(classesApi.data || []);

    } catch (error) {
      toast.error('Failed to load transport data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchAllData();
    }
  }, [user]);

  // Bus Handlers
  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingBus) {
        await axios.put(`/api/transport/buses/${editingBus._id}`, busForm, config);
        toast.success('Bus updated successfully');
      } else {
        await axios.post('/api/transport/buses', busForm, config);
        toast.success('Bus added successfully');
      }
      setIsBusModalOpen(false);
      setEditingBus(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save bus');
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/transport/buses/${id}`, config);
      toast.success('Bus deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete bus');
    }
  };

  // Driver Handlers
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingDriver) {
        await axios.put(`/api/transport/drivers/${editingDriver._id}`, driverForm, config);
        toast.success('Driver updated successfully');
      } else {
        await axios.post('/api/transport/drivers', driverForm, config);
        toast.success('Driver registered successfully');
      }
      setIsDriverModalOpen(false);
      setEditingDriver(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save driver');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/transport/drivers/${id}`, config);
      toast.success('Driver deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete driver');
    }
  };

  // Route Handlers
  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingRoute) {
        await axios.put(`/api/transport/routes/${editingRoute._id}`, routeForm, config);
        toast.success('Route updated successfully');
      } else {
        await axios.post('/api/transport/routes', routeForm, config);
        toast.success('Route created successfully');
      }
      setIsRouteModalOpen(false);
      setEditingRoute(null);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route and its stops?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/transport/routes/${id}`, config);
      toast.success('Route deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete route');
    }
  };

  // Stop Handlers
  const handleAddStop = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/transport/stops', {
        ...stopForm,
        route_id: selectedRouteForStops._id
      }, config);
      toast.success('Route stop added successfully');
      setIsStopModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stop');
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm('Delete this stop?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/transport/stops/${stopId}`, config);
      toast.success('Stop deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete stop');
    }
  };

  // Driver Assignment
  const handleAssignDriverToBus = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/transport/assign-driver', assignDriverBusForm, config);
      toast.success('Driver assigned to Bus & Route successfully');
      setIsAssignDriverModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign driver');
    }
  };

  const handleUnassignDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to unassign this driver from their vehicle?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/transport/unassign-driver', { driver_id: driverId }, config);
      toast.success('Driver unassigned successfully');
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unassign driver');
    }
  };

  // Student Transport Allocation
  const handleAssignStudent = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/transport/student-allocations', assignForm, config);
      toast.success('Student transport assigned successfully');
      setIsAssignModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign student transport');
    }
  };

  const handleRemoveStudentAlloc = async (id) => {
    if (!window.confirm('Remove this student transport allocation?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/transport/student-allocations/${id}`, config);
      toast.success('Student unassigned successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to remove student transport');
    }
  };

  const handleForceStopTrip = async (tripId) => {
    if (!window.confirm('Force stop this active bus trip?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`/api/transport/force-stop-trip/${tripId}`, {}, config);
      toast.info('Trip force stopped by Admin');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to force stop trip');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading Transport Management Data...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">School Transport Management & Live GPS Tracking</h2>
            <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
              Total Buses: {buses.length || stats?.totalBuses || 0}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span>School Admin</span>
            <span>-</span>
            <span className="text-blue-600">Buses, Drivers, Routes & Live GPS Fleet Control</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setEditingBus(null); setBusForm({ bus_number: `BUS-${buses.length + 1}`, vehicle_reg_number: '', bus_name: `School Bus ${buses.length + 1}`, bus_type: 'Bus', total_seats: 40, gps_enabled: true, status: 'Active' }); setIsBusModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Bus
          </button>
          <button
            onClick={() => { setEditingDriver(null); setDriverForm({ driver_id: `DRV-${drivers.length + 1}`, name: '', mobile_number: '', email: '', address: '', license_number: '', license_expiry: '', password: '', status: 'Active' }); setIsDriverModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
          <button
            onClick={() => { setEditingRoute(null); setRouteForm({ route_id: `RT-${routes.length + 1}`, route_name: '', start_point: '', end_point: '', total_distance_km: '', estimated_duration_mins: '', assigned_bus_id: '', status: 'Active' }); setIsRouteModalOpen(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Dashboard', icon: Navigation },
          { id: 'buses', label: `Buses (${buses.length})`, icon: Bus },
          { id: 'drivers', label: `Drivers (${drivers.length})`, icon: Users },
          { id: 'driver-assignments', label: `Assigned Drivers (${drivers.filter(d => d.assigned_bus_id).length})`, icon: Shield },
          { id: 'routes', label: `Routes & Stops (${routes.length})`, icon: MapPin },
          { id: 'allocations', label: `Students (${allocations.length})`, icon: Users },
          { id: 'tracking', label: `Live Tracking (${activeTrips.length})`, icon: Radio },
          { id: 'history', label: 'Trip Logs', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-black flex items-center gap-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Total Buses</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalBuses || buses.length || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Bus className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Active Routes</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.activeRoutes || routes.length || 0}</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Total Drivers</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.totalDrivers || drivers.length || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Transport Students</p>
                <h3 className="text-2xl font-black text-slate-800">{stats?.studentsUsingTransport || allocations.length || 0}</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Running Buses</p>
                <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
                  {stats?.busesCurrentlyRunning || 0}
                  {stats?.busesCurrentlyRunning > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Radio className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Delayed Buses</p>
                <h3 className="text-2xl font-black text-rose-600">{stats?.delayedBuses || 0}</h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Action Hub Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-3xl p-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Fleet Control Hub</span>
              <h3 className="text-xl font-black">Transport Quick Actions</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setIsAssignDriverModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Assign Driver to Bus
              </button>
              <button onClick={() => setIsAssignModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Assign Student Transport
              </button>
            </div>
          </div>

          {/* Live Fleet Tracking Google Map */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" /> Live School Fleet Map
                </h3>
                <p className="text-xs font-semibold text-slate-400">Real-time GPS tracking positions for all active running school buses.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {activeTrips.length} Bus Trips Running
              </span>
            </div>

            <BusTrackingMap
              center={activeTrips[0]?.current_latitude ? { lat: activeTrips[0].current_latitude, lng: activeTrips[0].current_longitude } : { lat: 12.9716, lng: 77.5946 }}
              activeBusLocation={activeTrips[0]}
              routeStops={activeTrips[0]?.routeStops || []}
              height="450px"
            />
          </div>
        </div>
      )}

      {/* TAB 2: BUS MANAGEMENT */}
      {activeTab === 'buses' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Registered School Buses & Vans</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full border border-blue-200 shadow-xs">
                  Total Buses: {buses.length}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400">Manage vehicle details, seating capacity, and GPS activation status.</p>
            </div>
            <button
              onClick={() => { setEditingBus(null); setBusForm({ bus_number: `BUS-${buses.length + 1}`, vehicle_reg_number: '', bus_name: `School Bus ${buses.length + 1}`, bus_type: 'Bus', total_seats: 40, gps_enabled: true, status: 'Active' }); setIsBusModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Bus
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Bus Number</th>
                  <th className="py-3.5 px-4">Bus Name</th>
                  <th className="py-3.5 px-4">Reg Number</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Seats</th>
                  <th className="py-3.5 px-4">GPS Status</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {buses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">No buses registered yet. Click "Add Bus" above.</td>
                  </tr>
                ) : (
                  buses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-800">{bus.bus_number}</td>
                      <td className="py-4 px-4 font-bold">{bus.bus_name}</td>
                      <td className="py-4 px-4 text-slate-500">{bus.vehicle_reg_number}</td>
                      <td className="py-4 px-4">{bus.bus_type}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{bus.total_seats} Seats</td>
                      <td className="py-4 px-4">
                        {bus.gps_enabled ? (
                          <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold">Enabled</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold">Disabled</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          bus.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button onClick={() => { setEditingBus(bus); setBusForm(bus); setIsBusModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteBus(bus._id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRIVER MANAGEMENT */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">School Bus Drivers</h3>
              <p className="text-xs font-semibold text-slate-400">Driver profiles, mobile login credentials, driving licenses & vehicle assignments.</p>
            </div>
            <button
              onClick={() => { setEditingDriver(null); setDriverForm({ driver_id: `DRV-${drivers.length + 1}`, name: '', mobile_number: '', email: '', address: '', license_number: '', license_expiry: '', password: '', status: 'Active' }); setIsDriverModalOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Driver
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 font-semibold">No drivers registered yet.</div>
            ) : (
              drivers.map((drv) => (
                <div key={drv._id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 font-black flex items-center justify-center text-base uppercase border border-emerald-500/20">
                      {drv.name[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{drv.name}</h4>
                      <p className="text-xs font-bold text-slate-400">ID: {drv.driver_id}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {drv.mobile_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400" /> License: {drv.license_number}
                    </p>
                    <p className="flex items-center gap-2">
                      <Bus className="w-3.5 h-3.5 text-blue-600" /> Assigned Bus: <span className="font-bold text-slate-800">{drv.assigned_bus_id ? drv.assigned_bus_id.bus_name : 'None'}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      drv.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {drv.status}
                    </span>
                    <div className="space-x-1">
                      <button onClick={() => { setEditingDriver(drv); setDriverForm(drv); setIsDriverModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteDriver(drv._id)} className="p-1.5 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EXTRA TAB: DRIVER ASSIGNMENTS & FLEET ALLOCATION LIST */}
      {activeTab === 'driver-assignments' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Driver Vehicle & Route Allocations</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full border border-blue-200 shadow-xs">
                  Assigned: {drivers.filter(d => d.assigned_bus_id).length} / {drivers.length} Drivers
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400">View and manage active driver assignments to school buses and designated routes.</p>
            </div>

            <button
              onClick={() => setIsAssignDriverModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Assign Driver to Bus
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Driver Name & Contact</th>
                  <th className="py-3.5 px-4">License No.</th>
                  <th className="py-3.5 px-4">Assigned Vehicle</th>
                  <th className="py-3.5 px-4">Vehicle Type</th>
                  <th className="py-3.5 px-4">Assigned Route</th>
                  <th className="py-3.5 px-4">Duty Status</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">No drivers registered in the system yet.</td>
                  </tr>
                ) : (
                  drivers.map((drv) => {
                    const assignedBus = drv.assigned_bus_id;
                    const assignedRoute = routes.find(r => (r.assigned_bus_id?._id || r.assigned_bus_id)?.toString() === (assignedBus?._id || assignedBus)?.toString());

                    return (
                      <tr key={drv._id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-black text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black flex items-center justify-center text-xs border border-slate-200">
                              {drv.name[0]}
                            </div>
                            <div>
                              <p className="font-black text-slate-800">{drv.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{drv.mobile_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-600">{drv.license_number || 'N/A'}</td>
                        <td className="py-4 px-4">
                          {assignedBus ? (
                            <div>
                              <p className="font-black text-blue-600">{assignedBus.bus_name || 'Bus'}</p>
                              <p className="text-[10px] text-slate-400 font-semibold">{assignedBus.bus_number} ({assignedBus.vehicle_reg_number})</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600">
                          {assignedBus ? `${assignedBus.bus_type || 'Bus'} (${assignedBus.total_seats || 40} Seats)` : '-'}
                        </td>
                        <td className="py-4 px-4 font-bold text-purple-600">
                          {assignedRoute ? assignedRoute.route_name : <span className="text-slate-400 italic font-normal">No Route</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            assignedBus ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {assignedBus ? 'On Duty / Assigned' : 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setAssignDriverBusForm({ driver_id: drv._id, bus_id: assignedBus?._id || '', route_id: assignedRoute?._id || '' });
                                setIsAssignDriverModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> {assignedBus ? 'Reassign' : 'Assign'}
                            </button>
                            {assignedBus && (
                              <button
                                onClick={() => handleUnassignDriver(drv._id)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Unassign
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTES & STOPS */}
      {activeTab === 'routes' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Transport Routes & Bus Stops</h3>
              <p className="text-xs font-semibold text-slate-400">Configure route paths, start/end points, and order pickup stops with GPS coordinates.</p>
            </div>
            <button
              onClick={() => { setEditingRoute(null); setRouteForm({ route_id: `RT-${routes.length + 1}`, route_name: '', start_point: '', end_point: '', total_distance_km: '', estimated_duration_mins: '', assigned_bus_id: '', status: 'Active' }); setIsRouteModalOpen(true); }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Route
            </button>
          </div>

          <div className="space-y-6">
            {routes.map((rt) => (
              <div key={rt._id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Route ID: {rt.route_id}</span>
                    <h4 className="text-base font-black text-slate-800">{rt.route_name}</h4>
                    <p className="text-xs font-semibold text-slate-500">
                      {rt.start_point} ➔ {rt.end_point} ({rt.total_distance_km || 0} km • {rt.estimated_duration_mins || 0} mins)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedRouteForStops(rt); setStopForm({ stop_name: '', stop_address: '', latitude: '12.9716', longitude: '77.5946', stop_order: (rt.stops?.length || 0) + 1, estimated_arrival_time: '07:30 AM' }); setIsStopModalOpen(true); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Stop
                    </button>
                    <button onClick={() => { setEditingRoute(rt); setRouteForm(rt); setIsRouteModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRoute(rt._id)} className="p-2 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stops Sequence */}
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Bus Stops ({rt.stops?.length || 0})</span>
                  {(!rt.stops || rt.stops.length === 0) ? (
                    <p className="text-xs text-slate-400 font-medium">No stops added yet for this route.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {rt.stops.map((st) => (
                        <div key={st._id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[10px] font-black text-blue-600 uppercase">Stop {st.stop_order}</span>
                            <p className="font-bold text-slate-800">{st.stop_name}</p>
                            <p className="text-[10px] text-slate-400">ETA: {st.estimated_arrival_time || 'N/A'}</p>
                          </div>
                          <button onClick={() => handleDeleteStop(st._id)} className="text-slate-300 hover:text-rose-600 p-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ALLOCATION */}
      {activeTab === 'allocations' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Student Transport Allocation</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full border border-emerald-200">
                  Assigned: {allocations.length}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400">Assign students to specific bus routes and pickup/drop off points.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Class:</span>
                <select
                  value={selectedClassFilterAllocations}
                  onChange={(e) => setSelectedClassFilterAllocations(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <option value="">-- All Classes --</option>
                  {classesList.map(c => (
                    <option key={c._id} value={c._id}>{c.class_name} {c.section ? `(${c.section})` : ''}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Assign Student Transport
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Student Name</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Assigned Route</th>
                  <th className="py-3.5 px-4">Assigned Bus</th>
                  <th className="py-3.5 px-4">Pickup Stop</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {(() => {
                  const filteredList = selectedClassFilterAllocations
                    ? allocations.filter(a => {
                        const cid = a.class_id?._id || a.class_id;
                        return cid?.toString() === selectedClassFilterAllocations.toString();
                      })
                    : allocations;

                  if (filteredList.length === 0) {
                    return (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">
                          {selectedClassFilterAllocations ? 'No transport allocations found for selected class.' : 'No students assigned to transport yet.'}
                        </td>
                      </tr>
                    );
                  }

                  return filteredList.map((alloc) => (
                    <tr key={alloc._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-800">{alloc.student_id?.student_name || 'N/A'}</td>
                      <td className="py-4 px-4 font-bold text-slate-600">{alloc.class_id?.class_name || alloc.student_id?.class_id?.class_name || 'N/A'}</td>
                      <td className="py-4 px-4 font-bold text-purple-600">{alloc.route_id?.route_name}</td>
                      <td className="py-4 px-4 font-bold text-blue-600">{alloc.bus_id?.bus_name} ({alloc.bus_id?.bus_number})</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">{alloc.pickup_stop_id?.stop_name}</td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => handleRemoveStudentAlloc(alloc._id)} className="p-2 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE TRACKING PANEL */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" /> Live Multi-Bus Fleet Tracking
                </h3>
                <p className="text-xs font-semibold text-slate-400">Monitor live positions, speeds, current/next stops, and ETA across active buses.</p>
              </div>
            </div>

            <BusTrackingMap
              center={activeTrips[0]?.current_latitude ? { lat: activeTrips[0].current_latitude, lng: activeTrips[0].current_longitude } : { lat: 12.9716, lng: 77.5946 }}
              activeBusLocation={activeTrips[0]}
              routeStops={activeTrips[0]?.routeStops || []}
              height="550px"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTrips.map((trip) => (
              <div key={trip._id} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                    <Radio className="w-3 h-3 animate-ping" /> {trip.arrival_status}
                  </span>
                  <button onClick={() => handleForceStopTrip(trip._id)} className="text-xs font-bold text-rose-600 hover:underline">
                    Force Stop Trip
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-800">{trip.bus_id?.bus_name} ({trip.bus_id?.bus_number})</h4>
                  <p className="text-xs font-bold text-slate-400">Driver: {trip.driver_id?.name} ({trip.driver_id?.mobile_number})</p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">PREVIOUS STOP</span>
                    <span className="font-black text-slate-700">{trip.previous_stop}</span>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-[10px] text-blue-600 block font-black">CURRENT STOP</span>
                    <span className="font-black text-blue-700">{trip.current_stop}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">NEXT STOP</span>
                    <span className="font-black text-slate-700">{trip.next_stop}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: TRIP LOGS & HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Trip Logs & History</h3>
            <p className="text-xs font-semibold text-slate-400">Complete historical records of all completed and past bus trips.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Trip ID</th>
                  <th className="py-3.5 px-4">Bus</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Route</th>
                  <th className="py-3.5 px-4">Start Time</th>
                  <th className="py-3.5 px-4">End Time</th>
                  <th className="py-3.5 px-4">Distance</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {tripHistory.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">No past trip history records found.</td>
                  </tr>
                ) : (
                  tripHistory.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-800">{t.trip_id}</td>
                      <td className="py-4 px-4 font-bold">{t.bus_id?.bus_name}</td>
                      <td className="py-4 px-4">{t.driver_id?.name}</td>
                      <td className="py-4 px-4 text-purple-600 font-bold">{t.route_id?.route_name}</td>
                      <td className="py-4 px-4">{new Date(t.start_time).toLocaleString()}</td>
                      <td className="py-4 px-4">{t.end_time ? new Date(t.end_time).toLocaleString() : 'In Progress'}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{t.distance_travelled_km || 0} km</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT BUS */}
      {isBusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
              <button onClick={() => setIsBusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Bus Number / Code *</label>
                <input
                  type="text"
                  value={busForm.bus_number}
                  onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vehicle Registration Number *</label>
                <input
                  type="text"
                  value={busForm.vehicle_reg_number}
                  onChange={(e) => setBusForm({ ...busForm, vehicle_reg_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Bus Name *</label>
                <input
                  type="text"
                  value={busForm.bus_name}
                  onChange={(e) => setBusForm({ ...busForm, bus_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Bus Type</label>
                  <select
                    value={busForm.bus_type}
                    onChange={(e) => setBusForm({ ...busForm, bus_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                    <option value="Mini Bus">Mini Bus</option>
                    <option value="AC Bus">AC Bus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Total Seats *</label>
                  <input
                    type="number"
                    value={busForm.total_seats}
                    onChange={(e) => setBusForm({ ...busForm, total_seats: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsBusModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT DRIVER */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{editingDriver ? 'Edit Driver' : 'Register New Driver'}</h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Driver ID *</label>
                <input
                  type="text"
                  value={driverForm.driver_id}
                  onChange={(e) => setDriverForm({ ...driverForm, driver_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Driver Full Name *</label>
                <input
                  type="text"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Mobile Number (Used for Driver Login) *</label>
                <input
                  type="text"
                  value={driverForm.mobile_number}
                  onChange={(e) => setDriverForm({ ...driverForm, mobile_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Driving License Number *</label>
                <input
                  type="text"
                  value={driverForm.license_number}
                  onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              {!editingDriver && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Driver Portal Password *</label>
                  <input
                    type="password"
                    value={driverForm.password}
                    onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsDriverModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT ROUTE */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">{editingRoute ? 'Edit Route' : 'Create New Route'}</h3>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Route ID *</label>
                <input
                  type="text"
                  value={routeForm.route_id}
                  onChange={(e) => setRouteForm({ ...routeForm, route_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Route Name (e.g. North Route) *</label>
                <input
                  type="text"
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Start Point *</label>
                  <input
                    type="text"
                    value={routeForm.start_point}
                    onChange={(e) => setRouteForm({ ...routeForm, start_point: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">End Point *</label>
                  <input
                    type="text"
                    value={routeForm.end_point}
                    onChange={(e) => setRouteForm({ ...routeForm, end_point: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOP */}
      {isStopModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Add Stop to {selectedRouteForStops?.route_name}</h3>
              <button onClick={() => setIsStopModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStop} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Stop Name *</label>
                <input
                  type="text"
                  value={stopForm.stop_name}
                  onChange={(e) => setStopForm({ ...stopForm, stop_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Stop Order Number *</label>
                  <input
                    type="number"
                    value={stopForm.stop_order}
                    onChange={(e) => setStopForm({ ...stopForm, stop_order: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Estimated Arrival Time</label>
                  <input
                    type="text"
                    placeholder="07:30 AM"
                    value={stopForm.estimated_arrival_time}
                    onChange={(e) => setStopForm({ ...stopForm, estimated_arrival_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsStopModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Add Stop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN DRIVER TO BUS */}
      {isAssignDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Assign Driver to Bus & Route</h3>
              <button onClick={() => setIsAssignDriverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignDriverToBus} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Driver *</label>
                <select
                  value={assignDriverBusForm.driver_id}
                  onChange={(e) => setAssignDriverBusForm({ ...assignDriverBusForm, driver_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.mobile_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Bus *</label>
                <select
                  value={assignDriverBusForm.bus_id}
                  onChange={(e) => setAssignDriverBusForm({ ...assignDriverBusForm, bus_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Bus --</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.bus_name} ({b.bus_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Route (Optional)</label>
                <select
                  value={assignDriverBusForm.route_id}
                  onChange={(e) => setAssignDriverBusForm({ ...assignDriverBusForm, route_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.route_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsAssignDriverModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Assign Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN STUDENT TRANSPORT */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Assign Student Transport</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Class (Filter Students)</label>
                <select
                  value={selectedClassFilterModal}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setSelectedClassFilterModal(cid);
                    setAssignForm(prev => ({ ...prev, student_id: '', admission_number: '', class_id: cid }));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                >
                  <option value="">-- All Classes / Choose Class --</option>
                  {classesList.map(c => (
                    <option key={c._id} value={c._id}>{c.class_name} {c.section ? `(${c.section})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Select Student * {selectedClassFilterModal && `(${studentsList.filter(s => (s.class_id?._id || s.class_id)?.toString() === selectedClassFilterModal.toString()).length} found)`}
                </label>
                <select
                  value={assignForm.student_id}
                  onChange={(e) => {
                    const selected = studentsList.find(s => s._id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      student_id: e.target.value,
                      admission_number: selected?.admission_number || 'N/A',
                      class_id: selected?.class_id?._id || selected?.class_id || selectedClassFilterModal || ''
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {(selectedClassFilterModal
                    ? studentsList.filter(s => (s.class_id?._id || s.class_id)?.toString() === selectedClassFilterModal.toString())
                    : studentsList
                  ).map(s => (
                    <option key={s._id} value={s._id}>
                      {s.student_name} (Roll: {s.roll_no || 'N/A'}, Adm: {s.admission_number || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Route *</label>
                <select
                  value={assignForm.route_id}
                  onChange={(e) => {
                    const selRoute = routes.find(r => r._id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      route_id: e.target.value,
                      bus_id: selRoute?.assigned_bus_id?._id || selRoute?.assigned_bus_id || ''
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.route_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Bus *</label>
                <select
                  value={assignForm.bus_id}
                  onChange={(e) => setAssignForm({ ...assignForm, bus_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Bus --</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.bus_name} ({b.bus_number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Pickup Stop *</label>
                <select
                  value={assignForm.pickup_stop_id}
                  onChange={(e) => setAssignForm({ ...assignForm, pickup_stop_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                >
                  <option value="">-- Choose Stop --</option>
                  {(routes.find(r => r._id === assignForm.route_id)?.stops || []).map(st => (
                    <option key={st._id} value={st._id}>{st.stop_name} (Stop {st.stop_order})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Assign Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransportManagement;
