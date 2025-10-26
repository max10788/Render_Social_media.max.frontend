import React, { useEffect, useRef } from 'react';
import './ParticleSystem.css';

const ParticleSystem = ({ intensity = 1, type = 'matrix' }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Set canvas size
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle classes
    class MatrixRain {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.speed = Math.random() * 3 + 2;
        this.length = Math.random() * 20 + 10;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.chars = '01';
        this.char = this.chars[Math.floor(Math.random() * this.chars.length)];
      }

      update() {
        this.y += this.speed * intensity;
        if (this.y > height + this.length) {
          this.y = -this.length;
          this.x = Math.random() * width;
        }
      }

      draw() {
        ctx.fillStyle = `rgba(16, 185, 129, ${this.opacity})`;
        ctx.font = '14px JetBrains Mono, monospace';
        ctx.fillText(this.char, this.x, this.y);
        
        // Trail effect
        for (let i = 1; i < this.length; i++) {
          const trailOpacity = this.opacity * (1 - i / this.length);
          ctx.fillStyle = `rgba(16, 185, 129, ${trailOpacity})`;
          ctx.fillText(this.char, this.x, this.y - i * 15);
        }
      }
    }

    class DataParticle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = this.getRandomColor();
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
      }

      getRandomColor() {
        const colors = [
          '96, 165, 250',  // blue
          '167, 139, 250', // purple
          '16, 185, 129',  // green
          '6, 182, 212',   // cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx * intensity;
        this.y += this.vy * intensity;
        this.life -= 1;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Fade out at end of life
        this.opacity = (this.life / this.maxLife) * 0.8;

        if (this.life <= 0) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 4
        );
        gradient.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    class ConnectionLine {
      constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.opacity = 0;
      }

      draw() {
        const distance = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
        
        if (distance < 150) {
          this.opacity = (1 - distance / 150) * 0.3;
          
          ctx.beginPath();
          ctx.moveTo(this.p1.x, this.p1.y);
          ctx.lineTo(this.p2.x, this.p2.y);
          ctx.strokeStyle = `rgba(96, 165, 250, ${this.opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Initialize particles based on type
    if (type === 'matrix') {
      const matrixCount = Math.floor((width / 20) * intensity);
      particlesRef.current = Array.from({ length: matrixCount }, () => new MatrixRain());
    } else if (type === 'data') {
      const dataCount = Math.floor(50 * intensity);
      particlesRef.current = Array.from({ length: dataCount }, () => new DataParticle());
    }

    // Animation loop
    const animate = () => {
      // Fade effect for trail
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Draw connections for data particles
      if (type === 'data') {
        for (let i = 0; i < particlesRef.current.length; i++) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const line = new ConnectionLine(
              particlesRef.current[i],
              particlesRef.current[j]
            );
            line.draw();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, type]);

  return (
    <canvas
      ref={canvasRef}
      className={`particle-canvas particle-canvas-${type}`}
    />
  );
};

export default ParticleSystem;
