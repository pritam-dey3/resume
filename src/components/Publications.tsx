import type { Publication } from '../../about-me-data/dataTypes';

interface PublicationsProps {
  data: Publication;
}

const Publications = ({ data }: PublicationsProps) => {
  return (
    <section id="publications" className="space-y-4">
      <h2 className="text-3xl font-bold">Publications</h2>
      <ul className="list-disc list-inside">
        <li>
            <a href={data.link} target="_blank" rel="noopener noreferrer" className="link link-hover">
                {data.description}
            </a>
        </li>
      </ul>
    </section>
  );
};

export default Publications;
