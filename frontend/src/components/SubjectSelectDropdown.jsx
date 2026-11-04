import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BookOpen, Search, X, Check, ChevronDown, Plus, ExternalLink } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const SubjectSelectDropdown = ({
  selected = [],
  onChange,
  label = 'Assigned Subjects',
  placeholder = 'Select subjects...',
  error = null,
  required = false
}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const dropdownRef = useRef(null);

  // Normalize selected to array of strings
  const selectedList = Array.isArray(selected)
    ? selected
    : typeof selected === 'string' && selected.trim()
    ? selected.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const fetchActiveSubjects = async () => {
      try {
        setLoading(true);
        const token = user?.token || (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}')?.token : '');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('/api/schooladmin/common-subjects?status=Active', config);
        setSubjects(res.data || []);
      } catch (err) {
        console.error('Failed to load active common subjects', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token || typeof localStorage !== 'undefined') {
      fetchActiveSubjects();
    }
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubject = (subjectName) => {
    const exists = selectedList.some(s => s.trim().toLowerCase() === subjectName.trim().toLowerCase());
    let updated;
    if (exists) {
      updated = selectedList.filter(s => s.trim().toLowerCase() !== subjectName.trim().toLowerCase());
    } else {
      updated = [...selectedList, subjectName];
    }
    onChange(updated);
  };

  const removeSubject = (e, subjectName) => {
    e.stopPropagation();
    const updated = selectedList.filter(s => s.trim().toLowerCase() !== subjectName.trim().toLowerCase());
    onChange(updated);
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter(sub => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return sub.name?.toLowerCase().includes(q) || sub.code?.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
          <span className="text-slate-400 font-normal ml-1">(Click to assign multiple)</span>
        </label>
        <Link
          to="/school-admin/common-subjects"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
          title="Open Common Subject module"
        >
          + Manage Common Subjects
        </Link>
      </div>

      {/* Main trigger container */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`min-h-12 w-full p-2 bg-white border rounded-xl flex flex-wrap items-center gap-1.5 cursor-pointer transition-all ${
          isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selectedList.length > 0 ? (
          selectedList.map((subName) => (
            <span
              key={subName}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors hover:bg-blue-100"
            >
              <BookOpen className="w-3 h-3 text-blue-600" />
              <span>{subName}</span>
              <button
                type="button"
                onClick={(e) => removeSubject(e, subName)}
                className="text-blue-500 hover:text-blue-800 p-0.5 rounded cursor-pointer"
                title="Remove subject"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400 px-2 py-1 font-medium">
            {loading ? 'Loading subjects...' : placeholder}
          </span>
        )}

        <div className="ml-auto pr-2 text-slate-400">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in">
          {/* Search bar inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject by name or code..."
                className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-800"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Subject Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-400 font-semibold">Loading subjects...</div>
            ) : filteredSubjects.length > 0 ? (
              filteredSubjects.map((sub) => {
                const isSelected = selectedList.some(s => s.trim().toLowerCase() === sub.name.trim().toLowerCase());
                return (
                  <div
                    key={sub._id}
                    onClick={() => toggleSubject(sub.name)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50/80 text-blue-900 font-bold' 
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{sub.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {sub.code}
                      </span>
                    </div>

                    {isSelected && (
                      <span className="text-[11px] font-bold text-blue-600 shrink-0">Selected</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">No subjects match "{search}"</p>
                <Link
                  to="/school-admin/common-subjects"
                  className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 mt-1.5"
                >
                  <Plus className="w-3 h-3" /> Create new subject in Common Subject module
                </Link>
              </div>
            )}
          </div>

          {/* Bottom helper */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{selectedList.length} subject{selectedList.length === 1 ? '' : 's'} assigned</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSelectDropdown;
