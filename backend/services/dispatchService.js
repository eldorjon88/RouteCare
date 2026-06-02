const { query } = require('../db');

// Finds the nearest available ambulance to a pickup point using the haversine
// formula in SQL (distance in km). For higher volumes, switch lat/lng to a
// PostGIS geography column with a GiST index and order by KNN (<->).
async function findNearestAmbulance(lat, lng) {
  const { rows } = await query(
    `SELECT a.id, a.driver_id, a.plate_number, a.lat, a.lng,
            ( 6371 * acos( least(1, greatest(-1,
                cos(radians($1)) * cos(radians(a.lat)) *
                cos(radians(a.lng) - radians($2)) +
                sin(radians($1)) * sin(radians(a.lat))
            )) ) ) AS distance_km
       FROM ambulances a
      WHERE a.status = 'available' AND a.lat IS NOT NULL AND a.lng IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT 1`,
    [lat, lng]
  );
  return rows[0] || null;
}

async function setAmbulanceStatus(ambulanceId, status) {
  await query(
    'UPDATE ambulances SET status = $2, updated_at = NOW() WHERE id = $1',
    [ambulanceId, status]
  );
}

module.exports = { findNearestAmbulance, setAmbulanceStatus };
