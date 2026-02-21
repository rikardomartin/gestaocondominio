# Sistema de Perfis de Acesso

## 📋 Visão Geral

O sistema de gestão condominial agora possui três perfis de acesso distintos, cada um com permissões específicas para garantir segurança e controle adequado das operações.

## 👥 Perfis Disponíveis

### 🔑 Administrador
- **Usuário:** `admin`
- **Senha:** `admin123`
- **Permissões:**
  - ✅ Acesso total ao sistema
  - ✅ Registra pagamentos de condomínio
  - ✅ Gera planilhas (Excel/CSV)
  - ✅ Gerencia aluguel de salão de festas
  - ✅ Carrega dados dos condomínios
  - ✅ Altera estrutura do sistema
  - ✅ Futuramente: gerenciará moradores

### 👨‍💼 Operador
- **Usuário:** `operador`
- **Senha:** `op123`
- **Permissões:**
  - ✅ Registra pagamentos de condomínio
  - ✅ Consulta débitos e status
  - ✅ Visualiza todas as informações
  - ❌ Não gera relatórios
  - ❌ Não gerencia salão de festas
  - ❌ Não altera estrutura do sistema

### 👁️ Visualização
- **Usuário:** `visualizar`
- **Senha:** `view123`
- **Permissões:**
  - ✅ Apenas leitura de todas as informações
  - ❌ Não registra pagamentos
  - ❌ Não gera relatórios
  - ❌ Não gerencia salão
  - ❌ Não altera dados

## 🔐 Funcionalidades de Segurança

### Autenticação
- Login obrigatório para acesso ao sistema
- Sessão persistente (mantém login após fechar navegador)
- Logout seguro com confirmação
- Validação de credenciais em tempo real

### Controle de Permissões
- Elementos da interface são automaticamente ocultados/desabilitados baseado no perfil
- Validação de permissões no backend antes de executar ações
- Mensagens de erro específicas para ações não permitidas
- Classes CSS automáticas para controle visual (`user-admin`, `user-operator`, `user-viewer`)

### Interface Adaptativa
- **Administrador:** Vê todos os botões e funcionalidades
- **Operador:** Botões de exportação e salão ficam ocultos
- **Visualização:** Todos os botões de ação ficam desabilitados (read-only)

## 🎨 Indicadores Visuais

### Header do Sistema
- Mostra nome e perfil do usuário logado
- Botão de logout sempre visível
- Informações do usuário no canto superior direito

### Estados dos Elementos
- **Habilitado:** Elementos normais e clicáveis
- **Desabilitado:** Elementos com opacidade reduzida e cursor "not-allowed"
- **Oculto:** Elementos completamente removidos da interface

### Classes CSS de Controle
```css
.admin-only     /* Visível apenas para administradores */
.operator-only  /* Visível para admin e operador */
.viewer-only    /* Visível para todos (padrão) */
.read-only      /* Desabilitado para visualização */
```

## 🔄 Fluxo de Autenticação

1. **Acesso Inicial:** Sistema sempre inicia na tela de login
2. **Validação:** Credenciais são verificadas contra perfis pré-definidos
3. **Sessão:** Login bem-sucedido cria sessão persistente
4. **Interface:** Sistema adapta interface baseado no perfil
5. **Navegação:** Todas as telas verificam autenticação
6. **Logout:** Limpa sessão e retorna ao login

## 📱 Compatibilidade PWA

O sistema de autenticação é totalmente compatível com o modo PWA:
- Sessões persistem mesmo quando instalado como app
- Interface se adapta ao modo standalone
- Funciona offline após login inicial
- Dados de sessão são salvos localmente

## 🛡️ Segurança Implementada

### Validações
- Verificação de permissões em todas as ações críticas
- Proteção contra acesso direto a telas sem autenticação
- Validação dupla: interface + backend

### Armazenamento
- Dados de sessão salvos no localStorage
- Senhas não são armazenadas (apenas validadas)
- Limpeza automática de dados sensíveis no logout

### Controle de Acesso
- Funções críticas verificam permissões antes da execução
- Elementos da interface são dinamicamente controlados
- Mensagens de erro específicas para cada tipo de restrição

## 🚀 Uso do Sistema

### Para Administradores
1. Faça login com `admin` / `admin123`
2. Acesse todas as funcionalidades normalmente
3. Use "Carregar Dados" para importar condomínios
4. Gerencie salão de festas e exporte relatórios

### Para Operadores
1. Faça login com `operador` / `op123`
2. Registre pagamentos e consulte débitos
3. Navegue por todos os condomínios e apartamentos
4. Botões de exportação e salão não estarão disponíveis

### Para Visualização
1. Faça login com `visualizar` / `view123`
2. Navegue e consulte todas as informações
3. Todos os botões de ação estarão desabilitados
4. Interface em modo somente leitura

## 🔧 Configuração Técnica

### Estrutura de Perfis
```javascript
const userProfiles = {
    admin: {
        permissions: {
            viewAll: true,
            registerPayments: true,
            generateReports: true,
            manageSalao: true,
            manageStructure: true
        }
    }
    // ... outros perfis
}
```

### Verificação de Permissões
```javascript
function requirePermission(permission) {
    if (!hasPermission(permission)) {
        showToast('Sem permissão', 'error');
        return false;
    }
    return true;
}
```

O sistema está pronto para uso em produção com controle completo de acesso e segurança adequada para um ambiente corporativo.