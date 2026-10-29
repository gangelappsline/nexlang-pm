import { useState } from 'react';
import {
  FiFile,
  FiFileText,
  FiImage,
  FiMusic,
  FiVideo,
  FiArchive,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiEdit3,
} from 'react-icons/fi';
import { FaFileWord, FaFileExcel, FaFilePdf } from "react-icons/fa";

const FILE_ICONS = {
  txt: FiFileText,
  docx: FaFileWord,
  doc: FaFileWord,
  xlsx: FaFileExcel,
  xls: FaFileExcel,
  pdf: FaFilePdf,
  jpg: FiImage,
  jpeg: FiImage,
  png: FiImage,
  gif: FiImage,
  mp3: FiMusic,
  wav: FiMusic,
  mp4: FiVideo,
  avi: FiVideo,
  zip: FiArchive,
  rar: FiArchive,
};

const FILE_COLORS = {
  txt: 'text-slate-600',
  docx: 'text-blue-600',
  doc: 'text-blue-600',
  xlsx: 'text-green-600',
  xls: 'text-green-600',
  pdf: 'text-red-600',
  jpg: 'text-purple-600',
  jpeg: 'text-purple-600',
  png: 'text-purple-600',
  gif: 'text-purple-600',
  mp3: 'text-pink-600',
  wav: 'text-pink-600',
  mp4: 'text-orange-600',
  avi: 'text-orange-600',
  zip: 'text-amber-600',
  rar: 'text-amber-600',
};

const EDITABLE_EXTENSIONS = ['txt', 'docx', 'xlsx'];

const FileCard = ({ file, onEdit, onRename, onDelete, onDownload }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const extension = getFileExtension(file.name);
  const Icon = FILE_ICONS[extension] || FiFile;
  const colorClass = FILE_COLORS[extension] || 'text-slate-600';
  const isEditable = EDITABLE_EXTENSIONS.includes(extension);

  const handleRename = async () => {
    if (newName.trim() && newName !== file.name) {
      await onRename(file.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(file.name);
      setIsRenaming(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 cursor-pointer"
      onDoubleClick={() => isEditable && onEdit(file)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">
            <Icon size={32} className={colorClass} />
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
                {file.name}
              </h3>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {formatFileSize(file.size)}
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
                {isEditable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(file);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FiEdit3 size={14} />
                    Edit
                  </button>
                )}
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
                    onDownload(file.id, file.name);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FiDownload size={14} />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(file.id, file.name);
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

export default FileCard;
