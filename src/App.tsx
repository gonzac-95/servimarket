import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './lib/theme';
import { Toaster as MobileToaster } from './components/mobile/kit';
import NativeBridge from './components/NativeBridge';

// Pages
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import DeleteAccountInfo from './pages/DeleteAccountInfo';
import Help from './pages/Help';
import Search from './pages/Search';
import ProviderProfile from './pages/ProviderProfile';
import JobCreate from './pages/JobCreate';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import ProviderHome from './pages/ProviderHome';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import EditProfile from './pages/EditProfile';
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <NativeBridge />
          <Routes>
            {/* Público / onboarding */}
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacidad" element={<PrivacyPolicy />} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/eliminar-cuenta" element={<DeleteAccountInfo />} />
            <Route path="/help" element={<Help />} />
            <Route path="/search" element={<Search />} />
            <Route path="/provider/:id" element={<ProviderProfile />} />

            {/* Protegidas */}
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/provider" element={<ProtectedRoute><ProviderHome /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute><JobCreate /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <MobileToaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
