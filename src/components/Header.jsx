import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiFolder,
  FiPlus,
  FiMenu,
  FiArrowUpRight,
  FiCheck,
} from 'react-icons/fi';
import { clearAuthToken, clearAuthUser, getAuthUser } from '../utils/auth-storage';
import { useProject } from '../contexts/ProjectContext';
import { useAdminNavigation } from './AdminLayout';
import ProfileModal from './ProfileModal';

const Header = ({ activeNav = 'Projects', onNewProject }) => {
  const [dropdown, setDropdown] = useState(null);
  const [search, setSearch] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [user] = useState(getAuthUser);
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const navigation = useAdminNavigation();
  const { selectedProject, projects, selectProject } = useProject();

  useEffect(() => {
    const close = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setDropdown(null);
    };
    const keyboard = (event) => {
      if (event.key === 'Escape') {
        setDropdown(null);
        searchRef.current?.blur();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        setDropdown('search');
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', keyboard);
    };
  }, []);

  const logout = () => {
    clearAuthToken();
    clearAuthUser();
    navigate('/', { replace: true });
  };
  const openProject = (project) => {
    selectProject(project);
    setDropdown(null);
    setSearch('');
    navigate(
      `/admin/projects/${encodeURIComponent(project.name.toLowerCase().replace(/\s+/g, '-'))}/tasks`
    );
  };
  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const filteredProjects = projects.filter((p) =>
    `${p.name} ${p.code || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <header className="workspace-header" ref={headerRef}>
        <button
          className="mobile-menu icon-button"
          onClick={navigation?.openNavigation}
          aria-label="Abrir navegación"
        >
          <FiMenu size={20} />
        </button>
        <div className="header-search-wrap">
          <label className="workspace-search">
            <span className="search-symbol">
              <FiSearch size={18} />
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setDropdown('search');
              }}
              onFocus={() => setDropdown('search')}
              placeholder="Buscar un proyecto..."
              aria-label="Buscar proyectos"
              aria-expanded={dropdown === 'search'}
              aria-controls="project-search-results"
            />
            <kbd>⌘ K</kbd>
            <span className="search-scope">
              En: <b>Proyectos</b>
            </span>
          </label>
          {dropdown === 'search' && (
            <div className="header-popover search-results" id="project-search-results">
              <div className="popover-label">PROYECTOS · {filteredProjects.length}</div>
              {filteredProjects.length ? (
                filteredProjects.map((project) => (
                  <button key={project.id} onClick={() => openProject(project)}>
                    <FiFolder />
                    <span>
                      {project.name}
                      <small>{project.code || 'Abrir tareas del proyecto'}</small>
                    </span>
                    <FiArrowUpRight />
                  </button>
                ))
              ) : (
                <p className="popover-empty">No se encontraron proyectos.</p>
              )}
            </div>
          )}
        </div>
        <div className="header-actions">
          <div className="project-switcher">
            <button
              className="project-switcher-trigger"
              onClick={() => setDropdown(dropdown === 'projects' ? null : 'projects')}
              aria-expanded={dropdown === 'projects'}
            >
              <span className="project-switcher-dot" />
              <span>{selectedProject?.name || 'Seleccionar proyecto'}</span>
              <FiChevronDown size={13} />
            </button>
            {dropdown === 'projects' && (
              <div className="header-popover project-options">
                <div className="popover-label">CAMBIAR PROYECTO</div>
                {onNewProject && (
                  <button
                    onClick={() => {
                      onNewProject();
                      setDropdown(null);
                    }}
                  >
                    <FiPlus />
                    <span>Nuevo proyecto</span>
                  </button>
                )}
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      selectProject(project);
                      setDropdown(null);
                    }}
                  >
                    <FiFolder />
                    <span>{project.name}</span>
                    {project.id === selectedProject?.id && <FiCheck />}
                  </button>
                ))}
                {!projects.length && (
                  <button
                    onClick={() => {
                      navigate('/admin/projects');
                      setDropdown(null);
                    }}
                  >
                    <FiPlus />
                    <span>Crear tu primer proyecto</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <span className="header-divider" />
          <div className="profile-menu">
            <button
              className="profile-trigger"
              onClick={() => setDropdown(dropdown === 'user' ? null : 'user')}
              aria-label="Menú de usuario"
              aria-expanded={dropdown === 'user'}
            >
              {user?.photo ? <img src={user.photo} alt="" /> : <span>{initials}</span>}
            </button>
            {dropdown === 'user' && (
              <div className="header-popover user-options">
                <div className="user-summary">
                  <strong>{user?.name || 'Mi cuenta'}</strong>
                  <small>{user?.email}</small>
                  <span>{activeNav === 'Dashboard' ? 'Dashboard' : 'Workspace'} · NexLang PM</span>
                </div>
                <button
                  onClick={() => {
                    setProfileOpen(true);
                    setDropdown(null);
                  }}
                >
                  <FiUser />
                  <span>Mi perfil</span>
                </button>
                <button onClick={logout}>
                  <FiLogOut />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user} />
    </>
  );
};

export default Header;
