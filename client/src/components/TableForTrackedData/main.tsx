import { useNutritionContext } from "../../contexts/NutrititonContext";
import "./styles.css";

export default function NutritionTable() {
  const { tableItems, setTableOn, setScannerOn } = useNutritionContext();
  const caloriesItems: number[] = [];
  const proteinItems: number[] = [];
  tableItems.forEach((item) => {
    caloriesItems.push(
      parseInt(item.data.filter((i) => i.title === "calories")[0].data)
    );
    proteinItems.push(
      parseInt(item.data.filter((i) => i.title === "protein")[0].data)
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
            </tr>
          </thead>

          <tbody>
            {tableItems.length > 0 &&
              tableItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>
                    {item.data.filter((i) => i.title === "calories")[0].data}
                  </td>
                  <td>
                    {item.data.filter((i) => i.title === "protein")[0].data}g
                  </td>
                </tr>
              ))}
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
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
