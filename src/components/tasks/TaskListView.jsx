import { FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';

const TaskListView = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  getStatusColor,
  getPriorityColor,
}) => {
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      'in-progress': 'In Progress',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Task
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Assigned
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                  No tasks yet. Create one to get started.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        onStatusChange(task.id, e.target.value)
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold outline-none cursor-pointer ${getStatusColor(
                        task.status
                      )}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-semibold text-sm ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.assignees && task.assignees.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 3).map((assignee, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={assignee.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random`}
                                alt={assignee.name}
                                className="h-8 w-8 rounded-full border-2 border-white"
                              />
                              <div className="absolute bottom-full mb-1 hidden group-hover:block rounded bg-slate-700 px-2 py-1 text-xs text-white whitespace-nowrap z-10">
                                {assignee.name}
                              </div>
                            </div>
                          ))}
                        </div>
                        {task.assignees.length > 3 && (
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            +{task.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {task.tags && task.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
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
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskListView;
