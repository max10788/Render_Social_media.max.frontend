import React, { useEffect, useRef, useState } from 'react';
import './RabbitHolePath.css';

const RabbitHolePath = () => {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      const maxScroll = documentHeight - windowHeight;
      const progress = Math.min(scrollTop / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate flowing particles along the path
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    offset: (i / 20) * 100,
    delay: i * 0.1
  }));

  return (
    <div className="rabbit-hole-path-container">
      <svg 
        className="rabbit-hole-svg" 
        viewBox="0 0 100 4000" 
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          {/* Gradient for the path */}
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8">
              <animate attributeName="stop-color" 
                values="#60a5fa;#a78bfa;#ec4899;#f59e0b;#10b981;#60a5fa" 
                dur="10s" 
                repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.6">
              <animate attributeName="stop-color" 
                values="#a78bfa;#ec4899;#f59e0b;#10b981;#60a5fa;#a78bfa" 
                dur="10s" 
                repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4">
              <animate attributeName="stop-color" 
                values="#ec4899;#f59e0b;#10b981;#60a5fa;#a78bfa;#ec4899" 
                dur="10s" 
                repeatCount="indefinite" />
            </stop>
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Stronger glow for particles */}
          <filter id="particleGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background glow path (thicker) */}
        <path
          d="M 50 0 
             Q 30 300 50 500
             Q 70 700 50 900
             Q 30 1100 50 1300
             Q 70 1500 50 1700
             Q 30 1900 50 2100
             Q 70 2300 50 2500
             Q 30 2700 50 2900
             Q 70 3100 50 3300
             Q 30 3500 50 3700
             L 50 4000"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#glow)"
        />

        {/* Main animated path */}
        <path
          ref={pathRef}
          d="M 50 0 
             Q 30 300 50 500
             Q 70 700 50 900
             Q 30 1100 50 1300
             Q 70 1500 50 1700
             Q 30 1900 50 2100
             Q 70 2300 50 2500
             Q 30 2700 50 2900
             Q 70 3100 50 3300
             Q 30 3500 50 3700
             L 50 4000"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - scrollProgress)}
          filter="url(#glow)"
          className="main-path"
        />

        {/* Animated particles flowing along path */}
        {particles.map((particle) => (
          <circle
            key={particle.id}
            r="2"
            fill="#60a5fa"
            filter="url(#particleGlow)"
            className="path-particle"
            style={{
              animationDelay: `${particle.delay}s`
            }}
          >
            <animateMotion
              dur="8s"
              repeatCount="indefinite"
              path="M 50 0 
                    Q 30 300 50 500
                    Q 70 700 50 900
                    Q 30 1100 50 1300
                    Q 70 1500 50 1700
                    Q 30 1900 50 2100
                    Q 70 2300 50 2500
                    Q 30 2700 50 2900
                    Q 70 3100 50 3300
                    Q 30 3500 50 3700
                    L 50 4000"
            />
          </circle>
        ))}

        {/* Node markers at key points */}
        <g className="path-nodes">
          {/* Surface Node */}
          <circle cx="50" cy="500" r="6" fill="#60a5fa" className="path-node node-pulse-1" filter="url(#particleGlow)"/>
          
          {/* Deep Node */}
          <circle cx="50" cy="1300" r="6" fill="#a78bfa" className="path-node node-pulse-2" filter="url(#particleGlow)"/>
          
          {/* Core Node */}
          <circle cx="50" cy="2100" r="6" fill="#ec4899" className="path-node node-pulse-3" filter="url(#particleGlow)"/>
          
          {/* Matrix Node */}
          <circle cx="50" cy="2900" r="6" fill="#10b981" className="path-node node-pulse-4" filter="url(#particleGlow)"/>
        </g>

        {/* Depth indicators */}
        <text x="50" y="450" textAnchor="middle" className="depth-label" fill="#60a5fa" fontSize="3">
          Surface
        </text>
        <text x="50" y="1250" textAnchor="middle" className="depth-label" fill="#a78bfa" fontSize="3">
          Deep
        </text>
        <text x="50" y="2050" textAnchor="middle" className="depth-label" fill="#ec4899" fontSize="3">
          Core
        </text>
        <text x="50" y="2850" textAnchor="middle" className="depth-label" fill="#10b981" fontSize="3">
          Matrix
        </text>
      </svg>
    </div>
  );
};

export default RabbitHolePath;
