import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, X, AlertCircle } from 'lucide-react';
import { loadFaceModels, captureFaceDescriptor, verifyFaceDescriptor, detectFaceRealTime } from '../../../services/faceService';
import './FaceIDLogin.css';

const FaceIDLogin = ({ onSuccess, onCancel, onSwitchToPassword }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  // Real-time face detection for visualization
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isModelsLoaded) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    detectionIntervalRef.current = setInterval(async () => {
      if (!video || video.readyState < 2) return;
      
      const detection = await detectFaceRealTime(video);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (detection) {
        setFaceDetected(true);
        // Draw face detection box
        const box = detection.detection.box;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Draw landmarks
        if (detection.landmarks) {
          ctx.fillStyle = '#00ff00';
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      } else {
        setFaceDetected(false);
      }
    }, 100); // Check every 100ms
  }, [isModelsLoaded]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        // Load face models first
        setIsLoading(true);
        setMessage({ type: 'info', text: 'Loading face recognition models...' });
        await loadFaceModels();
        setIsModelsLoaded(true);
        setMessage({ type: 'info', text: 'Models loaded. Starting camera...' });

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user' // Front camera
          }
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting detection
          videoRef.current.onloadedmetadata = () => {
            startFaceDetection();
          };
        }
        
        setMessage({ type: 'success', text: 'Camera ready. Position your face in the frame.' });
      } catch (error) {
        console.error('Error initializing camera:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to access camera. Please allow camera permissions.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [startFaceDetection]);

  const handleVerify = async () => {
    if (!videoRef.current || !isModelsLoaded) {
      setMessage({ type: 'error', text: 'Camera or models not ready' });
      return;
    }

    if (!faceDetected) {
      setMessage({ type: 'error', text: 'Please position your face in the frame first' });
      return;
    }

    setIsVerifying(true);
    setMessage({ type: 'info', text: 'Verifying face... Please stay still.' });

    // Stop real-time detection during verification
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    try {
      // Capture face descriptor with retry
      const descriptor = await captureFaceDescriptor(videoRef.current, 5);
      
      setMessage({ type: 'info', text: 'Matching face...' });
      
      // Verify face descriptor
      const user = await verifyFaceDescriptor(descriptor);
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setMessage({ type: 'success', text: 'Face verified successfully!' });
      
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
      }, 1000);
    } catch (error) {
      console.error('Error verifying face:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Face verification failed. Please try again or use password login.' 
      });
      // Restart face detection
      if (videoRef.current && isModelsLoaded) {
        startFaceDetection();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (onCancel) onCancel();
  };

  return (
    <div className="face-id-login-overlay">
      <div className="face-id-login-modal">
        <div className="face-id-login-header">
          <h2>Face ID Login</h2>
          <button className="close-btn" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="face-id-login-content">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <canvas
              ref={canvasRef}
              className="face-detection-canvas"
            />
            {!isModelsLoaded && (
              <div className="camera-overlay">
                <div className="loading-spinner"></div>
                <p>Loading models...</p>
              </div>
            )}
            {isModelsLoaded && !faceDetected && (
              <div className="face-detection-hint">
                <p>Position your face in the frame</p>
              </div>
            )}
            {faceDetected && (
              <div className="face-detected-indicator">
                <CheckCircle size={24} />
                <p>Face detected!</p>
              </div>
            )}
          </div>

          <div className="instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Position your face in the center of the frame</li>
              <li>Ensure good lighting</li>
              <li>Look directly at the camera</li>
              <li>Stay still when verifying</li>
            </ul>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.type === 'success' ? (
                <CheckCircle size={18} />
              ) : message.type === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Camera size={18} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="face-id-login-actions">
            <button
              className="btn-verify"
              onClick={handleVerify}
              disabled={isLoading || isVerifying || !isModelsLoaded}
            >
              {isVerifying ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Face
                </>
              )}
            </button>
            <button
              className="btn-switch"
              onClick={onSwitchToPassword}
              disabled={isVerifying}
            >
              Use Password Instead
            </button>
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isVerifying}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceIDLogin;
