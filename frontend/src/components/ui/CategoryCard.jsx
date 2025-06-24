export default CategoryCard = ({ category, isVisible, delay }) => {
  return (
    <a 
      href={`/category/${category.id}`} 
      className={`relative group rounded-xl overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div 
        className="p-6 flex flex-col items-center text-center transition-transform duration-500 group-hover:-translate-y-1"
        style={{ backgroundColor: `${category.color}10` }}
      >
        <div className="text-4xl mb-3">{category.icon}</div>
        <h3 className="font-medium text-gray-800">{category.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{category.count} projects</p>
      </div>
      <div 
        className="h-1 w-full transition-transform duration-300 origin-left scale-x-0 group-hover:scale-x-100"
        style={{ backgroundColor: category.color }}
      ></div>
    </a>
  );
};