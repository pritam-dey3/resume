import "./App.css";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import Blogs from "./components/Blogs";
import OpenSource from "./components/OpenSource";
import Projects from "./components/Projects";
import Publications from "./components/Publications";
import PcbBackground from "./components/PcbBackground";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import experienceData from "../about-me-data/experience.json";
import educationData from "../about-me-data/education.json";
import openSourceData from "../about-me-data/open-source.json";
import personalData from "../about-me-data/personal.json";
import blogsData from "../about-me-data/blogs.json";
import projectsData from "../about-me-data/projects.json";

const Chatbot = lazy(() => import("./components/Chatbot"));

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

function App() {
  const [showChatbot, setShowChatbot] = useState(false);
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
    const id = window.setTimeout(() => setShowChatbot(true), 2500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  useGSAP(
    () => {
      smoother.current = ScrollSmoother.create({
        wrapper: "#root",
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
    { scope: "#root" }
  );

  const mainContentRef = useRef(null);

  return (
    <div id="root">
      <PcbBackground />
      <Nav smoother={smoother} theme={theme} toggleTheme={toggleTheme} />
      <div id="content">
        <main
          ref={mainContentRef}
          id="main"
          className="mx-auto p-4 space-y-12 max-w-339 relative mb-60"
        >
          <AboutMe data={personalData} />
          <Experience data={experienceData} />
          <Projects data={projectsData} />
          <Blogs data={blogsData} />
          <Education data={educationData} />
          <Publications data={personalData.publications} />
          <OpenSource data={openSourceData} />
        </main>
        <Footer />
      </div>
      {showChatbot && (
        <Suspense fallback={null}>
          <Chatbot smoother={smoother} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
