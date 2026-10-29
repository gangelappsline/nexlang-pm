import { FiHome, FiChevronRight } from 'react-icons/fi';

const Breadcrumbs = ({ path, onNavigate }) => {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <FiHome size={16} />
        <span>Home</span>
      </button>

      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <FiChevronRight size={14} className="text-slate-400" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`transition-colors ${
              index === path.length - 1
                ? 'text-blue-600 font-medium'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
