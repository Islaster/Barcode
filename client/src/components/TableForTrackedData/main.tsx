import { useNutritionContext } from "../../contexts/NutrititonContext";
import { useState } from "react";
import "./styles.css";
import { debug } from "../../utils/debug";

export default function NutritionTable() {
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const { tableItems, setTableOn, setScannerOn, setSearchOn } =
    useNutritionContext();
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

  const handleAddItemClick = () => {
    setShowAddItemModal(true);
  };

  const handleSearchByBarcode = () => {
    debug.log("table", "Opening barcode scanner from Add Item modal");
    setShowAddItemModal(false);
    setTableOn(false);
    setScannerOn(true);
  };

  const handleSearchByName = () => {
    debug.log("table", "Opening name search from Add Item modal");
    setShowAddItemModal(false);
    setTableOn(false);
    setSearchOn(true);
  };

  const closeModal = () => {
    setShowAddItemModal(false);
  };

  return (
    <div className="nutrition-table-page">
      <div className="nutrition-table-card">
        <div className="nutrition-table-actions">
          <button className="add-item-btn" onClick={handleAddItemClick}>
            Add Item
          </button>
        </div>
        {showAddItemModal && (
          <div className="add-item-modal-overlay" onClick={closeModal}>
            <div
              className="add-item-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Select how you want to add an item</h3>
              <p>Choose to search by name or scan a barcode.</p>

              <div className="add-item-modal-actions">
                <button
                  className="add-item-option-btn"
                  onClick={handleSearchByName}
                >
                  Search by Name
                </button>

                <button
                  className="add-item-option-btn"
                  onClick={handleSearchByBarcode}
                >
                  Scan Barcode
                </button>
              </div>

              <button className="add-item-cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        )}
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
                    <td>{calories ?? 0}</td>
                    <td>{protein ?? 0}</td>
                    <td>{fats ?? 0}</td>
                    <td>{sodium ?? 0}</td>
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
