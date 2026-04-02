import BarcodeScanner from "./components/barcodeScanner/main";
import NutritionTable from "./components/TableForTrackedData/main";
import { useNutritionContext } from "./contexts/NutrititonContext";
import "./App.css";
import FoodSearch from "./components/FindItemBySearch/main";

export default function App() {
  const { scannerOn, tableOn, searchOn } = useNutritionContext();
  return (
    <main>
      <h1 style={{ textAlign: "center" }}>Nutrition Scanner MVP</h1>
      <section className="container">
        <div className="content">
          {tableOn && <NutritionTable />}
          {scannerOn && <BarcodeScanner />}
          {searchOn && <FoodSearch />}
        </div>
      </section>
    </main>
  );
}
