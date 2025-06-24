export default StatisticsSection = ({ statistics }) => {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setStatsVisible(true);
      }
    }, observerOptions);

    if (statsRef.current) {
      statsObserver.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) statsObserver.unobserve(statsRef.current);
    };
  }, []);

  return (
    <section ref={statsRef} className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statistics.map((stat, index) => (
            <StatCard 
              key={stat.id}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              delay={index * 150}
              isVisible={statsVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};