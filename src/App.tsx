import './App.css'
import Nav from './components/Nav'

function App() {

  return (
    <div>
     <Nav />
     <div id="main" className="mx-auto p-4 space-y-12">
      <section id="about-me" className="space-y-4 h-[65vh]">
        <h2 className="text-3xl font-bold">About Me</h2>
        <p>
          Hello! I am a passionate developer with a love for building scalable web applications.
          I enjoy solving complex problems and learning new technologies.
        </p>
      </section>

      <section id="experience" className="space-y-4 h-[65vh]">
        <h2 className="text-3xl font-bold">Experience</h2>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Senior Developer at Tech Corp</h3>
            <p className="text-sm opacity-70">2020 - Present</p>
            <p>Leading the frontend team and architecting new features.</p>
          </div>
        </div>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Junior Developer at StartUp Inc</h3>
            <p className="text-sm opacity-70">2018 - 2020</p>
            <p>Developed and maintained client-facing websites.</p>
          </div>
        </div>
      </section>

      <section id="projects" className="space-y-4 h-[65vh]">
        <h2 className="text-3xl font-bold">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Project Alpha</h3>
              <p>A revolutionary app that changes the way we do things.</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Project Beta</h3>
              <p>An open-source tool for developers.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="publications" className="space-y-4 h-[65vh]">
        <h2 className="text-3xl font-bold">Publications</h2>
        <ul className="list-disc list-inside">
          <li>"The Future of Web Development" - Tech Journal, 2023</li>
          <li>"Optimizing React Applications" - Dev Blog, 2022</li>
        </ul>
      </section>

      <section id="open-source" className="space-y-4 h-[65vh]">
        <h2 className="text-3xl font-bold">Open Source</h2>
        <p>
          I actively contribute to various open-source projects. Check out my GitHub for more details.
        </p>
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Awesome Library</h3>
            <p>Contributor to the core logic and documentation.</p>
          </div>
        </div>
      </section>
     </div>
    </div>
  )
}

export default App
