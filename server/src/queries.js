// Reusable raw-SQL fragments. They return nested JSON so the React app gets
// the same shape it always used (crops, profiles, listing_images ...).

export const LISTING_SELECT = `
  SELECT l.id, l.image_url, l.price_per_unit, l.unit, l.quantity_available,
         l.location_text, l.latitude, l.longitude, l.quality_rating, l.harvest_date,
         l.organic, l.description, l.farmer_id, l.status, l.created_at,
    (SELECT json_build_object('name', c.name, 'crop_type', c.crop_type)
       FROM crops c WHERE c.id = l.crop_id) AS crops,
    (SELECT json_agg(json_build_object('image_url', li.image_url, 'sort_order', li.sort_order)
                     ORDER BY li.sort_order)
       FROM listing_images li WHERE li.listing_id = l.id) AS listing_images,
    (SELECT json_build_object('id', p.id, 'name', p.name, 'farm_name', p.farm_name,
                              'avatar_url', p.avatar_url, 'rating', p.rating, 'verified', p.verified)
       FROM profiles p WHERE p.id = l.farmer_id) AS profiles
  FROM listings l`;

export const FARMER_DASHBOARD_SELECT = `
  SELECT l.id, l.image_url, l.price_per_unit, l.unit, l.quantity_available, l.status, l.created_at,
    (SELECT json_build_object('name', c.name, 'crop_type', c.crop_type)
       FROM crops c WHERE c.id = l.crop_id) AS crops,
    COALESCE((SELECT json_agg(json_build_object('id', b.id, 'status', b.status::text))
       FROM bids b WHERE b.listing_id = l.id), '[]'::json) AS bids,
    COALESCE((SELECT json_agg(json_build_object('id', o.id, 'total_price', o.total_price, 'stage', o.stage::text))
       FROM orders o WHERE o.listing_id = l.id), '[]'::json) AS orders
  FROM listings l`;

/** Bids on one listing, with the buyer's name. */
export const LISTING_BIDS_SELECT = `
  SELECT b.id, b.listing_id, b.buyer_id, b.amount_per_unit, b.quantity,
         b.status::text AS status, b.placed_at,
    (SELECT json_build_object('name', p.name) FROM profiles p WHERE p.id = b.buyer_id) AS profiles
  FROM bids b`;

/** A buyer's own bids, with listing / crop / farmer details. */
export const BUYER_BIDS_SELECT = `
  SELECT b.id, b.listing_id, b.amount_per_unit, b.quantity, b.status::text AS status, b.placed_at,
    (SELECT json_build_object(
        'price_per_unit', l.price_per_unit, 'unit', l.unit, 'image_url', l.image_url,
        'location_text', l.location_text,
        'crops', (SELECT json_build_object('name', c.name) FROM crops c WHERE c.id = l.crop_id),
        'profiles', (SELECT json_build_object('name', fp.name, 'farm_name', fp.farm_name)
                       FROM profiles fp WHERE fp.id = l.farmer_id))
       FROM listings l WHERE l.id = b.listing_id) AS listings
  FROM bids b`;

/** Orders with listing, farmer, buyer and courier details (delivery board). */
export const ORDER_SELECT = `
  SELECT o.id, o.bid_id, o.listing_id, o.buyer_id, o.stage::text AS stage, o.quantity,
         o.agreed_price_per_unit, o.total_price, o.placed_at,
         o.delivery_address, o.delivery_lat, o.delivery_lng, o.delivery_phone, o.delivery_notes,
         o.delivery_person_id, o.claimed_at, o.picked_up_at, o.delivered_at,
    (SELECT json_build_object('name', bp.name, 'phone', bp.phone)
       FROM profiles bp WHERE bp.id = o.buyer_id) AS buyer,
    (SELECT json_build_object('name', cp.name, 'phone', cp.phone)
       FROM profiles cp WHERE cp.id = o.delivery_person_id) AS courier,
    (SELECT json_build_object(
        'farmer_id', l.farmer_id, 'unit', l.unit, 'image_url', l.image_url,
        'location_text', l.location_text, 'latitude', l.latitude, 'longitude', l.longitude,
        'crops', (SELECT json_build_object('name', c.name) FROM crops c WHERE c.id = l.crop_id),
        'profiles', (SELECT json_build_object('name', fp.name, 'farm_name', fp.farm_name, 'phone', fp.phone)
                       FROM profiles fp WHERE fp.id = l.farmer_id))
       FROM listings l WHERE l.id = o.listing_id) AS listings
  FROM orders o`;
