// src/pages/admin/QRAttendanceScan.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { 
  Camera, CameraOff, CheckCircle, XCircle, Clock, User, LogIn, LogOut, 
  ArrowLeft, Send, Sparkles, Upload, RefreshCw, SwitchCamera, AlertCircle 
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
  const [manualCode, setManualCode] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScanTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoElementId = 'qr-reader';

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
          // Prefer back/environment camera if available, otherwise default to first
          const backCam = formatted.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment'));
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

  const playBuzzerSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // High frequency beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.25);
    } catch (err) {
      // Audio autoplay restrictions ignored
    }
  };

  const processQrCode = async (decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    // Debounce to prevent multiple immediate triggers
    const now = Date.now();
    if (now - lastScanTimeRef.current < 2500 || isProcessingRef.current) {
      return;
    }

    lastScanTimeRef.current = now;
    isProcessingRef.current = true;
    setError(null);

    playBuzzerSound();

    try {
      const response = await api.post('/attendance/scan', { qr_code: cleanCode });

      if (response.data && response.data.success) {
        const data = response.data.data;
        const isTimeOut = data.action === 'time_out';
        const actionLabel = isTimeOut ? 'Time Out' : 'Time In';
        const userName = data.user?.name || 'Member';

        // Update overlay
        setLastScannedUser({
          name: userName,
          id: data.user?.id || cleanCode,
          action: data.action,
          time: isTimeOut ? data.time_out : data.time_in,
          duration: data.formatted_duration || null
        });

        // Add to local real-time feed
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
        }, 3500);
      }
    } catch (err: any) {
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
      // Clean up previous instance if any
      await cleanupScanner();

      // Ensure DOM element is ready
      const readerElem = document.getElementById(videoElementId);
      if (!readerElem) {
        throw new Error('Scanner container element is missing in DOM.');
      }

      const html5QrCode = new Html5Qrcode(videoElementId);
      scannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Determine camera target
      let cameraConfig: any = { facingMode: 'environment' };
      if (selectedCameraId) {
        cameraConfig = selectedCameraId;
      }

      try {
        await html5QrCode.start(
          cameraConfig,
          scanConfig,
          (decodedText) => processQrCode(decodedText),
          () => {} // Non-match frames
        );
      } catch (camErr) {
        console.warn('Preferred camera start failed, trying fallback mode...', camErr);
        // Fallback to user facing mode or any default
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
    try {
      let qrInstance = scannerRef.current;
      if (!qrInstance) {
        qrInstance = new Html5Qrcode(videoElementId);
        scannerRef.current = qrInstance;
      }

      const decodedResult = await qrInstance.scanFile(file, true);
      if (decodedResult) {
        await processQrCode(decodedResult);
      }
    } catch (err: any) {
      console.error('Error scanning QR image file:', err);
      setError('Could not detect a valid QR code in the selected image. Please try another image.');
      toast.error('No QR code detected in image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isManualSubmitting) return;

    setIsManualSubmitting(true);
    await processQrCode(manualCode.trim());
    setManualCode('');
    setIsManualSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hidden File Input for Image QR Scanning */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                cleanupScanner();
                navigate(-1);
              }}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">QR Attendance Scanner</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Physical check-in & check-out portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/attendance')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Scanner Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Camera Scanner Card */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 relative">
              
              {/* Camera Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-xs font-bold text-slate-700">
                    {isScanning ? 'Camera Scanner Active' : 'Camera Ready'}
                  </span>
                </div>

                {/* Camera Selector Dropdown */}
                {cameras.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <SwitchCamera className="h-4 w-4 text-slate-400" />
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      disabled={isInitializing}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Video Scanner Viewport */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 min-h-[340px] flex items-center justify-center">
                
                {/* Real DOM Container for html5-qrcode */}
                <div
                  id={videoElementId}
                  className="w-full h-full min-h-[340px] flex items-center justify-center"
                />

                {/* Placeholder UI when NOT scanning */}
                {!isScanning && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
                    <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                      <Camera className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-white">Camera Scanner Inactive</h3>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Start camera to scan member cards or upload a QR image
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        onClick={startScanner}
                        disabled={isInitializing}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 text-xs active:scale-95"
                      >
                        {isInitializing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Starting Camera...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            <span>Start Camera</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-all border border-slate-700"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Upload QR Image</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Animated Active Scan Overlay */}
                {lastScannedUser && (
                  <div className={`absolute inset-0 z-30 flex items-center justify-center backdrop-blur-md transition-all p-6 ${
                    lastScannedUser.action === 'time_out' ? 'bg-amber-950/85' : 'bg-emerald-950/85'
                  }`}>
                    <div className="text-center text-white space-y-3 animate-scale-up">
                      <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center shadow-lg ${
                        lastScannedUser.action === 'time_out' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        {lastScannedUser.action === 'time_out' ? (
                          <LogOut className="h-8 w-8 text-white" />
                        ) : (
                          <LogIn className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div>
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${
                          lastScannedUser.action === 'time_out' ? 'bg-amber-400 text-amber-950' : 'bg-emerald-400 text-emerald-950'
                        }`}>
                          {lastScannedUser.action === 'time_out' ? 'Time Out Recorded' : 'Time In Recorded'}
                        </span>
                        <h3 className="text-2xl font-black">{lastScannedUser.name}</h3>
                        <p className="text-xs font-semibold text-white/80 mt-0.5">ID: {lastScannedUser.id}</p>
                        {lastScannedUser.duration && (
                          <p className="text-xs font-bold text-amber-200 mt-1">
                            Visit Duration: {lastScannedUser.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanning Active Toolbar */}
              {isScanning && (
                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">Point QR Code at camera frame</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      onClick={stopScanner}
                      disabled={isInitializing}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs"
                    >
                      <CameraOff className="h-3.5 w-3.5" />
                      <span>Stop</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {error && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">Scanner Message</p>
                    <p className="text-[11px] leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Manual QR / Member ID Input Option */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Manual ID / QR Check-in
              </h3>
              <p className="text-xs text-slate-500 font-semibold mb-4">
                Type or paste a QR code string, Member ID (e.g. MEM-001), User ID (e.g. USR-MEM0001), or Email
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g. LIB-MEM-001, MEM-001, or member@balingasag.gov.ph"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isManualSubmitting}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isManualSubmitting ? 'Checking...' : 'Check In/Out'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar: Recent Scans & Info */}
          <div className="space-y-6">
            {/* Live Scan Feed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-800">Recent Scans</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Feed</span>
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Clock className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-xs font-semibold">No attendance scans recorded in this session yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                  {recentScans.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-xl flex-shrink-0 ${
                          item.action === 'time_out' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.action === 'time_out' ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{item.time}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex-shrink-0 ${
                        item.action === 'time_out' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.action === 'time_out' ? 'Out' : 'In'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Guide */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 text-emerald-900 space-y-2.5">
              <h4 className="text-xs font-extrabold flex items-center gap-2 text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                How It Works
              </h4>
              <ul className="text-[11px] text-emerald-800/90 space-y-1.5 font-medium">
                <li>• <strong>First Scan:</strong> Automatically logs member <strong>Time In</strong>.</li>
                <li>• <strong>Second Scan:</strong> Logs <strong>Time Out</strong> & computes visit time.</li>
                <li>• <strong>Upload QR:</strong> Click "Upload QR Image" to test with any QR image.</li>
                <li>• <strong>Manual Input:</strong> Use the input box to type Member ID or email.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QRAttendanceScan;
