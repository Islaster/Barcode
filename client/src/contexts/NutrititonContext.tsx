import { createContext, useContext, useState, useMemo, useEffect } from "react";
import type {
  BarcodeFoodData,
  FoodObject,
  NutritionApi,
} from "../constants/nutritionData";
import { debug } from "../utils/debug";
import type { SearchApi, SearchFoodData } from "../constants/SearchData";

type PageStatusValue = {
  current: string;
  back: string;
};

export type SelectedFood = {
  foodIndex: number;
  servingIndex: number;
  amount: number;
  data: NutritionApi | SearchApi;
};

type NutritionContextValue = {
  barcode: string;
  setBarcode: React.Dispatch<React.SetStateAction<string>>;
  selectedFood: SelectedFood | null;
  setSelectedFood: React.Dispatch<React.SetStateAction<SelectedFood | null>>;
  tableItems: FoodObject[];
  setTableItems: React.Dispatch<React.SetStateAction<FoodObject[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  scannerOn: boolean;
  setScannerOn: React.Dispatch<React.SetStateAction<boolean>>;
  tableOn: boolean;
  setTableOn: React.Dispatch<React.SetStateAction<boolean>>;
  pageStatus: PageStatusValue;
  setPageStatus: React.Dispatch<React.SetStateAction<PageStatusValue>>;
  searchOn: boolean;
  setSearchOn: React.Dispatch<React.SetStateAction<boolean>>;
};

const NutritionContext = createContext<NutritionContextValue | null>(null);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [barcode, setBarcode] = useState("");
  const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scannerOn, setScannerOn] = useState<boolean>(false);
  const [searchOn, setSearchOn] = useState<boolean>(false);
  const [tableOn, setTableOn] = useState<boolean>(true);
  const [pageStatus, setPageStatus] = useState<PageStatusValue>({
    current: "home",
    back: "",
  });
  const today = new Date().toLocaleDateString();

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
      if (parsed[0].date !== today) {
        localStorage.removeItem("dailyLog");
        return [];
      }

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

  useEffect(() => {
    debug.log("context", "selectedFood changed:", selectedFood);

    if (!selectedFood) {
      debug.log("context", "selectedFood is null — skipping");
      return;
    }

    const { foodIndex, servingIndex, amount, data } = selectedFood;

    let food: BarcodeFoodData | SearchFoodData[];
    if ("foods_search" in data.data) {
      food = data.data.foods_search.results.food;
    } else if ("food" in data.data) {
      food = data.data.food;
    } else {
      console.error(
        "data isn't compatible. Here is what's been returned:",
        data
      );
      return;
    }

    const servings = Array.isArray(food)
      ? food[foodIndex].servings?.serving
      : food.servings.serving;

    if (!servings || !Array.isArray(servings) || servings.length === 0) {
      debug.error("context", "Missing or empty 'servings.serving' array", food);
      return;
    }

    const name = Array.isArray(food)
      ? food[foodIndex].food_name
      : food.food_name;
    const serving = servings[servingIndex];

    const multiply = (val: string) => (parseFloat(val) * amount).toFixed(1);

    const protein = serving.protein;
    const calories = serving.calories;
    const fats = serving.fat;
    const sodium = serving.sodium;

    if (
      typeof name !== "string" ||
      typeof protein !== "string" ||
      typeof calories !== "string" ||
      typeof fats !== "string" ||
      typeof sodium !== "string"
    ) {
      debug.error("context", "One or more nutrition values are not strings", {
        name,
        protein,
        calories,
        fats,
        sodium,
      });
      return;
    }

    const newItem: FoodObject = {
      name: amount !== 1 ? `${name} ×${amount}` : name,
      data: [
        { title: "protein", data: multiply(protein) },
        { title: "calories", data: multiply(calories) },
        { title: "fats", data: multiply(fats) },
        { title: "sodium", data: multiply(sodium) },
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
  }, [selectedFood]);

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
    } else {
      debug.log("storage", "tableItems empty — clearing localStorage");
      localStorage.removeItem("dailyLog");
    }
  }, [tableItems]);

  const value = useMemo(
    () => ({
      barcode,
      setBarcode,
      selectedFood,
      setSelectedFood,
      tableItems,
      setTableItems,
      loading,
      setLoading,
      tableOn,
      setTableOn,
      scannerOn,
      setScannerOn,
      pageStatus,
      setPageStatus,
      searchOn,
      setSearchOn,
    }),
    [barcode, selectedFood, tableOn, scannerOn, tableItems, pageStatus]
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
