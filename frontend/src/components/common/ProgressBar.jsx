export default ProgressBar = ({ progress, textSize = "text-sm", showPercentage = true, height = "h-2", className = "" }) => {
  return (
    <div className={className}>
      <div className={`bg-gray-100 rounded-full ${height} mb-1`}>
        <div 
          className={`bg-[#4CAF50] ${height} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {showPercentage && (
        <div className={`flex justify-end ${textSize} text-gray-500`}>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};