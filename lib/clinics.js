/* Krąg — ośrodki leczące HIV w Polsce (poradnie ARV / niedoborów odporności).
 * Źródło: Krajowe Centrum ds. AIDS (gov.pl/web/aids/placowki-medyczne-prowadzace-leczenie-arv).
 * Dane bywają nieaktualne — zawsze podpowiadamy telefon i prosimy o potwierdzenie.
 * Wszystko działa lokalnie; nic nie idzie na serwer. Nazwy/adresy zostają po polsku (fakty).
 */
export function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
}

// stems = rdzenie odmiany miasta (dopasowanie po fragmencie, odporne na przypadki).
export const CLINICS = [
  { city: 'Warszawa', stems: ['warszaw'], list: [
    { name: 'Wojewódzki Szpital Zakaźny — Poradnia', addr: 'ul. Wolska 37, 01-201 Warszawa', tel: '22 335 81 01' },
    { name: 'Klinika Chorób Zakaźnych Wieku Dziecięcego', addr: 'ul. Wolska 37, 01-201 Warszawa', tel: '22 335 52 50', kids: true },
  ] },
  { city: 'Kraków', stems: ['krakow'], list: [
    { name: 'Poradnia Nabytych Niedoborów Odporności', addr: 'ul. Śniadeckich 10 (II p.), 31-531 Kraków', tel: '12 424 89 11' },
    { name: 'Poradnia Chorób Zakaźnych Dzieci', addr: 'os. Na Skarpie 67, 31-913 Kraków', tel: '12 622 94 63', kids: true },
  ] },
  { city: 'Wrocław', stems: ['wroclaw'], list: [
    { name: 'Poradnia Profilaktyczno-Lecznicza Niedoborów Odporności', addr: 'ul. Koszarowa 5, 51-149 Wrocław', tel: '71 700 30 00' },
    { name: 'Poradnia Profilaktyczno-Lecznicza', addr: 'ul. Wszystkich Świętych 2, 50-136 Wrocław', tel: '71 356 07 80' },
    { name: 'Klinika Pediatrii i Chorób Infekcyjnych', addr: 'ul. Chałubińskiego 2-2a, 50-368 Wrocław', tel: '71 770 31 55', kids: true },
  ] },
  { city: 'Poznań', stems: ['poznan'], list: [
    { name: 'Poradnia Nabytych Niedoborów Odporności', addr: 'ul. Szwajcarska 3, 61-285 Poznań', tel: '61 873 93 15' },
    { name: 'Poradnia Chorób Zakaźnych (dzieci)', addr: 'ul. Szpitalna 27/33, 60-572 Poznań', tel: '61 849 13 62', kids: true },
  ] },
  { city: 'Gdańsk', stems: ['gdansk'], list: [
    { name: 'Poradnia Leczenia Nabytych Niedoborów Odporności', addr: 'ul. Smoluchowskiego 18, 80-214 Gdańsk', tel: '58 341 40 41 wew. 330' },
    { name: 'Poradnia Chorób Zakaźnych dla Dzieci', addr: 'al. Jana Pawła II 50, 80-462 Gdańsk', tel: '58 772 39 50', kids: true },
  ] },
  { city: 'Gdynia', stems: ['gdyni'], list: [
    { name: 'Poradnia Profilaktyczno-lecznicza', addr: 'ul. Powstania Styczniowego 9b, 81-519 Gdynia', tel: '58 699 86 82' },
  ] },
  { city: 'Łódź', stems: ['lodz'], list: [
    { name: 'Poradnia Nabytych Zaburzeń Odporności', addr: 'ul. Kniaziewicza 1/5, 91-347 Łódź', tel: '42 251 61 24' },
  ] },
  { city: 'Chorzów (Śląsk)', stems: ['chorzow', 'katowic', 'slask'], list: [
    { name: 'Poradnia Diagnostyki i Leczenia Nabytych Niedoborów Odporności', addr: 'ul. Zjednoczenia 10, 41-500 Chorzów', tel: '32 346 36 19' },
  ] },
  { city: 'Szczecin', stems: ['szczecin'], list: [
    { name: 'Poradnia Nabytych Niedoborów Immunologicznych', addr: 'ul. Arkońska 4, bud. K, 71-455 Szczecin', tel: '91 813 93 42' },
  ] },
  { city: 'Białystok', stems: ['bialystok', 'bialymstok'], list: [
    { name: 'Punkt Konsultacyjny dla Dorosłych Zakażonych HIV', addr: 'ul. Żurawia 14, 15-540 Białystok', tel: '85 831 64 46' },
  ] },
  { city: 'Lublin', stems: ['lublin'], list: [
    { name: 'Poradnia Diagnostyczno-Lecznicza', addr: 'ul. Staszica 11, 20-081 Lublin', tel: '81 534 22 88' },
  ] },
  { city: 'Bydgoszcz', stems: ['bydgoszcz'], list: [
    { name: 'Wojewódzka Przychodnia Chorób Zakaźnych', addr: 'ul. Kurpińskiego 5a, 85-096 Bydgoszcz', tel: '52 304 56 40' },
  ] },
  { city: 'Opole', stems: ['opol'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Kośnego 53, 45-372 Opole', tel: '77 443 36 98' },
  ] },
  { city: 'Zielona Góra', stems: ['zielon'], list: [
    { name: 'Poradnia Niedoborów Immunologicznych', addr: 'ul. Zyty 26, 65-046 Zielona Góra', tel: '68 329 62 00' },
  ] },
  { city: 'Łańcut (Podkarpacie)', stems: ['lancu', 'rzeszow', 'podkarpac'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Paderewskiego 5, 37-100 Łańcut', tel: '17 224 02 44' },
  ] },
  { city: 'Ostróda (Warmia-Mazury)', stems: ['ostrod', 'olsztyn', 'warmi', 'mazur'], list: [
    { name: 'Poradnia Chorób Zakaźnych', addr: 'ul. Wł. Jagiełły 1, 14-100 Ostróda', tel: '89 544 45 45' },
  ] },
];

export const CLINIC_CITIES = CLINICS.map((c) => c.city);

// Intencja „gdzie do lekarza / gdzie się leczyć / poradnia HIV" — przechwytujemy PRZED
// silnikiem faktów (żeby „lekarza" nie trafiało w „lek"/ARV).
export function wantsClinic(q) {
  const n = norm(q);
  return /gdzie.*(lekarz|lecz|poradni|osrod|specjalist)|do jakiego lekarza|jaka poradni|poradni.*(hiv|arv|zakaz)|osrodek.*arv|gdzie.*(arv|sie leczyc|leczyc hiv|leczy hiv)|gdzie mnie.*lecz|jaki lekarz.*hiv|lekarz od hiv/.test(n);
}

// Dopasowanie miasta w tekście (np. sama nazwa po pytaniu „w jakim mieście").
export function findClinics(q) {
  const n = norm(q);
  return CLINICS.filter((c) => c.stems.some((s) => n.includes(s)));
}
