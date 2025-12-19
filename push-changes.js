const { execSync } = require('child_process');

const dir = 'C:/Users/USUARIO/WebstormProjects/dashboard';

try {
    process.chdir(dir);
    console.log('📁 Directorio:', process.cwd());

    console.log('\n📝 Git status:');
    const status = execSync('git status --short', { encoding: 'utf8' });
    console.log(status || '(sin cambios)');

    if (status.trim()) {
        console.log('\n📁 Agregando cambios...');
        execSync('git add -A');

        console.log('📝 Haciendo commit...');
        execSync('git commit -m "feat: CRM sync and webhook integration"');

        console.log('🚀 Subiendo a GitHub...');
        const pushResult = execSync('git push 2>&1', { encoding: 'utf8' });
        console.log(pushResult);

        console.log('\n✅ ¡Cambios subidos exitosamente!');
    } else {
        console.log('\n✅ No hay cambios nuevos para subir');
    }
} catch (error) {
    console.log('\n⚠️ Error:', error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
}
