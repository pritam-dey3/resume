import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer footer-center p-4 mt-10">
      <aside>
        <p>Copyright © {new Date().getFullYear()} Pritam Dey</p>
      </aside>
    </footer>
  );
};

export default Footer;
