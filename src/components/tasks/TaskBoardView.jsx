import { useState } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Toast from '../Toast';

const TaskBoardView = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  getStatusColor,
  getPriorityColor,
}) => {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [toast, setToast] = useState(null);

  const columns = [
    { id: 'pending', title: 'Pending', color: 'bg-slate-100', borderColor: 'border-slate-300' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100', borderColor: 'border-blue-300' },
    { id: 'rejected', title: 'Rejected', color: 'bg-red-100', borderColor: 'border-red-300' },
    { id: 'cancelled', title: 'Cancelled', color: 'bg-orange-100', borderColor: 'border-orange-300' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  ];

  // Normalize status to match column IDs
  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const lowercaseStatus = String(status).toLowerCase().replace(/\s+/g, '-');
    const statusMap = {
      'todo': 'pending',
      'pending': 'pending',
      'in_progress': 'in_progress',
      'in_progress': 'in_progress',
      'inprogress': 'in_progress',
      'progress': 'in_progress',
      'done': 'completed',
      'completed': 'completed',
      'complete': 'completed',
      'finished': 'completed',
      'blocked': 'rejected',
      'rejected': 'rejected',
      'reject': 'rejected',
      'cancelled': 'cancelled',
      'canceled': 'cancelled',
      'cancel': 'cancelled',
    };
    return statusMap[lowercaseStatus] || 'pending';
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => normalizeStatus(t.status) === status);
  };

  // Debug: Log tasks to see what we're getting
  if (tasks.length > 0) {
    console.log('Tasks in board:', tasks);
    console.log('Task statuses:', tasks.map(t => ({ id: t.id, status: t.status, normalized: normalizeStatus(t.status) })));
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && normalizeStatus(draggedTask.status) !== columnId) {
      try {
        // React Query maneja el optimistic update automáticamente
        await onStatusChange(draggedTask.id, columnId);
        
        // Éxito - mostrar toast
        setToast({ 
          type: 'success', 
          message: 'Task updated successfully!', 
          position: 'bottom-center',
          duration: 2000
        });
      } catch (error) {
        // Error - mostrar mensaje (React Query ya hizo rollback)
        setToast({ 
          type: 'error', 
          message: error?.response?.data?.message || 'Failed to update task. Please try again.',
          position: 'bottom-center',
          duration: 4000
        });
      }
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  // Count total tasks across all columns
  const totalTasksDisplayed = columns.reduce((sum, col) => sum + getTasksByStatus(col.id).length, 0);

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          position={toast.position}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(-20px);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
      
      {tasks.length > 0 && totalTasksDisplayed === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            ⚠️ Found {tasks.length} task{tasks.length !== 1 ? 's' : ''} but none match the board columns. 
            Check console for details.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-5 gap-4">
      {columns.map((column) => (
        <div 
          key={column.id} 
          className={`flex flex-col gap-3 transition-all duration-200 ${
            dragOverColumn === column.id ? 'scale-[1.02]' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className={`rounded-lg ${column.color} px-3 py-2.5 border-2 ${
            dragOverColumn === column.id ? column.borderColor + ' scale-105 shadow-lg' : 'border-transparent'
          } transition-all duration-200`}>
            <h3 className="font-semibold text-slate-900 text-sm">
              {column.title} ({getTasksByStatus(column.id).length})
            </h3>
          </div>

          <div className="space-y-3 flex-1 min-h-50">
            {getTasksByStatus(column.id).length === 0 ? (
              <div className={`rounded-lg border-2 border-dashed ${
                dragOverColumn === column.id ? column.borderColor + ' bg-opacity-50 scale-105' : 'border-slate-200'
              } p-4 text-center text-slate-400 transition-all duration-200`}>
                <p className="text-xs">{dragOverColumn === column.id ? '⬇️ Drop here' : 'No tasks'}</p>
              </div>
            ) : (
              getTasksByStatus(column.id).map((task) => {
                const isDragging = draggedTask?.id === task.id;
                
                return (
                <div
                  key={task.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`relative rounded-lg border bg-white p-3 shadow-sm transition-all duration-200 ${
                    isDragging
                      ? 'opacity-50 scale-95 cursor-grabbing shadow-2xl border-blue-300' 
                      : 'border-slate-200 cursor-grab hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-600"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task.id);
                        }}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-2 flex gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {task.assignees && task.assignees.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-slate-500">Assigned:</span>
                      <span className="text-xs font-medium text-slate-700">
                      </span>
                      {
                        task.assignees.length > 0 && (
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee, idx) => (
                              <img
                                key={idx}
                                src={assignee.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random`}
                                alt={assignee.name}
                                className="h-10 w-10 rounded-full border-2 border-white"
                              />
                            ))}
                            {task.assignees.length > 3 && (
                              <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                +{task.assignees.length - 3}
                              </span>
                            )}  
                          </div>
                        )
                      }
                    </div>
                  )}

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {task.estimated_hours && (
                    <div className="mt-2 text-xs text-slate-500">
                      Est: {task.estimated_hours}h
                    </div>
                  )}
                </div>
              );
              })
            )}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default TaskBoardView;
