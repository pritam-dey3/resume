import { useState, useEffect, useMemo } from 'react';
import FlexSearch from 'flexsearch';
import type { ProjectItem } from '../../about-me-data/dataTypes';

interface ProjectsProps {
  data: ProjectItem[];
}

const Projects = ({ data: projects }: ProjectsProps) => {
  const [filteredProjects, setFilteredProjects] = useState<ProjectItem[]>(projects);

  const index = useMemo(() => {
    const newIndex = new FlexSearch.Document({
      tokenize: "full",
      document: {
        id: "project_id",
        index: ["project_name", "description", "tags"],
      },
    });

    projects.forEach((project) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newIndex.add(project as any);
    });

    return newIndex;
  }, [projects]);

  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  return (
    <section id="projects" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Projects</h2>
      
      <div className="w-full px-9 my-3">
        <input
          id="projects-search"
          type="text"
          placeholder="Search projects..."
          className="input input-bordered w-full bg-base-100"
          onChange={(e) => {
            const query = e.target.value;
            if (!query) {
              setFilteredProjects(projects);
              return;
            }
            
            const subQueries = query.split(";");
            const all_matches: (string | number)[] = [];
            subQueries.forEach((subq) => {
              subq = subq.trim();
              if (!subq) return;
              const results = index.search(subq);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const matches = results.map((result: any) => result.result).flat();
              all_matches.push(...matches);
            });
            const matchedProjects = new Set(all_matches);
            setFilteredProjects(
              projects.filter((project) =>
                matchedProjects.has(project.project_id)
              )
            );
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
        {filteredProjects.map((project) => (
          <div key={project.project_id} id={`project-${project.project_id}`} className="card bg-base-200 shadow-lg hover:shadow-2xl transition-shadow duration-300 m-2 rounded-lg card-corner-borders">
            <div className="card-body">
              <h2 className="card-title text-secondary">{project.project_name}</h2>
              <p>{project.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags.map(tag => (
                    <span key={tag} className="badge badge-primary badge-outline">{tag}</span>
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
