import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/colors.css";
import "./styles/global.css";
import Home from "./Pages/Home";
import LearnMore from "./Pages/LearnMore";
import MapRoute from "./MapRoute/MapRoute";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scenario/:id" element={<MapRoute />} />
      <Route path="/learn-more" element={<LearnMore />} />
    </Routes>
  );
}

export default App;
