import { useNutritionContext } from "../../contexts/NutrititonContext";
import { useState } from "react";
import "./styles.css";
import { debug } from "../../utils/debug";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function NutritionTable() {
  const isMobile = useIsMobile();
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const { tableItems, setTableItems, setTableOn, setScannerOn, setSearchOn } =
    useNutritionContext();

  const caloriesItems: number[] = [];
  const proteinItems: number[] = [];
  const fatsItems: number[] = [];
  const sodiumItems: number[] = [];

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

  function handleDelete(index: number) {
    setTableItems((prev) => prev.filter((_, i) => i !== index));
  }

  const handleAddItemClick = () => setShowAddItemModal(true);
  const closeModal = () => setShowAddItemModal(false);

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
              {!isMobile && <th></th>}
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
                if (!calories || !protein)
                  debug.error("table", `Row ${index} missing data`, item);

                return (
                  <tr key={index}>
                    <td>
                      {item.name}
                      {isMobile && (
                        <button
                          className="delete-item-btn"
                          onClick={() => handleDelete(index)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td>{calories ?? 0}</td>
                    <td>{protein ?? 0}g</td>
                    <td>{fats ?? 0}</td>
                    <td>{sodium ?? 0}mg</td>
                    {!isMobile && (
                      <td>
                        <button
                          className="delete-item-btn"
                          onClick={() => handleDelete(index)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
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
                  <strong>{caloriesItems.reduce((a, b) => a + b, 0)}</strong>
                </td>
                <td>
                  <strong>{proteinItems.reduce((a, b) => a + b, 0)}g</strong>
                </td>
                <td>
                  <strong>{fatsItems.reduce((a, b) => a + b, 0)}</strong>
                </td>
                <td>
                  <strong>{sodiumItems.reduce((a, b) => a + b, 0)}mg</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
