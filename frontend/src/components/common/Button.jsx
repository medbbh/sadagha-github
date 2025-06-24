export default Button = ({ href, variant = "primary", className = "", children }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center";
  
  const variants = {
    primary: "bg-[#3366CC] hover:bg-[#2855AA] text-white",
    secondary: "bg-white border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50]/5",
    tertiary: "bg-[#3366CC]/10 hover:bg-[#3366CC] text-[#3366CC] hover:text-white text-center w-full",
    cta: "bg-[#FF9800] hover:bg-[#FB8C00] text-white",
    outline: "bg-white/10 hover:bg-white/20 text-white border border-white/30"
  };

  return (
    <a href={href} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </a>
  );
};