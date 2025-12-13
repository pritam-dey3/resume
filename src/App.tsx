import './App.css'
import Nav from './components/Nav'
import AboutMe from './components/AboutMe'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Publications from './components/Publications'
import OpenSource from './components/OpenSource'
import Footer from './components/Footer'

import personalData from '../about-me-data/personal.json'
import experienceData from '../about-me-data/experience.json'
import projectsData from '../about-me-data/projects.json'
import openSourceData from '../about-me-data/open-source.json'

function App() {

  return (
    <div>
     <Nav />
     <div id="main" className="mx-auto p-4 space-y-12">
      <AboutMe data={personalData} />
      <Experience data={experienceData} />
      <Projects data={projectsData} />
      <Publications data={personalData.publications} />
      <OpenSource data={openSourceData} />
     </div>
     <Footer />
    </div>
  )
}

export default App
