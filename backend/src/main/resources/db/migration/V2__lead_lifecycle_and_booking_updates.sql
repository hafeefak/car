ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS outcome_reason TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

UPDATE leads
SET status = 'NEGOTIATING'
WHERE status = 'NEGOTIATION';

UPDATE leads
SET status = 'CONTACTED'
WHERE status = 'TEST_DRIVE';

UPDATE leads
SET is_active = CASE
  WHEN status IN ('NEW', 'CONTACTED', 'NEGOTIATING') THEN TRUE
  ELSE FALSE
END
WHERE is_active IS DISTINCT FROM CASE
  WHEN status IN ('NEW', 'CONTACTED', 'NEGOTIATING') THEN TRUE
  ELSE FALSE
END;

UPDATE leads
SET closed_at = CURRENT_TIMESTAMP
WHERE status IN ('WON', 'LOST') AND closed_at IS NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS lead_id BIGINT,
  ADD COLUMN IF NOT EXISTS booking_price INT,
  ADD COLUMN IF NOT EXISTS final_price INT;

UPDATE bookings b
SET booking_price = v.price
FROM vehicles v
WHERE b.vehicle_id = v.id
  AND b.booking_price IS NULL;

ALTER TABLE bookings
  ADD CONSTRAINT fk_booking_lead
  FOREIGN KEY (lead_id) REFERENCES leads(id);

ALTER TABLE bookings
  ADD CONSTRAINT uk_booking_tenant_lead UNIQUE (tenant_id, lead_id);
