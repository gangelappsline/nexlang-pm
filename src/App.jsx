import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/Login.jsx'
import AdminPage from './pages/admin/Admin.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ProjectTasks from './pages/admin/ProjectTasks.jsx'
import Resources from './pages/admin/Resources.jsx'
import { getAuthToken } from './utils/auth-storage'
import { ProjectProvider } from './contexts/ProjectContext.jsx'

const RequireAuth = ({ children }) => {
  const token = getAuthToken()

  if (!token) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <ProjectProvider>
              <Navigate to="/admin/dashboard" replace />
            </ProjectProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth>
            <ProjectProvider>
              <Dashboard />
            </ProjectProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <RequireAuth>
            <ProjectProvider>
              <AdminPage />
            </ProjectProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/projects/:projectName/tasks"
        element={
          <RequireAuth>
            <ProjectProvider>
              <ProjectTasks />
            </ProjectProvider>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <RequireAuth>
            <ProjectProvider>
              <Resources />
            </ProjectProvider>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
