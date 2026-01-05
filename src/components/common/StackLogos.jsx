import figmaIcon from "../../assets/stack-logos/figma.png";
import webflowIcon from "../../assets/stack-logos/webflow.png";
import htmlIcon from "../../assets/stack-logos/html.png";
import cssIcon from "../../assets/stack-logos/css.png";
import TailwindIcon from "../../assets/stack-logos/tailwind.png";
import javascriptIcon from "../../assets/stack-logos/javascript.png";
import jqueryIcon from "../../assets/stack-logos/jquery.png";
import gitIcon from "../../assets/stack-logos/git.png";

import reactIcon from "../../assets/stack-logos/react.png";
import nodeIcon from "../../assets/stack-logos/node.png";
import vercelIcon from "../../assets/stack-logos/vercel.png";
import airtableIcon from "../../assets/stack-logos/airtable.png";
import posgresqlIcon from "../../assets/stack-logos/posgresql.png";
import firebaseIcon from "../../assets/stack-logos/firebase.png";
import supabaseIcon from "../../assets/stack-logos/supabase.png";

const STACK = [
  { name: "Figma", icon: figmaIcon },
  { name: "Webflow", icon: webflowIcon },
  { name: "HTML", icon: htmlIcon },
  { name: "CSS", icon: cssIcon },
  { name: "Tailwind", icon: TailwindIcon },
  { name: "JavaScript", icon: javascriptIcon },
  { name: "jQuery", icon: jqueryIcon },
  { name: "Git", icon: gitIcon },

  { name: "React", icon: reactIcon },
  { name: "Node", icon: nodeIcon },
  { name: "Vercel", icon: vercelIcon },
  { name: "Airtable", icon: airtableIcon },
  { name: "Posgresql", icon: posgresqlIcon },
  { name: "Firebase", icon: firebaseIcon },
  { name: "Supabase", icon: supabaseIcon },
];

export default function StackLogos() {
  return (
    <div className="stack-logos">
      {STACK.map((item, index) => (
        <div key={`${item.name}-${index}`} className="stack-item">
          <img
            src={item.icon}
            alt={item.name}
            style={{ height: "100%", width: "auto", objectFit: "contain" }}
          />
        </div>
      ))}
    </div>
  );
}
