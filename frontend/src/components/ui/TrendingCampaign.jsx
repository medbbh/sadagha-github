export default TrendingProjectsSection = ({ projects }) => {
  return (
    <section className="py-16 bg-gradient-to-t from-white to-[#3366CC]/5">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader 
          title="Trending Now"
          subtitle="Projects that are getting a lot of attention"
          viewAllLink="/trending"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
};