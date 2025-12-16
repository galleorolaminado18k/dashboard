/**
 * Script de diagnóstico para el CRM y WhatsApp
 * Ejecutar con: node diagnostico-crm.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

const DASHBOARD_URL = 'https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app';
const GATEWAY_URL = 'http://31.220.58.83:3010';

// Nuevo endpoint público
const WEBHOOK_PUBLIC = `${DASHBOARD_URL}/api/webhook-public`;

const output = [];
function log(msg) {
    console.log(msg);
    output.push(msg);
}

async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const lib = isHttps ? https : http;

        const req = lib.request(url, {
            method: options.method || 'GET',
            headers: options.headers || { 'Content-Type': 'application/json' },
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ ok: res.statusCode < 400, status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ ok: res.statusCode < 400, status: res.statusCode, data });
                }
            });
        });

        req.on('error', (e) => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

async function main() {
    log('🔍 DIAGNÓSTICO CRM + WhatsApp v2');
    log('Fecha: ' + new Date().toISOString());
    log('='.repeat(50));

    // 1. Verificar Gateway
    log('\n1️⃣ Verificando Gateway de WhatsApp...');
    const gatewayTest = await fetch(`${GATEWAY_URL}/status`);
    log('   Status: ' + (gatewayTest.status || gatewayTest.error));
    if (gatewayTest.data) {
        log('   Conectado: ' + gatewayTest.data.isConnected);
        log('   Teléfono: ' + gatewayTest.data.phone);
    }

    // 2. Verificar webhook PÚBLICO
    log('\n2️⃣ Verificando webhook PÚBLICO...');
    const webhookPublic = await fetch(WEBHOOK_PUBLIC);
    log('   URL: ' + WEBHOOK_PUBLIC);
    log('   Status: ' + (webhookPublic.status || webhookPublic.error));
    log('   Response: ' + JSON.stringify(webhookPublic.data || {}).substring(0, 100));

    // 3. Probar enviar mensaje al webhook público
    log('\n3️⃣ Probando enviar mensaje al webhook público...');
    const testMessage = {
        event: 'messages.upsert',
        timestamp: new Date().toISOString(),
        session: 'default',
        data: {
            message: {
                key: { remoteJid: '573007778899@s.whatsapp.net', fromMe: false },
                from: '573007778899@s.whatsapp.net',
                pushName: 'Test WhatsApp User',
                body: 'Mensaje de prueba REAL ' + new Date().toLocaleTimeString(),
                type: 'text',
                timestamp: Date.now(),
                fromMe: false
            }
        }
    };

    const webhookPost = await fetch(WEBHOOK_PUBLIC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testMessage
    });
    log('   Status: ' + (webhookPost.status || webhookPost.error));
    log('   Response: ' + JSON.stringify(webhookPost.data || webhookPost.error));

    // 4. Verificar conversaciones
    log('\n4️⃣ Verificando conversaciones en CRM...');
    const convTest = await fetch(`${DASHBOARD_URL}/api/crm/conversations`);
    log('   Status: ' + (convTest.status || convTest.error));
    if (convTest.data && convTest.data.conversations) {
        log('   Total: ' + convTest.data.conversations.length);
        convTest.data.conversations.slice(0, 5).forEach(c => {
            log('     - ' + (c.client_name || c.phone) + ': ' + (c.last_message || '').substring(0, 40));
        });
    }

    log('\n' + '='.repeat(50));

    // Resumen
    log('\n📋 RESUMEN:');
    if (gatewayTest.data?.isConnected) {
        log('   ✅ Gateway CONECTADO');
    } else {
        log('   ❌ Gateway NO conectado');
    }

    if (webhookPublic.ok) {
        log('   ✅ Webhook público FUNCIONA');
    } else {
        log('   ❌ Webhook público NO funciona');
    }

    if (webhookPost.ok && webhookPost.data?.ok) {
        log('   ✅ Mensajes se guardan correctamente');
    } else {
        log('   ❌ Error guardando mensajes');
    }

    log('\n✅ Diagnóstico completado');

    // Guardar resultado
    fs.writeFileSync('C:/Users/USUARIO/WebstormProjects/dashboard/diagnostico-resultado.txt', output.join('\n'));
}

main().catch(e => {
    log('ERROR: ' + e.message);
    fs.writeFileSync('C:/Users/USUARIO/WebstormProjects/dashboard/diagnostico-resultado.txt', output.join('\n'));
});
