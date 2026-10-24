import type { OpenSourceItem } from "../../about-me-data/dataTypes";
import { GithubLogoIcon } from "@phosphor-icons/react";

interface OpenSourceProps {
  data: OpenSourceItem[];
}

const OpenSource = ({ data }: OpenSourceProps) => {
  return (
    <section id="open-source" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Open Source</h2>
      <div className="flex flex-wrap justify-center gap-4">
        {data.map((item, index) => (
          <div
            key={index}
            id={`opensource-${item.name.toLowerCase()}`}
            className="card glass-2 glass-hover rounded-box w-full md:w-[calc(50%-var(--spacing)*2)] lg:w-[calc(33.333%-var(--spacing)*8/3)]"
          >
            <div className="card-body">
              <h3 className="card-title">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 link link-hover text-accent"
                >
                  {item.name}
                  <GithubLogoIcon size={24} aria-hidden="true" />
                </a>
              </h3>
              <p dangerouslySetInnerHTML={{ __html: item.description }}></p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OpenSource;
