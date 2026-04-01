import type { ServingData } from "./nutritionData";

export type SearchFoodData = {
  food_id: string;
  food_name: string;
  food_type: string;
  brand_name?: string;
  food_url: string;
  servings: { serving: ServingData[] };
};

type FoodSearch = {
  max_result: string;
  page_number: string;
  results: {
    food: SearchFoodData[];
  };
  total_results: string;
};

export type SearchApi = {
  data: {
    foods_search: FoodSearch;
  };
  name: string;
  source: string;
};
