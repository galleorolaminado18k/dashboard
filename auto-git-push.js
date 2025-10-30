#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

const projectPath = path.resolve(__dirname);

function executeGitCommands() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    console.log('🔄 Auto-push iniciado...');
    
    // Git add
    exec('git add .', { cwd: projectPath }, (error) => {
        if (error) {
            console.error('❌ Error en git add:', error);
            return;
        }
        
        console.log('✅ Archivos agregados');
        
        // Git commit
        const commitMessage = `auto: Cambios automáticos ${timestamp}`;
        exec(`git commit -m "${commitMessage}"`, { cwd: projectPath }, (error, stdout) => {
            if (error) {
                if (error.message.includes('nothing to commit')) {
                    console.log('✓ No hay cambios para commit');
                    return;
                }
                console.error('❌ Error en git commit:', error);
                return;
            }
            
            console.log('✅ Commit creado:', commitMessage);
            
            // Git push
            exec('git push', { cwd: projectPath }, (error) => {
                if (error) {
                    console.error('❌ Error en git push:', error);
                    return;
                }
                
                console.log('✅ Push completado exitosamente');
                console.log('🎉 Auto-push finalizado');
            });
        });
    });
}

// Ejecutar inmediatamente
executeGitCommands();

// Exportar para uso en otros scripts
module.exports = { executeGitCommands };

