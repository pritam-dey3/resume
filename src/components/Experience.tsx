import type { ExperienceItem } from '../../about-me-data/dataTypes';

interface ExperienceProps {
  data: ExperienceItem[];
}

const Experience = ({ data }: ExperienceProps) => {
  return (
    <section id="experience" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Experience</h2>
      <div className="space-y-4">
        {data.map((item, index) => (
            <div key={index} className="card bg-base-200 shadow-xl border-l-4 border-primary">
            <div className="card-body">
                <h3 className="card-title text-primary">{item.role} at {item.company}</h3>
                <p className="text-sm text-base-content/70">{item.duration.start} - {item.duration.end}</p>
                <ul className="list-disc list-inside">
                    {item.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                    ))}
                </ul>
            </div>
            </div>
        ))}
      </div>
    </section>
  );
};

export default Experience;
