# Script para criar e fazer push do repositório no GitHub
# Execute este script após instalar o Git

Write-Host "Configurando repositório Git e fazendo push para GitHub..." -ForegroundColor Green

# Função para encontrar e executar Git
function Get-GitCommand {
    # Tentar encontrar git no PATH
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCmd) {
        return "git"
    }
    
    # Tentar caminhos comuns de instalação
    $gitPaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
    )
    
    foreach ($path in $gitPaths) {
        if (Test-Path $path) {
            return $path
        }
    }
    
    return $null
}

# Obter comando Git
$gitCmd = Get-GitCommand
if (-not $gitCmd) {
    Write-Host "ERRO: Git não está instalado ou não foi encontrado." -ForegroundColor Red
    Write-Host "Por favor, instale o Git de https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "E reinicie o PowerShell após a instalação." -ForegroundColor Yellow
    exit 1
}

Write-Host "Git encontrado: $gitCmd" -ForegroundColor Green

# Nome do repositório (você pode alterar)
$repoName = "Route-Crafter-mod"
$githubUser = "hfrade94"

# Verificar se já é um repositório Git
if (-not (Test-Path .git)) {
    Write-Host "Inicializando repositório Git..." -ForegroundColor Yellow
    & $gitCmd init
    & $gitCmd branch -M main
}

# Verificar se há um remote configurado
$remoteUrl = & $gitCmd remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Configurando remote do GitHub..." -ForegroundColor Yellow
    Write-Host "NOTA: Você precisa criar o repositório no GitHub primeiro!" -ForegroundColor Cyan
    Write-Host "1. Acesse: https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Crie um repositório chamado: $repoName" -ForegroundColor Cyan
    Write-Host "3. NÃO inicialize com README, .gitignore ou license" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Pressione Enter após criar o repositório..." -ForegroundColor Yellow
    Read-Host
    
    & $gitCmd remote add origin "https://github.com/$githubUser/$repoName.git"
}

# Adicionar todos os arquivos
Write-Host "Adicionando arquivos ao Git..." -ForegroundColor Yellow
& $gitCmd add .

# Fazer commit
Write-Host "Fazendo commit..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: Route Crafter modificado com melhorias

- Adicionado Trim Mode para remover segmentos indesejados
- Otimização de rotatórias para evitar múltiplas voltas
- Setas de direção nas vias
- Melhorias na interface e correções de bugs

Baseado em: https://github.com/seen-one/Route-Crafter
"@
& $gitCmd commit -m $commitMessage

# Fazer push
Write-Host "Fazendo push para GitHub..." -ForegroundColor Yellow
Write-Host "NOTA: Se pedir credenciais, use:" -ForegroundColor Yellow
Write-Host "  Username: hfrade94" -ForegroundColor Cyan
Write-Host "  Password: Seu Personal Access Token (não sua senha!)" -ForegroundColor Cyan
Write-Host "  Obtenha em: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""
& $gitCmd push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repositório criado e atualizado com sucesso!" -ForegroundColor Green
    Write-Host "URL: https://github.com/$githubUser/$repoName" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao fazer push. Verifique suas credenciais do GitHub." -ForegroundColor Red
    Write-Host "Você pode precisar configurar autenticação:" -ForegroundColor Yellow
    Write-Host "  git config --global user.name 'Seu Nome'" -ForegroundColor Yellow
    Write-Host "  git config --global user.email 'seu@email.com'" -ForegroundColor Yellow
}

