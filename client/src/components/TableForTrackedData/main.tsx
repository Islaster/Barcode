import { useNutritionContext } from "../../contexts/NutrititonContext";
import { debug } from "../../utils/debug";
import "./styles.css";

export default function NutritionTable() {
  const { tableItems, setTableOn, setScannerOn } = useNutritionContext();

  debug.log(
    "table",
    `Rendering table with ${tableItems.length} items`,
    tableItems
  );

  return (
    <div className="nutrition-table-page">
      <div className="nutrition-table-card">
        <div className="nutrition-table-actions">
          <button
            className="add-item-btn"
            onClick={() => {
              debug.log("table", "Add Item clicked — switching to scanner");
              setTableOn(false);
              setScannerOn(true);
            }}
          >
            Add Item
          </button>
        </div>
        <table className="nutrition-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Calories</th>
              <th>Protein</th>
            </tr>
          </thead>
          <tbody>
            {tableItems.length > 0 ? (
              tableItems.map((item, index) => {
                const calories = item.data.find(
                  (i) => i.title === "calories"
                )?.data;
                const protein = item.data.find(
                  (i) => i.title === "protein"
                )?.data;

                debug.log("table", `Row ${index}:`, {
                  name: item.name,
                  calories,
                  protein,
                });

                if (!calories || !protein) {
                  debug.error("table", `Row ${index} missing data`, item);
                }

                return (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{calories ?? "N/A"}</td>
                    <td>{protein ?? "N/A"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: "center", color: "#9ca3af" }}
                >
                  No items yet — scan a barcode to add one
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
