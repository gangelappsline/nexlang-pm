import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getResources,
  createFolder,
  createFile,
  uploadFile,
  updateResource,
  deleteResource,
  downloadFile,
  getFileContent,
} from '../services/resourceService';

export const useResources = (projectId, parentId = null) => {
  const queryClient = useQueryClient();

  // Fetch resources using TanStack Query
  const { data: resourcesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['resources', projectId, parentId],
    queryFn: () => getResources(projectId, parentId),
    enabled: !!projectId,
    staleTime: 5000,
  });

  const resources = resourcesResponse?.data || [];

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (data) => createFolder(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', projectId, parentId]);
    },
  });

  // Create file mutation
  const createFileMutation = useMutation({
    mutationFn: ({ name, fileType, content }) => 
      createFile(projectId, {
        name,
        file_type: fileType,
        content,
        parent_id: parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', projectId, parentId]);
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: (file) => uploadFile(projectId, file, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', projectId, parentId]);
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }) => updateResource(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', projectId, parentId]);
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id) => deleteResource(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources', projectId, parentId]);
    },
  });

  const handleCreateFolder = async (name) => {
    try {
      const data = { name, parent_id: parentId };
      await createFolderMutation.mutateAsync(data);
      return true;
    } catch (err) {
      console.error('Failed to create folder:', err);
      return false;
    }
  };

  const handleCreateFile = async (name, fileType, content = '') => {
    try {
      await createFileMutation.mutateAsync({ name, fileType, content });
      return true;
    } catch (err) {
      console.error('Failed to create file:', err);
      return false;
    }
  };

  const handleUploadFile = async (file) => {
    try {
      await uploadFileMutation.mutateAsync(file);
      return true;
    } catch (err) {
      console.error('Failed to upload file:', err);
      return false;
    }
  };

  const handleRename = async (id, newName) => {
    try {
      await updateResourceMutation.mutateAsync({ id, data: { name: newName } });
      return true;
    } catch (err) {
      console.error('Failed to rename:', err);
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteResourceMutation.mutateAsync(id);
      return true;
    } catch (err) {
      console.error('Failed to delete:', err);
      return false;
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const blob = await downloadFile(projectId, id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (err) {
      console.error('Failed to download file:', err);
      return false;
    }
  };

  const handleUpdateContent = async (id, content) => {
    try {
      await updateResourceMutation.mutateAsync({ id, data: { content } });
      return true;
    } catch (err) {
      console.error('Failed to save content:', err);
      return false;
    }
  };

  const handleGetContent = async (id) => {
    try {
      const response = await getFileContent(projectId, id);
      return response.data;
    } catch (err) {
      console.error('Failed to get file content:', err);
      return null;
    }
  };

  return {
    resources,
    loading: isLoading,
    error: error?.message || null,
    refresh: refetch,
    createFolder: handleCreateFolder,
    createFile: handleCreateFile,
    uploadFile: handleUploadFile,
    rename: handleRename,
    deleteResource: handleDelete,
    download: handleDownload,
    updateContent: handleUpdateContent,
    getContent: handleGetContent,
  };
};
