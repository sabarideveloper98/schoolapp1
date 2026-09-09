import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BookOpen, Clock, Download, CheckCircle2, Award, Calendar } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const ParentHomework = () => {
  const [childHomeworkFeed, setChildHomeworkFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  const fetchChildHomework = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5005/api/homework/student-feed', config);
      setChildHomeworkFeed(res.data || []);
    } catch (error) {
      toast.error('Failed to load child homework feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchChildHomework();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Child Homework Dashboard...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Parent Monitoring Center
        </div>
        <h2 className="text-2xl font-black">Child Homework & Assignment Progress</h2>
        <p className="text-xs text-slate-300">Track your child's active homework assignments, upcoming due dates, submission status & teacher evaluation remarks.</p>
      </div>

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
        <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Child's Homework Feed</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childHomeworkFeed.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 font-semibold">
              No homework assigned to your child yet.
            </div>
          ) : (
            childHomeworkFeed.map(item => {
              const hw = item.homework;
              const sub = item.submission;
              const rev = item.review;

              return (
                <div key={item.assignment_id} className="p-5 border border-slate-100 bg-slate-50/50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      {hw.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      item.status === 'Reviewed' ? 'bg-purple-100 text-purple-800' :
                      item.status === 'Submitted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-800 text-base">{hw.title}</h4>
                    <p className="text-xs font-bold text-blue-600">{hw.subject_name} • <span className="text-slate-400">By {hw.creator_name}</span></p>
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2">{hw.description}</p>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 text-rose-600">
                      <Clock className="w-3.5 h-3.5" /> Due: {new Date(hw.due_date).toLocaleDateString()}
                    </span>
                    <span>Score: <strong className="text-purple-600">{rev ? `${rev.marks_obtained}/${hw.max_marks}` : '-'}</strong></span>
                  </div>

                  {rev?.remarks && (
                    <div className="p-2.5 bg-purple-50 rounded-xl text-xs text-purple-900 font-medium italic border border-purple-100">
                      Teacher Remarks: "{rev.remarks}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentHomework;
