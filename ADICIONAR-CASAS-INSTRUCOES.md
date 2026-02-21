# 🏠 Instruções para Adicionar Casas Faltantes

## 📋 Resumo

Este script adiciona casas nos condomínios **Taroni**, **Speranza** e **Vidal** seguindo **exatamente** o mesmo padrão já usado nos outros condomínios (Vacaria, Ayres, Destri).

## ✅ O que o script faz

1. **Verifica** quais casas já existem no banco de dados
2. **Adiciona APENAS** as casas que estão faltando
3. **Não duplica** casas existentes
4. **Não altera** o fluxo ou funcionalidades do sistema
5. **Usa a mesma estrutura** dos outros condomínios

## 🏢 Casas a serem adicionadas

| Condomínio | Bloco | Quantidade | Status Atual |
|------------|-------|------------|--------------|
| **Taroni** | 16 | 3 casas | Configurado no código |
| **Speranza** | 26 | 4 casas | Configurado no código |
| **Vidal** | 20 | 4 casas | Configurado no código |

## 🚀 Como usar

### Passo 1: Abrir o script
```
Abra o arquivo: adicionar-casas-faltantes.html
```

### Passo 2: Verificar casas existentes
1. Clique no botão **"1️⃣ Verificar Casas Existentes"**
2. O script vai mostrar:
   - Quais casas já existem
   - Quantas casas faltam
   - Se os blocos já existem

### Passo 3: Adicionar casas faltantes
1. Se houver casas faltantes, o botão **"2️⃣ Adicionar Casas Faltantes"** será habilitado
2. Clique nele
3. Confirme a operação
4. Aguarde a conclusão

### Passo 4: Verificar no sistema
1. Recarregue o sistema principal
2. Selecione o condomínio (Taroni, Speranza ou Vidal)
3. Verifique se as casas aparecem na lista

## 📊 Estrutura das Casas

As casas seguem o mesmo padrão dos outros condomínios:

```javascript
{
  numero: "Casa 01",           // Casa 01, Casa 02, Casa 03, etc.
  tipo: "casa",                // Tipo: casa (não apartamento)
  blocoId: "...",              // ID do bloco específico
  blocoNome: "Bloco 16",       // Nome do bloco
  condominioId: "...",         // ID do condomínio
  condominioNome: "Condomínio Taroni",
  proprietario: "Proprietário Casa 01",
  status: "pendente",          // Status inicial
  posicao: 1,                  // Posição da casa
  createdAt: timestamp,
  createdBy: "script-adicionar-casas",
  active: true
}
```

## 🔍 Detalhes Técnicos

### Blocos das Casas

Cada condomínio tem um bloco específico para casas:

- **Taroni**: Bloco 16 (após os 15 blocos de apartamentos)
- **Speranza**: Bloco 26 (após os 25 blocos de apartamentos)
- **Vidal**: Bloco 20 (após os 19 blocos de apartamentos)

### Numeração das Casas

As casas são numeradas sequencialmente:
- Casa 01, Casa 02, Casa 03, Casa 04...

### Tipo de Bloco

Os blocos de casas têm:
```javascript
{
  tipo: 'casas',              // Identifica que é bloco de casas
  totalApartamentos: 3 ou 4   // Quantidade de casas no bloco
}
```

## ⚠️ Importante

1. **Não duplica**: O script verifica antes de criar
2. **Não altera**: Mantém todas as funcionalidades existentes
3. **Mesmo padrão**: Usa a estrutura idêntica aos outros condomínios
4. **Seguro**: Pode ser executado múltiplas vezes sem problemas

## 🎯 Configuração no Código

As casas já estão configuradas em `firebase-database.js`:

```javascript
// Taroni
{
  nome: "Condomínio Taroni",
  blocos: 15,
  casas: [
    { bloco: 16, quantidade: 3 }  // ✅ JÁ CONFIGURADO
  ]
}

// Speranza
{
  nome: "Condomínio Speranza",
  blocos: 25,
  casas: [
    { bloco: 26, quantidade: 4 }  // ✅ JÁ CONFIGURADO
  ]
}

// Vidal
{
  nome: "Condomínio Vidal",
  blocos: 19,
  casas: [
    { bloco: 20, quantidade: 4 }  // ✅ JÁ CONFIGURADO
  ]
}
```

## 📝 Log de Execução

O script mostra em tempo real:
- ✅ Operações bem-sucedidas (verde)
- ⚠️ Avisos e informações (azul)
- ❌ Erros (vermelho)

## 🔄 Fluxo do Sistema

O sistema já está preparado para trabalhar com casas:

1. **Carregamento**: `getCasasByCondominio()` busca as casas
2. **Exibição**: Casas aparecem junto com apartamentos
3. **Pagamentos**: Mesmo sistema de pagamentos
4. **Filtros**: Casas aparecem nos filtros
5. **Relatórios**: Incluídas em todos os relatórios

## ✅ Checklist Final

Após executar o script:

- [ ] Casas aparecem no condomínio Taroni
- [ ] Casas aparecem no condomínio Speranza
- [ ] Casas aparecem no condomínio Vidal
- [ ] Pagamentos funcionam normalmente
- [ ] Filtros incluem as casas
- [ ] Relatórios mostram as casas
- [ ] Nenhuma duplicação ocorreu

## 🆘 Suporte

Se houver algum problema:

1. Verifique o console do navegador (F12)
2. Veja o log detalhado no script
3. Confirme que está usando o projeto correto do Firebase
4. Verifique se tem permissão de escrita no Firestore

---

**Versão**: 1.0  
**Data**: 2026-02-05  
**Autor**: Sistema de Gestão Condominial
