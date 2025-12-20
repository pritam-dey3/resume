import { useState, useEffect } from 'react';
import { CaretDownIcon, SunIcon, MoonIcon } from "@phosphor-icons/react";
import ScrollSpy from 'react-scrollspy-navigation';

const Nav = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return "dark";
    }
    return "light";
  });

  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const mainDiv = document.getElementById('main');
    if (mainDiv) {
      const sectionElements = mainDiv.querySelectorAll('section');
      const newSections: { id: string; label: string }[] = [];
      sectionElements.forEach((section) => {
        if (section.id) {
          const h2 = section.querySelector('h2');
          if (h2) {
            newSections.push({ id: section.id, label: h2.innerText });
          }
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSections(newSections);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  return (
    <div className="w-full flex flex-row bg-base-100 shadow-sm sticky top-0 z-2 px-5 py-2 justify-center">
      <div className="flex-1 max-w-339">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="text-xl">
            <div className="flex items-center gap-2 group">
              <ScrollSpy activeClass="!block">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="hidden pointer-events-none"
                    onClick={(e) => e.preventDefault()}
                  >
                    {section.label}
                  </a>
                ))}
              </ScrollSpy>
              <CaretDownIcon size={16} />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box w-52 shadow"
          >
            <ScrollSpy activeClass="active">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.label}</a>
                </li>
              ))}
            </ScrollSpy>
          </ul>
        </div>
      </div>
      <div className="flex-none">
        <ul className="flex flex-row gap-4 px-1 items-center p-0!">
          {/* <li>
            Blogs
          </li> */}
          <li>
            <span className="" onClick={toggleTheme}>
              {theme === "dark" ? (
                <SunIcon size={24} />
              ) : (
                <MoonIcon size={24} />
              )}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Nav
