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

const shortDate = (date) => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
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
              {task.estimated_hours ? `${task.estimated_hours} h estimadas` : 'Ver detalles'}
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
        <span className="eyebrow">DETALLE DE TAREA</span>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
          <FiX />
        </button>
      </div>
      <h2 id="task-preview-title">{task.title}</h2>
      <span className="preview-status">{taskStatusLabel(task.status)}</span>
      <p className="preview-description">
        {task.description || 'Esta tarea aún no tiene una descripción.'}
      </p>
      <dl>
        <div>
          <dt>Fecha de entrega</dt>
          <dd>
            {parseTaskDate(task.due_date)?.toLocaleDateString('es-MX', { dateStyle: 'long' }) ||
              'Sin fecha'}
          </dd>
        </div>
        <div>
          <dt>Prioridad</dt>
          <dd>
            {{ high: 'Alta', medium: 'Media', low: 'Baja' }[task.priority?.toLowerCase()] ||
              'Sin prioridad'}
          </dd>
        </div>
      </dl>
      <button className="primary-button" onClick={onOpenTasks}>
        Gestionar en tareas <FiArrowUpRight />
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
      ? cursor.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
      : `${shortDate(days[0])} — ${shortDate(days[6])}, ${days[6].getFullYear()}`;

  return (
    <AdminLayout>
      <Header activeNav="Dashboard" />
      <main className="dashboard-content">
        <section className="dashboard-heading">
          <div>
            <div className="eyebrow">
              <span /> TU DÍA, CON MÁS CLARIDAD
            </div>
            <h1>
              Todo listo para avanzar{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              <span className="heading-dot">.</span>
            </h1>
            <p>Menos pendientes, más progreso. Dale espacio a lo importante.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => (selectedProject ? openTasks() : navigate('/admin/projects'))}
          >
            {selectedProject ? 'Ir a mis tareas' : 'Crear proyecto'}
            <FiArrowUpRight size={17} />
          </button>
        </section>

        <section
          className="dashboard-metrics"
          aria-label="Resumen del proyecto"
          aria-busy={loading}
        >
          {[
            {
              label: 'Tareas del proyecto',
              value: tasks.length,
              icon: FiFolder,
              detail: selectedProject?.name || 'Tu espacio de trabajo',
              className: 'metric-total',
            },
            {
              label: 'En progreso',
              value: progress,
              icon: FiClock,
              detail: 'Ideas en movimiento',
              className: 'metric-progress',
            },
            {
              label: 'Completadas',
              value: completed,
              icon: FiCheckCircle,
              detail: `${completionRate}% del proyecto`,
              className: 'metric-complete',
            },
            {
              label: 'Fuera de plazo',
              value: overdue,
              icon: FiFlag,
              detail: overdue ? 'Necesitan tu atención' : 'Todo bajo control',
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
                {label === 'Completadas' && (
                  <div className="metric-track">
                    <span style={{ width: `${completionRate}%` }} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="agenda-section" aria-label="Agenda de tareas">
          <div className="agenda-heading">
            <div>
              <h2>
                Tu agenda de trabajo <span>{visibleTasks.length}</span>
              </h2>
              <p>Un paso a la vez, un proyecto más cerca.</p>
            </div>
            <div className="agenda-heading-actions">
              <span className="agenda-project-name">
                <span />
                {selectedProject?.name || 'Sin proyecto'}
              </span>
              <button
                className={`icon-button ${isFetching ? 'is-refreshing' : ''}`}
                title="Actualizar tareas"
                aria-label="Actualizar tareas"
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
                aria-label="Periodo anterior"
                onClick={() => shift(-1)}
              >
                <FiChevronLeft />
              </button>
              <button
                className="icon-button"
                aria-label="Periodo siguiente"
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
                  aria-label="Filtrar tareas por estado"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="rejected">Rechazadas</option>
                </select>
              </label>
              <button className="today-button" onClick={() => setCursor(new Date())}>
                Hoy
              </button>
              <div className="view-toggle" aria-label="Vista de calendario">
                {[
                  ['week', 'Semana'],
                  ['month', 'Mes'],
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
              <p>Organizando tu espacio de trabajo…</p>
            </div>
          ) : error || projectsError ? (
            <div className="agenda-empty" role="alert">
              <FiRefreshCw />
              <h3>No pudimos cargar tu espacio</h3>
              <p>Tu información sigue a salvo. Intenta actualizar de nuevo.</p>
              <button
                className="secondary-button"
                onClick={() => (projectsError ? refreshProjects() : refetch())}
              >
                Reintentar
              </button>
            </div>
          ) : !selectedProject ? (
            <div className="agenda-empty">
              <FiFolder />
              <h3>Todo empieza con un proyecto</h3>
              <p>Crea o selecciona un proyecto para organizar tus próximas tareas.</p>
              <button className="primary-button" onClick={() => navigate('/admin/projects')}>
                Explorar proyectos <FiArrowUpRight />
              </button>
            </div>
          ) : (
            <>
              <div className="calendar-scroll">
                <div className={`agenda-calendar ${view === 'month' ? 'month-view' : ''}`}>
                  {view === 'month' &&
                    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
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
                            {day.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <strong>
                            {String(day.getDate()).padStart(2, '0')}
                            <small>
                              {isToday
                                ? 'HOY'
                                : day
                                    .toLocaleDateString('es-MX', { month: 'short' })
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
                              {view === 'week' && <small>Sin entregas</small>}
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
                    Pendiente
                  </span>
                  <span>
                    <i className="legend-progress" />
                    En progreso
                  </span>
                  <span>
                    <i className="legend-priority" />
                    Alta prioridad
                  </span>
                  <span>
                    <i className="legend-complete" />
                    Completada
                  </span>
                </div>
                <span>Las tareas se muestran por fecha de entrega</span>
              </div>
              {visibleTasks.length === 0 && (
                <div className="week-empty-note">
                  <FiCalendar size={15} />
                  <span>
                    {tasks.length
                      ? 'No hay entregas para este periodo y filtro.'
                      : 'Tu agenda está lista. Agrega la primera tarea desde Mis tareas.'}
                  </span>
                  <button onClick={openTasks}>
                    Ver tareas <FiArrowRight />
                  </button>
                </div>
              )}
              {unscheduled.length > 0 && (
                <section className="unscheduled-section">
                  <h3>
                    <FiClock size={15} />
                    Sin fecha de entrega <span>{unscheduled.length}</span>
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
            <span className="footer-spark">✳</span> Un espacio para enfocarte. Un equipo para llegar
            más lejos.
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
