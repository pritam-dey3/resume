import "./App.css";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Loader from "./components/Loader";
import Nav from "./components/Nav";
import OpenSource from "./components/OpenSource";
import Projects from "./components/Projects";
import Publications from "./components/Publications";
import Chatbot from "./components/Chatbot";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";
import experienceData from "../about-me-data/experience.json";
import openSourceData from "../about-me-data/open-source.json";
import personalData from "../about-me-data/personal.json";
import projectsData from "../about-me-data/projects.json";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const smoother = useRef<ScrollSmoother | null>(null);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "mydark";
    }
    return "mylight";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "mydark" ? "mylight" : "mydark";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    const handleLoad = () => setIsLoading(false);
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  useGSAP(
    () => {
      if (isLoading) return;
      smoother.current = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#content",
        smooth: 1.5,
        smoothTouch: false,
        effects: true,
      });

      const headers = gsap.utils.toArray("section > h2") as HTMLElement[];
      headers.forEach((header) => {
        gsap.fromTo(
          header,
          {
            "--header-underline-width": "50%",
          },
          {
            "--header-underline-width": "160%",
            scrollTrigger: {
              trigger: header,
              start: "bottom 80%",
              end: "bottom 30%",
              scrub: true,
            },
            ease: "power2.in",
          }
        );
      });
    },
    { scope: "#smooth-wrapper", dependencies: [isLoading] }
  );

  const mainContentRef = useRef(null);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div id="smooth-wrapper">
      <Nav smoother={smoother} theme={theme} toggleTheme={toggleTheme} />
      <div id="content">
        <div
          ref={mainContentRef}
          id="main"
          className="mx-auto p-4 space-y-12 max-w-339 relative mb-60"
        >
          <AboutMe data={personalData} />
          <Experience data={experienceData} />
          <Projects data={projectsData} />
          <Publications data={personalData.publications} />
          <OpenSource data={openSourceData} />
        </div>
        <Footer />
      </div>
        <Chatbot smoother={smoother} />
    </div>
  );
}

export default App;
