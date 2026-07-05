/**
 * Custom Google Maps style — Light / Cream / Illustrated theme.
 * Similar to Snapchat Map / Pokémon GO aesthetic.
 *
 * Features:
 * - Cream/beige land geometry
 * - Soft blue water
 * - Hidden business POIs (keeps parks & landmarks)
 * - Subtle gray road labels
 */
const mapStyleLight = [
  // ─── Overall geometry ─────────────────────────────────────
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#f5f0e6' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B7280' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#FFFFFF' }, { weight: 3 }],
  },

  // ─── Water ────────────────────────────────────────────────
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#a8d8e8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7aafc4' }],
  },

  // ─── Landscape / land ─────────────────────────────────────
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f5f0e6' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#efe9d9' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0ebdd' }],
  },
  {
    featureType: 'landscape.natural.terrain',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e0cc' }],
  },

  // ─── Roads ────────────────────────────────────────────────
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e0d9c8' }, { weight: 1 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fce8c8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e8d4a8' }, { weight: 1.5 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fff8ee' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8578' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 3 }],
  },

  // ─── Parks & green areas ──────────────────────────────────
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d4e8c2' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b8e5a' }],
  },

  // ─── POI — hide business clutter, keep useful landmarks ──
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.government',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e0d0' }],
  },
  {
    featureType: 'poi.school',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e6dcc8' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0e0e0' }],
  },
  {
    featureType: 'poi.attraction',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e0cc' }],
  },
  {
    featureType: 'poi.sports_complex',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d8ecc8' }],
  },

  // ─── Buildings ────────────────────────────────────────────
  {
    featureType: 'building',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e0d0' }],
  },
  {
    featureType: 'building',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d8d0c0' }, { weight: 0.5 }],
  },

  // ─── Transit ──────────────────────────────────────────────
  {
    featureType: 'transit',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e0d8c8' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.icon',
    stylers: [{ saturation: -60 }],
  },

  // ─── Administrative borders ───────────────────────────────
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c8c0a8' }, { weight: 1 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5a5548' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7a7568' }],
  },
];

export default mapStyleLight;
