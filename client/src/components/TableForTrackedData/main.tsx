import { useNutritionContext } from "../../contexts/NutrititonContext";
import "./styles.css";
import { debug } from "../../utils/debug";

export default function NutritionTable() {
  const { tableItems, setTableOn, setScannerOn } = useNutritionContext();
  const caloriesItems: number[] = [];
  const proteinItems: number[] = [];
  const fatsItems: number[] = [];
  const sodiumItems: number[] = [];
  console.log(tableItems);
  tableItems.forEach((item) => {
    caloriesItems.push(
      parseInt(item.data.filter((i) => i.title === "calories")[0].data)
    );
    proteinItems.push(
      parseInt(item.data.filter((i) => i.title === "protein")[0].data)
    );
    if (item.data)
      fatsItems.push(
        parseInt(item.data.filter((i) => i.title === "fats")[0]?.data ?? 0)
      );
    sodiumItems.push(
      parseInt(item.data.filter((i) => i.title === "sodium")[0]?.data ?? 0)
    );
  });
  return (
    <div className="nutrition-table-page">
      <div className="nutrition-table-card">
        <div className="nutrition-table-actions">
          <button
            className="add-item-btn"
            onClick={() => {
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
              <th>Fats</th>
              <th>Sodium</th>
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
                const fats = item.data.find((i) => i.title === "fats")?.data;
                const sodium = item.data.find(
                  (i) => i.title === "sodium"
                )?.data;
                debug.log("table", `Row ${index}:`, {
                  name: item.name,
                  calories,
                  protein,
                  fats,
                  sodium,
                });

                if (!calories || !protein) {
                  debug.error("table", `Row ${index} missing data`, item);
                }

                return (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{calories ?? "N/A"}</td>
                    <td>{protein ?? "N/A"}</td>
                    <td>{fats ?? "N/A"}</td>
                    <td>{sodium ?? "N/A"}</td>
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
          {tableItems.length > 0 && (
            <tfoot>
              <tr>
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>
                    {caloriesItems.reduce(
                      (acc, currentValue) => acc + currentValue,
                      0
                    )}
                  </strong>
                </td>
                <td>
                  <strong>
                    {proteinItems.reduce(
                      (acc, currentValue) => acc + currentValue,
                      0
                    )}
                    g
                  </strong>
                </td>
                <td>
                  <strong>
                    {fatsItems.reduce(
                      (acc, currentValue) => acc + currentValue,
                      0
                    )}
                  </strong>
                </td>
                <td>
                  <strong>
                    {sodiumItems.reduce(
                      (acc, currentValue) => acc + currentValue,
                      0
                    )}
                  </strong>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
