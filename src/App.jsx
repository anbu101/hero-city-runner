import Game from "./game/Game";
import AnimationLab from "./game/AnimationLab";

function App() {
  const params = new URLSearchParams(window.location.search);
  const isLabMode = params.get("mode") === "lab";
  return isLabMode ? <AnimationLab /> : <Game />;
}

export default App;
