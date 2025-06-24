import { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, Award, Star } from 'lucide-react';

export function StatisticsSection() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const statistics = [
    { id: 1, value: "850K+", label: "Backers", icon: <Users className="h-6 w-6" /> },
    { id: 2, value: "$25M+", label: "Raised", icon: <TrendingUp className="h-6 w-6" /> },
    { id: 3, value: "12K+", label: "Campaigns", icon: <Award className="h-6 w-6" /> },
    { id: 4, value: "98%", label: "Success Rate", icon: <Star className="h-6 w-6" /> }
  ];

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
            <div 
              key={stat.id} 
              className={`bg-white border border-gray-100 shadow-lg hover:shadow-xl rounded-xl p-6 flex flex-col items-center text-center transition-all duration-500 transform ${statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} 
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-[#3366CC]/10 flex items-center justify-center mb-4 text-[#3366CC]">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-[#3366CC]">{stat.value}</h3>
              <p className="text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}