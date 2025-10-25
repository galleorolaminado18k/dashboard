// Script de diagnóstico COMPLETO para adsets
const TOKEN = "EAAC4zHE6iMYBPyAfQdgGZByZBpc8qBfGn0LS7P3qxYt33fLJmy3bKWnd4XoZCYphPiOLMZCGfbqLJO3TzVqGUd0ccf09Yxm8YWoe18yNZAPl4ttygN94PuDZBhKb2wbnFMTS4oPfdRfDHXiYGQXZAMrPQva4E1zSI1P8ku8uAWYZC7ZBW7Qhacpfprc0byjKBxMtTpwZDZD";
const GRAPH = "https://graph.facebook.com/v24.0";

// IDs que veo en tus imágenes
const campaignIds = [
  "120238463372390102", // Campaña de Oro 18K
  "120238363645280102"  // Campaña de Socios
];

async function diagnose() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  DIAGNÓSTICO COMPLETO DE CONJUNTOS DE ANUNCIOS             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  for (const campaignId of campaignIds) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 1. Verificar que la campaña existe
    console.log(`\n[PASO 1] Verificando campaña: ${campaignId}`);
    const campaignUrl = `${GRAPH}/${campaignId}?fields=id,name,status,effective_status,objective&access_token=${TOKEN}`;

    try {
      const campaignRes = await fetch(campaignUrl);
      const campaign = await campaignRes.json();

      if (campaign.error) {
        console.log(`❌ ERROR: ${campaign.error.message}`);
        continue;
      }

      console.log(`✅ Campaña encontrada:`);
      console.log(`   Nombre: ${campaign.name}`);
      console.log(`   Estado: ${campaign.effective_status || campaign.status}`);
      console.log(`   Objetivo: ${campaign.objective || 'N/A'}`);

      // 2. Intentar obtener adsets con DIFERENTES métodos
      console.log(`\n[PASO 2] Intentando obtener adsets...`);

      // Método 1: Sin filtros
      console.log(`\n   Método 1: Sin filtros`);
      const adsets1Url = `${GRAPH}/${campaignId}/adsets?fields=id,name,effective_status,status&access_token=${TOKEN}&limit=100`;
      const adsets1Res = await fetch(adsets1Url);
      const adsets1 = await adsets1Res.json();

      if (adsets1.error) {
        console.log(`   ❌ Error: ${adsets1.error.message}`);
      } else {
        console.log(`   ✅ Respuesta recibida: ${adsets1.data?.length || 0} adsets`);
        if (adsets1.data && adsets1.data.length > 0) {
          adsets1.data.forEach((a, i) => {
            console.log(`      ${i+1}. "${a.name}" (${a.id}) - ${a.effective_status}`);
          });
        }
      }

      // Método 2: Con filtro ACTIVE
      console.log(`\n   Método 2: Solo ACTIVE`);
      const adsets2Url = `${GRAPH}/${campaignId}/adsets?fields=id,name,effective_status,status&effective_status=["ACTIVE"]&access_token=${TOKEN}&limit=100`;
      const adsets2Res = await fetch(adsets2Url);
      const adsets2 = await adsets2Res.json();

      if (adsets2.error) {
        console.log(`   ❌ Error: ${adsets2.error.message}`);
      } else {
        console.log(`   ✅ Respuesta recibida: ${adsets2.data?.length || 0} adsets activos`);
      }

      // Método 3: Con filtro PAUSED
      console.log(`\n   Método 3: Solo PAUSED`);
      const adsets3Url = `${GRAPH}/${campaignId}/adsets?fields=id,name,effective_status,status&effective_status=["PAUSED"]&access_token=${TOKEN}&limit=100`;
      const adsets3Res = await fetch(adsets3Url);
      const adsets3 = await adsets3Res.json();

      if (adsets3.error) {
        console.log(`   ❌ Error: ${adsets3.error.message}`);
      } else {
        console.log(`   ✅ Respuesta recibida: ${adsets3.data?.length || 0} adsets pausados`);
      }

      // 3. Verificar los anuncios directamente
      console.log(`\n[PASO 3] Verificando anuncios de la campaña...`);
      const adsUrl = `${GRAPH}/${campaignId}/ads?fields=id,name,effective_status&access_token=${TOKEN}&limit=10`;
      const adsRes = await fetch(adsUrl);
      const ads = await adsRes.json();

      if (ads.error) {
        console.log(`   ❌ Error: ${ads.error.message}`);
      } else {
        console.log(`   ✅ Anuncios encontrados: ${ads.data?.length || 0}`);
        if (ads.data && ads.data.length > 0) {
          ads.data.forEach((a, i) => {
            console.log(`      ${i+1}. "${a.name}" (${a.id})`);
          });
        }
      }

      // 4. CONCLUSIÓN
      console.log(`\n[CONCLUSIÓN]`);
      const totalAdsets = (adsets1.data?.length || 0) + (adsets2.data?.length || 0) + (adsets3.data?.length || 0);

      if (totalAdsets === 0 && ads.data?.length > 0) {
        console.log(`   🔍 RESULTADO: La campaña "${campaign.name}" tiene ${ads.data.length} anuncios`);
        console.log(`   📌 ESTRUCTURA: Campaña → Anuncios (SIN conjuntos de anuncios intermedios)`);
        console.log(`   ℹ️  EXPLICACIÓN: Esta es una estructura válida en Meta Ads.`);
        console.log(`   ✅ SOLUCIÓN: Los anuncios se ven en la pestaña "Anuncios", NO en "Conjuntos de anuncios"`);
      } else if (totalAdsets > 0) {
        console.log(`   ✅ La campaña SÍ tiene ${totalAdsets} conjuntos de anuncios`);
        console.log(`   🔧 ACCIÓN: Revisar por qué no aparecen en el dashboard`);
      } else {
        console.log(`   ⚠️  La campaña no tiene ni adsets ni anuncios configurados`);
      }

    } catch (error) {
      console.error(`❌ ERROR CRÍTICO:`, error.message);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

diagnose();

