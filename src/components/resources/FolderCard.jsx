import { useState } from 'react';
import { FiFolder, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

const FolderCard = ({ folder, onOpen, onRename, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleRename = async () => {
    if (newName.trim() && newName !== folder.name) {
      await onRename(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(folder.name);
      setIsRenaming(false);
    }
  };

  return (
    <div
      className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 cursor-pointer"
      onDoubleClick={() => onOpen(folder.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">
            <FiFolder size={32} className="text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="text-sm font-medium text-slate-900 truncate">
                {folder.name}
              </h3>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {folder.items_count || 0} items
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiMoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setIsRenaming(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FiEdit2 size={14} />
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(folder.id, folder.name);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiTrash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
