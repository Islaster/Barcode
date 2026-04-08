import { useState } from "react";
import { useNutritionContext } from "../../contexts/NutrititonContext";
import "./styles.css";
import type { SearchApi, SearchFoodData } from "../../constants/SearchData";
import { fetchProductBySearch } from "../../hooks/useSearch";

interface SearchState {
  term: string;
  results: SearchFoodData[];
  searched: boolean;
  loading: boolean;
  error: string | null;
  resApi: SearchApi | null;
}

interface ExpandedState {
  idx: number;
  servingIdx: number | null;
  customInput: string;
  showCustom: boolean;
}

const COMMON_AMOUNTS = [0.5, 1, 1.5, 2, 3];

const initialSearchState: SearchState = {
  term: "",
  results: [],
  searched: false,
  loading: false,
  error: null,
  resApi: null,
};

export default function FoodSearch() {
  const {
    setLoading: setContextLoading,
    setSelectedFood,
    setSearchOn,
    setTableOn,
  } = useNutritionContext();
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [search, setSearch] = useState<SearchState>(initialSearchState);

  const setSearchField = (fields: Partial<SearchState>) =>
    setSearch((prev) => ({ ...prev, ...fields }));

  function toggleItem(idx: number) {
    setExpanded((prev) =>
      prev?.idx === idx
        ? null
        : { idx, servingIdx: null, customInput: "", showCustom: false }
    );
  }

  function toggleServing(servingIdx: number) {
    setExpanded((prev) =>
      prev
        ? prev.servingIdx === servingIdx
          ? { ...prev, servingIdx: null, showCustom: false }
          : { ...prev, servingIdx, showCustom: false }
        : prev
    );
  }

  function toggleCustom() {
    setExpanded((prev) =>
      prev ? { ...prev, showCustom: !prev.showCustom, customInput: "" } : prev
    );
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = search.term.trim();
    if (!trimmed) return;

    setSearchField({
      loading: true,
      error: null,
      results: [],
      searched: false,
    });
    setExpanded(null);
    setContextLoading(true);

    let response: Response;
    try {
      response = await fetchProductBySearch(trimmed);
    } catch (err) {
      console.error("[FOOD SEARCH UI] ❌ Network error:", err);
      setSearchField({
        error: "Could not reach the server. Please check your connection.",
        loading: false,
      });
      setContextLoading(false);
      return;
    }

    let json: SearchApi;
    try {
      json = await response.json();
    } catch (err) {
      console.error(err);
      return;
    }

    if (!response.ok) {
      setSearchField({
        error: `Search failed (${response.status}). Please try again.`,
        loading: false,
      });
      setContextLoading(false);
      return;
    }

    setSearchField({
      results: json.data.foods_search.results.food,
      resApi: json,
      searched: true,
      loading: false,
    });
    setContextLoading(false);
  }

  function handleSelectAmount(idx: number, servingIdx: number, amount: number) {
    setSelectedFood({
      foodIndex: idx,
      servingIndex: servingIdx,
      amount,
      data: search.resApi as SearchApi,
    });
    setSearchOn(false);
    setTableOn(true);
  }

  function handleCustomSubmit(idx: number, servingIdx: number) {
    const amount = parseFloat(expanded?.customInput ?? "");
    if (isNaN(amount) || amount <= 0) return;
    handleSelectAmount(idx, servingIdx, amount);
  }

  return (
    <div className="food-search">
      <h2 className="food-search__heading">Food Search</h2>

      <form className="food-search__form" onSubmit={handleSearch}>
        <input
          className="food-search__input"
          type="text"
          placeholder='Search for a food (e.g. "banana")'
          value={search.term}
          onChange={(e) => setSearchField({ term: e.target.value })}
          disabled={search.loading}
        />
        <button
          className="food-search__button"
          type="submit"
          disabled={search.loading || !search.term.trim()}
        >
          {search.loading ? "Searching…" : "Search"}
        </button>
      </form>

      {search.error && <div className="food-search__error">{search.error}</div>}
      {search.loading && <p className="food-search__loading">Searching…</p>}

      {!search.loading && search.searched && search.results.length === 0 && (
        <p className="food-search__empty">
          No results found. Try a different search term.
        </p>
      )}

      {!search.loading && search.results.length >= 1 && (
        <ul className="food-search__list">
          {search.results.map((item, idx) => (
            <li
              key={idx}
              className={`food-search__list-item${
                expanded?.idx === idx ? " food-search__list-item--expanded" : ""
              }`}
              onClick={() => toggleItem(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleItem(idx);
                }
              }}
            >
              <div className="food-search__list-item-header">
                <span>
                  <strong>{item.food_name}</strong>
                  <span className="food-search__list-item-description">
                    — {item.brand_name || item.food_type}
                  </span>
                </span>
                <span className="food-search__chevron" aria-hidden="true">
                  {expanded?.idx === idx ? "▲" : "▼"}
                </span>
              </div>

              {expanded?.idx === idx && (
                <div
                  className="food-search__expander"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* serving size pills */}
                  <ul className="food-search__servings-list">
                    <li className="food-search__servings-label">
                      Serving size
                    </li>
                    {item.servings.serving.map((serving, servingIdx) => (
                      <li key={`${idx}-${serving.serving_id}-${servingIdx}`}>
                        <button
                          className={`food-search__serving-option${
                            expanded.servingIdx === servingIdx
                              ? " food-search__serving-option--active"
                              : ""
                          }`}
                          onClick={() => toggleServing(servingIdx)}
                        >
                          {serving.serving_description ||
                            `${serving.metric_serving_amount} ${serving.metric_serving_unit}`}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* amount row — only shown when a serving is selected */}
                  {expanded.servingIdx !== null && (
                    <div className="food-search__amounts">
                      <span className="food-search__servings-label">
                        Amount
                      </span>
                      <div className="food-search__amounts-row">
                        {COMMON_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            className="food-search__amount-pill"
                            onClick={() =>
                              handleSelectAmount(
                                idx,
                                expanded.servingIdx!,
                                amount
                              )
                            }
                          >
                            {amount % 1 === 0 ? amount : amount.toString()}
                          </button>
                        ))}

                        {/* custom pill + tooltip */}
                        <div className="food-search__custom-wrapper">
                          <button
                            className={`food-search__amount-pill food-search__amount-pill--custom${
                              expanded.showCustom
                                ? " food-search__amount-pill--active"
                                : ""
                            }`}
                            onClick={toggleCustom}
                          >
                            Custom
                          </button>
                          {expanded.showCustom && (
                            <div className="food-search__custom-tooltip">
                              <input
                                className="food-search__custom-input"
                                type="number"
                                min="0.1"
                                step="0.1"
                                placeholder="e.g. 2.5"
                                value={expanded.customInput}
                                onChange={(e) =>
                                  setExpanded((prev) =>
                                    prev
                                      ? { ...prev, customInput: e.target.value }
                                      : prev
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleCustomSubmit(
                                      idx,
                                      expanded.servingIdx!
                                    );
                                }}
                                autoFocus
                              />
                              <button
                                className="food-search__custom-confirm"
                                onClick={() =>
                                  handleCustomSubmit(idx, expanded.servingIdx!)
                                }
                                disabled={
                                  !expanded.customInput ||
                                  isNaN(parseFloat(expanded.customInput))
                                }
                              >
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
