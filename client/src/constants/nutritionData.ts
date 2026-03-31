export const fields = [
  "product_name",
  "brands",
  "code",
  "quantity",
  "serving_size",
  "nutriments",
  "ingredients_text",
  "allergens",
  "nutriscore_data",
  "image_url",
];

type ServingData = {
  calcium: string;
  calories: string;
  carbohydrate: string;
  cholesterol: string;
  fat: string;
  fiber: string;
  iron: string;
  is_default: string;
  measurement_description: string;
  metric_serving_amount: string;
  metric_serving_unit: string;
  monounsaturated_fat: string;
  number_of_units: string;
  polyunsaturated_fat: string;
  potassium: string;
  protein: string;
  saturated_fat: string;
  serving_description: string;
  serving_id: string;
  serving_url: string;
  sodium: string;
  sugar: string;
  trans_fat: string;
  vitamin_d: string;
};

type FoodData = {
  brand_name: string;
  food_id: string;
  food_name: string;
  food_type: string;
  food_url: string;
  servings: { serving: ServingData[] };
};

export type NutritionApi = {
  barcode: string;
  data: { food: FoodData };
  source: string;
};

type arrayItem = {
  title: string;
  data: string;
};

export type FoodObject = {
  name: string;
  data: arrayItem[];
};
