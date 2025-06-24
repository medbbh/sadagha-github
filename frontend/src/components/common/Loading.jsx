import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      {/* Blurred backdrop only behind the loader */}
      <motion.div 
        className="absolute inset-0 bg-white/20 backdrop-blur-sm"
        style={{
          clipPath: 'circle(80px at 50% 50%)', // Creates a circular blur zone
          WebkitClipPath: 'circle(80px at 50% 50%)'
        }}
      />
      
      {/* Crisp loading dots */}
      <div className="relative flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-3 w-3 bg-teal-500 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}