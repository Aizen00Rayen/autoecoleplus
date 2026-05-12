import { LanguageProvider } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import '../components/style/theme.css';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ titleKey }: { titleKey: string }) => {
  return (
    <LanguageProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg-darkest)', color: 'var(--text-primary)' }}>
        <Navbar />
        <main style={{
          paddingTop: '120px', paddingBottom: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '70vh',
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 72, height: 72,
              background: 'rgba(245,166,35,0.1)',
              border: '1px solid var(--border-gold)',
              borderRadius: '50%',
              marginBottom: '1.5rem',
              color: 'var(--primary)',
            }}>
              <Construction size={32} />
            </div>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, color: 'var(--text-white)',
              marginBottom: '1rem',
            }}>{titleKey}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Cette page est en cours de construction
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export const Services = () => <PlaceholderPage titleKey="Services" />;
