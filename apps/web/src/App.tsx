import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { Layout } from '@caddy-manager/ui';
import { AuthProvider, useAuth } from './api/auth';
import Dashboard from './pages/Dashboard';
import Servers from './pages/Servers';
import Sites from './pages/Sites';
import SiteEditor from './pages/SiteEditor';
import Config from './pages/Config';
import Logs from './pages/Logs';
import Audit from './pages/Audit';
import Login from './pages/Login';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  return <Layout onLogout={logout}>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/servers" element={<Servers />} />
                <Route path="/sites" element={<Sites />} />
                <Route path="/sites/new" element={<SiteEditor />} />
                <Route path="/sites/:id/edit" element={<SiteEditor />} />
                <Route path="/config" element={<Config />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/audit" element={<Audit />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
