/**
 * Script de diagnóstico para el CRM y WhatsApp
 * Ejecutar con: node diagnostico-crm.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

const DASHBOARD_URL = 'https://dashboard-galle-git-fea-98639c-galleaprobaciones-9369s-projects.vercel.app';
const GATEWAY_URL = 'http://31.220.58.83:3010';

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
    log('🔍 DIAGNÓSTICO CRM + WhatsApp');
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

    // 2. Verificar endpoint de chats
    log('\n2️⃣ Verificando endpoint /chats del Gateway...');
    const chatsTest = await fetch(`${GATEWAY_URL}/chats`);
    log('   Status: ' + (chatsTest.status || chatsTest.error));
    if (chatsTest.data) {
        log('   Chats: ' + (chatsTest.data.chats?.length || chatsTest.data.count || 0));
        log('   Response: ' + JSON.stringify(chatsTest.data).substring(0, 300));
    }

    // 3. Verificar webhook del Dashboard
    log('\n3️⃣ Verificando webhook del Dashboard...');
    const webhookTest = await fetch(`${DASHBOARD_URL}/api/whatsapp/webhook`);
    log('   Status: ' + (webhookTest.status || webhookTest.error));

    // 4. Probar enviar al webhook
    log('\n4️⃣ Probando enviar mensaje de prueba al webhook...');
    const testMessage = {
        event: 'messages.upsert',
        timestamp: new Date().toISOString(),
        session: 'default',
        data: {
            message: {
                key: { remoteJid: '573009998877@s.whatsapp.net', fromMe: false },
                from: '573009998877@s.whatsapp.net',
                pushName: 'Usuario de Prueba Webhook',
                body: 'Mensaje de prueba desde diagnóstico ' + Date.now(),
                type: 'text',
                timestamp: Date.now(),
                fromMe: false
            }
        }
    };

    const webhookPost = await fetch(`${DASHBOARD_URL}/api/whatsapp/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: testMessage
    });
    log('   Status: ' + (webhookPost.status || webhookPost.error));
    log('   Response: ' + JSON.stringify(webhookPost.data || webhookPost.error));

    // 5. Verificar API de conversaciones
    log('\n5️⃣ Verificando API de conversaciones...');
    const convTest = await fetch(`${DASHBOARD_URL}/api/crm/conversations`);
    log('   Status: ' + (convTest.status || convTest.error));
    if (convTest.data) {
        log('   Total conversaciones: ' + (convTest.data.conversations?.length || 0));
        log('   OK: ' + convTest.data.ok);
        if (convTest.data.conversations) {
            log('   Últimas conversaciones:');
            convTest.data.conversations.slice(0, 3).forEach(c => {
                log('     - ' + (c.client_name || c.phone) + ': ' + (c.last_message || '').substring(0, 40));
            });
        }
    }

    log('\n' + '='.repeat(50));
    log('✅ Diagnóstico completado');

    // Guardar resultado
    fs.writeFileSync('C:/Users/USUARIO/WebstormProjects/dashboard/diagnostico-resultado.txt', output.join('\n'));
    log('\n📁 Resultado guardado en diagnostico-resultado.txt');
}

main().catch(e => {
    log('ERROR: ' + e.message);
    fs.writeFileSync('C:/Users/USUARIO/WebstormProjects/dashboard/diagnostico-resultado.txt', output.join('\n'));
});
