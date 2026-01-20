import { Canvas } from "@react-three/fiber";
import { Player } from "./components/canvas/Player";
import { Museum } from "./components/canvas/Museum";
import { Interface } from "./components/dom/Interface";

function App() {
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 75 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <color attach="background" args={["#101015"]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Museum />
        <Player />
      </Canvas>

      <Interface />
    </>
  );
}

export default App;
