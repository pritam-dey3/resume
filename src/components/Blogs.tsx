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
            className="relative overflow-hidden flex flex-col glass-2 glass-hover rounded-box p-5"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-secondary"
            />
            <h3 className="text-neutral font-bold text-lg leading-snug mb-2">
              <a
                href={blog.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 link link-hover"
              >
                {blog.headline}
                <ArrowRightIcon
                  size={14}
                  className="mt-1 shrink-0"
                  aria-hidden="true"
                />
              </a>
            </h3>
            <p className="text-base-content/80 text-sm flex-1">{blog.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blogs;
