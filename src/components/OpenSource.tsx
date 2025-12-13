import type { OpenSourceItem } from '../../about-me-data/dataTypes';

interface OpenSourceProps {
  data: OpenSourceItem[];
}

const OpenSource = ({ data }: OpenSourceProps) => {
  return (
    <section id="open-source" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Open Source</h2>
      <p>
        I actively contribute to various open-source projects. Check out my GitHub for more details.
      </p>
      <div className="grid grid-cols-1 gap-4">
        {data.map((item, index) => (
            <div key={index} className="card bg-base-200 shadow-xl border-t-4 border-accent">
            <div className="card-body">
                <h3 className="card-title">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="link link-hover text-accent">
                        {item.name}
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
