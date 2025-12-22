import type { ExperienceItem } from '../../about-me-data/dataTypes';
import { BriefcaseIcon } from '@phosphor-icons/react';

interface ExperienceProps {
  data: ExperienceItem[];
}

const Experience = ({ data }: ExperienceProps) => {
  return (
    <section id="experience" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Experience</h2>
      <ul className="timeline timeline-vertical max-md:timeline-compact w-[85%] max-md:w-full gap-6">
        {data.map((job, index) => (
          <li key={index}>
            <hr className="bg-primary/15" />
            <div className="timeline-start text-end max-md:text-start">
              <div className="text-xl font-bold text-neutral">
                {job.company}
              </div>
              <div className="text-lg text-secondary font-semibold">
                {job.role}
              </div>
              <div className="text-base-content/70">
                {job.duration.start} - {job.duration.end}
              </div>
            </div>
            <div className="timeline-middle px-3">
              <BriefcaseIcon size={24} className="text-primary" />
            </div>
            <div className="timeline-end">
              <div className="py-3">
                <ul className="list-disc pl-5 space-y-1">
                  {job.responsibilities.map((responsibility, idx) => (
                    <li key={idx} className="text-base-content/85">
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <hr className="bg-primary/15" />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Experience;
