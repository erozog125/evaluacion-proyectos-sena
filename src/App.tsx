import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from './Login'
import Proyectos from "./Proyectos";
import Evaluar from "./Evaluar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/evaluar/:id" element={<Evaluar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
