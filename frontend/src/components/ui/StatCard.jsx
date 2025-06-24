export default StatCard = ({ icon, value, label, delay, isVisible }) => {
  return (
    <div 
      className={`bg-white border border-gray-100 shadow-lg hover:shadow-xl rounded-xl p-6 flex flex-col items-center text-center transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-full bg-[#3366CC]/10 flex items-center justify-center mb-4 text-[#3366CC]">
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-[#3366CC]">{value}</h3>
      <p className="text-gray-600 mt-1">{label}</p>
    </div>
  );
};