import { getDistanceMeters } from '../src/hooks/use-position';

describe('Geolocation & Proximity Activation Radius (RF3 / D1 specs)', () => {
  // Trento coordinates reference points
  const piazzaDuomo = { lat: 46.0674, lng: 11.1215 };
  const fontanaNettuno = { lat: 46.0669, lng: 11.1215 }; // ~55m south of Duomo center
  const nearbyPiazzaDuomo = { lat: 46.06745, lng: 11.12155 }; // ~6-8m away

  test('TC-GEO-1: Calcola correttamente la distanza tra coordinate identiche (0 metri)', () => {
    const dist = getDistanceMeters(piazzaDuomo.lat, piazzaDuomo.lng, piazzaDuomo.lat, piazzaDuomo.lng);
    expect(dist).toBe(0);
  });

  test('TC-GEO-2: Rileva utente entro il raggio di attivazione di 30 metri per la visualizzazione AR', () => {
    const dist = getDistanceMeters(piazzaDuomo.lat, piazzaDuomo.lng, nearbyPiazzaDuomo.lat, nearbyPiazzaDuomo.lng);
    expect(dist).toBeLessThanOrEqual(30);
    const isWithinRadius = dist <= 30;
    expect(isWithinRadius).toBe(true);
  });

  test('TC-GEO-3: Rileva utente fuori dal raggio di attivazione (> 30 metri) bloccando la visualizzazione AR', () => {
    const dist = getDistanceMeters(piazzaDuomo.lat, piazzaDuomo.lng, fontanaNettuno.lat, fontanaNettuno.lng);
    expect(dist).toBeGreaterThan(30);
    const isWithinRadius = dist <= 30;
    expect(isWithinRadius).toBe(false);
  });

  test('TC-GEO-4: Calcola distanze realistiche su scala urbana (Piazza Duomo -> Piazza Dante ~550m)', () => {
    const piazzaDante = { lat: 46.0718, lng: 11.1197 };
    const dist = getDistanceMeters(piazzaDuomo.lat, piazzaDuomo.lng, piazzaDante.lat, piazzaDante.lng);
    expect(dist).toBeGreaterThan(450);
    expect(dist).toBeLessThan(650);
  });
});
