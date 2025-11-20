# Como Executar o Script setup-github-repo.ps1

## Método 1: PowerShell (Recomendado)

### Passo 1: Abrir PowerShell
1. Pressione `Win + X` (ou clique com botão direito no menu Iniciar)
2. Selecione "Windows PowerShell" ou "Terminal"
3. Ou pressione `Win + R`, digite `powershell` e pressione Enter

### Passo 2: Navegar até a pasta do projeto
No PowerShell, execute:

```powershell
cd "C:\Users\henri\Desktop\Planejamento vias - Maceió\Route-Crafter-mod"
```

### Passo 3: Executar o script
```powershell
.\setup-github-repo.ps1
```

**Nota:** Se aparecer um erro de política de execução, execute primeiro:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Método 2: Explorador de Arquivos

### Passo 1: Abrir a pasta
1. Abra o Explorador de Arquivos
2. Navegue até: `C:\Users\henri\Desktop\Planejamento vias - Maceió\Route-Crafter-mod`

### Passo 2: Abrir PowerShell na pasta
1. Clique com botão direito em qualquer espaço vazio da pasta
2. Selecione "Abrir no Terminal" ou "Abrir janela do PowerShell aqui"
3. Se não aparecer essa opção, segure `Shift` e clique com botão direito, então selecione "Abrir janela do PowerShell aqui"

### Passo 3: Executar o script
```powershell
.\setup-github-repo.ps1
```

## Método 3: Executar Diretamente

1. Abra o Explorador de Arquivos na pasta do projeto
2. Clique com botão direito em `setup-github-repo.ps1`
3. Selecione "Executar com PowerShell"

## O que o Script Faz

1. ✅ Verifica se o Git está instalado
2. ✅ Inicializa o repositório Git (se necessário)
3. ✅ Adiciona todos os arquivos
4. ✅ Faz commit inicial
5. ✅ Configura o remote do GitHub
6. ✅ Faz push para o GitHub

## Durante a Execução

O script vai:
- Pedir para você criar o repositório no GitHub (se ainda não criou)
- Mostrar mensagens de progresso
- Pedir credenciais quando fizer push:
  - **Username:** `hfrade94`
  - **Password:** Seu Personal Access Token (não sua senha!)

## Se Der Erro

### Erro: "não pode ser carregado porque a execução de scripts está desabilitada"
Execute primeiro:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Git não encontrado"
- Reinicie o PowerShell após instalar o Git
- Ou o script tentará encontrar automaticamente

### Erro de Autenticação
- Use Personal Access Token, não sua senha
- Crie um token em: https://github.com/settings/tokens
- Escopo necessário: `repo`

## Exemplo Completo

```powershell
# 1. Abrir PowerShell e navegar até a pasta
cd "C:\Users\henri\Desktop\Planejamento vias - Maceió\Route-Crafter-mod"

# 2. Verificar se o script existe
ls setup-github-repo.ps1

# 3. Executar o script
.\setup-github-repo.ps1

# 4. Seguir as instruções na tela
```

