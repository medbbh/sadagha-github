export default SectionHeader = ({ title, subtitle, viewAllLink, viewAllText = "View All" }) => {
  return (
    <div className="flex justify-between items-end mb-10">
      <div>
        <h2 className="text-3xl font-bold text-[#3366CC]">{title}</h2>
        {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {viewAllLink && (
        <a href={viewAllLink} className="text-[#3366CC] font-medium flex items-center hover:underline">
          {viewAllText} <ChevronRight className="h-4 w-4 ml-1" />
        </a>
      )}
    </div>
  );
};