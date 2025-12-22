import "./App.css";
import AboutMe from "./components/AboutMe";
import Experience from "./components/Experience";
import Footer from "./components/Footer";
import Nav from "./components/Nav";
import OpenSource from "./components/OpenSource";
import Projects from "./components/Projects";
import Publications from "./components/Publications";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import experienceData from "../about-me-data/experience.json";
import openSourceData from "../about-me-data/open-source.json";
import personalData from "../about-me-data/personal.json";
import projectsData from "../about-me-data/projects.json";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

function App() {
  const smoother = useRef<ScrollSmoother | null>(null);
  useGSAP(
    () => {
      smoother.current = ScrollSmoother.create({
        wrapper: "#root",
        content: "#content",
        smooth: 1.5,
        smoothTouch: 0.6,
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
      <Nav smoother={smoother} />
      <div id="content">
        <div
          ref={mainContentRef}
          id="main"
          className="mx-auto p-4 space-y-12 max-w-339 mb-60"
        >
          <AboutMe data={personalData} />
          <Experience data={experienceData} />
          <Projects data={projectsData} />
          <Publications data={personalData.publications} />
          <OpenSource data={openSourceData} />
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
