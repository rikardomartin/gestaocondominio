# ⚡ EXECUTAR TESTES AGORA - PASSO A PASSO

## 🎯 QUANDO A CONECTIVIDADE ESTIVER DISPONÍVEL

Execute estes comandos na ordem:

---

## 📋 PASSO A PASSO COMPLETO

### 1️⃣ Instalar Navegadores do Playwright
```bash
npx playwright install chromium
```
**Aguarde**: Download de ~180MB  
**Tempo estimado**: 2-5 minutos

---

### 2️⃣ Executar Todos os Testes
```bash
npm test
```
**Aguarde**: Execução de 15 testes  
**Tempo estimado**: 30-60 segundos

---

### 3️⃣ Ver Relatório HTML
```bash
npm run test:report
```
**Resultado**: Abre navegador com relatório visual

---

## 🎨 ALTERNATIVA: Interface Gráfica

Para ver os testes rodando visualmente:

```bash
npm run test:ui
```

Isso abre uma interface onde você pode:
- ✅ Ver cada teste rodando em tempo real
- ✅ Pausar e inspecionar elementos
- ✅ Re-executar testes específicos
- ✅ Ver screenshots e vídeos de falhas

---

## 🐛 SE ALGO DER ERRADO

### Problema: Navegadores não instalam
```bash
# Tentar com força
npx playwright install chromium --force

# Ou instalar todos os navegadores
npx playwright install
```

### Problema: Testes falham por timeout
```bash
# Executar com mais tempo
npx playwright test --timeout=60000
```

### Problema: Firebase não conecta
1. Verificar se Firebase está configurado
2. Criar usuário de teste:
   - Email: `admin@condominio.com`
   - Senha: `admin123`
3. Verificar regras do Firestore

---

## 📊 RESULTADO ESPERADO

Você deve ver algo assim:

```
Running 15 tests using 1 worker

  ✓ tests/login.spec.js:7:3 › Cenário A: Login com sucesso
  ✓ tests/login.spec.js:28:3 › Cenário B: Erro de campo vazio
  ✓ tests/login.spec.js:42:3 › Cenário C: Erro de credenciais inválidas
  ✓ tests/navigation.spec.js:14:3 › Cenário D: Navegação completa
  ✓ tests/navigation.spec.js:42:3 › Cenário E: Abrir modal de apartamento
  ✓ tests/navigation.spec.js:67:3 › Cenário F: Fechar modal de apartamento
  ✓ tests/navigation.spec.js:92:3 › Cenário G: Botão voltar funciona
  ✓ tests/navigation.spec.js:103:3 › Cenário H: Logout funciona
  ✓ tests/painel.spec.js:14:3 › Cenário I: Abrir painel geral
  ✓ tests/painel.spec.js:32:3 › Cenário J: Filtros do painel funcionam
  ✓ tests/painel.spec.js:52:3 › Cenário K: Botão limpar filtros funciona
  ✓ tests/performance.spec.js:5:3 › Cenário L: Aplicação carrega em < 5s
  ✓ tests/performance.spec.js:20:3 › Cenário M: Sem erros críticos
  ✓ tests/performance.spec.js:48:3 › Cenário N: Elementos principais presentes
  ✓ tests/performance.spec.js:63:3 › Cenário O: PWA manifest configurado

  15 passed (29.3s)

To open last HTML report run:
  npx playwright show-report
```

---

## ✅ CHECKLIST

Antes de executar, certifique-se:

- [ ] Conexão com internet estável
- [ ] Node.js instalado (v18+)
- [ ] NPM instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Firebase configurado
- [ ] Credenciais de teste criadas no Firebase Auth:
  - Email: `admin@condominio.com`
  - Senha: `admin123`
  - Perfil: Administrador

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Tudo de uma vez (copie e cole)
npx playwright install chromium && npm test && npm run test:report
```

---

## 📸 SCREENSHOTS E VÍDEOS

Se algum teste falhar, você encontrará:
- **Screenshots**: `test-results/*/test-failed-1.png`
- **Vídeos**: `test-results/*/video.webm`
- **Traces**: `test-results/*/trace.zip`

Para ver o trace:
```bash
npx playwright show-trace test-results/*/trace.zip
```

---

## 🎓 DICAS IMPORTANTES

1. **Primeira execução**: Pode demorar mais (download de navegadores)
2. **Execuções seguintes**: Serão muito mais rápidas
3. **Modo debug**: Use `npm run test:debug` para investigar falhas
4. **Modo UI**: Use `npm run test:ui` para ver visualmente
5. **Relatório**: Sempre disponível com `npm run test:report`

---

## 🚀 PRONTO!

Após executar os testes com sucesso, você terá:
- ✅ Validação completa do sistema
- ✅ Relatório HTML detalhado
- ✅ Screenshots de todas as telas
- ✅ Confirmação de que tudo funciona

---

*Instruções criadas em 2026-02-04*  
*Sistema: Gestão de Condomínios v131*  
*Status: ⏳ AGUARDANDO CONECTIVIDADE*
