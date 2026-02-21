# 💰 Sistema de Taxa Individual por Condomínio

## 📋 Visão Geral

O sistema de taxa individual permite que cada condomínio tenha sua própria taxa de condomínio, com controle completo de alterações e histórico permanente. Todas as mudanças são registradas e os pagamentos antigos permanecem inalterados.

## ✨ Funcionalidades

### 🏢 Taxa Individual por Condomínio
- Cada condomínio possui sua própria taxa
- Valores independentes entre condomínios
- Configuração flexível e dinâmica
- Histórico completo de alterações

### 📈 Controle de Alterações
- Alterações podem ser feitas a qualquer momento
- Todas as mudanças são registradas permanentemente
- Motivo obrigatório para cada alteração
- Data de vigência automática

### 🔒 Preservação de Dados
- Pagamentos antigos nunca são alterados
- Valor da taxa é salvo junto ao pagamento
- Referência à taxa utilizada no momento
- Auditoria completa de valores

### 📊 Histórico Detalhado
- Lista cronológica de todas as alterações
- Informações do responsável pela mudança
- Data e hora de cada modificação
- Motivo detalhado de cada alteração

## 🎯 Interface do Usuário

### 📍 Localização
A configuração da taxa está localizada em:
```
Condomínios → Selecionar Condomínio → Blocos → "Configurar Taxa"
```

### 🖥️ Tela de Configuração

#### Taxa Atual
- **Valor vigente** em destaque
- **Data de vigência** da taxa atual
- **Motivo** da última alteração
- **Indicador visual** de taxa ativa

#### Alterar Taxa
- **Campo de valor** com validação
- **Campo de motivo** obrigatório
- **Botão de confirmação** com feedback
- **Validação** de valores duplicados

#### Histórico de Alterações
- **Lista cronológica** de todas as taxas
- **Indicador visual** da taxa atual
- **Detalhes completos** de cada alteração
- **Informações de auditoria**

## 🔧 Implementação Técnica

### 🗄️ Estrutura do Banco de Dados

#### Coleção `condominioTaxes`
```javascript
{
  condominioId: "id_do_condominio",
  value: 285.50,
  reason: "Aumento devido à inflação",
  effectiveDate: "2025-01-27", // YYYY-MM-DD
  createdAt: timestamp,
  createdBy: "uid_do_usuario",
  createdByName: "Nome do Administrador"
}
```

#### Coleção `payments` (atualizada)
```javascript
{
  apartamentoId: "id_do_apartamento",
  date: "2025-01", // YYYY-MM
  value: 285.50,
  type: "condominio",
  taxValue: 285.50, // Valor da taxa vigente
  taxId: "id_da_taxa", // Referência à taxa
  registeredBy: "Nome do Operador",
  createdAt: timestamp,
  createdBy: "uid_do_usuario"
}
```

### 🔍 Lógica de Negócio

#### Busca da Taxa Vigente
```javascript
async function getCurrentTax(condominioId, referenceDate) {
  // Busca a taxa vigente para uma data específica
  // Retorna a taxa mais recente anterior ou igual à data
  // Fallback para taxa padrão se não encontrar
}
```

#### Registro de Pagamento
```javascript
async function createPayment(paymentData) {
  // Busca taxa vigente para o mês do pagamento
  const tax = await getCurrentTax(condominioId, monthDate);
  
  // Salva valor da taxa junto ao pagamento
  paymentData.taxValue = tax.value;
  paymentData.taxId = tax.id;
}
```

### 🛡️ Regras de Segurança

#### Firestore Rules
```javascript
match /condominioTaxes/{taxId} {
  // Leitura para usuários autenticados
  allow read: if isActiveUser();
  
  // Apenas admins podem gerenciar taxas
  allow create, update, delete: if isAdmin();
  
  // Validações obrigatórias
  allow create: if 
    request.resource.data.value > 0 &&
    request.resource.data.condominioId is string &&
    request.resource.data.effectiveDate is string;
}
```

#### Permissões de Interface
- **Visualização:** Todos os usuários autenticados
- **Alteração:** Apenas administradores
- **Histórico:** Todos os usuários autenticados

## 📱 Fluxo de Uso

### 👨‍💼 Para Administradores

#### Configurar Taxa Inicial
1. Acesse **Condomínios** → Selecione um condomínio
2. Na tela de **Blocos**, clique em **"Configurar Taxa"**
3. Visualize a taxa atual (padrão: R$ 285,00)
4. Para alterar, preencha o **novo valor** e **motivo**
5. Clique em **"Atualizar Taxa"**

#### Alterar Taxa Existente
1. Acesse a tela de **Taxa do Condomínio**
2. Visualize a **taxa atual** e **histórico**
3. Preencha o **novo valor** (deve ser diferente)
4. Descreva o **motivo** da alteração
5. Confirme a **atualização**

#### Consultar Histórico
1. Na tela de **Taxa do Condomínio**
2. Visualize o **histórico completo** na parte inferior
3. Cada entrada mostra:
   - Valor da taxa
   - Data de vigência
   - Motivo da alteração
   - Responsável pela mudança
   - Data/hora da criação

### 👨‍💼 Para Operadores e Visualizadores
- **Visualização completa** de taxas e histórico
- **Sem permissão** para alterar valores
- **Interface em modo** somente leitura

## 🔄 Sincronização em Tempo Real

### 📡 Atualizações Automáticas
- **Taxa atual** atualizada instantaneamente
- **Histórico** sincronizado em tempo real
- **Múltiplos usuários** veem as mesmas informações
- **Notificações** de alterações via toast

### 🔄 Listeners Implementados
```javascript
// Listener para histórico de taxas
subscribeToCondominioTaxes(condominioId, (taxes) => {
  appState.condominioTaxes = taxes;
  renderTaxHistory(taxes);
});

// Listener para pagamentos (inclui taxValue)
subscribeToPayments(apartamentoId, (payments) => {
  // Pagamentos incluem valor da taxa utilizada
});
```

## 💡 Regras de Negócio

### ✅ Validações Implementadas
- **Valor positivo:** Taxa deve ser maior que zero
- **Motivo obrigatório:** Todas as alterações precisam de justificativa
- **Valor diferente:** Nova taxa deve ser diferente da atual
- **Data automática:** Vigência sempre a partir da data atual
- **Usuário registrado:** Todas as alterações são auditadas

### 🔒 Proteções de Dados
- **Pagamentos antigos** nunca são alterados
- **Histórico permanente** de todas as taxas
- **Referência preservada** entre pagamento e taxa
- **Auditoria completa** de responsáveis

### 📊 Comportamento do Sistema
- **Taxa padrão:** R$ 285,00 para novos condomínios
- **Vigência imediata:** Alterações valem para novos pagamentos
- **Fallback seguro:** Sistema usa taxa padrão se não encontrar
- **Sincronização:** Atualizações em tempo real

## 🎨 Design e UX

### 🎯 Elementos Visuais
- **Cor laranja/amarela** para identificar seção de taxas
- **Indicador "ATUAL"** na taxa vigente do histórico
- **Cards diferenciados** para cada seção
- **Animações suaves** nas transições

### 📱 Responsividade
- **Layout adaptativo** para mobile e desktop
- **Formulários otimizados** para toque
- **Histórico scrollável** em dispositivos pequenos
- **Botões grandes** para facilitar interação

### ♿ Acessibilidade
- **Labels descritivos** em todos os campos
- **Feedback visual** para ações
- **Estados de loading** durante operações
- **Mensagens claras** de erro e sucesso

## 🚀 Benefícios do Sistema

### 💼 Para Administradores
- **Controle total** sobre taxas de cada condomínio
- **Flexibilidade** para ajustes quando necessário
- **Transparência** com histórico completo
- **Auditoria** de todas as alterações

### 👥 Para Operadores
- **Valores corretos** automaticamente aplicados
- **Visibilidade** das taxas vigentes
- **Histórico disponível** para consulta
- **Processo simplificado** de pagamentos

### 📊 Para o Sistema
- **Dados consistentes** e auditáveis
- **Performance otimizada** com índices adequados
- **Escalabilidade** para múltiplos condomínios
- **Integridade** de dados garantida

## 🔮 Possíveis Expansões Futuras

### 📅 Agendamento de Alterações
- Programar mudanças de taxa para datas futuras
- Sistema de aprovação para alterações
- Notificações automáticas de mudanças

### 📊 Relatórios Avançados
- Gráficos de evolução das taxas
- Comparativo entre condomínios
- Análise de impacto das alterações

### 🔔 Notificações
- Alertas para moradores sobre mudanças
- Notificações push para administradores
- E-mails automáticos de comunicação

### 💳 Integração Financeira
- Cálculo automático de reajustes
- Integração com índices de inflação
- Sugestões de valores baseadas em dados

---

**O sistema de taxa individual oferece flexibilidade total mantendo a integridade e auditoria completa dos dados financeiros.**