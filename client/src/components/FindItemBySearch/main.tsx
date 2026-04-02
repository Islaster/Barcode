import { useState } from "react";
import { useNutritionContext } from "../../contexts/NutrititonContext";
import "./styles.css";
import type { SearchApi, SearchFoodData } from "../../constants/SearchData";
import { fetchProductBySearch } from "../../hooks/useSearch";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FoodSearch() {
  const {
    setLoading: setContextLoading,
    setSelectedFoodIndex,
    setProductData,
    setServingIndex,
    setSearchOn,
    setTableOn,
  } = useNutritionContext();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchFoodData[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resApi, setResApi] = useState<SearchApi | null>(null);

  /* ---------------------- search handler ---------------------- */

  async function handleSearch(e?: React.SubmitEvent) {
    e?.preventDefault();

    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    console.log(`[FOOD SEARCH UI] Search started: "${trimmed}"`);

    setLoading(true);
    setContextLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);

    let response: Response;

    try {
      response = await fetchProductBySearch(searchTerm);
    } catch (err) {
      console.error("[FOOD SEARCH UI] ❌ Network error:", err);
      setError("Could not reach the server. Please check your connection.");
      setLoading(false);
      setContextLoading(false);
      return;
    }
    let json: SearchApi;
    try {
      json = await response.json();
      setResApi(json);
      console.log(`[FOOD SEARCH UI] Response status: ${response.status}`);
      console.log("[FOOD SEARCH UI] JSON response:", json);
    } catch (err) {
      console.error(err);
      return;
    }

    if (!response.ok) {
      console.error(
        `[FOOD SEARCH UI] ❌ Search failed (${response.status}):`,
        json
      );
      setError(`Search failed (${response.status}). Please try again.`);
      setLoading(false);
      setContextLoading(false);
      return;
    }
    const data = json.data.foods_search.results.food;
    setResults(data);
    console.log("results fixed: ", results);
    setSearched(true);
    setLoading(false);
    console.log("loading: ", loading);
    setContextLoading(false);
  }

  /* ---------------------- selection handler ------------------- */

  function handleSelectResult(
    item: SearchFoodData,
    idx: number,
    servingIndex: number
  ) {
    const response = resApi as SearchApi;
    console.log(`[FOOD SEARCH UI] Result selected: "${item.food_name}"`);
    setSelectedFoodIndex(idx);
    setServingIndex(servingIndex);
    setProductData(response);
    setSearchOn(false);
    setTableOn(true);
  }

  /* ---------------------- render ----------------------------- */

  return (
    <div className="food-search">
      <h2 className="food-search__heading">Food Search</h2>

      {/* ---- search bar ---- */}
      <form className="food-search__form" onSubmit={handleSearch}>
        <input
          className="food-search__input"
          type="text"
          placeholder='Search for a food (e.g. "banana")'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
        />
        <button
          className="food-search__button"
          type="submit"
          disabled={loading || !searchTerm.trim()}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* ---- error ---- */}
      {error && <div className="food-search__error">{error}</div>}

      {/* ---- loading ---- */}
      {loading && <p className="food-search__loading">Searching…</p>}

      {/* ---- empty state ---- */}
      {!loading && searched && results.length === 0 && (
        <p className="food-search__empty">
          No results found. Try a different search term.
        </p>
      )}

      {/* ---- simple list (no images) ---- */}
      {!loading && results.length >= 1 && (
        <ul className="food-search__list">
          {results.map((item, idx) => (
            <li
              key={idx}
              className="food-search__list-item"
              onClick={() =>
                setExpandedIndex((prev) => (prev === idx ? null : idx))
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedIndex((prev) => (prev === idx ? null : idx));
                }
              }}
            >
              <strong>{item.food_name}</strong>
              {item.brand_name ? (
                <span className="food-search__list-item-description">
                  — {item.brand_name}
                </span>
              ) : (
                <span className="food-search__list-item-description">
                  — {item.food_type}
                </span>
              )}

              {expandedIndex === idx && (
                <div
                  className="food-search__list-item food-search__servings-expander"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    className="food-search__servings-select"
                    defaultValue=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const servingIndex = Number(e.target.value);
                      if (Number.isNaN(servingIndex)) return;
                      handleSelectResult(item, idx, servingIndex);
                    }}
                  >
                    <option value="" disabled>
                      Select a serving
                    </option>

                    {item.servings.serving.map((serving, servingIdx) => (
                      <option
                        key={`${idx}-${serving.serving_id}-${servingIdx}`}
                        value={servingIdx}
                      >
                        {serving.serving_description ||
                          `${serving.metric_serving_amount} ${serving.metric_serving_unit}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
