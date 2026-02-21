# Módulo de Aluguel de Salão - Guia Completo

## 🏢 Acesso ao Módulo

### Como Acessar
1. **Navegue até um condomínio** (Condomínio → Bloco → Apartamentos)
2. **Clique no botão "Salão de Festas"** (laranja) no canto superior direito
3. **Acesse o calendário** do salão daquele condomínio

### Contexto
- **Cada condomínio** tem seu próprio salão
- **Reservas são específicas** por condomínio
- **Apartamentos do condomínio** podem fazer reservas

## 📅 Interface do Calendário

### Navegação Mensal
- **Botões de navegação** (← →) para mudar mês/ano
- **Mês e ano atual** destacados no centro
- **Navegação fluida** entre períodos

### Legenda Visual
- **🔵 Azul Claro**: Datas disponíveis
- **⚫ Cinza**: Datas reservadas (não pagas)
- **🟢 Verde**: Datas pagas

### Grid do Calendário
- **Layout semanal** (Dom-Sáb)
- **Dias do mês atual** destacados
- **Dias passados** desabilitados (opacidade reduzida)
- **Hoje** marcado com fundo azul

## 🎯 Funcionalidades de Reserva

### Criar Nova Reserva
1. **Clique em data disponível** (azul claro)
2. **Selecione apartamento** responsável
3. **Digite valor** (padrão: R$ 150,00)
4. **Escolha status**: Reservado ou Pago
5. **Confirme** - registro imediato

### Editar Reserva Existente
1. **Clique em data ocupada** (cinza ou verde)
2. **Modifique dados** conforme necessário
3. **Atualize** ou **exclua** a reserva
4. **Confirmação** automática

### Status de Reserva
- **Reservado** (Cinza): Apartamento fez reserva mas ainda não pagou
- **Pago** (Verde): Reserva quitada

## 💰 Sistema de Pagamentos

### Integração Automática
- **Status "Pago"** cria automaticamente entrada nos pagamentos
- **Sincronização** com módulo de pagamentos do apartamento
- **Histórico completo** mantido

### Valores
- **Valor padrão**: R$ 150,00
- **Valores personalizados** permitidos
- **Edição** de valores a qualquer momento

## 🏠 Seleção de Apartamentos

### Lista Dinâmica
- **Apartamentos do condomínio** selecionado automaticamente
- **Ordenação** por número do apartamento
- **Informações completas**: Tipo, número e proprietário
- **Formato**: "Apartamento 101 - João Silva"

### Tipos de Unidade
- **Apartamentos**: Numeração padrão (101, 102, etc.)
- **Casas**: Identificação específica (Casa 01, Casa 02, etc.)

## 📱 Interface Responsiva

### Mobile (< 640px)
- **Calendário compacto** otimizado para toque
- **Botões grandes** para navegação
- **Modal fullscreen** para reservas
- **Legenda vertical** para melhor visualização

### Tablet/Desktop
- **Grid expandido** com mais espaço
- **Hover effects** nos dias disponíveis
- **Modal centralizado** com mais informações
- **Legenda horizontal** compacta

## 🎨 Estados Visuais

### Dias do Calendário
- **Disponível**: Fundo branco, barra azul na base
- **Reservado**: Fundo branco, barra cinza na base
- **Pago**: Fundo branco, barra verde na base
- **Hoje**: Fundo azul, texto branco
- **Passado**: Opacidade reduzida, não clicável

### Informações Adicionais
- **Número do apartamento** exibido em reservas
- **Tipo de unidade** (Apt/Casa) identificado
- **Hover effects** para melhor interação

## 🔄 Fluxo de Uso Completo

### Cenário 1: Nova Reserva
1. Acessar salão do condomínio
2. Navegar para mês desejado
3. Clicar em data disponível (azul)
4. Selecionar apartamento responsável
5. Definir valor e status
6. Confirmar reserva

### Cenário 2: Pagamento de Reserva
1. Localizar reserva existente (cinza)
2. Clicar na data reservada
3. Alterar status para "Pago"
4. Confirmar alteração
5. Data fica verde automaticamente

### Cenário 3: Cancelamento
1. Clicar em data reservada
2. Usar botão "Excluir" no modal
3. Confirmar exclusão
4. Data volta a ficar disponível (azul)

### Cenário 4: Edição de Valor
1. Clicar em reserva paga (verde)
2. Alterar valor conforme necessário
3. Manter status "Pago"
4. Atualizar informações

## ⚡ Características Técnicas

### Performance
- **Renderização otimizada** do calendário
- **Navegação fluida** entre meses
- **Carregamento instantâneo** de dados
- **Cache local** para melhor experiência

### Persistência
- **Salvamento automático** após cada ação
- **Dados mantidos** entre sessões
- **Sincronização** com pagamentos
- **Backup local** das reservas

### Validações
- **Datas passadas** não podem ser reservadas
- **Apartamento obrigatório** para reservas
- **Valores positivos** obrigatórios
- **Prevenção de conflitos** automática

## 🧪 Cenários de Teste

### Teste 1: Fluxo Básico
1. Carregar dados dos condomínios
2. Navegar: Condomínio → Bloco → Apartamentos
3. Clicar "Salão de Festas"
4. Fazer nova reserva
5. Verificar status visual

### Teste 2: Navegação Temporal
1. Navegar entre diferentes meses
2. Testar anos futuros
3. Verificar datas passadas desabilitadas
4. Testar navegação rápida

### Teste 3: Estados de Reserva
1. Criar reserva como "Reservado"
2. Alterar para "Pago"
3. Verificar mudança de cor
4. Testar exclusão

### Teste 4: Responsividade
1. Testar em mobile (< 640px)
2. Verificar calendário compacto
3. Testar modal responsivo
4. Validar usabilidade touch

### Teste 5: Integração
1. Fazer reserva como "Pago"
2. Navegar para apartamento responsável
3. Verificar pagamento na aba "Salão"
4. Confirmar sincronização

## 💡 Melhorias Implementadas

- **Calendário visual intuitivo** com cores claras
- **Navegação temporal** fluida
- **Seleção automática** de apartamentos por condomínio
- **Estados visuais** bem definidos
- **Integração completa** com sistema de pagamentos
- **Interface responsiva** para todos os dispositivos
- **Validações inteligentes** de datas e valores
- **Feedback visual** imediato
- **Persistência confiável** dos dados
- **Modal intuitivo** para reservas
- **Exclusão segura** com confirmação

## 🎯 Benefícios do Sistema

- **Gestão centralizada** por condomínio
- **Controle visual** de disponibilidade
- **Processo simplificado** de reserva
- **Integração automática** com pagamentos
- **Histórico completo** de reservas
- **Interface moderna** e intuitiva
- **Acesso rápido** a partir dos apartamentos
- **Responsividade total** para uso móvel