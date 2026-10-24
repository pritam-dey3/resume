import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const site = "https://pritamdey.in";
const root = process.cwd();
const dist = resolve(root, "dist");

const readJson = (file) =>
  JSON.parse(readFileSync(resolve(root, "about-me-data", file), "utf8"));

const personal = readJson("personal.json");
const experience = readJson("experience.json");
const projects = readJson("projects.json");
const openSource = readJson("open-source.json");
const education = readJson("education.json");
const blogs = readJson("blogs.json");

const info = personal.personal_information;
const email = info["Contact information"].Email;
const linkedin = info["Social media profiles"].LinkedIn;
const github = info["Social media profiles"].GitHub;
const location = info["Residing location"];
const languages = info.Languages;
const skills = info["Skills and competencies"];
const publication = personal.publications;
const lastUpdated = new Date().toISOString().slice(0, 10);

const preferredSummary =
  "Pritam Dey is a data scientist at Amgen in Hyderabad, India. He builds AI agents, LLM tools, and Bayesian and Monte Carlo forecasting models for pharmaceutical work. He created the open-source projects WingMate, Interact, and Snatch, and published MRI-based Alzheimer's disease classification research in the Journal of Alzheimer's Disease Reports.";

const knowsAbout = [
  "AI Agents",
  "Agentic AI",
  "LLM orchestration",
  "Large Language Models",
  "Machine Learning",
  "Deep Learning",
  "Statistics",
  "Bayesian statistics",
  "Monte Carlo simulation",
  "Forecasting",
  "Clinical trial analytics",
  "SAS to R code translation",
  "Data Visualization",
  "Full-stack Development",
];

const clean = (value) =>
  String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const h = (value) => escapeHtml(value);

const faqs = [
  {
    q: "Who is Pritam Dey?",
    a: "Pritam Dey is a data scientist at Amgen in Hyderabad, India. He works on AI agents, LLM tools, Bayesian forecasting, and Monte Carlo simulation. He holds an M.Stat from the Indian Statistical Institute and created the open-source projects WingMate, Interact, and Snatch.",
  },
  {
    q: "What does Pritam Dey work on at Amgen?",
    a: "At Amgen, Pritam Dey develops forecasting models for drug sales across therapeutic areas. He applies Monte Carlo simulation and Bayesian statistical methods to quantify uncertainty, and uses agentic AI to support scenario analysis, model automation, and decision support.",
  },
  {
    q: "What open-source projects has Pritam Dey built?",
    a: "Pritam Dey created WingMate, a framework for running LLM agents locally; Interact, an LLM orchestration library positioned as an alternative to LangChain; Snatch, an automated web scraping script; and ReplayLLM, a LiteLLM provider for deterministic agent tests.",
  },
  {
    q: "What is Pritam Dey's research background?",
    a: "Pritam Dey published an MRI-based mild cognitive impairment and Alzheimer's disease classification study in the Journal of Alzheimer's Disease Reports in 2024. The work combines a variational autoencoder with machine learning classifiers. He also holds an M.Stat from the Indian Statistical Institute.",
  },
  {
    q: "How can I contact Pritam Dey?",
    a: `You can email Pritam Dey at ${email}, or connect with him on LinkedIn at ${linkedin}. His code and open-source projects are on GitHub at ${github}.`,
  },
];

const experienceMd = experience
  .map((job) => {
    const bullets = job.responsibilities
      .map((item) => `- ${clean(item)}`)
      .join("\n");
    return `### ${job.company} — ${job.role}\n\n${job.duration.start} – ${job.duration.end}\n\n${bullets}`;
  })
  .join("\n\n");

const projectsMd = projects
  .map((project) => {
    const points = (project.key_points || [])
      .map((item) => `- ${clean(item)}`)
      .join("\n");
    const tech = (project.tech_stack || []).join(", ");
    return `### ${project.project_name}\n\n${project.organization} · ${project.duration}\n\n${clean(
      project.description
    )}${points ? `\n\n${points}` : ""}${tech ? `\n\nTech: ${tech}` : ""}`;
  })
  .join("\n\n");

const openSourceMd = openSource
  .map(
    (item) =>
      `### [${item.name}](${item.link})\n\n${clean(item.description)}`
  )
  .join("\n\n");

const educationMd = education.education
  .map(
    (item) =>
      `### ${item.institution}\n\n${item.degree} · ${item.duration}\n\n- ${item.marks}`
  )
  .join("\n\n");

const coursesMd = education.courses
  .map((course) => {
    const certificate = course.certificate
      ? ` ([certificate](${course.certificate}))`
      : "";
    return `- ${course.name} — ${course.platform}, ${course.year}${certificate}`;
  })
  .join("\n");

const blogsMd = blogs
  .map(
    (item) =>
      `- [${item.headline}](${item.link}) — ${clean(item.description)}`
  )
  .join("\n");

const publicationMd = `- ${publication.description}. *Journal of Alzheimer's Disease Reports*, 2024. [DOI](https://doi.org/10.1177/25424823241290694)`;

const resumeMd = `# Pritam Dey

Data scientist at Amgen. AI agents, LLMs, forecasting, and machine learning.

${location}, India

[Portfolio](${site}/) · [LinkedIn](${linkedin}) · [GitHub](${github}) · [Email](mailto:${email})

_Last updated: ${lastUpdated}_

## Summary

${preferredSummary}

## Experience

${experienceMd}

## Projects

${projectsMd}

## Open source

${openSourceMd}

## Publications

${publicationMd}

## Education

${educationMd}

## Courses and certifications

${coursesMd}

## Writing

${blogsMd}

## Skills

${skills.map((item) => `- ${item}`).join("\n")}

## Languages

${languages.map((item) => `- ${item}`).join("\n")}
`;

const llmsTxt = `# Pritam Dey

> Data scientist at Amgen working on AI agents, LLMs, forecasting, and machine learning. Based in Hyderabad, India.

## Canonical
- [Portfolio](${site}/)
- [HTML resume](${site}/resume.html)
- [Markdown resume](${site}/resume.md)
- [Full AI context](${site}/llms-full.txt)

## Sections
- [Experience](${site}/#experience)
- [Projects](${site}/#projects)
- [Blogs](${site}/#blogs)
- [Education](${site}/#education)
- [Publications](${site}/#publications)
- [Open source](${site}/#open-source)

## Profiles
- [GitHub](${github})
- [LinkedIn](${linkedin})
- [dev.to](https://dev.to/pritam_dey)
- [SAGE paper](https://journals.sagepub.com/doi/10.1177/25424823241290694)

## Notes
- Last updated: ${lastUpdated}
- Preferred citation: Pritam Dey, "Pritam Dey — Data Scientist," ${site}/.
`;

const llmsFull = `# Pritam Dey — full profile

> Canonical portfolio: ${site}/
> HTML resume: ${site}/resume.html
> Markdown resume: ${site}/resume.md
> Last updated: ${lastUpdated}

## Preferred summary

${preferredSummary}

## Preferred citation

Pritam Dey, "Pritam Dey — Data Scientist," ${site}/.

${resumeMd}`;

const experienceHtml = experience
  .map(
    (job) => `<article class="space-y-1">
  <h3 class="text-xl font-bold text-neutral">${h(job.company)} — ${h(job.role)}</h3>
  <p class="text-sm text-base-content/70">${h(job.duration.start)} – ${h(job.duration.end)}</p>
  <ul class="list-disc space-y-1 pl-5">
    ${job.responsibilities.map((item) => `<li>${h(clean(item))}</li>`).join("\n    ")}
  </ul>
</article>`
  )
  .join("\n");

const projectsHtml = projects
  .map((project) => {
    const points = (project.key_points || [])
      .map((item) => `<li>${h(clean(item))}</li>`)
      .join("\n      ");
    return `<article class="space-y-1">
  <h3 class="text-xl font-bold text-secondary">${h(project.project_name)}</h3>
  <p class="text-sm text-base-content/70">${h(project.organization)} · ${h(project.duration)}</p>
  <p>${h(clean(project.description))}</p>
  ${points ? `<ul class="list-disc space-y-1 pl-5">\n      ${points}\n  </ul>` : ""}
  <p class="text-sm"><strong>Tech:</strong> ${h((project.tech_stack || []).join(", "))}</p>
</article>`;
  })
  .join("\n");

const openSourceHtml = openSource
  .map(
    (item) => `<article class="space-y-1">
  <h3 class="text-xl font-bold"><a class="link link-hover text-accent" href="${h(item.link)}">${h(item.name)}</a></h3>
  <p>${h(clean(item.description))}</p>
</article>`
  )
  .join("\n");

const educationHtml = education.education
  .map(
    (item) => `<article class="space-y-1">
  <h3 class="text-xl font-bold text-neutral">${h(item.institution)}</h3>
  <p class="font-semibold text-secondary">${h(item.degree)}</p>
  <p class="text-sm text-base-content/70">${h(item.duration)} · ${h(item.marks)}</p>
</article>`
  )
  .join("\n");

const coursesHtml = education.courses
  .map((course) => {
    const title = course.certificate
      ? `<a class="link link-hover font-medium" href="${h(course.certificate)}">${h(course.name)}</a>`
      : `<span class="font-medium">${h(course.name)}</span>`;
    return `<li>${title}<span class="text-sm text-base-content/70"> — ${h(course.platform)}, ${h(course.year)}</span></li>`;
  })
  .join("\n");

const blogsHtml = blogs
  .map(
    (item) =>
      `<li><a class="link link-hover font-medium" href="${h(item.link)}">${h(item.headline)}</a><span class="text-sm text-base-content/70"> — ${h(clean(item.description))}</span></li>`
  )
  .join("\n");

const faqHtml = faqs
  .map(
    (faq) => `<article class="space-y-1">
  <h3 class="text-xl font-bold">${h(faq.q)}</h3>
  <p class="text-base-content/85">${h(faq.a)}</p>
</article>`
  )
  .join("\n");

const personSchema = {
  "@type": "Person",
  "@id": `${site}/#person`,
  name: "Pritam Dey",
  url: `${site}/`,
  image: `${site}/profile.jpg`,
  jobTitle: "Data Scientist",
  description:
    "Data scientist focused on AI Agents, LLMs, machine learning, statistics and full-stack tools.",
  mainEntityOfPage: { "@id": `${site}/#profilepage` },
  address: {
    "@type": "PostalAddress",
    addressLocality: location,
    addressCountry: "IN",
  },
  worksFor: {
    "@type": "Organization",
    name: "Amgen",
    url: "https://www.amgen.com/",
  },
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: "Indian Statistical Institute",
      url: "https://www.isical.ac.in/",
    },
    {
      "@type": "CollegeOrUniversity",
      name: "Ramakrishna Mission Residential College, Narendrapur",
    },
  ],
  knowsLanguage: languages,
  sameAs: [github, linkedin, "https://dev.to/pritam_dey"],
  knowsAbout,
  hasOccupation: {
    "@type": "Occupation",
    name: "Data Scientist",
    occupationLocation: { "@type": "Country", name: "India" },
    description:
      "Developing advanced forecasting models, applying Monte Carlo simulation and Bayesian statistical methods, and leveraging agentic AI capabilities.",
  },
};

const profilePageSchema = {
  "@type": "ProfilePage",
  "@id": `${site}/resume.html#profilepage`,
  url: `${site}/resume.html`,
  name: "Pritam Dey — Data Scientist Resume",
  description:
    "Resume and profile of Pritam Dey, a data scientist at Amgen working on AI agents, LLMs, forecasting, and machine learning.",
  isPartOf: { "@id": `${site}/#website` },
  mainEntity: { "@id": `${site}/#person` },
  dateModified: lastUpdated,
  inLanguage: "en",
};

const faqSchema = {
  "@type": "FAQPage",
  "@id": `${site}/resume.html#faq`,
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const publicationSchema = {
  "@type": "ScholarlyArticle",
  "@id": `${site}/#publication`,
  headline:
    "MRI-based MCI and Alzheimer's Disease Classification via Variational Autoencoder and ML Classifiers",
  name: publication.description,
  url: publication.link,
  datePublished: "2024-10-18",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "DOI",
    value: "10.1177/25424823241290694",
  },
  isPartOf: {
    "@type": "Periodical",
    name: "Journal of Alzheimer's Disease Reports",
  },
  author: { "@id": `${site}/#person` },
  publisher: {
    "@type": "Organization",
    name: "SAGE Journals",
    url: "https://journals.sagepub.com/",
  },
};

const jsonLd = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@graph": [
      profilePageSchema,
      personSchema,
      publicationSchema,
      faqSchema,
    ],
  },
  null,
  2
).replace(/</g, "\\u003c");

const indexHtml = readFileSync(resolve(dist, "index.html"), "utf8");
const cssHref =
  indexHtml.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)?.[1] ??
  "/assets/index.css";

const resumeHtml = `<!doctype html>
<html lang="en" data-theme="mylight">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pritam Dey — Data Scientist Resume</title>
    <meta name="description" content="Resume and profile of Pritam Dey, a data scientist at Amgen working on AI agents, LLMs, forecasting, and machine learning." />
    <meta name="author" content="Pritam Dey" />
    <link rel="canonical" href="${site}/resume.html" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="icon" type="image/png" sizes="512x512" href="/portfolio.png" />
    <link rel="apple-touch-icon" href="/portfolio.png" />
    <link rel="preload" href="/fonts/pacifico-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/poiret-one-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="${cssHref}" />
    <link rel="alternate" type="text/markdown" href="/resume.md" title="Pritam Dey resume (Markdown)" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${site}/resume.html" />
    <meta property="og:site_name" content="Pritam Dey" />
    <meta property="og:title" content="Pritam Dey — Data Scientist Resume" />
    <meta property="og:description" content="Resume and profile of Pritam Dey, a data scientist at Amgen working on AI agents, LLMs, forecasting, and machine learning." />
    <meta property="og:image" content="${site}/profile.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:image:alt" content="Pritam Dey, data scientist" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Pritam Dey — Data Scientist Resume" />
    <meta name="twitter:description" content="Resume and profile of Pritam Dey, a data scientist at Amgen working on AI agents, LLMs, forecasting, and machine learning." />
    <meta name="twitter:image" content="${site}/profile.jpg" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body class="bg-base-100 text-base-content">
    <main class="mx-auto p-4 space-y-4 max-w-339">
      <header class="space-y-3">
        <p class="text-sm"><a class="link link-hover" href="/">← Portfolio</a></p>
        <h1 class="text-4xl font-bold font-poiret">Pritam Dey</h1>
        <p class="text-xl font-semibold text-secondary">Data Scientist at Amgen</p>
        <p class="text-lg text-base-content/85">${h(preferredSummary)}</p>
        <p class="text-sm text-base-content/70">${h(location)}, India · ${h(languages.join(", "))}</p>
        <p class="flex flex-wrap gap-3 text-sm">
          <a class="link link-hover" href="mailto:${h(email)}">Email</a>
          <a class="link link-hover" href="${h(linkedin)}">LinkedIn</a>
          <a class="link link-hover" href="${h(github)}">GitHub</a>
          <a class="link link-hover" href="/resume.md">Markdown resume</a>
        </p>
      </header>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Experience</h2>
        ${experienceHtml}
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Projects</h2>
        ${projectsHtml}
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Open source</h2>
        ${openSourceHtml}
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Publications</h2>
        <ul class="list-disc space-y-1 pl-5">
          <li>${h(publication.description)}. <span class="text-sm text-base-content/70">Journal of Alzheimer's Disease Reports, 2024.</span> <a class="link link-hover" href="${h(publication.link)}">Read the paper</a></li>
        </ul>
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Education</h2>
        ${educationHtml}
        <h3 class="text-xl font-bold">Courses and certifications</h3>
        <ul class="list-disc space-y-1 pl-5">
          ${coursesHtml}
        </ul>
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Selected writing</h2>
        <ul class="list-disc space-y-1 pl-5">
          ${blogsHtml}
        </ul>
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Skills</h2>
        <p>${h(skills.join(" · "))}</p>
        <h2 class="text-3xl font-bold text-primary">Languages</h2>
        <p>${h(languages.join(" · "))}</p>
      </section>

      <section class="space-y-4">
        <h2 class="text-3xl font-bold text-primary">Frequently asked questions</h2>
        ${faqHtml}
      </section>

      <footer class="border-t border-base-300 pt-4 text-sm text-base-content/70">
        <p>Last updated: ${h(lastUpdated)}. <a class="link link-hover" href="/resume.md">Markdown version</a>.</p>
        <p><a class="link link-hover" href="/">Back to portfolio</a></p>
      </footer>
    </main>
  </body>
</html>
`;

writeFileSync(resolve(dist, "resume.md"), resumeMd);
writeFileSync(resolve(dist, "llms.txt"), llmsTxt);
writeFileSync(resolve(dist, "llms-full.txt"), llmsFull);
writeFileSync(resolve(dist, "resume.html"), resumeHtml);

console.log(
  "Generated dist/llms.txt, dist/llms-full.txt, dist/resume.md, dist/resume.html"
);
