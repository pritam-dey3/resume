import { useGSAP } from "@gsap/react";
import { CaretDownIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import ScrollSpy from "react-scrollspy-navigation";

gsap.registerPlugin(ScrollTrigger);

const Nav = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  const [sections, setSections] = useState<{ id: string; label: string }[]>([]);
  const navRef = useRef(null);

  useEffect(() => {
    const mainDiv = document.getElementById("main");
    if (mainDiv) {
      const sectionElements = mainDiv.querySelectorAll("section");
      const newSections: { id: string; label: string }[] = [];
      sectionElements.forEach((section) => {
        if (section.id) {
          const h2 = section.querySelector("h2");
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
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  useGSAP(
    () => {
      gsap.set(".mynav", { y: -100, opacity: 0 });

      const anim = gsap.to(".mynav", {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        paused: true,
      });

      ScrollTrigger.create({
        trigger: ".avatar",
        start: "57% top",
        animation: anim,
        toggleActions: "play none none reverse",
        // onUpdate: (self) => {
        //   console.log(self.progress);
        // },
      });
    },
    { scope: '#root' }
  );

  return (
    <div
      ref={navRef}
      className="mynav w-full flex flex-row shadow-sm fixed top-0 z-20 px-5 py-2 justify-center bg-base-300/98"
    >
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
};

export default Nav;
