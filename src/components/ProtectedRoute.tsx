import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // إذا لم يكن المستخدم مسجل الدخول، توجيهه إلى صفحة تسجيل الدخول
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان المستخدم مسجل الدخول لكن دوره غير مسموح، توجيهه إلى صفحته المناسبة
  if (!allowedRoles.includes(user.role)) {
    // توجيه المستخدم إلى صفحته الخاصة بناءً على دوره
    switch (user.role) {
      case 'student':
        return <Navigate to="/student-dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // إذا كان كل شيء صحيح، عرض المحتوى
  return <>{children}</>;
};
