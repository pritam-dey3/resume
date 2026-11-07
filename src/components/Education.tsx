import type { EducationData } from "../../about-me-data/dataTypes";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { trackEvent } from "../lib/analytics";

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
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{course.name}</p>
                  <p className="text-sm text-base-content/70">
                    {course.platform} · {course.year}
                  </p>
                </div>
                {course.certificate && (
                  <a
                    href={course.certificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View certificate for ${course.name}`}
                    className="badge badge-secondary badge-outline badge-sm shrink-0 gap-1 transition-colors hover:bg-secondary hover:text-secondary-content"
                    onClick={() => trackEvent("certificate_click", { course: course.name })}
                  >
                    Certificate
                    <ArrowUpRightIcon
                      size={12}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Education;
