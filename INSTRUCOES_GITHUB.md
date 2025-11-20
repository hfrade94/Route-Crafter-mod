# Instruções para Criar Repositório no GitHub

## ⚠️ Importante: Créditos ao Projeto Original

Este projeto é baseado em [Route Crafter](https://github.com/seen-one/Route-Crafter) por [seen-one](https://github.com/seen-one).  
A licença MIT permite modificações e redistribuição, mas é importante dar crédito ao autor original.

O README.md já foi atualizado com os créditos apropriados.

## Pré-requisitos

1. **Instalar Git** (se ainda não tiver):
   - Baixe de: https://git-scm.com/download/win
   - Instale com as opções padrão

2. **Configurar Git** (primeira vez):
   ```powershell
   git config --global user.name "Seu Nome"
   git config --global user.email "seu@email.com"
   ```

## Opção 1: Usar o Script Automático

1. Execute o script PowerShell:
   ```powershell
   .\setup-github-repo.ps1
   ```

2. Siga as instruções na tela para criar o repositório no GitHub

## Opção 2: Fazer Manualmente

### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `Route-Crafter-mod` (ou outro nome de sua escolha)
3. **Descrição sugerida:** "Versão modificada do Route Crafter com melhorias e funcionalidades adicionais"
4. **NÃO** marque "Add a README file" (já temos um)
5. **NÃO** adicione .gitignore ou license (já temos)
6. Clique em "Create repository"

### Passo 2: Inicializar Git Localmente

Abra o PowerShell na pasta do projeto e execute:

```powershell
# Inicializar repositório
git init
git branch -M main

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit: Route Crafter modificado com melhorias

- Adicionado Trim Mode para remover segmentos indesejados
- Otimização de rotatórias para evitar múltiplas voltas
- Setas de direção nas vias
- Melhorias na interface e correções de bugs
- Baseado em: https://github.com/seen-one/Route-Crafter"

# Adicionar remote do GitHub (substitua pelo nome do seu repositório)
git remote add origin https://github.com/hfrade94/Route-Crafter-mod.git

# Fazer push
git push -u origin main
```

### Passo 3: Adicionar Tópicos no GitHub (Opcional)

Após criar o repositório, você pode adicionar tópicos como:
- `route-crafter`
- `gpx`
- `route-optimization`
- `chinese-postman-problem`
- `fork`

### Passo 4: Autenticação

Se pedir credenciais, você pode:

1. **Usar Personal Access Token** (recomendado):
   - Vá em: https://github.com/settings/tokens
   - Crie um novo token com permissão `repo`
   - Use o token como senha quando pedir

2. **Ou usar GitHub CLI**:
   ```powershell
   # Instalar GitHub CLI
   winget install GitHub.cli
   
   # Autenticar
   gh auth login
   ```

## Verificar

Após o push, acesse:
https://github.com/hfrade94/Route-Crafter-mod

## Próximos Commits

Para fazer commits futuros:

```powershell
git add .
git commit -m "Descrição das alterações"
git push
```

## Boas Práticas

1. **Sempre mantenha os créditos** ao projeto original no README
2. **Use commits descritivos** explicando as mudanças
3. **Considere abrir um Pull Request** no projeto original se suas melhorias forem úteis para outros usuários
