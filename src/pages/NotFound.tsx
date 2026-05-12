import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import '../components/style/theme.css';
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-darkest)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 80, height: 80,
          background: 'rgba(245,166,35,0.1)',
          border: '1px solid var(--border-gold)',
          borderRadius: '50%',
          marginBottom: '1.5rem',
          color: 'var(--primary)',
        }}>
          <AlertTriangle size={36} />
        </div>

        {/* 404 Number */}
        <div style={{
          fontSize: 'clamp(5rem, 15vw, 10rem)',
          fontWeight: 900,
          background: 'var(--grad-gold)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: '0.5rem',
          letterSpacing: '-0.04em',
        }}>
          404
        </div>

        <h1 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700,
          color: 'var(--text-white)',
          marginBottom: '0.75rem',
        }}>
          Page Not Found
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--text-muted)',
          marginBottom: '2.5rem',
          maxWidth: 400,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/" className="btn-primary" style={{ fontSize: '0.9375rem' }}>
          <Home size={18} />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
