
interface AboutMeProps {
  description: string;
}

const AboutMe = ({ description }: AboutMeProps) => {
  return (
    <section id="about-me" className="space-y-4">
      <h2 className="text-3xl font-bold">About Me</h2>
      <p className="whitespace-pre-line">{description}</p>
    </section>
  );
};

export default AboutMe;
