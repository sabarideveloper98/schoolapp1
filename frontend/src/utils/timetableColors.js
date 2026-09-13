export const getSubjectColor = (subjectName = '') => {
    const s = subjectName.toLowerCase().trim();
    if (s.includes('math')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s.includes('english')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (s.includes('tamil')) return 'bg-pink-100 text-pink-700 border-pink-200';
    if (s.includes('science')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('hindi')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('social')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s.includes('computer')) return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    if (s.includes('pt') || s.includes('game') || s.includes('sports')) return 'bg-lime-100 text-lime-700 border-lime-200';
    if (s.includes('art') || s.includes('craft')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('moral')) return 'bg-violet-100 text-violet-700 border-violet-200';
    if (s.includes('library')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
};
