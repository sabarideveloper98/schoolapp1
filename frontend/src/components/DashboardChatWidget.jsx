import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Search, 
  Paperclip, 
  Smile, 
  Sparkles, 
  CheckCheck, 
  ChevronRight,
  Circle,
  HelpCircle,
  Calendar,
  CheckSquare,
  BookOpen,
  DollarSign,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';
import { toast } from 'react-toastify';

const DashboardChatWidget = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('queries'); // 'queries' | 'messages'
  const [searchTerm, setSearchTerm] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'School AI Assistant',
      role: 'Bot',
      text: `Hello ${user?.name || user?.role || 'User'}! 👋 Welcome to School Hub. How can I assist you on your dashboard today?`,
      timestamp: 'Just now',
      isBot: true
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(2);
  const [contacts, setContacts] = useState([
    { id: 'c1', name: 'Arun Kumar (Math Teacher)', role: 'Teacher', status: 'online', avatar: 'AK' },
    { id: 'c2', name: 'School Admin Desk', role: 'Admin', status: 'online', avatar: 'SA' },
    { id: 'c3', name: 'Priya Sharma (Science Teacher)', role: 'Teacher', status: 'offline', avatar: 'PS' },
    { id: 'c4', name: 'Siva (Parent - Class 10)', role: 'Parent', status: 'online', avatar: 'SP' },
  ]);
  const [selectedContact, setSelectedContact] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedContact]);

  const quickQueries = [
    { label: 'Today\'s Attendance Rate', icon: CheckSquare, query: 'attendance', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' },
    { label: 'Pending Homework', icon: BookOpen, query: 'homework', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' },
    { label: 'Upcoming Exams', icon: Calendar, query: 'exams', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' },
    { label: 'Fee Collection Status', icon: DollarSign, query: 'fees', color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' },
    { label: 'Latest Circulars', icon: Bell, query: 'circulars', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' },
  ];

  const handleQueryClick = (queryItem) => {
    const userMsg = {
      id: Date.now(),
      sender: user?.name || user?.role || 'You',
      role: 'User',
      text: `Show me ${queryItem.label}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };

    let botResponseText = '';
    let actionPath = '';

    if (queryItem.query === 'attendance') {
      botResponseText = '📊 Today\'s overall school attendance stands at 94.5%. 12 out of 12 classes have submitted attendance records.';
      actionPath = user?.role === 'Teacher' ? '/teacher/attendance' : '/school-admin/student-attendance';
    } else if (queryItem.query === 'homework') {
      botResponseText = '📚 There are 3 active homework assignments due this week across Science and Mathematics.';
      actionPath = user?.role === 'Teacher' ? '/teacher/homework' : '/school-admin/homework';
    } else if (queryItem.query === 'exams') {
      botResponseText = '📅 Mid-Term Examinations 2026 start on October 1st. 14 subjects scheduled.';
      actionPath = user?.role === 'Teacher' ? '/teacher/exams' : '/school-admin/exam/report';
    } else if (queryItem.query === 'fees') {
      botResponseText = '💰 Term 1 Fee collection stands at 82.4% with ₹14,50,000 collected.';
      actionPath = '/school-admin/fees/collect';
    } else if (queryItem.query === 'circulars') {
      botResponseText = '📢 Latest Announcement: Annual Sports Day schedule published for next week.';
      actionPath = user?.role === 'Teacher' ? '/teacher/messages' : '/school-admin/dashboard';
    }

    const botMsg = {
      id: Date.now() + 1,
      sender: 'School AI Assistant',
      role: 'Bot',
      text: botResponseText,
      actionLabel: `Go to ${queryItem.label}`,
      actionPath,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: true
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: user?.name || user?.role || 'You',
      role: 'User',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isBot: false
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');

    // Simulate smart bot/contact reply
    setTimeout(() => {
      const replyMsg = {
        id: Date.now() + 1,
        sender: selectedContact ? selectedContact.name : 'School Desk',
        role: selectedContact ? selectedContact.role : 'Bot',
        text: selectedContact 
          ? `Thank you for your message regarding "${currentInput}". I will review and reply shortly.`
          : `Thanks for reaching out! I've noted: "${currentInput}". Our administrative team will update you soon.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: !selectedContact
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 900);
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setUnreadCount(0);
          }}
          className="relative group p-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center ring-4 ring-white"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform rotate-90" />
          ) : (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              <span className="hidden group-hover:inline-block font-extrabold text-xs pr-1 animate-in fade-in slide-in-from-right-2">
                Dashboard Chat
              </span>
            </div>
          )}

          {/* Unread Ping Badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[560px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col z-50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-black text-sm text-white shadow-inner">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900"></span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  School Hub Assistant
                </h3>
                <p className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" /> Active Dashboard Hub
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 shrink-0 gap-1">
            <button
              onClick={() => {
                setActiveTab('queries');
                setSelectedContact(null);
              }}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'queries'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Assist & Quick Bar
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Direct Chat ({contacts.length})
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            
            {/* TAB 1: AI Assistant & Quick Query Bar */}
            {activeTab === 'queries' && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                
                {/* Quick Shortcuts Bar Chips */}
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    ⚡ Quick Dashboard Shortcuts Bar
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickQueries.map((q, idx) => {
                      const Icon = q.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleQueryClick(q)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-102 active:scale-95 ${q.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="space-y-3 pt-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">{msg.sender}</span>
                        <span className="text-[9px] text-slate-300">{msg.timestamp}</span>
                      </div>
                      <div 
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed shadow-2xs ${
                          msg.isBot 
                            ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
                            : 'bg-indigo-600 text-white rounded-tr-none font-semibold'
                        }`}
                      >
                        {msg.text}
                        
                        {/* Optional Interactive Action Link Button */}
                        {msg.actionPath && (
                          <button
                            onClick={() => {
                              navigate(msg.actionPath);
                              setIsOpen(false);
                            }}
                            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            {msg.actionLabel} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {/* TAB 2: Direct Messaging Tab */}
            {activeTab === 'messages' && (
              <div className="flex-1 flex flex-col min-h-0">
                {!selectedContact ? (
                  <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto">
                    {/* Search Contact Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search teacher, staff, parent..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Select Contact to Chat
                    </span>

                    <div className="space-y-2">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full p-3 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                                {contact.avatar}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                                contact.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}></span>
                            </div>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {contact.name}
                              </h4>
                              <p className="text-[10px] font-semibold text-slate-400">{contact.role}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Active Contact Header */}
                    <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                      <button
                        onClick={() => setSelectedContact(null)}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to contacts
                      </button>
                      <span className="text-xs font-bold text-slate-800">{selectedContact.name}</span>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3">
                      <div className="text-center text-[10px] font-bold text-slate-400 bg-slate-100/60 py-1 px-3 rounded-full w-fit mx-auto">
                        Connected with {selectedContact.name}
                      </div>

                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
                        >
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-medium ${
                            msg.isBot 
                              ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none' 
                              : 'bg-indigo-600 text-white rounded-tr-none font-semibold'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder={selectedContact ? `Message ${selectedContact.name}...` : "Ask AI or type message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default DashboardChatWidget;
