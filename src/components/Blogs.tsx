import type { BlogItem } from "../../about-me-data/dataTypes";
import { ArrowRightIcon } from "@phosphor-icons/react";

interface BlogsProps {
  data: BlogItem[];
}

const Blogs = ({ data }: BlogsProps) => {
  return (
    <section id="blogs" className="space-y-4">
      <h2 className="text-3xl font-bold text-primary">Blogs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((blog, index) => (
          <div
            key={index}
            className="flex flex-col bg-base-200 rounded-lg border-l-4 border-secondary p-5 shadow hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-neutral font-bold text-lg leading-snug mb-2">
              {blog.headline}
            </h3>
            <p className="text-base-content/80 text-sm flex-1">{blog.description}</p>
            <a
              href={blog.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent link link-hover self-start"
            >
              Read more <ArrowRightIcon size={14} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blogs;
