import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useParentChildStore from '../store/useParentChildStore';
import SearchableSelect from './SearchableSelect';

const ChildSelector = ({
  title,
  subtitle,
  className = '',
  showCard = true,
  onChange
}) => {
  const { user } = useAuthStore();
  const {
    childrenList,
    selectedChildId,
    setSelectedChildId,
    fetchChildren,
    loadingChildren
  } = useParentChildStore();

  useEffect(() => {
    if (user?.token && (!childrenList || childrenList.length === 0)) {
      fetchChildren(user.token);
    }
  }, [user?.token, childrenList, fetchChildren]);

  const handleSelect = (val) => {
    setSelectedChildId(val);
    if (onChange) {
      onChange(val);
    }
  };

  const options = (childrenList || []).map((c) => {
    const classNameVal = c.class_id?.class || c.class || '';
    const sectionVal = c.class_id?.section || c.section || '';
    const classInfo = classNameVal ? ` (Class ${classNameVal}${sectionVal ? `-${sectionVal}` : ''})` : '';
    return {
      value: c._id,
      label: `${c.student_name}${classInfo}`
    };
  });

  const selectorElement = (
    <div className="w-full sm:w-72">
      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
        Select Child
      </label>
      <SearchableSelect
        options={options}
        value={selectedChildId}
        onChange={handleSelect}
        placeholder={loadingChildren ? 'Loading children...' : 'Select Child...'}
        searchPlaceholder="Search child..."
        buttonClassName="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
        disabled={loadingChildren || options.length === 0}
      />
    </div>
  );

  if (!showCard) {
    return <div className={className}>{selectorElement}</div>;
  }

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {title || 'Child Details'}
        </h2>
        {subtitle && (
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {selectorElement}
    </div>
  );
};

export default ChildSelector;
