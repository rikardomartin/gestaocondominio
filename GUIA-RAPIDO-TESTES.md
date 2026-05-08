# 🚀 GUIA RÁPIDO - EXECUTAR TESTES

## ⚡ INÍCIO RÁPIDO (3 passos)

### 1️⃣ Instalar Navegadores
```bash
npm run test:install
```

### 2️⃣ Executar Testes
```bash
npm test
```

### 3️⃣ Ver Relatório
```bash
npm run test:report
```

---

## 📋 COMANDOS DISPONÍVEIS

| Comando | Descrição |
|---------|-----------|
| `npm run test:install` | Instala navegadores do Playwright |
| `npm test` | Executa todos os testes |
| `npm run test:ui` | Abre interface gráfica dos testes |
| `npm run test:debug` | Executa testes em modo debug |
| `npm run test:report` | Abre relatório HTML dos testes |
| `npm run serve` | Inicia servidor local na porta 3000 |

---

## 🎯 EXECUTAR TESTES ESPECÍFICOS

```bash
# Apenas testes de login
npx playwright test tests/login.spec.js

# Apenas testes de navegação
npx playwright test tests/navigation.spec.js

# Apenas testes de painel
npx playwright test tests/painel.spec.js

# Apenas testes de performance
npx playwright test tests/performance.spec.js

# Executar teste específico por nome
npx playwright test -g "Login com sucesso"
```

---

## 🔧 SOLUÇÃO RÁPIDA DE PROBLEMAS

### ❌ Erro: "Executable doesn't exist"
**Solução**: Instalar navegadores
```bash
npm run test:install
```

### ❌ Erro: "Port 3000 already in use"
**Solução**: Matar processo na porta 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou usar outra porta no playwright.config.js
```

### ❌ Erro: "Firebase connection failed"
**Solução**: Verificar credenciais de teste
- Email: `admin@condominio.com`
- Senha: `admin123`
- Criar usuário no Firebase Auth se não existir

---

## 📊 RESULTADO ESPERADO

```
Running 15 tests using 1 worker

  ✓ tests/login.spec.js:7:3 › Cenário A: Login com sucesso (2.5s)
  ✓ tests/login.spec.js:28:3 › Cenário B: Erro de campo vazio (1.2s)
  ✓ tests/login.spec.js:42:3 › Cenário C: Erro de credenciais inválidas (1.8s)
  ✓ tests/navigation.spec.js:14:3 › Cenário D: Navegação completa (3.1s)
  ✓ tests/navigation.spec.js:42:3 › Cenário E: Abrir modal de apartamento (2.9s)
  ✓ tests/navigation.spec.js:67:3 › Cenário F: Fechar modal de apartamento (2.7s)
  ✓ tests/navigation.spec.js:92:3 › Cenário G: Botão voltar funciona (1.5s)
  ✓ tests/navigation.spec.js:103:3 › Cenário H: Logout funciona (1.8s)
  ✓ tests/painel.spec.js:14:3 › Cenário I: Abrir painel geral (2.3s)
  ✓ tests/painel.spec.js:32:3 › Cenário J: Filtros do painel funcionam (2.1s)
  ✓ tests/painel.spec.js:52:3 › Cenário K: Botão limpar filtros funciona (1.9s)
  ✓ tests/performance.spec.js:5:3 › Cenário L: Aplicação carrega em < 5s (1.2s)
  ✓ tests/performance.spec.js:20:3 › Cenário M: Sem erros críticos (2.0s)
  ✓ tests/performance.spec.js:48:3 › Cenário N: Elementos principais presentes (1.5s)
  ✓ tests/performance.spec.js:63:3 › Cenário O: PWA manifest configurado (0.8s)

  15 passed (29.3s)
```

---

## ✅ CHECKLIST PRÉ-EXECUÇÃO

- [ ] Node.js instalado (v18+)
- [ ] NPM instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Navegadores instalados (`npm run test:install`)
- [ ] Firebase configurado
- [ ] Credenciais de teste criadas
- [ ] Conexão com internet (para primeira execução)

---

## 🎓 DICAS

1. **Primeira vez**: Execute `npm run test:ui` para ver os testes rodando visualmente
2. **Debug**: Use `npm run test:debug` para pausar e inspecionar cada passo
3. **CI/CD**: Configure `npm test` no seu pipeline de integração contínua
4. **Screenshots**: Falhas geram screenshots automáticos em `test-results/`
5. **Vídeos**: Falhas geram vídeos em `test-results/` para análise

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para mais detalhes, consulte:
- `TESTES-PLAYWRIGHT.md` - Documentação completa dos testes
- `RELATORIO.MD` - Relatório de correções e validações
- `playwright.config.js` - Configuração do Playwright

---

*Guia criado em 2026-02-04*  
*Sistema: Gestão de Condomínios v131*
