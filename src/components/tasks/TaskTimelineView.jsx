import { FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';

const TaskTimelineView = ({
  tasks,
  onEdit,
  onDelete,
  getStatusColor,
  getPriorityColor,
}) => {
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      'in_progress': 'In Progress',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const getStatusIcon = (status) => {
    const icons = {
      completed: 'text-emerald-600',
      'in_progress': 'text-blue-600',
      rejected: 'text-red-600',
      cancelled: 'text-orange-600',
      pending: 'text-slate-400',
    };
    return icons[status] || icons.pending;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getTaskPosition = (dueDate) => {
    if (!dueDate) return 'No Due Date';
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const daysFromNow = Math.floor(
      (taskDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysFromNow < 0) return 'Overdue';
    if (daysFromNow === 0) return 'Today';
    if (daysFromNow === 1) return 'Tomorrow';
    if (daysFromNow <= 7) return 'This Week';
    if (daysFromNow <= 30) return 'This Month';
    return 'Upcoming';
  };

  const groupedTasks = sortedTasks.reduce((groups, task) => {
    const position = getTaskPosition(task.due_date);
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(task);
    return groups;
  }, {});

  const timelineOrder = [
    'Overdue',
    'Today',
    'Tomorrow',
    'This Week',
    'This Month',
    'Upcoming',
    'No Due Date',
  ];

  return (
    <div className="space-y-6">
      {timelineOrder.map((period) => {
        if (!groupedTasks[period] || groupedTasks[period].length === 0) {
          return null;
        }

        const isOverdue = period === 'Overdue';
        const isToday = period === 'Today';

        return (
          <div key={period}>
            <div
              className={`mb-4 flex items-center gap-3 rounded-lg px-4 py-2 ${
                isOverdue
                  ? 'bg-red-100'
                  : isToday
                  ? 'bg-amber-100'
                  : 'bg-blue-100'
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full ${
                  isOverdue 
                    ? 'bg-red-600' 
                    : isToday 
                    ? 'bg-amber-600'
                    : 'bg-blue-600'
                }`}
              />
              <h3 className={`font-semibold ${
                isOverdue
                  ? 'text-red-900'
                  : isToday
                  ? 'text-amber-900'
                  : 'text-blue-900'
              }`}>
                {period}
              </h3>
              <span
                className={`text-xs font-semibold ${
                  isOverdue
                    ? 'text-red-700'
                    : isToday
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}
              >
                ({groupedTasks[period].length})
              </span>
            </div>

            <div className="space-y-3 border-l-4 border-slate-200 pl-4">
              {groupedTasks[period].map((task, index) => (
                <div
                  key={task.id}
                  className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  {index === 0 && (
                    <div className="absolute -left-3.25 top-6 h-6 w-6 rounded-full border-4 border-white bg-blue-500" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-slate-900">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(task)}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-blue-100 hover:text-blue-600"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="rounded p-1 text-slate-600 transition-colors hover:bg-red-100 hover:text-red-600"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                    <span
                      className={`inline-block font-semibold text-sm ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="inline-block rounded bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {new Date(task.due_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Assigned to: {task.assignees.length} user{task.assignees.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 3 && (
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            +{task.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {task.estimated_hours && (
                      <div className="text-xs text-slate-500">
                        Estimated: {task.estimated_hours}h
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskTimelineView;
