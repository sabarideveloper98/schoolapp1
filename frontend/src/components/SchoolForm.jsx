import { useForm } from 'react-hook-form';

const SchoolForm = ({ onSubmit, defaultValues, isLoading, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">School Name</label>
          <input 
            {...register('name', { required: 'Name is required' })} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. S1 Academy"
          />
          {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
          <input 
            {...register('location', { required: 'Location is required' })} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. New York, USA"
          />
          {errors.location && <span className="text-red-500 text-xs mt-1 block">{errors.location.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
          <input 
            {...register('contact_number', { required: 'Contact number is required' })} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. +1 555-0199"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
          <input 
            type="email" 
            {...register('email', { required: 'Email is required' })} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. admin@school.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Founder Name</label>
          <input 
            {...register('founder_name', { required: 'Founder name is required' })} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Founder Phone</label>
          <input 
            {...register('founder_phone')} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. +1 555-0144"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Founder Email</label>
          <input 
            type="email" 
            {...register('founder_email')} 
            className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
            placeholder="e.g. founder@school.com"
          />
        </div>

        {!defaultValues && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Password</label>
              <input
                type="password"
                {...register('adminPassword', { required: 'Password is required for new schools', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="••••••"
              />
              {errors.adminPassword && <span className="text-red-500 text-xs mt-1 block">{errors.adminPassword.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Admin Password</label>
              <input
                type="password"
                {...register('confirmAdminPassword', {
                  required: 'Please confirm password',
                  validate: (val, formValues) => val === formValues.adminPassword || 'Passwords do not match'
                })}
                className="mt-1 block w-full h-12 px-4 text-slate-800 bg-white border border-slate-200 rounded-xl outline-none transition duration-300 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 sm:text-sm"
                placeholder="••••••"
              />
              {errors.confirmAdminPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmAdminPassword.message}</span>}
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-end space-x-3 mt-8">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-xl text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className="px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(37,99,235,0.1)]"
        >
          {isLoading ? 'Saving...' : 'Save School'}
        </button>
      </div>
    </form>
  );
};

export default SchoolForm;

