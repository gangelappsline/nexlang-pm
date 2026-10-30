import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { getAuthUser } from '../../utils/auth-storage';

const ProjectModal = ({ project, onSubmit, onClose, isLoading = false, error = null }) => {
  const user = getAuthUser();
  
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    owner_id: user?.id || 1,
    status: 'planning',
    priority: 'medium',
    start_date: '',
    due_date: '',
    budget: '',
    budget_currency: 'USD',
    estimated_hours: '',
  });

  useEffect(() => { 
    if (project) {
      setFormData({
        name: project.name || '',
        key: project.key || '',
        description: project.description || '',
        owner_id: project.owner_id || user?.id || 1,
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        budget: project.budget || '',
        budget_currency: project.budget_currency || 'USD',
        estimated_hours: project.estimated_hours || '',
      });
    }
  }, [project, user]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    });
  };
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    // Convertir valores numéricos y limpiar campos vacíos
    const submitData = {
      ...formData,
      budget: formData.budget === '' ? null : Number(formData.budget),
      estimated_hours: formData.estimated_hours === '' ? null : Number(formData.estimated_hours),
    };
    onSubmit(submitData); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10">
          <FiX size={20} />
        </button>
        <h2 className="mb-5 text-xl font-bold text-slate-900">{project ? 'Edit Project' : 'New Project'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Project Name *
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="e.g. Translation System v2"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Code/Key *
              </label>
              <input 
                type="text" 
                name="key" 
                value={formData.key} 
                onChange={handleChange} 
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="e.g. TRAD-002"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows="3"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                placeholder="Project description..."
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status *
              </label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority *
              </label>
              <select 
                name="priority" 
                value={formData.priority} 
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Dates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <input 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" 
                />
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date *
                </label>
                <input 
                  type="date" 
                  name="due_date" 
                  value={formData.due_date} 
                  onChange={handleChange} 
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>

          {/* Budget and Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Budget and Resources</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Budget
                </label>
                <input 
                  type="number" 
                  name="budget" 
                  value={formData.budget} 
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Currency
                </label>
                <select 
                  name="budget_currency" 
                  value={formData.budget_currency} 
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="MXN">MXN</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated Hours
              </label>
              <input 
                type="number" 
                name="estimated_hours" 
                value={formData.estimated_hours} 
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>
          
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                project ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
