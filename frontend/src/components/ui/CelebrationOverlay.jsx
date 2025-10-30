import React, { useEffect, useState } from 'react';
import { 
  Star, Heart, Gift, Crown, Diamond, Sparkles, Sun, Moon, 
  Zap, Gem, Trophy, Award, Medal, Coins, DollarSign, 
  Leaf, Flower, TreePine, Clover, Wheat, Palmtree,
  Feather, Music, Bell, Target, Circle, 
  Hexagon, Triangle, Square, Plus, X, Check,
  Smile, Users, Globe, Shield, Eye
} from 'lucide-react';

const CelebrationAnimation = ({ 
  isVisible, 
  onComplete,
  duration = 3000,
  type = "donation", // "donation", "sadaqah", "zakat", "charity"
  intensity = "medium"
}) => {
  const [particles, setParticles] = useState([]);
  const [ripples, setRipples] = useState([]);
  const [showMessage, setShowMessage] = useState(false);

  const getParticleCount = () => {
    switch (intensity) {
      case "light": return 20;
      case "heavy": return 40;
      default: return 25;
    }
  };

  const generateRipples = () => {
    // Remove ripple generation - no more green circles
    setRipples([]);
  };

  const generateParticles = () => {
    const count = getParticleCount();
    const newParticles = [];
    
    // Create particles in a gentle arc from center
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 100 + Math.random() * 200;
      const centerX = 50;
      const centerY = 40;
      
      newParticles.push({
        id: i,
        startX: centerX,
        startY: centerY,
        endX: centerX + Math.cos(angle) * (radius / 2),
        endY: centerY + Math.sin(angle) * (radius / 2) + Math.random() * 30,
        size: Math.random() * 6 + 4,
        delay: Math.random() * 800,
        duration: 2000 + Math.random() * 1000,
        opacity: Math.random() * 0.4 + 0.6,
        symbol: getRandomSymbol(),
        color: getSymbolColor(),
      });
    }
    
    setParticles(newParticles);
  };

  const getRandomSymbol = () => {
    const symbols = {
      donation: [
        Star, Sparkles, Sun, Moon, Zap, Diamond, Gem, Trophy, Award, Medal,
        Gift, Crown, Coins, DollarSign, Heart, Smile, Globe, Shield,
        Leaf, Flower, TreePine, Clover, Wheat, Palmtree, Feather,
        Music, Bell, Target, Circle, Hexagon, Triangle, Plus, Check
      ],
      sadaqah: [
        Moon, Star, Sparkles, Sun, Diamond, Gem, Trophy, Award, Medal,
        Gift, Crown, Coins, Heart, Smile, Globe, Shield, Eye,
        Leaf, Flower, TreePine, Clover, Wheat, Palmtree, Feather,
        Music, Bell, Target, Circle, Hexagon, Triangle, Plus, Check
      ],
      zakat: [
        Moon, Star, Sparkles, Sun, Diamond, Gem, Trophy, Award, Medal,
        Gift, Crown, Coins, DollarSign, Heart, Smile, Globe, Shield,
        Leaf, Flower, TreePine, Clover, Wheat, Palmtree, Feather,
        Music, Bell, Target, Circle, Hexagon, Triangle, Plus, Check, Users
      ],
      charity: [
        Heart, Gift, Trophy, Award, Medal, Crown, Diamond, Gem,
        Star, Sparkles, Sun, Moon, Coins, DollarSign, Smile, Globe,
        Leaf, Flower, TreePine, Clover, Wheat, Palmtree, Feather,
        Music, Bell, Target, Circle, Hexagon, Triangle, Plus, Check, Users
      ]
    };
    const symbolArray = symbols[type] || symbols.donation;
    return symbolArray[Math.floor(Math.random() * symbolArray.length)];
  };

  const getSymbolColor = () => {
    // Elegant, respectful colors
    const colors = ['#2E7D32', '#1976D2', '#7B1FA2', '#D32F2F', '#F57C00', '#5D4037'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getMotivationalMessage = () => {
    const messages = {
      donation: [
        "مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا", // Who will lend Allah a goodly loan
        "وَمَا تُنفِقُوا مِنْ خَيْرٍ فَلِأَنفُسِكُمْ", // Whatever good you spend is for yourselves
        "بارك الله فيك وأجزل لك الثواب", // May Allah bless you and grant you great reward
        "جزاك الله خيراً وتقبل منك", // May Allah reward you with good and accept from you
        "اللهم بارك في مالك وولدك", // O Allah, bless your wealth and children
        "صدقة جارية في ميزان حسناتك" // Ongoing charity in your scale of good deeds
      ],
      sadaqah: [
        "بارك الله فيك وضاعف أجرك", // May Allah bless you and multiply your reward
        "اللهم تقبل صدقتك وبارك فيك", // O Allah, accept your charity and bless you
        "ما نقصت صدقة من مال" // Charity never decreases wealth
      ],
      charity: [
        "وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ", // They prefer others over themselves even though they are needy
        "بارك الله فيك وأحسن إليك", // May Allah bless you and be good to you
        "جزاك الله خيراً وأكرمك", // May Allah reward you with good and honor you
        "اللهم اجعلها في ميزان حسناتك", // O Allah, place it in your scale of good deeds
        "الخير يعود على أهل الخير" // Good returns to the people of good
      ]
    };
    const messageArray = messages[type] || messages.donation;
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  useEffect(() => {
    console.log('CelebrationAnimation isVisible changed:', isVisible);
    if (isVisible) {
      console.log('Starting celebration animation...');
      generateRipples();
      generateParticles();
      
      // Show message after initial animation
      setTimeout(() => {
        console.log('Showing celebration message');
        setShowMessage(true);
      }, 800);
      
      // Hide message before completion
      setTimeout(() => {
        console.log('Hiding celebration message');
        setShowMessage(false);
      }, duration - 500);
      
      // Auto-complete
      const timer = setTimeout(() => {
        console.log('Celebration animation completed');
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      console.log('Hiding celebration animation');
      setParticles([]);
      setRipples([]);
      setShowMessage(false);
    }
  }, [isVisible, duration, type, intensity]);

  // Generate smooth CSS animations
  useEffect(() => {
    if (particles.length > 0 || ripples.length > 0) {
      const style = document.createElement('style');
      
      const particleAnimations = particles.map(particle => `
        @keyframes particle-${particle.id} {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            transform: translate(${(particle.endX - particle.startX) * 0.3}vw, ${(particle.endY - particle.startY) * 0.3}vh) scale(1);
            opacity: ${particle.opacity};
          }
          80% {
            transform: translate(${(particle.endX - particle.startX) * 0.8}vw, ${(particle.endY - particle.startY) * 0.8}vh) scale(1);
            opacity: ${particle.opacity * 0.7};
          }
          100% {
            transform: translate(${particle.endX - particle.startX}vw, ${particle.endY - particle.startY}vh) scale(0.3);
            opacity: 0;
          }
        }
      `).join('');

      const rippleAnimations = ripples.map(ripple => `
        @keyframes ${ripple.id} {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: ${ripple.opacity};
          }
          50% {
            opacity: ${ripple.opacity * 0.5};
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
      `).join('');

      const messageAnimation = `
        @keyframes messageSlide {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes messageGlow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(46, 125, 50, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(46, 125, 50, 0.5);
          }
        }
      `;

      style.textContent = particleAnimations + rippleAnimations + messageAnimation;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [particles, ripples]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.1)' }}>
      {/* Elegant particles */}
      {particles.map(particle => {
        const IconComponent = particle.symbol;
        return (
          <div
            key={particle.id}
            className="absolute"
            style={{
              left: `${particle.startX}%`,
              top: `${particle.startY}%`,
              animation: `particle-${particle.id} ${particle.duration}ms ${particle.delay}ms ease-out forwards`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          >
            <IconComponent
              size={particle.size * 3}
              color={particle.color}
              style={{
                filter: `drop-shadow(0 0 8px ${particle.color}40)`,
              }}
            />
          </div>
        );
      })}

      {/* Motivational message */}
      {showMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div 
            className="px-8 py-4 rounded-lg bg-white/90 backdrop-blur-sm border border-green-200 shadow-lg"
            style={{
              animation: 'messageSlide 0.5s ease-out forwards',
            }}
          >
            <p 
              className="text-lg font-medium text-green-800"
              style={{
                animation: 'messageGlow 2s ease-in-out infinite',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      )}

      {/* Subtle background glow */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-green-50/20 via-blue-50/20 to-purple-50/20"
        style={{
          animation: 'fadeIn 1s ease-out forwards',
          opacity: 0,
        }}
      />

      <style jsx>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CelebrationAnimation;