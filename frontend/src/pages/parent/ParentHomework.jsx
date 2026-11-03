import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useParentChildStore from '../../store/useParentChildStore';
import ChildSelector from '../../components/ChildSelector';

const ParentHomework = () => {
  const [childHomeworkFeed, setChildHomeworkFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { selectedChildId, getSelectedChild } = useParentChildStore();

  const selectedChild = getSelectedChild();

  const fetchChildHomework = async () => {
    if (!selectedChildId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`/api/homework/student-feed?student_id=${selectedChildId}`, config);
      setChildHomeworkFeed(res.data || []);
    } catch (error) {
      toast.error('Failed to load child homework feed');
      setChildHomeworkFeed([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && selectedChildId) {
      fetchChildHomework();
    }
  }, [user, selectedChildId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Child Selector */}
      <ChildSelector
        title="📚 Child Homework & Assignments"
        subtitle={selectedChild ? `Viewing assignments for ${selectedChild.student_name} (Class ${selectedChild.class_id?.class || selectedChild.class || ''}-${selectedChild.class_id?.section || selectedChild.section || ''})` : 'Select a child to view assigned homework and submission status'}
      />

      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Parent Monitoring Center
        </div>
        <h2 className="text-2xl font-black">
          {selectedChild ? `${selectedChild.student_name}'s Homework & Progress` : 'Child Homework Progress'}
        </h2>
        <p className="text-xs text-slate-300">
          Track active assignments, submission status, deadlines, and teacher evaluation marks for your selected child.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-100 shadow-sm">
          Loading Child Homework Feed...
        </div>
      ) : (
        <>
          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Assigned Homework</p>
              <h3 className="text-2xl font-black text-slate-800">{childHomeworkFeed.length}</h3>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Completed / Submitted</p>
              <h3 className="text-2xl font-black text-emerald-600">
                {childHomeworkFeed.filter(i => i.status === 'Submitted' || i.status === 'Reviewed').length}
              </h3>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Due</p>
              <h3 className="text-2xl font-black text-amber-600">
                {childHomeworkFeed.filter(i => i.status === 'Pending').length}
              </h3>
            </div>
          </div>

          {/* Homework List */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">
                Homework Feed {selectedChild ? `– ${selectedChild.student_name}` : ''}
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {childHomeworkFeed.length} {childHomeworkFeed.length === 1 ? 'task' : 'tasks'} found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {childHomeworkFeed.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700">No Homework Found</h4>
                  <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
                    There is currently no homework assigned for {selectedChild ? selectedChild.student_name : 'this child'}.
                  </p>
                </div>
              ) : (
                childHomeworkFeed.map(item => {
                  const hw = item.homework || {};
                  const rev = item.review;

                  return (
                    <div key={item.assignment_id || hw._id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                          {hw.category || 'Homework'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.status === 'Reviewed' ? 'bg-purple-100 text-purple-800' :
                          item.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status || 'Pending'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-slate-800 text-base">{hw.title}</h4>
                        <p className="text-xs font-bold text-blue-600">
                          {hw.subject_name || 'Subject'} • <span className="text-slate-400">By {hw.creator_name || 'Teacher'}</span>
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 font-medium line-clamp-2">{hw.description}</p>

                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 text-rose-600">
                          <Clock className="w-3.5 h-3.5" /> Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                        <span>
                          Score: <strong className="text-purple-600">{rev ? `${rev.marks_obtained}/${hw.max_marks || 100}` : '-'}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentHomework;
