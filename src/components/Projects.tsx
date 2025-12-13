import type { ProjectItem } from '../../about-me-data/dataTypes';

interface ProjectsProps {
  data: ProjectItem[];
}

const Projects = ({ data }: ProjectsProps) => {
  return (
    <section id="projects" className="space-y-4">
      <h2 className="text-3xl font-bold">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((project) => (
          <div key={project.project_id} className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">{project.project_name}</h3>
              <p>{project.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags.map(tag => (
                    <span key={tag} className="badge badge-outline">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
