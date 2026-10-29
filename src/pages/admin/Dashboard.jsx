import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FiCalendar, 
  FiCheckCircle, 
  FiClock, 
  FiFolder,
  FiUsers,
  FiAlertCircle,
  FiActivity,
  FiTrendingUp,
  FiArrowRight,
  FiTarget,
  FiBarChart2
} from 'react-icons/fi';
import Header from '../../components/Header';
import AdminLayout from '../../components/AdminLayout';
import { useProject } from '../../contexts/ProjectContext';
import { getTasks } from '../../api/tasks';

const Dashboard = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProject();

  // Fetch tasks for the selected project
  const { data: tasksResponse, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedProject?.id],
    queryFn: () => getTasks(selectedProject.id),
    enabled: !!selectedProject?.id,
    staleTime: 5000,
  });

  const tasks = tasksResponse?.data || [];

  // Calculate comprehensive statistics
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    rejectedTasks: tasks.filter(t => t.status === 'rejected').length,
    cancelledTasks: tasks.filter(t => t.status === 'cancelled').length,
    highPriorityTasks: tasks.filter(t => t.priority?.toLowerCase() === 'high').length,
    overdueTasks: tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length,
    dueSoonTasks: tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const daysUntilDue = Math.ceil((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7;
    }).length,
    totalEstimatedHours: tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0),
  };

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // Get urgent tasks (overdue or due soon with high priority)
  const urgentTasks = tasks
    .filter(t => {
      if (t.status === 'completed') return false;
      const isOverdue = t.due_date && new Date(t.due_date) < new Date();
      const isDueSoon = t.due_date && Math.ceil((new Date(t.due_date) - new Date()) / (1000 * 60 * 60 * 24)) <= 3;
      const isHighPriority = t.priority?.toLowerCase() === 'high';
      return isOverdue || (isDueSoon && isHighPriority);
    })
    .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
    .slice(0, 5);

  // Get recent activity
  const recentActivity = [...tasks]
    .filter(t => t.updated_at || t.created_at)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 8);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700 border-slate-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-orange-100 text-orange-700 border-orange-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[status] || colors.pending;
  };

  const getStatusName = (status) => {
    const names = {
      pending: 'Pending',
      in_progress: 'In Progress',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return names[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-amber-600 bg-amber-50 border-amber-200',
      low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    };
    return colors[priority?.toLowerCase()] || colors.low;
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDaysUntilDue = (days) => {
    if (days === null) return 'No due date';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  if (!selectedProject) {
    return (
      <AdminLayout>
        <Header activeNav="Dashboard" />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FiFolder className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">No Project Selected</h3>
            <p className="mt-2 text-sm text-slate-500">Please select a project from the header to view the dashboard.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Header activeNav="Dashboard" />
      
      <div className="space-y-6 p-12">

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiFolder className="text-blue-600" size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{stats.totalTasks}</div>
                <div className="text-xs text-slate-500 mt-1">{stats.totalEstimatedHours}h estimated</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-600">Total Tasks</h3>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <FiCheckCircle className="text-emerald-600" size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{stats.completedTasks}</div>
                <div className="text-xs text-emerald-600 mt-1 font-semibold">{completionRate}% complete</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-600">Completed</h3>
          </div>

          {/* In Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <FiActivity className="text-amber-600" size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{stats.inProgressTasks}</div>
                <div className="text-xs text-slate-500 mt-1">{stats.pendingTasks} pending</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-600">In Progress</h3>
          </div>

          {/* Critical Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertCircle className="text-red-600" size={24} />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-900">{stats.overdueTasks}</div>
                <div className="text-xs text-red-600 mt-1 font-semibold">{stats.dueSoonTasks} due soon</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-slate-600">Overdue</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Distribution */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <FiBarChart2 className="text-blue-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900">Task Distribution</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Completed</span>
                  <span className="text-sm font-bold text-slate-900">{stats.completedTasks}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">In Progress</span>
                  <span className="text-sm font-bold text-slate-900">{stats.inProgressTasks}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Pending</span>
                  <span className="text-sm font-bold text-slate-900">{stats.pendingTasks}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-slate-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.totalTasks > 0 ? (stats.pendingTasks / stats.totalTasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {stats.overdueTasks > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Overdue</span>
                    <span className="text-sm font-bold text-slate-900">{stats.overdueTasks}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.totalTasks > 0 ? (stats.overdueTasks / stats.totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Priority Breakdown */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Priority Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">High Priority</span>
                  <span className="text-sm font-bold text-red-600">{stats.highPriorityTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Due This Week</span>
                  <span className="text-sm font-bold text-amber-600">{stats.dueSoonTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Tasks & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Urgent Tasks */}
            {urgentTasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="text-red-600" size={20} />
                    <h2 className="text-lg font-bold text-slate-900">Urgent Tasks</h2>
                  </div>
                  <span className="inline-block rounded-full px-3 py-1 text-xs font-bold bg-red-100 text-red-700">
                    {urgentTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {urgentTasks.map((task) => {
                    const days = getDaysUntilDue(task.due_date);
                    const isOverdue = days !== null && days < 0;
                    
                    return (
                      <div
                        key={task.id}
                        className="group flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                        onClick={() => navigate(`/admin/projects/${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}/tasks`)}
                      >
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                          {isOverdue ? (
                            <FiAlertCircle className="text-red-600" size={18} />
                          ) : (
                            <FiClock className="text-amber-600" size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                              {formatDaysUntilDue(days)}
                            </span>
                            {task.priority && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <FiArrowRight className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" size={18} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiActivity className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              </div>

              {tasksLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <FiFolder className="mx-auto h-12 w-12 text-slate-200" />
                  <p className="mt-2 text-sm text-slate-500">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((task) => (
                    <div
                      key={task.id}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/projects/${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}/tasks`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Updated {new Date(task.updated_at || task.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold border ${getStatusColor(task.status)}`}>
                        {getStatusName(task.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
