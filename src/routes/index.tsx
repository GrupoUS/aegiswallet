import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { VoiceDashboard } from '@/components/voice/VoiceDashboard';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ search: { redirect: '/' }, to: '/login' });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <VoiceDashboard />;
}
