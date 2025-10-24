// Script de prueba para verificar adsets de Meta API
const adAccountId = "act_120238363645280102"; // Cuenta publicitaria

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v24.0";
const GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const TOKEN = process.env.META_SYSTEM_USER_TOKEN || process.env.META_ACCESS_TOKEN || "";

async function testAdsets() {
  console.log("\n=== PROBANDO ADSETS DE LA CUENTA PUBLICITARIA ===");
  console.log("Ad Account ID:", adAccountId);
  console.log("Token disponible:", TOKEN ? "SÍ" : "NO");

  if (!TOKEN) {
    console.error("❌ ERROR: No hay token de Meta configurado");
    return;
  }

  try {
    // 1. Obtener TODAS las campañas de la cuenta
    console.log("\n1️⃣  Obteniendo todas las campañas de la cuenta...");
    const campaignsUrl = `${GRAPH}/${adAccountId}/campaigns?fields=id,name,effective_status,status&access_token=${TOKEN}&limit=100`;
    console.log("URL:", campaignsUrl.replace(TOKEN, "***TOKEN***"));

    const campaignsRes = await fetch(campaignsUrl);
    const campaignsData = await campaignsRes.json();

    console.log("\nRespuesta de campañas:");
    console.log(JSON.stringify(campaignsData, null, 2));

    if (campaignsData.error) {
      console.error("\n❌ ERROR obteniendo campañas:", campaignsData.error.message);
      return;
    }

    const campaigns = campaignsData.data || [];
    console.log(`\n✅ Se encontraron ${campaigns.length} campañas`);

    // 2. Para cada campaña, obtener sus adsets
    for (const campaign of campaigns) {
      console.log(`\n\n========================================`);
      console.log(`📊 CAMPAÑA: ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Estado: ${campaign.effective_status || campaign.status}`);
      console.log(`========================================`);

      // Obtener adsets de esta campaña
      const adsetsUrl = `${GRAPH}/${campaign.id}/adsets?fields=id,name,effective_status,status,daily_budget,lifetime_budget&access_token=${TOKEN}&limit=100`;

      const adsetsRes = await fetch(adsetsUrl);
      const adsetsData = await adsetsRes.json();

      if (adsetsData.error) {
        console.error(`   ❌ Error obteniendo adsets:`, adsetsData.error.message);
        continue;
      }

      const adsets = adsetsData.data || [];

      if (adsets.length === 0) {
        console.log(`   ⚠️  Esta campaña NO tiene conjuntos de anuncios`);
        console.log(`   ℹ️  Los anuncios están directamente en la campaña`);
      } else {
        console.log(`   ✅ Conjuntos de anuncios encontrados: ${adsets.length}`);
        adsets.forEach((adset, idx) => {
          const budget = adset.daily_budget || adset.lifetime_budget || 0;
          console.log(`      ${idx + 1}. "${adset.name}"`);
          console.log(`         ID: ${adset.id}`);
          console.log(`         Estado: ${adset.effective_status || adset.status}`);
          console.log(`         Presupuesto: $${(Number(budget) / 100).toFixed(2)}`);
        });
      }
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
  }
}

testAdsets();

