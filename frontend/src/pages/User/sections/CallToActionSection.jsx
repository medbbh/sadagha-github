export function CallToActionSection() {
  return (
    <section className="py-20 bg-[#3366CC]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of changemakers and innovators who are turning their ideas into reality through the power of community funding.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a 
            href="/start-campaign" 
            className="px-8 py-3 bg-[#FF9800] hover:bg-[#FB8C00] text-white rounded-lg font-medium transition-colors duration-300"
          >
            Start Your Campaign
          </a>
          <a 
            href="/explore" 
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg font-medium transition-colors duration-300"
          >
            explore-campaigns Campaigns
          </a>
        </div>
      </div>
    </section>
  );
}