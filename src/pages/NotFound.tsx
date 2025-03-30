import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useUser } from '@/context/UserContext';
import PlatformLogo from '@/components/PlatformLogo';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  
  useEffect(() => {
    // If user is authenticated and somehow ends up on a 404 page,
    // redirect them to the dashboard after a short delay
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="container flex h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-6">
        <PlatformLogo size="lg" />
        <h1 className="text-3xl font-bold mt-4">Vocalicious Vibe</h1>
      </div>
      <div className="text-center space-y-5">
        <h1 className="text-6xl font-bold mb-6">404</h1>
        <h2 className="text-2xl font-medium mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate('/')} variant="outline">
            Home
          </Button>
        </div>
        {isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-4">
            Redirecting you to the dashboard in a few seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default NotFound;
