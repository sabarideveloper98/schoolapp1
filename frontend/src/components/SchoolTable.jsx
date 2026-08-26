import { Edit2, Trash2 } from 'lucide-react';

const SchoolTable = ({ schools, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">School Name</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Founder</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {schools.map((school) => (
            <tr key={school._id} className="hover:bg-slate-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{school.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{school.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{school.location}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{school.founder_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                <button 
                  onClick={() => onEdit(school)} 
                  className="text-blue-600 hover:text-blue-500 hover:scale-115 transition-all mr-4 cursor-pointer inline-block"
                  title="Edit School"
                >
                  <Edit2 className="w-4 h-4 inline" />
                </button>
                <button 
                  onClick={() => onDelete(school._id)} 
                  className="text-red-600 hover:text-red-500 hover:scale-115 transition-all cursor-pointer inline-block"
                  title="Delete School"
                >
                  <Trash2 className="w-4 h-4 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchoolTable;

