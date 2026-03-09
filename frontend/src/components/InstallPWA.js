import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

const InstallPWA = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt after 5 seconds if not dismissed recently (within 7 days)
    if (daysSinceDismissed > 7 || !dismissed) {
      const timer = setTimeout(() => {
        // For Android/Desktop, check if install prompt is available
        if (window.deferredPrompt || isIOSDevice) {
          setShowPrompt(true);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      window.deferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96"
      >
        {showIOSInstructions ? (
          // iOS Instructions
          <div className="bg-[#1A1A1C] border border-[#D4AF37]/30 rounded-lg p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-white font-semibold">Install on iPhone</h3>
              </div>
              <button onClick={handleDismiss} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="text-gray-300 text-sm space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="bg-[#D4AF37] text-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#D4AF37] text-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#D4AF37] text-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Tap <strong>"Add"</strong> to install BITZ Club</span>
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full py-2 bg-[#D4AF37] text-black font-semibold rounded text-sm hover:bg-[#E6D699] transition-colors"
            >
              Got it!
            </button>
          </div>
        ) : (
          // Install Prompt
          <div className="bg-[#1A1A1C] border border-[#D4AF37]/30 rounded-lg p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-semibold">Install BITZ Club</h3>
                  <button onClick={handleDismiss} className="text-gray-400 hover:text-white -mt-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Add to your home screen for quick access to your membership card and benefits.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 py-2 bg-[#D4AF37] text-black font-semibold rounded text-sm hover:bg-[#E6D699] transition-colors flex items-center justify-center gap-2"
                    data-testid="install-pwa-btn"
                  >
                    <Download className="w-4 h-4" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 border border-white/10 text-gray-400 rounded text-sm hover:bg-white/5 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPWA;
