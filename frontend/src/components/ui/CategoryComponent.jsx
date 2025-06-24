export default CategoriesSection = ({ categories }) => {
  const [categoriesVisible, setCategoriesVisible] = useState(false);
  const categoryRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const categoryObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setCategoriesVisible(true);
      }
    }, observerOptions);

    if (categoryRef.current) {
      categoryObserver.observe(categoryRef.current);
    }

    return () => {
      if (categoryRef.current) categoryObserver.unobserve(categoryRef.current);
    };
  }, []);

  return (
    <section ref={categoryRef} className="py-16 bg-gradient-to-b from-white to-[#3366CC]/5">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader 
          title="Explore Categories"
          subtitle="Discover projects by the cause they support"
          viewAllLink="/categories"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category.id}
              category={category}
              isVisible={categoriesVisible}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};