import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../../components/Header';
import AdminLayout from '../../components/AdminLayout';
import ProjectHealthPanel from '../../components/ProjectHealthPanel';
import {
  FiPlus, FiFilter, FiChevronDown, FiChevronUp,
  FiList, FiGrid, FiBarChart2, FiCalendar,
  FiEdit2, FiTrash2, FiFolder,
} from 'react-icons/fi';
import ProjectModal from '../../components/projects/ProjectModal';
import TaskModal from '../../components/tasks/TaskModal';
import TaskBoardView from '../../components/tasks/TaskBoardView';
import TaskTimelineView from '../../components/tasks/TaskTimelineView';
import { useProject } from '../../contexts/ProjectContext';
import { createTask, updateTask, deleteTask, getTasks } from '../../api/tasks';

const SEED_PROJECTS = [
  { id: 1, name: 'Commercial Lease Agreement - FR to EN', code: 'LEG-2024-001', dept: 'Legal', status: 'In Progress', progress: 75, priority: 'HIGH', dueDate: '2024-03-15', health: 'at-risk', wordCount: 12400, assignees: ['SC', 'MK'] },
  { id: 2, name: 'GDPR Compliance Policy - EN to DE',    code: 'LEG-2024-042', dept: 'Legal', status: 'In Progress', progress: 20, priority: 'MEDIUM', dueDate: '2024-04-10', health: 'on-track', wordCount: 8150, assignees: ['JD'] },
  { id: 3, name: 'Brand Identity Guidelines - ES to FR', code: 'LEG-2024-089', dept: 'Legal', status: 'Planning',    progress: 0,  priority: 'LOW',    dueDate: '2024-05-01', health: 'on-track', wordCount: 3200, assignees: ['SC'] },
  { id: 4, name: 'IP License Agreement - EN to JP',      code: 'LEG-2024-112', dept: 'Legal', status: 'In Progress', progress: 55, priority: 'HIGH',   dueDate: '2024-03-20', health: 'overdue',  wordCount: 9800, assignees: ['MK', 'JD'] },
  { id: 5, name: 'Q4 Product Launch Press Kit - Multilingual', code: 'MKT-2024-912', dept: 'Marketing', status: 'In Progress', progress: 95, priority: 'LOW', dueDate: '2024-02-28', health: 'on-track', wordCount: 42000, assignees: ['AL', 'SC'] },
  { id: 6, name: 'Social Media Campaign - EN to PT',     code: 'MKT-2024-801', dept: 'Marketing', status: 'In Progress', progress: 60, priority: 'MEDIUM', dueDate: '2024-03-10', health: 'on-track', wordCount: 5500, assignees: ['AL'] },
  { id: 7, name: 'Annual Report Translation - EN to ZH', code: 'MKT-2024-750', dept: 'Marketing', status: 'Planning',    progress: 10, priority: 'HIGH',   dueDate: '2024-04-15', health: 'on-track', wordCount: 18000, assignees: ['JD', 'MK'] },
  { id: 8, name: 'API Documentation - EN to DE',         code: 'TEC-2024-301', dept: 'Tech Docs', status: 'In Progress', progress: 40, priority: 'MEDIUM', dueDate: '2024-03-25', health: 'at-risk', wordCount: 22000, assignees: ['SC'] },
  { id: 9, name: 'SDK Reference Guide - EN to ES',       code: 'TEC-2024-250', dept: 'Tech Docs', status: 'Completed',   progress: 100, priority: 'LOW',  dueDate: '2024-02-20', health: 'on-track', wordCount: 15000, assignees: ['AL', 'JD'] },
];

const SEED_TASKS = [
  { id: 1, projectId: 1, title: 'Review contract terms', description: 'Review all terms and conditions', status: 'done', priority: 'HIGH', dueDate: '2024-02-25', assignee: 'Sarah', subtasks: 3, completed: 2 },
  { id: 2, projectId: 1, title: 'Client approval', description: 'Get client sign-off', status: 'in_progress', priority: 'HIGH', dueDate: '2024-03-01', assignee: 'Mike', subtasks: 2, completed: 1 },
  { id: 3, projectId: 1, title: 'Final documentation', description: 'Prepare final docs', status: 'todo', priority: 'MEDIUM', dueDate: '2024-03-10', assignee: 'Sarah', subtasks: 1, completed: 0 },
  { id: 4, projectId: 2, title: 'Policy review', description: 'Internal review', status: 'in_progress', priority: 'MEDIUM', dueDate: '2024-03-05', assignee: 'John', subtasks: 4, completed: 1 },
  { id: 5, projectId: 5, title: 'Localization QA', description: 'Quality assurance pass', status: 'done', priority: 'LOW', dueDate: '2024-02-26', assignee: 'Alice', subtasks: 2, completed: 2 },
];

const AVATAR_COLORS = {
  SC: 'bg-violet-500', MK: 'bg-sky-500', JD: 'bg-amber-500', AL: 'bg-pink-500',
};
/**
 * Calculate project progress percentage based on completed vs total tasks
 * Falls back to manual calculation if progress_percentage is not available
 * @param {Object} project - Project object with tasks_count and completed_tasks_count
 * @returns {number} Progress percentage (0-100)
 */
const calculateProgress = (project) => {
  // Use backend calculated percentage if available
  if (project.progress_percentage !== undefined && project.progress_percentage !== null) {
    return Math.round(project.progress_percentage);
  }
  // Fallback to manual calculation
  const tasksCount = project.tasks_count || 0;
  const completedTasksCount = project.completed_tasks_count || 0;
  if (tasksCount === 0) return 0;
  const percentage = (completedTasksCount / tasksCount) * 100;
  return Math.round(Math.min(100, Math.max(0, percentage)));
};
/* â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PriorityBadge = ({ priority }) => {
  const styles = {
    HIGH:   'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW:    'bg-emerald-100 text-emerald-700',
  };
  const labels = { HIGH: 'HIGH', MEDIUM: 'MED', LOW: 'LOW' };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${styles[priority] ?? styles.LOW}`}>
      {labels[priority] ?? priority}
    </span>
  );
};

const Assignees = ({ list = [] }) => (
  <div className="flex items-center -space-x-1.5">
    {list.slice(0, 3).map((init) => (
      <div
        key={init}
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white ${AVATAR_COLORS[init] ?? 'bg-slate-400'}`}
        title={init}
      >
        {init}
      </div>
    ))}
    {list.length > 3 && (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600 ring-2 ring-white">
        +{list.length - 3}
      </div>
    )}
  </div>
);

const HealthBadge = ({ health }) => {
  const styles = {
    'on-track': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'On Track' },
    'at-risk': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'At Risk' },
    'overdue': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Overdue' },
  };
  const style = styles[health] || styles['on-track'];
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${style.bg}`}>
      <div className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span className={`text-[11px] font-semibold ${style.text}`}>{style.label}</span>
    </div>
  );
};

const ProjectRow = ({ project, onEdit, onDelete, onSelect }) => {
  const tasksCount = project.tasks_count || 0;
  const completedCount = project.completed_tasks_count || 0;
  const progress = calculateProgress(project);
  const dueDate = project.dueDate ? new Date(project.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  
  return (
    <tr
      onClick={() => onSelect(project)}
      className="group cursor-pointer border-b border-slate-100 hover:bg-blue-50/50 transition-colors"
    >
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-slate-300 accent-blue-600"
        />
      </td>
      
      {/* Project Name & Code */}
      <td className="px-4 py-3 min-w-70">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-slate-900 mb-0.5">{project.name}</p>
          <p className="text-xs text-slate-500">{project.key || project.code}</p>
        </div>
      </td>
      
      
      {/* Tasks (Completed / Total) */}
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-emerald-600">{completedCount}</span>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-sm font-semibold text-slate-900">{tasksCount}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">tareas</span>
        </div>
      </td>
      
      {/* Progress */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5 min-w-30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">{progress}%</span>
            <span className="text-[10px] text-slate-500">
              {tasksCount > 0 ? `${Math.round((completedCount / tasksCount) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : progress >= 25 ? 'bg-amber-500' : 'bg-slate-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      
      {/* Priority */}
      <td className="px-4 py-3 text-center">
        <PriorityBadge priority={project.priority?.toUpperCase()} />
      </td>
      
      {/* Status */}
      <td className="px-4 py-3 text-center">
        <HealthBadge health={project.health || 'on-track'} />
      </td>
      
      {/* Words */}
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-900">
            {project.wordCount?.toLocaleString() || '0'}
          </span>
          <span className="text-[10px] text-slate-400">palabras</span>
        </div>
      </td>
      
      {/* Due Date */}
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-900">{dueDate}</span>
          <span className="text-[10px] text-slate-400">vencimiento</span>
        </div>
      </td>
      
      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <button
            onClick={() => onEdit(project)}
            className="rounded p-1.5 text-slate-500 hover:bg-blue-100 hover:text-blue-600"
            title="Editar proyecto"
          >
            <FiEdit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="rounded p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600"
            title="Eliminar proyecto"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const TableHeader = () => (
  <thead className="bg-slate-50 border-b border-slate-200">
    <tr>
      <th className="px-4 py-3 text-left w-10">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
      </th>
      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
        Proyecto
      </th>
      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
        Tasks
      </th>
      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
        Progress
      </th>
      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
        Priority
      </th>
      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
        Status
      </th>
      <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
        Due Date
      </th>
      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
        
      </th>
    </tr>
  </thead>
);

/* â”€â”€â”€ Views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const getStatusColor = (status) => {
  const c = { todo: 'bg-slate-100 text-slate-700', 'in_progress': 'bg-amber-100 text-amber-700', done: 'bg-emerald-100 text-emerald-700' };
  return c[status] ?? c.todo;
};
const getPriorityColor = (priority) => {
  const c = { HIGH: 'text-red-600', MEDIUM: 'text-amber-600', LOW: 'text-emerald-600' };
  return c[priority] ?? c.LOW;
};

/* â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Admin = () => {
  const navigate = useNavigate();
  const { 
    selectedProject: contextSelectedProject, 
    projects, 
    isLoading: loadingProjects,
    error: projectsError,
    addProject,
    updateProjectInList,
    removeProject,
    refreshProjects,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProject();

  const [tasks, setTasks] = useState(SEED_TASKS);

  const [activeSection, setActiveSection] = useState('all');
  const [activeDept, setActiveDept] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedProjectForView, setSelectedProjectForView] = useState(null);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectError, setProjectError] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState(null);

  /* Filtered projects */
  const visibleProjects = useMemo(() => {
    if (activeDept) return projects.filter((p) => p.dept === activeDept);
    if (activeSection === 'starred') return projects.filter((p) => p.starred);
    if (activeSection === 'recent') return projects.slice(-4).reverse();
    return projects;
  }, [projects, activeSection, activeDept]);

  /* Group by dept */
  const grouped = useMemo(() => {
    return visibleProjects.reduce((acc, p) => {
      if (!acc[p.dept]) acc[p.dept] = [];
      acc[p.dept].push(p);
      return acc;
    }, {});
  }, [visibleProjects]);

  /* Tasks for selected project */
  const projectTasks = useMemo(
    () => (selectedProjectForView ? tasks.filter((t) => t.projectId === selectedProjectForView.id) : []),
    [tasks, selectedProjectForView]
  );

  /* Handlers â€“ Projects */
  const handleAddProject = async (data) => {
    try {
      setProjectError(null);
      await addProject(data);
      setShowProjectModal(false);
      setEditingProject(null);
      setProjectError(null);
    } catch (err) {
      console.error('Error creating project:', err);
      setProjectError(err.message || 'Error al crear el proyecto');
    }
  };
  
  const handleEditProject = async (data) => {
    try {
      setProjectError(null);
      await updateProjectInList(editingProject.id, data);
      setEditingProject(null);
      setShowProjectModal(false);
      setProjectError(null);
    } catch (err) {
      console.error('Error updating project:', err);
      setProjectError(err.message || 'Error al actualizar el proyecto');
    }
  };
  
  const handleDeleteProject = async (id) => {
    const result = await Swal.fire({
      title: 'Eliminar Proyecto',
      text: '¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    try {
      await removeProject(id);
      setTasks(tasks.filter((t) => t.projectId !== id));
      if (selectedProjectForView?.id === id) setSelectedProjectForView(null);
      
      await Swal.fire({
        title: 'Eliminado',
        text: 'El proyecto ha sido eliminado exitosamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      await Swal.fire({
        title: 'Error',
        text: 'Error al eliminar el proyecto: ' + (err.message || 'Error desconocido'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Navigate to project tasks page
  const handleNavigateToTasks = (project) => {
    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/admin/projects/${projectSlug}/tasks`);
  };


  /* Handlers â€“ Tasks */
  const handleAddTask = async (data) => {
    // Use context project if no local selection
    const projectId = selectedProjectForView?.id || contextSelectedProject?.id;
    if (!projectId) {
      setTaskError('There is no selected project to add a task to');
      return;
    }
    
    try {
      setSavingTask(true);
      setTaskError(null);
      const newTask = await createTask(projectId, data);
      setTasks([...tasks, newTask]);
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskError(null);
    } catch (err) {
      console.error('Error creating task:', err);
      setTaskError(err.message || 'Error creating task');
    } finally {
      setSavingTask(false);
    }
  };
  
  const handleEditTask = async (data) => {
    // Use context project if no local selection
    const projectId = selectedProjectForView?.id || contextSelectedProject?.id;
    if (!projectId || !editingTask) {
      setTaskError('There is no selected project or task to edit');
      return;
    }
    
    try {
      setSavingTask(true);
      setTaskError(null);
      const updatedTask = await updateTask(projectId, editingTask.id, data);
      setTasks(tasks.map((t) => (t.id === editingTask.id ? updatedTask : t)));
      setEditingTask(null);
      setShowTaskModal(false);
      setTaskError(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setTaskError(err.message || 'Error updating task');
    } finally {
      setSavingTask(false);
    }
  };
  
  const handleDeleteTask = async (id) => {
    if (!selectedProjectForView) return;
    
    const result = await Swal.fire({
      title: 'Delete Task',
      text: 'Are you sure you want to delete this task? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    
    try {
      await deleteTask(selectedProjectForView.id, id);
      setTasks(tasks.filter((t) => t.id !== id));
      
      await Swal.fire({
        title: 'Deleted',
        text: 'The task has been deleted successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      await Swal.fire({
        title: 'Error',
        text: 'Error deleting task: ' + (err.message || 'Unknown error'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };
  
  const handleStatusChange = async (id, status) => {
    if (!selectedProjectForView) return;
    
    try {
      const taskToUpdate = tasks.find(t => t.id === id);
      if (!taskToUpdate) return;
      
      const updatedTask = await updateTask(selectedProjectForView.id, id, { ...taskToUpdate, status });
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error('Error updating task status:', err);
      await Swal.fire({
        title: 'Error',
        text: 'Error updating task status: ' + (err.message || 'Unknown error'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const toggleGroup = (dept) =>
    setCollapsedGroups((prev) => ({ ...prev, [dept]: !prev[dept] }));

  const breadcrumb = activeDept
    ? activeDept
    : activeSection === 'recent'
    ? 'Recent'
    : activeSection === 'starred'
    ? 'Starred'
    : 'Active Campaigns';
  // Loading state
  if (loadingProjects) {
    return (
      <AdminLayout>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-slate-600">Cargando proyectos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (projectsError) {
    return (
      <AdminLayout>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Error al cargar proyectos</h3>
            <p className="mb-6 text-sm text-slate-600">{projectsError}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reintentar
              </button>
              <button 
                onClick={() => { setEditingProject(null); setShowProjectModal(true); }} 
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
        {showProjectModal && (
          <ProjectModal
            project={editingProject}
            onSubmit={handleAddProject}
            onClose={() => { setShowProjectModal(false); setEditingProject(null); setProjectError(null); }}
            isLoading={isCreating || isUpdating}
            error={projectError}
          />
        )}
      </AdminLayout>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <AdminLayout>
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FiFolder className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900">No hay proyectos</h3>
            <p className="mb-4 text-sm text-slate-600">Crea tu primer proyecto para comenzar</p>
            <button 
              onClick={() => { setEditingProject(null); setShowProjectModal(true); }} 
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 mx-auto"
            >
              <FiPlus size={16} />
              Crear Proyecto
            </button>
          </div>
        </div>
        {showProjectModal && (
          <ProjectModal
            project={editingProject}
            onSubmit={handleAddProject}
            onClose={() => { setShowProjectModal(false); setEditingProject(null); setProjectError(null); }}
            isLoading={isCreating || isUpdating}
            error={projectError}
          />
        )}
      </AdminLayout>
    );
  }
  /* â”€â”€ Render â”€â”€ */
  return (
    <AdminLayout>
      <Header activeNav="Projects" onNewProject={() => { setEditingProject(null); setShowProjectModal(true); }} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Breadcrumb + Toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Project Management</span>
              <span>&#10095;</span>
              <span className="font-semibold text-slate-900">{breadcrumb}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <FiFilter size={13} />
                Filter
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                Sort
              </button>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex shrink-0 items-center gap-0 border-b border-slate-200 bg-white px-6">
            {[
              { id: 'list',     icon: FiList,     label: 'List View' },
              { id: 'board',    icon: FiGrid,     label: 'Board' },
              { id: 'gantt',    icon: FiBarChart2, label: 'Gantt' },
              { id: 'timeline', icon: FiCalendar,  label: 'Timeline' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                  viewMode === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'list' && !selectedProjectForView && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white">
                  <TableHeader />
                  <tbody>
                    {Object.entries(grouped).map(([dept, deptProjects]) => (
                      <>
                        <tr key={`group-${dept}`} className="bg-slate-50 border-b border-slate-200">
                          <td colSpan="11" className="px-4 py-2">
                            <button
                              onClick={() => toggleGroup(dept)}
                              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                            >
                              {collapsedGroups[dept] ? <FiChevronDown size={16} /> : <FiChevronUp size={16} />}
                              <span>{dept}</span>
                              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                {deptProjects.length} {deptProjects.length === 1 ? 'Proyecto' : 'Proyectos'}
                              </span>
                            </button>
                          </td>
                        </tr>
                        {!collapsedGroups[dept] &&
                          deptProjects.map((p) => (
                            <ProjectRow
                              key={p.id}
                              project={p}
                              onEdit={(proj) => { setEditingProject(proj); setShowProjectModal(true); }}
                              onDelete={handleDeleteProject}
                              onSelect={handleNavigateToTasks}
                            />
                          ))}
                      </>
                    ))}
                    {visibleProjects.length === 0 && (
                      <tr>
                        <td colSpan="11" className="px-4 py-20 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <FiFolder className="mb-3 h-12 w-12" />
                            <p className="text-sm mb-2">No hay proyectos</p>
                            <button
                              onClick={() => { setEditingProject(null); setShowProjectModal(true); }}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                              + Crear proyecto
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'list' && selectedProjectForView && (
              <div className="p-6">
                {/* Project detail header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedProjectForView(null)} className="text-sm text-blue-600 hover:underline">
                      â† Volver
                    </button>
                    <span className="text-slate-300">|</span>
                    <h2 className="text-lg font-bold text-slate-900">{selectedProjectForView.name}</h2>
                  </div>
                  <button
                    onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <FiPlus size={16} />
                    Nueva Tarea
                  </button>
                </div>

                {/* Tasks list table */}
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="grid border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400"
                    style={{ gridTemplateColumns: '1fr 120px 80px 140px 56px' }}>
                    <span>Tarea</span><span>Asignado</span><span>Prioridad</span><span>Estado</span><span />
                  </div>
                  {projectTasks.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">Sin tareas aÃºn</div>
                  ) : projectTasks.map((task) => (
                    <div key={task.id} className="group grid items-center border-b border-slate-100 px-4 py-3 hover:bg-slate-50"
                      style={{ gridTemplateColumns: '1fr 120px 80px 140px 56px' }}>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-400">{task.description}</p>
                      </div>
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {task.assignee}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`w-fit cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold outline-none ${getStatusColor(task.status)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="todo">Por hacer</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="done">Completado</option>
                      </select>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="rounded p-1 text-slate-500 hover:bg-blue-100 hover:text-blue-600"><FiEdit2 size={13} /></button>
                        <button onClick={() => handleDeleteTask(task.id)} className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600"><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'board' && (
              <div className="p-6">
                {selectedProjectForView ? (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <button onClick={() => setSelectedProjectForView(null)} className="text-sm text-blue-600 hover:underline">â† Volver</button>
                      <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        <FiPlus size={16} />Nueva Tarea
                      </button>
                    </div>
                    <TaskBoardView tasks={projectTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p className="text-sm">Select a project in the List view to see its board</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'gantt' && (
              <div className="p-6">
                <GanttView projects={visibleProjects} onSelect={handleNavigateToTasks} />
              </div>
            )}

            {viewMode === 'timeline' && (
              <div className="p-6">
                {selectedProjectForView ? (
                  <>
                    <button onClick={() => setSelectedProjectForView(null)} className="mb-4 text-sm text-blue-600 hover:underline">â† Volver</button>
                    <TaskTimelineView tasks={projectTasks} onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }} onDelete={handleDeleteTask} getStatusColor={getStatusColor} getPriorityColor={getPriorityColor} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <p className="text-sm">Select a project in the List view to see its timeline</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Panel */}
        
      </div>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onSubmit={editingProject ? handleEditProject : handleAddProject}
          onClose={() => { setShowProjectModal(false); setEditingProject(null); setProjectError(null); }}
          isLoading={isCreating || isUpdating}
          error={projectError}
        />
      )}
      {showTaskModal && (selectedProjectForView || contextSelectedProject) && (
        <TaskModal
          task={editingTask}
          projectId={selectedProjectForView?.id || contextSelectedProject?.id}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); setTaskError(null); }}
          isLoading={savingTask}
          error={taskError}
        />
      )}
    </AdminLayout>
  );
};

/* â”€â”€ Simple Gantt â”€â”€ */
const GanttView = ({ projects, onSelect }) => {
  const today = new Date('2024-03-01');
  const start = new Date('2024-01-01');
  const end   = new Date('2024-06-01');
  const totalDays = (end - start) / 86400000;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

  const pct = (date) => Math.max(0, Math.min(100, ((new Date(date) - start) / (end - start)) * 100));
  const todayPct = ((today - start) / (end - start)) * 100;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Month headers */}
      <div className="flex border-b border-slate-200">
        <div className="w-64 shrink-0 border-r border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-400">Project</div>
        <div className="flex flex-1">
          {months.map((m) => (
            <div key={m} className="flex-1 border-r border-slate-100 px-2 py-2 text-center text-xs font-bold uppercase text-slate-400">{m}</div>
          ))}
        </div>
      </div>
      {projects.map((p) => {
        const leftPct  = pct(p.dueDate) - 10;
        const widthPct = 15;
        return (
          <div key={p.id} className="flex items-center border-b border-slate-100 hover:bg-slate-50" onClick={() => onSelect(p)}>
            <div className="w-64 shrink-0 cursor-pointer border-r border-slate-200 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-400">{p.key || p.code}</p>
            </div>
            <div className="relative flex-1 py-3 pr-4">
              <div className="relative h-6 rounded bg-slate-100">
                {/* Today line */}
                <div className="absolute top-0 bottom-0 w-px bg-red-400" style={{ left: `${todayPct}%` }} />
                {/* Bar */}
                <div
                  className="absolute top-1 bottom-1 cursor-pointer rounded bg-blue-500 hover:bg-blue-600"
                  style={{ left: `${Math.max(0, leftPct)}%`, width: `${widthPct}%` }}
                  title={`${p.name} — ${calculateProgress(p)}%`}
                >
                  <div className="h-full rounded bg-blue-400" style={{ width: `${calculateProgress(p)}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Admin;
