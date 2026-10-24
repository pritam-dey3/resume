import type { Publication } from "../../about-me-data/dataTypes";

interface PublicationsProps {
  data: Publication;
}

const Publications = ({ data }: PublicationsProps) => {
  return (
    <section id="publications" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Publications</h2>
      <div className="p-4">
        <ul className="list-disc list-inside">
          <li>
            <a
              href={data.link}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover font-medium"
            >
              {data.description}
            </a>
            <span className="text-base-content/70"> (SAGE Journals)</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Publications;
