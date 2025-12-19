#!/usr/bin/expect -f

# Script expect para automatizar instalación SSH
set timeout -1

# Configuración
set vps_ip "31.220.58.83"
set vps_user "root"
set vps_pass "S@ntiago"

puts "========================================"
puts "🚀 INSTALANDO WAHA EN VPS"
puts "========================================\n"

# Conectar SSH
spawn ssh -o StrictHostKeyChecking=no $vps_user@$vps_ip

# Esperar prompt de contraseña
expect {
    "password:" {
        send "$vps_pass\r"
    }
}

# Esperar prompt de root
expect "#"

puts "\n📦 Actualizando sistema..."
send "apt update -y\r"
expect "#"

puts "\n📦 Instalando paquetes..."
send "DEBIAN_FRONTEND=noninteractive apt install -y curl docker.io docker-compose ufw\r"
expect "#"

puts "\n🐋 Iniciando Docker..."
send "systemctl start docker\r"
expect "#"
send "systemctl enable docker\r"
expect "#"

puts "\n🔥 Configurando firewall..."
send "ufw --force enable\r"
expect "#"
send "ufw allow 22/tcp\r"
expect "#"
send "ufw allow 3000/tcp\r"
expect "#"

puts "\n📁 Creando directorio..."
send "mkdir -p /opt/waha\r"
expect "#"
send "cd /opt/waha\r"
expect "#"

puts "\n📝 Creando docker-compose.yml..."
send "cat > docker-compose.yml <<'EOF'\r"
send "version: '3.8'\r"
send "services:\r"
send "  waha:\r"
send "    image: devlikeapro/waha:latest\r"
send "    container_name: waha-production\r"
send "    restart: unless-stopped\r"
send "    ports:\r"
send "      - \"3000:3000\"\r"
send "    volumes:\r"
send "      - ./data:/app/data\r"
send "    environment:\r"
send "      - WAHA_HTTP_API_HOST=0.0.0.0\r"
send "      - WAHA_LICENSE_ACCEPT=true\r"
send "      - WAHA_LOG_LEVEL=info\r"
send "      - WAHA_MULTI_DEVICE=true\r"
send "EOF\r"
expect "#"

puts "\n🚀 Iniciando WAHA..."
send "docker-compose up -d\r"
expect "#"

puts "\n⏳ Esperando 30 segundos..."
send "sleep 30\r"
expect "#"

puts "\n🧪 Verificando..."
send "curl -s http://localhost:3000/health\r"
expect "#"

puts "\n📍 URL pública..."
send "echo \"URL: http://\$(curl -s ifconfig.me):3000\"\r"
expect "#"

puts "\n\n========================================"
puts "✅ INSTALACIÓN COMPLETADA"
puts "========================================\n"
puts "URL de WAHA: http://31.220.58.83:3000\n"
puts "Configurar en Vercel:"
puts "WAHA_BASE_URL = http://31.220.58.83:3000\n"
puts "========================================\n"

# Salir
send "exit\r"
expect eof

