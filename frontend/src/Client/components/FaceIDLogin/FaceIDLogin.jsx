import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, X, AlertCircle } from 'lucide-react';
import { loadFaceModels, captureFaceDescriptor, verifyFaceDescriptor, detectFaceRealTime } from '../../../services/faceService';
import './FaceIDLogin.css';
import { useTranslation } from "react-i18next";

const FaceIDLogin = ({ onSuccess, onCancel, onSwitchToPassword }) => {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const autoVerifyTriggeredRef = useRef(false);

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
        setMessage({ type: 'info', text: t('Loading face recognition models...') });
        await loadFaceModels();
        setIsModelsLoaded(true);
        setMessage({ type: 'info', text: t('Models loaded. Starting camera...') });

        // Start with font camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user' 
          }
        });
        // Wait for video to be ready before starting detection
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            startFaceDetection();
          };
        }

        setMessage({ type: 'success', text: t('Camera ready. Position your face in the frame.') });
      } catch (error) {
        console.error('Error initializing camera:', error);
        setMessage({
          type: 'error',
          text: error.message || t('Failed to access camera. Please allow camera permissions.')
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

  // Auto-verify trigger - verify immediately when face detected
  useEffect(() => {
    if (faceDetected && !isVerifying && !autoVerifyTriggeredRef.current && isModelsLoaded) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceDetected, isVerifying, isModelsLoaded]); 


  const handleVerify = async () => {
    if (!videoRef.current || !isModelsLoaded) {
      setMessage({ type: 'error', text: t('Camera or models not ready') });
      return;
    }

    if (!faceDetected && !autoVerifyTriggeredRef.current) {
      setMessage({ type: 'error', text: t('Please position your face in the frame first') });
      return;
    }

    setIsVerifying(true);
    setMessage({ type: 'info', text: t('Verifying face... Please stay still.') });
    autoVerifyTriggeredRef.current = true;

    // Stop real-time detection during verification
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    try {
      const descriptor = await captureFaceDescriptor(videoRef.current, 5);

      setMessage({ type: 'info', text: t('Matching face...') });

      // Verify face descriptor
      const user = await verifyFaceDescriptor(descriptor);

      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setMessage({ type: 'success', text: t('Face verified successfully!') });

      // Login if face recognized successfully
      if (onSuccess) onSuccess(user);
    } catch (error) {
      console.error('Error verifying face:', error);
      setMessage({
        type: 'error',
        text: error.message || t('Face verification failed. Please try again or use password login.')
      });
      // Restart face detection
      if (videoRef.current && isModelsLoaded) {
        startFaceDetection();
        autoVerifyTriggeredRef.current = false;
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
          <h2>{t('Face ID Login')}</h2>
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
                <p>{t('Loading models...')}</p>
              </div>
            )}
            {isModelsLoaded && !faceDetected && (
              <div className="face-detection-hint">
                <p>{t('Position your face in the frame')}</p>
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
              <li>{t('Position your face in the center of the frame')}</li>
              <li>{t('Ensure good lighting')}</li>
              <li>{t('Look directly at the camera')}</li>
              <li>{t('Stay still when verifying')}</li>
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
              style={{ display: 'none' }}
            >
              {isVerifying ? (
                <>
                  <div className="loading-spinner-small"></div>
                  {t('Verifying...')}
                </>
              ) : (
                <>
                  {t('Verify Face')}
                </>
              )}
            </button>
            <button
              className="btn-switch"
              onClick={onSwitchToPassword}
              disabled={isVerifying}
            >
              {t('Use Password To Login')}
            </button>
            <button
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isVerifying}
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceIDLogin;
