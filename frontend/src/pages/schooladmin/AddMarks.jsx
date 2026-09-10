import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Save, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';

const AddMarks = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamTerm, setNewExamTerm] = useState('First Term');
  const [creatingExam, setCreatingExam] = useState(false);

  // Subject checklist states
  const [allSubjects, setAllSubjects] = useState([]); // All subjects returned for the class
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  // Students & Marks entry list
  const [studentsMarks, setStudentsMarks] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searched, setSearched] = useState(false);

  // Fetch initial config (Exams & Classes)
  const fetchConfig = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [examsRes, classesRes] = await Promise.all([
        axios.get('/api/schooladmin/exams', config),
        axios.get('/api/schooladmin/classes', config)
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
      toast.error('Failed to load initial configuration');
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchConfig();
    }
  }, [user]);

  // Extract unique class standard names
  const uniqueClassNames = [...new Set(classes.map(c => c.class))];

  // Available sections for the selected class standard
  const availableSections = classFilter
    ? classes.filter(c => c.class === classFilter)
    : [];

  // Create new exam handler
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newExamName.trim()) {
      toast.error('Exam name is required');
      return;
    }

    try {
      setCreatingExam(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        '/api/schooladmin/exams',
        { name: newExamName, term: newExamTerm },
        config
      );

      toast.success('Exam created successfully');
      setExams(prev => [data, ...prev]);
      setSelectedExamId(data._id);
      setNewExamName('');
      setShowExamModal(false);
      setCreatingExam(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam');
      setCreatingExam(false);
    }
  };

  // Search students and subjects
  const handleSearch = async () => {
    if (!selectedExamId || !sectionFilter) {
      toast.error('Please select Exam, Class, and Section');
      return;
    }

    try {
      setLoadingSearch(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(
        `/api/schooladmin/exam-marks?exam_id=${selectedExamId}&class_id=${sectionFilter}`,
        config
      );

      setAllSubjects(data.subjects || []);
      // Check first two subjects by default if available
      if (data.subjects && data.subjects.length > 0) {
        setSelectedSubjectIds(data.subjects.slice(0, 3).map(s => s._id));
      } else {
        setSelectedSubjectIds([]);
      }

      setStudentsMarks(data.students || []);
      setSearched(true);
      setLoadingSearch(false);
    } catch (error) {
      toast.error('Failed to load students and marks list');
      setLoadingSearch(false);
    }
  };

  // Toggle subject selection
  const handleToggleSubject = (subId) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  // Mark value input changes
  const handleMarkChange = (studentId, subId, value) => {
    setStudentsMarks(prev =>
      prev.map(s => {
        if (s.student_id === studentId) {
          const marksList = [...s.marks];
          const matchIdx = marksList.findIndex(m => m.subject_id === subId);
          const score = value === '' ? 0 : Number(value);

          if (matchIdx > -1) {
            marksList[matchIdx] = { ...marksList[matchIdx], marks_obtained: score };
          } else {
            marksList.push({ subject_id: subId, marks_obtained: score, total_marks: 100 });
          }
          return { ...s, marks: marksList };
        }
        return s;
      })
    );
  };

  // Bulk save marks
  const handleSaveMarks = async () => {
    try {
      setLoadingSearch(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const payload = {
        exam_id: selectedExamId,
        class_id: sectionFilter,
        student_marks: studentsMarks.map(s => {
          // Send marks only for subjects that are currently checked
          const filteredMarks = s.marks.filter(m => selectedSubjectIds.includes(m.subject_id));
          
          // Ensure every checked subject has an entry
          selectedSubjectIds.forEach(subId => {
            const hasMark = filteredMarks.some(m => m.subject_id === subId);
            if (!hasMark) {
              filteredMarks.push({ subject_id: subId, marks_obtained: 0, total_marks: 100 });
            }
          });

          return {
            student_id: s.student_id,
            marks: filteredMarks
          };
        })
      };

      await axios.post('/api/schooladmin/exam-marks', payload, config);
      toast.success('Student marks saved successfully!');
      setLoadingSearch(false);
    } catch (error) {
      toast.error('Failed to save student marks');
      setLoadingSearch(false);
    }
  };

  const getMarkValue = (studentMarks, subId) => {
    const match = studentMarks.find(m => m.subject_id === subId);
    return match ? match.marks_obtained : '';
  };

  if (loadingConfig) return <div className="flex justify-center py-12 text-slate-550 font-medium">Loading form configuration...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Add Marks</h2>
          <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="cursor-pointer hover:text-blue-500" onClick={() => navigate('/school-admin/dashboard')}>Home</span>
            <span>-</span>
            <span className="text-slate-400">Exam</span>
            <span>-</span>
            <span className="text-blue-600">Add Marks</span>
          </div>
        </div>
        <button
          onClick={() => setShowExamModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </button>
      </div>

      {/* Selectors Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
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

      {/* Marks Matrix Section */}
      {searched && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-8 space-y-8">
          {/* Subjects checklist selectors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-550 uppercase tracking-wider">Select Subjects to Enter Marks</h3>
            <div className="flex flex-wrap gap-4">
              {allSubjects.map((sub) => {
                const isSelected = selectedSubjectIds.includes(sub._id);
                return (
                  <button
                    key={sub._id}
                    onClick={() => handleToggleSubject(sub._id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    {sub.name} <span className="text-[10px] opacity-75">({sub.code})</span>
                  </button>
                );
              })}
              {allSubjects.length === 0 && (
                <p className="text-sm font-bold text-slate-400">No subjects configured for this class.</p>
              )}
            </div>
          </div>

          {loadingSearch ? (
            <div className="flex justify-center py-12 text-slate-550 font-medium">Processing student sheets...</div>
          ) : (
            <div className="space-y-6">
              {/* Dynamic Marks Grid Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/12">ROLL NO.</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">NAME</th>
                      {allSubjects.filter(sub => selectedSubjectIds.includes(sub._id)).map((sub) => (
                        <th key={sub._id} className="px-6 py-4 text-center text-xs font-bold text-slate-550 uppercase tracking-wider">
                          {sub.name} <span className="block text-[9px] font-medium text-slate-400">({sub.code})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {studentsMarks.map((record) => (
                      <tr key={record.student_id} className="hover:bg-slate-50/30 transition-colors">
                        {/* Roll number */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700">
                          {record.roll_no}
                        </td>

                        {/* Photo + Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {record.photo ? (
                              <img src={record.photo} alt={record.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-150 flex flex-col items-center justify-center p-1">
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div className="text-sm font-bold text-slate-800">{record.name}</div>
                          </div>
                        </td>

                        {/* Subject Marks inputs */}
                        {allSubjects.filter(sub => selectedSubjectIds.includes(sub._id)).map((sub) => (
                          <td key={sub._id} className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="inline-flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={getMarkValue(record.marks, sub._id)}
                                onChange={(e) => handleMarkChange(record.student_id, sub._id, e.target.value)}
                                className="w-20 h-10 px-3 text-center text-slate-800 bg-slate-550 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white sm:text-xs font-bold"
                                placeholder="Marks"
                              />
                              <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {studentsMarks.length === 0 && (
                      <tr>
                        <td colSpan={2 + selectedSubjectIds.length} className="px-6 py-12 text-center text-slate-400 font-bold">
                          No students found in this class section.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              {studentsMarks.length > 0 && selectedSubjectIds.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSaveMarks}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.15)] flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Marks
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="relative bg-white rounded-2xl w-full max-w-md border border-slate-100 shadow-2xl p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-800">Create Exam Record</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Exam Name *</label>
                <input
                  type="text"
                  value={newExamName}
                  onChange={(e) => setNewExamName(e.target.value)}
                  className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 sm:text-sm"
                  placeholder="e.g. First Term Exam"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Term</label>
                <select
                  value={newExamTerm}
                  onChange={(e) => setNewExamTerm(e.target.value)}
                  className="block w-full h-12 px-4 text-slate-800 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white sm:text-sm cursor-pointer"
                >
                  <option value="First Term">First Term</option>
                  <option value="Mid Term">Mid Term</option>
                  <option value="Final Term">Final Term</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-100 text-slate-500 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExam}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.15)] transition cursor-pointer flex items-center gap-1.5"
                >
                  {creatingExam ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddMarks;
