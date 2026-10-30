import { createElement, createContext, useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiFolder,
  FiCheckSquare,
  FiHardDrive,
  FiLogOut,
  FiChevronLeft,
  FiX,
  FiArrowUpRight,
} from 'react-icons/fi';
import { clearAuthToken, clearAuthUser } from '../utils/auth-storage';
import { useProject } from '../contexts/ProjectContext';
import logo from '../assets/images/logo.png';

const NavigationContext = createContext(null);
// Shared only by the administrative shell and its header.
// eslint-disable-next-line react-refresh/only-export-components
export const useAdminNavigation = () => useContext(NavigationContext);

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { selectedProject, projects } = useProject();
  const navigate = useNavigate();
  const taskPath = `/admin/projects/${encodeURIComponent(selectedProject?.name?.toLowerCase().replace(/\s+/g, '-') || 'nexlang')}/tasks`;
  const logout = () => {
    clearAuthToken();
    clearAuthUser();
    navigate('/', { replace: true });
  };

  return (
    <NavigationContext.Provider value={{ openNavigation: () => setMobileOpen(true) }}>
      <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
        {mobileOpen && (
          <button
            className="sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={`workspace-sidebar ${mobileOpen ? 'is-open' : ''}`}
          aria-label="Main navigation"
        >
          <NavLink
            to="/admin/dashboard"
            className="workspace-brand"
            aria-label="NexLang, home"
            onClick={() => setMobileOpen(false)}
          >
            <span className="brand-mark">
              <img src={logo} alt="" />
            </span>
            <span className="sidebar-label">
              nexlang<span className="brand-dot">.</span>
              <small>PROJECT WORKSPACE</small>
            </span>
          </NavLink>
          <button
            className="sidebar-collapse"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <FiChevronLeft />
          </button>
          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <FiX />
          </button>
          <div className="sidebar-section-label sidebar-label">WORKSPACE</div>
          <nav className="workspace-nav">
            {[
              { to: '/admin/dashboard', icon: FiGrid, label: 'Dashboard' },
              { to: '/admin/projects', icon: FiFolder, label: 'Projects', end: true },
              { to: taskPath, icon: FiCheckSquare, label: 'My tasks' },
              { to: '/admin/resources', icon: FiHardDrive, label: 'Resources' },
            ].map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                title={label}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `workspace-nav-link ${isActive ? 'is-active' : ''}`}
              >
                {createElement(Icon, { size: 19 })}
                <span className="sidebar-label">{label}</span>
                {label === 'Projects' && (
                  <span className="nav-count sidebar-label">{projects.length}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-project sidebar-label">
            <div className="sidebar-section-label">IN YOUR WORKSPACE</div>
            <span className="project-orbit">
              {selectedProject?.name?.slice(0, 2).toUpperCase() || 'NX'}
            </span>
            <p>{selectedProject?.name || 'Your next great project'}</p>
            <span>Great ideas start here.</span>
            <NavLink to="/admin/projects">
              Explore projects <FiArrowUpRight />
            </NavLink>
          </div>
          <div className="sidebar-bottom">
            <div className="workspace-status sidebar-label">
              <span /> Your workspace
            </div>
            <button onClick={logout} title="Sign out">
              <FiLogOut size={18} />
              <span className="sidebar-label">Sign out</span>
            </button>
            <p className="sidebar-label">
              NexLang PM <span>·</span> Built for progress
            </p>
          </div>
        </aside>
        <div className="admin-workspace">{children}</div>
      </div>
    </NavigationContext.Provider>
  );
};

export default AdminLayout;
