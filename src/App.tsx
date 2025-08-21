import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/colors.css";
import "./styles/global.css";
import Home from "./Pages/Home";
import MapRoute from "./MapRoute/MapRoute";
import { Routes, Route } from "react-router-dom";

function App() {
  const points: [number, number][] = [
    [52.3676, 4.9041], // Amsterdam
    [50.8503, 4.3517], // Brussels
    [51.1657, 10.4515], // Germany (midpoint)
    [52.52, 13.405], // Berlin
  ];

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scenario/:id" element={<MapRoute points={points} />} />
    </Routes>
  );
}

export default App;
