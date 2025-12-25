import { Link } from "react-router-dom";

import "./Footer.css"

export default function Footer({ data }) {
  if (!data) return null;

  return (
    <footer className="footer">
      <div className="container footer__container">
        <div className="footer__copyright body-small">
          {data.copyright}
        </div>
        
        <nav className="footer__legal">
          {data.legal.map((item, idx) => (
            <Link key={idx} to={item.payload} className="footer__link body-small">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}