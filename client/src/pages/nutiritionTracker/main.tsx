import BarcodeScanner from "../../components/barcodeScanner/main";
import NutritionTable from "../../components/TableForTrackedData/main";
import { useNutritionContext } from "../../contexts/NutrititonContext";
import "./styles.css";
import FoodSearch from "../../components/FindItemBySearch/main";

export default function TrackerPage() {
  const { scannerOn, tableOn, searchOn } = useNutritionContext();
  return (
    <main>
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
