import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUpload, FiFileText, FiFolder as FiFolderIcon } from 'react-icons/fi';
import { FaFileWord, FaFileExcel, FaFilePdf } from "react-icons/fa";
import Swal from 'sweetalert2';
import { useProject } from '../../contexts/ProjectContext';
import { useResources } from '../../hooks/useResources';
import Header from '../../components/Header';
import AdminLayout from '../../components/AdminLayout';
import Breadcrumbs from '../../components/resources/Breadcrumbs';
import FolderCard from '../../components/resources/FolderCard';
import FileCard from '../../components/resources/FileCard';
import FileUploader from '../../components/resources/FileUploader';
import TxtEditor from '../../components/resources/TxtEditor';
import DocxEditor from '../../components/resources/DocxEditor';
import XlsxEditor from '../../components/resources/XlsxEditor';

const Resources = () => {
  const navigate = useNavigate();
  const { selectedProject } = useProject();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [showUploader, setShowUploader] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  const {
    resources,
    loading,
    error,
    refresh,
    createFolder,
    createFile,
    uploadFile,
    rename,
    deleteResource,
    download,
    updateContent,
    getContent,
  } = useResources(selectedProject?.id, currentFolderId);

  const folders = resources.filter(r => r.type === 'folder');
  const files = resources.filter(r => r.type === 'file');

  const handleNavigateToFolder = (folderId) => {
    if (folderId === null) {
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const folder = resources.find(r => r.id === folderId);
      if (folder) {
        setCurrentFolderId(folderId);
        const folderIndex = folderPath.findIndex(f => f.id === folderId);
        if (folderIndex >= 0) {
          setFolderPath(folderPath.slice(0, folderIndex + 1));
        } else {
          setFolderPath([...folderPath, { id: folderId, name: folder.name }]);
        }
      }
    }
  };

  const handleCreateFolder = async () => {
    const result = await Swal.fire({
      title: 'New Folder',
      input: 'text',
      inputLabel: 'Folder name',
      inputPlaceholder: 'Enter folder name',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a folder name';
        }
      },
    });

    if (result.isConfirmed && result.value) {
      const success = await createFolder(result.value);
      if (success) {
        await Swal.fire({
          title: 'Success',
          text: 'Folder created successfully',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
        });
      }
    }
  };

  const handleCreateFile = async (fileType) => {
    setShowNewMenu(false);

    const extensions = {
      txt: '.txt',
      docx: '.docx',
      xlsx: '.xlsx',
    };

    const result = await Swal.fire({
      title: `New ${fileType.toUpperCase()} File`,
      input: 'text',
      inputLabel: 'File name',
      inputPlaceholder: `Enter file name`,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a file name';
        }
      },
    });

    if (result.isConfirmed && result.value) {
      let fileName = result.value;
      if (!fileName.endsWith(extensions[fileType])) {
        fileName += extensions[fileType];
      }

      const success = await createFile(fileName, fileType, '');
      if (success) {
        await Swal.fire({
          title: 'Success',
          text: 'File created successfully',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
        });
      }
    }
  };

  const handleUploadFile = async (file) => {
    const success = await uploadFile(file);
    return success;
  };

  const handleRename = async (id, newName) => {
    const success = await rename(id, newName);
    if (success) {
      await Swal.fire({
        title: 'Success',
        text: 'Renamed successfully',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 1500,
      });
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Delete',
      text: `Are you sure you want to delete "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      const success = await deleteResource(id);
      if (success) {
        await Swal.fire({
          title: 'Deleted',
          text: 'Resource deleted successfully',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 1500,
        });
      }
    }
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
  };

  const handleSaveFile = async (id, content) => {
    const success = await updateContent(id, content);
    if (success) {
      await Swal.fire({
        title: 'Saved',
        text: 'File saved successfully',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 1500,
      });
      refresh();
    }
    return success;
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const renderEditor = () => {
    if (!editingFile) return null;

    const extension = getFileExtension(editingFile.name);

    if (extension === 'txt') {
      return (
        <TxtEditor
          file={editingFile}
          onSave={handleSaveFile}
          onClose={() => setEditingFile(null)}
          getContent={getContent}
        />
      );
    }

    if (extension === 'docx') {
      return (
        <DocxEditor
          file={editingFile}
          onSave={handleSaveFile}
          onClose={() => setEditingFile(null)}
          getContent={getContent}
        />
      );
    }

    if (extension === 'xlsx') {
      return (
        <XlsxEditor
          file={editingFile}
          onSave={handleSaveFile}
          onClose={() => setEditingFile(null)}
          getContent={getContent}
        />
      );
    }

    return null;
  };

  // If no project selected, redirect
  if (!selectedProject) {
    return (
      <AdminLayout>
        <Header activeNav="Resources" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 mb-4">No project selected</p>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Header activeNav="Resources" />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploader(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <FiUpload size={16} />
                  Upload
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowNewMenu(!showNewMenu)}
                    className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-200"
                  >
                    <FiPlus size={16} />
                    New
                  </button>

                  {showNewMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowNewMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                        <button
                          onClick={handleCreateFolder}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FiFolderIcon size={18} className="text-blue-500" />
                          <div className="text-left">
                            <div className="font-medium">Folder</div>
                            <div className="text-xs text-slate-500">Create new folder</div>
                          </div>
                        </button>
                        <div className="my-1 h-px bg-slate-200" />
                        <button
                          onClick={() => handleCreateFile('txt')}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FiFileText size={18} className="text-slate-600" />
                          <div className="text-left">
                            <div className="font-medium">Text File</div>
                            <div className="text-xs text-slate-500">Create .txt file</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleCreateFile('docx')}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FaFileWord size={18} className="text-blue-600" />
                          <div className="text-left">
                            <div className="font-medium">Word Document</div>
                            <div className="text-xs text-slate-500">Create .docx file</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleCreateFile('xlsx')}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <FaFileExcel size={18} className="text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Excel Spreadsheet</div>
                            <div className="text-xs text-slate-500">Create .xlsx file</div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Breadcrumbs path={folderPath} onNavigate={handleNavigateToFolder} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading resources...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-600 mb-4">Error: {error}</p>
                  <button
                    onClick={refresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && resources.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FiFolderIcon size={64} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No files or folders</h3>
                  <p className="text-slate-600 mb-6">Get started by creating a folder or uploading files</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleCreateFolder}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                    >
                      Create Folder
                    </button>
                    <button
                      onClick={() => setShowUploader(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Upload Files
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && resources.length > 0 && (
              <div className="space-y-6">
                {folders.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Folders</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {folders.map(folder => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          onOpen={handleNavigateToFolder}
                          onRename={handleRename}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Files</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {files.map(file => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onEdit={handleEditFile}
                          onRename={handleRename}
                          onDelete={handleDelete}
                          onDownload={download}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {showUploader && (
        <FileUploader
          onUpload={handleUploadFile}
          onClose={() => setShowUploader(false)}
        />
      )}

      {renderEditor()}
    </AdminLayout>
  );
};

export default Resources;
