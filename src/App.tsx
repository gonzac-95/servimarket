import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from './components/ui/toaster';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import ProviderProfile from './pages/ProviderProfile';
import JobCreate from './pages/JobCreate';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/jobs/new" element={<ProtectedRoute><JobCreate /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
<Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/*" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
