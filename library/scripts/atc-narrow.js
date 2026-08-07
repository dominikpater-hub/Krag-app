/* atc-narrow.js — zawężenie zasięgu watchera (KROK 7).
 * Zmiana w rejestrze leków nie powinna podnosić wszystkich 25 wpisów z bloków
 * leczenie/prep, tylko te, które CYTUJĄ zmieniony lek. Wpisy z polem citesAtc
 * trafiane są precyzyjnie; wpisy bez tego pola spadają do zawężenia po bloku
 * (zachowanie sprzed zmiany), więc nic nie ginie.
 */
function narrow(changedAtc, entries, affectedBlocks){
  const hit=a=>changedAtc.some(c=>a.startsWith(c)||c.startsWith(a));
  const precise=[], fallback=[];
  for(const e of entries){
    const atc=e.citesAtc||[];
    if(atc.length){ if(atc.some(hit)) precise.push(e.id); }
    else if(affectedBlocks.includes(e.block)) fallback.push(e.id);
  }
  return {precise, fallback, total:precise.length+fallback.length};
}
module.exports={narrow};

if(require.main===module){
  // self-test bez sieci
  const E=[
    {id:'hiv-0022',block:'leczenie',citesAtc:['J05AJ03','J05AJ05']},
    {id:'hiv-0023',block:'leczenie',citesAtc:['J05AJ04','J05AG05']},
    {id:'hiv-0025',block:'leczenie'},              // bez citesAtc → fallback po bloku
    {id:'hiv-0106',block:'epidemiologia'},         // inny blok → pomijany
  ];
  const blocks=['leczenie','leczenie-pl','prep','prep-pl'];
  const r1=narrow(['J05AJ03'],E,blocks);   // zmiana dolutegrawiru
  const r2=narrow(['J05AF01'],E,blocks);   // zmiana zydowudyny (nikt nie cytuje wprost)
  const ok = r1.precise.includes('hiv-0022') && !r1.precise.includes('hiv-0023')
          && r1.fallback.includes('hiv-0025') && !r1.fallback.includes('hiv-0106')
          && r2.precise.length===0 && r2.fallback.includes('hiv-0025');
  console.log('zmiana dolutegrawiru:', JSON.stringify(r1));
  console.log('zmiana zydowudyny:   ', JSON.stringify(r2));
  console.log(ok?'✓ self-test OK — precyzja tam, gdzie znamy lek; fallback tam, gdzie nie':'✗ self-test FAIL');
  process.exit(ok?0:1);
}
