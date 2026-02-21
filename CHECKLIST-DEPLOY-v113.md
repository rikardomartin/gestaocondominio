# ✅ Checklist de Deploy v113

## 📋 PRÉ-DEPLOY

- [ ] Código atualizado com versão v113
  - [ ] app.js linha 308: `CURRENT_VERSION = '113'`
  - [ ] sw.js linhas 1-4: `CACHE_NAME = 'gestao-condominial-v113'`

- [ ] Alterações implementadas
  - [ ] `setupPaymentChangeListener()` em app.js
  - [ ] Campo `lastModifiedBy` em firebase-database.js
  - [ ] Listener monitora coleção `payments`

- [ ] Admin2 criado
  - [ ] Abrir `criar-admin2.html`
  - [ ] Clicar "Criar Admin2"
  - [ ] Testar login com admin2@condominio.com

## 🚀 DEPLOY

### 1. Commit e Push (Opcional)
```bash
git add .
git commit -m "v113: Sistema de notificações multi-admin + Cache busting agressivo"
git push origin main
```

### 2. Deploy Firebase
```bash
cd /c/projetos/gestao-condominios
firebase deploy --only hosting
```

**Aguardar mensagem**:
```
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/gestaodoscondominios/overview
Hosting URL: https://gestaodoscondominios.web.app
```

### 3. IMPORTANTE: Cache Busting Automático
O sistema agora tem cache busting automático! Quando o usuário acessar:
1. Script detecta versão antiga
2. Limpa todos os caches automaticamente
3. Desregistra Service Workers
4. Força reload da página
5. Carrega versão v113

**Não é mais necessário instruir usuário a limpar cache manualmente!**

### 4. Fallback: Force Reload Manual (Se Necessário)
Se algum usuário tiver problemas, enviar link:
```
https://gestaodoscondominios.web.app/force-reload-v113.html
```

Essa página:
- Limpa TUDO (caches, SW, localStorage, sessionStorage, IndexedDB, cookies)
- Mostra log em tempo real
- Redireciona automaticamente para o sistema

## 🧪 TESTES

### Teste 1: Verificar Versão
- [ ] Login como admin@condominio.com
- [ ] Verificar canto inferior esquerdo: "v113"
- [ ] Deve aparecer toast: "Sistema atualizado para v113!"

### Teste 2: Permissão de Notificações
- [ ] Aguardar 3 segundos após login
- [ ] Deve aparecer popup de permissão
- [ ] Clicar "Permitir"
- [ ] Verificar console: "✅ Notificações habilitadas!"

### Teste 3: Listener Configurado
- [ ] Verificar console após login
- [ ] Deve aparecer: "🔔 Configurando listener de mudanças de pagamento..."
- [ ] Deve aparecer: "✅ Listener de mudanças configurado!"

### Teste 4: Notificação de Outro Admin
**Navegador 1 (Admin Principal)**:
- [ ] Login como admin@condominio.com
- [ ] Deixar aberto

**Navegador 2 (Admin2)**:
- [ ] Abrir aba anônima ou outro navegador
- [ ] Login como admin2@condominio.com
- [ ] Selecionar condomínio e período
- [ ] Clicar em apartamento
- [ ] Marcar como "PAGO"
- [ ] Clicar "Salvar"

**Verificar Navegador 1**:
- [ ] Deve receber notificação
- [ ] Título: "💰 Novo Pagamento - Pago"
- [ ] Corpo: Nome do condomínio, bloco e apartamento
- [ ] Som: Sim
- [ ] Vibração: Sim (se dispositivo suportar)

**Console Navegador 1**:
```
📬 Mudança detectada por admin2@condominio.com em pagamento [ID]
📬 Enviando notificação de pagamento...
✅ Notificação enviada via Service Worker
```

### Teste 5: Sem Auto-Notificação
**Navegador 1 (Admin Principal)**:
- [ ] Login como admin@condominio.com
- [ ] Marcar apartamento como "PAGO"
- [ ] Clicar "Salvar"
- [ ] **NÃO** deve receber notificação
- [ ] Console deve mostrar: (nenhuma mensagem de notificação)

### Teste 6: Diferentes Status
Repetir Teste 4 com:
- [ ] Status "RECICLADO" → Notificação "♻️ Novo Pagamento - Pago Reciclado"
- [ ] Status "ACORDO" → Notificação "🤝 Novo Pagamento - Acordo"
- [ ] Status "PENDENTE" → **NÃO** deve enviar notificação

### Teste 7: App em Background
- [ ] Admin principal: Minimizar navegador
- [ ] Admin2: Marcar pagamento
- [ ] Admin principal: Deve receber notificação mesmo minimizado

### Teste 8: Clique na Notificação
- [ ] Receber notificação
- [ ] Clicar na notificação
- [ ] Deve focar na janela do app
- [ ] Deve abrir modal "Pagamentos Hoje"

## 🔍 VERIFICAÇÕES FINAIS

### Firebase Console
- [ ] Abrir: https://console.firebase.google.com/project/gestaodoscondominios/firestore
- [ ] Navegar: `payments` collection
- [ ] Abrir um documento recente
- [ ] Verificar campo `lastModifiedBy` existe
- [ ] Verificar valor: "admin2@condominio.com" ou "admin@condominio.com"

### Service Worker
- [ ] Abrir DevTools (F12)
- [ ] Aba "Application"
- [ ] Seção "Service Workers"
- [ ] Verificar: Status "activated and is running"
- [ ] Verificar: Source "sw.js"

### Notificações do Sistema
- [ ] Windows: Abrir "Configurações → Sistema → Notificações"
- [ ] Verificar: Navegador tem permissão
- [ ] Verificar: Notificações não estão em "Não perturbe"

## ❌ TROUBLESHOOTING

### Problema: Notificação não aparece
**Soluções**:
1. [ ] Verificar permissão no navegador (ícone de cadeado na barra de endereço)
2. [ ] Verificar Service Worker ativo (F12 → Application)
3. [ ] Verificar console para erros
4. [ ] Limpar cache novamente
5. [ ] Usar `force-update.html` para reset completo

### Problema: Notificação aparece para próprio usuário
**Soluções**:
1. [ ] Verificar campo `lastModifiedBy` no Firestore
2. [ ] Verificar console: deve mostrar email correto
3. [ ] Verificar lógica: `isOtherUser = modifiedBy !== currentUser.email`

### Problema: Listener não detecta mudanças
**Soluções**:
1. [ ] Verificar se admin@condominio.com está logado
2. [ ] Verificar console: "✅ Listener de mudanças configurado!"
3. [ ] Verificar timing: mudança deve ser recente (últimos 10 segundos)
4. [ ] Verificar Firestore: campo `updatedAt` está sendo salvo

### Problema: Deploy falha
**Erro**: "Executable files are forbidden"
**Solução**:
```bash
# Remover arquivos executáveis
rm deploy-functions.bat

# Deploy novamente
firebase deploy --only hosting
```

## 📊 MÉTRICAS DE SUCESSO

Após 24h de uso:
- [ ] Nenhum erro no console
- [ ] Admin principal recebe notificações de outros admins
- [ ] Admin principal NÃO recebe notificações próprias
- [ ] Notificações funcionam com app fechado
- [ ] Cliente satisfeito com funcionalidade

## 📞 CONTATO

Se houver problemas:
1. Verificar este checklist novamente
2. Consultar `DEPLOY-v113-INSTRUCOES.md`
3. Consultar `RESUMO-v113.md`
4. Verificar logs do Firebase Console

---

**Versão**: v113  
**Data**: 2026-02-03  
**Status**: Pronto para deploy
