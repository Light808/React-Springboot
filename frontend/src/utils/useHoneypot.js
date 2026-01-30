import { useState, useEffect, useRef } from 'react';

/**
 * Honeypot protection hook
 * Implements multiple honeypot techniques:
 * 1. Hidden field check
 * 2. Time-based validation (form fill time)
 * 3. JavaScript honeypot
 */
export const useHoneypot = () => {
  const [honeypotValue, setHoneypotValue] = useState('');
  const [honeypotUrl, setHoneypotUrl] = useState('');
  const formStartTime = useRef(Date.now());
  const [isValid, setIsValid] = useState(true);

  // Reset form start time when form is opened/reset
  const resetTimer = () => {
    formStartTime.current = Date.now();
    setHoneypotValue('');
    setHoneypotUrl('');
    setIsValid(true);
  };

  // Check if form submission is valid
  const validateSubmission = () => {
    const fillTime = Date.now() - formStartTime.current;
    
    // Check 1: Hidden field should be empty (bots often fill all fields)
    if (honeypotValue.trim() !== '') {
      console.warn('Honeypot: Hidden field was filled');
      setIsValid(false);
      return false;
    }

    // Check 2: Honeypot URL should be empty
    if (honeypotUrl.trim() !== '') {
      console.warn('Honeypot: Honeypot URL was filled');
      setIsValid(false);
      return false;
    }

    // Check 3: Form fill time should be reasonable (at least 2 seconds, max 1 hour)
    // Too fast = bot, too slow = suspicious
    const minTime = 2000; // 2 seconds minimum
    const maxTime = 3600000; // 1 hour maximum
    
    if (fillTime < minTime) {
      console.warn('Honeypot: Form filled too quickly');
      setIsValid(false);
      return false;
    }

    if (fillTime > maxTime) {
      console.warn('Honeypot: Form took too long to fill');
      setIsValid(false);
      return false;
    }

    // Check 4: JavaScript should be enabled (honeypot field should be hidden by CSS)
    // This is handled by CSS, but we verify the field exists and is hidden
    
    setIsValid(true);
    return true;
  };

  return {
    honeypotValue,
    setHoneypotValue,
    honeypotUrl,
    setHoneypotUrl,
    formStartTime: formStartTime.current,
    resetTimer,
    validateSubmission,
    isValid
  };
};

/**
 * Honeypot Link Component
 * Hidden link/URL that only bots can see and access
 * Bots often crawl all links on a page, so this will catch them
 */
export const HoneypotLink = ({ href = '/api/honeypot-trap', text = 'Admin Panel', children }) => {
  const handleClick = (e) => {
    e.preventDefault();
    // Log bot detection
    const botData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      type: 'honeypot_link_click'
    };
    
    console.warn('🍯 HONEYPOT TRIGGERED: Bot detected via hidden link!', botData);
    
    // Store in localStorage for tracking
    try {
      const botLogs = JSON.parse(localStorage.getItem('honeypot_bot_logs') || '[]');
      botLogs.push(botData);
      // Keep only last 50 entries
      if (botLogs.length > 50) botLogs.shift();
      localStorage.setItem('honeypot_bot_logs', JSON.stringify(botLogs));
    } catch (err) {
      console.error('Failed to log bot detection:', err);
    }
    
    // Optional: Send to server (if you have an endpoint)
    // fetch('/api/honeypot-trap', { method: 'POST', body: JSON.stringify(botData) });
    
    // Do nothing - don't navigate
    return false;
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        // Position: Move far off-screen
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        
        // Size: Make it tiny
        width: '1px',
        height: '1px',
        minWidth: '1px',
        maxWidth: '1px',
        minHeight: '1px',
        maxHeight: '1px',
        
        // Visibility: Multiple techniques
        opacity: 0,
        visibility: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        
        // Interaction: Disable all interactions from humans
        pointerEvents: 'none', // Humans can't click
        userSelect: 'none',
        
        // Layout: Remove from flow
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        textDecoration: 'none',
        
        // Background: Match common backgrounds
        backgroundColor: 'transparent',
        color: 'transparent',
        
        // Stacking: Behind everything
        zIndex: -1,
        
        // Overflow: Hide any content
        overflow: 'hidden',
        
        // Text: Hide text
        fontSize: '0',
        lineHeight: 0,
        textIndent: '-9999px',
        
        // Display: Keep as inline to allow bot crawling
        display: 'inline-block'
      }}
      aria-hidden="true"
      tabIndex="-1"
      // Use rel="nofollow" to tell search engines to ignore (optional)
      rel="nofollow noopener noreferrer"
    >
      {children || text}
    </a>
  );
};

/**
 * Honeypot Button Component  
 * Hidden button that bots might try to click
 */
export const HoneypotButton = ({ onClick, text = 'Submit', children }) => {
  const handleClick = (e) => {
    e.preventDefault();
    // Log bot detection
    const botData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      type: 'honeypot_button_click'
    };
    
    console.warn('🍯 HONEYPOT TRIGGERED: Bot detected via hidden button!', botData);
    
    // Store in localStorage
    try {
      const botLogs = JSON.parse(localStorage.getItem('honeypot_bot_logs') || '[]');
      botLogs.push(botData);
      if (botLogs.length > 50) botLogs.shift();
      localStorage.setItem('honeypot_bot_logs', JSON.stringify(botLogs));
    } catch (err) {
      console.error('Failed to log bot detection:', err);
    }
    
    if (onClick) onClick(e);
    return false;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        // Same hiding techniques as HoneypotLink
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        minWidth: '1px',
        maxWidth: '1px',
        minHeight: '1px',
        maxHeight: '1px',
        opacity: 0,
        visibility: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        pointerEvents: 'none',
        userSelect: 'none',
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        color: 'transparent',
        zIndex: -1,
        overflow: 'hidden',
        fontSize: '0',
        lineHeight: 0,
        textIndent: '-9999px'
      }}
      aria-hidden="true"
      tabIndex="-1"
    >
      {children || text}
    </button>
  );
};

/**
 * Honeypot field component
 * Renders a hidden input field that should never be filled by humans
 * Uses multiple hiding techniques to ensure it's invisible to users but visible to bots
 */
export const HoneypotField = ({ value, onChange, name = 'website' }) => {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      autoComplete="off"
      tabIndex="-1"
      style={{
        // Position: Move far off-screen
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        
        // Size: Make it tiny
        width: '1px',
        height: '1px',
        minWidth: '1px',
        maxWidth: '1px',
        minHeight: '1px',
        maxHeight: '1px',
        
        // Visibility: Multiple techniques
        opacity: 0,
        visibility: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        
        // Interaction: Disable all interactions
        pointerEvents: 'none',
        userSelect: 'none',
        
        // Layout: Remove from flow
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        
        // Background: Match common backgrounds (white/transparent)
        backgroundColor: 'transparent',
        color: 'transparent',
        
        // Stacking: Behind everything
        zIndex: -1,
        
        // Overflow: Hide any content
        overflow: 'hidden',
        
        // Text: Hide text
        fontSize: '0',
        lineHeight: 0,
        textIndent: '-9999px'
      }}
      aria-hidden="true"
      readOnly={false}
    />
  );
};

/**
 * Honeypot URL field component
 * Hidden URL field that bots might try to fill
 * Uses multiple hiding techniques to ensure it's invisible to users but visible to bots
 */
export const HoneypotUrlField = ({ value, onChange, name = 'url' }) => {
  return (
    <input
      type="url"
      name={name}
      value={value}
      onChange={onChange}
      autoComplete="off"
      tabIndex="-1"
      style={{
        // Position: Move far off-screen
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        
        // Size: Make it tiny
        width: '1px',
        height: '1px',
        minWidth: '1px',
        maxWidth: '1px',
        minHeight: '1px',
        maxHeight: '1px',
        
        // Visibility: Multiple techniques
        opacity: 0,
        visibility: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        
        // Interaction: Disable all interactions
        pointerEvents: 'none',
        userSelect: 'none',
        
        // Layout: Remove from flow
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        
        // Background: Match common backgrounds (white/transparent)
        backgroundColor: 'transparent',
        color: 'transparent',
        
        // Stacking: Behind everything
        zIndex: -1,
        
        // Overflow: Hide any content
        overflow: 'hidden',
        
        // Text: Hide text
        fontSize: '0',
        lineHeight: 0,
        textIndent: '-9999px'
      }}
      aria-hidden="true"
      readOnly={false}
    />
  );
};

