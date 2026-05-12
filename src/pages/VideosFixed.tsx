import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Video, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VideosContent = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {language === 'ar' ? 'رجوع' : language === 'fr' ? 'Retour' : 'Back'}
            </Button>
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {language === 'ar' ? 'الفيديوهات التعليمية' : language === 'fr' ? 'Vidéos Éducatives' : 'Educational Videos'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'شاهد الفيديوهات التعليمية من معلمك وتفاعل معها'
              : language === 'fr'
              ? 'Regardez les vidéos éducatives de votre instructeur et interagissez avec elles'
              : 'Watch educational videos from your instructor and interact with them'
            }
          </p>
        </motion.div>

        {/* Placeholder Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">
            {language === 'ar' ? 'قريباً...' : language === 'fr' ? 'Bientôt...' : 'Coming Soon...'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {language === 'ar' 
              ? 'سيتم تفعيل الفيديوهات التعليمية قريباً'
              : language === 'fr'
              ? 'Les vidéos éducatives seront activées bientôt'
              : 'Educational videos will be activated soon'
            }
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

const VideosFixed = () => {
  return (
    <LanguageProvider>
      <VideosContent />
    </LanguageProvider>
  );
};

export default VideosFixed;