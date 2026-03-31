import { createContext, useContext, useState, useMemo, useEffect } from "react";
import type { FoodObject, NutritionApi } from "../constants/nutritionData";

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
  const today = new Date().toLocaleDateString();
  const [tableItems, setTableItems] = useState<FoodObject[]>(() => {
    try {
      const dailyLog = localStorage.getItem("dailyLog");
      if (!dailyLog) return [];
      const parsed = JSON.parse(dailyLog);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tableItems) {
        return parsed[0].tableItems;
      }
      return [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [scannerOn, setScannerOn] = useState<boolean>(false);
  const [tableOn, setTableOn] = useState<boolean>(true);

  useEffect(() => {
    const dailyLog = localStorage.getItem("dailyLog");
    if (
      typeof dailyLog === "string" &&
      JSON.parse(dailyLog)[0].date !== today
    ) {
      localStorage.removeItem("dailyLog");
    }
  }, []);

  useEffect(() => {
    const name = productData?.data.food.food_name;
    const protein = productData?.data.food.servings.serving[0].protein;
    const calories = productData?.data.food.servings.serving[0].calories;
    if (typeof name !== "string") {
      console.log("name isnt a string check productData.");
      return;
    }
    if (typeof protein !== "string") {
      console.log("protein isnt a string check productData.");
      return;
    }
    if (typeof calories !== "string") {
      console.log("calories isnt a string check productData.");
      return;
    }
    setTableItems((prev) => [
      ...prev,
      {
        name: name,
        data: [
          { title: "protein", data: protein },
          { title: "calories", data: calories },
        ],
      },
    ]);
    console.log(productData);
  }, [productData]);

  useEffect(() => {
    if (tableItems.length > 0)
      localStorage.setItem(
        "dailyLog",
        JSON.stringify([{ date: today, tableItems }])
      );
  }, [tableItems]);
  console.log("product data: ", productData);
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
    throw new Error("usePlanContext must be used inside <PlanProvider />");
  }
  return ctx;
}
