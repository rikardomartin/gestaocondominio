# Ícones PWA

Esta pasta deve conter os ícones do PWA nos seguintes tamanhos:

- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Como gerar os ícones

1. Crie um ícone base de 512x512px com:
   - Fundo azul (#2563eb)
   - Ícone de prédio/condomínio em branco
   - Bordas arredondadas

2. Use ferramentas online como:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

3. Ou use este código SVG como base:

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="64" fill="#2563eb"/>
  <g fill="white">
    <!-- Prédio principal -->
    <rect x="156" y="128" width="200" height="320" rx="8"/>
    <!-- Janelas -->
    <rect x="180" y="160" width="24" height="24" rx="4"/>
    <rect x="220" y="160" width="24" height="24" rx="4"/>
    <rect x="260" y="160" width="24" height="24" rx="4"/>
    <rect x="300" y="160" width="24" height="24" rx="4"/>
    <!-- Mais janelas... -->
  </g>
</svg>
```