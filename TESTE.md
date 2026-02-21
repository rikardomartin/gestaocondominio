# Como Testar o Sistema de Gestão Condominial

## 🚀 Iniciando o Sistema

1. **Abra o arquivo `index.html` em um navegador**
2. **Aguarde o carregamento** (tela azul com spinner)
3. **Para testar rapidamente**, use os botões de demonstração (apenas em localhost):
   - **"Carregar Dados Demo"** - Adiciona dados de exemplo
   - **"Limpar Dados"** - Remove todos os dados

## 📱 Testando a Navegação

### Fluxo Principal: Condomínio → Bloco → Apartamento → Pagamentos

1. **Tela de Condomínios**
   - Clique em "Adicionar" para criar um novo condomínio
   - Clique em um card de condomínio para navegar para os blocos

2. **Tela de Blocos**
   - Use o botão "voltar" (←) para retornar
   - Adicione blocos (ex: "Bloco A", "Torre 1")
   - Clique em um bloco para ver apartamentos

3. **Tela de Apartamentos**
   - Adicione apartamentos com número e proprietário
   - Observe o indicador de status (Em dia/Pendente)
   - Clique em um apartamento para gerenciar pagamentos

4. **Tela de Pagamentos**
   - Alterne entre abas "Condomínio" e "Salão"
   - Adicione pagamentos e observe as animações
   - Veja os estados visuais (verde = pago)

## 🎨 Testando o Design

### Estados Visuais
- **Hover**: Passe o mouse sobre cards e botões
- **Active**: Clique e segure botões
- **Loading**: Observe animações ao adicionar pagamentos
- **Seleção**: Cards ficam azuis quando selecionados

### Responsividade
- **Mobile**: Teste em tela pequena (< 640px)
- **Tablet**: Teste em tela média (640px - 768px)
- **Desktop**: Teste em tela grande (> 768px)

### Cores e Estados
- **Azul**: Elementos primários e selecionados
- **Verde**: Pagamentos realizados, botões de sucesso
- **Vermelho**: Botões de exclusão, status pendente
- **Laranja**: Botões de edição, status atrasado

## 🧪 Cenários de Teste

### Teste 1: Fluxo Completo
1. Criar condomínio "Meu Condomínio"
2. Adicionar "Bloco A"
3. Adicionar apartamento "101" - "João Silva"
4. Adicionar pagamento de condomínio para mês atual
5. Adicionar pagamento de salão para data específica
6. Verificar se status mudou para "Em dia"

### Teste 2: Validações
1. Tentar adicionar pagamento sem preencher campos
2. Tentar adicionar pagamento duplicado (mesmo mês)
3. Tentar adicionar valor negativo ou zero
4. Verificar mensagens de erro (toast vermelho)

### Teste 3: Exclusões
1. Excluir um pagamento
2. Excluir um apartamento (confirmar que pagamentos são removidos)
3. Excluir um bloco (confirmar cascata)
4. Excluir um condomínio (confirmar limpeza completa)

### Teste 4: Persistência
1. Adicionar alguns dados
2. Recarregar a página (F5)
3. Verificar se dados permanecem
4. Testar em abas diferentes do navegador

## 📱 Testando PWA

### Instalação
1. **Chrome/Edge**: Procure ícone de instalação na barra de endereços
2. **Mobile**: Use menu "Adicionar à tela inicial"
3. **Safari iOS**: Botão compartilhar → "Adicionar à Tela de Início"

### Funcionalidades PWA
- **Offline**: Desconecte internet e teste funcionamento
- **Ícone**: Verifique se aparece na tela inicial
- **Splash Screen**: Observe tela de carregamento
- **Standalone**: App abre sem barra do navegador

## 🎯 Pontos de Atenção

### Performance
- **Animações suaves** em dispositivos móveis
- **Carregamento rápido** da interface
- **Responsividade** sem quebras de layout

### Usabilidade
- **Botões grandes** para toque fácil
- **Feedback visual** claro em todas as ações
- **Navegação intuitiva** com breadcrumbs visuais
- **Mensagens claras** de sucesso/erro

### Acessibilidade
- **Contraste adequado** entre texto e fundo
- **Foco visível** ao navegar com teclado
- **Textos legíveis** em diferentes tamanhos de tela

## 🐛 Problemas Conhecidos

- Ícones PWA precisam ser gerados (pasta `/icons/`)
- Dados são salvos apenas localmente (localStorage)
- Sem sincronização entre dispositivos
- Sem backup automático

## 💡 Melhorias Futuras

- Relatórios em PDF
- Gráficos de pagamentos
- Notificações de vencimento
- Backup na nuvem
- Múltiplos usuários
- Modo escuro
- Exportação de dados