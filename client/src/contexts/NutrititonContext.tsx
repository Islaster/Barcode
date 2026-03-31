import { createContext, useContext, useState, useMemo, useEffect } from "react";
import type { FoodObject, NutritionApi } from "../constants/nutritionData";
import { debug } from "../utils/debug";

type NutritionContextValue = {
  barcode: string;
  setBarcode: React.Dispatch<React.SetStateAction<string>>;
  productData: NutritionApi | undefined;
  setProductData: React.Dispatch<
    React.SetStateAction<NutritionApi | undefined>
  >;
  tableItems: FoodObject[];
  setTableItems: React.Dispatch<React.SetStateAction<FoodObject[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  scannerOn: boolean;
  setScannerOn: React.Dispatch<React.SetStateAction<boolean>>;
  tableOn: boolean;
  setTableOn: React.Dispatch<React.SetStateAction<boolean>>;
};

const NutritionContext = createContext<NutritionContextValue | null>(null);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [barcode, setBarcode] = useState("");
  const [productData, setProductData] = useState<NutritionApi | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [scannerOn, setScannerOn] = useState<boolean>(false);
  const [tableOn, setTableOn] = useState<boolean>(true);
  const today = new Date().toLocaleDateString();

  // Initialize tableItems from localStorage safely
  const [tableItems, setTableItems] = useState<FoodObject[]>(() => {
    try {
      const dailyLog = localStorage.getItem("dailyLog");
      debug.log("storage", `Initial localStorage read:`, dailyLog);

      if (!dailyLog) {
        debug.log("storage", "No dailyLog found — starting fresh");
        return [];
      }

      const parsed = JSON.parse(dailyLog);
      debug.log("storage", "Parsed dailyLog:", parsed);

      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.tableItems) {
        debug.log(
          "storage",
          "Restored tableItems from localStorage ✅",
          parsed[0].tableItems
        );
        return parsed[0].tableItems;
      }

      debug.warn("storage", "dailyLog exists but has unexpected shape", parsed);
      return [];
    } catch (err) {
      debug.error("storage", "Failed to parse dailyLog from localStorage", err);
      return [];
    }
  });

  // Process productData when it changes
  useEffect(() => {
    debug.log("context", "productData changed:", productData);

    if (!productData) {
      debug.log("context", "productData is undefined — skipping");
      return;
    }

    // Validate the entire data path
    const food = productData?.data?.food;
    if (!food) {
      debug.error("context", "Missing 'data.food' in productData", productData);
      return;
    }

    const servings = food.servings?.serving;
    if (!servings || !Array.isArray(servings) || servings.length === 0) {
      debug.error("context", "Missing or empty 'servings.serving' array", food);
      return;
    }
    const name = food.food_name;
    const protein = servings[0].protein;
    const calories = servings[0].calories;
    const fats = servings[0].fat;
    const sodium = servings[0].sodium;

    debug.log("context", "Extracted values:", { name, protein, calories });

    if (typeof name !== "string") {
      debug.error("context", `name is not a string: ${typeof name}`, name);
      return;
    }
    if (typeof protein !== "string") {
      debug.error(
        "context",
        `protein is not a string: ${typeof protein}`,
        protein
      );
      return;
    }
    if (typeof calories !== "string") {
      debug.error(
        "context",
        `calories is not a string: ${typeof calories}`,
        calories
      );
      return;
    }
    if (typeof fats !== "string") {
      debug.error("context", `calories is not a string: ${typeof fats}`, fats);
      return;
    }
    if (typeof sodium !== "string") {
      debug.error(
        "context",
        `calories is not a string: ${typeof sodium}`,
        sodium
      );
      return;
    }

    const newItem: FoodObject = {
      name,
      data: [
        { title: "protein", data: protein },
        { title: "calories", data: calories },
        { title: "fats", data: fats },
        { title: "sodium", data: sodium },
      ],
    };

    debug.log("context", "Adding new item to tableItems:", newItem);

    setTableItems((prev) => {
      const updated = [...prev, newItem];
      debug.log(
        "context",
        `tableItems updated: ${prev.length} → ${updated.length}`,
        updated
      );
      return updated;
    });
  }, [productData]);

  // Sync tableItems to localStorage
  useEffect(() => {
    debug.log(
      "storage",
      `tableItems changed (length: ${tableItems.length})`,
      tableItems
    );

    if (tableItems.length > 0) {
      const payload = [{ date: today, tableItems }];
      debug.log("storage", "Saving to localStorage:", payload);
      localStorage.setItem("dailyLog", JSON.stringify(payload));
    }
  }, [tableItems]);

  const value = useMemo(
    () => ({
      barcode,
      setBarcode,
      productData,
      setProductData,
      tableItems,
      setTableItems,
      loading,
      setLoading,
      tableOn,
      setTableOn,
      scannerOn,
      setScannerOn,
    }),
    [barcode, productData, tableOn, scannerOn, tableItems]
  );

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutritionContext() {
  const ctx = useContext(NutritionContext);
  if (!ctx) {
    throw new Error(
      "useNutritionContext must be used inside <NutritionProvider />"
    );
  }
  return ctx;
}
