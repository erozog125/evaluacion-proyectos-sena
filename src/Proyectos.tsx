// Proyectos.tsx
import { Link } from "react-router-dom";
import "./index.css";

const proyectos = [
  "Gest-Par-ZEDIC",
  "Accesorios Apolo",
  "FinZen",
  "Lúdicamente",
  "Candle Naturals",
  "Nigth+"
];

export default function Proyectos() {
  return (
    <div className="proyectos-container">
      <h2 className="proyectos-titulo">Selecciona un proyecto:</h2>
      <ul className="proyectos-lista">
        {proyectos.map((proyecto, i) => (
          <li key={i}>
            <Link to={`/evaluar/${i}`}>
              <button className="btn btn-secondary btn-proyecto">{proyecto}</button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
