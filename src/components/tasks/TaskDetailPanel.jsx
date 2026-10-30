import { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCalendar, 
  FiUser, 
  FiTag, 
  FiClock,
  FiPaperclip,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiMessageSquare,
  FiAtSign,
  FiEdit2
} from 'react-icons/fi';
import { uploadTaskAttachment, downloadTaskAttachment, createTaskComment, updateTaskComment, deleteTaskComment } from '../../api/tasks';
import Toast from '../Toast';

const TaskDetailPanel = ({ task, projectId, onClose, onUpdate, users = [] }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [attachments, setAttachments] = useState(task?.attachments || []);
  const [showUserMentions, setShowUserMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [downloadingFiles, setDownloadingFiles] = useState([]);
  const [toast, setToast] = useState(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);
    setSubtasks(task?.subtasks || []);
    setComments(task?.comments || []);
    setAttachments(task?.attachments || []);
  }, [task]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const newSubtaskItem = {
        id: Date.now(),
        title: newSubtask,
        completed: false,
        created_at: new Date().toISOString()
      };
      const updatedSubtasks = [...subtasks, newSubtaskItem];
      setSubtasks(updatedSubtasks);
      setNewSubtask('');
      onUpdate({ ...task, subtasks: updatedSubtasks });
    }
  };

  const handleToggleSubtask = (subtaskId) => {
    const updatedSubtasks = subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    setSubtasks(updatedSubtasks);
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const getStatusName = (status) => {
    const names = {
        pending: 'Pending',
        'in_progress': 'In Progress',
        rejected: 'Rejected',
        cancelled: 'Cancelled',
        completed: 'Completed',
    };
    return names[status] || status;
  };

  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
    setSubtasks(updatedSubtasks);
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if task and projectId exist
    if (!task || !task.id || !projectId) {
      setToast({ message: 'Unable to upload: missing task or project information', type: 'error' });
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
          const updatedAttachments = [...attachments, attachment];
          setAttachments(updatedAttachments);
          onUpdate({ ...task, attachments: updatedAttachments });
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

  const handleDeleteAttachment = (attachmentId) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    setAttachments(updatedAttachments);
    onUpdate({ ...task, attachments: updatedAttachments });
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
      setToast({ message: `Failed to download ${attachment.name || 'file'}`, type: 'error' });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // Check if task and projectId exist
    if (!task || !task.id || !projectId) {
      setToast({ message: 'Unable to add comment: missing task or project information', type: 'error' });
      return;
    }

    setIsAddingComment(true);

    try {
      const commentData = {
        content: newComment,
        mentions: extractMentions(newComment)
      };

      const createdComment = await createTaskComment(projectId, task.id, commentData);

      const updatedComments = [...comments, createdComment];
      setComments(updatedComments);
      setNewComment('');
      setShowUserMentions(false);
      onUpdate({ ...task, comments: updatedComments });
      setToast({ message: 'Comment added successfully', type: 'success' });
    } catch (err) {
      console.error('Add comment error:', err);
      setToast({ message: 'Failed to add comment', type: 'error' });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;

    // Check if task and projectId exist
    if (!task || !task.id || !projectId) {
      setToast({ message: 'Unable to edit comment: missing information', type: 'error' });
      return;
    }

    try {
      const commentData = {
        text: editingCommentText,
        mentions: extractMentions(editingCommentText)
      };

      const updatedComment = await updateTaskComment(projectId, task.id, commentId, commentData);

      const updatedComments = comments.map(c => c.id === commentId ? updatedComment : c);
      setComments(updatedComments);
      setEditingCommentId(null);
      setEditingCommentText('');
      onUpdate({ ...task, comments: updatedComments });
      setToast({ message: 'Comment updated successfully', type: 'success' });
    } catch (err) {
      console.error('Edit comment error:', err);
      setToast({ message: 'Failed to update comment', type: 'error' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Check if task and projectId exist
    if (!task || !task.id || !projectId) {
      setToast({ message: 'Unable to delete comment: missing information', type: 'error' });
      return;
    }

    setDeletingCommentId(commentId);

    try {
      await deleteTaskComment(projectId, task.id, commentId);

      const updatedComments = comments.filter(c => c.id !== commentId);
      setComments(updatedComments);
      onUpdate({ ...task, comments: updatedComments });
      setToast({ message: 'Comment deleted successfully', type: 'success' });
    } catch (err) {
      console.error('Delete comment error:', err);
      setToast({ message: 'Failed to delete comment', type: 'error' });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  };

  const handleMentionUser = (userName) => {
    setNewComment(newComment + `@${userName} `);
    setShowUserMentions(false);
    setMentionSearch('');
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setNewComment(value);
    
    // Check if user is typing @ to show mentions
    const words = value.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setShowUserMentions(true);
      setMentionSearch(lastWord.slice(1));
    } else {
      setShowUserMentions(false);
      setMentionSearch('');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-orange-100 text-orange-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: 'text-red-600',
      MEDIUM: 'text-amber-600',
      LOW: 'text-emerald-600',
    };
    return colors[priority] || colors.LOW;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-white/30 backdrop-blur-sm transition-all duration-300 ${
          isVisible ? 'bg-opacity-30 backdrop-blur-sm' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      ></div>
      
      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Task Title & Description */}
          <div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
            )}
          </div>

          {/* Task Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiTag size={16} />
                Status
              </label>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}>
                {getStatusName(task.status)}
              </span>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiTag size={16} />
                Priority
              </label>
              <span className={`font-semibold ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiCalendar size={16} />
                Due Date
              </label>
              <p className="text-sm text-slate-600">
                {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US') : 'No due date'}
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiClock size={16} />
                Estimated Hours
              </label>
              <p className="text-sm text-slate-600">
                {task.estimated_hours ? `${task.estimated_hours}h` : 'Not set'}
              </p>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiUser size={16} />
              Assignees
            </label>
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((assignee, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                    <img
                      src={assignee.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random`}
                      alt={assignee.name}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="text-sm text-slate-700">{assignee.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No assignees</p>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FiTag size={16} />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiPaperclip size={16} />
              Attachments ({attachments.length})
            </label>
            
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FiPaperclip size={16} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{attachment.original_filename}</p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString('en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadAttachment(attachment)}
                      disabled={downloadingFiles.includes(attachment.id)}
                      className="rounded p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download"
                    >
                      {downloadingFiles.includes(attachment.id) ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                      ) : (
                        <FiDownload size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="rounded p-1 text-red-600 hover:bg-red-100"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Uploading files with progress */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {uploadingFiles.map((file) => (
                    <div key={file.id} className="rounded-lg border border-slate-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <FiUpload className="animate-bounce text-blue-600" size={16} />
                        <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                        <span className="text-xs text-slate-600 font-medium">{Math.round(file.progress)}%</span>
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

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600">
                <FiUpload size={16} />
                Upload Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFiles.length > 0}
                />
              </label>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiCheck size={16} />
              Subtasks ({subtasks.filter(st => st.completed).length}/{subtasks.length})
            </label>
            
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${subtask.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="rounded p-1 text-red-600 hover:bg-red-100"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a subtask..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleAddSubtask}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <FiPlus size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FiMessageSquare size={16} />
              Comments ({comments.length})
            </label>
            
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={comment.author_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.name || 'User')}&background=random`}
                        alt={comment.user.name || 'User'}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-slate-900">{comment.user.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditComment(comment)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingCommentId === comment.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <FiTrash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditComment}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                      {comment.mentions && comment.mentions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {comment.mentions.map((mention, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                              <FiAtSign size={10} />
                              {mention}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={handleCommentChange}
                  placeholder="Add a comment... Use @ to mention users"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
                
                {showUserMentions && filteredUsers.length > 0 && (
                  <div className="absolute bottom-full mb-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {filteredUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleMentionUser(user.name)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-100"
                      >
                        <img
                          src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                          alt={user.name}
                          className="h-6 w-6 rounded-full"
                        />
                        <span className="text-sm text-slate-700">{user.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Tip: Use @ to mention users
                  </span>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingComment ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <FiMessageSquare size={16} />
                        <span>Comment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default TaskDetailPanel;
