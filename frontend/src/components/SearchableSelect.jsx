import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X, Loader2 } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  children,
  value,
  onChange,
  name,
  id,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  className = '',
  buttonClassName = '',
  emptyMessage = 'No matching options found',
  noOptionsMessage = 'No options available',
  disabled = false,
  required = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Extract options from children if provided (<option value="...">label</option>)
  const parsedFromChildren = useMemo(() => {
    if (!children) return [];
    const list = [];
    const extract = (elements) => {
      React.Children.forEach(elements, (child) => {
        if (!child) return;
        if (child.type === 'option') {
          const val = child.props.value !== undefined ? child.props.value : child.props.children;
          let label = child.props.children;
          if (Array.isArray(label)) {
            label = label.map(l => (typeof l === 'string' || typeof l === 'number' ? l : '')).join('');
          }
          list.push({
            value: val,
            label: String(label ?? ''),
            disabled: child.props.disabled || false
          });
        } else if (child.props && child.props.children) {
          extract(child.props.children);
        }
      });
    };
    extract(children);
    return list;
  }, [children]);

  const rawList = options && options.length > 0 ? options : parsedFromChildren;

  // Normalize options to array of { value, label, sublabel, disabled }
  const normalizedOptions = useMemo(() => {
    return rawList.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        let rawLabel =
          opt.label ??
          opt.name ??
          opt.title ??
          opt.class_name ??
          opt.teacher_name ??
          opt.subject_name ??
          opt.bus_name ??
          opt.route_name ??
          opt.student_name;

        if (!rawLabel && (opt.first_name || opt.last_name)) {
          rawLabel = `${opt.first_name || ''} ${opt.last_name || ''}`.trim();
        }

        if (!rawLabel && opt.class) {
          rawLabel = `Class ${opt.class}${opt.section ? ` - ${opt.section}` : ''}`;
        }

        if (rawLabel === undefined || rawLabel === null) {
          rawLabel = opt.value !== undefined ? opt.value : opt;
        }

        const rawSublabel =
          opt.sublabel !== undefined && opt.sublabel !== null
            ? opt.sublabel
            : (opt.code ??
              opt.admission_no ??
              opt.employee_id ??
              opt.bus_number ??
              opt.phone ??
              opt.designation ??
              (opt.roll_no ? `Roll: ${opt.roll_no}` : undefined));

        return {
          value: opt.value !== undefined ? opt.value : (opt._id ?? opt.id ?? opt),
          label: typeof rawLabel === 'object' ? JSON.stringify(rawLabel) : String(rawLabel ?? ''),
          sublabel: rawSublabel !== undefined && rawSublabel !== null ? String(rawSublabel) : undefined,
          disabled: Boolean(opt.disabled)
        };
      }
      return { value: opt, label: String(opt ?? ''), disabled: false };
    });
  }, [rawList]);

  const hasEmptyOption = normalizedOptions.some(opt => opt.value === '' || opt.value === null);
  const selectedOption = useMemo(() => {
    if (value !== undefined && value !== null && (value !== '' || hasEmptyOption)) {
      return normalizedOptions.find(opt => String(opt.value) === String(value));
    }
    return null;
  }, [value, normalizedOptions, hasEmptyOption]);

  const filteredOptions = useMemo(() => {
    const query = (searchTerm || '').trim().toLowerCase();
    if (!query) return normalizedOptions;
    return normalizedOptions.filter(opt => {
      const labelStr = String(opt.label || '').toLowerCase();
      const sublabelStr = opt.sublabel ? String(opt.sublabel).toLowerCase() : '';
      return labelStr.includes(query) || sublabelStr.includes(query);
    });
  }, [normalizedOptions, searchTerm]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Reset highlight index when opening, searching, or value changes
  useEffect(() => {
    if (isOpen) {
      const idx = filteredOptions.findIndex(opt => String(opt.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, searchTerm, filteredOptions, value]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue) => {
    if (onChange) {
      const syntheticEvent = {
        target: { name, id, value: optionValue },
        currentTarget: { name, id, value: optionValue },
        value: optionValue,
        preventDefault: () => { },
        stopPropagation: () => { }
      };
      onChange(optionValue, syntheticEvent);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0 ? (prev - 1 + filteredOptions.length) % filteredOptions.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredOptions[highlightedIndex];
      if (target && !target.disabled) {
        handleSelect(target.value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} onKeyDown={handleKeyDown} className={`relative w-full ${className}`}>
      {required && (
        <input
          type="text"
          value={value ?? ''}
          required={required}
          onChange={() => { }}
          onInvalid={(e) => e.preventDefault()}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={
          buttonClassName
            ? `${buttonClassName} ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`
            : `w-full px-4 py-3 rounded-2xl border text-left flex items-center justify-between transition-all outline-none bg-white ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
            } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'cursor-pointer'}`
        }
      >
        <span className={`text-sm font-semibold truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
          />
        </div>
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={`${opt.value}-${index}`}
                    data-option-item
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                      : isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                        : isHighlighted
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && <div className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</div>}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs font-bold text-slate-400">
                {normalizedOptions.length === 0 ? noOptionsMessage : emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
