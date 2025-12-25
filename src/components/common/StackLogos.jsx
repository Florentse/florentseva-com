import figmaIcon from "../../assets/stack-logos/figma.png";
import webflowIcon from "../../assets/stack-logos/webflow.png";
import htmlIcon from "../../assets/stack-logos/html.png";
import cssIcon from "../../assets/stack-logos/css.png";
import TailwindIcon from "../../assets/stack-logos/tailwind.png";
import javascriptIcon from "../../assets/stack-logos/javascript.png";
import jqueryIcon from "../../assets/stack-logos/jquery.png";
import reactIcon from "../../assets/stack-logos/react.png";

import airtableIcon from "../../assets/stack-logos/airtable.png";
import vercelIcon from "../../assets/stack-logos/vercel.png";
import gitIcon from "../../assets/stack-logos/git.png";

const STACK = [
  { name: "Figma", icon: figmaIcon },
  { name: "Webflow", icon: webflowIcon },
  { name: "HTML", icon: htmlIcon },
  { name: "CSS", icon: cssIcon },
  { name: "Tailwind", icon: TailwindIcon },
  { name: "JavaScript", icon: javascriptIcon },
  { name: "jQuery", icon: jqueryIcon },
  { name: "React", icon: reactIcon },

  { name: "Airtable", icon: airtableIcon },
  { name: "Vercel", icon: vercelIcon },
  { name: "Git", icon: gitIcon },
];

export default function StackLogos() {
  return (
    <div className="stack-logos">
      {STACK.map((item, index) => (
        <div key={`${item.name}-${index}`} className="stack-item">
          <img
            src={item.icon}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      ))}
    </div>
  );
}
