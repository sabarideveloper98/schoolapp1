import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, Award, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

const ExamReport = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Report Data
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSubjects, setReportSubjects] = useState([]);
  const [reportSummary, setReportSummary] = useState([]);
  const [schoolName, setSchoolName] = useState('School');
  const [searched, setSearched] = useState(false);

  // Fetch initial config (Exams & Classes)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [examsRes, classesRes] = await Promise.all([
          axios.get('http://localhost:5005/api/schooladmin/exams', config),
          axios.get('http://localhost:5005/api/schooladmin/classes', config)
        ]);
        setExams(examsRes.data);
        setClasses(classesRes.data);

        if (examsRes.data.length > 0) {
          setSelectedExamId(examsRes.data[0]._id);
        }
        if (classesRes.data.length > 0) {
          setClassFilter(classesRes.data[0].class);
          setSectionFilter(classesRes.data[0]._id);
        }
        setLoadingConfig(false);
      } catch (error) {
        toast.error('Failed to load initial configurations');
        setLoadingConfig(false);
      }
    };
    if (user?.token) fetchConfig();
  }, [user]);

  // Extract unique class names
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Available sections for the selected class standard
  const availableSections = classFilter
    ? classes.filter(c => c.class === classFilter)
    : [];

  // Fetch student dropdown list based on selected class section
  useEffect(() => {
    const fetchStudents = async () => {
      if (!sectionFilter) {
        setStudentsList([]);
        setSelectedStudentId('');
        return;
      }
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5005/api/schooladmin/students', config);
        const filtered = data.filter(s => s.class_id?._id === sectionFilter);
        setStudentsList(filtered);
        setSelectedStudentId(''); // Default to all students
      } catch (error) {
        toast.error('Failed to load class students');
      }
    };
    if (user?.token && sectionFilter) fetchStudents();
  }, [user, sectionFilter]);

  // Generate Report
  const fetchReport = async () => {
    if (!selectedExamId || !sectionFilter) {
      toast.error('Please select Exam, Class, and Section');
      return;
    }

    try {
      setLoadingReport(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let url = `http://localhost:5005/api/schooladmin/exam-report?exam_id=${selectedExamId}&class_id=${sectionFilter}`;
      if (selectedStudentId) {
        url += `&student_id=${selectedStudentId}`;
      }

      const { data } = await axios.get(url, config);
      setReportSubjects(data.subjects || []);
      setReportSummary(data.summary || []);

      // Get School details for layout heading
      const schoolRes = await axios.get('http://localhost:5005/api/schooladmin/students', config); // To trigger school context or fallback
      setSchoolName(user.school_name || 'S1 School');

      setSearched(true);
      setLoadingReport(false);
    } catch (error) {
      toast.error('Failed to generate report');
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (!loadingConfig && sectionFilter && selectedExamId && user?.token) {
      fetchReport();
    }
  }, [loadingConfig, sectionFilter, selectedExamId, selectedStudentId, user]);

  const handleSearch = () => {
    fetchReport();
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats calculators
  const getClassAverage = () => {
    if (reportSummary.length === 0) return 0;
    const sum = reportSummary.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / reportSummary.length);
  };

  const getPassRate = () => {
    if (reportSummary.length === 0) return 0;
    const passes = reportSummary.filter(s => s.grade !== 'F').length;
    return Math.round((passes / reportSummary.length) * 100);
  };

  const getHighestScore = () => {
    if (reportSummary.length === 0) return 0;
    return Math.max(...reportSummary.map(s => s.percentage));
  };

  // Grade color helper
  const getGradeBadgeClass = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-50 text-emerald-650 border-emerald-100';
      case 'A-':
      case 'B':
        return 'bg-blue-50 text-blue-650 border-blue-100';
      case 'C':
        return 'bg-amber-50 text-amber-650 border-amber-100';
      default:
        return 'bg-rose-50 text-rose-600 border-rose-100';
    }
  };

  if (loadingConfig) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading report configurations...</div>;

  return (
    <div className="space-y-6 print:space-y-0 print:bg-white print:p-0">
      
      {/* Header (Hidden when printing) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Exam Report</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-slate-400">Exam</span>
            <span>-</span>
            <span className="text-blue-600">Exam Report</span>
          </div>
        </div>
        {searched && reportSummary.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-slate-555 hover:bg-slate-50 text-slate-700 border border-slate-150 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        )}
      </div>

      {/* Filters (Hidden when printing) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
          {/* Exam Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white sm:text-sm cursor-pointer"
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>{exam.name}</option>
              ))}
            </select>
          </div>

          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
              }}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white sm:text-sm cursor-pointer"
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
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white sm:text-sm cursor-pointer"
              disabled={!classFilter}
            >
              <option value="">{classFilter ? 'Select Section' : 'Select Class First'}</option>
              {availableSections.map((s) => (
                <option key={s._id} value={s._id}>{s.section}</option>
              ))}
            </select>
          </div>

          {/* Student Select (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Student (Optional)</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:bg-white sm:text-sm cursor-pointer"
              disabled={!sectionFilter}
            >
              <option value="">All Students (Class Report)</option>
              {studentsList.map(s => (
                <option key={s._id} value={s._id}>{s.student_name}</option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loadingReport && (
        <div className="flex justify-center py-12 text-slate-550 font-medium print:hidden">Generating Reports...</div>
      )}

      {/* Reports Presentations */}
      {searched && !loadingReport && (
        <div className="space-y-6">
          
          {/* Class Summary Stats Widgets (Hidden when printing or when individual selected) */}
          {!selectedStudentId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
              {/* Average */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Class Average</span>
                  <span className="text-2xl font-black text-slate-800 mt-0.5 block">{getClassAverage()}%</span>
                </div>
              </div>

              {/* Pass Rate */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Pass Rate</span>
                  <span className="text-2xl font-black text-slate-800 mt-0.5 block">{getPassRate()}%</span>
                </div>
              </div>

              {/* Highest Score */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-650">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Score</span>
                  <span className="text-2xl font-black text-slate-800 mt-0.5 block">{getHighestScore()}%</span>
                </div>
              </div>
            </div>
          )}

          {/* REPORT MODE 1: CLASS-WIDE MATRIX TABLE */}
          {!selectedStudentId ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 overflow-hidden print:border-none print:shadow-none print:p-0">
              <h3 className="text-lg font-black text-slate-800 mb-6 print:block hidden text-center uppercase tracking-wide">
                Class Exam Summary Report - {schoolName}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/12">ROLL NO.</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">NAME</th>
                      {reportSubjects.map((sub) => (
                        <th key={sub._id} className="px-6 py-4 text-center text-xs font-bold text-slate-550 uppercase tracking-wider">
                          {sub.name}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">PERCENTAGE</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">GRADE</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider print:hidden">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportSummary.map((student) => (
                      <tr key={student.student_id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                          {student.roll_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          {student.name}
                        </td>
                        {reportSubjects.map((sub) => {
                          const matchScore = student.subject_marks.find(sm => sm.subject_id === sub._id);
                          return (
                            <td key={sub._id} className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-600">
                              {matchScore ? matchScore.marks_obtained : '-'}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-800">
                          {student.total_obtained} / {student.total_max}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600">
                          {student.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getGradeBadgeClass(student.grade)}`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm print:hidden">
                          <button
                            onClick={() => setSelectedStudentId(student.student_id)}
                            className="text-blue-600 hover:text-blue-500 font-bold text-xs flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            Report Card
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reportSummary.length === 0 && (
                      <tr>
                        <td colSpan={5 + reportSubjects.length} className="px-6 py-12 text-center text-slate-400 font-bold">
                          No marks entered for this exam in this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* REPORT MODE 2: INDIVIDUAL STUDENT SCORECARD (PRINT LAYOUT OPTIMIZED) */
            reportSummary.map((student) => {
              const matchedClass = classes.find(c => c._id === sectionFilter);
              const matchedExam = exams.find(e => e._id === selectedExamId);

              return (
                <div 
                  key={student.student_id} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-12 max-w-3xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:mx-0 print:w-full relative"
                  id="printable-scorecard"
                >
                  
                  {/* Scorecard Header Block */}
                  <div className="text-center space-y-2 pb-6 border-b-2 border-slate-100">
                    <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">{schoolName}</h1>
                    <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">Academic Report Card</p>
                    <div className="inline-block bg-blue-50 text-blue-650 font-black text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full border border-blue-100 mt-2">
                      {matchedExam ? matchedExam.name : 'Terminal Exam'}
                    </div>
                  </div>

                  {/* Student profile metadata */}
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1.5">
                      <p className="text-slate-450 font-bold text-xs">STUDENT NAME</p>
                      <p className="text-slate-800 font-black">{student.name}</p>
                      
                      <p className="text-slate-450 font-bold text-xs pt-3">ADMISSION NUMBER</p>
                      <p className="text-slate-705 font-bold tracking-wide">{student.admission_number}</p>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <p className="text-slate-450 font-bold text-xs">CLASS & SECTION</p>
                      <p className="text-slate-800 font-black">
                        Class {matchedClass ? matchedClass.class : ''} - Section {matchedClass ? matchedClass.section : ''}
                      </p>
                      
                      <p className="text-slate-450 font-bold text-xs pt-3">ROLL NUMBER</p>
                      <p className="text-slate-705 font-bold">{student.roll_no}</p>
                    </div>
                  </div>

                  {/* Marks detail table */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SUBJECT CODE</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SUBJECT NAME</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">MARKS OBTAINED</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL MARKS</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">GRADE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {student.subject_marks.map((sm) => (
                          <tr key={sm.subject_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 uppercase">
                              {sm.subject_code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                              {sm.subject_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black text-slate-700">
                              {sm.marks_obtained}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-slate-400">
                              {sm.total_marks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getGradeBadgeClass(sm.grade)}`}>
                                {sm.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary aggregation metrics */}
                  <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl grid grid-cols-4 gap-6 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</span>
                      <span className="text-md font-black text-slate-800 mt-1 block">
                        {student.total_obtained} / {student.total_max}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Percentage</span>
                      <span className="text-md font-black text-blue-600 mt-1 block">{student.percentage}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Grade</span>
                      <span className="text-md font-black text-slate-800 mt-1 block">
                        <span className={`px-2.5 py-0.5 rounded border ${getGradeBadgeClass(student.grade)}`}>
                          {student.grade}
                        </span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                      <span className="text-md font-black mt-1 block">
                        {student.grade === 'F' ? (
                          <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded text-xs">FAIL</span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded text-xs">PASS</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Signatures block (Visible when printing) */}
                  <div className="grid grid-cols-2 gap-12 pt-16 text-center text-xs font-bold text-slate-500">
                    <div className="space-y-4">
                      <div className="border-b border-slate-300 w-44 mx-auto"></div>
                      <p>CLASS TEACHER SIGNATURE</p>
                    </div>
                    <div className="space-y-4">
                      <div className="border-b border-slate-300 w-44 mx-auto"></div>
                      <p>PRINCIPAL SIGNATURE</p>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ExamReport;
