import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  allowedRoles: string[];
}

export default function MainLayout({ allowedRoles }: MainLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const redirectMap: Record<string, string> = {
      consultant: '/consultant',
      teacher: '/teacher',
      parent: '/parent',
      admin: '/admin',
    };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
