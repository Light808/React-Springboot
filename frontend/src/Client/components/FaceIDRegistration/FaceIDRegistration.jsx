import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, X, AlertCircle } from 'lucide-react';
import { loadFaceModels, captureFaceDescriptor, registerFaceDescriptorMultiple, detectFaceRealTime } from '../../../services/faceService';
import './FaceIDRegistration.css';

const FaceIDRegistration = ({ userId, onSuccess, onCancel }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
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
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [startFaceDetection]);

  const handleCapture = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'User ID not found. Please login again.' });
      return;
    }

    if (!videoRef.current || !isModelsLoaded) {
      setMessage({ type: 'error', text: 'Camera or models not ready' });
      return;
    }

    // Removed face detection check - just need to capture any face

    setIsCapturing(true);
    setCaptureProgress(0);
    setMessage({ type: 'info', text: 'Capturing face... Please stay still. We will capture 3 samples for better accuracy.' });

    // Stop real-time detection during capture
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    try {
      // Capture multiple face descriptors for better accuracy (3 samples)
      const descriptors = [];
      const numSamples = 3;
      
      for (let i = 0; i < numSamples; i++) {
        setCaptureProgress(i + 1);
        setMessage({ type: 'info', text: `Capturing sample ${i + 1} of ${numSamples}... Please stay still.` });
        
        // Wait a bit between captures
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const descriptor = await captureFaceDescriptor(videoRef.current, 3);
        descriptors.push(descriptor);
      }
      
      setMessage({ type: 'info', text: 'Processing and registering face...' });
      
      // Register averaged face descriptor
      await registerFaceDescriptorMultiple(userId, descriptors);
      
      setMessage({ type: 'success', text: 'Face registered successfully!' });
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Error capturing face:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to register face. Please try again.' 
      });
      // Restart face detection
      if (videoRef.current && isModelsLoaded) {
        startFaceDetection();
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (onCancel) onCancel();
  };

  return (
    <div className="face-id-registration-overlay">
      <div className="face-id-registration-modal">
        <div className="face-id-registration-header">
          <h2>Register Face ID</h2>
          <button className="close-btn" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="face-id-registration-content">
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
            {faceDetected && !isCapturing && (
              <div className="face-detected-indicator">
                <CheckCircle size={24} />
                <p>Face detected!</p>
              </div>
            )}
            {isCapturing && captureProgress > 0 && (
              <div className="capture-progress-indicator">
                <p>Capturing sample {captureProgress} of 3...</p>
              </div>
            )}
          </div>

          <div className="instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Position your face in the center of the frame</li>
              <li>Ensure good lighting</li>
              <li>Look directly at the camera</li>
              <li>Remove glasses or masks if possible</li>
              <li>Stay still when capturing</li>
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

          <div className="face-id-registration-actions">
            <button
              className="btn-capture"
              onClick={handleCapture}
              disabled={isLoading || isCapturing || !isModelsLoaded}
            >
              {isCapturing ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Capturing...
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Capture Face
                </>
              )}
            </button>
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isCapturing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceIDRegistration;
