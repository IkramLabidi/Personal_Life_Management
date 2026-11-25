import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Finance from './pages/Finance.jsx';
import Planner from './pages/Planner.jsx';
import Health from './pages/Health.jsx';
import Study from './pages/Study.jsx';
import Calendar from './pages/Calendar.jsx';
import Goals from './pages/Goals.jsx';
import Journal from './pages/Journal.jsx';
import NotFound from './pages/NotFound.jsx';
import Splash from './components/ui/Splash.jsx';

function Protected({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <Splash />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/health" element={<Health />} />
        <Route path="/study" element={<Study />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/journal" element={<Journal />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
