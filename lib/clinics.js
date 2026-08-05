/* Krąg — ośrodki leczące HIV w Polsce (poradnie ARV / niedoborów odporności).
 * Źródło: Krajowe Centrum ds. AIDS (gov.pl/web/aids/placowki-medyczne-prowadzace-leczenie-arv).
 * Dane bywają nieaktualne — zawsze podpowiadamy telefon i prosimy o potwierdzenie.
 * Wszystko działa lokalnie; nic nie idzie na serwer. Nazwy/adresy zostają po polsku (fakty).
 * Współrzędne miast (środek) służą tylko do LOKALNEGO liczenia „najbliżej" — nie wychodzą z urządzenia.
 */
export function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
}

// stems = rdzenie odmiany miasta (dopasowanie po fragmencie, odporne na przypadki).
export const CLINICS = [
  { city: 'Warszawa', lat: 52.23, lng: 21.01, stems: ['warszaw'], list: [
    { name: 'Wojewódzki Szpital Zakaźny — Poradnia', addr: 'ul. Wolska 37, 01-201 Warszawa', tel: '22 335 81 01' },
    { name: 'Klinika Chorób Zakaźnych Wieku Dziecięcego', addr: 'ul. Wolska 37, 01-201 Warszawa', tel: '22 335 52 50', kids: true },
  ] },
  { city: 'Kraków', lat: 50.06, lng: 19.94, stems: ['krakow'], list: [
    { name: 'Poradnia Nabytych Niedoborów Odporności', addr: 'ul. Śniadeckich 10 (II p.), 31-531 Kraków', tel: '12 424 89 11' },
    { name: 'Poradnia Chorób Zakaźnych Dzieci', addr: 'os. Na Skarpie 67, 31-913 Kraków', tel: '12 622 94 63', kids: true },
  ] },
  { city: 'Wrocław', lat: 51.11, lng: 17.03, stems: ['wroclaw'], list: [
    { name: 'Poradnia Profilaktyczno-Lecznicza Niedoborów Odporności', addr: 'ul. Koszarowa 5, 51-149 Wrocław', tel: '71 700 30 00' },
    { name: 'Poradnia Profilaktyczno-Lecznicza', addr: 'ul. Wszystkich Świętych 2, 50-136 Wrocław', tel: '71 356 07 80' },
    { name: 'Klinika Pediatrii i Chorób Infekcyjnych', addr: 'ul. Chałubińskiego 2-2a, 50-368 Wrocław', tel: '71 770 31 55', kids: true },
  ] },
  { city: 'Poznań', lat: 52.41, lng: 16.93, stems: ['poznan'], list: [
    { name: 'Poradnia Nabytych Niedoborów Odporności', addr: 'ul. Szwajcarska 3, 61-285 Poznań', tel: '61 873 93 15' },
    { name: 'Poradnia Chorób Zakaźnych (dzieci)', addr: 'ul. Szpitalna 27/33, 60-572 Poznań', tel: '61 849 13 62', kids: true },
  ] },
  { city: 'Gdańsk', lat: 54.35, lng: 18.65, stems: ['gdansk'], list: [
    { name: 'Poradnia Leczenia Nabytych Niedoborów Odporności', addr: 'ul. Smoluchowskiego 18, 80-214 Gdańsk', tel: '58 341 40 41 wew. 330' },
    { name: 'Poradnia Chorób Zakaźnych dla Dzieci', addr: 'al. Jana Pawła II 50, 80-462 Gdańsk', tel: '58 772 39 50', kids: true },
  ] },
  { city: 'Gdynia', lat: 54.52, lng: 18.53, stems: ['gdyni'], list: [
    { name: 'Poradnia Profilaktyczno-lecznicza', addr: 'ul. Powstania Styczniowego 9b, 81-519 Gdynia', tel: '58 699 86 82' },
  ] },
  { city: 'Łódź', lat: 51.76, lng: 19.46, stems: ['lodz'], list: [
    { name: 'Poradnia Nabytych Zaburzeń Odporności', addr: 'ul. Kniaziewicza 1/5, 91-347 Łódź', tel: '42 251 61 24' },
  ] },
  { city: 'Chorzów (Śląsk)', lat: 50.30, lng: 18.95, stems: ['chorzow', 'katowic', 'slask', 'bytom', 'sosnow', 'gliwic', 'zabrz', 'tychy', 'tychach', 'rybnik', 'ruda slask', 'dabrowa gorn', 'jaworzn', 'myslowic', 'siemianowic', 'bedzin', 'piekary'], list: [
    { name: 'Poradnia Diagnostyki i Leczenia Nabytych Niedoborów Odporności', addr: 'ul. Zjednoczenia 10, 41-500 Chorzów', tel: '32 346 36 19' },
  ] },
  { city: 'Szczecin', lat: 53.43, lng: 14.55, stems: ['szczecin'], list: [
    { name: 'Poradnia Nabytych Niedoborów Immunologicznych', addr: 'ul. Arkońska 4, bud. K, 71-455 Szczecin', tel: '91 813 93 42' },
  ] },
  { city: 'Białystok', lat: 53.13, lng: 23.16, stems: ['bialystok', 'bialymstok', 'suwalk', 'lomz'], list: [
    { name: 'Punkt Konsultacyjny dla Dorosłych Zakażonych HIV', addr: 'ul. Żurawia 14, 15-540 Białystok', tel: '85 831 64 46' },
  ] },
  { city: 'Lublin', lat: 51.25, lng: 22.57, stems: ['lublin', 'zamosc', 'chelm', 'zamosci'], list: [
    { name: 'Poradnia Diagnostyczno-Lecznicza', addr: 'ul. Staszica 11, 20-081 Lublin', tel: '81 534 22 88' },
  ] },
  { city: 'Bydgoszcz', lat: 53.12, lng: 18.01, stems: ['bydgoszcz', 'torun', 'wloclaw', 'grudziadz'], list: [
    { name: 'Wojewódzka Przychodnia Chorób Zakaźnych', addr: 'ul. Kurpińskiego 5a, 85-096 Bydgoszcz', tel: '52 304 56 40' },
  ] },
  { city: 'Opole', lat: 50.67, lng: 17.93, stems: ['opol', 'kedzierzyn', 'nys'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Kośnego 53, 45-372 Opole', tel: '77 443 36 98' },
  ] },
  { city: 'Zielona Góra', lat: 51.94, lng: 15.51, stems: ['zielon', 'gorzow'], list: [
    { name: 'Poradnia Niedoborów Immunologicznych', addr: 'ul. Zyty 26, 65-046 Zielona Góra', tel: '68 329 62 00' },
  ] },
  { city: 'Łańcut (Podkarpacie)', lat: 50.07, lng: 22.23, stems: ['lancu', 'rzeszow', 'podkarpac', 'przemysl', 'stalowa wol', 'tarnobrzeg', 'krosn'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Paderewskiego 5, 37-100 Łańcut', tel: '17 224 02 44' },
  ] },
  { city: 'Ostróda (Warmia-Mazury)', lat: 53.70, lng: 19.97, stems: ['ostrod', 'olsztyn', 'warmi', 'mazur', 'elblag'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Wł. Jagiełły 1, 14-100 Ostróda', tel: '89 544 45 45' },
  ] },
];

export const CLINIC_CITIES = CLINICS.map((c) => c.city);

// Współrzędne miast BEZ własnej poradni — do wskazania najbliższej (liczone lokalnie).
// Wiele dużych miast już objętych „stems" powyżej (np. Katowice/Rzeszów/Toruń/Olsztyn).
const CITY_COORDS = [
  { name: 'Częstochowa', stems: ['czestochow'], lat: 50.81, lng: 19.12 },
  { name: 'Radom', stems: ['radom'], lat: 51.40, lng: 21.15 },
  { name: 'Kielce', stems: ['kielc'], lat: 50.87, lng: 20.63 },
  { name: 'Koszalin', stems: ['koszalin'], lat: 54.19, lng: 16.18 },
  { name: 'Słupsk', stems: ['slupsk'], lat: 54.46, lng: 17.03 },
  { name: 'Kalisz', stems: ['kalisz'], lat: 51.76, lng: 18.09 },
  { name: 'Płock', stems: ['plock'], lat: 52.55, lng: 19.71 },
  { name: 'Wałbrzych', stems: ['walbrzych'], lat: 50.77, lng: 16.28 },
  { name: 'Legnica', stems: ['legnic'], lat: 51.21, lng: 16.16 },
  { name: 'Tarnów', stems: ['tarnow', 'tarnowie'], lat: 50.01, lng: 20.99 },
  { name: 'Nowy Sącz', stems: ['nowy sacz', 'nowym saczu'], lat: 49.62, lng: 20.69 },
  { name: 'Piła', stems: ['pila', 'pile'], lat: 53.15, lng: 16.74 },
];

function hav(la1, lo1, la2, lo2) {
  const R = 6371, d = Math.PI / 180;
  const dla = (la2 - la1) * d, dlo = (lo2 - lo1) * d;
  const a = Math.sin(dla / 2) ** 2 + Math.cos(la1 * d) * Math.cos(la2 * d) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Najbliższe poradnie wg współrzędnych (Haversine). Każdej doklejamy km. */
export function nearest(lat, lng, n = 2) {
  return CLINICS
    .map((c) => ({ ...c, km: Math.round(hav(lat, lng, c.lat, c.lng)) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

// Intencja „gdzie do lekarza / gdzie się leczyć / poradnia HIV" — przechwytujemy PRZED
// silnikiem faktów (żeby „lekarza" nie trafiało w „lek"/ARV).
export function wantsClinic(q) {
  const n = norm(q);
  return /gdzie.*(lekarz|lecz|poradni|osrod|specjalist)|do jakiego lekarza|jaka poradni|poradni.*(hiv|arv|zakaz)|osrodek.*arv|gdzie.*(arv|sie leczyc|leczyc hiv|leczy hiv)|gdzie mnie.*lecz|jaki lekarz.*hiv|lekarz od hiv/.test(n);
}

/** Rozwiąż zapytanie o placówkę: dokładne miasto → poradnie; inne miasto → NAJBLIŻSZE; brak → none. */
export function resolveClinics(q) {
  const n = norm(q);
  const direct = CLINICS.filter((c) => c.stems.some((s) => n.includes(s)));
  if (direct.length) return { mode: 'exact', groups: direct };
  const hit = CITY_COORDS.find((c) => c.stems.some((s) => n.includes(s)));
  if (hit) return { mode: 'nearest', city: hit.name, groups: nearest(hit.lat, hit.lng, 2) };
  return { mode: 'none', groups: [] };
}

/** Najbliższe poradnie wg lokalizacji urządzenia (współrzędne liczone lokalnie). */
export function resolveByCoords(lat, lng) {
  return { mode: 'nearby', groups: nearest(lat, lng, 3) };
}

// Zgodność wstecz (E2E/inne wywołania): zwróć same grupy dokładnego dopasowania.
export function findClinics(q) {
  const r = resolveClinics(q);
  return r.mode === 'none' ? [] : r.groups;
}
