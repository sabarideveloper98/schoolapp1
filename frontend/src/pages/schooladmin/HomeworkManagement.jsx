import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BookOpen, Plus, Trash2, Edit3, Eye, FileText, CheckCircle2, Clock,
  AlertCircle, Download, ExternalLink, Calendar, CheckSquare, X, Filter, Sparkles, Award
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const HomeworkManagement = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'grading', 'reports'
  const [stats, setStats] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected item for Grading / Submissions
  const [selectedHomeworkDetails, setSelectedHomeworkDetails] = useState(null);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState(null);

  // Filter state for Reports & List
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { user } = useAuthStore();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subject_name: '',
    description: '',
    instructions: '',
    category: 'Homework',
    assignment_type: 'Class', // 'Student', 'Class', 'Section', 'MultipleClasses'
    assigned_classes: [],
    assigned_section: '',
    assigned_students: [],
    due_date: '',
    attachment_url: '',
    video_link: '',
    max_marks: 100
  });

  // Review / Evaluation Form
  const [reviewForm, setReviewForm] = useState({
    marks_obtained: '',
    remarks: '',
    status: 'Approved'
  });

  const fetchAllData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [statsRes, listRes, classesRes, studentsRes, subjectsRes] = await Promise.all([
        axios.get('http://localhost:5005/api/homework/stats', config),
        axios.get('http://localhost:5005/api/homework/list', config),
        axios.get('http://localhost:5005/api/schooladmin/classes', config),
        axios.get('http://localhost:5005/api/schooladmin/students', config),
        axios.get('http://localhost:5005/api/schooladmin/subjects', config)
      ]);

      setStats(statsRes.data);
      setHomeworkList(listRes.data || []);
      setClassesList(classesRes.data || []);
      setStudentsList(studentsRes.data || []);
      setSubjectsList(subjectsRes.data || []);
    } catch (error) {
      toast.error('Failed to load homework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchAllData();
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingHomework(null);
    setForm({
      title: '',
      subject_name: subjectsList[0]?.subject_name || 'Mathematics',
      description: '',
      instructions: '',
      category: 'Homework',
      assignment_type: 'Class',
      assigned_classes: classesList[0] ? [classesList[0]._id] : [],
      assigned_section: '',
      assigned_students: [],
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      attachment_url: '',
      video_link: '',
      max_marks: 100
    });
    setIsModalOpen(true);
  };

  const handleSaveHomework = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingHomework) {
        await axios.put(`http://localhost:5005/api/homework/update/${editingHomework._id}`, form, config);
        toast.success('Homework updated successfully');
      } else {
        await axios.post('http://localhost:5005/api/homework/create', form, config);
        toast.success('Homework created & assigned successfully');
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save homework');
    }
  };

  const handleDeleteHomework = async (id) => {
    if (!window.confirm('Delete this homework assignment and all student submissions?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`http://localhost:5005/api/homework/delete/${id}`, config);
      toast.success('Homework deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete homework');
    }
  };

  const handleFetchHomeworkDetails = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5005/api/homework/details/${id}`, config);
      setSelectedHomeworkDetails(res.data);
      setActiveTab('grading');
    } catch (error) {
      toast.error('Failed to fetch homework submission details');
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionForReview) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/homework/evaluate', {
        submission_id: selectedSubmissionForReview._id,
        ...reviewForm
      }, config);
      toast.success('Evaluation saved and student notified');
      setSelectedSubmissionForReview(null);
      if (selectedHomeworkDetails) {
        handleFetchHomeworkDetails(selectedHomeworkDetails.homework._id);
      }
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save evaluation');
    }
  };

  const filteredList = homeworkList.filter(hw => {
    if (filterClass && !hw.assigned_classes?.some(c => c._id === filterClass || c === filterClass)) return false;
    if (filterSubject && hw.subject_name.toLowerCase() !== filterSubject.toLowerCase()) return false;
    if (filterCategory && hw.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Loading Homework Management Hub...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Homework & Assignment Hub</h2>
            <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
              Total: {stats?.totalHomework || homeworkList.length}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Assign homework student-wise, class-wise, section-wise, or to multiple classes. Evaluate submissions & track progress.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Homework
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Homework</p>
            <h3 className="text-2xl font-black text-slate-800">{stats?.totalHomework || homeworkList.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Assigned</p>
            <h3 className="text-2xl font-black text-slate-800">{stats?.totalAssignments || 0}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Submissions</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats?.totalSubmissions || 0}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Evaluated</p>
            <h3 className="text-2xl font-black text-purple-600">{stats?.totalReviewed || 0}</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Late / Pending</p>
            <h3 className="text-2xl font-black text-amber-600">{stats?.pendingSubmissions || 0}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'list', label: `All Homework (${filteredList.length})`, icon: BookOpen },
          { id: 'grading', label: `Submissions & Grading ${selectedHomeworkDetails ? `(${selectedHomeworkDetails.submissions?.length || 0})` : ''}`, icon: FileText },
          { id: 'reports', label: 'Homework Reports & Audit', icon: Filter }
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

      {/* TAB 1: ALL HOMEWORK LIST */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Assigned Homework Register</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="">-- All Classes --</option>
                {classesList.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.class || c.class_name || 'Class'} {c.section ? `(${c.section})` : ''}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              >
                <option value="">-- All Categories --</option>
                {['Class Work', 'Homework', 'Project Work', 'Assignment', 'Practical Work', 'Lab Activity'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4 rounded-l-xl">Homework Title</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Target / Scope</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Submissions</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-semibold">
                      No homework items found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((hw) => (
                    <tr key={hw._id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-4 font-black text-slate-800 max-w-xs">
                        <p className="line-clamp-1">{hw.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold">By {hw.creator_name}</p>
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-600">{hw.subject_name}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                          {hw.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600">
                        <span className="font-bold text-purple-600">{hw.assignment_type}: </span>
                        {hw.assignment_type === 'Class' && (hw.assigned_classes[0]?.class || hw.assigned_classes[0]?.class_name || 'Class')}
                        {hw.assignment_type === 'Section' && `${hw.assigned_classes[0]?.class || hw.assigned_classes[0]?.class_name || ''} Sec ${hw.assigned_section}`}
                        {hw.assignment_type === 'MultipleClasses' && `${hw.assigned_classes?.length || 0} Classes`}
                        {hw.assignment_type === 'Student' && `${hw.assigned_students?.length || 1} Selected Student(s)`}
                      </td>
                      <td className="py-4 px-4 font-bold text-rose-600">
                        {new Date(hw.due_date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-black text-emerald-600">{hw.stats?.totalSubmitted || 0}</span> / {hw.stats?.totalAssigned || 0}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleFetchHomeworkDetails(hw._id)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Submissions
                          </button>
                          <button
                            onClick={() => handleDeleteHomework(hw._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMISSIONS & EVALUATION HUB */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          {!selectedHomeworkDetails ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <p className="font-bold text-sm">Select a homework item from "All Homework List" to view student submissions & evaluate work.</p>
              <button onClick={() => setActiveTab('list')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                Go to All Homework List
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Homework Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {selectedHomeworkDetails.homework?.category}
                    </span>
                    <span className="text-xs font-bold text-blue-300">
                      {selectedHomeworkDetails.homework?.subject_name}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-1">{selectedHomeworkDetails.homework?.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{selectedHomeworkDetails.homework?.description}</p>
                </div>

                <div className="text-right text-xs space-y-1">
                  <p className="font-bold text-amber-300">Due Date: {new Date(selectedHomeworkDetails.homework?.due_date).toLocaleDateString()}</p>
                  <p className="font-semibold text-slate-300">Max Marks: {selectedHomeworkDetails.homework?.max_marks}</p>
                  {selectedHomeworkDetails.homework?.attachment_url && (
                    <a href={selectedHomeworkDetails.homework.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 font-bold hover:underline">
                      <Download className="w-3.5 h-3.5" /> Attachment File
                    </a>
                  )}
                </div>
              </div>

              {/* Submissions List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-3.5 px-4 rounded-l-xl">Student Name</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Submission File / Notes</th>
                      <th className="py-3.5 px-4">Marks / Grade</th>
                      <th className="py-3.5 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {selectedHomeworkDetails.assignments?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-semibold">No student assignments found for this homework.</td>
                      </tr>
                    ) : (
                      selectedHomeworkDetails.assignments?.map((assign) => {
                        const sub = selectedHomeworkDetails.submissions?.find(s => s.student_id?._id === assign.student_id?._id || s.student_id === assign.student_id?._id);
                        const rev = selectedHomeworkDetails.reviews?.find(r => r.student_id?._id === assign.student_id?._id || r.student_id === assign.student_id?._id);

                        return (
                          <tr key={assign._id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-4 font-black text-slate-800">
                              {assign.student_id?.student_name || 'Student'}
                              <p className="text-[10px] text-slate-400 font-normal">Roll: {assign.student_id?.roll_no || 'N/A'}</p>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-600">
                              {assign.class_id?.class_name || 'N/A'}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                assign.status === 'Reviewed' ? 'bg-purple-100 text-purple-800' :
                                assign.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' :
                                assign.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {assign.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-xs">
                              {sub ? (
                                <div>
                                  <p className="line-clamp-1 font-medium">{sub.submission_notes || 'Submitted'}</p>
                                  {sub.attachment_url && (
                                    <a href={sub.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline text-[10px] flex items-center gap-1 mt-0.5">
                                      <Download className="w-3 h-3" /> View Submitted File
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">No Submission Yet</span>
                              )}
                            </td>
                            <td className="py-4 px-4 font-black">
                              {rev ? (
                                <span className="text-purple-600">{rev.marks_obtained} / {selectedHomeworkDetails.homework?.max_marks}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {sub ? (
                                <button
                                  onClick={() => {
                                    setSelectedSubmissionForReview(sub);
                                    setReviewForm({
                                      marks_obtained: rev?.marks_obtained || '',
                                      remarks: rev?.remarks || '',
                                      status: rev?.status || 'Approved'
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                                >
                                  {rev ? 'Re-Evaluate' : 'Grade / Evaluate'}
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs font-semibold">Pending</span>
                              )}
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
        </div>
      )}

      {/* TAB 3: HOMEWORK REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Homework Audit & Submission Reports</h3>
              <p className="text-xs font-semibold text-slate-400">Comprehensive overview of homework completion rates and student performance.</p>
            </div>

            <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <h4 className="font-black text-blue-900 text-sm">Homework Completion Rate</h4>
              <h2 className="text-3xl font-black text-blue-600 mt-2">
                {stats?.totalAssignments ? Math.round((stats.totalSubmissions / stats.totalAssignments) * 100) : 0}%
              </h2>
              <p className="text-xs text-blue-700 mt-1 font-semibold">Overall student submission compliance.</p>
            </div>

            <div className="p-6 bg-purple-50/50 border border-purple-100 rounded-2xl">
              <h4 className="font-black text-purple-900 text-sm">Evaluation Rate</h4>
              <h2 className="text-3xl font-black text-purple-600 mt-2">
                {stats?.totalSubmissions ? Math.round((stats.totalReviewed / stats.totalSubmissions) * 100) : 0}%
              </h2>
              <p className="text-xs text-purple-700 mt-1 font-semibold">Teacher review and grading rate.</p>
            </div>

            <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl">
              <h4 className="font-black text-amber-900 text-sm">On-Time Submissions</h4>
              <h2 className="text-3xl font-black text-amber-600 mt-2">
                {stats?.totalSubmissions ? Math.round(((stats.totalSubmissions - stats.totalLate) / stats.totalSubmissions) * 100) : 0}%
              </h2>
              <p className="text-xs text-amber-700 mt-1 font-semibold">Submitted prior to official due date.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT HOMEWORK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">
                {editingHomework ? 'Edit Homework' : 'Create New Homework'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHomework} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Homework Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Chapter 5 - Exercise 5.2"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Subject Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Science, English"
                    value={form.subject_name}
                    onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Category / Type *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  >
                    {['Class Work', 'Homework', 'Project Work', 'Assignment', 'Practical Work', 'Lab Activity'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ASSIGNMENT TYPE SELECTOR */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Assignment Scope / Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Class', label: 'Class-Wise' },
                    { id: 'Section', label: 'Section-Wise' },
                    { id: 'Student', label: 'Individual Student' },
                    { id: 'MultipleClasses', label: 'Multiple Classes' }
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({ ...form, assignment_type: type.id })}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.assignment_type === type.id
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC SELECTION FIELDS BASED ON ASSIGNMENT TYPE */}
              {form.assignment_type === 'Class' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Select Target Class *</label>
                  <select
                    value={form.assigned_classes[0] || ''}
                    onChange={(e) => setForm({ ...form, assigned_classes: [e.target.value] })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classesList.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.class || c.class_name || 'Class'} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.assignment_type === 'Section' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Select Class *</label>
                    <select
                      value={form.assigned_classes[0] || ''}
                      onChange={(e) => setForm({ ...form, assigned_classes: [e.target.value] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                      required
                    >
                      <option value="">-- Choose Class --</option>
                      {classesList.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.class || c.class_name || 'Class'} {c.section ? `(${c.section})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Section Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. A, B, C"
                      value={form.assigned_section}
                      onChange={(e) => setForm({ ...form, assigned_section: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              {form.assignment_type === 'Student' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Select Specific Student *</label>
                  <select
                    value={form.assigned_students[0] || ''}
                    onChange={(e) => setForm({ ...form, assigned_students: [e.target.value] })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  >
                    <option value="">-- Choose Student --</option>
                    {studentsList.map(s => (
                      <option key={s._id} value={s._id}>{s.student_name} (Roll: {s.roll_no || 'N/A'})</option>
                    ))}
                  </select>
                </div>
              )}

              {form.assignment_type === 'MultipleClasses' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Select Multiple Classes *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                    {classesList.map(c => {
                      const isChecked = form.assigned_classes.includes(c._id);
                      return (
                        <label key={c._id} className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, assigned_classes: [...form.assigned_classes, c._id] });
                              } else {
                                setForm({ ...form, assigned_classes: form.assigned_classes.filter(id => id !== c._id) });
                              }
                            }}
                          />
                          {c.class || c.class_name || 'Class'} {c.section ? `(${c.section})` : ''}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description / Problem Statement *</label>
                <textarea
                  rows="3"
                  placeholder="Detailed instructions or questions for students..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    value={form.max_marks}
                    onChange={(e) => setForm({ ...form, max_marks: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Upload Homework Attachment (PDF / DOCX / XLSX / PPT / JPG / PNG)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File size exceeds 5MB limit');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setForm({ ...form, attachment_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {form.attachment_url && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, attachment_url: '' })}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                      Clear File
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
                  {editingHomework ? 'Update Homework' : 'Create & Assign Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVALUATE SUBMISSION */}
      {selectedSubmissionForReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Evaluate Student Submission</h3>
              <button onClick={() => setSelectedSubmissionForReview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Marks Obtained (Max: {selectedHomeworkDetails?.homework?.max_marks}) *</label>
                <input
                  type="number"
                  max={selectedHomeworkDetails?.homework?.max_marks}
                  value={reviewForm.marks_obtained}
                  onChange={(e) => setReviewForm({ ...reviewForm, marks_obtained: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Evaluation Status *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                >
                  <option value="Approved">Approved / Completed</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="Rejected">Rejected / Re-submit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Teacher Remarks & Feedback</label>
                <textarea
                  rows="3"
                  placeholder="Feedback for the student..."
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setSelectedSubmissionForReview(null)} className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold">Save Evaluation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkManagement;
