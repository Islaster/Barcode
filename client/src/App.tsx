import BarcodeScanner from "./components/barcodeScanner";
import NutritionTable from "./components/TableForTrackedData/main";
import { useNutritionContext } from "./contexts/NutrititonContext";
import "./App.css";

export default function App() {
  const { scannerOn, tableOn } = useNutritionContext();
  return (
    <main>
      <h1 style={{ textAlign: "center" }}>Nutrition Scanner MVP</h1>
      <section className="container">
        <div className="content">
          {tableOn && <NutritionTable />}
          {scannerOn && <BarcodeScanner />}
        </div>
      </section>
    </main>
  );
}
