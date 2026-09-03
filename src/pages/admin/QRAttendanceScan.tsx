// src/pages/admin/QRAttendanceScan.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { 
  Camera, 
  CameraOff, 
  Clock, 
  LogIn, 
  LogOut, 
  ArrowLeft, 
  Upload, 
  RefreshCw, 
  SwitchCamera, 
  AlertCircle,
  Volume2,
  VolumeX,
  QrCode,
  ShieldCheck,
  Activity,
  User,
  Radio,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ScanHistoryItem {
  id: string;
  name: string;
  action: 'time_in' | 'time_out';
  time: string;
  duration?: string;
}

interface CameraDevice {
  id: string;
  label: string;
}

export const QRAttendanceScan: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastScannedUser, setLastScannedUser] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportSize, setViewportSize] = useState<'compact' | 'standard' | 'large' | 'cinema'>('standard');

  // Viewport Height mapping
  const viewportHeights = {
    compact: 'min-h-[340px] h-[340px]',
    standard: 'min-h-[460px] h-[460px]',
    large: 'min-h-[580px] h-[580px]',
    cinema: 'min-h-[700px] h-[700px]',
  };

  // Session Statistics
  const [stats, setStats] = useState({
    todayIn: 0,
    todayOut: 0,
    activeInside: 0,
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoElementId = 'qr-reader-kiosk';

  // Sync fullscreen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast.info('Entered Fullscreen Kiosk Mode (Press ESC to exit)');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.info('Exited Fullscreen Kiosk Mode');
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Live Clock Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load available camera devices on mount
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (isMounted && devices && devices.length > 0) {
          const formatted = devices.map((d, index) => ({
            id: d.id,
            label: d.label || `Camera ${index + 1}`
          }));
          setCameras(formatted);
          const backCam = formatted.find(c =>
            c.label.toLowerCase().includes('back') || 
            c.label.toLowerCase().includes('rear') || 
            c.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : formatted[0].id);
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras on load:', err);
      });

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, []);

  const cleanupScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error during scanner cleanup:', e);
      } finally {
        scannerRef.current = null;
      }
    }
  }, []);

  // Web Audio Synth SFX
  const playSoundEffect = (type: 'in' | 'out' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'in') {
        // High-tech affirmative double beep (C6 -> G6)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.08); // G6

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.08);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.28);
      } else if (type === 'out') {
        // Warm descending checkout chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Low buzz error
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio autoplay policy ignored
    }
  };

  const processQrCode = async (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    const now = Date.now();
    if (now - lastScanTimeRef.current < 2500 || isProcessingRef.current) {
      return;
    }

    lastScanTimeRef.current = now;
    isProcessingRef.current = true;
    setError(null);

    try {
      const response = await api.post('/attendance/scan', { qr_code: cleanCode });

      if (response.data && response.data.success) {
        const data = response.data.data;
        const isTimeOut = data.action === 'time_out';
        const actionLabel = isTimeOut ? 'Time Out' : 'Time In';
        const userName = data.user?.name || data.user_name || 'Member';

        // Play matching sound
        playSoundEffect(isTimeOut ? 'out' : 'in');

        // Update statistics
        setStats(prev => ({
          todayIn: isTimeOut ? prev.todayIn : prev.todayIn + 1,
          todayOut: isTimeOut ? prev.todayOut + 1 : prev.todayOut,
          activeInside: isTimeOut ? Math.max(0, prev.activeInside - 1) : prev.activeInside + 1
        }));

        // Update active HUD overlay
        setLastScannedUser({
          name: userName,
          id: data.user?.id || cleanCode,
          action: data.action,
          time: isTimeOut ? data.time_out : data.time_in,
          duration: data.formatted_duration || null,
          role: data.user?.role || 'Patron'
        });

        // Add to real-time feed
        setRecentScans(prev => [
          {
            id: data.user?.id || cleanCode,
            name: userName,
            action: data.action,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            duration: data.formatted_duration
          },
          ...prev.slice(0, 9)
        ]);

        toast.success(`${actionLabel} recorded for ${userName}!`);

        setTimeout(() => {
          setLastScannedUser(null);
        }, 4000);
      }
    } catch (err: any) {
      playSoundEffect('error');
      const errorMessage = err.response?.data?.message || 'Invalid QR code or attendance processing failed.';
      setError(errorMessage);
      toast.error(errorMessage);

      setTimeout(() => {
        setError(null);
      }, 4000);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  const startScanner = async () => {
    setError(null);
    setIsInitializing(true);

    try {
      await cleanupScanner();

      const readerElem = document.getElementById(videoElementId);
      if (!readerElem) {
        throw new Error('Scanner container element is missing in DOM.');
      }

      const html5QrCode = new Html5Qrcode(videoElementId);
      scannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(220, Math.floor(minEdge * 0.72));
          return { width: boxSize, height: boxSize };
        },
      };

      let cameraConfig: any = { facingMode: 'environment' };
      if (selectedCameraId) {
        cameraConfig = selectedCameraId;
      }

      try {
        await html5QrCode.start(
          cameraConfig,
          scanConfig,
          (decodedText) => processQrCode(decodedText),
          () => {}
        );
      } catch (camErr) {
        console.warn('Preferred camera start failed, trying fallback mode...', camErr);
        await html5QrCode.start(
          { facingMode: 'user' },
          scanConfig,
          (decodedText) => processQrCode(decodedText),
          () => {}
        );
      }

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera Scanner start error:', err);
      let msg = 'Unable to access camera. Please ensure camera permissions are granted in your browser.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Camera access was denied. Please allow camera permissions in your browser address bar.';
      } else if (err?.name === 'NotFoundError' || err?.message?.includes('found')) {
        msg = 'No camera found on this device. You can still scan QR images or enter Member IDs manually.';
      }
      setError(msg);
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    setIsInitializing(true);
    try {
      await cleanupScanner();
      setIsScanning(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopScanner();
      setTimeout(() => {
        startScanner();
      }, 300);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsInitializing(true);

    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedResult = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      if (decodedResult) {
        await processQrCode(decodedResult);
      } else {
        setError('No valid QR code was detected in this image.');
      }
    } catch (err: any) {
      console.error('File scan error:', err);
      setError('Unable to read QR code from the uploaded image.');
    } finally {
      setIsInitializing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate 14 floating QR code particles with random positioning and animation delays
  const floatingParticles = [
    { size: 48, top: '15%', left: '8%', delay: '0s', duration: '18s', opacity: 0.18 },
    { size: 36, top: '45%', left: '14%', delay: '2.5s', duration: '22s', opacity: 0.22 },
    { size: 64, top: '75%', left: '5%', delay: '5s', duration: '26s', opacity: 0.12 },
    { size: 40, top: '25%', left: '88%', delay: '1.2s', duration: '20s', opacity: 0.2 },
    { size: 56, top: '60%', left: '92%', delay: '3.8s', duration: '24s', opacity: 0.15 },
    { size: 32, top: '85%', left: '80%', delay: '6s', duration: '19s', opacity: 0.25 },
    { size: 44, top: '10%', left: '48%', delay: '4s', duration: '21s', opacity: 0.14 },
    { size: 52, top: '80%', left: '42%', delay: '7s', duration: '25s', opacity: 0.16 },
    { size: 28, top: '35%', left: '30%', delay: '2s', duration: '17s', opacity: 0.2 },
    { size: 38, top: '65%', left: '70%', delay: '5.5s', duration: '23s', opacity: 0.18 },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* Hidden File Input for Image QR Scanning */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      <div id="file-scanner-temp" className="hidden" />

      {/* ========================================================= */}
      {/* BACKGROUND INTERACTIVE AMBIENT LAYER & FLOATING QR CODES */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep ambient radial gradient glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-teal-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-950/40 rounded-full blur-[180px]" />

        {/* Cyberpunk grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Floating animated glowing QR Codes */}
        {floatingParticles.map((p, idx) => (
          <div
            key={idx}
            className="absolute transition-transform pointer-events-none"
            style={{
              top: p.top,
              left: p.left,
              animation: `floatDrift ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
              opacity: p.opacity,
            }}
          >
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xs shadow-lg shadow-emerald-500/10 text-emerald-400">
              <QrCode style={{ width: p.size, height: p.size }} />
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* KIOSK HEADER & TERMINAL STATUS BAR */}
      {/* ========================================================= */}
      <header className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                cleanupScanner();
                navigate(-1);
              }}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white rounded-2xl transition-all active:scale-95 shadow-sm group"
              aria-label="Exit Kiosk"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Smart Attendance Terminal</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live Kiosk
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span>Balingasag Municipal Library</span>
                <span>•</span>
                <span className="text-emerald-400/90 font-mono">Circulation Gate #1</span>
              </p>
            </div>
          </div>

          {/* Right: Live Clock, Sound FX & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Clock HUD */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-950/70 border border-slate-800 rounded-2xl shadow-inner font-mono">
              <Clock className="h-4 w-4 text-emerald-400 animate-pulse" />
              <div className="text-right">
                <p className="text-sm font-black text-white leading-none">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Audio SFX Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                toast.info(`Scanner Sound FX ${!soundEnabled ? 'Enabled' : 'Muted'}`);
              }}
              className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
                soundEnabled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-900/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Sound Effects Active' : 'Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Fullscreen Kiosk Mode Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center gap-1.5 ${
                isFullscreen
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-900/20'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen Kiosk Mode'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline text-xs font-bold font-mono">
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </span>
            </button>

            {/* Analytics shortcut */}
            <button
              onClick={() => navigate('/admin/attendance')}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Records & Logs</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN VIEWPORT CANVAS */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checked In Today</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{stats.todayIn}</h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Inside Library Now</p>
                <h3 className="text-xl sm:text-2xl font-black text-teal-300 mt-1">{stats.activeInside}</h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md shadow-lg flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checked Out Today</p>
                <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{stats.todayOut}</h3>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>

          {/* Grid Layout: Scanner (Left 2 cols) & Feed/Manual (Right 1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: Futuristic Camera Scanner Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">
                
                {/* Scanner Title & Camera Device Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Live Optical QR Scanner
                      </h2>
                      <p className="text-xs text-slate-400 font-medium">
                        Position library card QR code inside the target reticle
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Viewport Sizing Pill Switcher */}
                    <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl gap-0.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 hidden sm:inline">Size</span>
                      {[
                        { id: 'compact' as const, label: 'S', title: 'Compact (340px)' },
                        { id: 'standard' as const, label: 'M', title: 'Standard (460px)' },
                        { id: 'large' as const, label: 'L', title: 'Large (580px)' },
                        { id: 'cinema' as const, label: 'XL', title: 'Cinema Kiosk (700px)' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setViewportSize(s.id);
                            toast.info(`Camera Viewport size: ${s.title}`);
                          }}
                          className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                            viewportSize === s.id
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                          }`}
                          title={s.title}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Camera Selection */}
                    {cameras.length > 1 && (
                      <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                        <SwitchCamera className="h-3.5 w-3.5 text-emerald-400" />
                        <select
                          value={selectedCameraId}
                          onChange={(e) => handleCameraChange(e.target.value)}
                          disabled={isInitializing}
                          className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          {cameras.map((c) => (
                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Viewport Fullscreen Button */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="p-1.5 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk Mode'}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4 text-emerald-400" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Video Target Viewport with dynamic height */}
                <div
                  id="qr-reader-kiosk-wrapper"
                  className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 ${viewportHeights[viewportSize]} flex items-center justify-center shadow-inner group`}
                >
                  
                  {/* HTML5 QR Scanner Video Container */}
                  <div
                    id={videoElementId}
                    className="w-full h-full flex items-center justify-center"
                  />

                  {/* ACTIVE CAMERA HUD RETICLE & LASER OVERLAY */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                      {/* Target Reticle Box */}
                      <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-emerald-500/30 rounded-3xl animate-pulse-glow">
                        
                        {/* Glowing Corner Brackets */}
                        <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl shadow-sm shadow-emerald-400" />
                        <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl shadow-sm shadow-emerald-400" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl shadow-sm shadow-emerald-400" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl shadow-sm shadow-emerald-400" />

                        {/* Animated Laser Scanning Line */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-laser-scan" />

                        {/* Center Target Aim Cross */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center opacity-40">
                          <div className="w-full h-0.5 bg-emerald-400" />
                          <div className="h-full w-0.5 bg-emerald-400 absolute" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IDLE / CAMERA OFF STATE PLACEHOLDER */}
                  {!isScanning && (
                    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-5 z-10 animate-fade-in">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                          <Camera className="h-10 w-10 animate-pulse" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                          <Radio className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-base sm:text-lg font-black text-white">
                          Camera Scanner Standby
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Activate the camera to scan patron library cards, or upload a digital QR screenshot.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={startScanner}
                          disabled={isInitializing}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold rounded-2xl flex items-center gap-2.5 transition-all shadow-lg shadow-emerald-950/60 text-xs sm:text-sm active:scale-95"
                        >
                          {isInitializing ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Activating Video Stream...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              <span>Start Camera Scanner</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-3 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-2xl flex items-center gap-2 text-xs sm:text-sm transition-all active:scale-95 shadow-md"
                        >
                          <Upload className="h-4 w-4 text-emerald-400" />
                          <span>Upload QR File</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE SCANNED MEMBER OVERLAY HUD MODAL */}
                  {lastScannedUser && (
                    <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-lg p-6 animate-fade-in transition-all ${
                      lastScannedUser.action === 'time_out'
                        ? 'bg-amber-950/90 border-2 border-amber-500/50'
                        : 'bg-emerald-950/90 border-2 border-emerald-500/50'
                    }`}>
                      <div className="text-center text-white space-y-4 max-w-sm w-full animate-scale-up">
                        {/* Circular Action Badge */}
                        <div className={`h-20 w-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border ${
                          lastScannedUser.action === 'time_out'
                            ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-amber-400 text-white shadow-amber-900/60'
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400 text-white shadow-emerald-900/60'
                        }`}>
                          {lastScannedUser.action === 'time_out' ? (
                            <LogOut className="h-10 w-10" />
                          ) : (
                            <LogIn className="h-10 w-10" />
                          )}
                        </div>

                        <div>
                          <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 border ${
                            lastScannedUser.action === 'time_out'
                              ? 'bg-amber-400 text-amber-950 border-amber-300'
                              : 'bg-emerald-400 text-emerald-950 border-emerald-300'
                          }`}>
                            {lastScannedUser.action === 'time_out' ? 'TIME OUT VERIFIED' : 'TIME IN VERIFIED'}
                          </span>
                          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{lastScannedUser.name}</h3>
                          <p className="text-xs font-mono font-bold text-slate-300 mt-1">
                            Card ID: {lastScannedUser.id}
                          </p>
                          {lastScannedUser.duration && (
                            <div className="mt-3 p-3 rounded-2xl bg-black/40 border border-amber-500/30 text-amber-200 font-mono text-xs font-bold">
                              Session Duration: {lastScannedUser.duration}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Toolbar when Active */}
                {isScanning && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-emerald-400">Scanner active and ready</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Upload className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopScanner}
                        disabled={isInitializing}
                        className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs active:scale-95"
                      >
                        <CameraOff className="h-3.5 w-3.5" />
                        <span>Stop Scanner</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-300 text-xs animate-fade-in">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <p className="font-extrabold">Notice</p>
                      <p className="text-[11px] leading-relaxed text-rose-200/90 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time Attendance Activity Stream */}
            <div className="space-y-6">
              {/* Real-time Attendance Feed */}
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-extrabold text-white">Live Activity Stream</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                    Session Log
                  </span>
                </div>

                {recentScans.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 space-y-2">
                    <Clock className="h-7 w-7 mx-auto opacity-30 animate-pulse" />
                    <p className="text-xs font-semibold">Awaiting initial attendance scans...</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                    {recentScans.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs transition-all hover:border-slate-700 animate-fade-in"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl flex-shrink-0 ${
                            item.action === 'time_out'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {item.action === 'time_out' ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.time}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono flex-shrink-0 ${
                          item.action === 'time_out'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                          {item.action === 'time_out' ? 'OUT' : 'IN'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kiosk Guidelines */}
              <div className="p-4 rounded-3xl bg-slate-900/40 border border-slate-800/60 text-slate-400 text-xs space-y-2">
                <p className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Terminal Protocol
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  First scan executes <strong>Time In</strong>. Second scan automatically computes session duration and registers <strong>Time Out</strong>.
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default QRAttendanceScan;
