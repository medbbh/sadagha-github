import { ChevronRight, Heart } from 'lucide-react';

export function TrendingCampaignsSection({ Campaigns }) {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <section className="py-16 bg-gradient-to-t from-white to-[#3366CC]/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#3366CC]">Trending Now</h2>
            <p className="text-gray-600 mt-2">Campaigns that are getting a lot of attention</p>
          </div>
          <a href="/trending" className="text-[#3366CC] font-medium flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 group"
            >
              <div className="relative">
                <img 
                  src={campaign.image} 
                  alt={campaign.title} 
                  className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {campaign.featured && (
                  <span className="absolute top-3 right-3 bg-[#FF9800] text-white text-xs px-2 py-1 rounded">Featured</span>
                )}
                <button className="absolute top-3 left-3 bg-white/80 hover:bg-white p-1.5 rounded-full transition-colors duration-300 text-[#3366CC]/70 hover:text-[#3366CC]">
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              
              <div className="p-5">
                <span className="text-xs font-medium text-[#3366CC] bg-[#3366CC]/10 px-2 py-1 rounded">{campaign.category}</span>
                <h3 className="font-bold text-gray-800 mt-2 mb-3 line-clamp-2 h-12">{campaign.title}</h3>
                
                <div className="mb-3">
                  <div className="bg-gray-100 rounded-full h-1.5 mb-1">
                    <div 
                      className="bg-[#4CAF50] h-1.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatMoney(campaign.raised)}</span>
                    <span>{campaign.progress}%</span>
                  </div>
                </div>
                
                <a 
                  href={`/campaign/${campaign.id}`}
                  className="inline-block w-full text-center mt-2 px-4 py-2 bg-[#3366CC]/10 hover:bg-[#3366CC] text-[#3366CC] hover:text-white rounded-lg transition-all duration-300 font-medium text-sm"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}