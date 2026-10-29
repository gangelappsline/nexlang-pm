import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiUpload, FiFile, FiTrash2, FiDownload } from 'react-icons/fi';
import { getUsers } from '../../api/users';
import { uploadTaskAttachment, downloadTaskAttachment } from '../../api/tasks';
import Toast from '../Toast';

const TaskModal = ({ task, projectId, onSubmit, onClose, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState({
    project_id: projectId,
    title: '',
    description: '',
    instructions: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    assignees: [],
    tags: [],
    section: '',
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [downloadingFiles, setDownloadingFiles] = useState([]);
  const [toast, setToast] = useState(null);

  // Load users for assignees dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers.data);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (task) {
      setFormData({
        project_id: projectId,
        title: task.title || '',
        description: task.description || '',
        instructions: task.instructions || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        estimated_hours: task.estimated_hours || '',
        assignees: task.assignees || [],
        tags: task.tags || [],
        section: task.section || '',
      });
      // Load attachments if available
      if (task.attachments) {
        setAttachments(task.attachments);
      }
    }
  }, [task, projectId]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    });
  };

  const handleAssigneeToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId]
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if task exists (can only upload to existing tasks)
    if (!task || !task.id) {
      setToast({ message: 'Please save the task first before uploading files', type: 'error' });
      return;
    }

    for (const file of files) {
      const uploadId = `${Date.now()}-${file.name}`;
      
      // Add file to uploading state
      setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);

      try {
        const attachment = await uploadTaskAttachment(
          projectId,
          task.id,
          file,
          (progress) => {
            // Update progress
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadId ? { ...f, progress } : f)
            );
          }
        );

        // Remove from uploading state
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));

        // Add to attachments
        if (attachment) {
          setAttachments(prev => [...prev, attachment]);
          setToast({ message: `${file.name} uploaded successfully`, type: 'success' });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
        setToast({ message: `Failed to upload ${file.name}`, type: 'error' });
      }
    }

    // Reset file input
    e.target.value = '';
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleDownloadAttachment = async (attachment) => {
    // Check if task and projectId exist
    if (!task || !task.id || !projectId || !attachment.id) {
      setToast({ message: 'Unable to download: missing information', type: 'error' });
      return;
    }

    // Add to downloading state
    setDownloadingFiles(prev => [...prev, attachment.id]);

    try {
      const response = await downloadTaskAttachment(projectId, task.id, attachment.id);
      
      // Remove from downloading state
      setDownloadingFiles(prev => prev.filter(id => id !== attachment.id));

      if (response && response.download_url) {
        // Open download link in new tab
        window.open(response.download_url, '_blank');
        setToast({ message: 'Download started', type: 'success' });
      } else {
        setToast({ message: 'Download link not available', type: 'error' });
      }
    } catch (err) {
      console.error('Download error:', err);
      setDownloadingFiles(prev => prev.filter(id => id !== attachment.id));
      setToast({ message: `Failed to download ${attachment.filename || attachment.name || 'file'}`, type: 'error' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      estimated_hours: formData.estimated_hours === '' ? null : Number(formData.estimated_hours),
    };
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-10"
        >
          <FiX size={20} />
        </button>

        <h2 className="mb-5 text-xl font-bold text-slate-900">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="e.g., Design user interface"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                placeholder="Brief description of the task..."
                rows="3"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                placeholder="Detailed instructions for completing this task..."
                rows="4"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="e.g., Design, Development, Testing"
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Date and Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Due Date *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimated_hours"
                value={formData.estimated_hours}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignees
            </label>
            {loadingUsers ? (
              <div className="text-sm text-slate-500 py-2">Loading users...</div>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-2 space-y-1">
                {users.length === 0 ? (
                  <div className="text-sm text-slate-500 py-2 text-center">No users available</div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignees.includes(user.id)}
                        onChange={() => handleAssigneeToggle(user.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{user.name || user.email}</span>
                    </label>
                  ))
                )}
              </div>
            )}
            {formData.assignees.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {formData.assignees.length} assignee{formData.assignees.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                <FiPlus size={14} />
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          {task && task.id && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attachments
              </label>
              
              <div className="mb-3">
                <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  <FiUpload size={16} />
                  <span>Choose files to upload</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadingFiles.length > 0}
                  />
                </label>
              </div>

              {/* Uploading files with progress */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {uploadingFiles.map((file) => (
                    <div key={file.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FiUpload className="animate-bounce text-blue-600" size={16} />
                        <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-500">{Math.round(file.progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={attachment.id || index}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
                    >
                      <FiFile className="text-slate-400" size={16} />
                      <span className="flex-1 text-sm text-slate-700 truncate">
                        {attachment.filename || attachment.name || 'Unnamed file'}
                      </span>
                      <button
                        onClick={() => handleDownloadAttachment(attachment)}
                        disabled={downloadingFiles.includes(attachment.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingFiles.includes(attachment.id) ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        ) : (
                          <FiDownload size={12} />
                        )}
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                task ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TaskModal;
