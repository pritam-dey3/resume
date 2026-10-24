import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer footer-center p-4 mt-10">
      <aside>
        <p>Copyright © {new Date().getFullYear()} Pritam Dey</p>
        <nav
          aria-label="Resume formats"
          className="mt-2 flex flex-wrap justify-center gap-4 text-sm"
        >
          <a href="/resume.html" className="link link-hover">
            Resume
          </a>
          <a href="/resume.md" className="link link-hover">
            Markdown resume
          </a>
        </nav>
      </aside>
    </footer>
  );
};

export default Footer;
