# 💚 Chatbot Estilo WhatsApp + PWA

## ✅ O que foi feito

### 🎨 Design WhatsApp
- ✅ Cores escuras (#0b141a, #202c33, #005c4b)
- ✅ Bolhas de mensagem com "rabinho"
- ✅ Header com avatar e status online
- ✅ Input arredondado estilo WhatsApp
- ✅ Botão verde de enviar (#25d366)
- ✅ Indicador de digitação animado
- ✅ Scrollbar personalizada
- ✅ Responsivo (mobile e desktop)

### 📱 PWA Completo
- ✅ Manifest.json configurado
- ✅ Service Worker para cache
- ✅ Ícones 192x192 e 512x512
- ✅ Banner de instalação automático
- ✅ Funciona offline
- ✅ Instalável no mobile e desktop

## 🚀 Deploy

```bash
cd chatbot-condominio
firebase deploy
```

## 📱 Como Instalar no Mobile

### Android (Chrome)
1. Acesse: https://chatbotcond.web.app
2. Aguarde 3 segundos
3. Banner aparece: "Instalar App"
4. Clique em "Instalar"
5. App aparece na tela inicial

### iOS (Safari)
1. Acesse: https://chatbotcond.web.app
2. Toque no botão "Compartilhar" (quadrado com seta)
3. Role e toque em "Adicionar à Tela de Início"
4. Toque em "Adicionar"
5. App aparece na tela inicial

## 🎨 Cores WhatsApp

```css
Background: #0b141a
Header: #202c33
Mensagem Bot: #202c33
Mensagem User: #005c4b
Input: #2a3942
Botão Enviar: #25d366
Texto: #e9edef
Texto Secundário: #8696a0
```

## ✨ Funcionalidades PWA

### Offline
- Cache de arquivos estáticos
- Funciona sem internet (mensagens antigas)
- Service Worker atualiza automaticamente

### Instalação
- Banner automático após 3 segundos
- Botão "Instalar" no banner
- Ícone personalizado
- Nome: "Chatbot Condomínio"

### Mobile
- Fullscreen (sem barra do navegador)
- Splash screen automática
- Orientação portrait
- Tema escuro nativo

## 📊 Estrutura PWA

```
chatbot-condominio/
├── index.html (com PWA meta tags)
├── manifest.json (configuração PWA)
├── sw-chatbot.js (Service Worker)
├── icon-192.png (ícone pequeno)
└── icon-512.png (ícone grande)
```

## 🔧 Personalização

### Mudar Cores
Edite no `<style>`:
```css
background: #0b141a; /* Fundo principal */
background: #202c33; /* Header e mensagens bot */
background: #005c4b; /* Mensagens usuário */
background: #25d366; /* Botão enviar */
```

### Mudar Nome do App
Edite `manifest.json`:
```json
{
  "name": "Seu Nome Aqui",
  "short_name": "Nome Curto"
}
```

### Mudar Ícone
Substitua:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)

## 📱 Testar PWA

### Lighthouse (Chrome DevTools)
1. F12 > Lighthouse
2. Selecione "Progressive Web App"
3. Clique em "Generate report"
4. Deve ter score 90+

### Mobile
1. Acesse pelo celular
2. Aguarde banner de instalação
3. Instale o app
4. Teste offline (modo avião)

## 🎯 Checklist

- [x] Design estilo WhatsApp
- [x] Cores escuras
- [x] Bolhas com rabinho
- [x] Header com avatar
- [x] Responsivo
- [x] Manifest.json
- [x] Service Worker
- [x] Ícones PWA
- [x] Banner de instalação
- [x] Funciona offline
- [x] Meta tags PWA
- [x] Theme color
- [x] Apple touch icon

## 🌐 URLs

**Site**: https://chatbotcond.web.app  
**Manifest**: https://chatbotcond.web.app/manifest.json  
**Service Worker**: https://chatbotcond.web.app/sw-chatbot.js  

## 📸 Screenshots

### Desktop
- Janela centralizada
- Max-width: 500px
- Border-radius: 12px
- Sombra suave

### Mobile
- Fullscreen
- Sem bordas
- Aproveita toda tela
- Safe area (notch)

## 🎉 Resultado

Um chatbot profissional estilo WhatsApp que pode ser instalado como app nativo no celular! 💚

---

**Versão**: 3.0.0 (WhatsApp + PWA)  
**Data**: 04/02/2026  
**Status**: ✅ Pronto para produção!
