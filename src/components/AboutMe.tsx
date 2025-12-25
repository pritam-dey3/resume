import profileImg from "../assets/profile.webp";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  LinkedinLogoIcon,
  GithubLogoIcon,
  AtIcon,
} from "@phosphor-icons/react";

interface PersonalData {
  description: string;
  personal_information: {
    Name: string;
    "Contact information": {
      Email: string;
    };
    "Social media profiles": {
      LinkedIn: string;
      GitHub: string;
    };
  };
}

interface AboutMeProps {
  data: PersonalData;
}

const AboutMe = ({ data }: AboutMeProps) => {
  const { description, personal_information } = data;
  const { LinkedIn, GitHub } = personal_information["Social media profiles"];
  const { Email } = personal_information["Contact information"];

  const container = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".avatar", {
        opacity: 0,
        scale: 0.5,
        duration: 1,
        delay: 0.5,
      })
        .from(
          ".greeting",
          {
            opacity: 0,
            x: -20,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          ".name",
          {
            opacity: 0,
            x: 20,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          ".hero-content p",
          {
            y: 20,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.6"
        )
        .from(
          ".social-link",
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
          },
          "-=0.6"
        );
    },
    { scope: container }
  );

  return (
    <section
      id="about-me"
      className="hero p-4 md:p-12 relative"
      ref={container}
    >
      <div className="grid-bg"></div>
      <h2 className="hidden!">About Me</h2>
      <div className="hero-content flex-col lg:flex-row gap-12 items-center">
        <div className="avatar shrink-0">
          <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full shadow-2xl overflow-hidden">
            <img
              src={profileImg}
              alt={personal_information.Name}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 text-center lg:text-left">
          <div>
            <h1 className="text-4xl md:text-4xl leading-tight font-semibold">
              <span className="greeting inline-block">Hi, I'm{" "}</span>
              <span className="text-neutral font-pacifico font-light text-5xl whitespace-nowrap md:ml-2 name">{personal_information.Name}</span>
            </h1>
          </div>

          <p className="text-lg md:text-xl leading-relaxed text-center lg:text-start text-base-content/85">
            {description}
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-2 text-accent">
            <a
              href={LinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link border rounded-full p-2 hover:bg-accent/15"
              aria-label="LinkedIn"
            >
              <LinkedinLogoIcon size={32} />
            </a>
            <a
              href={GitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link border rounded-full p-2 hover:bg-accent/15"
              aria-label="GitHub"
            >
              <GithubLogoIcon size={32} />
            </a>
            <a
              href={`mailto:${Email}`}
              className="social-link border rounded-full p-2 hover:bg-accent/15"
              aria-label="Email"
            >
              <AtIcon size={32} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMe;
