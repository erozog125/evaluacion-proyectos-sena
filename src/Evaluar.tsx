import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { criterios } from "./evaluacion";
import jsPDF from "jspdf";

import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

const proyectos = [
  "Gest-Par-ZEDIC",
  "Accesorios Apolo",
  "FinZen",
  "Lúdicamente",
  "Candle Naturals",
  "Nigth+",
];

export default function Evaluar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({});
  const [promedioGeneral, setPromedioGeneral] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [promediosGlobales, setPromediosGlobales] = useState<Record<string, number>>({});
  const [promedioPorItem, setPromedioPorItem] = useState<Record<string, number>>({});

  const nombreProyecto = proyectos[parseInt(id ?? "0")] ?? `Proyecto ${id}`;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserEmail(currentUser.email || "");
      if (currentUser.email === "erozog125@gmail.com") {
        setIsAdmin(true);
        obtenerPromedioGeneral().then(setPromedioGeneral);
        obtenerPromediosGlobales();
        calcularPromediosPorItem();
      }
    }
  }, []);

  const handleChange = (criterio: string, valor: number) => {
    setCalificaciones({ ...calificaciones, [criterio]: valor });
  };

  const calcularPromedio = () => {
    const valores = Object.values(calificaciones);
    if (valores.length === 0) return "0.0";
    const suma = valores.reduce((a, b) => a + b, 0);
    return (suma / valores.length).toFixed(2);
  };

  const guardarEvaluacion = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Usuario no autenticado");
      return;
    }

    try {
      const docRef = doc(db, "evaluaciones", id!, "jurados", user.email!);
      await setDoc(docRef, {
        calificaciones,
        promedio: parseFloat(calcularPromedio()),
        fecha: new Date().toISOString(),
      });
      alert("Evaluación guardada correctamente");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar evaluación");
    }
  };

  const corregirEvaluacion = () => {
    setCalificaciones({});
  };

  const calcularPromediosPorItem = async () => {
    const juradosRef = collection(db, "evaluaciones", id!, "jurados");
    const snapshot = await getDocs(juradosRef);

    const totales: Record<string, number[]> = {};

    snapshot.forEach((doc) => {
      const email = doc.id;
      const data = doc.data();
      if (email !== "erozog125@gmail.com") {
        Object.entries(data.calificaciones).forEach(([criterio, valor]) => {
          if (!totales[criterio]) totales[criterio] = [];
          totales[criterio].push(valor as number);
        });
      }
    });

    const promedios: Record<string, number> = {};
    Object.entries(totales).forEach(([criterio, valores]) => {
      const suma = valores.reduce((a, b) => a + b, 0);
      promedios[criterio] = parseFloat((suma / valores.length).toFixed(2));
    });

    setPromedioPorItem(promedios);
  };

  const obtenerPromedioGeneral = async () => {
    const juradosRef = collection(db, "evaluaciones", id!, "jurados");
    const snapshot = await getDocs(juradosRef);

    const promedios: number[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const email = doc.id;
      if (data.promedio && email !== "erozog125@gmail.com") {
        promedios.push(parseFloat(data.promedio));
      }
    });

    if (promedios.length === 0) return "0.0";
    const suma = promedios.reduce((a, b) => a + b, 0);
    return (suma / promedios.length).toFixed(2);
  };

  const obtenerPromediosGlobales = async () => {
    const evaluacionesRef = collection(db, "evaluaciones");
    const snapshot = await getDocs(evaluacionesRef);
    const resultados: Record<string, number> = {};

    for (const proyecto of snapshot.docs) {
      const juradosSnap = await getDocs(collection(db, "evaluaciones", proyecto.id, "jurados"));
      const promedios: number[] = [];

      juradosSnap.forEach((doc) => {
        const data = doc.data();
        const email = doc.id;
        if (data.promedio && email !== "erozog125@gmail.com") {
          promedios.push(data.promedio);
        }
      });

      if (promedios.length) {
        const suma = promedios.reduce((a, b) => a + b, 0);
        resultados[proyecto.id] = parseFloat((suma / promedios.length).toFixed(2));
      }
    }

    setPromediosGlobales(resultados);
  };

  const exportarResumenPDF = () => {
    const docPDF = new jsPDF();
    docPDF.setFont("helvetica", "");
    docPDF.setFontSize(14);

    docPDF.text("Jornada presentación de proyectos formativos", 20, 20);
    docPDF.text("ADSO - 2901723", 20, 30);
    docPDF.text(`Proyecto: ${nombreProyecto}`, 20, 45);

    let y = 60;
    docPDF.setFont("helvetica", "bold");
    docPDF.text("Categoría", 20, y);
    docPDF.text("Criterio de Evaluación", 60, y);
    docPDF.text("Calificación Promedio", 160, y);

    y += 10;
    docPDF.setFont("helvetica", "");

    Object.entries(criterios).forEach(([categoria, items]) => {
      docPDF.setFont("helvetica", "bold");
      docPDF.text(categoria, 20, y);
      y += 8;
      docPDF.setFont("helvetica", "");
      items.forEach((criterio) => {
        docPDF.text("-", 20, y);
        docPDF.text(criterio, 30, y, { maxWidth: 120 });
        const promedio = promedioPorItem[criterio]?.toFixed(2) ?? "--";
        docPDF.text(promedio, 160, y);
        y += 8;
      });
      y += 5;
    });

    y += 10;
    docPDF.setFont("helvetica", "bold");
    docPDF.text(`Nota final del proyecto: ${promedioGeneral}`, 20, y);
    docPDF.save(`resumen-${id}.pdf`);
  };

  const exportarRankingPDF = () => {
    const docPDF = new jsPDF();
    docPDF.setFont("helvetica", "bold");
    docPDF.setFontSize(16);
    docPDF.text("Ranking de proyectos", 20, 20);
    docPDF.setFontSize(12);

    const proyectosOrdenados = Object.entries(promediosGlobales)
      .sort(([, a], [, b]) => b - a);

    let y = 40;
    proyectosOrdenados.forEach(([nombre, promedio], i) => {
      const nombreProyecto = proyectos[parseInt(nombre)] ?? nombre;
      docPDF.text(`${i + 1}. ${nombreProyecto} - Nota final: ${promedio}`, 20, y);
      y += 10;
    });

    docPDF.save("ranking-proyectos.pdf");
  };

  return (
    <div className="evaluacion-container">
      <div className="header">
        <button onClick={() => navigate("/")} className="btn btn-volver">
          🏠 Inicio
        </button>
        <p className="text-sm text-gray-600">Usuario conectado: <strong>{userEmail}</strong></p>
      </div>

      <h2 className="titulo-evaluar">Evaluación del proyecto: {nombreProyecto}</h2>

      {isAdmin ? (
        <>
          <div className="evaluacion-box">
            {Object.entries(criterios).map(([categoria, items]) => (
              <div key={categoria} className="categoria-evaluacion">
                <h3 className="categoria-titulo">{categoria}</h3>
                {items.map((item) => (
                  <div key={item} className="criterio-row">
                    <span className="criterio-texto">{item}</span>
                    <span className="criterio-texto">{promedioPorItem[item]?.toFixed(2) ?? "--"}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="promedio-final">
              Nota final del proyecto: <span className="text-primary">{promedioGeneral}</span>
            </div>
          </div>
          <div className="acciones-evaluacion">
            <button onClick={exportarResumenPDF} className="btn btn-secondary">
              Descargar Resumen PDF
            </button>
            <button onClick={exportarRankingPDF} className="btn btn-secondary">
              Descargar Ranking PDF
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="evaluacion-box">
            {Object.entries(criterios).map(([categoria, items]) => (
              <div key={categoria} className="categoria-evaluacion">
                <h3 className="categoria-titulo">{categoria}</h3>
                {items.map((item) => (
                  <div key={item} className="criterio-row">
                    <span className="criterio-texto">{item}</span>
                    <select
                      value={calificaciones[item] || ""}
                      onChange={(e) => handleChange(item, parseFloat(e.target.value))}
                      className="criterio-select"
                    >
                      <option value="" disabled>Seleccione</option>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            ))}
            <div className="promedio-final">
              Tu Promedio: <span className="text-primary">{calcularPromedio()}</span>
            </div>
          </div>

          <div className="acciones-evaluacion">
            <button onClick={guardarEvaluacion} className="btn btn-primary">
              Guardar
            </button>
            <button onClick={corregirEvaluacion} className="btn btn-warning">
              Corregir
            </button>
          </div>
        </>
      )}
    </div>
  );
}