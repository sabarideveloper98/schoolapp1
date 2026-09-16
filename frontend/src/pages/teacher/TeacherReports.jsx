import { useState, useEffect } from 'react';
import SearchableSelect from '../../components/SearchableSelect';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  CheckSquare, 
  Award, 
  FileText, 
  BarChart2, 
  Filter
} from 'lucide-react';
import { toast } from 'react-toastify';

const TeacherReports = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [reportType, setReportType] = useState('attendance'); // attendance | marks | homework | performance
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/teacher/classes', config);
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0]._id);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load classes');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      generateReport();
    }
  }, [selectedClass, reportType]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/teacher/reports?classId=${selectedClass}&type=${reportType}`, config);
      setReportData(data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to generate report');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return toast.error('No data to export');
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'attendance') {
      csvContent += 'Student Name,Roll No,Total Present,Total Absent,Attendance %\n';
      reportData.forEach(r => {
        csvContent += `"${r.name}","${r.roll_no || ''}",${r.present || 0},${r.absent || 0},"${r.percentage || 0}%"\n`;
      });
    } else {
      csvContent += 'Student Name,Roll No,Subject,Marks Obtained,Max Marks,Percentage\n';
      reportData.forEach(r => {
        csvContent += `"${r.name}","${r.roll_no || ''}","${r.subject || ''}",${r.marks || 0},${r.maxMarks || 100},"${r.percentage || 0}%"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_report_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> Academic Reports & Analytics
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">Generate printable & exportable class reports for attendance and marks.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Selector Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Class</label>
          <SearchableSelect
            options={classes.map(c => ({
              value: c._id,
              label: `Class ${c.class} - ${c.section}`
            }))}
            value={selectedClass}
            onChange={(val) => setSelectedClass(val)}
            placeholder="Search & select class..."
            searchPlaceholder="Search class..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Report Module</label>
          <SearchableSelect
            options={[
              { value: 'attendance', label: 'Class Attendance Summary' },
              { value: 'marks', label: 'Exam Marks & Rank Sheet' },
              { value: 'homework', label: 'Homework Submission Log' }
            ]}
            value={reportType}
            onChange={(val) => setReportType(val)}
            placeholder="Select report module..."
          />
        </div>
      </div>

      {/* Generated Report Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6 pb-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">
            {reportType === 'attendance' ? 'Student Attendance Summary Report' : 'Exam Performance & Rank Sheet'}
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Academic Year 2026-2027 | Generated by {user?.name}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                {reportType === 'attendance' ? (
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Present Days</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Absent Days</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Attendance %</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Subject</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Marks</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Score %</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.roll_no || row.admission_no || '-'}</td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-800">{row.name}</td>
                    {reportType === 'attendance' ? (
                      <>
                        <td className="px-6 py-4 text-center text-xs font-extrabold text-emerald-600">{row.present || 0}</td>
                        <td className="px-6 py-4 text-center text-xs font-extrabold text-rose-600">{row.absent || 0}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                            {row.percentage || 100}%
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{row.subject || 'All Subjects'}</td>
                        <td className="px-6 py-4 text-center text-xs font-extrabold text-indigo-600">{row.marks || 0} / {row.maxMarks || 100}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                            {row.percentage || 0}%
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No report records found for this selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReports;
