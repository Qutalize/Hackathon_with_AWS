SELECT
    genre,
    keyword_1,
    keyword_2,
    COALESCE(
        AVG(CASE WHEN stock_delta > 0 THEN stock_delta ELSE NULL END)
    , 0) AS avg_restock,
    COALESCE(
        ABS(AVG(CASE WHEN stock_delta < 0 THEN stock_delta ELSE NULL END))
    , 0) AS avg_leftover,
    COALESCE(
        AVG(CASE WHEN stock_delta > 0 THEN stock_delta ELSE NULL END)
    , 0)
    -
    COALESCE(
        ABS(AVG(CASE WHEN stock_delta < 0 THEN stock_delta ELSE NULL END))
    , 0)
    AS popularity_score
FROM "inventory_db"."training_data"
GROUP BY genre, keyword_1, keyword_2
ORDER BY popularity_score DESC
