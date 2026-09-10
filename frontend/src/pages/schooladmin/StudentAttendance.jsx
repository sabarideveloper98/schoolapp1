import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Search, Image as ImageIcon, Save } from 'lucide-react';

const StudentAttendance = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [classes, setClasses] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Applied values (rendered in centering summary)
  const [appliedClassText, setAppliedClassText] = useState('');
  const [appliedSectionText, setAppliedSectionText] = useState('');
  const [appliedDate, setAppliedDate] = useState('');

  // Attendance Records
  const [records, setRecords] = useState([]);
  const [schoolName, setSchoolName] = useState('School');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/schooladmin/classes', config);
        setClasses(data);
        setLoadingConfig(false);

        // Pre-fill first class standard and section if available
        if (data.length > 0) {
          setClassFilter(data[0].class);
          setSectionFilter(data[0]._id);
        }
      } catch (error) {
        toast.error('Failed to load class configuration');
        setLoadingConfig(false);
      }
    };
    if (user?.token) fetchClasses();
  }, [user]);

  // Extract unique class standard names
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Available sections for the selected class standard
  const availableSections = classFilter
    ? classes.filter(c => c.class === classFilter)
    : [];

  // Format date for UI details header (e.g. 20-Aug-2026)
  const formatHeaderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const fetchAttendance = async () => {
    if (!sectionFilter) {
      toast.error('Please select Class and Section');
      return;
    }

    try {
      setLoadingRecords(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const { data } = await axios.get(
        `/api/schooladmin/student-attendance?class_id=${sectionFilter}&date=${date}`,
        config
      );

      setRecords(data.attendance?.records || []);
      setSchoolName(data.school_name || 'School');
      
      // Update centering header text details
      setAppliedClassText(classFilter);
      const matchedSec = classes.find(c => c._id === sectionFilter);
      setAppliedSectionText(matchedSec ? matchedSec.section : '');
      setAppliedDate(date);
      setSearched(true);
      setLoadingRecords(false);
    } catch (error) {
      toast.error('Failed to fetch student attendance logs');
      setLoadingRecords(false);
    }
  };

  // Trigger fetch when initial configurations are loaded
  useEffect(() => {
    if (!loadingConfig && sectionFilter && user?.token) {
      fetchAttendance();
    }
  }, [loadingConfig, user]);

  const handleSearch = () => {
    fetchAttendance();
  };

  const handleSelectAllPresent = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setRecords(prev => prev.map(r => ({ ...r, status: 'Present' })));
    }
  };

  const handleSelectAllAbsent = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setRecords(prev => prev.map(r => ({ ...r, status: 'Absent' })));
    }
  };

  const handleRowStatusChange = (index, status) => {
    setRecords(prev => {
      const next = [...prev];
      next[index] = { ...next[index], status };
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    try {
      setLoadingRecords(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        class_id: sectionFilter,
        date,
        records
      };

      await axios.post('/api/schooladmin/student-attendance', payload, config);
      toast.success('Student attendance saved successfully!');
      setLoadingRecords(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
      setLoadingRecords(false);
    }
  };

  const allPresent = records.length > 0 && records.every(r => r.status === 'Present');
  const allAbsent = records.length > 0 && records.every(r => r.status === 'Absent');

  if (loadingConfig) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading filter templates...</div>;

  return (
    <div className="space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Student Attendance</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-blue-600">Student-attendance</span>
          </div>
        </div>
      </div>

      {/* Class / Section / Date filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
              }}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            >
              <option value="">Select Class</option>
              {uniqueClassNames.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
              disabled={!classFilter}
            >
              <option value="">{classFilter ? 'Select Section' : 'Select Class First'}</option>
              {availableSections.map((s) => (
                <option key={s._id} value={s._id}>{s.section}</option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm cursor-pointer"
            />
          </div>

          {/* Search Button */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Attendance Card */}
      {searched && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-6">
          {/* Centered Summary Headers */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-800">{schoolName}</h3>
            <p className="text-xs font-bold text-slate-500">Attendance For Class : <span className="text-slate-800">{appliedClassText}</span></p>
            <p className="text-xs font-bold text-slate-500">Section : <span className="text-slate-800">{appliedSectionText}</span></p>
            <p className="text-xs font-bold text-slate-400">Period : </p>
            <p className="text-sm font-bold text-blue-650 pt-1">Date : {formatHeaderDate(appliedDate)}</p>
          </div>

          {loadingRecords ? (
            <div className="flex justify-center py-12 text-slate-550 font-medium animate-pulse">Loading class students...</div>
          ) : (
            <div className="space-y-6">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">ADMISSION NUMBER</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/8">ROLL NO.</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">NAME</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-1/8">
                        <div className="flex items-center justify-center gap-2">
                          <span>PRESENT</span>
                          <input
                            type="checkbox"
                            checked={allPresent}
                            onChange={handleSelectAllPresent}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-1/8">
                        <div className="flex items-center justify-center gap-2">
                          <span>ABSENT</span>
                          <input
                            type="checkbox"
                            checked={allAbsent}
                            onChange={handleSelectAllAbsent}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {records.map((record, index) => (
                      <tr key={record.student_id || index} className="hover:bg-slate-50/30 transition-colors duration-150">
                        {/* Admission Number */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-655 tracking-wide">
                          {record.admission_number}
                        </td>

                        {/* Roll No */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                          {record.roll_no}
                        </td>

                        {/* Name & Photo thumbnail */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {record.photo ? (
                              <img src={record.photo} alt={record.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-1">
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-[6px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">No Image</span>
                              </div>
                            )}
                            <div className="text-sm font-bold text-slate-800">{record.name}</div>
                          </div>
                        </td>

                        {/* Present checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={record.status === 'Present'}
                            onChange={() => handleRowStatusChange(index, 'Present')}
                            className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer scale-110"
                          />
                        </td>

                        {/* Absent checkbox */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={record.status === 'Absent'}
                            onChange={() => handleRowStatusChange(index, 'Absent')}
                            className="w-5 h-5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer scale-110"
                          />
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-bold">
                          No students registered in this class standard and section.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              {records.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSaveAttendance}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Attendance
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
