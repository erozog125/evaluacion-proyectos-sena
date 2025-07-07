import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { criterios } from "./evaluacion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

export default function Evaluar() {
  const { id } = useParams(); // ID del proyecto
  const navigate = useNavigate();

  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({});
  const [promedioGeneral, setPromedioGeneral] = useState<string>("");

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

  const obtenerPromedioGeneral = async () => {
    const juradosRef = collection(db, "evaluaciones", id!, "jurados");
    const snapshot = await getDocs(juradosRef);

    const promedios: number[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.promedio) {
        promedios.push(parseFloat(data.promedio));
      }
    });

    if (promedios.length === 0) return "0.0";
    const suma = promedios.reduce((a, b) => a + b, 0);
    return (suma / promedios.length).toFixed(2);
  };

  const exportarPDF = async () => {
    const input = document.getElementById("reporte");
    if (!input) return;

    const promedioGlobal = await obtenerPromedioGeneral();
    setPromedioGeneral(promedioGlobal);

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Evaluación de proyectos formativos", 15, 15);
      pdf.setFontSize(14);
      pdf.text("Ficha ADSO 2901723", 15, 23);
      pdf.addImage(imgData, "PNG", 10, 30, pdfWidth - 20, pdfHeight);

      pdf.setFontSize(14);
      pdf.text(`Promedio final de jurados: ${promedioGlobal}`, 15, pdfHeight + 40);

      pdf.save(`reporte-proyecto-${id}.pdf`);
    });
  };

  return (
    <div className="evaluacion-container">
      <button onClick={() => navigate("/proyectos")} className="btn btn-volver">
        ← Volver a proyectos
      </button>

      <h2 className="titulo-evaluar">Evaluación del proyecto #{id}</h2>

      <div id="reporte" className="evaluacion-box">
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
          Promedio del jurado: <span className="text-primary">{calcularPromedio()}</span>
        </div>
      </div>

      <div className="acciones-evaluacion">
        <button onClick={guardarEvaluacion} className="btn btn-primary">
          Guardar
        </button>
        <button onClick={corregirEvaluacion} className="btn btn-warning">
          Corregir
        </button>
        <button onClick={exportarPDF} className="btn btn-secondary">
          Descargar PDF
        </button>
      </div>
    </div>
  );
}
