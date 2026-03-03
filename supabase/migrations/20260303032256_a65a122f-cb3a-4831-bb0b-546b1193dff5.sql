DELETE FROM donor_activity_log
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY donor_id, activity_data->>'order_id'
        ORDER BY created_at ASC
      ) as rn
    FROM donor_activity_log
    WHERE activity_type = 'donation'
      AND activity_data->>'order_id' IS NOT NULL
  ) ranked
  WHERE rn > 1
);