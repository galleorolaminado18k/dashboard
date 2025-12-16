const { execSync } = require('child_process');

process.chdir('C:/Users/USUARIO/WebstormProjects/dashboard');

try {
    console.log('📁 Agregando cambios...');
    execSync('git add -A', { stdio: 'inherit' });
    
    console.log('\n📝 Haciendo commit...');
    execSync('git commit -m "feat: CRM integration with WhatsApp webhook"', { stdio: 'inherit' });
    
    console.log('\n🚀 Subiendo a GitHub...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('\n✅ ¡Cambios subidos exitosamente!');
} catch (error) {
    if (error.message.includes('nothing to commit')) {
        console.log('\n✅ No hay cambios nuevos para subir');
    } else {
        console.log('\n⚠️ Info:', error.message);
    }
}

