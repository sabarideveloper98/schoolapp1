import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { MessageSquarePlus } from 'lucide-react';

const TeacherMessages = () => {
  const [messages, setMessages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuthStore();
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      receiver_type: 'Class',
      receiver_ids: []
    }
  });

  const receiverType = watch('receiver_type');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [msgRes, clsRes, stdRes] = await Promise.all([
          axios.get('/api/teacher/messages', config),
          axios.get('/api/teacher/classes', config),
          axios.get('/api/teacher/students', config)
        ]);
        
        setMessages(msgRes.data);
        setClasses(clsRes.data);
        setStudents(stdRes.data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // Ensure receiver_ids is always an array
      const payload = {
        ...data,
        receiver_ids: Array.isArray(data.receiver_ids) ? data.receiver_ids : [data.receiver_ids]
      };

      await axios.post('/api/teacher/messages', payload, config);
      toast.success('Message sent successfully!');
      
      setIsFormOpen(false);
      reset();
      
      // Refresh messages
      const msgRes = await axios.get('/api/teacher/messages', config);
      setMessages(msgRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  if (loading) return <div className="flex justify-center py-12">Loading messages...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Messages & Announcements</h2>
          <p className="text-slate-400 text-xs font-bold mt-1">Communicate with entire class groups or individual parent contacts.</p>
        </div>
        <button 
          onClick={() => { reset(); setIsFormOpen(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_4px_12px_rgba(37,99,235,0.1)] cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" /> New Message
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100 shadow-inner">
          <h3 className="text-md font-bold mb-5 text-slate-800">Compose Message</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Send To (Type)</label>
              <select 
                {...register('receiver_type', { required: 'Required' })}
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
              >
                <option value="Class">Group Chat (Entire Class)</option>
                <option value="Student">Single Chat (Specific Student/Parent)</option>
              </select>
            </div>

            {receiverType === 'Class' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Class</label>
                <select 
                  {...register('receiver_ids', { required: 'Please select a class' })}
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.class} - {c.section}</option>
                  ))}
                </select>
                {errors.receiver_ids && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.receiver_ids.message}</p>}
              </div>
            )}

            {receiverType === 'Student' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Student</label>
                <select 
                  {...register('receiver_ids', { required: 'Please select a student' })}
                  className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm cursor-pointer"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.student_name} (Parent: {s.parent_name})</option>
                  ))}
                </select>
                {errors.receiver_ids && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.receiver_ids.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
              <input 
                {...register('title', { required: 'Title is required' })}
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Message Subject"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
              <textarea 
                {...register('message', { required: 'Message body is required' })}
                rows="4"
                className="mt-1 block w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="Type your message here..."
              ></textarea>
              {errors.message && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.message.message}</p>}
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
              >
                Send Message
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
          <h3 className="font-bold text-slate-800">Sent Messages</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-semibold">No messages sent yet.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="p-6 hover:bg-slate-50/50 transition-colors duration-150">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-bold text-slate-800">{msg.title}</h4>
                  <span className="text-xs font-bold text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-600 text-sm whitespace-pre-wrap mb-3 leading-relaxed">{msg.message}</p>
                <div className="px-2.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold inline-flex items-center">
                  <span className="opacity-75 mr-1">To:</span> 
                  {msg.receiver_type === 'Class' ? 'Class Group' : 'Individual Student'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMessages;
