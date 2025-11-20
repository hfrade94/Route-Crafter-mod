# Configuração do Git para Windows

## Passo 1: Verificar Instalação do Git

Após instalar o Git, você precisa **reiniciar o PowerShell** ou adicionar o Git ao PATH manualmente.

### Opção A: Reiniciar o PowerShell
1. Feche completamente o PowerShell atual
2. Abra um novo PowerShell
3. Execute: `git --version`

### Opção B: Adicionar ao PATH Manualmente
1. Pressione `Win + R`
2. Digite: `sysdm.cpl` e pressione Enter
3. Vá em "Avançado" → "Variáveis de Ambiente"
4. Em "Variáveis do sistema", encontre "Path" e clique em "Editar"
5. Adicione: `C:\Program Files\Git\bin` (ou o caminho onde o Git foi instalado)
6. Clique em "OK" em todas as janelas
7. **Reinicie o PowerShell**

## Passo 2: Configurar Git com suas Credenciais

Abra um **novo PowerShell** e execute:

```powershell
# Configurar seu nome (pode ser seu nome real ou username do GitHub)
git config --global user.name "hfrade94"

# Configurar seu email (use o email associado à sua conta GitHub)
# IMPORTANTE: Use o email da sua conta GitHub!
git config --global user.email "seu-email@exemplo.com"

# Verificar configuração
git config --global --list
```

**Nota:** O email deve ser o mesmo usado na sua conta GitHub (https://github.com/hfrade94) para que os commits sejam associados à sua conta.

## Passo 3: Configurar Autenticação GitHub

### Método 1: Personal Access Token (Recomendado)

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome: "Route-Crafter-mod"
4. Selecione o escopo: `repo` (marca todas as opções de repo)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você só verá ele uma vez!)
7. Quando fizer `git push`, use:
   - Username: `hfrade94`
   - Password: **cole o token** (não sua senha do GitHub)

### Método 2: GitHub CLI (Mais Fácil)

```powershell
# Instalar GitHub CLI (se não tiver)
winget install GitHub.cli

# Autenticar
gh auth login

# Seguir as instruções na tela
```

## Passo 4: Verificar Tudo

```powershell
# Verificar versão do Git
git --version

# Verificar configuração
git config --global --list

# Testar conexão com GitHub (se tiver GitHub CLI)
gh auth status
```

## Próximo Passo: Criar e Fazer Push do Repositório

Após configurar, execute:

```powershell
# Na pasta do projeto
cd "C:\Users\henri\Desktop\Planejamento vias - Maceió\Route-Crafter-mod"

# Ou use o script automático
.\setup-github-repo.ps1
```

## Troubleshooting

### Git não encontrado após instalação
- Reinicie o PowerShell/terminal
- Verifique se o Git está em: `C:\Program Files\Git\bin\git.exe`
- Adicione manualmente ao PATH (veja Opção B acima)

### Erro de autenticação no push
- Use Personal Access Token ao invés de senha
- Ou configure GitHub CLI: `gh auth login`

### Email não aparece no perfil GitHub
- Verifique se o email está configurado: https://github.com/settings/emails
- Use o mesmo email no `git config --global user.email`

