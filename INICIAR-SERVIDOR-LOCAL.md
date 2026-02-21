# Como Iniciar Servidor Local

## Opção 1: Usar Python (se tiver instalado)

Abra o terminal na pasta do projeto e execute:

```bash
# Python 3
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
```

Depois abra no navegador: `http://localhost:8000`

---

## Opção 2: Usar Node.js (se tiver instalado)

Instale o http-server:
```bash
npm install -g http-server
```

Execute na pasta do projeto:
```bash
http-server -p 8000
```

Depois abra no navegador: `http://localhost:8000`

---

## Opção 3: Usar Firebase Hosting (RECOMENDADO)

O sistema já está publicado em:
```
https://gestaodoscondominios.web.app
```

Basta acessar essa URL no navegador!

---

## Por que não funciona abrindo o arquivo diretamente?

Quando você abre `index.html` diretamente (clicando duas vezes), o navegador usa protocolo `file://` que:
- ❌ Não permite Service Workers
- ❌ Não permite algumas APIs do Firebase
- ❌ Tem restrições de segurança

Quando você usa um servidor (http:// ou https://):
- ✅ Service Workers funcionam
- ✅ Firebase funciona normalmente
- ✅ Sem restrições de segurança

---

## Solução Rápida

**NO NOTEBOOK:**
Abra o navegador e digite:
```
https://gestaodoscondominios.web.app
```

**NO CELULAR:**
Já está funcionando! Continue usando a URL web.
