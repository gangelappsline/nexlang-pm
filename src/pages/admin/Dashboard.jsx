import { createElement, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiArrowUpRight,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFolder,
  FiFlag,
  FiRefreshCw,
  FiSliders,
  FiX,
  FiMoreHorizontal,
  FiLayers,
} from 'react-icons/fi';
import Header from '../../components/Header';
import AdminLayout from '../../components/AdminLayout';
import { useProject } from '../../contexts/ProjectContext';
import { getTasks } from '../../api/tasks';
import { getAuthUser } from '../../utils/auth-storage';
import {
  addDays,
  calendarDays,
  dateKey,
  parseTaskDate,
  taskStatusLabel,
} from '../../utils/calendar';

const shortDate = (date) => date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
const isFinished = (task) => ['completed', 'cancelled', 'rejected'].includes(task.status);

const TaskCard = ({ task, onClick, compact = false }) => {
  const assignees = task.users || task.assignees || [];
  const people = Array.isArray(assignees) ? assignees : [];
  const tone =
    task.status === 'completed'
      ? 'complete'
      : task.priority?.toLowerCase() === 'high'
        ? 'priority'
        : task.status === 'in_progress'
          ? 'progress'
          : 'pending';
  return (
    <button
      className={`agenda-task task-${tone} ${compact ? 'is-compact' : ''}`}
      onClick={() => onClick(task)}
    >
      <span className="task-card-top">
        <span className="task-type-icon">
          {task.status === 'completed' ? (
            <FiCheck />
          ) : task.priority?.toLowerCase() === 'high' ? (
            <FiFlag />
          ) : (
            <FiLayers />
          )}
        </span>
        <FiMoreHorizontal />
      </span>
      <strong>{task.title}</strong>
      {!compact && (
        <>
          {task.description && <p>{task.description}</p>}
          <span className="task-status">
            <span />
            {taskStatusLabel(task.status)}
          </span>
          <span className="task-card-footer">
            <span>
              <FiClock size={11} />
              {task.estimated_hours ? `${task.estimated_hours} h estimated` : 'View details'}
            </span>
            <span className="task-avatars">
              {people.slice(0, 3).map((person, i) => (
                <span key={person.id || i} title={person.name}>
                  {(person.name || person.email || 'U').slice(0, 2).toUpperCase()}
                </span>
              ))}
              {people.length > 3 && <span>+{people.length - 3}</span>}
            </span>
          </span>
        </>
      )}
    </button>
  );
};

const TaskPreview = ({ task, onClose, onOpenTasks }) => {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className="task-preview"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="task-preview-title"
    >
      <div className="preview-top">
        <span className="eyebrow">TASK DETAILS</span>
        <button className="icon-button" onClick={onClose} aria-label="Close task details">
          <FiX />
        </button>
      </div>
      <h2 id="task-preview-title">{task.title}</h2>
      <span className="preview-status">{taskStatusLabel(task.status)}</span>
      <p className="preview-description">
        {task.description || 'This task does not have a description yet.'}
      </p>
      <dl>
        <div>
          <dt>Due date</dt>
          <dd>
            {parseTaskDate(task.due_date)?.toLocaleDateString('en-US', { dateStyle: 'long' }) ||
              'No due date'}
          </dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            {{ high: 'High', medium: 'Medium', low: 'Low' }[task.priority?.toLowerCase()] ||
              'No priority'}
          </dd>
        </div>
      </dl>
      <button className="primary-button" onClick={onOpenTasks}>
        Manage in tasks <FiArrowUpRight />
      </button>
    </dialog>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    selectedProject,
    isLoading: projectsLoading,
    error: projectsError,
    refreshProjects,
  } = useProject();
  const [today] = useState(() => new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState('week');
  const [status, setStatus] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [user] = useState(getAuthUser);

  // Keep the existing endpoint, query key and fetch behavior.
  const {
    data: tasksResponse,
    isLoading: tasksLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tasks', selectedProject?.id],
    queryFn: () => getTasks(selectedProject.id),
    enabled: !!selectedProject?.id,
    staleTime: 5000,
  });
  const tasks = tasksResponse?.data || [];
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const progress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue = tasks.filter(
    (t) =>
      !isFinished(t) &&
      parseTaskDate(t.due_date) &&
      dateKey(parseTaskDate(t.due_date)) < dateKey(today)
  ).length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const days = calendarDays(cursor, view);
  const filteredTasks = tasks.filter((task) => status === 'all' || task.status === status);
  const unscheduled = filteredTasks.filter((task) => !parseTaskDate(task.due_date));
  const visibleTasks = filteredTasks.filter((task) => {
    const date = parseTaskDate(task.due_date);
    return (
      date && dateKey(date) >= dateKey(days[0]) && dateKey(date) <= dateKey(days[days.length - 1])
    );
  });
  const taskPath = `/admin/projects/${encodeURIComponent(selectedProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'nexlang')}/tasks`;
  const openTasks = () => navigate(taskPath);
  const shift = (direction) =>
    setCursor((current) =>
      view === 'month'
        ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
        : addDays(current, direction * 7)
    );
  const loading = projectsLoading || tasksLoading;
  const rangeLabel =
    view === 'month'
      ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : `${shortDate(days[0])} — ${shortDate(days[6])}, ${days[6].getFullYear()}`;

  return (
    <AdminLayout>
      <Header activeNav="Dashboard" />
      <main className="dashboard-content">
        <section className="dashboard-heading">
          <div>
            <div className="eyebrow">
              <span /> YOUR DAY, WITH MORE CLARITY
            </div>
            <h1>
              Ready to move forward{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              <span className="heading-dot">.</span>
            </h1>
            <p>Fewer to-dos, more progress. Make room for what matters.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => (selectedProject ? openTasks() : navigate('/admin/projects'))}
          >
            {selectedProject ? 'Go to my tasks' : 'Create project'}
            <FiArrowUpRight size={17} />
          </button>
        </section>

        <section
          className="dashboard-metrics"
          aria-label="Project overview"
          aria-busy={loading}
        >
          {[
            {
              label: 'Project tasks',
              value: tasks.length,
              icon: FiFolder,
              detail: selectedProject?.name || 'Your workspace',
              className: 'metric-total',
            },
            {
              label: 'In progress',
              value: progress,
              icon: FiClock,
              detail: 'Ideas in motion',
              className: 'metric-progress',
            },
            {
              label: 'Completed',
              value: completed,
              icon: FiCheckCircle,
              detail: `${completionRate}% of the project`,
              className: 'metric-complete',
            },
            {
              label: 'Overdue',
              value: overdue,
              icon: FiFlag,
              detail: overdue ? 'Need your attention' : 'All under control',
              className: 'metric-overdue',
            },
          ].map(({ label, value, icon: Icon, detail, className }) => (
            <article className={`metric-card ${className}`} key={label}>
              <div className="metric-label">
                {label}
                {createElement(Icon, { size: 17 })}
              </div>
              <div className="metric-value">
                {loading ? (
                  <span className="metric-skeleton" />
                ) : error || projectsError ? (
                  '—'
                ) : (
                  String(value).padStart(2, '0')
                )}
                <span className="metric-decoration" />
              </div>
              <div className="metric-detail">
                {detail}
                {label === 'Completed' && (
                  <div className="metric-track">
                    <span style={{ width: `${completionRate}%` }} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="agenda-section" aria-label="Task schedule">
          <div className="agenda-heading">
            <div>
              <h2>
                Your work schedule <span>{visibleTasks.length}</span>
              </h2>
              <p>One step at a time, one project closer.</p>
            </div>
            <div className="agenda-heading-actions">
              <span className="agenda-project-name">
                <span />
                {selectedProject?.name || 'No project'}
              </span>
              <button
                className={`icon-button ${isFetching ? 'is-refreshing' : ''}`}
                title="Refresh tasks"
                aria-label="Refresh tasks"
                disabled={isFetching || !selectedProject}
                onClick={() => refetch()}
              >
                <FiRefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="agenda-toolbar">
            <div className="calendar-navigation">
              <span className="calendar-symbol">
                <FiCalendar size={15} />
              </span>
              <strong aria-live="polite">{rangeLabel}</strong>
              <button
                className="icon-button"
                aria-label="Previous period"
                onClick={() => shift(-1)}
              >
                <FiChevronLeft />
              </button>
              <button
                className="icon-button"
                aria-label="Next period"
                onClick={() => shift(1)}
              >
                <FiChevronRight />
              </button>
            </div>
            <div className="calendar-tools">
              <label className="status-filter">
                <FiSliders size={13} />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Filter tasks by status"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <button className="today-button" onClick={() => setCursor(new Date())}>
                Today
              </button>
              <div className="view-toggle" aria-label="Calendar view">
                {[
                  ['week', 'Week'],
                  ['month', 'Month'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    aria-pressed={view === id}
                    className={view === id ? 'is-active' : ''}
                    onClick={() => setView(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="agenda-loading" role="status">
              <div className="calendar-skeleton">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i}>
                    <span />
                    <span />
                    <span />
                  </div>
                ))}
              </div>
              <p>Setting up your workspace…</p>
            </div>
          ) : error || projectsError ? (
            <div className="agenda-empty" role="alert">
              <FiRefreshCw />
              <h3>We could not load your workspace</h3>
              <p>Your information is safe. Try refreshing again.</p>
              <button
                className="secondary-button"
                onClick={() => (projectsError ? refreshProjects() : refetch())}
              >
                Try again
              </button>
            </div>
          ) : !selectedProject ? (
            <div className="agenda-empty">
              <FiFolder />
              <h3>It all starts with a project</h3>
              <p>Create or select a project to organize your upcoming tasks.</p>
              <button className="primary-button" onClick={() => navigate('/admin/projects')}>
                Explore projects <FiArrowUpRight />
              </button>
            </div>
          ) : (
            <>
              <div className="calendar-scroll">
                <div className={`agenda-calendar ${view === 'month' ? 'month-view' : ''}`}>
                  {view === 'month' &&
                    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div className="month-weekday" key={day}>
                        {day}
                      </div>
                    ))}
                  {days.map((day) => {
                    const key = dateKey(day);
                    const dayTasks = filteredTasks.filter((task) => {
                      const date = parseTaskDate(task.due_date);
                      return date && dateKey(date) === key;
                    });
                    const isToday = key === dateKey(today);
                    return (
                      <div
                        className={`calendar-day ${isToday ? 'is-today' : ''} ${day.getDay() === 0 || day.getDay() === 6 ? 'is-weekend' : ''} ${view === 'month' && day.getMonth() !== cursor.getMonth() ? 'other-month' : ''}`}
                        key={key}
                      >
                        <div className="calendar-day-header">
                          <span>
                            {day.toLocaleDateString('en-US', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <strong>
                            {String(day.getDate()).padStart(2, '0')}
                            <small>
                              {isToday
                                ? 'TODAY'
                                : day
                                    .toLocaleDateString('en-US', { month: 'short' })
                                    .replace('.', '')}
                            </small>
                          </strong>
                          {dayTasks.length > 0 && <i>{dayTasks.length}</i>}
                        </div>
                        <div className="calendar-day-tasks">
                          {dayTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              compact={view === 'month'}
                              onClick={setSelectedTask}
                            />
                          ))}
                          {!dayTasks.length && (
                            <div className="day-empty">
                              <span />
                              {view === 'week' && <small>No deadlines</small>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="agenda-footer">
                <div className="calendar-legend">
                  <span>
                    <i className="legend-pending" />
                    Pending
                  </span>
                  <span>
                    <i className="legend-progress" />
                    In progress
                  </span>
                  <span>
                    <i className="legend-priority" />
                    High priority
                  </span>
                  <span>
                    <i className="legend-complete" />
                    Completed
                  </span>
                </div>
                <span>Tasks are shown by due date</span>
              </div>
              {visibleTasks.length === 0 && (
                <div className="week-empty-note">
                  <FiCalendar size={15} />
                  <span>
                    {tasks.length
                      ? 'No deadlines match this period and filter.'
                      : 'Your schedule is ready. Add your first task from My tasks.'}
                  </span>
                  <button onClick={openTasks}>
                    View tasks <FiArrowRight />
                  </button>
                </div>
              )}
              {unscheduled.length > 0 && (
                <section className="unscheduled-section">
                  <h3>
                    <FiClock size={15} />
                    No due date <span>{unscheduled.length}</span>
                  </h3>
                  <div>
                    {unscheduled.map((task) => (
                      <button key={task.id} onClick={() => setSelectedTask(task)}>
                        <span />
                        {task.title}
                        <FiArrowUpRight />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </section>
        <footer className="dashboard-footer">
          <span>
            <span className="footer-spark">✳</span> A space to focus. A team to go further.
          </span>
          <strong>
            NexLang <span>Workspace</span>
          </strong>
        </footer>
      </main>
      {selectedTask && (
        <TaskPreview
          key={selectedTask.id}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onOpenTasks={openTasks}
        />
      )}
    </AdminLayout>
  );
};

export default Dashboard;
