import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject as createProjectApi, updateProject as updateProjectApi, deleteProject as deleteProjectApi } from '../api/projects';

const ProjectContext = createContext(null);

const PROJECT_STORAGE_KEY = 'selectedProjectId';

export const ProjectProvider = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Use TanStack Query to fetch projects
  const {
    data: projectsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const projects = projectsResponse?.data || [];

  // Auto-select project when projects load
  useEffect(() => {
    if (projects.length === 0) return;

    // If already have selected project, check if it still exists
    if (selectedProject) {
      const stillExists = projects.find((p) => p.id === selectedProject.id);
      if (stillExists) return; // Keep current selection if it still exists
    }

    // Try to restore from session storage
    const savedProjectId = sessionStorage.getItem(PROJECT_STORAGE_KEY);
    let projectToSelect = null;

    if (savedProjectId) {
      projectToSelect = projects.find(
        (p) => p.id.toString() === savedProjectId
      );
    }

    // If no saved project, try to use default from environment
    if (!projectToSelect) {
      const defaultProjectId = import.meta.env.VITE_DEFAULT_PROJECT_ID;
      if (defaultProjectId) {
        projectToSelect = projects.find(
          (p) => p.id.toString() === defaultProjectId.toString()
        );
      }
    }

    // If still no project found, select first project
    if (!projectToSelect && projects.length > 0) {
      projectToSelect = projects[0];
    }

    if (projectToSelect) {
      setSelectedProject(projectToSelect);
      sessionStorage.setItem(PROJECT_STORAGE_KEY, projectToSelect.id.toString());
    }
  }, [projects, selectedProject]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: (newProject) => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries(['projects']);
      // Select the newly created project
      selectProject(newProject);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProjectApi(id, data),
    onSuccess: (updatedProject) => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries(['projects']);
      // Update selected project if it's the one being edited
      if (selectedProject?.id === updatedProject.id) {
        setSelectedProject(updatedProject);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectApi,
    onSuccess: (_, deletedId) => {
      // Invalidate and refetch projects
      queryClient.invalidateQueries(['projects']);
      // Clear selection if deleted project was selected
      if (selectedProject?.id === deletedId) {
        setSelectedProject(null);
        sessionStorage.removeItem(PROJECT_STORAGE_KEY);
      }
    },
  });

  const selectProject = (project) => {
    setSelectedProject(project);
    sessionStorage.setItem(PROJECT_STORAGE_KEY, project.id.toString());
  };

  const addProject = async (projectData) => {
    return createMutation.mutateAsync(projectData);
  };

  const updateProjectInList = async (id, projectData) => {
    return updateMutation.mutateAsync({ id, data: projectData });
  };

  const removeProject = async (projectId) => {
    return deleteMutation.mutateAsync(projectId);
  };

  const value = {
    selectedProject,
    projects,
    isLoading,
    error: error?.message || null,
    selectProject,
    addProject,
    updateProjectInList,
    removeProject,
    refreshProjects: refetch,
    // Expose mutation states for better UX
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
