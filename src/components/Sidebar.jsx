import {
  FiList,
  FiClock,
  FiStar,
  FiPlus,
} from 'react-icons/fi';

const DEPARTMENTS = [
  { name: 'Legal', color: 'bg-blue-500' },
  { name: 'Marketing', color: 'bg-pink-500' },
  { name: 'Tech Docs', color: 'bg-emerald-500' },
];

const Sidebar = ({
  activeSection,
  activeDept,
  onSectionChange,
  onDeptChange,
  onNewProject,
  totalProjects = 0,
  maxProjects = 50,
}) => {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* New Project button */}
      <div className="p-4">
        <button
          onClick={onNewProject}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <FiPlus size={16} />
          New Project
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        <p className="mt-3 mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Main
        </p>

        {[
          { id: 'all', icon: FiList, label: 'All Projects' },
          { id: 'recent', icon: FiClock, label: 'Recent' },
          { id: 'starred', icon: FiStar, label: 'Starred' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeSection === id && !activeDept
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}

        <p className="mt-4 mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Departments
        </p>

        {DEPARTMENTS.map(({ name, color }) => (
          <button
            key={name}
            onClick={() => onDeptChange(name)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeDept === name
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${color}`} />
            {name}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            ET
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Enterprise Tier</p>
            <p className="text-xs text-slate-500">
              {totalProjects}/{maxProjects} active projects
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
