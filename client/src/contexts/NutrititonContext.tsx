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

type NutritionContextValue = {
  barcode: string;
  setBarcode: React.Dispatch<React.SetStateAction<string>>;
  productData: NutritionApi | undefined | SearchApi;
  setProductData: React.Dispatch<
    React.SetStateAction<NutritionApi | undefined | SearchApi>
  >;
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
  setServingIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedFoodIndex: React.Dispatch<React.SetStateAction<number>>;
};

const NutritionContext = createContext<NutritionContextValue | null>(null);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [barcode, setBarcode] = useState("");
  const [productData, setProductData] = useState<
    NutritionApi | SearchApi | undefined
  >(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [servingIndex, setServingIndex] = useState<number>(0);
  const [scannerOn, setScannerOn] = useState<boolean>(false);
  const [searchOn, setSearchOn] = useState<boolean>(false);
  const [tableOn, setTableOn] = useState<boolean>(true);
  const [selectedFoodIndex, setSelectedFoodIndex] = useState<number>(0);
  const [pageStatus, setPageStatus] = useState<PageStatusValue>({
    current: "home",
    back: "",
  });
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
    let food: BarcodeFoodData | SearchFoodData[];
    if ("foods_search" in productData.data) {
      food = productData.data.foods_search.results.food;
    } else if ("food" in productData.data) {
      food = productData.data.food;
    } else {
      console.error(
        "data isnt compatible check.\nHere is what's been returned: ",
        productData
      );
      return;
    }

    const servings = Array.isArray(food)
      ? food[selectedFoodIndex].servings?.serving
      : food.servings.serving;
    if (!servings || !Array.isArray(servings) || servings.length === 0) {
      debug.error("context", "Missing or empty 'servings.serving' array", food);
      return;
    }
    const name = Array.isArray(food)
      ? food[selectedFoodIndex].food_name
      : food.food_name;
    const protein = servings[servingIndex].protein;
    const calories = servings[servingIndex].calories;
    const fats = servings[servingIndex].fat;
    const sodium = servings[servingIndex].sodium;

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
  }, [productData, servingIndex, selectedFoodIndex]);

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
      pageStatus,
      setPageStatus,
      searchOn,
      setSearchOn,
      setServingIndex,
      setSelectedFoodIndex,
    }),
    [barcode, productData, tableOn, scannerOn, tableItems, pageStatus]
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
