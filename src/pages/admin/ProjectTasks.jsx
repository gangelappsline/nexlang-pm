import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { 
  FiArrowLeft, 
  FiPlus, 
  FiList, 
  FiGrid, 
  FiCalendar,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiUser,
  FiTag,
  FiFilter,
  FiX,
  FiSearch
} from 'react-icons/fi';
import { useProject } from '../../contexts/ProjectContext';
import { getTasks, createTask, updateTask, deleteTask } from '../../api/tasks';
import { getUsers } from '../../api/users';
import TaskModal from '../../components/tasks/TaskModal';
import TaskListView from '../../components/tasks/TaskListView';
import TaskBoardView from '../../components/tasks/TaskBoardView';
import TaskTimelineView from '../../components/tasks/TaskTimelineView';
import TaskDetailPanel from '../../components/tasks/TaskDetailPanel';
import Header from '../../components/Header';
import { BiEraser } from 'react-icons/bi';

const ProjectTasks = () => {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  const queryClient = useQueryClient();

  const [currentView, setCurrentView] = useState('list');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    users: [],
    priority: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  
  const [appliedFilters, setAppliedFilters] = useState({});

  // Fetch tasks using TanStack Query
  const { data: tasksResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', selectedProject?.id, appliedFilters],
    queryFn: () => getTasks(selectedProject.id, appliedFilters),
    enabled: !!selectedProject?.id,
    staleTime: 30000, // 30 segundos para evitar refetch constantes
    cacheTime: 1000 * 60 * 5, // 5 minutos en cache
    refetchOnWindowFocus: false, // Evitar refetch al cambiar de ventana
  });

  // Fetch users for mentions
  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    staleTime: 60000, // 1 minute
  });

  const tasks = tasksResponse?.data || [];
  const users = usersResponse?.data || [];

  // Debug: Log what we're getting
  console.log('ProjectTasks - Selected Project:', selectedProject);
  console.log('ProjectTasks - Tasks Response:', tasksResponse);
  console.log('ProjectTasks - Tasks:', tasks);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData) => createTask(selectedProject.id, taskData),
    onSuccess: (response) => {
      // Agregar la nueva tarea al cache sin refetch
      const newTask = response.data;
      
      queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: [...oldData.data, newTask],
        };
      });
      
      // También invalidar para asegurar sincronización
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', selectedProject.id],
        refetchType: 'none' // No refetch inmediato
      });
      
      setShowTaskModal(false);
      setEditingTask(null);
    },
    onError: async (error) => {
      console.error('Error creating task:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to create task. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  });

  // Update task mutation con optimistic updates
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, taskData }) => updateTask(selectedProject.id, taskId, taskData),
    // Optimistic update: actualizar cache antes de que responda el servidor
    onMutate: async ({ taskId, taskData }) => {
      // Cancelar queries en vuelo para evitar que sobrescriban el optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedProject.id] });
      
      // Snapshot del estado actual para rollback
      const previousTasks = queryClient.getQueryData(['tasks', selectedProject.id, appliedFilters]);
      
      // Optimistic update del cache
      queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((task) =>
            task.id === taskId ? { ...task, ...taskData, id: taskId } : task
          ),
        };
      });
      
      // Retornar contexto para rollback en caso de error
      return { previousTasks };
    },
    onSuccess: (response, { taskId }) => {
      // Actualizar con la respuesta real del servidor
      const updatedTask = response.data;
      
      queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((task) =>
            task.id === taskId ? updatedTask : task
          ),
        };
      });
      
      setShowTaskModal(false);
      setEditingTask(null);
      
      // Actualizar el panel de detalles si está abierto
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(updatedTask);
      }
    },
    onError: (error, variables, context) => {
      console.error('Error updating task:', error);
      
      // Rollback: restaurar el estado anterior
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ['tasks', selectedProject.id, appliedFilters],
          context.previousTasks
        );
      }
      
      // Mostrar error solo si no es del TaskBoardView (que maneja su propio toast)
      // Propagar el error para que los componentes lo manejen
      throw error;
    },
    onSettled: () => {
      // Marcar las queries como stale para que se refetch en el próximo acceso
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', selectedProject.id],
        refetchType: 'none'
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(selectedProject.id, taskId),
    onSuccess: (_, taskId) => {
      // Remover la tarea del cache sin refetch
      queryClient.setQueryData(['tasks', selectedProject.id, appliedFilters], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((task) => task.id !== taskId),
        };
      });
      
      // Invalidar queries para sincronizar
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', selectedProject.id],
        refetchType: 'none'
      });
      
      setTaskToDelete(null);
    },
    onError: async (error) => {
      console.error('Error deleting task:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete task. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  });

  // Handlers
  const handleAddTask = async (taskData) => {
    createTaskMutation.mutate(taskData);
  };

  const handleEditTask = async (taskData) => {
    if (editingTask) {
      updateTaskMutation.mutate({ taskId: editingTask.id, taskData });
    }
  };

  const handleDeleteTask = async (taskId) => {
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

    if (result.isConfirmed) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      try {
        // Usar mutateAsync para que retorne una promesa
        await updateTaskMutation.mutateAsync({ 
          taskId, 
          taskData: { status: newStatus } // Solo enviar el campo que cambia
        });
      } catch (error) {
        // El error ya fue manejado en la mutación (rollback)
        // Re-lanzar para que TaskBoardView lo capture
        throw error;
      }
    }
  };

  const openEditModal = (task) => {
    // Open detail panel instead of modal
    openDetailPanel(task);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const openDetailPanel = (task) => {
    setSelectedTask(task);
    setShowDetailPanel(true);
  };

  const closeDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedTask(null);
  };

  const handleUpdateFromPanel = (updatedTask) => {
    updateTaskMutation.mutate({ 
      taskId: updatedTask.id, 
      taskData: updatedTask 
    });
  };

  // Filter handlers
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleUserFilterChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    handleFilterChange('users', selectedOptions);
  };

  const applyFilters = () => {
    // Only include filters with values
    const filtersToApply = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    setAppliedFilters(filtersToApply);
    setShowFiltersDropdown(false);
  };

  const clearFilters = () => {
    setFilters({
      users: [],
      priority: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setAppliedFilters({});
  };

  const hasActiveFilters = Object.keys(appliedFilters).length > 0;

  // Helper functions for styling
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-orange-100 text-orange-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: 'text-red-600',
      MEDIUM: 'text-amber-600',
      LOW: 'text-emerald-600',
    };
    return colors[priority] || colors.LOW;
  };

  // If no project selected, redirect
  if (!selectedProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No project selected</p>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Header with breadcrumb */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
              <button
                onClick={() => navigate('/admin')}
                className="flex cursor-pointer items-center gap-1 md:gap-2 text-xs md:text-sm text-slate-600 hover:text-slate-900 transition-colors shrink-0"
              >
                <FiArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Projects</span>
                <span className="sm:hidden">Back</span>
              </button>
              
              <div className="h-6 w-px bg-slate-300 shrink-0" />
              
              <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
                <span className="text-xs md:text-sm text-slate-500 shrink-0">Project:</span>
                <h1 className="text-sm md:text-lg font-semibold text-slate-900 truncate">
                  {selectedProject.name}
                </h1>
              </div>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1 md:gap-2 rounded-lg bg-blue-600 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 shrink-0"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex flex-row justify-between shrink-0 border-b border-slate-200 bg-white">
            <div className='flex items-center gap-0 px-4 md:px-6 overflow-x-auto'>
              {[
              { id: 'list', icon: FiList, label: 'List View', shortLabel: 'List' },
              { id: 'board', icon: FiGrid, label: 'Board', shortLabel: 'Board' },
              { id: 'timeline', icon: FiCalendar, label: 'Timeline', shortLabel: 'Timeline' },
            ].map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`flex items-center gap-1 md:gap-2 border-b-2 px-3 md:px-4 py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    currentView === view.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{view.label}</span>
                  <span className="sm:hidden">{view.shortLabel}</span>
                </button>
              );
            })}
            </div>
            
            {/* Filters Section - Desktop */}
            <div className='hidden xl:flex items-center gap-3 py-2 px-6'>
              {/* User Filter */}
              <div className="flex items-center gap-2">
                <FiUser className="text-slate-400" size={16} />
                <select
                  name="user"
                  multiple
                  size="1"
                  value={filters.users}
                  onChange={handleUserFilterChange}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="" className='px-2' disabled>Assignees</option>
                  {users.map(user => (
                    <option  className='px-2' key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <FiTag className="text-slate-400" size={16} />
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Priorities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FiClock className="text-slate-400" size={16} />
                <select
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <FiCalendar className="text-slate-400" size={16} />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="Start Date"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="End Date"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Apply and Clear Buttons */}
              <button
                onClick={applyFilters}
                className="flex items-center gap-2 h-full rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <FiSearch size={14} />                
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 h-full rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  <BiEraser size={14} />
                </button>
              )}
            </div>

            {/* Filters Button - Mobile/Tablet */}
            <div className='xl:hidden flex items-center justify-between px-6 py-3 border-t border-slate-200 relative'>
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
              >
                <FiFilter size={16} />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    {Object.keys(appliedFilters).length}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-200"
                >
                  <BiEraser size={16} />
                  Clear
                </button>
              )}

              {/* Dropdown Menu */}
              {showFiltersDropdown && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowFiltersDropdown(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute w-3xs top-full right-2 z-50 mt-2 mx-4 rounded-lg border border-slate-200 bg-white shadow-xl">
                    <div className="p-4 space-y-4">
                      {/* User Filter */}
                      <div className="space-y-2 p-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiUser className="text-slate-400" size={16} />
                          Assignees
                        </label>
                        <select
                          name="user"
                          multiple
                          size="3"
                          value={filters.users}
                          onChange={handleUserFilterChange}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Priority Filter */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiTag className="text-slate-400" size={16} />
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={filters.priority}
                          onChange={(e) => handleFilterChange('priority', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">All Priorities</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiClock className="text-slate-400" size={16} />
                          Status
                        </label>
                        <select
                          name="status"
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiCalendar className="text-slate-400" size={16} />
                          Date Range
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">From</label>
                            <input
                              type="date"
                              name="startDate"
                              value={filters.startDate}
                              onChange={(e) => handleFilterChange('startDate', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">To</label>
                            <input
                              type="date"
                              name="endDate"
                              value={filters.endDate}
                              onChange={(e) => handleFilterChange('endDate', e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={applyFilters}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <FiSearch size={16} />
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-slate-50 p-3 md:p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading tasks...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Error loading tasks: {error.message}</p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && tasks.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiList size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No tasks yet</p>
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create First Task
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && tasks.length > 0 && (
              <>
                {currentView === 'list' && (
                  <TaskListView
                    tasks={tasks}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                  />
                )}
                {currentView === 'board' && (
                  <TaskBoardView
                    tasks={tasks}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                  />
                )}
                {currentView === 'timeline' && (
                  <TaskTimelineView
                    tasks={tasks}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    getStatusColor={getStatusColor}
                    getPriorityColor={getPriorityColor}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={selectedProject?.id}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onClose={closeTaskModal}
          isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          error={createTaskMutation.error || updateTaskMutation.error}
        />
      )}

      {/* Task Detail Panel */}
      {showDetailPanel && selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projectId={selectedProject?.id}
          onClose={closeDetailPanel}
          onUpdate={handleUpdateFromPanel}
          users={users}
        />
      )}
    </div>
  );
};

export default ProjectTasks;
