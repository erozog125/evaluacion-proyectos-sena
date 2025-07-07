import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./index.css"; // Importamos los estilos centralizados

export default function Login() {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, clave);
      navigate("/proyectos");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Ingreso Jurados</h1>

        <div className="login-form">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />

          <input
            type="password"
            placeholder="Clave"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="login-input"
          />

          {error && <div className="login-error">{error}</div>}

          <button onClick={handleLogin} className="btn btn-primary w-full">
            Ingresar
          </button>
        </div>
      </div>
    </div>
  );
}
