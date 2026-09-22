import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckSquare, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Bell, 
  FileText, 
  Users, 
  ChevronRight,
  Filter,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardAnalyticsBar = ({ role = 'SchoolAdmin' }) => {
  const navigate = useNavigate();
  const [activeTimeframe, setActiveTimeframe] = useState('Weekly'); // 'Weekly' | 'Monthly'
  const [hoveredBar, setHoveredBar] = useState(null);

  // Class Attendance Bar Chart Data
  const attendanceBarData = [
    { class: 'Class 1', percent: 96, present: 24, total: 25 },
    { class: 'Class 2', percent: 92, present: 23, total: 25 },
    { class: 'Class 3', percent: 88, present: 22, total: 25 },
    { class: 'Class 4', percent: 96, present: 24, total: 25 },
    { class: 'Class 5', percent: 84, present: 21, total: 25 },
    { class: 'Class 6', percent: 92, present: 23, total: 25 },
    { class: 'Class 7', percent: 78, present: 19, total: 25 },
    { class: 'Class 8', percent: 96, present: 24, total: 25 },
    { class: 'Class 9', percent: 90, present: 27, total: 30 },
    { class: 'Class 10', percent: 95, present: 28, total: 30 },
    { class: 'Class 11', percent: 87, present: 26, total: 30 },
    { class: 'Class 12', percent: 93, present: 28, total: 30 },
  ];

  const quickActionItems = [
    { label: 'Take Attendance', icon: CheckSquare, path: role === 'Teacher' ? '/teacher/attendance' : '/school-admin/student-attendance', color: 'bg-emerald-500 text-white hover:bg-emerald-600' },
    { label: 'Add Exam Marks', icon: FileText, path: role === 'Teacher' ? '/teacher/exams' : '/school-admin/exam/add-marks', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
    { label: 'Send Notice', icon: Bell, path: role === 'Teacher' ? '/teacher/messages' : '/school-admin/dashboard', color: 'bg-amber-500 text-white hover:bg-amber-600' },
    { label: 'Collect Fees', icon: DollarSign, path: '/school-admin/fees/collect', color: 'bg-purple-600 text-white hover:bg-purple-700' },
    { label: 'View Timetable', icon: Calendar, path: role === 'Teacher' ? '/teacher/timetable' : '/school-admin/timetable/dashboard', color: 'bg-blue-600 text-white hover:bg-blue-700' },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Dashboard Quick Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">Quick Dashboard Action Bar</h3>
            <p className="text-[11px] font-semibold text-slate-400">One-click shortcuts to key operational modules</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {quickActionItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-95 ${item.color}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Analytics Bar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Class Attendance Bar Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Class Attendance Bar Chart</h3>
                <p className="text-xs font-bold text-slate-400">Daily attendance percentage breakdown per class</p>
              </div>
            </div>

            {/* Timeframe Toggle Buttons */}
            <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTimeframe('Weekly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTimeframe === 'Weekly' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTimeframe('Monthly')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTimeframe === 'Monthly' ? 'bg-white text-indigo-600 shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* SVG/Tailwind Animated Bar Visualization */}
          <div className="h-64 pt-6 flex items-end justify-between gap-2 px-2 relative">
            
            {/* Background Grid Lines */}
            <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-300 w-full flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500">100%</div>
              <div className="border-b border-slate-300 w-full flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500">75%</div>
              <div className="border-b border-slate-300 w-full flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500">50%</div>
              <div className="border-b border-slate-300 w-full flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500">25%</div>
            </div>

            {/* Interactive Bars */}
            {attendanceBarData.map((item, idx) => {
              const barHeightPercent = `${item.percent}%`;
              let barBgColor = 'bg-gradient-to-t from-emerald-600 to-emerald-400';
              if (item.percent < 80) barBgColor = 'bg-gradient-to-t from-rose-600 to-rose-400';
              else if (item.percent < 90) barBgColor = 'bg-gradient-to-t from-amber-500 to-amber-300';

              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center group relative z-10"
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip Popup on Hover */}
                  {hoveredBar?.class === item.class && (
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-xl shadow-xl z-30 whitespace-nowrap animate-in fade-in zoom-in-95">
                      {item.class}: <span className="text-emerald-400">{item.percent}%</span> ({item.present}/{item.total} Present)
                    </div>
                  )}

                  <div className="w-full bg-slate-100 rounded-t-xl h-44 flex items-end overflow-hidden p-0.5">
                    <div 
                      style={{ height: barHeightPercent }}
                      className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${barBgColor}`}
                    />
                  </div>

                  <span className="text-[10px] font-black text-slate-500 mt-2 truncate w-full text-center">
                    C{idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bar Chart Legend */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs font-bold text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> 90%+ Optimal Attendance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span> 80-89% Moderate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Below 80% Action Required
            </span>
          </div>
        </div>

        {/* Operational Metrics Progress Bars (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Operational Metrics
            </h3>
            <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Live Bars</span>
          </div>

          {/* Progress Bar 1: Fee Collection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Fee Collection Completion</span>
              <span className="text-indigo-600 font-extrabold">82.4%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: '82.4%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Collected: ₹14.5L</span>
              <span>Target: ₹17.6L</span>
            </div>
          </div>

          {/* Progress Bar 2: Staff Attendance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Staff & Teacher Attendance</span>
              <span className="text-emerald-600 font-extrabold">96.8%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: '96.8%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>28 Present</span>
              <span>1 Leave</span>
            </div>
          </div>

          {/* Progress Bar 3: Academic Syllabus Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Academic Syllabus Coverage</span>
              <span className="text-amber-600 font-extrabold">74.0%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '74%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Term 1 Target</span>
              <span>On Schedule</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardAnalyticsBar;
