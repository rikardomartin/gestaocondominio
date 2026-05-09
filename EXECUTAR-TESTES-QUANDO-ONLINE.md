# 🚀 Guia Rápido: Executar Testes Quando Estiver Online

## ⚡ Comandos em Sequência

### 1️⃣ Instalar Navegadores (Uma Vez)
```bash
npm run test:install
```
**Tempo estimado**: 2-3 minutos  
**Download**: ~111.5 MB  
**Requer**: Conexão com internet

---

### 2️⃣ Executar Todos os Testes
```bash
npm test
```
**Tempo estimado**: 30-60 segundos  
**Testes**: 15 cenários  
**Resultado**: Relatório HTML automático

---

### 3️⃣ Ver Relatório
```bash
npm run test:report
```
**Abre**: Navegador com relatório visual  
**Inclui**: Screenshots, vídeos, traces

---

## 🎯 Comandos Úteis

### Executar Testes Específicos
```bash
# Apenas testes de login (Cenários A, B, C)
npx playwright test tests/login.spec.js

# Apenas testes de navegação (Cenários D, E, F, G, H)
npx playwright test tests/navigation.spec.js

# Apenas testes do painel (Cenários I, J, K)
npx playwright test tests/painel.spec.js

# Apenas testes de performance (Cenários L, M, N, O)
npx playwright test tests/performance.spec.js
```

### Modo Debug (Passo a Passo)
```bash
npm run test:debug
```

### Interface Visual
```bash
npm run test:ui
```

---

## ✅ Checklist de Execução

- [ ] Conexão com internet estável
- [ ] Executar `npm run test:install`
- [ ] Aguardar download do Chromium (111.5 MB)
- [ ] Executar `npm test`
- [ ] Verificar resultados no terminal
- [ ] Abrir relatório com `npm run test:report`
- [ ] Analisar screenshots/vídeos de falhas (se houver)

---

## 📊 Resultados Esperados

### ✅ Sucesso Total
```
Running 15 tests using 2 workers
  15 passed (30s)
```

### ⚠️ Falhas Possíveis

#### Falha de Autenticação
**Causa**: Credenciais de teste não configuradas no Firebase  
**Solução**: Verificar usuário `admin@condominio.com` existe

#### Timeout em Elementos
**Causa**: Aplicação lenta ou elementos não encontrados  
**Solução**: Verificar IDs dos elementos no HTML

#### Servidor Não Iniciou
**Causa**: Porta 3000 ocupada  
**Solução**: Fechar processos na porta 3000 ou mudar porta no config

---

## 🔧 Troubleshooting

### Problema: Navegadores não instalam
```bash
# Tentar com npx direto
npx playwright install chromium --force
```

### Problema: Porta 3000 ocupada
```bash
# Verificar processos
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

### Problema: Testes muito lentos
```bash
# Executar sem paralelização
npx playwright test --workers=1
```

---

## 📝 Logs e Relatórios

### Localização dos Arquivos

```
gestao-condominios/
├── test-results/          # Screenshots, vídeos, traces
├── playwright-report/     # Relatório HTML
└── tests/                 # Arquivos de teste
```

### Limpar Resultados Antigos
```bash
# Windows PowerShell
Remove-Item -Recurse -Force test-results, playwright-report

# Ou manualmente deletar as pastas
```

---

## 🎉 Após Execução Bem-Sucedida

1. ✅ Verificar relatório HTML
2. ✅ Analisar tempo de execução
3. ✅ Revisar screenshots de falhas (se houver)
4. ✅ Documentar problemas encontrados
5. ✅ Executar testes regularmente (CI/CD)

---

## 🔄 Integração Contínua (Futuro)

### GitHub Actions (Exemplo)
```yaml
name: Testes E2E
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

**Pronto para executar quando estiver online!** 🚀
