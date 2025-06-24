export default HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#3366CC]/10 to-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 md:pr-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#3366CC] leading-tight">
              <span className="block">Fund Your <span className="text-[#4CAF50]">Dreams</span>,</span>
              <span className="block">Support <span className="text-[#FF9800]">Innovation</span></span>
            </h1>
            <p className="text-lg text-gray-700">
              Join our global community of changemakers and bring creative projects to life through the power of collective funding.
            </p>
            <div className="flex space-x-4 pt-4">
              <Button href="/explore" variant="primary">
                Explore Projects <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button href="/start-campaign" variant="secondary">
                Start a Campaign
              </Button>
            </div>
          </div>
          <div className="rounded-xl shadow-xl overflow-hidden h-96 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#3366CC]/80 to-transparent z-10"></div>
            <img 
              src="/api/placeholder/800/600" 
              alt="Crowdfunding Success" 
              className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
              <p className="text-sm font-semibold bg-[#FF9800] inline-block px-2 py-1 rounded mb-2">Featured</p>
              <h3 className="text-2xl font-bold">Changing Lives Through Crowdfunding</h3>
              <p className="mt-2">Discover the stories of impact from our community</p>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-[#4CAF50]/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-[#3366CC]/10 rounded-full blur-3xl"></div>
    </section>
  );
};