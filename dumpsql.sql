--- 4.1. Views
--- View 1: v_active_listings
--- Every listing with status Active, joined with its crop and farmer details (name, farm, rating, verified), for the marketplace browse page.

CREATE OR REPLACE VIEW v_active_listings AS
SELECT
    l.id                AS listing_id,
    c.name              AS crop_name,
    c.crop_type,
    l.price_per_unit,
    l.unit,
    l.quantity_available,
    l.location_text,
    l.latitude,
    l.longitude,
    l.quality_rating,
    l.organic,
    l.harvest_date,
    l.image_url,
    l.created_at,
    p.id                AS farmer_id,
    p.name              AS farmer_name,
    p.farm_name,
    p.rating            AS farmer_rating,
    p.verified          AS farmer_verified
FROM listings l
JOIN crops    c ON c.id = l.crop_id
JOIN profiles p ON p.id = l.farmer_id
WHERE l.status::text = 'Active';

--- View 2: v_listing_bid_summary

--- For each listing, the asking price and the bid counts (total, pending, accepted, declined), plus the highest and average bid.


CREATE OR REPLACE VIEW v_listing_bid_summary AS
SELECT
    l.id                                                   AS listing_id,
    c.name                                                 AS crop_name,
    l.farmer_id,
    l.price_per_unit                                       AS asking_price,
    COUNT(b.id)                                            AS total_bids,
    COUNT(b.id) FILTER (WHERE b.status::text = 'pending')  AS pending_bids,
    COUNT(b.id) FILTER (WHERE b.status::text = 'accepted') AS accepted_bids,
    COUNT(b.id) FILTER (WHERE b.status::text = 'declined') AS declined_bids,
    MAX(b.amount_per_unit)                                 AS highest_bid,
    ROUND(AVG(b.amount_per_unit), 2)                       AS average_bid
FROM listings l
JOIN crops c        ON c.id = l.crop_id
LEFT JOIN bids b    ON b.listing_id = l.id
GROUP BY l.id, c.name, l.farmer_id, l.price_per_unit;
 

--- View 3:  v_farmer_sales_summary

--- One row per farmer with active and sold listings, pending bids, completed sales and total revenue from delivered orders.

CREATE OR REPLACE VIEW v_farmer_sales_summary AS
SELECT
    p.id            AS farmer_id,
    p.name          AS farmer_name,
    p.farm_name,
    p.verified,
    (SELECT COUNT(*) FROM listings l
       WHERE l.farmer_id = p.id AND l.status::text = 'Active')  AS active_listings,
    (SELECT COUNT(*) FROM listings l
       WHERE l.farmer_id = p.id AND l.status::text = 'Sold')    AS sold_listings,
    (SELECT COUNT(*) FROM bids b
       JOIN listings l ON l.id = b.listing_id
      WHERE l.farmer_id = p.id AND b.status::text = 'pending')  AS pending_bids,
    (SELECT COUNT(*) FROM orders o
       JOIN listings l ON l.id = o.listing_id
      WHERE l.farmer_id = p.id AND o.stage::text = 'delivered') AS completed_sales,
    (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o
       JOIN listings l ON l.id = o.listing_id
      WHERE l.farmer_id = p.id AND o.stage::text = 'delivered') AS total_revenue
FROM profiles p
WHERE p.role::text = 'farmer'; 


--- View 4: v_buyer_bid_history

--- Every bid joined with buyer, crop, farmer, asking vs bid price, bid total, bid status and the resulting order stage.

CREATE OR REPLACE VIEW v_buyer_bid_history AS
SELECT
    b.id                        AS bid_id,
    b.buyer_id,
    bp.name                     AS buyer_name,
    b.listing_id,
    c.name                      AS crop_name,
    fp.name                     AS farmer_name,
    fp.farm_name,
    l.price_per_unit            AS asking_price,
    b.amount_per_unit           AS bid_price,
    b.quantity,
    l.unit,
    ROUND(b.amount_per_unit * b.quantity, 2) AS bid_total,
    b.status::text              AS bid_status,
    o.id                        AS order_id,
    o.stage::text               AS order_stage,
    b.placed_at
FROM bids b
JOIN profiles bp  ON bp.id = b.buyer_id
JOIN listings l   ON l.id  = b.listing_id
JOIN crops c      ON c.id  = l.crop_id
JOIN profiles fp  ON fp.id = l.farmer_id
LEFT JOIN orders o ON o.bid_id = b.id;

--- View 5: v_order_details

--- A full order record combining the crop, farmer pickup, buyer drop-off address and phone, and courier details with the pickup and delivery timestamps.

CREATE OR REPLACE VIEW v_order_details AS
SELECT
    o.id                    AS order_id,
    o.stage::text           AS stage,
    c.name                  AS crop_name,
    o.quantity,
    l.unit,
    o.agreed_price_per_unit,
    COALESCE(o.total_price, o.quantity * o.agreed_price_per_unit) AS total_price,
    o.placed_at,
    -- pickup (farm)
    fp.id                   AS farmer_id,
    fp.name                 AS farmer_name,
    fp.farm_name,
    fp.phone                AS farmer_phone,
    l.location_text         AS pickup_location,
    -- drop-off (buyer)
    bp.id                   AS buyer_id,
    bp.name                 AS buyer_name,
    o.delivery_address,
    o.delivery_phone,
    o.delivery_notes,
    -- courier
    cp.id                   AS courier_id,
    cp.name                 AS courier_name,
    cp.phone                AS courier_phone,
    o.claimed_at,
    o.picked_up_at,
    o.delivered_at
FROM orders o
JOIN listings l          ON l.id  = o.listing_id
JOIN crops c             ON c.id  = l.crop_id
JOIN profiles fp         ON fp.id = l.farmer_id
JOIN profiles bp         ON bp.id = o.buyer_id
LEFT JOIN profiles cp    ON cp.id = o.delivery_person_id;

OUTPUT:


 
--- View 6: v_delivery_job_board

--- Accepted orders that have an address but no courier yet, with pickup and drop coordinates, i.e. the jobs couriers can claim.

CREATE OR REPLACE VIEW v_delivery_job_board AS
SELECT
    o.id                AS order_id,
    c.name              AS crop_name,
    o.quantity,
    l.unit,
    COALESCE(o.total_price, o.quantity * o.agreed_price_per_unit) AS total_price,
    fp.farm_name,
    l.location_text     AS pickup_location,
    l.latitude          AS pickup_lat,
    l.longitude         AS pickup_lng,
    o.delivery_address  AS drop_address,
    o.delivery_lat      AS drop_lat,
    o.delivery_lng      AS drop_lng,
    o.placed_at
FROM orders o
JOIN listings l   ON l.id  = o.listing_id
JOIN crops c      ON c.id  = l.crop_id
JOIN profiles fp  ON fp.id = l.farmer_id
WHERE o.stage::text = 'bid_accepted'
  AND o.delivery_person_id IS NULL
  AND o.delivery_address IS NOT NULL;
 
OUTPUT:


--- View 7: v_latest_courier_location

--- The most recent transport-log GPS point for each order, joined with buyer, courier and order stage, for live tracking.

CREATE OR REPLACE VIEW v_latest_courier_location AS
SELECT DISTINCT ON (t.order_id)
 t.order_id,
 o.buyer_id,
 o.delivery_person_id AS courier_id,
 o.stage::text        AS order_stage,
 t.latitude,
 t.longitude,
 t.last_location,
 t.logged_at
FROM transport_logs t
JOIN orders o ON o.id = t.order_id
ORDER BY t.order_id, t.logged_at DESC;


--- 4.2. Triggers

--- Trigger 1: listings_validate
Before a listing is saved, it blocks a price over Rs 10,000, a quantity over 1,00,000, a future harvest date, a rating outside 1–5, and invalid coordinates.

CREATE OR REPLACE FUNCTION trg_listings_validate() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.price_per_unit IS DISTINCT FROM OLD.price_per_unit THEN
        IF NEW.price_per_unit > 10000 THEN
            RAISE EXCEPTION 'Price of Rs % per unit looks too high. The maximum allowed is Rs 10,000 per unit.', NEW.price_per_unit;
        END IF;
    END IF;
    IF TG_OP = 'INSERT' OR NEW.quantity_available IS DISTINCT FROM OLD.quantity_available THEN
        IF NEW.quantity_available > 100000 THEN
            RAISE EXCEPTION 'Quantity % is too large for one listing (maximum 1,00,000).', NEW.quantity_available;
        END IF;
    END IF;
    IF TG_OP = 'INSERT' OR NEW.harvest_date IS DISTINCT FROM OLD.harvest_date THEN
        IF NEW.harvest_date IS NOT NULL AND NEW.harvest_date > current_date THEN
            RAISE EXCEPTION 'Harvest date % is in the future. Enter the day the crop was (or will be) ready today or earlier.', NEW.harvest_date;
        END IF;
    END IF;
    IF TG_OP = 'INSERT' OR NEW.quality_rating IS DISTINCT FROM OLD.quality_rating THEN
        IF NEW.quality_rating IS NOT NULL AND NEW.quality_rating NOT BETWEEN 1 AND 5 THEN
            RAISE EXCEPTION 'Quality rating must be between 1 and 5 (you entered %).', NEW.quality_rating;
        END IF;
    END IF;
    IF (NEW.latitude  IS NOT NULL AND NEW.latitude  NOT BETWEEN -90  AND 90)
    OR (NEW.longitude IS NOT NULL AND NEW.longitude NOT BETWEEN -180 AND 180) THEN
        RAISE EXCEPTION 'Latitude / longitude are outside the valid range.';
    END IF;
    RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS listings_validate ON listings;
CREATE TRIGGER listings_validate
    BEFORE INSERT OR UPDATE OF price_per_unit, quantity_available, harvest_date, quality_rating, latitude, longitude ON listings
FOR EACH ROW EXECUTE FUNCTION trg_listings_validate();


--- Trigger 2: bids_price_floor

--- Rejects any bid below 50% of the farmer’s asking price.

CREATE OR REPLACE FUNCTION trg_bids_price_floor() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_ask   numeric;
    v_floor numeric;
BEGIN
    SELECT l.price_per_unit INTO v_ask FROM listings l WHERE l.id = NEW.listing_id;
    IF v_ask IS NULL THEN
        RETURN NEW;
    END IF;
    v_floor := round(v_ask * 0.5, 2);
    IF NEW.amount_per_unit < v_floor THEN
        RAISE EXCEPTION 'Your offer of Rs % per unit is too low. The farmer asks Rs %, and offers below Rs % (50%% of the asking price) are not accepted.',
                        NEW.amount_per_unit, v_ask, v_floor;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bids_price_floor ON bids;
CREATE TRIGGER bids_price_floor
    BEFORE INSERT ON bids
FOR EACH ROW EXECUTE FUNCTION trg_bids_price_floor();

--- Trigger 3: notify_new_bid

--- After a bid is placed, it sends the listing’s farmer a “New bid…” notification.

CREATE OR REPLACE FUNCTION trg_notify_new_bid() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_farmer uuid;
    v_crop   text;
    v_unit   text;
    v_buyer  text;
BEGIN
    SELECT l.farmer_id, c.name, l.unit INTO v_farmer, v_crop, v_unit
    FROM   listings l JOIN crops c ON c.id = l.crop_id
    WHERE  l.id = NEW.listing_id;
    SELECT p.name INTO v_buyer FROM profiles p WHERE p.id = NEW.buyer_id;
    IF v_farmer IS NOT NULL THEN
        INSERT INTO notifications (user_id, kind, message, link)
        VALUES (v_farmer, 'new_bid',
                format('New bid: %s offered Rs %s per %s for %s %s of %s.',
                       COALESCE(v_buyer, 'A buyer'), NEW.amount_per_unit, COALESCE(v_unit, 'unit'),
                       NEW.quantity, COALESCE(v_unit, 'units'), COALESCE(v_crop, 'your crop')),
                '/dashboard');
    END IF;
    RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS notify_new_bid ON bids;
CREATE TRIGGER notify_new_bid
    AFTER INSERT ON bids
FOR EACH ROW EXECUTE FUNCTION trg_notify_new_bid();

OUTPUT:


--- Trigger 4: notify_bid_answered

--- When a farmer accepts or declines a bid, it notifies the buyer.

CREATE OR REPLACE FUNCTION trg_notify_bid_answered() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_crop text;
    v_unit text;
BEGIN
    SELECT c.name, l.unit INTO v_crop, v_unit
    FROM   listings l JOIN crops c ON c.id = l.crop_id
    WHERE  l.id = NEW.listing_id;

    INSERT INTO notifications (user_id, kind, message, link)
    VALUES (NEW.buyer_id,
            CASE WHEN NEW.status::text = 'accepted' THEN 'bid_accepted' ELSE 'bid_declined' END,
            format('Your bid of Rs %s per %s for %s %s of %s was %s.',
                   NEW.amount_per_unit, COALESCE(v_unit, 'unit'), NEW.quantity, COALESCE(v_unit, 'units'),
                   COALESCE(v_crop, 'a crop'), NEW.status::text),
            '/dashboard');
    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS notify_bid_answered ON bids;
CREATE TRIGGER notify_bid_answered
    AFTER UPDATE OF status ON bids
    FOR EACH ROW
    WHEN (NEW.status::text IN ('accepted', 'declined') AND OLD.status::text IS DISTINCT FROM NEW.status::text)
EXECUTE FUNCTION trg_notify_bid_answered();

OUTPUT:


--- Trigger 5: bids_accept_expiry

--- Stops a farmer from accepting a bid that is more than 7 days old.

CREATE OR REPLACE FUNCTION trg_bids_accept_expiry() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.placed_at < now() - INTERVAL '7 days' THEN
        RAISE EXCEPTION 'This bid is % days old and has expired (bids can only be accepted within 7 days). Ask the buyer to place a new bid.',
                        floor(extract(epoch FROM (now() - NEW.placed_at)) / 86400);
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bids_accept_expiry ON bids;
CREATE TRIGGER bids_accept_expiry
    BEFORE UPDATE OF status ON bids
    FOR EACH ROW
    WHEN (NEW.status::text = 'accepted' AND OLD.status::text IS DISTINCT FROM 'accepted')
EXECUTE FUNCTION trg_bids_accept_expiry();

                  

--- Trigger 6: orders_address_validate

--- Checks the delivery address (≥10 characters), the phone (10-digit Indian mobile) and the map pin (inside India) before saving.

CREATE OR REPLACE FUNCTION trg_orders_address_validate() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_phone text;
BEGIN
    IF NEW.delivery_address IS NOT NULL AND char_length(trim(NEW.delivery_address)) < 10 THEN
        RAISE EXCEPTION 'The delivery address is too short. Please include house / street, area and city (at least 10 characters).';
    END IF;

    IF NEW.delivery_phone IS NOT NULL THEN
        v_phone := regexp_replace(NEW.delivery_phone, '[\s-]', '', 'g');
        v_phone := regexp_replace(v_phone, '^(\+91|91|0)(?=[0-9]{10}$)', '');
        IF v_phone !~ '^[6-9][0-9]{9}$' THEN
            RAISE EXCEPTION 'The delivery phone must be a valid 10-digit Indian mobile number (you entered "%").', NEW.delivery_phone;
        END IF;
        NEW.delivery_phone := v_phone;
    END IF;

    IF (NEW.delivery_lat IS NOT NULL AND NEW.delivery_lat NOT BETWEEN 6 AND 38)
    OR (NEW.delivery_lng IS NOT NULL AND NEW.delivery_lng NOT BETWEEN 68 AND 98) THEN
        RAISE EXCEPTION 'The map pin is outside India. We only deliver within India - please choose your area again.';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_address_validate ON orders;
CREATE TRIGGER orders_address_validate
    BEFORE UPDATE OF delivery_address, delivery_phone, delivery_lat, delivery_lng ON orders
FOR EACH ROW EXECUTE FUNCTION trg_orders_address_validate();



--- Trigger 7: orders_courier_limit

--- Stops a delivery partner from claiming a 4th delivery while they already have 3 undelivered ones.

CREATE OR REPLACE FUNCTION trg_orders_courier_limit() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_active integer;
BEGIN
    SELECT count(*) INTO v_active
    FROM   orders o
    WHERE  o.delivery_person_id = NEW.delivery_person_id
      AND  o.id <> NEW.id
      AND  o.stage::text <> 'delivered';
    IF v_active >= 3 THEN
        RAISE EXCEPTION 'You already have % active deliveries. Finish one before taking another (limit is 3).', v_active;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_courier_limit ON orders;
CREATE TRIGGER orders_courier_limit
    BEFORE UPDATE OF delivery_person_id ON orders
    FOR EACH ROW
    WHEN (NEW.delivery_person_id IS NOT NULL AND NEW.delivery_person_id IS DISTINCT FROM OLD.delivery_person_id)
    EXECUTE FUNCTION trg_orders_courier_limit();




--- 4.3. Index

--- Index 1: Bids on one listing, newest first
CREATE INDEX IF NOT EXISTS idx_bids_listing_placed
ON bids (listing_id, placed_at DESC);

--- Index 2: A buyer's own bids, newest first
CREATE INDEX IF NOT EXISTS idx_bids_buyer_placed
ON bids (buyer_id, placed_at DESC);


--- Index 3 (PARTIAL): only pending bids
CREATE INDEX IF NOT EXISTS idx_bids_pending ON bids (listing_id) WHERE status = 'pending';

--- Index 4: Active Listings, Newest First
CREATE INDEX IF NOT EXISTS idx_listings_active_created ON listings (created_at DESC) WHERE status = 'Active';

--- Index 5: A farmer's own listings, newest first
CREATE INDEX IF NOT EXISTS idx_listings_farmer_created ON listings (farmer_id, created_at DESC);


--- Index 6: Find the order created from a bids
CREATE INDEX IF NOT EXISTS idx_orders_bid_listing_stage ON orders (bid_id, listing_id, stage);


--- 4.4. Procedures

--- Procedure 1:  place_bid 

--- Buyer places a bid with validation

CREATE OR REPLACE FUNCTION place_bid(
  p_user_id uuid, p_listing_id uuid, p_amount numeric, p_quantity numeric
) RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role::text = 'buyer') THEN
    RAISE EXCEPTION 'Only buyer accounts can place bids.';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Your offer must be greater than 0.';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than 0.';
  END IF;
 
  INSERT INTO bids (listing_id, buyer_id, amount_per_unit, quantity, status)
  VALUES (p_listing_id, p_user_id, p_amount, p_quantity, 'pending')
  RETURNING id INTO v_id;
 
  RETURN v_id;
END $$;


--- Procedure 2: accept_bid

--- Farmer accepts a bid

CREATE OR REPLACE FUNCTION accept_bid(p_user_id uuid, p_bid_id uuid)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_bid      record;
  v_order_id uuid;
BEGIN
  SELECT b.id, b.buyer_id, b.listing_id, b.amount_per_unit, b.quantity,
         b.status::text AS status, l.farmer_id, l.quantity_available
    INTO v_bid
    FROM bids b JOIN listings l ON l.id = b.listing_id
   WHERE b.id = p_bid_id
     FOR UPDATE OF b, l;
 
  IF NOT FOUND OR v_bid.farmer_id <> p_user_id THEN
    RAISE EXCEPTION 'Bid not found on one of your listings.';
  END IF;
  IF v_bid.status <> 'pending' THEN
    RAISE EXCEPTION 'This bid has already been answered.';
  END IF;
  IF v_bid.quantity > v_bid.quantity_available THEN
    RAISE EXCEPTION 'Only % left, this bid needs %.', v_bid.quantity_available, v_bid.quantity;
  END IF;
 
  UPDATE bids SET status = 'accepted' WHERE id = v_bid.id;
 
  -- total_price is a generated column, so it is not inserted
  INSERT INTO orders (listing_id, bid_id, buyer_id, stage, agreed_price_per_unit, quantity, placed_at)
  VALUES (v_bid.listing_id, v_bid.id, v_bid.buyer_id, 'bid_accepted',
          v_bid.amount_per_unit, v_bid.quantity, now())
  RETURNING id INTO v_order_id;
 
  UPDATE listings
     SET quantity_available = quantity_available - v_bid.quantity,
         status = CASE WHEN quantity_available - v_bid.quantity <= 0 THEN 'Sold' ELSE status END
   WHERE id = v_bid.listing_id;
 
  RETURN v_order_id;
END $$;





--- Procedure 3:  decline_bid

CREATE OR REPLACE FUNCTION decline_bid(p_user_id uuid, p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bids b SET status = 'declined'
    FROM listings l
   WHERE b.id = p_bid_id
     AND l.id = b.listing_id
     AND l.farmer_id = p_user_id
     AND b.status::text = 'pending';
 
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending bid not found on one of your listings.';
  END IF;
END $$;



--- Procedure 4: withdraw_bid  

--- Buyer withdraws (deletes) their own PENDING bid

CREATE OR REPLACE FUNCTION withdraw_bid(p_user_id uuid, p_bid_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM bids
   WHERE id = p_bid_id AND buyer_id = p_user_id AND status::text = 'pending';
 
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Couldn''t withdraw this bid (it may have been answered already).';
  END IF;
END $$;



--- Procedure 5: update_order_stage 

--- Farmer moves an order forward: harvest_scheduled -> out_for_delivery

CREATE OR REPLACE FUNCTION advance_order(p_user_id uuid, p_order_id uuid, p_stage text)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_stage = 'out_for_delivery' THEN
    UPDATE orders SET stage = 'out_for_delivery', picked_up_at = now()
     WHERE id = p_order_id AND delivery_person_id = p_user_id
       AND stage::text = 'harvest_scheduled';
  ELSIF p_stage = 'delivered' THEN
    UPDATE orders SET stage = 'delivered', delivered_at = now()
     WHERE id = p_order_id AND delivery_person_id = p_user_id
       AND stage::text = 'out_for_delivery';
  ELSE
    RAISE EXCEPTION 'Unknown delivery step.';
  END IF;
 
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This delivery is not in the right state for that step.';
  END IF;
END $$;

                                       

--- Procedure 6: get_farmer_dashboard_stats 

--- One query for the 4 dashboard cards

CREATE OR REPLACE FUNCTION get_farmer_dashboard_stats(p_user_id uuid)
RETURNS TABLE (
  active_listings bigint,
  pending_bids    bigint,
  completed_sales bigint,
  total_revenue   numeric
)
LANGUAGE sql STABLE AS $$
  SELECT
    (SELECT count(*) FROM listings
      WHERE farmer_id = p_user_id AND status::text = 'Active'),
    (SELECT count(*) FROM bids b JOIN listings l ON l.id = b.listing_id
      WHERE l.farmer_id = p_user_id AND b.status::text = 'pending'),
    (SELECT count(*) FROM orders o JOIN listings l ON l.id = o.listing_id
      WHERE l.farmer_id = p_user_id AND o.stage::text = 'delivered'),
    (SELECT COALESCE(sum(o.total_price), 0) FROM orders o JOIN listings l ON l.id = o.listing_id
      WHERE l.farmer_id = p_user_id AND o.stage::text = 'delivered');
$$;



--- 4.5. Complex Queries

--- Complex Query 1: Farmer League Table

--- Ranks farmers by revenue, along with their listing, bid and order statistics and cumulative revenue share.

WITH farmer_listings AS (
SELECT l.farmer_id,
COUNT(*)  AS listings,
COUNT(*) FILTER (WHERE l.status = 'Sold')  AS sold_listings
FROM  listings l
GROUP  BY l.farmer_id
),
farmer_bids AS (
SELECT l.farmer_id,
COUNT(b.id)  AS total_bids,
COUNT(*) FILTER (WHERE b.status = 'accepted')  AS accepted_bids
FROM  listings l
JOIN  bids b ON b.listing_id = l.id
GROUP  BY l.farmer_id
),
farmer_orders AS (
SELECT l.farmer_id,
COUNT(*)  AS orders,
SUM(o.total_price)  AS revenue,
COUNT(*) FILTER (WHERE o.stage = 'delivered')  AS delivered_orders
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
GROUP  BY l.farmer_id
)
SELECT p.name,
p.farm_name,
p.verified,
fl.listings,
fl.sold_listings,
COALESCE(fb.total_bids, 0)  AS total_bids,
ROUND(100.0 * fb.accepted_bids / NULLIF(fb.total_bids, 0), 1)  AS acceptance_rate_pct,
COALESCE(fo.orders, 0)  AS orders,
ROUND(100.0 * fo.delivered_orders / NULLIF(fo.orders, 0), 1)  AS delivered_pct,
COALESCE(fo.revenue, 0)  AS revenue,
RANK() OVER (ORDER BY COALESCE(fo.revenue, 0) DESC)  AS revenue_rank,
ROUND(100.0 * SUM(COALESCE(fo.revenue, 0))
OVER (ORDER BY COALESCE(fo.revenue, 0) DESC, p.id)
/ NULLIF(SUM(COALESCE(fo.revenue, 0)) OVER (), 0), 1)  AS cumulative_revenue_share_pct
FROM  profiles p
JOIN  farmer_listings fl ON fl.farmer_id = p.id
LEFT  JOIN farmer_bids  fb ON fb.farmer_id = p.id
LEFT  JOIN farmer_orders fo ON fo.farmer_id = p.id
WHERE  p.role = 'farmer'
ORDER  BY revenue_rank, p.name;




--- Complex Query 2: Bid-to-Ask Price Ratio by Crop

--- Shows how buyers’ bids compare with the farmers’ asking prices for each crop (average, median, 90th percentile and spread).
SELECT c.name  AS crop,
c.crop_type,
COUNT(*)  AS bids,
ROUND(AVG(b.amount_per_unit / l.price_per_unit), 3)  AS avg_ratio,
ROUND((percentile_cont(0.5) WITHIN GROUP
(ORDER BY b.amount_per_unit / l.price_per_unit))::numeric, 3)  AS median_ratio,
ROUND((percentile_cont(0.9) WITHIN GROUP
(ORDER BY b.amount_per_unit / l.price_per_unit))::numeric, 3)  AS p90_ratio,
ROUND(STDDEV_SAMP(b.amount_per_unit / l.price_per_unit), 3)  AS stddev_ratio,
ROUND(100.0 * COUNT(*) FILTER (WHERE b.amount_per_unit >= l.price_per_unit)
/ COUNT(*), 1)  AS pct_bids_at_or_above_ask
FROM  bids b
JOIN  listings l ON l.id = b.listing_id
JOIN  crops  c ON c.id = l.crop_id
WHERE  l.price_per_unit > 0
GROUP  BY c.id, c.name, c.crop_type
HAVING COUNT(*) >= 3
ORDER  BY median_ratio DESC ;




--- Complex Query 3: Top 3 Active Listings per Crop Type

--- Lists the top 3 active listings in each crop type by quality rating, with each price compared to the crop’s average price.

SELECT *
FROM (
SELECT c.crop_type,
c.name  AS crop,
l.id  AS listing_id,
p.farm_name,
l.quality_rating,
l.price_per_unit,
l.organic,
ROUND(100.0 * (l.price_per_unit - AVG(l.price_per_unit) OVER (PARTITION BY c.id))
/ NULLIF(AVG(l.price_per_unit) OVER (PARTITION BY c.id), 0), 1)
AS pct_vs_crop_avg_price,
DENSE_RANK() OVER (PARTITION BY c.crop_type
ORDER BY l.quality_rating DESC NULLS LAST,
l.price_per_unit ASC)  AS rnk
FROM  listings l
JOIN  crops  c ON c.id = l.crop_id
JOIN  profiles p ON p.id = l.farmer_id
WHERE  l.status = 'Active'
AND  l.quantity_available > 0
) ranked
WHERE  rnk <= 3
ORDER  BY crop_type, rnk, price_per_unit;


	

--- Complex Query 4: Monthly Crop Price Trend

--- Shows each crop’s monthly volume and weighted average price, with month-over-month change and a 3-month moving average.
WITH monthly AS (
SELECT c.id  AS crop_id,
c.name  AS crop,
date_trunc('month', o.placed_at)::date  AS month,
SUM(o.quantity)  AS volume,
SUM(o.total_price) / NULLIF(SUM(o.quantity), 0) AS wavg_price
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
JOIN  crops  c ON c.id = l.crop_id
GROUP  BY c.id, c.name, date_trunc('month', o.placed_at)
)
SELECT crop,
month,
volume,
ROUND(wavg_price, 2)  AS wavg_price,
ROUND(100.0 * (wavg_price - LAG(wavg_price) OVER w)
/ NULLIF(LAG(wavg_price) OVER w, 0), 1)  AS mom_change_pct,
ROUND(AVG(wavg_price) OVER (w ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3m
FROM  monthly
WINDOW w AS (PARTITION BY crop_id ORDER BY month)
ORDER  BY crop, month;



	

--- Complex Query 5: Bid Competition per Active Listing

--- Shows the highest and second-highest live bids on each active listing and classifies it as no bids, single bidder or contested.

WITH ranked_bids AS (
SELECT b.listing_id,
b.amount_per_unit,
ROW_NUMBER() OVER (PARTITION BY b.listing_id
ORDER BY b.amount_per_unit DESC, b.placed_at) AS rn
FROM  bids b
WHERE  b.status IN ('pending', 'accepted')
)
SELECT l.id  AS listing_id,
c.name  AS crop,
p.farm_name,
l.price_per_unit  AS asking_price,
COUNT(r.rn)  AS live_bids,
MAX(r.amount_per_unit) FILTER (WHERE r.rn = 1) AS highest_bid,
MAX(r.amount_per_unit) FILTER (WHERE r.rn = 2) AS second_highest_bid,
ROUND(100.0 * (MAX(r.amount_per_unit) FILTER (WHERE r.rn = 1) - l.price_per_unit)
/ NULLIF(l.price_per_unit, 0), 1)  AS premium_over_ask_pct,
CASE COUNT(r.rn)
WHEN 0 THEN 'no bids'
WHEN 1 THEN 'single bidder'
ELSE  'contested'
END  AS competition,
(CURRENT_DATE - l.created_at::date)  AS listing_age_days
FROM  listings l
JOIN  crops  c ON c.id = l.crop_id
JOIN  profiles p ON p.id = l.farmer_id
LEFT  JOIN ranked_bids r ON r.listing_id = l.id
WHERE  l.status = 'Active'
GROUP  BY l.id, c.name, p.farm_name, l.price_per_unit, l.created_at
ORDER  BY live_bids DESC, listing_age_days DESC;


	

---Complex Query 6: Buyer Segmentation (RFM Analysis)

--- Scores each buyer on recency, frequency and spending, and assigns a segment such as Champion, At risk or Lost.

WITH base AS (
SELECT o.buyer_id,
MAX(o.placed_at)  AS last_order_at,
COUNT(*)  AS frequency,
SUM(o.total_price) AS monetary
FROM  orders o
GROUP  BY o.buyer_id
),
scored AS (
SELECT b.*,
(CURRENT_DATE - b.last_order_at::date)  AS recency_days,
NTILE(4) OVER (ORDER BY b.last_order_at) AS r_score,  -- 4 = most recent
NTILE(4) OVER (ORDER BY b.frequency)  AS f_score,
NTILE(4) OVER (ORDER BY b.monetary)  AS m_score
FROM  base b
)
SELECT p.name,
p.email,
s.recency_days,
s.frequency,
s.monetary,
s.r_score, s.f_score, s.m_score,
CASE
WHEN s.r_score >= 3 AND s.f_score >= 3 AND s.m_score >= 3 THEN 'Champion'
WHEN s.r_score >= 3 AND s.f_score <= 2  THEN 'New / promising'
WHEN s.r_score <= 2 AND s.f_score >= 3  THEN 'At risk (was loyal)'
WHEN s.r_score = 1  AND s.f_score = 1  THEN 'Lost'
ELSE 'Regular'
END AS segment
FROM  scored s
JOIN  profiles p ON p.id = s.buyer_id
ORDER  BY s.m_score DESC, s.f_score DESC, s.r_score DESC;



	
--- Complex Query 7: Weekly Delivery Timeline

--- Shows the average waiting, pickup, transit and end-to-end times of orders each week, and the percentage delivered within 48 hours.

SELECT date_trunc('week', o.placed_at)::date  AS week,
COUNT(*)  AS orders,
COUNT(*) FILTER (WHERE o.stage = 'delivered')  AS delivered,
AVG(o.claimed_at  - o.placed_at)  AS avg_wait_for_partner,
percentile_cont(0.5) WITHIN GROUP (ORDER BY o.claimed_at - o.placed_at)
AS median_wait_for_partner,
AVG(o.picked_up_at - o.claimed_at)  AS avg_time_to_pickup,
AVG(o.delivered_at - o.picked_up_at)  AS avg_transit_time,
AVG(o.delivered_at - o.placed_at)  AS avg_end_to_end,
ROUND(100.0 * COUNT(*) FILTER (WHERE o.delivered_at - o.placed_at <= INTERVAL '48 hours')
/ NULLIF(COUNT(*) FILTER (WHERE o.stage = 'delivered'), 0), 1)
AS delivered_within_48h_pct
FROM  orders o
GROUP  BY date_trunc('week', o.placed_at)
ORDER  BY week;




--- Complex Query 8: Delivery Partner Scorecard

--- Ranks delivery partners by deliveries completed and transit time, and labels each as fast, average or slow.

WITH per_partner AS (
SELECT o.delivery_person_id,
COUNT(*) FILTER (WHERE o.stage = 'delivered')  AS delivered,
COUNT(*) FILTER (WHERE o.stage <> 'delivered')  AS in_progress,
SUM(o.total_price) FILTER (WHERE o.stage = 'delivered')  AS value_delivered,
AVG(o.delivered_at - o.picked_up_at) FILTER (WHERE o.stage = 'delivered') AS avg_transit,
AVG(o.claimed_at - o.placed_at)  AS avg_response_time
FROM  orders o
WHERE  o.delivery_person_id IS NOT NULL
GROUP  BY o.delivery_person_id
)
SELECT p.name,
p.phone,
pp.delivered,
pp.in_progress,
COALESCE(pp.value_delivered, 0)  AS value_delivered,
pp.avg_transit,
pp.avg_response_time,
RANK()  OVER (ORDER BY pp.delivered DESC, pp.avg_transit ASC NULLS LAST) AS overall_rank,
CASE NTILE(3) OVER (ORDER BY pp.avg_transit ASC NULLS LAST)
WHEN 1 THEN 'fast' WHEN 2 THEN 'average' ELSE 'slow'
END  AS speed_tier
FROM  per_partner pp
JOIN  profiles p ON p.id = pp.delivery_person_id
ORDER  BY overall_rank;




--- Complex Query 9: Listing Sell-Through and Response Time

--- Shows, per crop, the sell-through rate and how quickly listings receive their first bid and first order.

WITH fb AS (
SELECT b.listing_id, MIN(b.placed_at) AS first_bid_at
FROM  bids b
GROUP  BY b.listing_id
),
fo AS (
SELECT o.listing_id, MIN(o.placed_at) AS first_order_at
FROM  orders o
GROUP  BY o.listing_id
)
SELECT c.name  AS crop,
COUNT(*)  AS listings,
COUNT(fb.listing_id)  AS listings_with_bids,
COUNT(fo.listing_id)  AS listings_with_orders,
ROUND(100.0 * COUNT(fo.listing_id) / COUNT(*), 1)  AS sell_through_pct,
percentile_cont(0.5) WITHIN GROUP (ORDER BY fb.first_bid_at - l.created_at)  AS median_time_to_first_bid,
percentile_cont(0.9) WITHIN GROUP (ORDER BY fb.first_bid_at - l.created_at)  AS p90_time_to_first_bid,
percentile_cont(0.5) WITHIN GROUP (ORDER BY fo.first_order_at - l.created_at) AS median_time_to_sale,
AVG(fo.first_order_at - fb.first_bid_at)  AS avg_negotiation_time,
COUNT(*) FILTER (WHERE l.status = 'Active'
AND fb.listing_id IS NULL
AND l.created_at < now() - INTERVAL '3 days')  AS stale_listings_no_bids
FROM  listings l
JOIN  crops c  ON c.id = l.crop_id
LEFT  JOIN fb  ON fb.listing_id = l.id
LEFT  JOIN fo  ON fo.listing_id = l.id
GROUP  BY c.id, c.name
ORDER  BY sell_through_pct DESC, listings DESC;

	


--- Complex Query 10: Nearest Listings to Each Delivery Point

--- Finds the 3 closest active listings to each undelivered order’s drop-off location.

SELECT o.id  AS order_id,
o.delivery_address,
nn.listing_id,
nn.crop,
nn.farm_name,
nn.price_per_unit,
ROUND(nn.km::numeric, 1) AS km_from_drop_point,
nn.nearest_rank
FROM  orders o
CROSS  JOIN LATERAL (
SELECT x.*, ROW_NUMBER() OVER (ORDER BY x.km) AS nearest_rank
FROM (
SELECT l.id AS listing_id,
c.name AS crop,
p.farm_name,
l.price_per_unit,
2 * 6371 * asin(LEAST(1, sqrt(
power(sin(radians(l.latitude - o.delivery_lat) / 2), 2) +
cos(radians(o.delivery_lat)) * cos(radians(l.latitude)) *
power(sin(radians(l.longitude - o.delivery_lng) / 2), 2)))) AS km
FROM  listings l
JOIN  crops  c ON c.id = l.crop_id
JOIN  profiles p ON p.id = l.farmer_id
WHERE  l.status = 'Active'
AND  l.quantity_available > 0
AND  l.latitude IS NOT NULL AND l.longitude IS NOT NULL
) x
ORDER  BY x.km
LIMIT  3
) nn
WHERE  o.delivery_lat IS NOT NULL
AND  o.delivery_lng IS NOT NULL
AND  o.stage <> 'delivered'
ORDER  BY o.id, nn.nearest_rank;




--- Complex Query 11:  Supply vs Demand by Crop

--- Compares the available quantity with pending bid quantity for each crop and marks it as shortage, balanced or oversupply.

WITH supply AS (
SELECT l.crop_id,
SUM(l.quantity_available) AS supply_qty,
COUNT(*)  AS active_listings,
AVG(l.price_per_unit)  AS avg_ask
FROM  listings l
WHERE  l.status = 'Active'
GROUP  BY l.crop_id
),
demand AS (
SELECT l.crop_id,
SUM(b.quantity)  AS demand_qty,
COUNT(*)  AS pending_bids,
AVG(b.amount_per_unit)  AS avg_bid
FROM  bids b
JOIN  listings l ON l.id = b.listing_id
WHERE  b.status = 'pending'
GROUP  BY l.crop_id
)
SELECT c.name  AS crop,
c.crop_type,
COALESCE(s.supply_qty, 0)  AS supply_qty,
COALESCE(d.demand_qty, 0)  AS demand_qty,
ROUND(COALESCE(d.demand_qty, 0) / NULLIF(s.supply_qty, 0), 2) AS demand_to_supply,
ROUND(100.0 * (d.avg_bid - s.avg_ask) / NULLIF(s.avg_ask, 0), 1) AS avg_bid_vs_ask_pct,
CASE
WHEN s.crop_id IS NULL  THEN 'demand, no supply'
WHEN d.crop_id IS NULL  THEN 'supply, no demand'
WHEN d.demand_qty > s.supply_qty  THEN 'shortage'
WHEN d.demand_qty < 0.25 * s.supply_qty  THEN 'oversupply'
ELSE 'balanced'
END AS market_state
FROM  supply s
FULL  OUTER JOIN demand d USING (crop_id)
JOIN  crops c ON c.id = crop_id
ORDER  BY demand_to_supply DESC NULLS LAST;



--- Complex Query 12: Daily Sales Trend (Last 30 Days)

--- Shows daily bids, orders and sales value for the last 30 days, with cumulative total and 7-day moving average.
WITH RECURSIVE spine (day) AS (
SELECT CURRENT_DATE - 29
UNION ALL
SELECT day + 1 FROM spine WHERE day < CURRENT_DATE
),
daily_orders AS (
SELECT o.placed_at::date AS day, COUNT(*) AS orders, SUM(o.total_price) AS gmv
FROM  orders o
GROUP  BY o.placed_at::date
),
daily_bids AS (
SELECT b.placed_at::date AS day, COUNT(*) AS bids
FROM  bids b
GROUP  BY b.placed_at::date
)
SELECT s.day,
COALESCE(db.bids, 0)  AS bids_placed,
COALESCE(d.orders, 0)  AS orders,
COALESCE(d.gmv, 0)  AS gmv,
SUM(COALESCE(d.gmv, 0)) OVER (ORDER BY s.day)  AS cumulative_gmv,
ROUND(AVG(COALESCE(d.gmv, 0)) OVER (ORDER BY s.day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2)
AS gmv_7day_avg
FROM  spine s
LEFT  JOIN daily_orders d  ON d.day  = s.day
LEFT  JOIN daily_bids  db ON db.day = s.day
ORDER  BY s.day;



--- Complex Query 13:  ABC Analysis of Crops by Revenue

--- Classifies crops into A, B and C groups according to their cumulative share of total revenue.

WITH crop_revenue AS (
SELECT c.id, c.name, c.crop_type, SUM(o.total_price) AS revenue
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
JOIN  crops  c ON c.id = l.crop_id
GROUP  BY c.id, c.name, c.crop_type
),
cumulative AS (
SELECT cr.*,
SUM(revenue) OVER (ORDER BY revenue DESC, id
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_revenue,
SUM(revenue) OVER ()  AS total_revenue
FROM  crop_revenue cr
)
SELECT name,
crop_type,
revenue,
ROUND(100.0 * revenue / total_revenue, 1)  AS share_pct,
ROUND(100.0 * running_revenue / total_revenue, 1)  AS cumulative_share_pct,
CASE
WHEN (running_revenue - revenue) / total_revenue < 0.70 THEN 'A'
WHEN (running_revenue - revenue) / total_revenue < 0.90 THEN 'B'
ELSE 'C'
END  AS abc_class
FROM  cumulative
ORDER  BY revenue DESC;




--- Complex Query 14: Marketplace Conversion Funnel by Crop

--- Tracks each crop from listing to bid to accepted bid to delivery, with conversion percentages at each step.

WITH lst AS (
SELECT l.crop_id, COUNT(*) AS listings
FROM  listings l
GROUP  BY l.crop_id
),
bd AS (
SELECT l.crop_id,
COUNT(*)  AS bids,
COUNT(DISTINCT b.listing_id)  AS listings_with_bids,
COUNT(*) FILTER (WHERE b.status = 'accepted')  AS accepted_bids
FROM  bids b
JOIN  listings l ON l.id = b.listing_id
GROUP  BY l.crop_id
),
od AS (
SELECT l.crop_id,
COUNT(*)  AS orders,
COUNT(*) FILTER (WHERE o.stage = 'delivered')  AS delivered,
SUM(o.total_price) FILTER (WHERE o.stage = 'delivered') AS delivered_value
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
GROUP  BY l.crop_id
)
SELECT c.name AS crop,
s.listings,
COALESCE(bd.listings_with_bids, 0)  AS listings_with_bids,
ROUND(100.0 * COALESCE(bd.listings_with_bids, 0) / s.listings, 1)  AS pct_listings_bid_on,
COALESCE(bd.bids, 0)  AS bids,
COALESCE(bd.accepted_bids, 0)  AS accepted_bids,
ROUND(100.0 * bd.accepted_bids / NULLIF(bd.bids, 0), 1)  AS bid_accept_pct,
COALESCE(od.orders, 0)  AS orders,
COALESCE(od.delivered, 0)  AS delivered,
ROUND(100.0 * od.delivered / NULLIF(od.orders, 0), 1)  AS delivery_completion_pct,
ROUND(100.0 * COALESCE(od.delivered, 0) / NULLIF(bd.bids, 0), 1)  AS bid_to_delivery_pct,
COALESCE(od.delivered_value, 0)  AS delivered_value,
RANK() OVER (ORDER BY 1.0 * COALESCE(od.delivered, 0) / NULLIF(bd.bids, 0) DESC NULLS LAST) AS funnel_rank
FROM  lst s
JOIN  crops c  ON c.id = s.crop_id
LEFT  JOIN bd  ON bd.crop_id = s.crop_id
LEFT  JOIN od  ON od.crop_id = s.crop_id
ORDER  BY funnel_rank, crop;



--- Complex Query 15: Farmer–Buyer Loyalty and Dependency

--- Finds each farmer’s top 3 buyers, their share of that farmer’s revenue, and classifies each relationship by loyalty and dependency.

WITH pair AS (
SELECT l.farmer_id,
o.buyer_id,
COUNT(*)  AS orders,
SUM(o.total_price)  AS order_value,
MIN(o.placed_at)  AS first_order,
MAX(o.placed_at)  AS last_order
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
GROUP  BY l.farmer_id, o.buyer_id
),
shares AS (
SELECT pr.*,
ROUND(100.0 * pr.order_value
/ NULLIF(SUM(pr.order_value) OVER (PARTITION BY pr.farmer_id), 0), 1)
AS share_of_farmer_pct,
RANK()  OVER (PARTITION BY pr.farmer_id ORDER BY pr.order_value DESC)
AS buyer_rank,
COUNT(*) OVER (PARTITION BY pr.buyer_id)  AS farmers_used_by_buyer
FROM  pair pr
)
SELECT fp.farm_name,
bp.name  AS buyer,
s.orders,
s.order_value,
s.share_of_farmer_pct,
s.buyer_rank,
(s.last_order::date - s.first_order::date)  AS relationship_days,
s.farmers_used_by_buyer,
CASE
WHEN s.orders >= 3 THEN 'Repeat customer'
WHEN s.orders = 2  THEN 'Returning'
ELSE  'One-time'
END  AS loyalty,
CASE
WHEN s.share_of_farmer_pct >= 50 THEN 'High dependency'
WHEN s.share_of_farmer_pct >= 25 THEN 'Moderate'
ELSE  'Diversified'
END  AS dependency_level
FROM  shares s
JOIN  profiles fp ON fp.id = s.farmer_id
JOIN  profiles bp ON bp.id = s.buyer_id
WHERE  s.buyer_rank <= 3
ORDER  BY fp.farm_name, s.buyer_rank;



--- Complex Query 16: Farmer Price Competitiveness

--- Compares each farmer’s average asking price with the crop’s median price and ranks farmers within each crop.
WITH crop_stats AS (
SELECT l.crop_id,
(percentile_cont(0.5) WITHIN GROUP (ORDER BY l.price_per_unit))::numeric AS median_ask
FROM  listings l
WHERE  l.status::text = 'Active'
GROUP  BY l.crop_id
),
farmer_crop AS (
SELECT p.farm_name,
c.id  AS crop_id,
c.name  AS crop,
COUNT(*)  AS active_listings,
ROUND(AVG(l.price_per_unit)::numeric, 2)  AS avg_ask,
ROUND(cs.median_ask, 2)  AS crop_median_ask,
ROUND(100.0 * (AVG(l.price_per_unit)::numeric - cs.median_ask)
/ NULLIF(cs.median_ask, 0), 1)  AS pct_vs_median,
ROUND(AVG(l.quality_rating)::numeric, 1)  AS avg_quality,
RANK() OVER (PARTITION BY c.id ORDER BY AVG(l.price_per_unit)) AS price_rank_in_crop
FROM  listings l
JOIN  crops  c  ON c.id = l.crop_id
JOIN  profiles  p  ON p.id = l.farmer_id
JOIN  crop_stats  cs ON cs.crop_id = l.crop_id
WHERE  l.status::text = 'Active'
GROUP  BY p.id, p.farm_name, c.id, c.name, cs.median_ask
)
SELECT fc.*,
CASE
WHEN fc.pct_vs_median <= -10 THEN 'Cheaper than market'
WHEN fc.pct_vs_median >=  10 THEN 'Premium priced'
ELSE  'Market price'
END AS price_position
FROM  farmer_crop fc
ORDER  BY fc.crop, fc.price_rank_in_crop;



--- Complex Query 17: Farmer Monthly Revenue Growth

--- Shows each farmer’s monthly revenue with growth over the previous month, cumulative revenue and best month.

WITH monthly AS (
SELECT l.farmer_id,
date_trunc('month', o.placed_at)::date  AS month,
COUNT(*)  AS orders,
SUM(o.total_price)  AS revenue
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
GROUP  BY l.farmer_id, date_trunc('month', o.placed_at)
)
SELECT p.farm_name,
m.month,
m.orders,
m.revenue,
LAG(m.revenue) OVER w  AS prev_month_revenue,
ROUND(100.0 * (m.revenue - LAG(m.revenue) OVER w)
/ NULLIF(LAG(m.revenue) OVER w, 0), 1)  AS growth_pct,
SUM(m.revenue) OVER w  AS cumulative_revenue,
FIRST_VALUE(m.month) OVER (PARTITION BY m.farmer_id
ORDER BY m.revenue DESC, m.month
ROWS BETWEEN UNBOUNDED PRECEDING
AND UNBOUNDED FOLLOWING)  AS best_month,
RANK() OVER (PARTITION BY m.month ORDER BY m.revenue DESC)  AS rank_in_month
FROM  monthly m
JOIN  profiles p ON p.id = m.farmer_id
WINDOW w AS (PARTITION BY m.farmer_id ORDER BY m.month)
ORDER  BY p.farm_name, m.month;




--- Complex Query 18: Farmer Bid Response Speed

--- Measures how often and how quickly farmers accept bids, and counts bids pending for more than 48 hours.

WITH resp AS (
SELECT l.farmer_id,
b.status::text  AS status,
b.placed_at,
o.placed_at  AS order_at
FROM  bids b
JOIN  listings l ON l.id = b.listing_id
LEFT  JOIN orders o ON o.bid_id = b.id
)
SELECT p.farm_name,
COUNT(*)  AS bids_received,
COUNT(*) FILTER (WHERE r.status = 'accepted')  AS accepted,
COUNT(*) FILTER (WHERE r.status = 'declined')  AS declined,
COUNT(*) FILTER (WHERE r.status = 'pending')  AS pending,
COUNT(*) FILTER (WHERE r.status = 'pending'
AND r.placed_at < now() - INTERVAL '48 hours') AS pending_over_48h,
ROUND(100.0 * COUNT(*) FILTER (WHERE r.status = 'accepted')
/ NULLIF(COUNT(*), 0), 1)  AS accept_rate_pct,
AVG(r.order_at - r.placed_at)  AS avg_time_to_accept,
percentile_cont(0.5) WITHIN GROUP (ORDER BY r.order_at - r.placed_at)
AS median_time_to_accept,
RANK() OVER (ORDER BY AVG(r.order_at - r.placed_at) NULLS LAST)  AS speed_rank
FROM  resp r
JOIN  profiles p ON p.id = r.farmer_id
GROUP  BY p.id, p.farm_name
ORDER  BY speed_rank, bids_received DESC;





--- Complex Query 19:  Buyer Favourite Crop and Spending Pattern

--- Finds each buyer’s top crop by spending and classifies buyers as specialist, focused or variety buyers.

WITH spend AS (
SELECT o.buyer_id,
c.name  AS crop,
c.crop_type,
COUNT(*)  AS orders,
SUM(o.total_price) AS crop_spend
FROM  orders o
JOIN  listings l ON l.id = o.listing_id
JOIN  crops  c ON c.id = l.crop_id
GROUP  BY o.buyer_id, c.id, c.name, c.crop_type
),
ranked AS (
SELECT s.*,
SUM(s.crop_spend) OVER (PARTITION BY s.buyer_id)  AS total_spend,
ROUND(100.0 * s.crop_spend
/ NULLIF(SUM(s.crop_spend) OVER (PARTITION BY s.buyer_id), 0), 1) AS share_pct,
COUNT(*)  OVER (PARTITION BY s.buyer_id)  AS crops_bought,
ROW_NUMBER() OVER (PARTITION BY s.buyer_id
ORDER BY s.crop_spend DESC, s.crop)  AS rn
FROM  spend s
)
SELECT p.name  AS buyer,
r.crop  AS favourite_crop,
r.crop_type,
r.orders  AS orders_of_favourite,
r.crop_spend  AS favourite_spend,
r.total_spend,
r.share_pct  AS favourite_share_pct,
r.crops_bought,
CASE
WHEN r.crops_bought = 1 THEN 'Specialist'
WHEN r.share_pct >= 50  THEN 'Focused'
ELSE  'Variety buyer'
END  AS buying_pattern
FROM  ranked r
JOIN  profiles p ON p.id = r.buyer_id
WHERE  r.rn = 1
ORDER  BY r.total_spend DESC;



--- Complex Query 20:  Peak Order Hours

--- Shows orders by hour of the day with weekday and weekend split, average wait for a partner, and marks the 3 busiest hours as peak.

SELECT EXTRACT(HOUR FROM o.placed_at AT TIME ZONE 'Asia/Kolkata')::int AS hour_of_day,
COUNT(*)  AS orders,
COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM o.placed_at AT TIME ZONE 'Asia/Kolkata') < 6)  AS weekday_orders,
COUNT(*) FILTER (WHERE EXTRACT(ISODOW FROM o.placed_at AT TIME ZONE 'Asia/Kolkata') >= 6) AS weekend_orders,
ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)  AS pct_of_all_orders,
AVG(o.claimed_at - o.placed_at)  AS avg_wait_for_partner,
RANK() OVER (ORDER BY COUNT(*) DESC)  AS busiest_rank,
CASE WHEN RANK() OVER (ORDER BY COUNT(*) DESC) <= 3
THEN 'Peak hour' ELSE 'Normal' END  AS demand_level
FROM  orders o
GROUP  BY 1
ORDER  BY hour_of_day;
