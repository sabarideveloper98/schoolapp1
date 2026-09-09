import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  BookOpen, Clock, Download, CheckCircle2, AlertCircle, FileText, ExternalLink, X, Send, Award
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const StudentHomework = () => {
  const [homeworkFeed, setHomeworkFeed] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pending', 'submitted', 'reviewed'
  const [loading, setLoading] = useState(true);

  const [selectedHomeworkForSubmit, setSelectedHomeworkForSubmit] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    submission_notes: '',
    attachment_url: ''
  });

  const { user } = useAuthStore();

  const fetchStudentFeed = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/homework/student-feed', config);
      setHomeworkFeed(res.data || []);
    } catch (error) {
      toast.error('Failed to load homework feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchStudentFeed();
  }, [user]);

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!selectedHomeworkForSubmit) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5005/api/homework/submit', {
        homework_id: selectedHomeworkForSubmit.homework._id,
        ...submissionForm
      }, config);
      toast.success('Homework submitted successfully!');
      setSelectedHomeworkForSubmit(null);
      fetchStudentFeed();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit homework');
    }
  };

  const filteredFeed = homeworkFeed.filter(item => {
    if (activeFilter === 'pending') return item.status === 'Pending';
    if (activeFilter === 'submitted') return item.status === 'Submitted' || item.status === 'Late';
    if (activeFilter === 'reviewed') return item.status === 'Reviewed';
    return true;
  });

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Student Homework Feed...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> My Academic Homework
        </div>
        <h2 className="text-2xl font-black">Student Homework Portal</h2>
        <p className="text-xs text-slate-300">View daily classwork, submit online assignments before due date, & track teacher evaluation scores.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'all', label: `All Assignments (${homeworkFeed.length})` },
          { id: 'pending', label: `Pending (${homeworkFeed.filter(i => i.status === 'Pending').length})` },
          { id: 'submitted', label: `Submitted (${homeworkFeed.filter(i => i.status === 'Submitted' || i.status === 'Late').length})` },
          { id: 'reviewed', label: `Reviewed & Graded (${homeworkFeed.filter(i => i.status === 'Reviewed').length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Homework Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeed.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 font-bold">
            No homework items found in this section.
          </div>
        ) : (
          filteredFeed.map(item => {
            const hw = item.homework;
            const sub = item.submission;
            const rev = item.review;

            return (
              <div key={item.assignment_id} className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-blue-100">
                      {hw.category}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      item.status === 'Reviewed' ? 'bg-purple-100 text-purple-800' :
                      item.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' :
                      item.is_overdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status} {item.is_overdue && '(Overdue)'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800 text-base line-clamp-1">{hw.title}</h3>
                    <p className="text-xs font-bold text-blue-600">{hw.subject_name} • <span className="text-slate-400">By {hw.creator_name}</span></p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {hw.description}
                  </p>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-rose-600">
                      <Clock className="w-3.5 h-3.5" /> Due: {new Date(hw.due_date).toLocaleDateString()}
                    </span>
                    <span>Max Marks: {hw.max_marks}</span>
                  </div>

                  {/* Attachment Link */}
                  {hw.attachment_url && (
                    <div className="pt-2">
                      <a href={hw.attachment_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                        <Download className="w-3.5 h-3.5" /> Download Homework Attachment
                      </a>
                    </div>
                  )}

                  {/* Grade & Remarks if Reviewed */}
                  {rev && (
                    <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-purple-900 flex items-center gap-1">
                          <Award className="w-4 h-4 text-purple-600" /> Score Obtained:
                        </span>
                        <span className="font-black text-purple-700">{rev.marks_obtained} / {hw.max_marks}</span>
                      </div>
                      {rev.remarks && <p className="text-purple-800 text-[11px] font-medium italic">"{rev.remarks}"</p>}
                    </div>
                  )}
                </div>

                {/* Submission Action */}
                <div className="pt-4 border-t border-slate-100">
                  {sub ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 font-black flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Submitted
                      </span>
                      <button
                        onClick={() => {
                          setSelectedHomeworkForSubmit(item);
                          setSubmissionForm({
                            submission_notes: sub.submission_notes || '',
                            attachment_url: sub.attachment_url || ''
                          });
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Update Submission
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedHomeworkForSubmit(item);
                        setSubmissionForm({ submission_notes: '', attachment_url: '' });
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Homework Online
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {selectedHomeworkForSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-800">Submit Homework</h3>
                <p className="text-xs text-slate-400 font-bold">{selectedHomeworkForSubmit.homework?.title}</p>
              </div>
              <button onClick={() => setSelectedHomeworkForSubmit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHomework} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Upload Submission File (PDF / DOCX / JPG / PNG)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File size exceeds 5MB limit');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSubmissionForm({ ...submissionForm, attachment_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {submissionForm.attachment_url && (
                    <button
                      type="button"
                      onClick={() => setSubmissionForm({ ...submissionForm, attachment_url: '' })}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                      Clear File
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Submission Notes & Answers *</label>
                <textarea
                  rows="4"
                  placeholder="Write your notes, steps or answers here..."
                  value={submissionForm.submission_notes}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, submission_notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setSelectedHomeworkForSubmit(null)} className="px-4 py-2.5 font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold">Submit Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHomework;
