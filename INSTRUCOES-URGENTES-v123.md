# ⚠️ INSTRUÇÕES URGENTES - v123

## Problema Atual

O navegador está mostrando a versão antiga em CACHE. A seção de credenciais FOI REMOVIDA do código, mas o navegador ainda mostra a versão antiga.

## Solução em 3 Passos

### 1️⃣ FAZER DEPLOY IMEDIATO

```bash
firebase deploy --only hosting
```

Aguarde a mensagem: "Deploy complete!"

### 2️⃣ LIMPAR CACHE DO NAVEGADOR

Abra o site e execute ESTE SCRIPT no console do navegador (F12):

```javascript
// Copie e cole TUDO no console e pressione Enter
(async function() {
    console.log('🔄 Limpando cache v123...');
    
    // Limpar storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage limpo');
    
    // Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
            await reg.unregister();
        }
        console.log('✅ Service Workers removidos');
    }
    
    // Limpar caches
    if ('caches' in window) {
        const names = await caches.keys();
        for (let name of names) {
            await caches.delete(name);
        }
        console.log('✅ Caches limpos');
    }
    
    console.log('🎉 Pronto! Recarregando...');
    setTimeout(() => location.reload(true), 1000);
})();
```

### 3️⃣ OU USE O ARQUIVO DE FORÇA

Depois do deploy, acesse:
```
https://gestaodoscondominios.web.app/force-reload-v123.html
```

Este arquivo vai:
- Limpar todo o cache automaticamente
- Desregistrar Service Workers
- Redirecionar para o sistema atualizado

## Verificação

Após limpar o cache, a tela de login deve estar assim:

```
┌─────────────────────────────────────┐
│    🏠 Gestao Condominial            │
│                                     │
│    E-mail: [____________]           │
│    Senha:  [____________]           │
│                                     │
│    [Entrar]                         │
│                                     │
└─────────────────────────────────────┘
```

**SEM** a seção de "Usuários de Demonstração"

## Checklist

- [ ] Deploy feito (`firebase deploy --only hosting`)
- [ ] Cache limpo (script no console OU force-reload-v123.html)
- [ ] Página recarregada (Ctrl+Shift+R ou Cmd+Shift+R)
- [ ] Seção de credenciais NÃO aparece mais
- [ ] Login funciona normalmente

## Se Ainda Aparecer

1. Feche TODAS as abas do site
2. Feche o navegador completamente
3. Abra novamente
4. Acesse o site em modo anônimo/privado
5. Deve aparecer a versão v123 limpa

## Arquivos Modificados v123

- ✅ `index.html` - Seção removida + versão v123
- ✅ `styles.css` - CSS removido + versão v123
- ✅ `sw.js` - Versão v123
- ✅ `force-reload-v123.html` - Criado para limpar cache

## Confirmação de Sucesso

Quando funcionar, você verá:
- ✅ Tela de login limpa (sem credenciais)
- ✅ Console mostra: "Service Worker v123 instalado"
- ✅ Sistema funciona normalmente

---

**IMPORTANTE**: O código está correto. O problema é APENAS cache do navegador.

**Versão**: v123  
**Status**: Código pronto, aguardando deploy + limpeza de cache
