import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiSearch,
  FiUser,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiFolder,
  FiPlus,
} from 'react-icons/fi';
import { clearAuthToken, clearAuthUser, getAuthUser } from '../utils/auth-storage';
import { useProject } from '../contexts/ProjectContext';
import ProfileModal from './ProfileModal';
import LogoNexLang from '../assets/images/logo.png';

const NAV_LINKS = ['Dashboard', 'Projects', 'Resources', 'Client Portal'];

const Header = ({ activeNav = 'Projects', onNewProject }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const navigate = useNavigate();
  const { selectedProject, projects, selectProject } = useProject();

  useEffect(() => {
    const userData = getAuthUser();
    setUser(userData);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    clearAuthUser();
    navigate('/', { replace: true });
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <>
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg ">
            <img src={LogoNexLang} alt="Logo" className="h-6" />
          </div>
          <span className="text-base font-bold text-slate-900">NexLang</span>
        </div>

        {/* Project Selector */}
        {selectedProject && (
          <div className="relative ml-4" ref={projectDropdownRef}>
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FiFolder size={14} className="text-blue-600" />
              <span className="max-w-50 truncate">{selectedProject.name}</span>
              <FiChevronDown size={14} className={`transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Select Proyect
                </div>
                
                {/* Create New Project Button */}
                {onNewProject && (
                  <button
                    onClick={() => {
                      onNewProject();
                      setIsProjectDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 border-b border-slate-100 mb-1"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                      <FiPlus size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-blue-600">
                        Create New Project
                      </p>
                      <p className="text-xs text-slate-500">Start a new project</p>
                    </div>
                  </button>
                )}
                
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      selectProject(project);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-slate-50 ${
                      selectedProject.id === project.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <FiFolder 
                      size={16} 
                      className={`shrink-0 mt-0.5 ${
                        selectedProject.id === project.id ? 'text-blue-600' : 'text-slate-400'
                      }`} 
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selectedProject.id === project.id ? 'text-blue-600' : 'text-slate-900'
                      }`}>
                        {project.name}
                      </p>
                      {project.code && (
                        <p className="text-xs text-slate-500 truncate">{project.code}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center Nav */}
      <nav className="flex items-center gap-1">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            activeNav === 'Dashboard'
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Dashboard
          {activeNav === 'Dashboard' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => navigate('/admin/projects/nexlang/tasks')}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            activeNav === 'Projects'
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tasks
          {activeNav === 'Projects' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
          )}
        </button>
        <button
          onClick={() => navigate('/admin/resources')}
          className={`relative px-4 py-2 text-sm font-medium transition-colors ${
            activeNav === 'Resources'
              ? 'text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resources
          {activeNav === 'Resources' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
          )}
        </button>
        <button
          className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Client Portal
        </button>
      </nav>

      {/* Right side: search + bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <label className="flex h-9 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 hover:border-slate-300">
          <FiSearch size={15} />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search projects, tasks..."
          />
        </label>

        {/* Bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
          <FiBell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-blue-500 to-indigo-600 ring-2 ring-white hover:ring-blue-200 transition-all"
          >
            { user?.photo ? (
              <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-white">{initials}</span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleProfileClick}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <FiUser size={15} />
                My profile
              </button>
              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                <FiSettings size={15} />
                Configuration
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <FiLogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    
    {/* Profile Modal */}
    <ProfileModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      user={user}
    />
    </>
  );
};

export default Header;
