import type { EducationData } from "../../about-me-data/dataTypes";

interface EducationProps {
  data: EducationData;
}

const Education = ({ data }: EducationProps) => {
  return (
    <section id="education" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Education</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.education.map((item) => (
          <div
            key={`${item.institution}-${item.degree}`}
            className="card glass-2 glass-hover rounded-box"
          >
            <div className="card-body">
              <h3 className="card-title text-neutral">{item.institution}</h3>
              <p className="font-semibold text-secondary">{item.degree}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="badge badge-primary badge-outline">
                  {item.duration}
                </span>
                <span className="badge badge-ghost">{item.marks}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-xl font-bold text-neutral">
          Selected Courses &amp; Certifications
        </h3>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {data.courses.map((course) => (
            <li
              key={`${course.name}-${course.year}`}
              className="glass-1 rounded-box p-3"
            >
              {course.certificate ? (
                <a
                  href={course.certificate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover font-medium"
                >
                  {course.name}
                </a>
              ) : (
                <span className="font-medium">{course.name}</span>
              )}
              <p className="text-sm text-base-content/70">
                {course.platform} · {course.year}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Education;
