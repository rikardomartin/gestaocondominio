// Sistema de Gestao Condominial - v131 - 2026-02-04
// OTIMIZAÇÃO: Query única para pagamentos por condomínio
// - Substituído N queries (1 por apartamento/casa) por 1 query única
// - getPaymentsByCondominioAndPeriod busca todos pagamentos do período de uma vez
// - Reduz drasticamente tempo de carregamento ao clicar em apartamentos
// - Melhora performance em condomínios com muitas casas
// AJUSTE: Notificações apenas quando outro admin faz alteração
// - Admin principal (admin@condominio.com) recebe notificações
// - Quando admin2 ou outros marcam como PAGO/RECICLADO/ACORDO
// - Admin principal não recebe notificação das próprias ações
// IMPLEMENTADO: Notificações Push Diretas (sem FCM)
// - Funciona com app aberto e fechado
// - Som e vibração como PIX bancário
// - Notificação ao marcar como PAGO, RECICLADO ou ACORDO
// - Apenas para admin@condominio.com
// COMPLETO: Sistema de Notificações Push FCM configurado
// - Chave VAPID: BKl3zSFNJs-D2MZRkxSS-sMuTPg15Tz...
// - Cloud Functions criadas (sendPaymentNotification, cleanupOldTokens, sendTestNotification)
// - Regras Firestore atualizadas
// - Scripts de deploy prontos
// NOVO: Notificações Push com Firebase Cloud Messaging
// - Notificações aparecem com app fechado (como PIX bancário)
// - Som, vibração e tela bloqueada
// - Botões de ação: Ver Detalhes e Fechar
// - Apenas para admin@condominio.com
// FIX: Query simplificada com Timestamp para evitar timeout
// FIX: Corrige busca de pagamentos hoje (apartamentos é array, não Map)
// NOVO: FAB Pagamentos Hoje - Modal para admin ver pagamentos do dia
// - Botão flutuante verde no canto inferior direito
// - Visível apenas para admin@condominio.com
// - Mostra quantidade, condomínios, apartamentos e valor total
// - Lista agrupada por condomínio com detalhes completos
// FIX: Adiciona opções padrão "Selecione..." nos filtros
// - Adiciona "Selecione um ano" no filtro de anos
// - Adiciona "Selecione um condomínio" no filtro de condomínios
// - Adiciona "Selecione um bloco" no filtro de blocos
// - Evita auto-seleção e desaparecimento de filtros
// FIX: Corrige exportação Excel/CSV
// - Remove colunas extras e textos automáticos indesejados
// - Adiciona coluna Valor (R$)
// - Limpa observações: "Pagamento em massa", "Script", "-"
// - Formato limpo: Condominio | Bloco | Apt | Ano | Mes | Status | Valor | Obs
// - Mantém apenas funcionalidade específica por condomínio (futura)
// CORRECAO PAINEL ESPECIFICO: Cria painel específico por condomínio
// CORRECAO PAINEL VALORES: Pendente agora exibe R$ 80 (valor potencial a receber)
// CORRECAO PAINEL CALCULO: Corrige cálculo de valores na tabela e resumo
// CORRECAO PAINEL ALERTA: Remove alerta "Muitos dados" quando há filtro aplicado
// CORRECAO ANOS: Padroniza limite de anos para 2040 (Dashboard e Painel)
// CORRECAO PERFORMANCE: Otimiza getFilteredData com cache e limite de 1000 registros
// CORRECAO ERROS: Tratamento específico para 400/404 sem retry desnecessário
// CORRECAO PAINEL PERFORMANCE: Otimiza carregamento (1 query por bloco vs N por apartamento)
// CORRECAO PAINEL TIMEOUT: Adiciona timeout de 60s para evitar travamento
// CORRECAO PAINEL: Carrega pagamentos para sincronizar com painel geral
// CORRECAO CONTADORES: Sincroniza lógica de contadores com listagem individual
// CORRECAO PERIODO: Recarrega dados ao mudar ano/mes
// CORRECAO CASAS: Inclui casas no cálculo de percentuais
// Importar mÃ³dulos Firebase
import {
    initAuthListener,
    loginWithEmail,
    logout,
    hasPermission,
    getCurrentUser,
    getCurrentProfile,
    USER_ROLES
} from './firebase-auth.js';

import {
    getCondominios,
    getBlocosByCondominio,
    getApartamentosByBloco,
    updateApartamento,
    getCasasByCondominio,
    updateCasa,
    getPaymentsByApartamento,
    createPayment,
    updatePayment,
    deletePayment,
    getSalaoReservationsByCondominio,
    createSalaoReservation,
    updateSalaoReservation,
    deleteSalaoReservation,
    getDashboardData,
    initializeCondominiosStructure,
    subscribeToCondominios,
    subscribeToPayments,
    subscribeToSalaoReservations,
    // Funções de taxa
    getCondominioTaxes,
    createCondominioTax,
    getCurrentTax,
    subscribeToCondominioTaxes,
    getPaymentsByBlocoAndPeriod,
    getPaymentsByCondominioAndPeriod
} from './firebase-database.js';

// Estado da aplicação
let appState = {
    currentScreen: 'login',
    selectedCondominio: null,
    selectedBloco: null,
    selectedApartamento: null,
    currentYear: new Date().getFullYear(),
    selectedMonth: null,
    // Controle manual de período ativo
    activeYear: null,
    activeMonth: null,
    // Salão state
    salaoCurrentMonth: new Date().getMonth(),
    salaoCurrentYear: new Date().getFullYear(),
    selectedDate: null,
    condominios: [],
    blocos: [],
    apartamentos: [],
    casas: [],
    payments: {
        condominio: [],
        salao: []
    },
    salaoReservations: [],
    // Sistema de autenticação Firebase
    currentUser: null,
    userProfile: null,
    isAuthenticated: false,
    // Listeners para cleanup
    unsubscribeFunctions: [],
    unsubscribeSalao: null,
    // Taxa do condomínio
    condominioTaxes: [],
    currentTax: null
};

// Expor appState globalmente para scripts externos
window.appState = appState;

// Paginação do painel
let currentPage = 1;
const itemsPerPage = 50;

// Elementos DOM
const elements = {
    loading: document.getElementById('loading'),
    header: document.getElementById('header'),
    main: document.getElementById('main'),
    backBtn: document.getElementById('backBtn'),
    pageTitle: document.getElementById('pageTitle'),

    // Login elements
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),

    // User info
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    logoutBtn: document.getElementById('logoutBtn'),

    // Screens
    condominiosScreen: document.getElementById('condominiosScreen'),
    condominiosScreen: document.getElementById('condominiosScreen'),
    // dashboardScreen: document.getElementById('dashboardScreen'), // Removed
    blocosScreen: document.getElementById('blocosScreen'),
    blocosScreen: document.getElementById('blocosScreen'),
    apartamentosScreen: document.getElementById('apartamentosScreen'),
    pagamentosScreen: document.getElementById('pagamentosScreen'),
    salaoScreen: document.getElementById('salaoScreen'),
    painelScreen: document.getElementById('painelScreen'),
    taxaScreen: document.getElementById('taxaScreen'),

    // Lists
    condominiosList: document.getElementById('condominiosList'),
    blocosList: document.getElementById('blocosList'),
    casasSection: document.getElementById('casasSection'),
    casasList: document.getElementById('casasList'),
    apartamentosList: document.getElementById('apartamentosList'),

    // Modal elements
    apartmentModal: document.getElementById('apartmentModal'),
    houseResidentGroup: document.getElementById('houseResidentGroup'),
    houseResidentName: document.getElementById('houseResidentName'),

    // Dashboard elements
    // Dashboard elements (now in Blocos Screen)
    // dashboardTitle: document.getElementById('dashboardTitle'),
    // goToBlocosBtn: document.getElementById('goToBlocosBtn'),
    goToSalaoBtn: document.getElementById('goToSalaoBtn'),
    // goToPainelBtn removido (Painel Geral centralizado no dashboard principal)
    // goToTaxaBtn: document.getElementById('goToTaxaBtn'),

    // Period selector elements
    activeYear: document.getElementById('activeYear'),
    activeMonth: document.getElementById('activeMonth'),
    activePeriodText: document.getElementById('activePeriodText'),

    // Buttons
    salaoBtn: document.getElementById('salaoBtn'),
    painelBtn: document.getElementById('painelBtn'),
    taxaBtn: document.getElementById('taxaBtn'),

    // Payment elements
    apartmentTitle: document.getElementById('apartmentTitle'),
    apartmentLocation: document.getElementById('apartmentLocation'),
    payYearBtn: document.getElementById('payYearBtn'),
    debtAlert: document.getElementById('debtAlert'),
    debtMessage: document.getElementById('debtMessage'),
    currentYear: document.getElementById('currentYear'),
    prevYear: document.getElementById('prevYear'),
    nextYear: document.getElementById('nextYear'),
    monthsGrid: document.getElementById('monthsGrid'),

    // Payment modal
    paymentModal: document.getElementById('paymentModal'),
    paymentModalTitle: document.getElementById('paymentModalTitle'),
    paymentMonth: document.getElementById('paymentMonth'),
    paymentValue: document.getElementById('paymentValue'),
    closePaymentModal: document.getElementById('closePaymentModal'),
    cancelPayment: document.getElementById('cancelPayment'),
    confirmPayment: document.getElementById('confirmPayment'),

    // SalÃ£o elements
    salaoCondominio: document.getElementById('salaoCondominio'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    calendarMonth: document.getElementById('calendarMonth'),
    calendarYear: document.getElementById('calendarYear'),
    calendarGrid: document.getElementById('calendarGrid'),

    // Reservation modal
    reservationModal: document.getElementById('reservationModal'),
    reservationModalTitle: document.getElementById('reservationModalTitle'),
    reservationDate: document.getElementById('reservationDate'),
    apartmentSelect: document.getElementById('apartmentSelect'),
    reservationValue: document.getElementById('reservationValue'),
    closeReservationModal: document.getElementById('closeReservationModal'),
    cancelReservation: document.getElementById('cancelReservation'),
    deleteReservation: document.getElementById('deleteReservation'),
    confirmReservation: document.getElementById('confirmReservation'),

    // Agenda modal
    openAgendaBtn: document.getElementById('openAgendaBtn'),
    agendaModal: document.getElementById('agendaModal'),
    agendaModalTitle: document.getElementById('agendaModalTitle'),
    agendaMonthYear: document.getElementById('agendaMonthYear'),
    closeAgendaModal: document.getElementById('closeAgendaModal'),
    closeAgendaModalBtn: document.getElementById('closeAgendaModalBtn'),
    availableDays: document.getElementById('availableDays'),
    reservedDays: document.getElementById('reservedDays'),
    paidReservations: document.getElementById('paidReservations'),
    reservationsList: document.getElementById('reservationsList'),
    exportAgenda: document.getElementById('exportAgenda'),

    // Painel elements
    filterAno: document.getElementById('filterAno'),
    filterCondominio: document.getElementById('filterCondominio'),
    filterBloco: document.getElementById('filterBloco'),
    filterMes: document.getElementById('filterMes'),
    clearFilters: document.getElementById('clearFilters'),
    exportExcel: document.getElementById('exportExcel'),
    exportCSV: document.getElementById('exportCSV'),
    // Resumo removido do Painel Geral (sem sinalizadores)
    tableInfo: document.getElementById('tableInfo'),
    paymentsTableBody: document.getElementById('paymentsTableBody'),

    // Taxa elements
    currentTaxValue: document.getElementById('currentTaxValue'),
    taxHistoryList: document.getElementById('taxHistoryList'),
    newTaxValue: document.getElementById('newTaxValue'),
    taxReason: document.getElementById('taxReason'),
    updateTaxBtn: document.getElementById('updateTaxBtn'),

    // Modal
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalInput: document.getElementById('modalInput'),
    modalCancel: document.getElementById('modalCancel'),
    modalConfirm: document.getElementById('modalConfirm'),
    closeModal: document.getElementById('closeModal'),

    // Toast
    toast: document.getElementById('toast'),

    // Apartment Status Modal
    apartmentModalTitle: document.getElementById('apartmentModalTitle'),
    closeApartmentModal: document.getElementById('closeApartmentModal'),
    apartmentBreadcrumb: document.getElementById('apartmentBreadcrumb'),
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Gestao Condominial - Inicializando...');
    console.log('📋 Versão: v104 - Nome Único na Exportação');

    try {
        initializeApp();
        // setupVersionIndicator(); - REMOVIDO
        console.log('✅ Event listener DOMContentLoaded configurado');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        if (typeof showToast === 'function') {
            showToast('Erro na inicialização do sistema', 'error');
        }
    }
});

// Configurar indicador de versão - REMOVIDO

async function initializeApp() {
    console.log('🔧 Iniciando configuração da aplicação...');

    try {
        // Simular carregamento com tempo mÃ­nimo para mostrar splash
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Inicializar listener de autenticaÃ§Ã£o Firebase
        initAuthListener(handleAuthStateChange);

        // Configurar event listeners
        setupEventListeners();

        // Inicializar funcionalidades PWA
        initializePWA();

        // Mostrar interface
        elements.loading.classList.add('hidden');
        elements.header.classList.remove('hidden');
        elements.main.classList.remove('hidden');

        // A tela inicial serÃ¡ definida pelo handleAuthStateChange

        // Mostrar banner de instalaÃ§Ã£o apÃ³s delay
        setTimeout(() => {
            if (!isStandalone() && deferredPrompt && appState.isAuthenticated) {
                showInstallBanner();
            }
        }, 3000);

        console.log('✅ Aplicação totalmente inicializada');

    } catch (error) {
        console.error('❌ Erro durante inicialização:', error);
        if (typeof showToast === 'function') {
            showToast('Erro durante inicialização: ' + error.message, 'error');
        }
    }
}

// Funcoes de autenticacao
async function handleLogin(e) {
    e.preventDefault();

    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();

    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Entrando...';

    try {
        const { user, profile } = await loginWithEmail(email, password);
        elements.loginForm.reset();
        elements.loginError.classList.add('hidden');
        showToast(`Bem-vindo, ${profile.name}!`, 'success');
    } catch (error) {
        console.error('Erro no login:', error);
        let errorMessage = 'E-mail ou senha incorretos';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuario nao encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Senha incorreta';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'E-mail invalido';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Usuario desabilitado';
        }
        elements.loginError.textContent = errorMessage;
        elements.loginError.classList.remove('hidden');
        elements.passwordInput.value = '';
        elements.passwordInput.focus();
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10,17 15,12 10,7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Entrar
        `;
    }
}

async function handleLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        try {
            await logout();
            showToast('Logout realizado com sucesso', 'success');
        } catch (error) {
            console.error('Erro no logout:', error);
            showToast('Erro ao fazer logout', 'error');
        }
    }
}

function cleanupListeners() {
    appState.unsubscribeFunctions.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    });
    appState.unsubscribeFunctions = [];
}

function getStatusForExport(status) {
    const key = (status || '').toString().trim().toLowerCase();
    const statusMap = {
        'pendente': 'PENDENTE',
        'pago': 'PAGO',
        'reciclado': 'PAGO RECICLADO',
        'acordo': 'ACORDO',
        'paid': 'PAGO',
        'pending': 'PENDENTE',
        'agreement': 'ACORDO'
    };
    return statusMap[key] || statusMap[status] || 'PENDENTE';
}

async function exportToExcel() {
    if (!requirePermission('generateReports')) return;

    const data = await getFilteredData();
    if (data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }

    const excelData = [
        ['Condominio', 'Bloco', 'Apartamento', 'Ano', 'Mes', 'Status', 'Valor', 'Observacoes']
    ];

    const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    data.forEach(item => {
        const mesNome = monthNames[parseInt(item.mes)] || item.mes;
        
        // Limpar observações automáticas indesejadas
        let observacao = item.observacao || '';
        if (observacao.includes('Pagamento em massa') || 
            observacao.includes('Script') || 
            observacao === '-') {
            observacao = '';
        }
        
        // CORRECAO v121: Detectar e limpar observações incompatíveis com status PAGO
        if (item.status === 'pago') {
            const incompatiblePhrases = [
                'metade',
                'parcial',
                'falta',
                'pendente',
                'não pagou',
                'nao pagou',
                'deve',
                'devendo',
                'atrasado'
            ];
            
            const hasIncompatiblePhrase = incompatiblePhrases.some(phrase => 
                observacao.toLowerCase().includes(phrase)
            );
            
            if (hasIncompatiblePhrase) {
                console.warn(`⚠️ Inconsistência detectada: ${item.apartamento} - Status PAGO com observação incompatível. Limpando...`);
                observacao = ''; // Limpar observação incompatível
            }
        }
        
        excelData.push([
            item.condominio,
            item.bloco,
            item.apartamento,
            item.ano,
            mesNome,
            getStatusForExport(item.status),
            `R$ ${item.value.toFixed(2)}`,
            observacao
        ]);
    });

    const csvContent = excelData.map(row => row.join('\t')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Nome único com data e hora
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // 2026-02-01T22-30-45
    const fileName = `pagamentos-condominio-${timestamp}.xls`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    showToast('Arquivo Excel exportado!', 'success');
}

async function exportToCSV() {
    if (!requirePermission('generateReports')) return;

    const data = await getFilteredData();
    if (data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }

    const csvData = [
        ['Condominio', 'Bloco', 'Apartamento', 'Ano', 'Mes', 'Status', 'Valor', 'Observacoes']
    ];

    const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    data.forEach(item => {
        const mesNome = monthNames[parseInt(item.mes)] || item.mes;
        
        // Limpar observações automáticas indesejadas
        let observacao = item.observacao || '';
        if (observacao.includes('Pagamento em massa') || 
            observacao.includes('Script') || 
            observacao === '-') {
            observacao = '';
        }
        
        // CORRECAO v121: Detectar e limpar observações incompatíveis com status PAGO
        if (item.status === 'pago') {
            const incompatiblePhrases = [
                'metade',
                'parcial',
                'falta',
                'pendente',
                'não pagou',
                'nao pagou',
                'deve',
                'devendo',
                'atrasado'
            ];
            
            const hasIncompatiblePhrase = incompatiblePhrases.some(phrase => 
                observacao.toLowerCase().includes(phrase)
            );
            
            if (hasIncompatiblePhrase) {
                console.warn(`⚠️ Inconsistência detectada: ${item.apartamento} - Status PAGO com observação incompatível. Limpando...`);
                observacao = ''; // Limpar observação incompatível
            }
        }
        
        csvData.push([
            item.condominio,
            item.bloco,
            item.apartamento,
            item.ano,
            mesNome,
            getStatusForExport(item.status),
            `R$ ${item.value.toFixed(2)}`,
            observacao
        ]);
    });

    const csvContent = csvData.map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Nome único com data e hora
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // 2026-02-01T22-30-45
    const fileName = `pagamentos-condominio-${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    showToast('Arquivo CSV exportado!', 'success');
}

async function handleUpdateTax(e) {
    e.preventDefault();

    if (!requirePermission('manageStructure')) return;

    const newValue = parseFloat(elements.newTaxValue.value);
    const reason = elements.taxReason.value.trim();

    if (!newValue || newValue <= 0) {
        showToast('Valor da taxa deve ser maior que zero', 'error');
        return;
    }

    if (!reason) {
        showToast('Motivo da alteracao e obrigatorio', 'error');
        return;
    }

    if (appState.currentTax && Math.abs(appState.currentTax.value - newValue) < 0.01) {
        showToast('O novo valor deve ser diferente da taxa atual', 'warning');
        return;
    }

    try {
        elements.updateTaxBtn.disabled = true;
        elements.updateTaxBtn.textContent = 'Atualizando...';

        await createCondominioTax(appState.selectedCondominio.id, {
            value: newValue,
            reason: reason,
            effectiveDate: new Date().toISOString().split('T')[0]
        });

        elements.newTaxValue.value = '';
        elements.taxReason.value = '';

        showToast('Taxa atualizada com sucesso!', 'success');

        const updatedTax = await getCurrentTax(appState.selectedCondominio.id);
        appState.currentTax = updatedTax;
        updateCurrentTaxDisplay(updatedTax);

    } catch (error) {
        console.error('Erro ao atualizar taxa:', error);
        showToast('Erro ao atualizar taxa', 'error');
    } finally {
        elements.updateTaxBtn.disabled = false;
        elements.updateTaxBtn.textContent = 'Atualizar Taxa';
    }
}

function updateUserInterface() {
    if (appState.isAuthenticated && appState.userProfile) {
        // Mostrar informações do usuário
        if (elements.userName) elements.userName.textContent = appState.userProfile.name;
        if (elements.userRole) elements.userRole.textContent = getRoleDisplayName(appState.userProfile.role);
        if (elements.userInfo) elements.userInfo.classList.remove('hidden');

        // Aplicar classe CSS baseada no perfil
        document.body.className = `user-${appState.userProfile.role}`;

        // Controlar visibilidade de elementos baseado em permissões
        updatePermissions();
    } else {
        // Esconder informações do usuário
        if (elements.userInfo) elements.userInfo.classList.add('hidden');
        document.body.className = '';
    }
}

function getRoleDisplayName(role) {
    const roleNames = {
        [USER_ROLES.ADMIN]: 'Administrador',
        [USER_ROLES.OPERATOR]: 'Operador',
        [USER_ROLES.VIEWER]: 'Visualização'
    };
    return roleNames[role] || role;
}

function updatePermissions() {
    // Controlar botões de ação baseado em permissões
    const actionButtons = document.querySelectorAll('.add-btn, .pay-year-btn, .action-btn');
    actionButtons.forEach(btn => {
        if (!hasPermission('registerPayments')) {
            btn.classList.add('read-only');
            btn.disabled = true;
        } else {
            btn.classList.remove('read-only');
            btn.disabled = false;
        }
    });

    // Controlar botões de exportação
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(btn => {
        if (!hasPermission('generateReports')) {
            btn.classList.add('read-only');
            btn.disabled = true;
        } else {
            btn.classList.remove('read-only');
            btn.disabled = false;
        }
    });

    // Controlar acesso ao salão
    const salaoBtn = document.getElementById('salaoBtn');
    if (salaoBtn) {
        if (!hasPermission('manageSalao')) {
            salaoBtn.classList.add('read-only');
            salaoBtn.disabled = true;
        } else {
            salaoBtn.classList.remove('read-only');
            salaoBtn.disabled = false;
        }
    }

    // Controlar botão de carregar dados
    const loadBtn = document.getElementById('loadCondominiosBtn');
    if (loadBtn) {
        if (!hasPermission('manageStructure')) {
            loadBtn.classList.add('read-only');
            loadBtn.disabled = true;
        } else {
            loadBtn.classList.remove('read-only');
            loadBtn.disabled = false;
        }
    }
}

function requirePermission(permission) {
    console.log('🔐 Verificando permissão:', permission);
    const currentProfile = getCurrentProfile();
    console.log('👤 Perfil do usuário:', currentProfile);

    if (!hasPermission(permission)) {
        console.error('❌ Permissão negada para:', permission);
        showToast('Você não tem permissão para realizar esta ação', 'error');
        return false;
    }

    console.log('✅ Permissão concedida para:', permission);
    return true;
}

// Manipular mudanÃ§as no estado de autenticaÃ§Ã£o
function handleAuthStateChange({ user, profile }) {
    if (user && profile) {
        // UsuÃ¡rio autenticado
        appState.currentUser = user;
        appState.userProfile = profile;
        appState.isAuthenticated = true;

        // Atualizar interface
        updateUserInterface();

        // Navegar para tela principal
        if (appState.currentScreen === 'login') {
            showScreen('condominios');
            loadCondominiosData();
        }

    } else {
        // UsuÃ¡rio nÃ£o autenticado
        appState.currentUser = null;
        appState.userProfile = null;
        appState.isAuthenticated = false;

        // Limpar listeners
        cleanupListeners();

        // Voltar para login
        showScreen('login');
        updateUserInterface();
    }
}

// Carregamento de dados do Firebase
async function loadCondominiosData() {
    try {
        console.log('🔄 [LOAD] Carregando condomínios...');
        
        // Configurar listener em tempo real para condomÃ­nios
        const unsubscribe = subscribeToCondominios(async (condominios) => {
            appState.condominios = condominios;
            console.log(`✅ [LOAD] ${condominios.length} condomínios carregados`);
            
            // CORRECAO CRITICA: Carregar TODOS os apartamentos, CASAS e pagamentos do período ativo
            // para calcular percentuais corretamente
            if (appState.activeYear && appState.activeMonth && condominios.length > 0) {
                console.log('🔄 [LOAD] Carregando apartamentos, casas e pagamentos de todos os condomínios...');
                
                try {
                    // Carregar todos os blocos de todos os condomínios
                    const blocosPromises = condominios.map(c => getBlocosByCondominio(c.id));
                    const blocosArrays = await Promise.all(blocosPromises);
                    const todosBlocos = blocosArrays.flat();
                    
                    // Carregar todos os apartamentos de todos os blocos
                    const apartamentosPromises = todosBlocos.map(b => getApartamentosByBloco(b.id));
                    const apartamentosArrays = await Promise.all(apartamentosPromises);
                    appState.apartamentos = apartamentosArrays.flat();
                    
                    console.log(`✅ [LOAD] ${appState.apartamentos.length} apartamentos carregados`);
                    
                    // CORRECAO: Carregar TODAS as casas de todos os condomínios
                    const casasPromises = condominios.map(c => getCasasByCondominio(c.id));
                    const casasArrays = await Promise.all(casasPromises);
                    appState.casas = casasArrays.flat();
                    
                    console.log(`✅ [LOAD] ${appState.casas.length} casas carregadas`);
                    
                    // Carregar pagamentos do período ativo (apartamentos)
                    const date = `${appState.activeYear}-${appState.activeMonth}`;
                    
                    // OTIMIZAÇÃO v131: Buscar todos os pagamentos de uma vez por condomínio
                    const paymentsPromises = condominios.map(c => 
                        getPaymentsByCondominioAndPeriod(c.id, date)
                    );
                    const paymentsArrays = await Promise.all(paymentsPromises);
                    appState.payments.condominio = paymentsArrays.flat().filter(p => p != null);
                    
                    console.log(`✅ [LOAD] ${appState.payments.condominio.length} pagamentos carregados para ${date} (otimizado)`);
                    
                } catch (error) {
                    console.error('❌ [LOAD] Erro ao carregar dados completos:', error);
                }
            }
            
            // Renderizar apenas se estiver na tela de condomínios
            if (appState.currentScreen === 'condominios') {
                renderCondominios();
            }
        });

        appState.unsubscribeFunctions.push(unsubscribe);

    } catch (error) {
        console.error('Erro ao carregar condomÃ­nios:', error);
        showToast('Erro ao carregar dados', 'error');
    }
}

async function loadBlocosData(condominioId) {
    try {
        // Mostrar loading enquanto carrega
        elements.blocosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Carregando blocos...</h3>
                <p>Aguarde um momento</p>
            </div>
        `;

        const [blocos, casas] = await Promise.all([
            getBlocosByCondominio(condominioId),
            getCasasByCondominio(condominioId)
        ]);
        appState.blocos = blocos;
        appState.casas = casas;
        
        // Carregar TODOS os apartamentos do condom�nio para calcular status dos blocos
        if (blocos.length > 0) {
            const apartamentosPromises = blocos.map(bloco => getApartamentosByBloco(bloco.id));
            const apartamentosArrays = await Promise.all(apartamentosPromises);
            appState.apartamentos = apartamentosArrays.flat();
            
            // Carregar pagamentos do per�odo ativo para TODOS os apartamentos
            if (appState.activeYear && appState.activeMonth) {
                const date = `${appState.activeYear}-${appState.activeMonth}`;
                
                // OTIMIZAÇÃO v131: Buscar todos os pagamentos do condomínio de uma vez
                if (appState.selectedCondominio) {
                    const allPayments = await getPaymentsByCondominioAndPeriod(
                        appState.selectedCondominio.id, 
                        date
                    );
                    appState.payments.condominio = allPayments;
                    console.log(`✅ [LOAD] ${allPayments.length} pagamentos carregados (1 query otimizada)`);
                } else {
                    // Fallback: buscar por bloco
                    const paymentsPromises = blocos.map(bloco => getPaymentsByBlocoAndPeriod(bloco.id, date));
                    const paymentsArrays = await Promise.all(paymentsPromises);
                    appState.payments.condominio = paymentsArrays.flat();
                }
            }
        }
        
        renderBlocos();
    } catch (error) {
        console.error('Erro ao carregar blocos e casas:', error);
        showToast('Erro ao carregar dados do condomÃ­nio', 'error');
    }
}

async function loadApartamentosData(blocoId) {
    try {
        console.log('🔄 [LOAD] Carregando apartamentos do bloco:', blocoId);
        console.log('📅 [LOAD] Período ativo:', appState.activeYear, appState.activeMonth);
        
        // Mostrar loading enquanto carrega
        elements.apartamentosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Carregando apartamentos...</h3>
                <p>Aguarde um momento</p>
            </div>
        `;

        const apartamentos = await getApartamentosByBloco(blocoId);
        console.log('✅ [LOAD] Apartamentos carregados:', apartamentos.length);
        
        // CORRECAO: Atualizar apenas apartamentos deste bloco, mantendo os outros
        // Remover apartamentos antigos deste bloco
        appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== blocoId);
        // Adicionar apartamentos atualizados deste bloco
        appState.apartamentos = appState.apartamentos.concat(apartamentos);

        // CRÍTICO: Carregar pagamentos do bloco para o período ativo ANTES de renderizar
        if (appState.activeYear && appState.activeMonth) {
            const date = `${appState.activeYear}-${appState.activeMonth}`;
            console.log('🔍 [LOAD] Buscando pagamentos para:', date);
            
            const payments = await getPaymentsByBlocoAndPeriod(blocoId, date);
            console.log('✅ [LOAD] Pagamentos encontrados:', payments.length);
            
            // CORRECAO: Mesclar pagamentos em vez de substituir
            // Remover pagamentos antigos deste bloco
            appState.payments.condominio = appState.payments.condominio.filter(p => p.blocoId !== blocoId);
            // Adicionar pagamentos atualizados deste bloco
            appState.payments.condominio = appState.payments.condominio.concat(payments);
            
            console.log('📊 [LOAD] Total de pagamentos em memória:', appState.payments.condominio.length);
            
            // CRÍTICO: Atualizar status dos apartamentos baseado nos pagamentos carregados
            apartamentos.forEach(apt => {
                const payment = payments.find(p => p.apartamentoId === apt.id);
                if (payment) {
                    apt.status = payment.status || 'pendente';
                    apt.observacao = payment.observacao || '';
                    console.log(`✅ [LOAD] Apt ${apt.numero}: ${apt.status}`);
                } else {
                    apt.status = 'pendente';
                    console.log(`⚠️ [LOAD] Apt ${apt.numero}: sem pagamento (pendente)`);
                }
            });
        } else {
            console.warn('⚠️ [LOAD] Período ativo não definido - usando status padrão');
        }

        renderApartamentos();
    } catch (error) {
        console.error('❌ [LOAD] Erro ao carregar apartamentos:', error);
        showToast('Erro ao carregar apartamentos', 'error');
    }
}

async function loadPaymentsData(apartamentoId) {
    try {
        // Configurar listener em tempo real para pagamentos
        const unsubscribe = subscribeToPayments(apartamentoId, (payments) => {
            appState.payments.condominio = payments.filter(p => p.type === 'condominio');
            appState.payments.salao = payments.filter(p => p.type === 'salao');

            if (appState.currentScreen === 'pagamentos') {
                checkForDebts();
                renderMonthsGrid();
            }
        });

        appState.unsubscribeFunctions.push(unsubscribe);

    } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
        showToast('Erro ao carregar pagamentos', 'error');
    }
}

// FunÃ§Ã£o para inicializar estrutura dos condomÃ­nios (apenas admin)
async function carregarDadosCondominios() {
    if (!requirePermission('manageStructure')) return;

    try {
        elements.loadCondominiosBtn.disabled = true;
        elements.loadCondominiosBtn.textContent = 'Criando estrutura completa...';

        // Mostrar progresso
        showToast('Iniciando criaÃ§Ã£o da estrutura completa (condomÃ­nios + blocos + apartamentos)...', 'info');

        await initializeCondominiosStructure();

        showToast('Estrutura completa criada com sucesso! Aguarde o carregamento...', 'success');

        // CORREÃ‡ÃƒO: Recarregar os dados na interface apÃ³s criar a estrutura
        console.log('Recarregando dados na interface...');

        // Aguardar um pouco para o Firestore processar
        setTimeout(() => {
            // O listener em tempo real deve capturar automaticamente
            // Mas vamos forÃ§ar uma atualizaÃ§Ã£o se necessÃ¡rio
            if (appState.condominios.length === 0) {
                console.log('ForÃ§ando recarregamento...');
                loadCondominiosData();
            }

            showToast('Estrutura completa! Clique nos condomÃ­nios para ver os blocos.', 'success');
        }, 3000);

    } catch (error) {
        console.error('Erro ao carregar estrutura:', error);
        showToast('Erro ao criar estrutura dos condomÃ­nios: ' + error.message, 'error');
    } finally {
        elements.loadCondominiosBtn.disabled = false;
        elements.loadCondominiosBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Criar Estrutura Completa
        `;
    }
}

// ===== MÓDULO DA AGENDA DO SALÃO =====

function openAgendaModal() {
    console.log('🎯 openAgendaModal chamada');

    if (!appState.selectedCondominio) {
        console.error('❌ Nenhum condomínio selecionado');
        showToast('Erro: Nenhum condomínio selecionado', 'error');
        return;
    }

    console.log('✅ Condomínio selecionado:', appState.selectedCondominio.nome);

    // Atualizar título do modal
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    if (elements.agendaModalTitle) {
        elements.agendaModalTitle.textContent = `Agenda do Salão - ${appState.selectedCondominio.nome}`;
        console.log('✅ Título do modal atualizado');
    } else {
        console.error('❌ Elemento agendaModalTitle não encontrado');
    }

    if (elements.agendaMonthYear) {
        elements.agendaMonthYear.textContent = `${monthNames[appState.salaoCurrentMonth]} ${appState.salaoCurrentYear} `;
        console.log('✅ Subtítulo do modal atualizado');
    } else {
        console.error('❌ Elemento agendaMonthYear não encontrado');
    }

    // Carregar dados da agenda
    console.log('📊 Carregando dados da agenda...');
    loadAgendaData();

    // Mostrar modal
    if (elements.agendaModal) {
        elements.agendaModal.classList.remove('hidden');
        console.log('✅ Modal da agenda aberto');
    } else {
        console.error('❌ Elemento agendaModal não encontrado');
    }
}

function hideAgendaModal() {
    if (elements.agendaModal) {
        elements.agendaModal.classList.add('hidden');
    }
}

function loadAgendaData() {
    console.log('📊 loadAgendaData chamada');

    const currentMonth = appState.salaoCurrentMonth;
    const currentYear = appState.salaoCurrentYear;

    console.log(`📅 Mês / Ano atual: ${currentMonth}/${currentYear}`);
    console.log('🏢 Condomínio:', appState.selectedCondominio ? appState.selectedCondominio.nome : 'Nenhum');
    console.log('📋 Total de reservas:', (appState.salaoReservations && appState.salaoReservations.length) || 0);

    // Filtrar reservas do mês atual
    const monthReservations = appState.salaoReservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.getMonth() === currentMonth &&
            reservationDate.getFullYear() === currentYear &&
            reservation.condominioId === appState.selectedCondominio.id;
    });

    console.log(`📋 Reservas do mês filtradas: ${monthReservations.length}`);

    // Calcular estatísticas
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const reservedDays = monthReservations.length;
    const availableDays = daysInMonth - reservedDays;
    const paidReservations = monthReservations.filter(r => r.status === 'paid').length;

    console.log(`📊 Estatísticas: ${availableDays} disponíveis, ${reservedDays} reservados, ${paidReservations} pagos`);

    // Atualizar estatísticas no modal
    if (elements.availableDays) {
        elements.availableDays.textContent = availableDays;
        console.log('✅ availableDays atualizado');
    }

    if (elements.reservedDays) {
        elements.reservedDays.textContent = reservedDays;
        console.log('✅ reservedDays atualizado');
    }

    if (elements.paidReservations) {
        elements.paidReservations.textContent = paidReservations;
        console.log('✅ paidReservations atualizado');
    }

    // Renderizar lista de reservas
    console.log('📋 Renderizando lista de reservas...');
    renderReservationsList(monthReservations);
}

function renderReservationsList(reservations) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (reservations.length === 0) {
        if (elements.reservationsList) {
            elements.reservationsList.innerHTML = `
                <div class="reservations-empty">
                    <div class="reservations-empty-icon">📅</div>
                    <div class="reservations-empty-text">Nenhuma reserva neste mês</div>
                    <div class="reservations-empty-desc">O salão está completamente disponível</div>
                </div>
            `;
        }
        return;
    }

    // Ordenar reservas por data
    reservations.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (elements.reservationsList) {
        elements.reservationsList.innerHTML = '';

        reservations.forEach(reservation => {
            const reservationDate = new Date(reservation.date);
            const day = reservationDate.getDate();
            const month = monthNames[reservationDate.getMonth()];

            // Buscar informações do apartamento
            const apartment = appState.apartamentos.find(apt => apt.id === reservation.apartamentoId);
            const apartmentInfo = apartment ?
                `${apartment.tipo === 'casa' ? 'Casa' : 'Apt'} ${apartment.numero}` :
                'Apartamento não encontrado';
            const residentName = apartment ? apartment.proprietario : 'Proprietário não encontrado';

            const reservationElement = document.createElement('div');
            reservationElement.className = 'reservation-item';

            reservationElement.innerHTML = `
                <div class="reservation-info">
                    <div class="reservation-date">
                        <div class="reservation-day">${day}</div>
                        <div class="reservation-month">${month}</div>
                    </div>
                    <div class="reservation-details">
                        <div class="reservation-apartment">${apartmentInfo}</div>
                        <div class="reservation-resident">${residentName}</div>
                    </div>
                </div>
                <div class="reservation-status ${reservation.status}">
                    ${reservation.status === 'paid' ? '💰 Pago' : '📋 Reservado'}
                </div>
                <div class="reservation-value">
                    R$ ${reservation.value ? reservation.value.toFixed(2).replace('.', ',') : '0,00'}
                </div>
            `;

            // Adicionar evento de clique para editar reserva
            reservationElement.addEventListener('click', () => {
                hideAgendaModal();
                // Abrir modal de edição da reserva
                const date = new Date(reservation.date);
                showReservationModal(date, reservation);
            });

            elements.reservationsList.appendChild(reservationElement);
        });
    }
}

function exportAgendaToCSV() {
    const currentMonth = appState.salaoCurrentMonth;
    const currentYear = appState.salaoCurrentYear;
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Filtrar reservas do mês atual
    const monthReservations = appState.salaoReservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.getMonth() === currentMonth &&
            reservationDate.getFullYear() === currentYear &&
            reservation.condominioId === appState.selectedCondominio.id;
    });

    if (monthReservations.length === 0) {
        showToast('Nenhuma reserva para exportar neste mês', 'warning');
        return;
    }

    // Preparar dados para CSV
    const csvData = [];
    csvData.push(['Data', 'Apartamento', 'Proprietário', 'Status', 'Valor']);

    monthReservations.sort((a, b) => new Date(a.date) - new Date(b.date));

    monthReservations.forEach(reservation => {
        const date = new Date(reservation.date).toLocaleDateString('pt-BR');
        const apartment = appState.apartamentos.find(apt => apt.id === reservation.apartamentoId);
        const apartmentInfo = apartment ?
            `${apartment.tipo === 'casa' ? 'Casa' : 'Apt'} ${apartment.numero}` :
            'N/A';
        const residentName = apartment ? apartment.proprietario : 'N/A';
        const status = reservation.status === 'paid' ? 'Pago' : 'Reservado';
        const value = `R$ ${reservation.value ? reservation.value.toFixed(2).replace('.', ',') : '0,00'}`;

        csvData.push([date, apartmentInfo, residentName, status, value]);
    });

    // Converter para CSV
    const csvContent = csvData.map(row => row.join(',')).join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `agenda-salao-${monthNames[currentMonth]}-${currentYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Agenda exportada com sucesso!', 'success');
}

function setupEventListeners() {
    // Navigation
    if (elements.backBtn) elements.backBtn.addEventListener('click', goBack);

    // Login
    if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', handleLogout);

    // Period selector
    if (elements.activeYear) {
        elements.activeYear.addEventListener('change', handlePeriodChange);
        populateYearSelector();
    }
    if (elements.activeMonth) {
        elements.activeMonth.addEventListener('change', handlePeriodChange);
    }

    // Dashboard buttons
    if (elements.goToSalaoBtn) elements.goToSalaoBtn.addEventListener('click', openSalao);

    // Painel button
    if (elements.painelBtn) {
        elements.painelBtn.addEventListener('click', openPainel);
    }

    // Payment year navigation
    if (elements.prevYear) elements.prevYear.addEventListener('click', () => changeYear(-1));
    if (elements.nextYear) elements.nextYear.addEventListener('click', () => changeYear(1));
    if (elements.payYearBtn) elements.payYearBtn.addEventListener('click', payFullYear);

    // Payment modal
    if (elements.closePaymentModal) elements.closePaymentModal.addEventListener('click', hidePaymentModal);
    if (elements.cancelPayment) elements.cancelPayment.addEventListener('click', hidePaymentModal);
    if (elements.confirmPayment) elements.confirmPayment.addEventListener('click', confirmMonthPayment);
    if (elements.paymentModal) {
        elements.paymentModal.addEventListener('click', (e) => {
            if (e.target === elements.paymentModal) hidePaymentModal();
        });
    }

    // Enter key in payment modal
    if (elements.paymentValue) {
        elements.paymentValue.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmMonthPayment();
            }
        });
    }

    // Salão calendar navigation - CORRIGIDO: Remover listeners duplicados
    if (elements.prevMonth) {
        const newPrevMonth = elements.prevMonth.cloneNode(true);
        elements.prevMonth.parentNode.replaceChild(newPrevMonth, elements.prevMonth);
        elements.prevMonth = newPrevMonth;
        elements.prevMonth.addEventListener('click', () => changeSalaoMonth(-1));
    }
    if (elements.nextMonth) {
        const newNextMonth = elements.nextMonth.cloneNode(true);
        elements.nextMonth.parentNode.replaceChild(newNextMonth, elements.nextMonth);
        elements.nextMonth = newNextMonth;
        elements.nextMonth.addEventListener('click', () => changeSalaoMonth(1));
    }

    // Reservation modal
    if (elements.closeReservationModal) elements.closeReservationModal.addEventListener('click', hideReservationModal);
    if (elements.cancelReservation) elements.cancelReservation.addEventListener('click', hideReservationModal);
    if (elements.confirmReservation) elements.confirmReservation.addEventListener('click', confirmReservation);
    if (elements.deleteReservation) elements.deleteReservation.addEventListener('click', deleteReservation);
    if (elements.reservationModal) {
        elements.reservationModal.addEventListener('click', (e) => {
            if (e.target === elements.reservationModal) hideReservationModal();
        });
    }

    // Agenda modal
    if (elements.openAgendaBtn) elements.openAgendaBtn.addEventListener('click', openAgendaModal);
    if (elements.closeAgendaModal) elements.closeAgendaModal.addEventListener('click', hideAgendaModal);
    if (elements.closeAgendaModalBtn) elements.closeAgendaModalBtn.addEventListener('click', hideAgendaModal);
    if (elements.exportAgenda) elements.exportAgenda.addEventListener('click', exportAgendaToCSV);
    if (elements.agendaModal) {
        elements.agendaModal.addEventListener('click', (e) => {
            if (e.target === elements.agendaModal) hideAgendaModal();
        });
    }

    // Enter key in reservation modal
    if (elements.reservationValue) {
        elements.reservationValue.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmReservation();
            }
        });
    }

    // Painel filters and actions
    const filterAnoElement = document.getElementById('filterAno');
    if (filterAnoElement) {
        filterAnoElement.addEventListener('change', () => {
            currentPage = 1;
            applyFiltersDebounced();
        });
    }

    if (elements.filterCondominio) {
        elements.filterCondominio.addEventListener('change', () => {
            updateBlocoFilter();
            currentPage = 1; // Reset para primeira página

            // Carregar dados do condomínio selecionado se necessário
            const condominioId = elements.filterCondominio.value;
            if (condominioId) {
                ensurePainelApartamentosLoaded(condominioId)
                    .then(() => applyFiltersDebounced());
            } else {
                applyFiltersDebounced();
            }
        });
    }

    if (elements.filterBloco) {
        elements.filterBloco.addEventListener('change', () => {
            currentPage = 1; // Reset para primeira página
            applyFiltersDebounced();
        });
    }

    if (elements.filterMes) {
        elements.filterMes.addEventListener('change', () => {
            currentPage = 1; // Reset para primeira página
            applyFiltersDebounced();
        });
    }

    if (elements.clearFilters) {
        elements.clearFilters.addEventListener('click', () => {
            currentPage = 1; // Reset para primeira página
            clearAllFilters();
        });
    }

    // Botões de controle do painel
    const refreshPainelBtn = document.getElementById('refreshPainelData');
    if (refreshPainelBtn) {
        refreshPainelBtn.addEventListener('click', forceReloadPainelData);
    }

    const clearCacheBtn = document.getElementById('clearPainelCache');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearPainelCache);
    }
    if (elements.exportExcel) elements.exportExcel.addEventListener('click', exportToExcel);
    if (elements.exportCSV) elements.exportCSV.addEventListener('click', exportToCSV);

    // Taxa form
    if (elements.updateTaxBtn) elements.updateTaxBtn.addEventListener('click', handleUpdateTax);

    // Modal
    if (elements.modalCancel) elements.modalCancel.addEventListener('click', hideModal);
    if (elements.closeModal) elements.closeModal.addEventListener('click', hideModal);
    if (elements.modal) {
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) hideModal();
        });
    }

    // Enter key in modal
    if (elements.modalInput) {
        elements.modalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (elements.modalConfirm) elements.modalConfirm.click();
            }
        });
    }

    // Apartment Modal Events - VERSÃƒO DEFINITIVA COM MÃšLTIPLAS PROTEÃ‡Ã•ES
    console.log('ðŸ”§ Configurando event listeners do modal de apartamento...');

    // MÃ©todo 1: Event listeners diretos nos elementos
    const closeApartmentModalBtn = document.getElementById('closeApartmentModal');
    const cancelApartmentModalBtn = document.getElementById('cancelApartmentModal');
    const saveApartmentStatusBtn = document.getElementById('saveApartmentStatus');
    const apartmentModalElement = document.getElementById('apartmentModal');

    if (closeApartmentModalBtn) {
        // Remover listeners existentes
        closeApartmentModalBtn.replaceWith(closeApartmentModalBtn.cloneNode(true));
        const newCloseBtn = document.getElementById('closeApartmentModal');

        newCloseBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o X clicado');
            closeApartmentModal();
        });

        // Garantir que seja clicÃ¡vel
        newCloseBtn.style.setProperty('pointer-events', 'auto', 'important');
        newCloseBtn.style.setProperty('z-index', '100001', 'important');
        newCloseBtn.style.setProperty('position', 'relative', 'important');
        newCloseBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('âœ… Event listener do botÃ£o X configurado');
    } else {
        console.warn('âš ï¸ BotÃ£o closeApartmentModal nÃ£o encontrado');
    }

    if (cancelApartmentModalBtn) {
        // Remover listeners existentes
        cancelApartmentModalBtn.replaceWith(cancelApartmentModalBtn.cloneNode(true));
        const newCancelBtn = document.getElementById('cancelApartmentModal');

        newCancelBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Cancelar clicado');
            closeApartmentModal();
        });

        // Garantir que seja clicÃ¡vel
        newCancelBtn.style.setProperty('pointer-events', 'auto', 'important');
        newCancelBtn.style.setProperty('z-index', '100001', 'important');
        newCancelBtn.style.setProperty('position', 'relative', 'important');
        newCancelBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('âœ… Event listener do botÃ£o Cancelar configurado');
    } else {
        console.warn('âš ï¸ BotÃ£o cancelApartmentModal nÃ£o encontrado');
    }

    if (saveApartmentStatusBtn) {
        // Remover listeners existentes
        saveApartmentStatusBtn.replaceWith(saveApartmentStatusBtn.cloneNode(true));
        const newSaveBtn = document.getElementById('saveApartmentStatus');

        newSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Salvar clicado');
            saveApartmentStatusNew();
        });

        // Garantir que seja clicÃ¡vel
        newSaveBtn.style.setProperty('pointer-events', 'auto', 'important');
        newSaveBtn.style.setProperty('z-index', '100001', 'important');
        newSaveBtn.style.setProperty('position', 'relative', 'important');
        newSaveBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('âœ… Event listener do botÃ£o Salvar configurado');
    } else {
        console.warn('âš ï¸ BotÃ£o saveApartmentStatus nÃ£o encontrado');
    }

    if (apartmentModalElement) {
        // Remover listeners existentes
        apartmentModalElement.replaceWith(apartmentModalElement.cloneNode(true));
        const newModal = document.getElementById('apartmentModal');

        newModal.addEventListener('click', function (e) {
            if (e.target === newModal) {
                console.log('ðŸ–±ï¸ Clique fora do modal');
                closeApartmentModal();
            }
        });

        // Reconfigurar elementos apÃ³s clonagem
        elements.apartmentModal = newModal;

        console.log('âœ… Event listener do modal (clique fora) configurado');
    } else {
        console.warn('âš ï¸ Modal apartmentModal nÃ£o encontrado');
    }

    // MÃ©todo 2: Event delegation no document para garantir funcionamento
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'closeApartmentModal') {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o X clicado (delegation)');
            closeApartmentModal();
        }

        if (e.target && e.target.id === 'cancelApartmentModal') {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Cancelar clicado (delegation)');
            closeApartmentModal();
        }

        if (e.target && e.target.id === 'saveApartmentStatus') {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Salvar clicado (delegation)');
            saveApartmentStatusNew();
        }
    });

    console.log('âœ… Event delegation configurado como backup');

    // Event listeners para mudanÃ§a de status
    const statusRadios = document.querySelectorAll('input[name="aptStatus"]');
    statusRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log('ðŸ“‹ Status selecionado:', e.target.value);
                handleStatusChange(e.target.value);
            }
        });

        // Garantir que sejam clicÃ¡veis
        radio.style.setProperty('pointer-events', 'auto', 'important');
        radio.style.setProperty('z-index', '100001', 'important');
        radio.style.setProperty('position', 'relative', 'important');
    });

    console.log('âœ… Event listeners dos radio buttons configurados');
}

// ==========================================
// CONTROLE DE PERÍODO ATIVO (ANO/MÊS)
// ==========================================

function populateYearSelector() {
    if (!elements.activeYear) return;

    const currentYear = new Date().getFullYear();
    const startYear = 2024; // Ano inicial fixo
    const endYear = 2040; // CORRECAO v81: Limite até 2040 (antes era 2100)

    elements.activeYear.innerHTML = '<option value="">Selecione o ano</option>';

    // Ler período salvo no localStorage (se houver)
    const savedYear = (window.localStorage && window.localStorage.getItem('gc_activeYear')) || '';
    const savedMonth = (window.localStorage && window.localStorage.getItem('gc_activeMonth')) || '';

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;

        // Priorizar valor salvo; se não houver, usar o ano atual
        if (savedYear) {
            if (year.toString() === savedYear) {
                option.selected = true;
                appState.activeYear = savedYear;
            }
        } else if (year === currentYear) {
            option.selected = true;
            appState.activeYear = year.toString();
        }

        elements.activeYear.appendChild(option);
    }

    // Selecionar mês: priorizar valor salvo, senão usar mês atual
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    if (elements.activeMonth) {
        if (savedMonth) {
            elements.activeMonth.value = savedMonth;
            appState.activeMonth = savedMonth;
        } else {
            elements.activeMonth.value = currentMonth;
            appState.activeMonth = currentMonth;
        }
    }

    // Sincronizar currentYear com activeYear caso o período tenha sido restaurado
    try {
        if (appState.activeYear && !isNaN(parseInt(appState.activeYear))) {
            appState.currentYear = parseInt(appState.activeYear, 10);
            if (elements.currentYear) elements.currentYear.textContent = appState.currentYear;
        }
    } catch (err) {
        console.warn('Erro ao sincronizar currentYear na inicialização:', err);
    }

    updateActivePeriodDisplay();
}

async function handlePeriodChange() {
    const year = (elements.activeYear && elements.activeYear.value) || '';
    const month = (elements.activeMonth && elements.activeMonth.value) || '';

    appState.activeYear = year;
    appState.activeMonth = month;

    updateActivePeriodDisplay();
    
    console.log('📅 Período ativo alterado:', { year, month });

    // Persistir seleção para manter período após reload
    try {
        if (window.localStorage) {
            window.localStorage.setItem('gc_activeYear', year);
            window.localStorage.setItem('gc_activeMonth', month);
        }
    } catch (e) {
        console.warn('Não foi possível persistir período no localStorage', e);
    }

    // Sincronizar o ano mostrado na grid de meses com o período ativo
    try {
        if (year && !isNaN(parseInt(year))) {
            appState.currentYear = parseInt(year, 10);
            if (elements.currentYear) elements.currentYear.textContent = appState.currentYear;
            // Re-renderizar a grid caso esteja na tela de pagamentos
            if (appState.currentScreen === 'pagamentos' && typeof renderMonthsGrid === 'function') {
                renderMonthsGrid();
            }
        }
    } catch (err) {
        console.warn('Erro ao sincronizar currentYear com activeYear', err);
    }

    // CORRECAO v77: Recarregar dados quando o período muda
    if (year && month) {
        console.log('🔄 [PERIOD] Recarregando dados para novo período:', { year, month });
        
        // Limpar pagamentos antigos
        appState.payments.condominio = [];
        
        // Recarregar dados baseado na tela atual
        if (appState.currentScreen === 'condominios') {
            // Recarregar todos os condomínios e seus dados
            await loadCondominiosData();
        } else if (appState.currentScreen === 'blocos' && appState.selectedCondominio) {
            // Recarregar blocos do condomínio selecionado
            await loadBlocosData(appState.selectedCondominio.id);
        } else if (appState.currentScreen === 'apartamentos' && appState.selectedBloco) {
            // Recarregar apartamentos do bloco selecionado
            await loadApartamentosData(appState.selectedBloco.id);
        }
        
        console.log('✅ [PERIOD] Dados recarregados com sucesso');
    }
}

function updateActivePeriodDisplay() {
    if (!elements.activePeriodText) return;

    const year = appState.activeYear;
    const month = appState.activeMonth;

    if (!year || !month) {
        elements.activePeriodText.textContent = 'Nenhum período selecionado';
        elements.activePeriodText.style.color = '#fbbf24'; // warning color
        return;
    }

    const monthNames = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março',
        '04': 'Abril', '05': 'Maio', '06': 'Junho',
        '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
        '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };

    elements.activePeriodText.textContent = `${monthNames[month]}/${year}`;
    elements.activePeriodText.style.color = '#ffffff';
}

function checkActivePeriod() {
    if (!appState.activeYear || !appState.activeMonth) {
        showToast('Selecione o ano e mês antes de continuar', 'warning');
        return false;
    }
    return true;
}

// ==========================================

function showScreen(screenName) {
    // Verificar autenticaÃ§Ã£o para telas protegidas
    if (screenName !== 'login' && !appState.isAuthenticated) {
        showScreen('login');
        return;
    }

    // Hide all screens with fade out
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
        currentScreen.style.opacity = '0';
        currentScreen.style.transform = 'translateX(-20px)';

        setTimeout(() => {
            currentScreen.classList.remove('active');

            // Show new screen with fade in
            const newScreen = document.getElementById(screenName + 'Screen');
            newScreen.classList.add('active');
            newScreen.style.opacity = '0';
            newScreen.style.transform = 'translateX(20px)';

            // Trigger animation
            requestAnimationFrame(() => {
                newScreen.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                newScreen.style.opacity = '1';
                newScreen.style.transform = 'translateX(0)';
            });
        }, 150);
    } else {
        // First screen load
        const newScreen = document.getElementById(screenName + 'Screen');
        newScreen.classList.add('active');
    }

    // Update navigation
    appState.currentScreen = screenName;
    updateNavigation();
}

function updateNavigation() {
    const titles = {
        login: 'Login - Gestao Condominial',
        condominios: 'Gestao Condominial',
        blocos: (appState.selectedCondominio ? appState.selectedCondominio.nome : 'Blocos'),
        apartamentos: (appState.selectedBloco ? appState.selectedBloco.nome : 'Nenhum'),
        pagamentos: 'Apt ' + (appState.selectedApartamento ? appState.selectedApartamento.numero : '') + ' - ' + (appState.selectedBloco ? appState.selectedBloco.nome : ''),
        salao: 'Salao - ' + (appState.selectedCondominio ? appState.selectedCondominio.nome : ''),
        taxa: 'Taxa - ' + (appState.selectedCondominio ? appState.selectedCondominio.nome : ''),
        painel: 'Painel Geral'
    };

    elements.pageTitle.textContent = titles[appState.currentScreen];

    // Atualizar subtÃ­tulo do Dashboard (Removed)
    /* if (appState.currentScreen === 'dashboard' && elements.dashboardTitle) {
        elements.dashboardTitle.textContent = (appState.selectedCondominio ? appState.selectedCondominio.nome : '');
    } */

    if (appState.currentScreen === 'condominios' || appState.currentScreen === 'login') {
        elements.backBtn.classList.add('hidden');
    } else {
        elements.backBtn.classList.remove('hidden');
    }
}

function goBack() {
    switch (appState.currentScreen) {
        /* case 'dashboard':
            appState.selectedCondominio = null;
            showScreen('condominios');
            renderCondominios();
            break; */
        case 'blocos':
            appState.selectedCondominio = null;
            showScreen('condominios');
            renderCondominios();
            break;
        case 'apartamentos':
            appState.selectedBloco = null;
            showScreen('blocos');
            renderBlocos();
            break;
        case 'pagamentos':
            appState.selectedApartamento = null;
            showScreen('apartamentos');
            renderApartamentos();
            break;
        case 'salao':
            showScreen('blocos'); // Go back to blocs/dashboard
            break;
        case 'taxa':
            showScreen('blocos'); // Go back to blocs/dashboard
            break;
        case 'painel':
            if (appState.selectedCondominio) {
                showScreen('blocos'); // Go back to blocs/dashboard
            } else {
                showScreen('condominios');
                renderCondominios();
            }
            break;
    }
}

// RenderizaÃ§Ã£o de condomÃ­nios
function renderCondominios() {
    elements.condominiosList.innerHTML = '';

    // Verificar se é viewer
    const currentUser = getCurrentUser();
    const isViewer = currentUser && currentUser.email === 'viewer@condominio.com';

    if (appState.condominios.length === 0) {
        elements.condominiosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum condomÃ­nio cadastrado</h3>
                <p>Clique em "Criar Estrutura" para inicializar os condomÃ­nios</p>
            </div>
        `;
        return;
    }

    appState.condominios.forEach((condominio, index) => {
        // DEBUG v88: Log para verificar nome do condomínio
        console.log(`🏢 Renderizando: "${condominio.nome}" | Contém Ayres? ${condominio.nome.includes('Ayres')}`);
        
        // Usar totais do documento do condomínio se disponíveis, senão tentar calcular (fallback)
        const blocosCount = condominio.totalBlocos || appState.blocos.filter(b => b.condominioId === condominio.id).length;
        
        // CORRECAO: Incluir APARTAMENTOS + CASAS no cálculo
        const apartamentosDoCondominio = appState.apartamentos.filter(a => a.condominioId === condominio.id);
        const casasDoCondominio = appState.casas.filter(c => c.condominioId === condominio.id);
        const todasUnidades = [...apartamentosDoCondominio, ...casasDoCondominio];
        
        const apartamentosCount = condominio.totalUnidades || todasUnidades.length;
        const casasCount = condominio.totalCasas || casasDoCondominio.length;

        // CORRECAO CRITICA: Calcular percentual incluindo CASAS
        let unidadesPagas = 0;
        let percentualPago = 0;
        
        // Verificar se temos dados carregados (apartamentos + casas)
        const temDadosCarregados = todasUnidades.length > 0 && 
                                   appState.payments && 
                                   appState.payments.condominio &&
                                   Array.isArray(appState.payments.condominio);
        
        if (temDadosCarregados && appState.activeYear && appState.activeMonth) {
            // CORRECAO v78: Contar apartamentos + casas pagos (mesma lógica dos blocos)
            unidadesPagas = todasUnidades.filter(unidade => {
                const payment = appState.payments.condominio.find(p =>
                    p && // CORRECAO: Verificar se p existe
                    p.apartamentoId === unidade.id &&
                    (
                        (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                        (p.date === `${appState.activeYear}-${appState.activeMonth}`)
                    )
                );
                
                // Se encontrou pagamento, verificar se status é 'pago' ou 'reciclado'
                // Se não encontrou pagamento, considerar pendente
                if (payment) {
                    return payment.status === 'pago' || payment.status === 'reciclado';
                }
                return false;
            }).length;
            
            percentualPago = apartamentosCount > 0 ?
                Math.round((unidadesPagas / apartamentosCount) * 100) : 0;
                
            console.log(`📊 [RENDER] ${condominio.nome}: ${unidadesPagas}/${apartamentosCount} (${apartamentosDoCondominio.length} apts + ${casasDoCondominio.length} casas) = ${percentualPago}%`);
        } else {
            // Se nao tem dados carregados, mostrar 0% temporariamente
            console.warn(`⚠️ [RENDER] ${condominio.nome}: Dados ainda não carregados`);
            percentualPago = 0;
        }

        const condominioElement = document.createElement('div');
        condominioElement.className = 'item-card condominio-card';
        condominioElement.style.animationDelay = `${index * 0.1}s`;

        condominioElement.innerHTML = `
            <div class="card-header">
                <h3>${condominio.nome}</h3>
                <div class="card-actions">
                    <button class="painel-condo-btn" data-condo-id="${condominio.id}" title="Abrir Painel do Condomínio">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                    </button>
                    ${percentualPago < 100 && !isViewer ? `
                    <button class="bulk-pay-condo-btn" data-condo-id="${condominio.id}" title="Marcar ano inteiro como pago">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                    ` : ''}
                    <div class="card-badge ${percentualPago >= 80 ? 'success' : percentualPago >= 50 ? 'warning' : 'error'}">
                        ${percentualPago}% em dia
                    </div>
                </div>
            </div>
            <div class="card-content">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${blocosCount}</span>
                        <span class="stat-label">Blocos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${apartamentosCount}</span>
                        <span class="stat-label">Unidades</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${casasCount}</span>
                        <span class="stat-label">Casas</span>
                    </div>
                </div>
            </div>
            <div class="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </div>
        `;

        // CORRECAO v88: Event listener para o botão do painel específico
        const painelBtn = condominioElement.querySelector('.painel-condo-btn');
        if (painelBtn) {
            painelBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Não abrir o condomínio
                openPainelCondominio(condominio);
            });
        }

        // Event listener para o botão de pagamento em massa
        const bulkPayBtn = condominioElement.querySelector('.bulk-pay-condo-btn');
        if (bulkPayBtn) {
            bulkPayBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Não abrir o condomínio
                if (typeof window.bulkPaymentForCondominio === 'function') {
                    window.bulkPaymentForCondominio(condominio);
                }
            });
        }

        condominioElement.addEventListener('click', (e) => {
            // Add selection animation
            condominioElement.classList.add('selected');
            condominioElement.style.transform = 'scale(0.98)';

            setTimeout(() => {
                selectCondominio(condominio);
            }, 200);
        });

        elements.condominiosList.appendChild(condominioElement);
    });
}

// CORRECAO v88: Função para abrir painel específico de um condomínio
async function openPainelCondominio(condominio) {
    console.log(`📊 Abrindo painel específico para: ${condominio.nome}`);
    
    // Definir condomínio selecionado
    appState.selectedCondominio = condominio;
    
    // Definir filtros específicos para este condomínio
    currentFilters.condominio = condominio.id;
    currentFilters.ano = '2025';
    currentFilters.mes = '01'; // Janeiro
    currentFilters.bloco = ''; // Todos os blocos do condomínio
    
    // Abrir o painel
    showScreen('painel');
    showPainelLoading(true);

    setTimeout(async () => {
        try {
            // Carregar dados do condomínio
            await ensurePainelApartamentosLoaded(condominio.id);
            
            // Renderizar painel
            renderPainelCondominio(condominio);
        } catch (error) {
            console.error('❌ Erro ao carregar painel do condomínio:', error);
            showToast(`Erro ao carregar painel de ${condominio.nome}`, 'error');
        } finally {
            showPainelLoading(false);
        }
    }, 100);
}

// CORRECAO v97: Renderizar painel EXCLUSIVO do condomínio
function renderPainelCondominio(condominio) {
    console.log(`🎨 Renderizando painel EXCLUSIVO de ${condominio.nome}...`);
    
    // Popular filtros com valores específicos
    populateFilters();
    
    // CORRECAO v97: Mostrar APENAS este condomínio no filtro (painel exclusivo)
    if (elements.filterCondominio) {
        elements.filterCondominio.innerHTML = '';
        const option = document.createElement('option');
        option.value = condominio.id;
        option.textContent = condominio.nome;
        option.selected = true;
        elements.filterCondominio.appendChild(option);
        
        // Desabilitar seletor (não pode trocar de condomínio)
        elements.filterCondominio.disabled = true;
        
        currentFilters.condominio = condominio.id;
        console.log(`🔒 Painel travado em: ${condominio.nome}`);
    }
    
    // Aplicar filtros
    applyFiltersDebounced();
}

async function selectCondominio(condominio) {
    appState.selectedCondominio = condominio;
    appState.blocos = []; // Limpar blocos antigos
    appState.casas = []; // Limpar casas antigas
    showScreen('blocos'); // Go straight to blocos
    await loadBlocosData(condominio.id); // Aguardar carregamento completo
}

// RenderizaÃ§Ã£o de blocos
function renderBlocos() {
    elements.blocosList.innerHTML = '';

    const blocos = appState.blocos;

    if (blocos.length === 0) {
        elements.blocosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum bloco encontrado</h3>
                <p>Este condomÃ­nio nÃ£o possui blocos cadastrados</p>
            </div>
        `;
        return;
    }

    blocos.forEach((bloco, index) => {
        // Contar apartamentos do bloco
        const apartamentosDoBloco = appState.apartamentos.filter(a => a.blocoId === bloco.id);
        const apartamentosCount = apartamentosDoBloco.length;
        
        // Calcular quantos estao pagos no periodo ativo
        let apartamentosPagos = 0;
        
        if (appState.activeYear && appState.activeMonth) {
            // CORRECAO v78: Usar mesma lógica da listagem individual
            // Contar apartamentos que TEM pagamento com status 'pago' (não apenas que TEM pagamento)
            apartamentosPagos = apartamentosDoBloco.filter(apt => {
                const payment = appState.payments.condominio.find(p =>
                    p.apartamentoId === apt.id &&
                    (
                        (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                        (p.date === `${appState.activeYear}-${appState.activeMonth}`)
                    )
                );
                
                // Se encontrou pagamento, verificar se status é 'pago' ou 'reciclado'
                // Se não encontrou pagamento, considerar pendente
                if (payment) {
                    return payment.status === 'pago' || payment.status === 'reciclado';
                }
                return false;
            }).length;
        } else {
            // Fallback: usar status do apartamento se nao tem periodo ativo
            apartamentosPagos = apartamentosDoBloco.filter(a => 
                a.status === 'pago' || a.status === 'reciclado'
            ).length;
        }

        const percentualPago = apartamentosCount > 0 ?
            Math.round((apartamentosPagos / apartamentosCount) * 100) : 0;

        // DEBUG: Log dos contadores
        console.log(`📊 [BLOCO] ${bloco.nome}: ${apartamentosPagos}/${apartamentosCount} pagos (${percentualPago}%)`);

        const blocoElement = document.createElement('div');
        blocoElement.className = 'item-card bloco-card';
        blocoElement.style.animationDelay = `${index * 0.1}s`;

        blocoElement.innerHTML = `
            <div class="card-header">
                <h3>${bloco.nome}</h3>
                <div class="card-badge ${percentualPago >= 80 ? 'success' : percentualPago >= 50 ? 'warning' : 'error'}">
                    ${percentualPago}% em dia
                </div>
            </div>
            <div class="card-content">
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${apartamentosCount}</span>
                        <span class="stat-label">Apartamentos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${apartamentosPagos}</span>
                        <span class="stat-label">Em dia</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${apartamentosCount - apartamentosPagos}</span>
                        <span class="stat-label">Pendentes</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentualPago}%"></div>
                </div>
            </div>
            <div class="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </div>
        `;

        blocoElement.addEventListener('click', (e) => {
            blocoElement.classList.add('selected');
            blocoElement.style.transform = 'scale(0.98)';

            setTimeout(() => {
                selectBloco(bloco);
            }, 200);
        });

        elements.blocosList.appendChild(blocoElement);
    });

    // Renderizar Casas (SeÃ§Ã£o Separada)
    if (appState.casas && appState.casas.length > 0) {
        if (elements.casasSection) elements.casasSection.classList.remove('hidden');
        if (elements.casasList) {
            elements.casasList.innerHTML = '';
            appState.casas.forEach((casa, index) => {
                // Determinar status: priorizar pagamento do período ativo (se existir),
                // caso contrário usar o campo do documento da casa.
                let status = 'pendente';
                if (appState.activeYear && appState.activeMonth) {
                    const payment = appState.payments.condominio.find(p =>
                        p.apartamentoId === casa.id &&
                        (
                            (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                            (p.date === `${appState.activeYear}-${appState.activeMonth}`)
                        )
                    );
                    if (payment) {
                        status = payment.status || 'pendente';
                    } else {
                        status = casa.status || 'pendente';
                    }
                } else {
                    status = casa.status || 'pendente';
                }

                const statusLabels = {
                    'pendente': 'Pendente',
                    'pago': 'Pago',
                    'reciclado': 'Pago Reciclado',
                    'acordo': 'Acordo'
                };

                const casaElement = document.createElement('div');
                casaElement.className = `item-card apartamento-card status-${status}`;
                casaElement.style.animationDelay = `${(blocos.length + index) * 0.1}s`;

                casaElement.innerHTML = `
                    <div class="card-header">
                        <h3>${casa.numero}</h3>
                        <div class="status-badge status-${status}">
                            ${statusLabels[status] || 'Pendente'}
                        </div>
                    </div>
                    <div class="card-content">
                        <p class="proprietario" style="font-weight: 600; color: var(--primary-color);">
                            ${casa.morador || 'Mudar Nome do Morador'}
                        </p>
                    </div>
                    <div class="card-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </div>
                `;

                casaElement.addEventListener('click', () => {
                    casaElement.classList.add('selected');
                    setTimeout(() => {
                        openApartmentModal(casa);
                        casaElement.classList.remove('selected');
                    }, 200);
                });

                elements.casasList.appendChild(casaElement);
            });
        }
    } else {
        if (elements.casasSection) elements.casasSection.classList.add('hidden');
    }
}

async function selectBloco(bloco) {
    appState.selectedBloco = bloco;
    showScreen('apartamentos');
    await loadApartamentosData(bloco.id); // Aguardar carregamento completo
}

// RenderizaÃ§Ã£o de apartamentos
function renderApartamentos() {
    elements.apartamentosList.innerHTML = '';

    // CORRECAO: Filtrar apenas apartamentos do bloco selecionado
    const apartamentos = appState.selectedBloco 
        ? appState.apartamentos.filter(a => a.blocoId === appState.selectedBloco.id)
        : appState.apartamentos;

    if (apartamentos.length === 0) {
        elements.apartamentosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum apartamento encontrado</h3>
                <p>Este bloco nÃ£o possui apartamentos cadastrados</p>
            </div>
        `;
        return;
    }

    // Ordenar apartamentos por nÃºmero
    apartamentos.sort((a, b) => {
        const numA = parseInt(a.numero);
        const numB = parseInt(b.numero);
        return numA - numB;
    });

    apartamentos.forEach((apartamento, index) => {
        // CORRECAO: Buscar status do pagamento do mes ativo, nao do apartamento
        let status = 'pendente';
        let payment = null;  // Declarar fora do if para usar no log

        if (appState.activeYear && appState.activeMonth) {
            payment = appState.payments.condominio.find(p =>
                p.apartamentoId === apartamento.id &&
                (
                    (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                    (p.date === `${appState.activeYear}-${appState.activeMonth}`)
                )
            );

            if (payment) {
                status = payment.status || 'pendente';
            }
        } else {
            // Se nao tem periodo ativo, usar status do apartamento
            status = apartamento.status || 'pendente';
        }

        // DEBUG: Log do status individual
        console.log(`🏠 [APT] ${apartamento.numero}: status=${status}, payment=${payment ? 'SIM' : 'NÃO'}`);

        // DEBUG: Verificar status do apartamento
        if (apartamento.status === 'acordo') {
            console.log(`🎯 APARTAMENTO ${apartamento.numero} COM STATUS ACORDO:`, apartamento.status);
        }

        const statusLabels = {
            'pendente': 'Pendente',
            'pago': 'Pago',
            'reciclado': 'Pago Reciclado',
            'acordo': 'Acordo'
        };

        const apartamentoElement = document.createElement('div');
        apartamentoElement.className = `item-card apartamento-card status-${status}`;
        apartamentoElement.style.animationDelay = `${index * 0.05}s`;

        const tipoUnidade = apartamento.tipo === 'casa' ? 'Casa' : 'Apt';

        apartamentoElement.innerHTML = `
            <div class="card-header">
                <h3>${tipoUnidade} ${apartamento.numero}</h3>
                <div class="status-badge status-${status}">
                    ${statusLabels[status] || 'Pendente'}
                </div>
            </div>
            <!--
            <div class="card-content">
                 <p class="proprietario">${apartamento.proprietario}</p>
            </div>
            -->
            <div class="card-content">
                <p class="proprietario">${apartamento.proprietario}</p>
                <!-- Removido resumo financeiro -->
            </div>
            <div class="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </div>
        `;

        apartamentoElement.addEventListener('click', (e) => {
            console.log('ðŸ–±ï¸ Clique no apartamento:', apartamento.numero);

            apartamentoElement.classList.add('selected');
            apartamentoElement.style.transform = 'scale(0.98)';

            setTimeout(() => {
                console.log('â° Timeout executado, chamando openApartmentModal...');
                try {
                    // selectApartamento(apartamento); // Old navigation
                    openApartmentModal(apartamento); // New Modal
                } catch (error) {
                    console.error('âŒ Erro ao abrir modal:', error);
                }

                apartamentoElement.classList.remove('selected');
                apartamentoElement.style.transform = '';
            }, 200);
        });

        elements.apartamentosList.appendChild(apartamentoElement);
    });
}

// New Apartment Modal Functions - VERSÃƒO DEFINITIVA BULLETPROOF
function openApartmentModal(apartamento) {
    console.log('🎯 MODAL DEFINITIVO - openApartmentModal chamada com:', apartamento);

    // VERIFICAR SE É VIEWER - SOMENTE VISUALIZAÇÃO
    const currentUser = getCurrentUser();
    const isViewer = currentUser && currentUser.email === 'viewer@condominio.com';
    
    if (isViewer) {
        console.log('👁️ Usuário VIEWER - modo somente leitura');
    }

    // VERIFICAR PERÍODO ATIVO PRIMEIRO
    if (!checkActivePeriod()) {
        return;
    }

    if (!apartamento) {
        console.error('âŒ Apartamento nÃ£o fornecido');
        return;
    }

    // ETAPA 1: Verificar e encontrar modal
    let modal = elements.apartmentModal;
    if (!modal) {
        console.log('ðŸ” Modal nÃ£o encontrado em elements, buscando diretamente...');
        modal = document.getElementById('apartmentModal');
        if (modal) {
            console.log('âœ… Modal encontrado diretamente, atualizando elements...');
            elements.apartmentModal = modal;
        } else {
            console.error('âŒ Modal realmente nÃ£o existe no DOM - criando emergÃªncia...');
            createEmergencyModal(apartamento);
            return;
        }
    }

    console.log('âœ… Modal encontrado, iniciando processo de abertura...');
    appState.selectedApartamento = apartamento;

    // Garantir que os pagamentos do apartamento (mês ativo) estejam carregados
    try {
        const hasPaymentForActive = appState.payments && appState.payments.condominio && appState.payments.condominio.some(p =>
            p.apartamentoId === apartamento.id && (
                (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                (p.date === `${appState.activeYear}-${appState.activeMonth}`)
            )
        );

        if (!hasPaymentForActive && typeof loadPaymentsData === 'function') {
            // Carregar listener/pagamentos para este apartamento (traz o pagamento salvo se existir)
            // Usar promise .catch em vez de await porque openApartmentModal não é async
            loadPaymentsData(apartamento.id).catch(err => {
                console.warn('Erro ao carregar pagamentos ao abrir modal:', err);
            });
        }
    } catch (err) {
        console.warn('Erro ao garantir carregamento de pagamentos do apartamento:', err);
    }

    // ETAPA 2: Configurar conteÃºdo do modal
    try {
        const tipo = apartamento.tipo === 'casa' ? 'Casa' : 'Apartamento';

        // TÃ­tulo
        const titleElement = document.getElementById('apartmentModalTitle');
        if (titleElement) {
            titleElement.textContent = `${tipo} ${apartamento.numero}`;
            console.log('âœ… TÃ­tulo definido:', `${tipo} ${apartamento.numero}`);
        }

        // Breadcrumb
        const breadcrumbElement = document.getElementById('apartmentBreadcrumb');
        if (breadcrumbElement) {
            const condominio = (appState.selectedCondominio ? appState.selectedCondominio.nome : 'CondomÃ­nio');
            if (apartamento.tipo === 'casa') {
                breadcrumbElement.textContent = condominio + ' > Casas > ' + apartamento.numero;
            } else {
                const bloco = (appState.selectedBloco ? appState.selectedBloco.nome : 'Bloco');
                breadcrumbElement.textContent = condominio + ' > ' + bloco + ' > ' + apartamento.numero;
            }
            console.log('âœ… Breadcrumb definido');
        }

        // Limpar formulÃ¡rio
        const radios = document.querySelectorAll('input[name="aptStatus"]');
        radios.forEach(radio => radio.checked = false);

        const observationsField = document.getElementById('apartmentObservations');
        if (observationsField) observationsField.value = '';

        // CRÍTICO: Buscar status do PAGAMENTO do período ativo, não do apartamento
        let currentStatus = 'pendente';
        let currentObservacao = '';
        
        console.log('🔍 [MODAL] Buscando status do período ativo:', appState.activeYear, appState.activeMonth);
        
        if (appState.activeYear && appState.activeMonth) {
            const payment = appState.payments.condominio.find(p =>
                p.apartamentoId === apartamento.id &&
                (
                    (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
                    (p.date === `${appState.activeYear}-${appState.activeMonth}`)
                )
            );

            if (payment) {
                currentStatus = payment.status || 'pendente';
                currentObservacao = payment.observacao || '';
                console.log('✅ [MODAL] Pagamento encontrado:', currentStatus, currentObservacao);
            } else {
                console.log('⚠️ [MODAL] Nenhum pagamento encontrado - usando pendente');
            }
        } else {
            // Fallback: usar status do apartamento se não houver período ativo
            currentStatus = apartamento.status || 'pendente';
            currentObservacao = apartamento.observacao || '';
            console.warn('⚠️ [MODAL] Período ativo não definido - usando status do apartamento');
        }

        // Selecionar status atual
        const currentRadio = document.querySelector(`input[name="aptStatus"][value="${currentStatus}"]`);
        if (currentRadio) {
            currentRadio.checked = true;
            console.log('âœ… Status atual selecionado:', currentStatus);
        } else {
            console.warn('⚠️ Radio button não encontrado para status:', currentStatus);
        }

        // Preencher observaÃ§Ãµes
        if (observationsField) {
            observationsField.value = currentObservacao;
            console.log('âœ… ObservaÃ§Ãµes preenchidas');
        }

        // NOVO: Lógica para campos de casa (nome e morador)
        const houseNameGroup = document.getElementById('houseNameGroup');
        const houseNameInput = document.getElementById('houseNameInput');
        const houseGroup = document.getElementById('houseResidentGroup');
        const houseInput = document.getElementById('houseResidentName');

        if (apartamento.tipo === 'casa') {
            // Mostrar campo de nome da casa
            if (houseNameGroup) {
                houseNameGroup.classList.remove('hidden');
                houseNameGroup.style.setProperty('display', 'block', 'important');
            }
            if (houseNameInput) {
                houseNameInput.value = apartamento.numero || '';
            }
            
            // Mostrar campo de morador
            if (houseGroup) {
                houseGroup.classList.remove('hidden');
                houseGroup.style.setProperty('display', 'block', 'important');
            }
            if (houseInput) {
                houseInput.value = apartamento.morador || '';
            }
        } else {
            // Esconder campos de casa para apartamentos
            if (houseNameGroup) {
                houseNameGroup.classList.add('hidden');
                houseNameGroup.style.setProperty('display', 'none', 'important');
            }
            if (houseGroup) {
                houseGroup.classList.add('hidden');
                houseGroup.style.setProperty('display', 'none', 'important');
            }
        }

        console.log('âœ… ConteÃºdo do modal configurado');
    } catch (error) {
        console.error('âŒ Erro ao configurar conteÃºdo:', error);
    }

    // DESABILITAR CAMPOS SE FOR VIEWER
    if (isViewer) {
        console.log('🔒 Desabilitando campos para VIEWER');
        
        // Desabilitar radio buttons de status
        const radioButtons = modal.querySelectorAll('input[name="aptStatus"]');
        radioButtons.forEach(radio => {
            radio.disabled = true;
            radio.style.cursor = 'not-allowed';
        });
        
        // Desabilitar campo de observações
        const observationsField = document.getElementById('apartmentObservations');
        if (observationsField) {
            observationsField.disabled = true;
            observationsField.style.cursor = 'not-allowed';
            observationsField.style.backgroundColor = '#f5f5f5';
        }
        
        // Desabilitar campos de casa
        const houseNameInput = document.getElementById('houseNameInput');
        const houseInput = document.getElementById('houseResidentName');
        if (houseNameInput) {
            houseNameInput.disabled = true;
            houseNameInput.style.cursor = 'not-allowed';
            houseNameInput.style.backgroundColor = '#f5f5f5';
        }
        if (houseInput) {
            houseInput.disabled = true;
            houseInput.style.cursor = 'not-allowed';
            houseInput.style.backgroundColor = '#f5f5f5';
        }
        
        // Desabilitar botão de salvar
        const saveBtnViewer = document.getElementById('saveApartmentStatus');
        if (saveBtnViewer) {
            saveBtnViewer.disabled = true;
            saveBtnViewer.style.cursor = 'not-allowed';
            saveBtnViewer.style.opacity = '0.5';
            saveBtnViewer.textContent = '🔒 Somente Visualização';
        }
        
        // Adicionar mensagem de aviso
        const modalHeader = modal.querySelector('.modal-header');
        if (modalHeader) {
            const existingWarning = modal.querySelector('.viewer-warning');
            if (!existingWarning) {
                const warning = document.createElement('div');
                warning.className = 'viewer-warning';
                warning.style.cssText = 'background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 14px; display: flex; align-items: center; gap: 8px;';
                warning.innerHTML = '👁️ <strong>Modo Visualização:</strong> Você não tem permissão para editar.';
                modalHeader.appendChild(warning);
            }
        }
        
        console.log('✅ Campos desabilitados para VIEWER');
    }

    // ETAPA 3: FORÃ‡AR VISIBILIDADE - MÃ‰TODO DEFINITIVO
    console.log('ðŸš€ FORÃ‡ANDO VISIBILIDADE DO MODAL - MÃ‰TODO DEFINITIVO');

    // RE-ATTACH LISTENERS (SeguranÃ§a contra falhas de inicializaÃ§Ã£o)
    const closeBtn = document.getElementById('closeApartmentModal');
    const cancelBtn = document.getElementById('cancelApartmentModal');
    const saveBtn = document.getElementById('saveApartmentStatus');

    if (closeBtn) closeBtn.onclick = closeApartmentModal;
    if (cancelBtn) cancelBtn.onclick = closeApartmentModal;
    if (saveBtn) saveBtn.onclick = saveApartmentStatusNew;

    try {
        // MÃ©todo 1: Limpar classes problemÃ¡ticas
        modal.classList.remove('hidden');
        modal.classList.add('modal-visible');
        console.log('âœ… Classes atualizadas');

        // MÃ©todo 2: Estilos inline com mÃ¡xima prioridade
        const criticalStyles = {
            'display': 'flex',
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'z-index': '99999',
            'background': 'rgba(0, 0, 0, 0.5)',
            'align-items': 'center',
            'justify-content': 'center',
            'visibility': 'visible',
            'opacity': '1'
        };

        Object.entries(criticalStyles).forEach(([prop, value]) => {
            modal.style.setProperty(prop, value, 'important');
        });
        console.log('âœ… Estilos crÃ­ticos aplicados');

        // Garantir que todos os elementos interativos sejam clicÃ¡veis
        const interactiveElements = modal.querySelectorAll('button, input, textarea, label, .status-option-card');
        interactiveElements.forEach(element => {
            element.style.setProperty('pointer-events', 'auto', 'important');
            element.style.setProperty('z-index', '100001', 'important');
            element.style.setProperty('position', 'relative', 'important');
        });
        console.log('âœ… Todos os elementos interativos configurados para serem clicÃ¡veis');

        // Reconfigurar event listeners do modal apÃ³s forÃ§ar visibilidade
        setupModalEventListeners();

        // MÃ©todo 3: Garantir container visÃ­vel
        const container = modal.querySelector('.modal-container');
        if (container) {
            const containerStyles = {
                'display': 'block',
                'background': 'white',
                'border-radius': '16px',
                'max-width': '600px',
                'width': '90%',
                'max-height': '90vh',
                'overflow-y': 'auto',
                'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            };

            Object.entries(containerStyles).forEach(([prop, value]) => {
                container.style.setProperty(prop, value, 'important');
            });
            console.log('âœ… Container configurado');
        }

        // ETAPA 4: FORÃ‡AR EVENT LISTENERS DIRETAMENTE NOS BOTÃ•ES
        console.log('ðŸ”§ FORÃ‡ANDO EVENT LISTENERS DIRETAMENTE...');

        // BotÃ£o X (fechar)
        const closeBtn = document.getElementById('closeApartmentModal');
        if (closeBtn) {
            // Remover listeners antigos
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            const newCloseBtn = document.getElementById('closeApartmentModal');

            // Adicionar novo listener
            newCloseBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('ðŸ”’ BotÃ£o X clicado - fechando modal');
                closeApartmentModal();
            });

            // ForÃ§ar estilos
            newCloseBtn.style.setProperty('pointer-events', 'auto', 'important');
            newCloseBtn.style.setProperty('z-index', '100002', 'important');
            newCloseBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('âœ… BotÃ£o X configurado');
        }

        // BotÃ£o Cancelar
        const cancelBtn = document.getElementById('cancelApartmentModal');
        if (cancelBtn) {
            // Remover listeners antigos
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            const newCancelBtn = document.getElementById('cancelApartmentModal');

            // Adicionar novo listener
            newCancelBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('ðŸ”’ BotÃ£o Cancelar clicado - fechando modal');
                closeApartmentModal();
            });

            // ForÃ§ar estilos
            newCancelBtn.style.setProperty('pointer-events', 'auto', 'important');
            newCancelBtn.style.setProperty('z-index', '100002', 'important');
            newCancelBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('âœ… BotÃ£o Cancelar configurado');
        }

        // BotÃ£o Salvar
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            // Remover listeners antigos
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('saveApartmentStatus');

            // Adicionar novo listener
            newSaveBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('ðŸ’¾ BotÃ£o Salvar clicado - processando dados');
                saveApartmentStatusNew();
            });

            // ForÃ§ar estilos
            newSaveBtn.style.setProperty('pointer-events', 'auto', 'important');
            newSaveBtn.style.setProperty('z-index', '100002', 'important');
            newSaveBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('âœ… BotÃ£o Salvar configurado');
        }

        // Clique fora do modal para fechar
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                console.log('ðŸ”’ Clique fora do modal - fechando');
                closeApartmentModal();
            }
        });

        // Configurar radio buttons
        const radioButtons = modal.querySelectorAll('input[name="aptStatus"]');
        radioButtons.forEach((radio, index) => {
            radio.style.setProperty('pointer-events', 'auto', 'important');
            radio.style.setProperty('z-index', '100002', 'important');

            radio.addEventListener('change', function (e) {
                console.log(`ðŸ“‹ Status selecionado: ${e.target.value}`);
                handleStatusChange(e.target.value);
            });
        });

        // Configurar textarea
        const textarea = document.getElementById('apartmentObservations');
        if (textarea) {
            textarea.style.setProperty('pointer-events', 'auto', 'important');
            textarea.style.setProperty('z-index', '100002', 'important');
        }

        console.log('âœ… TODOS OS EVENT LISTENERS FORÃ‡ADOS DIRETAMENTE');

        // ETAPA 5: VerificaÃ§Ã£o final com timeout
        setTimeout(() => {
            const computedDisplay = window.getComputedStyle(modal).display;
            const computedVisibility = window.getComputedStyle(modal).visibility;
            const computedOpacity = window.getComputedStyle(modal).opacity;

            console.log('ðŸ” VERIFICAÃ‡ÃƒO FINAL:');
            console.log(`  - Display: ${computedDisplay}`);
            console.log(`  - Visibility: ${computedVisibility}`);
            console.log(`  - Opacity: ${computedOpacity}`);
            console.log(`  - Z-index: ${window.getComputedStyle(modal).zIndex}`);
            console.log(`  - Classes: ${modal.className}`);

            const isVisible = computedDisplay === 'flex' &&
                computedVisibility === 'visible' &&
                parseFloat(computedOpacity) > 0;

            if (isVisible) {
                console.log('ðŸŽ‰ SUCESSO! MODAL ESTÃ COMPLETAMENTE VISÃVEL!');
                showToast('Modal aberto com sucesso!', 'success');
            } else {
                console.error('âŒ FALHA CRÃTICA - Modal nÃ£o ficou visÃ­vel');
                console.log('ðŸš¨ Ativando sistema de emergÃªncia...');

                // Ocultar modal problemÃ¡tico
                modal.style.display = 'none';

                // Criar modal de emergÃªncia
                createEmergencyModal(apartamento);
            }
        }, 300);

    } catch (error) {
        console.error('âŒ ERRO CRÃTICO ao forÃ§ar visibilidade:', error);
        console.log('ðŸš¨ Ativando sistema de emergÃªncia imediatamente...');
        createEmergencyModal(apartamento);
    }
}

// FunÃ§Ã£o para configurar event listeners do modal quando ele abre
function setupModalEventListeners() {
    console.log('ðŸ”§ Reconfigurando event listeners do modal...');

    // Configurar botÃ£o fechar (X)
    const closeBtn = document.getElementById('closeApartmentModal');
    if (closeBtn) {
        closeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o X clicado (onclick)');
            closeApartmentModal();
        };

        closeBtn.style.setProperty('pointer-events', 'auto', 'important');
        closeBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('âœ… BotÃ£o X reconfigurado');
    }

    // Configurar botÃ£o cancelar
    const cancelBtn = document.getElementById('cancelApartmentModal');
    if (cancelBtn) {
        cancelBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Cancelar clicado (onclick)');
            closeApartmentModal();
        };

        cancelBtn.style.setProperty('pointer-events', 'auto', 'important');
        cancelBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('âœ… BotÃ£o Cancelar reconfigurado');
    }

    // Configurar botÃ£o salvar
    const saveBtn = document.getElementById('saveApartmentStatus');
    if (saveBtn) {
        saveBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('ðŸ–±ï¸ BotÃ£o Salvar clicado (onclick)');
            saveApartmentStatusNew();
        };

        saveBtn.style.setProperty('pointer-events', 'auto', 'important');
        saveBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('âœ… BotÃ£o Salvar reconfigurado');
    }

    // Configurar radio buttons
    const radioButtons = document.querySelectorAll('#apartmentModal input[name="aptStatus"]');
    radioButtons.forEach((radio, index) => {
        radio.onclick = function (e) {
            console.log(`ðŸ“‹ Radio ${index + 1} clicado:`, e.target.value);
            // Permitir que o evento continue normalmente
        };

        radio.style.setProperty('pointer-events', 'auto', 'important');
        radio.style.setProperty('cursor', 'pointer', 'important');
    });

    // Configurar labels dos radio buttons
    const labels = document.querySelectorAll('#apartmentModal .status-option-card');
    labels.forEach((label, index) => {
        label.onclick = function (e) {
            const radio = label.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                console.log(`ðŸ“‹ Label ${index + 1} clicado, radio selecionado:`, radio.value);
                handleStatusChange(radio.value);
            }
        };

        label.style.setProperty('pointer-events', 'auto', 'important');
        label.style.setProperty('cursor', 'pointer', 'important');
    });

    console.log('âœ… Event listeners do modal reconfigurados');
}

function closeApartmentModal() {
    console.log('ðŸ”’ closeApartmentModal chamada');

    const modal = elements.apartmentModal || document.getElementById('apartmentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('modal-visible');
        modal.style.display = 'none';
        console.log('âœ… Modal fechado com sucesso');
    }

    appState.selectedApartamento = null;

    // Limpar formulÃ¡rio
    try {
        clearApartmentModalForm();
    } catch (error) {
        console.warn('Erro ao limpar formulÃ¡rio:', error);
    }
}

function clearApartmentModalForm() {
    console.log('ðŸ§¹ Limpando formulÃ¡rio do modal');

    // Limpar radio buttons
    const radios = document.querySelectorAll('input[name="aptStatus"]');
    radios.forEach(radio => radio.checked = false);

    // Limpar textarea
    const observationsField = document.getElementById('apartmentObservations');
    if (observationsField) observationsField.value = '';

    const houseInput = document.getElementById('houseResidentName');
    if (houseInput) houseInput.value = '';

    console.log('âœ… FormulÃ¡rio limpo');
}

function handleStatusChange(status) {
    console.log('ðŸ”„ handleStatusChange chamada com status:', status);

    // Aqui vocÃª pode adicionar lÃ³gica especÃ­fica para cada status
    // Por exemplo, mostrar/ocultar campos adicionais

    const valueGroup = document.getElementById('paymentValueGroup');
    const dateGroup = document.getElementById('paymentDateGroup');

    if (status === 'pago' || status === 'reciclado') {
        if (valueGroup) valueGroup.style.display = 'block';
        if (dateGroup) dateGroup.style.display = 'block';
    } else {
        if (valueGroup) valueGroup.style.display = 'none';
        if (dateGroup) dateGroup.style.display = 'none';
    }
}

// CORRECAO v90: Função para recarregar pagamentos do Firebase após salvar
async function reloadPaymentsFromFirebase() {
    console.log('🔄 [RELOAD] Recarregando pagamentos do Firebase...');
    
    try {
        // Limpar cache antigo
        const oldCount = appState.payments.condominio.length;
        appState.payments.condominio = [];
        
        // Verificar se há período ativo
        if (!appState.activeYear || !appState.activeMonth) {
            console.warn('⚠️ [RELOAD] Sem período ativo definido');
            return 0;
        }
        
        const date = `${appState.activeYear}-${appState.activeMonth}`;
        console.log(`📅 [RELOAD] Carregando pagamentos de ${date}...`);
        
        // OTIMIZAÇÃO v131: Buscar todos os pagamentos do condomínio de uma vez
        if (appState.selectedCondominio) {
            try {
                const allPayments = await getPaymentsByCondominioAndPeriod(
                    appState.selectedCondominio.id, 
                    date
                );
                appState.payments.condominio = allPayments;
                console.log(`✅ [RELOAD] ${appState.selectedCondominio.nome}: ${allPayments.length} pagamentos (1 query otimizada)`);
            } catch (error) {
                console.warn(`⚠️ [RELOAD] Erro ao carregar pagamentos:`, error);
            }
        } else {
            // Fallback: Recarregar de todos os blocos (caso não tenha condomínio selecionado)
            const blocos = appState.blocos || [];
            
            for (const bloco of blocos) {
                try {
                    const payments = await getPaymentsByBlocoAndPeriod(bloco.id, date);
                    appState.payments.condominio.push(...payments);
                    console.log(`✅ [RELOAD] ${bloco.nome}: ${payments.length} pagamentos`);
                } catch (error) {
                    console.warn(`⚠️ [RELOAD] Erro ao carregar ${bloco.nome}:`, error);
                }
            }
        }
        
        const newCount = appState.payments.condominio.length;
        console.log(`✅ [RELOAD] Total: ${newCount} pagamentos (antes: ${oldCount})`);
        
        return newCount;
        
    } catch (error) {
        console.error('❌ [RELOAD] Erro ao recarregar pagamentos:', error);
        throw error;
    }
}

async function saveApartmentStatusNew() {
    console.log('💾 saveApartmentStatusNew CORRIGIDA chamada');

    // BLOQUEAR SE FOR VIEWER
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email === 'viewer@condominio.com') {
        console.log('🚫 VIEWER não pode salvar alterações');
        alert('❌ Acesso Negado\n\nVocê está no modo VISUALIZAÇÃO e não tem permissão para fazer alterações.');
        return;
    }

    // VERIFICAR PERIODO ATIVO
    if (!appState.activeYear || !appState.activeMonth) {
        alert('Erro: Selecione o ano e mes antes de salvar');
        return;
    }

    if (!appState.selectedApartamento) {
        console.error('❌ Nenhum apartamento selecionado');
        alert('Erro: Nenhum apartamento selecionado');
        return;
    }

    const apartamento = appState.selectedApartamento;
    const statusInput = document.querySelector('input[name="aptStatus"]:checked');
    const selectedStatus = statusInput ? statusInput.value : 'pendente';
    const obsInput = document.getElementById('apartmentObservations');
    let observacoes = obsInput ? obsInput.value.trim() : '';
    const residentInput = document.getElementById('houseResidentName');
    const morador = residentInput ? residentInput.value : '';
    const houseNameInput = document.getElementById('houseNameInput');
    const novoNomeCasa = houseNameInput ? houseNameInput.value : '';

    // CORRECAO v121: Limpar observações incompatíveis quando status muda
    if (selectedStatus === 'pago') {
        // Se status é PAGO, remover observações que indicam pagamento parcial ou problemas
        const incompatiblePhrases = [
            'metade',
            'parcial',
            'falta',
            'pendente',
            'não pagou',
            'nao pagou',
            'deve',
            'devendo',
            'atrasado'
        ];
        
        const hasIncompatiblePhrase = incompatiblePhrases.some(phrase => 
            observacoes.toLowerCase().includes(phrase)
        );
        
        if (hasIncompatiblePhrase) {
            console.log('⚠️ Observação incompatível com status PAGO detectada. Limpando...');
            observacoes = ''; // Limpar observação incompatível
        }
    }

    console.log('📋 Salvando pagamento para:', {
        apartamento: apartamento.numero,
        ano: appState.activeYear,
        mes: appState.activeMonth,
        status: selectedStatus,
        observacoes: observacoes,
        novoNome: novoNomeCasa
    });

    try {
        // Mostrar loading
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvando...';
            saveBtn.disabled = true;
        }

        // Criar estrutura de pagamento ESPECIFICA para o mes ativo
        const paymentData = {
            apartamentoId: apartamento.id,
            condominioId: apartamento.condominioId,
            apartamentoNumero: apartamento.numero,
            ano: appState.activeYear,
            mes: appState.activeMonth,
            date: `${appState.activeYear}-${appState.activeMonth}`, // formato YYYY-MM
            type: 'condominio',
            status: selectedStatus,
            observacao: observacoes,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // CORRECAO: Adicionar blocoId apenas se existir (casas nao tem blocoId)
        if (apartamento.blocoId) {
            paymentData.blocoId = apartamento.blocoId;
        }

        // Adicionar valor baseado no status
        if (selectedStatus === 'pago') {
            paymentData.value = 80.00;
        } else if (selectedStatus === 'reciclado') {
            paymentData.value = 40.00;
        } else {
            paymentData.value = 0; // pendente e acordo n�o t�m valor
        }

        if (apartamento.tipo === 'casa') {
            paymentData.tipo = 'casa';
            paymentData.morador = morador;
        } else {
            paymentData.tipo = 'apartamento';
        }

        // Verificar se ja existe pagamento para este mes
        const existingPayments = appState.payments.condominio.filter(p =>
            p.apartamentoId === apartamento.id &&
            p.ano === appState.activeYear &&
            p.mes === appState.activeMonth
        );

        let savedPaymentId = null;

        if (existingPayments.length > 0) {
            // Atualizar pagamento existente
            if (typeof updatePayment === 'function') {
                await updatePayment(existingPayments[0].id, paymentData);
                savedPaymentId = existingPayments[0].id;
                console.log('✓ Pagamento atualizado no Firebase');

                // Atualizar no estado local (manter consistência imediata na UI)
                const localIndex = appState.payments.condominio.findIndex(p => p.id === savedPaymentId);
                if (localIndex >= 0) {
                    appState.payments.condominio[localIndex] = {
                        ...appState.payments.condominio[localIndex],
                        ...paymentData,
                        id: savedPaymentId
                    };
                }
            }
        } else {
            // Criar novo pagamento
            if (typeof createPayment === 'function') {
                try {
                    savedPaymentId = await createPayment(paymentData);
                    console.log('✓ Novo pagamento criado no Firebase');

                    // Adicionar ao estado local imediatamente para refletir na UI
                    appState.payments.condominio.push({
                        ...paymentData,
                        id: savedPaymentId
                    });
                } catch (err) {
                    console.error('Erro ao criar payment localmente:', err);
                }
            }
        }

        // CORRECAO v100: Atualizar nome da casa no Firebase se foi alterado
        if (apartamento.tipo === 'casa' && novoNomeCasa && novoNomeCasa !== apartamento.numero) {
            console.log(`📝 Atualizando nome da casa: "${apartamento.numero}" → "${novoNomeCasa}"`);
            try {
                if (typeof updateCasa === 'function') {
                    await updateCasa(apartamento.condominioId, apartamento.id, { numero: novoNomeCasa });
                    apartamento.numero = novoNomeCasa;
                    console.log('✅ Nome da casa atualizado no Firebase');
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar nome da casa:', error);
            }
        }

        // Atualizar estado local do apartamento para refletir na UI
        apartamento.status = selectedStatus;
        apartamento.observacao = observacoes;
        if (apartamento.tipo === 'casa') apartamento.morador = morador;

        // CRÍTICO v90: RECARREGAR PAGAMENTOS DO FIREBASE
        console.log('🔄 [SYNC] Iniciando sincronização reativa...');
        
        // 1. PRIMEIRO: Recarregar todos os pagamentos do Firebase (fonte da verdade)
        console.log('🔄 [SYNC] Recarregando pagamentos do Firebase...');
        await reloadPaymentsFromFirebase();
        
        // 2. Recarregar dados do bloco atual (se estiver em tela de apartamentos)
        if (appState.selectedBloco) {
            console.log('🔄 [SYNC] Recarregando apartamentos do bloco...');
            await loadApartamentosData(appState.selectedBloco.id);
        }
        
        // 3. Atualizar lista de casas (se for uma casa)
        if (apartamento.tipo === 'casa') {
            console.log('🔄 [SYNC] Atualizando lista de casas...');
            // Atualizar casa no estado local
            const casaIndex = appState.casas.findIndex(c => c.id === apartamento.id);
            if (casaIndex >= 0) {
                appState.casas[casaIndex] = {
                    ...appState.casas[casaIndex],
                    status: selectedStatus,
                    observacao: observacoes,
                    morador: morador
                };
            }
        }
        
        // 4. Renderizar blocos (atualiza contadores: Em Dia, Pendentes)
        if (appState.currentScreen === 'blocos') {
            console.log('🔄 [SYNC] Renderizando blocos (contadores)...');
            renderBlocos();
        }
        
        // 5. Renderizar condomínios (atualiza percentuais)
        if (appState.currentScreen === 'condominios') {
            console.log('🔄 [SYNC] Renderizando condomínios...');
            renderCondominios();
        }
        
        // 6. Atualizar painel geral (se estiver aberto)
        if (appState.currentScreen === 'painel') {
            console.log('🔄 [SYNC] Atualizando painel geral...');
            applyFilters(); // Recalcula e renderiza tabela
        }
        
        console.log('✅ [SYNC] Sincronização reativa concluída!');

        // Fechar modal
        closeApartmentModal();

        // Mostrar sucesso
        if (typeof showToast === 'function') {
            showToast(`Status salvo para ${appState.activeMonth}/${appState.activeYear}`, 'success');
        }

        // Restaurar botao
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alteracoes';
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);

        // Restaurar botao
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alteracoes';
            saveBtn.disabled = false;
        }
    }
}

// Expor a função globalmente para scripts de patch que esperam window.openApartmentModal
try { window.openApartmentModal = openApartmentModal; } catch (e) { /* noop */ }

// FunÃ§Ã£o de emergÃªncia DEFINITIVA - cria modal do zero se necessÃ¡rio
function createEmergencyModal(apartamento = null) {
    console.log('ðŸš¨ CRIANDO MODAL DE EMERGÃŠNCIA DEFINITIVO...');

    // Usar apartamento do estado se nÃ£o fornecido
    if (!apartamento && appState.selectedApartamento) {
        apartamento = appState.selectedApartamento;
    }

    if (!apartamento) {
        apartamento = {
            numero: '---',
            tipo: 'apartamento',
            status: 'pendente'
        };
    }

    // Remover modal existente se houver
    const existingModal = document.getElementById('emergencyModal');
    if (existingModal) {
        existingModal.remove();
        console.log('ðŸ—‘ï¸ Modal de emergÃªncia anterior removido');
    }

    const tipo = apartamento.tipo === 'casa' ? 'Casa' : 'Apartamento';
    const condominio = (appState.selectedCondominio ? appState.selectedCondominio.nome : 'CondomÃ­nio');
    const bloco = (appState.selectedBloco ? appState.selectedBloco.nome : 'Bloco');

    // Criar modal HTML do zero com funcionalidade completa
    const modalHTML = `
        <div id="emergencyModal" style="
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.5) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        ">
            <div style="
                background: white !important;
                border-radius: 16px !important;
                padding: 0 !important;
                max-width: 600px !important;
                width: 90% !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
            ">
                <div style="
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: flex-start !important;
                    padding: 24px !important;
                    border-bottom: 1px solid #e5e7eb !important;
                ">
                    <div>
                        <h3 style="margin: 0 !important; font-size: 20px !important; color: #1f2937 !important; font-weight: 700 !important;">
                            ${tipo} ${apartamento.numero}
                        </h3>
                        <p style="margin: 4px 0 0 0 !important; color: #6b7280 !important; font-size: 14px !important;">
                            ${condominio} > ${bloco} > ${apartamento.numero}
                        </p>
                    </div>
                    <button onclick="closeEmergencyModal()" style="
                        background: none !important;
                        border: none !important;
                        color: #6b7280 !important;
                        cursor: pointer !important;
                        padding: 8px !important;
                        border-radius: 4px !important;
                        font-size: 24px !important;
                        line-height: 1 !important;
                    ">Ã—</button>
                </div>
                
                <div style="padding: 24px !important;">
                    <div style="margin-bottom: 24px !important;">
                        <label style="display: block !important; font-weight: 600 !important; font-size: 14px !important; color: #374151 !important; margin-bottom: 12px !important;">
                            Status do Pagamento
                        </label>
                        <div style="
                            display: grid !important;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
                            gap: 12px !important;
                        ">
                            <label onclick="selectEmergencyStatus('pendente')" style="
                                display: block !important;
                                padding: 16px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 12px !important;
                                background: white !important;
                                cursor: pointer !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#ef4444'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                                <div style="display: flex !important; align-items: center !important; gap: 12px !important;">
                                    <div style="
                                        width: 40px !important;
                                        height: 40px !important;
                                        border-radius: 50% !important;
                                        background: #fee2e2 !important;
                                        display: flex !important;
                                        align-items: center !important;
                                        justify-content: center !important;
                                        color: #dc2626 !important;
                                        font-size: 18px !important;
                                    ">â°</div>
                                    <div>
                                        <div style="font-weight: 600 !important; font-size: 14px !important; color: #1f2937 !important;">PENDENTE</div>
                                        <div style="font-size: 12px !important; color: #6b7280 !important;">Pagamento em aberto</div>
                                    </div>
                                </div>
                            </label>
                            
                            <label onclick="selectEmergencyStatus('pago')" style="
                                display: block !important;
                                padding: 16px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 12px !important;
                                background: white !important;
                                cursor: pointer !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#22c55e'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                                <div style="display: flex !important; align-items: center !important; gap: 12px !important;">
                                    <div style="
                                        width: 40px !important;
                                        height: 40px !important;
                                        border-radius: 50% !important;
                                        background: #dcfce7 !important;
                                        display: flex !important;
                                        align-items: center !important;
                                        justify-content: center !important;
                                        color: #16a34a !important;
                                        font-size: 18px !important;
                                    ">âœ“</div>
                                    <div>
                                        <div style="font-weight: 600 !important; font-size: 14px !important; color: #1f2937 !important;">PAGO</div>
                                        <div style="font-size: 12px !important; color: #6b7280 !important;">Pagamento realizado</div>
                                    </div>
                                </div>
                            </label>
                            
                            <label onclick="selectEmergencyStatus('reciclado')" style="
                                display: block !important;
                                padding: 16px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 12px !important;
                                background: white !important;
                                cursor: pointer !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#06b6d4'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                                <div style="display: flex !important; align-items: center !important; gap: 12px !important;">
                                    <div style="
                                        width: 40px !important;
                                        height: 40px !important;
                                        border-radius: 50% !important;
                                        background: #cffafe !important;
                                        display: flex !important;
                                        align-items: center !important;
                                        justify-content: center !important;
                                        color: #0891b2 !important;
                                        font-size: 18px !important;
                                    ">â†»</div>
                                    <div>
                                        <div style="font-weight: 600 !important; font-size: 14px !important; color: #1f2937 !important;">PAGO RECICLADO</div>
                                        <div style="font-size: 12px !important; color: #6b7280 !important;">Pagamento reprocessado</div>
                                    </div>
                                </div>
                            </label>
                            
                            <label onclick="selectEmergencyStatus('acordo')" style="
                                display: block !important;
                                padding: 16px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 12px !important;
                                background: white !important;
                                cursor: pointer !important;
                                transition: all 0.2s !important;
                            " onmouseover="this.style.borderColor='#f59e0b'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.transform='translateY(0)'">
                                <div style="display: flex !important; align-items: center !important; gap: 12px !important;">
                                    <div style="
                                        width: 40px !important;
                                        height: 40px !important;
                                        border-radius: 50% !important;
                                        background: #fef3c7 !important;
                                        display: flex !important;
                                        align-items: center !important;
                                        justify-content: center !important;
                                        color: #d97706 !important;
                                        font-size: 18px !important;
                                    ">âš–</div>
                                    <div>
                                        <div style="font-weight: 600 !important; font-size: 14px !important; color: #1f2937 !important;">ACORDO</div>
                                        <div style="font-size: 12px !important; color: #6b7280 !important;">Acordo de pagamento</div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 24px !important;">
                        <label style="display: block !important; font-weight: 600 !important; font-size: 14px !important; color: #374151 !important; margin-bottom: 8px !important;">
                            Acordo / ObservaÃ§Ãµes
                        </label>
                        <textarea id="emergencyObservations" style="
                            width: 100% !important;
                            padding: 12px !important;
                            border: 2px solid #e5e7eb !important;
                            border-radius: 8px !important;
                            font-family: inherit !important;
                            font-size: 14px !important;
                            line-height: 1.5 !important;
                            resize: vertical !important;
                            min-height: 80px !important;
                            box-sizing: border-box !important;
                        " placeholder="Digite observaÃ§Ãµes sobre o acordo ou outras informaÃ§Ãµes relevantes...">${apartamento.observacao || ''}</textarea>
                    </div>
                    
                    <div id="emergencyPaymentFields" style="display: none !important;">
                        <div style="margin-bottom: 16px !important;">
                            <label style="display: block !important; font-weight: 600 !important; font-size: 14px !important; color: #374151 !important; margin-bottom: 8px !important;">
                                Valor do Pagamento
                            </label>
                            <input type="number" id="emergencyValue" step="0.01" min="0" placeholder="285.00" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                        <div style="margin-bottom: 16px !important;">
                            <label style="display: block !important; font-weight: 600 !important; font-size: 14px !important; color: #374151 !important; margin-bottom: 8px !important;">
                                Data do Pagamento
                            </label>
                            <input type="date" id="emergencyDate" style="
                                width: 100% !important;
                                padding: 12px !important;
                                border: 2px solid #e5e7eb !important;
                                border-radius: 8px !important;
                                font-size: 14px !important;
                                box-sizing: border-box !important;
                            ">
                        </div>
                    </div>
                </div>
                
                <div style="
                    display: flex !important;
                    justify-content: flex-end !important;
                    gap: 12px !important;
                    padding: 24px !important;
                    border-top: 1px solid #e5e7eb !important;
                    background: #f9fafb !important;
                    border-radius: 0 0 16px 16px !important;
                ">
                    <button onclick="closeEmergencyModal()" style="
                        background: #e5e7eb !important;
                        color: #374151 !important;
                        border: none !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-weight: 500 !important;
                        cursor: pointer !important;
                        transition: all 0.2s !important;
                    " onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">Cancelar</button>
                    <button onclick="saveEmergencyStatus()" style="
                        background: #2563eb !important;
                        color: white !important;
                        border: none !important;
                        padding: 12px 24px !important;
                        border-radius: 8px !important;
                        font-weight: 500 !important;
                        cursor: pointer !important;
                        transition: all 0.2s !important;
                    " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">Salvar AlteraÃ§Ãµes</button>
                </div>
            </div>
        </div>
    `;

    // Adicionar ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Configurar data atual
    const dateField = document.getElementById('emergencyDate');
    if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
    }

    // Selecionar status atual ou pendente por padrÃ£o
    const currentStatus = apartamento.status || 'pendente';
    selectEmergencyStatus(currentStatus);

    console.log('âœ… MODAL DE EMERGÃŠNCIA CRIADO E EXIBIDO COM SUCESSO!');
    console.log('ðŸŽ‰ Este modal SEMPRE funciona - Ã© impossÃ­vel falhar!');

    // Mostrar toast de sucesso
    if (typeof showToast === 'function') {
        showToast('Modal de emergÃªncia ativado - Sistema funcionando!', 'success');
    }
}
// VariÃ¡vel global para status selecionado
let selectedEmergencyStatus = 'pendente';

function selectEmergencyStatus(status) {
    selectedEmergencyStatus = status;

    // Atualizar visual dos cards
    const labels = document.querySelectorAll('#emergencyModal label[onclick*="selectEmergencyStatus"]');
    labels.forEach(label => {
        label.style.borderColor = '#e5e7eb';
        label.style.backgroundColor = 'white';
    });

    // Destacar selecionado
    const selectedLabel = document.querySelector(`#emergencyModal label[onclick*="${status}"]`);
    if (selectedLabel) {
        selectedLabel.style.borderColor = '#2563eb';
        selectedLabel.style.backgroundColor = '#f0f9ff';
    }

    // Mostrar/ocultar campos de pagamento
    const paymentFields = document.getElementById('emergencyPaymentFields');
    if (status === 'pago' || status === 'reciclado') {
        paymentFields.style.display = 'block';

        // Definir valor padrÃ£o
        const valueField = document.getElementById('emergencyValue');
        if (valueField && !valueField.value) {
            valueField.value = '285.00';
        }
    } else {
        paymentFields.style.display = 'none';
    }

    console.log('Status selecionado:', status);
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if (modal) {
        modal.remove();
    }
    appState.selectedApartamento = null;
}

async function saveEmergencyStatus() {
    try {
        const apartamento = appState.selectedApartamento;
        if (!apartamento) {
            alert('Erro: Apartamento nÃ£o selecionado');
            return;
        }

        const observations = document.getElementById('emergencyObservations').value.trim();
        const value = document.getElementById('emergencyValue').value;
        const date = document.getElementById('emergencyDate').value;

        // ValidaÃ§Ãµes
        if ((selectedEmergencyStatus === 'pago' || selectedEmergencyStatus === 'reciclado') && !value) {
            alert('Informe o valor do pagamento');
            return;
        }

        if ((selectedEmergencyStatus === 'pago' || selectedEmergencyStatus === 'reciclado') && !date) {
            alert('Informe a data do pagamento');
            return;
        }

        // Preparar dados do pagamento
        const currentMonth = date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7);
        const paymentData = {
            apartamentoId: apartamento.id,
            condominioId: apartamento.condominioId,
            date: currentMonth,
            type: 'condominio',
            status: selectedEmergencyStatus,
            observations: observations
        };
        
        // CORRECAO: Adicionar blocoId apenas se existir (casas nao tem blocoId)
        if (apartamento.blocoId) {
            paymentData.blocoId = apartamento.blocoId;
        }

        // Adicionar valor apenas para pagamentos efetivos
        if (selectedEmergencyStatus === 'pago' || selectedEmergencyStatus === 'reciclado') {
            paymentData.value = parseFloat(value);
            paymentData.paymentDate = date;
        }

        // Verificar se jÃ¡ existe pagamento para este mÃªs
        const existingPayments = appState.payments.condominio.filter(p =>
            p.apartamentoId === apartamento.id && p.date === currentMonth
        );

        if (existingPayments.length > 0) {
            // Atualizar pagamento existente
            await updatePayment(existingPayments[0].id, paymentData);
            alert('Status atualizado com sucesso!');
        } else {
            // Criar novo pagamento
            await createPayment(paymentData);
            alert('Pagamento registrado com sucesso!');
        }

        // Recarregar dados e fechar modal
        await loadPaymentsData(apartamento.id);
        renderApartamentos();
        closeEmergencyModal();

    } catch (error) {
        console.error('Erro ao salvar status:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}

// Tornar funções de modal de emergência acessíveis globalmente
window.selectEmergencyStatus = selectEmergencyStatus;
window.closeEmergencyModal = closeEmergencyModal;
window.saveEmergencyStatus = saveEmergencyStatus;

// FUNCAO ANTIGA - NAO USAR - Substituida por saveApartmentStatusNew
// Esta funcao nao salva pagamentos, apenas atualiza o documento do apartamento
// Isso causa erro para casas (que estao em subcoleção)
/*
async function saveApartmentStatus() {
    if (!appState.selectedApartamento) return;

    const apartamento = appState.selectedApartamento;
    const statusInput = document.querySelector('input[name="aptStatus"]:checked');
    const selectedStatus = statusInput ? statusInput.value : 'pendente';
    const observacao = elements.aptObservation.value;

    try {
        elements.saveApartmentBtn.textContent = 'Salvando...';
        elements.saveApartmentBtn.disabled = true;

        // Update in Firestore
        await updateApartamento(apartamento.id, {
            status: selectedStatus,
            observacao: observacao
        });

        // Update local state
        apartamento.status = selectedStatus;
        apartamento.observacao = observacao;

        // Update UI logic to reflect changes locally without full reload if possible, 
        // but renderApartamentos reads from appState.apartamentos which we just mutated.
        renderApartamentos();

        closeApartmentModal();

        // Show success feedback (optional, or just close)
    } catch (error) {
        console.error('Error saving apartment status:', error);
        alert('Erro ao salvar status. Tente novamente.');
    } finally {
        elements.saveApartmentBtn.textContent = 'Salvar Alterações';
        elements.saveApartmentBtn.disabled = false;
    }
}
*/

/* function selectApartamento(apartamento) {
    appState.selectedApartamento = apartamento;
    showScreen('pagamentos');
    loadPaymentsData(apartamento.id);
    renderPagamentos();
} */

// RenderizaÃ§Ã£o de pagamentos
function renderPagamentos() {
    const tipoUnidade = appState.selectedApartamento.tipo === 'casa' ? 'Casa' : 'Apartamento';
    const condominio = appState.condominios.find(c => c.id === appState.selectedApartamento.condominioId);
    const bloco = appState.blocos.find(b => b.id === appState.selectedApartamento.blocoId);

    elements.apartmentTitle.textContent = `${tipoUnidade} ${appState.selectedApartamento.numero}`;
    elements.apartmentLocation.textContent = `${condominio.nome} - ${bloco.nome}`;
    elements.currentYear.textContent = appState.currentYear;

    checkForDebts();
    renderMonthsGrid();
}

// Verificar dÃ©bitos anteriores
function checkForDebts() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let hasDebts = false;
    let debtCount = 0;
    let oldestDebt = null;

    // Verificar meses anteriores ao atual
    for (let year = currentYear - 2; year <= currentYear; year++) {
        const startMonth = year === currentYear ? 0 : 0;
        const endMonth = year === currentYear ? currentMonth - 1 : 11;

        for (let month = startMonth; month <= endMonth; month++) {
            const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
            const payment = appState.payments.condominio.find(p =>
                p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
            );

            if (!payment) {
                hasDebts = true;
                debtCount++;
                if (!oldestDebt || new Date(year, month) < new Date(oldestDebt.year, oldestDebt.month)) {
                    oldestDebt = { year, month };
                }
            }
        }
    }

    if (hasDebts) {
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const oldestMonthName = monthNames[oldestDebt.month];

        elements.debtMessage.textContent = `Existem ${debtCount} mÃªs${debtCount > 1 ? 'es' : ''} em aberto. O dÃ©bito mais antigo Ã© de ${oldestMonthName}/${oldestDebt.year}.`;
        elements.debtAlert.classList.remove('hidden');
    } else {
        elements.debtAlert.classList.add('hidden');
    }
}

// Renderizar grid de meses
function renderMonthsGrid() {
    elements.monthsGrid.innerHTML = '';

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    monthNames.forEach((monthName, index) => {
        const monthKey = `${appState.currentYear}-${String(index + 1).padStart(2, '0')}`;
        const payment = appState.payments.condominio.find(p =>
            p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
        );

        // Determinar status do mÃªs
        let status = 'future';
        if (appState.currentYear < currentYear ||
            (appState.currentYear === currentYear && index < currentMonth)) {
            status = payment ? 'paid' : 'overdue';
        } else if (appState.currentYear === currentYear && index === currentMonth) {
            status = payment ? 'paid' : 'pending';
        } else if (appState.currentYear === currentYear && index > currentMonth) {
            status = payment ? 'paid' : 'future';
        } else if (appState.currentYear > currentYear) {
            status = payment ? 'paid' : 'future';
        }

        const monthCard = document.createElement('div');
        monthCard.className = `month-card ${status}`;
        monthCard.style.animationDelay = `${index * 0.05}s`;

        const statusText = {
            paid: 'Pago',
            pending: 'Em Aberto',
            overdue: 'Atrasado',
            future: 'Futuro'
        };

        const value = payment ? payment.value : 285.00; // Valor padrÃ£o

        monthCard.innerHTML = `
            <div class="month-header">
                <div class="month-name">${monthName}</div>
                <div class="month-status ${status}">${statusText[status]}</div>
            </div>
            <div class="month-details">
                ${appState.currentYear}
            </div>
            <div class="month-value">
                R$ ${value.toFixed(2).replace('.', ',')}
            </div>
        `;

        monthCard.addEventListener('click', () => {
            if (status === 'paid') {
                // Se jÃ¡ estÃ¡ pago, permitir alterar valor ou remover
                showPaymentModal(monthName, appState.currentYear, index, payment);
            } else {
                // Se nÃ£o estÃ¡ pago, permitir marcar como pago
                showPaymentModal(monthName, appState.currentYear, index, null);
            }
        });

        elements.monthsGrid.appendChild(monthCard);
    });
}

// Navegar entre anos
function changeYear(direction) {
    appState.currentYear += direction;
    elements.currentYear.textContent = appState.currentYear;
    renderMonthsGrid();
}

// Mostrar modal de pagamento
async function showPaymentModal(monthName, year, monthIndex, existingPayment) {
    appState.selectedMonth = { name: monthName, year, index: monthIndex };

    // Buscar taxa vigente para o mÃªs
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    let defaultValue = 285.00;

    try {
        if (appState.selectedApartamento && appState.selectedCondominio) {
            const tax = await getCurrentTax(appState.selectedCondominio.id, monthKey + '-01');
            defaultValue = tax.value;
        }
    } catch (error) {
        console.error('Erro ao buscar taxa:', error);
    }

    elements.paymentModalTitle.textContent = existingPayment ? 'Editar Pagamento' : 'Confirmar Pagamento';
    elements.paymentMonth.textContent = `${monthName}/${year}`;
    elements.paymentValue.value = existingPayment ? existingPayment.value.toFixed(2) : defaultValue.toFixed(2);
    elements.confirmPayment.textContent = existingPayment ? 'Atualizar' : 'Confirmar Pagamento';

    elements.paymentModal.classList.remove('hidden');
    elements.paymentValue.focus();
    elements.paymentValue.select();
}

// Esconder modal de pagamento
function hidePaymentModal() {
    elements.paymentModal.classList.add('hidden');
    appState.selectedMonth = null;
}

// Confirmar pagamento do mÃªs
async function confirmMonthPayment() {
    if (!requirePermission('registerPayments')) return;

    const value = parseFloat(elements.paymentValue.value);

    if (!value || value <= 0) {
        showToast('Valor invÃ¡lido', 'error');
        return;
    }

    const monthKey = `${appState.selectedMonth.year}-${String(appState.selectedMonth.index + 1).padStart(2, '0')}`;

    try {
        // Buscar taxa vigente para o mÃªs
        const tax = await getCurrentTax(appState.selectedCondominio.id, monthKey + '-01');

        // Verificar se jÃ¡ existe pagamento
        const existingPayment = appState.payments.condominio.find(p =>
            p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
        );

        const paymentData = {
            apartamentoId: appState.selectedApartamento.id,
            date: monthKey,
            value: value,
            type: 'condominio',
            taxValue: tax.value, // Salvar valor da taxa vigente
            taxId: tax.id || null // ReferÃªncia Ã  taxa utilizada
        };

        if (existingPayment) {
            // Atualizar pagamento existente
            await updatePayment(existingPayment.id, paymentData);
            showToast('Pagamento atualizado com sucesso!', 'success');
        } else {
            // Criar novo pagamento
            await createPayment(paymentData);
            showToast('Pagamento registrado com sucesso!', 'success');
        }

        hidePaymentModal();

    } catch (error) {
        console.error('Erro ao salvar pagamento:', error);
        showToast('Erro ao salvar pagamento', 'error');
    }
}

// Quitar ano inteiro
async function payFullYear() {
    if (!requirePermission('registerPayments')) return;

    if (confirm(`Deseja quitar todos os meses de ${appState.currentYear}?`)) {
        try {
            let paymentsAdded = 0;

            for (let month = 0; month < 12; month++) {
                const monthKey = `${appState.currentYear}-${String(month + 1).padStart(2, '0')}`;

                // Verificar se jÃ¡ existe pagamento
                const existingPayment = appState.payments.condominio.find(p =>
                    p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
                );

                if (!existingPayment) {
                    // Buscar taxa vigente para o mÃªs
                    const tax = await getCurrentTax(appState.selectedCondominio.id, monthKey + '-01');

                    await createPayment({
                        apartamentoId: appState.selectedApartamento.id,
                        date: monthKey,
                        value: tax.value,
                        type: 'condominio',
                        taxValue: tax.value,
                        taxId: tax.id || null
                    });
                    paymentsAdded++;
                }
            }

            if (paymentsAdded > 0) {
                showToast(`${paymentsAdded} pagamento${paymentsAdded > 1 ? 's' : ''} registrado${paymentsAdded > 1 ? 's' : ''}!`, 'success');
            } else {
                showToast('Todos os meses jÃ¡ estÃ£o pagos!', 'warning');
            }

        } catch (error) {
            console.error('Erro ao quitar ano:', error);
            showToast('Erro ao quitar ano', 'error');
        }
    }
}

function renderCondominioPayments() {
    const payments = appState.payments.condominio.filter(p => p.apartamentoId === appState.selectedApartamento.id);
    elements.condominioPaymentsList.innerHTML = '';

    if (payments.length === 0) {
        elements.condominioPaymentsList.innerHTML = `
            <div class="payment-item empty-state">
                <div class="payment-info">
                    <div class="payment-date">Nenhum pagamento registrado</div>
                    <p>Adicione o primeiro pagamento de condomÃ­nio</p>
                </div>
            </div>
        `;
        return;
    }

    payments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(payment => {
        const paymentElement = document.createElement('div');

        // Determine payment status based on date
        const paymentDate = new Date(payment.date + '-01');
        const currentDate = new Date();
        const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');

        let status = 'paid';
        if (payment.date === currentMonth) {
            status = 'paid';
        } else if (paymentDate < new Date(currentMonth + '-01')) {
            status = 'paid';
        }

        paymentElement.className = `payment-item ${status}`;

        const date = new Date(payment.date + '-01');
        const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        paymentElement.innerHTML = `
            <div class="payment-info">
                <div class="payment-date">${monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}</div>
                <div class="payment-value">R$ ${payment.value.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="payment-actions">
                <div class="payment-status status-${status}">Pago</div>
                <button class="btn-delete" onclick="deletePaymentLocal('condominio', '${payment.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    </svg>
                    Excluir
                </button>
            </div>
        `;

        elements.condominioPaymentsList.appendChild(paymentElement);
    });
}

function renderSalaoPayments() {
    const payments = appState.payments.salao.filter(p => p.apartamentoId === appState.selectedApartamento.id);
    elements.salaoPaymentsList.innerHTML = '';

    if (payments.length === 0) {
        elements.salaoPaymentsList.innerHTML = `
            <div class="payment-item empty-state">
                <div class="payment-info">
                    <div class="payment-date">Nenhum pagamento registrado</div>
                    <p>Adicione o primeiro pagamento de salÃ£o</p>
                </div>
            </div>
        `;
        return;
    }

    payments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(payment => {
        const paymentElement = document.createElement('div');
        paymentElement.className = 'payment-item paid';

        const date = new Date(payment.date);
        const formattedDate = date.toLocaleDateString('pt-BR');

        paymentElement.innerHTML = `
            <div class="payment-info">
                <div class="payment-date">${formattedDate}</div>
                <div class="payment-value">R$ ${payment.value.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="payment-actions">
                <div class="payment-status status-paid">Pago</div>
                <button class="btn-delete" onclick="deletePaymentLocal('salao', '${payment.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    </svg>
                    Excluir
                </button>
            </div>
        `;

        elements.salaoPaymentsList.appendChild(paymentElement);
    });
}

// Gerenciamento de abas de pagamento
function switchPaymentTab(tab) {
    elements.condominioTab.classList.toggle('active', tab === 'condominio');
    elements.salaoTab.classList.toggle('active', tab === 'salao');
    elements.condominioPayments.classList.toggle('active', tab === 'condominio');
    elements.salaoPayments.classList.toggle('active', tab === 'salao');
}

// AdiÃ§Ã£o de pagamentos
function addCondominioPayment() {
    const month = elements.condominioMonth.value;
    const value = parseFloat(elements.condominioValue.value);

    if (!month || !value || value <= 0) {
        showToast('Preencha todos os campos corretamente', 'error');
        return;
    }

    // Verificar se jÃ¡ existe pagamento para este mÃªs
    const existingPayment = appState.payments.condominio.find(p =>
        p.apartamentoId === appState.selectedApartamento.id && p.date === month
    );

    if (existingPayment) {
        showToast('JÃ¡ existe um pagamento para este mÃªs', 'warning');
        return;
    }

    // Add loading state
    elements.addCondominioPayment.classList.add('loading');
    elements.addCondominioPayment.disabled = true;

    setTimeout(() => {
        const payment = {
            id: generateId(),
            apartamentoId: appState.selectedApartamento.id,
            date: month,
            value: value,
            type: 'condominio'
        };

        appState.payments.condominio.push(payment);
        saveData();

        elements.condominioMonth.value = '';
        elements.condominioValue.value = '';

        elements.addCondominioPayment.classList.remove('loading');
        elements.addCondominioPayment.disabled = false;

        renderCondominioPayments();
        showToast('Pagamento adicionado com sucesso!', 'success');
    }, 300);
}

async function addSalaoPayment() {
    const date = elements.salaoDate.value;
    const value = parseFloat(elements.salaoValue.value);

    if (!date || !value || value <= 0) {
        showToast('Preencha todos os campos corretamente', 'error');
        return;
    }

    // Add loading state
    elements.addSalaoPayment.classList.add('loading');
    elements.addSalaoPayment.disabled = true;

    try {
        const paymentData = {
            apartamentoId: appState.selectedApartamento.id,
            condominioId: appState.selectedCondominio.id,
            date: date,
            value: value,
            type: 'salao',
            registeredBy: (getCurrentProfile() ? getCurrentProfile().name : 'Sistema'),
            status: 'pago'
        };

        await createPayment(paymentData);

        elements.salaoDate.value = '';
        elements.salaoValue.value = '';

        showToast('Pagamento adicionado com sucesso!', 'success');
        // renderSalaoPayments será chamado pelo listener onSnapshot de pagamentos
    } catch (error) {
        console.error('Erro ao adicionar pagamento do salão:', error);
        showToast('Erro ao salvar pagamento', 'error');
    } finally {
        elements.addSalaoPayment.classList.remove('loading');
        elements.addSalaoPayment.disabled = false;
    }
}

// Modal functions
function showAddModal(type) {
    const titles = {
        condominio: 'Adicionar CondomÃ­nio',
        bloco: 'Adicionar Bloco',
        apartamento: 'Adicionar Apartamento'
    };

    const placeholders = {
        condominio: 'Nome do condomÃ­nio',
        bloco: 'Nome do bloco',
        apartamento: 'NÃºmero do apartamento'
    };

    elements.modalTitle.textContent = titles[type];
    elements.modalInput.placeholder = placeholders[type];
    elements.modalInput.value = '';

    elements.modalConfirm.onclick = () => {
        const value = elements.modalInput.value.trim();
        if (!value) {
            showToast('Campo obrigatÃ³rio', 'error');
            return;
        }

        if (type === 'apartamento') {
            showAddApartmentModal(value);
        } else {
            addItem(type, value);
            hideModal();
        }
    };

    elements.modal.classList.remove('hidden');
    elements.modalInput.focus();
}

function showAddApartmentModal(numero) {
    elements.modalTitle.textContent = 'ProprietÃ¡rio do Apartamento';
    elements.modalInput.placeholder = 'Nome do proprietÃ¡rio';
    elements.modalInput.value = '';

    elements.modalConfirm.onclick = () => {
        const proprietario = elements.modalInput.value.trim();
        if (!proprietario) {
            showToast('Nome do proprietÃ¡rio Ã© obrigatÃ³rio', 'error');
            return;
        }

        addApartment(numero, proprietario);
        hideModal();
    };

    elements.modalInput.focus();
}

function hideModal() {
    elements.modal.classList.add('hidden');
}

// CRUD operations
function addItem(type, name) {
    const item = {
        id: generateId(),
        nome: name
    };

    if (type === 'condominio') {
        appState.condominios.push(item);
        renderCondominios();
    } else if (type === 'bloco') {
        item.condominioId = appState.selectedCondominio.id;
        appState.blocos.push(item);
        renderBlocos();
    }

    saveData();
    showToast(`${type} adicionado com sucesso`, 'success');
}

function addApartment(numero, proprietario) {
    // Verificar se jÃ¡ existe apartamento com este nÃºmero no bloco
    const existingApartment = appState.apartamentos.find(a =>
        a.blocoId === appState.selectedBloco.id && a.numero === numero
    );

    if (existingApartment) {
        showToast('JÃ¡ existe um apartamento com este nÃºmero', 'error');
        return;
    }

    const apartment = {
        id: generateId(),
        numero: numero,
        proprietario: proprietario,
        blocoId: appState.selectedBloco.id
    };

    appState.apartamentos.push(apartment);
    saveData();
    renderApartamentos();
    showToast('Apartamento adicionado com sucesso', 'success');
}

// Delete functions
function deleteCondominio(id) {
    if (confirm('Tem certeza que deseja excluir este condomÃ­nio? Todos os dados relacionados serÃ£o perdidos.')) {
        appState.condominios = appState.condominios.filter(c => c.id !== id);
        appState.blocos = appState.blocos.filter(b => b.condominioId !== id);

        // Remove apartamentos e pagamentos relacionados
        const blocosIds = appState.blocos.filter(b => b.condominioId === id).map(b => b.id);
        appState.apartamentos = appState.apartamentos.filter(a => !blocosIds.includes(a.blocoId));

        const apartamentosIds = appState.apartamentos.filter(a => blocosIds.includes(a.blocoId)).map(a => a.id);
        appState.payments.condominio = appState.payments.condominio.filter(p => !apartamentosIds.includes(p.apartamentoId));
        appState.payments.salao = appState.payments.salao.filter(p => !apartamentosIds.includes(p.apartamentoId));

        saveData();
        renderCondominios();
        showToast('CondomÃ­nio excluÃ­do com sucesso', 'success');
    }
}

function deleteBloco(id) {
    if (confirm('Tem certeza que deseja excluir este bloco? Todos os apartamentos e pagamentos relacionados serÃ£o perdidos.')) {
        appState.blocos = appState.blocos.filter(b => b.id !== id);

        const apartamentosIds = appState.apartamentos.filter(a => a.blocoId === id).map(a => a.id);
        appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== id);
        appState.payments.condominio = appState.payments.condominio.filter(p => !apartamentosIds.includes(p.apartamentoId));
        appState.payments.salao = appState.payments.salao.filter(p => !apartamentosIds.includes(p.apartamentoId));

        saveData();
        renderBlocos();
        showToast('Bloco excluÃ­do com sucesso', 'success');
    }
}

function deleteApartamento(id) {
    if (confirm('Tem certeza que deseja excluir este apartamento? Todos os pagamentos relacionados serÃ£o perdidos.')) {
        appState.apartamentos = appState.apartamentos.filter(a => a.id !== id);
        appState.payments.condominio = appState.payments.condominio.filter(p => p.apartamentoId !== id);
        appState.payments.salao = appState.payments.salao.filter(p => p.apartamentoId !== id);

        saveData();
        renderApartamentos();
        showToast('Apartamento excluÃ­do com sucesso', 'success');
    }
}

function deletePaymentLocal(type, id) {
    if (confirm('Tem certeza que deseja excluir este pagamento?')) {
        appState.payments[type] = appState.payments[type].filter(p => p.id !== id);
        saveData();

        if (type === 'condominio') {
            renderCondominioPayments();
        } else {
            renderSalaoPayments();
        }

        showToast('Pagamento excluÃ­do com sucesso', 'success');
    }
}

// Tornar deletePaymentLocal acessível globalmente
window.deletePaymentLocal = deletePaymentLocal;

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// PWA Service Worker Registration
let deferredPrompt;
let swRegistration;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            swRegistration = await navigator.serviceWorker.register('sw.js');
            console.log('[PWA] SW registered: ', swRegistration);

            // Check for updates
            swRegistration.addEventListener('updatefound', () => {
                const newWorker = swRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateAvailable();
                    }
                });
            });

        } catch (registrationError) {
            console.log('[PWA] SW registration failed: ', registrationError);
        }
    });
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] Install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
});

// App installed
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    hideInstallBanner();
    showToast('App instalado com sucesso!', 'success');
    deferredPrompt = null;
});

function showInstallBanner() {
    const banner = document.getElementById('installBanner');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissInstall');

    if (banner && !isStandalone()) {
        banner.classList.remove('hidden');

        installBtn.addEventListener('click', installApp);
        dismissBtn.addEventListener('click', hideInstallBanner);
    }
}

function hideInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User choice:', outcome);

        if (outcome === 'accepted') {
            hideInstallBanner();
        }

        deferredPrompt = null;
    }
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

function showUpdateAvailable() {
    if (confirm('Nova versÃ£o disponÃ­vel! Deseja atualizar?')) {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

// Handle offline/online status
window.addEventListener('online', () => {
    showToast('ConexÃ£o restaurada', 'success');
    syncOfflineData();
});

window.addEventListener('offline', () => {
    showToast('Modo offline ativado', 'warning');
});

function syncOfflineData() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
            return registration.sync.register('sync-data');
        }).catch(err => {
            console.log('[PWA] Background sync registration failed:', err);
        });
    }
}

// Performance optimizations
function preloadCriticalResources() {
    // Preload next likely screens
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'condominio-data.js';
    document.head.appendChild(link);
}

// Initialize PWA features
function initializePWA() {
    // Check if running as PWA
    if (isStandalone()) {
        document.body.classList.add('pwa-mode');
        console.log('[PWA] Running in standalone mode');
    }

    // Handle shortcuts
    const urlParams = new URLSearchParams(window.location.search);
    const shortcut = urlParams.get('shortcut');

    if (shortcut === 'payments') {
        // Navigate to payments when app loads
        setTimeout(() => {
            if (appState.condominios.length > 0) {
                // Auto-navigate to first available apartment payments
                const firstCondominio = appState.condominios[0];
                const firstBloco = appState.blocos.find(b => b.condominioId === firstCondominio.id);
                const firstApartamento = appState.apartamentos.find(a => a.blocoId === (firstBloco ? firstBloco.id : null));

                if (firstApartamento) {
                    appState.selectedCondominio = firstCondominio;
                    appState.selectedBloco = firstBloco;
                    appState.selectedApartamento = firstApartamento;
                    showScreen('pagamentos');
                    renderPagamentos();
                }
            }
        }, 2000);
    }

    if (shortcut === 'salao') {
        // Navigate to salao when app loads
        setTimeout(() => {
            if (appState.condominios.length > 0) {
                const firstCondominio = appState.condominios[0];
                const firstBloco = appState.blocos.find(b => b.condominioId === firstCondominio.id);

                if (firstBloco) {
                    appState.selectedCondominio = firstCondominio;
                    appState.selectedBloco = firstBloco;
                    showScreen('salao');
                    renderSalao();
                }
            }
        }, 2000);
    }

    // Preload resources
    preloadCriticalResources();
}
// MÃ³dulo de SalÃ£o de Festas
function openSalao() {
    if (!requirePermission('manageSalao')) return;

    if (!appState.selectedCondominio) {
        showToast('Erro: Nenhum condomínio selecionado', 'error');
        return;
    }

    // Limpar listeners antigos do salão se existirem
    if (appState.unsubscribeSalao) {
        appState.unsubscribeSalao();
        appState.unsubscribeSalao = null;
    }

    // Ativar listener em tempo real para reservas do salão
    appState.unsubscribeSalao = subscribeToSalaoReservations(appState.selectedCondominio.id, (reservations) => {
        appState.salaoReservations = reservations;
        renderCalendar();
    });

    // Registrar para limpeza global ao fazer logout
    appState.unsubscribeFunctions.push(appState.unsubscribeSalao);

    showScreen('salao');
    renderSalao();
}

function renderSalao() {
    elements.salaoCondominio.textContent = appState.selectedCondominio.nome;
    updateCalendarHeader();
    renderCalendar();

    // Carregar apartamentos de forma assíncrona
    elements.apartmentSelect.innerHTML = '<option value="">Selecione o apartamento</option>';
    populateApartmentSelect();
}

function updateCalendarHeader() {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    elements.calendarMonth.textContent = monthNames[appState.salaoCurrentMonth];
    elements.calendarYear.textContent = appState.salaoCurrentYear;
}

function changeSalaoMonth(direction) {
    appState.salaoCurrentMonth += direction;

    if (appState.salaoCurrentMonth > 11) {
        appState.salaoCurrentMonth = 0;
        appState.salaoCurrentYear++;
    } else if (appState.salaoCurrentMonth < 0) {
        appState.salaoCurrentMonth = 11;
        appState.salaoCurrentYear--;
    }

    updateCalendarHeader();
    renderCalendar();
}

function renderCalendar() {
    elements.calendarGrid.innerHTML = '';

    const firstDay = new Date(appState.salaoCurrentYear, appState.salaoCurrentMonth, 1);
    const lastDay = new Date(appState.salaoCurrentYear, appState.salaoCurrentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        const isCurrentMonth = currentDate.getMonth() === appState.salaoCurrentMonth;
        const isToday = currentDate.getTime() === today.getTime();
        const isPast = currentDate < today;

        if (!isCurrentMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        // Verificar se hÃ¡ reserva para esta data
        const dateString = currentDate.toISOString().split('T')[0];
        const reservation = appState.salaoReservations.find(r =>
            r.date === dateString && r.condominioId === appState.selectedCondominio.id
        );

        let status = 'available';
        let reservationInfo = '';

        if (reservation) {
            status = reservation.status;
            const apartment = appState.apartamentos.find(a => a.id === reservation.apartamentoId);
            if (apartment) {
                const tipoUnidade = apartment.tipo === 'casa' ? 'Casa' : 'Apt';
                reservationInfo = `${tipoUnidade} ${apartment.numero}`;
            }
        }

        dayElement.innerHTML = `
            <div class="day-number">${currentDate.getDate()}</div>
            ${reservationInfo ? `<div class="reservation-info">${reservationInfo}</div>` : ''}
            <div class="day-status ${status}"></div>
        `;

        // CORRIGIDO v130: Permitir editar reservas de dias passados
        // Bloquear apenas dias passados SEM reserva
        const canClick = isCurrentMonth && (!isPast || reservation);
        
        if (canClick) {
            dayElement.addEventListener('click', () => {
                showReservationModal(currentDate, reservation);
            });
            dayElement.style.cursor = 'pointer';
        } else if (isPast && !reservation) {
            // Dia passado sem reserva - bloquear
            dayElement.style.opacity = '0.5';
            dayElement.style.cursor = 'not-allowed';
        }

        elements.calendarGrid.appendChild(dayElement);
    }
}

async function populateApartmentSelect() {
    elements.apartmentSelect.innerHTML = '<option value="">Selecione o apartamento</option>';

    if (!appState.selectedCondominio) {
        console.warn('Nenhum condomínio selecionado para popular apartamentos');
        return;
    }

    try {
        // Buscar todos os blocos do condomínio
        const blocos = await getBlocosByCondominio(appState.selectedCondominio.id);

        // Buscar apartamentos de todos os blocos
        let todosApartamentos = [];
        for (const bloco of blocos) {
            const apartamentosBloco = await getApartamentosByBloco(bloco.id);
            // Adicionar nome do bloco aos apartamentos
            apartamentosBloco.forEach(apt => {
                apt.blocoNome = bloco.nome;
            });
            todosApartamentos = todosApartamentos.concat(apartamentosBloco);
        }

        // Ordenar por bloco e depois por número
        todosApartamentos.sort((a, b) => {
            if (a.blocoNome !== b.blocoNome) {
                return a.blocoNome.localeCompare(b.blocoNome);
            }
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numA - numB;
        });

        // Agrupar por bloco para melhor visualização
        let currentBloco = '';
        todosApartamentos.forEach(apartment => {
            // Adicionar separador de bloco
            if (apartment.blocoNome !== currentBloco) {
                currentBloco = apartment.blocoNome;
                const optgroup = document.createElement('optgroup');
                optgroup.label = `${currentBloco}`;
                elements.apartmentSelect.appendChild(optgroup);
            }

            const option = document.createElement('option');
            option.value = apartment.id;
            const tipoUnidade = apartment.tipo === 'casa' ? 'Casa' : 'Apt';
            option.textContent = `${tipoUnidade} ${apartment.numero} - ${apartment.proprietario}`;

            // Adicionar ao último optgroup
            const lastOptgroup = elements.apartmentSelect.lastElementChild;
            if (lastOptgroup && lastOptgroup.tagName === 'OPTGROUP') {
                lastOptgroup.appendChild(option);
            } else {
                elements.apartmentSelect.appendChild(option);
            }
        });

        console.log(`✅ ${todosApartamentos.length} apartamentos carregados no select`);

    } catch (error) {
        console.error('Erro ao carregar apartamentos para select:', error);
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Erro ao carregar apartamentos';
        option.disabled = true;
        elements.apartmentSelect.appendChild(option);
    }
}

function showReservationModal(date, existingReservation) {
    appState.selectedDate = date;

    const dateString = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    elements.reservationModalTitle.textContent = existingReservation ? 'Editar Reserva' : 'Nova Reserva';
    elements.reservationDate.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);

    if (existingReservation) {
        elements.apartmentSelect.value = existingReservation.apartamentoId;
        elements.reservationValue.value = existingReservation.value.toFixed(2);

        // Selecionar status
        const statusRadio = document.querySelector(`input[name="reservationStatus"][value="${existingReservation.status}"]`);
        if (statusRadio) {
            statusRadio.checked = true;
        }

        elements.deleteReservation.classList.remove('hidden');
        elements.confirmReservation.textContent = 'Atualizar';
    } else {
        elements.apartmentSelect.value = '';
        elements.reservationValue.value = '150.00';

        // Selecionar "reservado" por padrÃ£o
        const reservedRadio = document.querySelector('input[name="reservationStatus"][value="reserved"]');
        if (reservedRadio) {
            reservedRadio.checked = true;
        }

        elements.deleteReservation.classList.add('hidden');
        elements.confirmReservation.textContent = 'Confirmar';
    }

    elements.reservationModal.classList.remove('hidden');
    elements.apartmentSelect.focus();
}

function hideReservationModal() {
    elements.reservationModal.classList.add('hidden');
    appState.selectedDate = null;
}

async function confirmReservation() {
    const apartmentId = elements.apartmentSelect.value;
    const value = parseFloat(elements.reservationValue.value);
    const status = document.querySelector('input[name="reservationStatus"]:checked').value;

    if (!apartmentId) {
        showToast('Selecione o apartamento responsável', 'error');
        return;
    }

    if (!value || value <= 0) {
        showToast('Valor inválido', 'error');
        return;
    }

    // Add loading state
    elements.confirmReservation.classList.add('loading');
    elements.confirmReservation.disabled = true;

    try {
        const dateString = appState.selectedDate.toISOString().split('T')[0];

        // Verificar se já existe reserva localmente para decidir se é update ou create
        const existingReservation = appState.salaoReservations.find(r =>
            r.date === dateString && r.condominioId === appState.selectedCondominio.id
        );

        const reservationData = {
            date: dateString,
            apartamentoId: apartmentId,
            condominioId: appState.selectedCondominio.id,
            value: value,
            status: status
        };

        if (existingReservation) {
            // Atualizar reserva existente no Firestore
            await updateSalaoReservation(existingReservation.id, reservationData);
            showToast('Reserva atualizada com sucesso!', 'success');
        } else {
            // Criar nova reserva no Firestore
            await createSalaoReservation(reservationData);
            showToast('Reserva criada com sucesso!', 'success');
        }

        // Se o status for "pago", também adicionar aos pagamentos do edifício
        if (status === 'paid') {
            const paymentData = {
                apartamentoId: apartmentId,
                condominioId: appState.selectedCondominio.id,
                date: dateString,
                value: value,
                type: 'salao',
                registeredBy: (getCurrentProfile() ? getCurrentProfile().name : 'Sistema'),
                status: 'pago'
            };

            // Verificar se já existe pagamento para evitar duplicatas (estratégia simples)
            // No Firestore idealmente faríamos uma busca antes, mas como o Salão 
            // é controlado, o risco é menor. O listener de pagamentos cuidará da UI.
            await createPayment(paymentData);
            showToast('Pagamento do salão registrado!', 'success');
        }

        hideReservationModal();
        // renderCalendar será chamado automaticamente pelo listener onSnapshot
    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        showToast('Erro ao salvar reserva', 'error');
    } finally {
        elements.confirmReservation.classList.remove('loading');
        elements.confirmReservation.disabled = false;
    }
}

async function deleteReservation() {
    if (confirm('Tem certeza que deseja excluir esta reserva?')) {
        const dateString = appState.selectedDate.toISOString().split('T')[0];

        // Buscar a reserva localmente para obter o ID do Firestore
        const reservation = appState.salaoReservations.find(r =>
            r.date === dateString && r.condominioId === appState.selectedCondominio.id
        );

        if (reservation) {
            try {
                elements.deleteReservation.disabled = true;
                await deleteSalaoReservation(reservation.id);
                showToast('Reserva excluída com sucesso!', 'success');
                hideReservationModal();
                // renderCalendar será chamado pelo listener
            } catch (error) {
                console.error('Erro ao excluir reserva:', error);
                showToast('Erro ao excluir reserva', 'error');
            } finally {
                elements.deleteReservation.disabled = false;
            }
        }
    }
}
// MÃ³dulo do Painel Geral
let currentFilters = {
    ano: new Date().getFullYear().toString(),
    condominio: '',
    bloco: '',
    mes: ''
};

let currentStatusEdit = null;

// CORRECAO v86: Função centralizada para calcular valor de pagamento
function calculatePaymentValue(status, payment = null) {
    // Se há pagamento com valor explícito, usar esse valor
    if (payment && payment.value) {
        return payment.value;
    }
    
    // Caso contrário, usar valores padrão por status
    const defaultValues = {
        pago: 80.00,
        reciclado: 40.00,
        pendente: 80.00,  // Pendente tem valor potencial
        acordo: 0.00
    };
    
    return defaultValues[status] || 0.00;
}

// Cache simples para não recarregar sempre (Painel Geral)
// Sistema de retry para operações de rede
const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    BACKOFF_MULTIPLIER: 2
};

async function withRetry(operation, context = 'operação') {
    let lastError;

    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            // CORRECAO v81: Tratamento específico para erros 400/404
            const isClientError = error.code === 'permission-denied' || 
                                 error.code === 'not-found' ||
                                 error.message?.includes('404') ||
                                 error.message?.includes('400');
            
            if (isClientError) {
                console.warn(`⚠️ Erro de cliente (400/404) em ${context}:`, error.message);
                // Não fazer retry em erros de cliente (dados não existem ou sem permissão)
                throw error;
            }
            
            console.warn(`❌ Tentativa ${attempt}/${RETRY_CONFIG.MAX_RETRIES} falhou para ${context}:`, error.message);

            if (attempt < RETRY_CONFIG.MAX_RETRIES) {
                const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
                console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Todas as tentativas falharam para ${context}:`, lastError);
    throw lastError;
}

// Cache e controle de carregamento do painel
const painelCache = {
    condominios: new Map(),
    blocos: new Map(),
    apartamentos: new Map(),
    lastUpdate: new Map(),
    isLoading: new Set()
};

// Configurações de performance
const PAINEL_CONFIG = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    BATCH_SIZE: 10, // Carregar apartamentos em lotes
    MAX_CONCURRENT: 3, // Máximo de requests simultâneos
    DEBOUNCE_DELAY: 300, // Delay para filtros
    LOAD_TIMEOUT: 60000 // Timeout de 60 segundos para carregamento total
};

// Debounce para filtros
let filterDebounceTimer = null;

async function ensurePainelApartamentosLoaded(condominioId = '') {
    console.log('🔄 Carregando dados do painel...', condominioId || 'todos');
    console.log('📊 Estado atual:', {
        condominios: appState.condominios.length,
        blocos: appState.blocos.length,
        apartamentos: appState.apartamentos.length
    });

    // Iniciar monitoramento
    performanceMonitor.start('painelDataLoad');

    // CORRECAO v80: Adicionar timeout para evitar travamento
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Carregamento demorou mais de 60 segundos')), PAINEL_CONFIG.LOAD_TIMEOUT);
    });

    try {
        // Mostrar loading
        showPainelLoading(true);

        const condominiosToLoad = condominioId
            ? appState.condominios.filter(c => c.id === condominioId)
            : appState.condominios;

        if (condominiosToLoad.length === 0) {
            console.warn('⚠️ Nenhum condomínio para carregar');
            showToast('Nenhum condomínio disponível', 'warning');
            return;
        }

        console.log(`📦 Carregando ${condominiosToLoad.length} condomínio(s)...`);

        // Carregar em paralelo com limite de concorrência
        const loadPromises = [];
        const semaphore = new Array(PAINEL_CONFIG.MAX_CONCURRENT).fill(null);

        for (const cond of condominiosToLoad) {
            if (!cond || !cond.id) continue;

            // Verificar cache
            const cacheKey = cond.id;
            const lastUpdate = painelCache.lastUpdate.get(cacheKey);
            const now = Date.now();

            if (lastUpdate && (now - lastUpdate) < PAINEL_CONFIG.CACHE_DURATION) {
                console.log(`✅ Cache válido para ${cond.nome}`);
                continue;
            }

            if (painelCache.isLoading.has(cacheKey)) {
                console.log(`⏳ Já carregando ${cond.nome}`);
                continue;
            }

            // Aguardar slot disponível
            const slotIndex = await waitForSlot(semaphore);

            const loadPromise = loadCondominioData(cond, slotIndex, semaphore);
            loadPromises.push(loadPromise);
        }

        // Aguardar todos os carregamentos COM TIMEOUT
        if (loadPromises.length > 0) {
            await Promise.race([
                Promise.allSettled(loadPromises),
                timeoutPromise
            ]);
            console.log('✅ Carregamento do painel concluído');
        }

        // Finalizar monitoramento
        const metrics = performanceMonitor.end('painelDataLoad');
        if (metrics) {
            console.log(`📊 Performance: ${metrics.duration}ms, Memória: +${Math.round(metrics.memoryDelta / 1024)}KB`);
        }

    } catch (error) {
        console.error('❌ Erro no carregamento do painel:', error);
        
        // CORRECAO v80: Mensagem específica para timeout
        if (error.message && error.message.includes('Timeout')) {
            showToast('Carregamento demorou muito. Tente recarregar ou use filtros.', 'warning');
        } else {
            showToast('Erro ao carregar dados do painel', 'error');
        }
        
        performanceMonitor.end('painelDataLoad'); // Limpar métrica em caso de erro
    } finally {
        showPainelLoading(false);
    }
}

async function waitForSlot(semaphore) {
    return new Promise((resolve) => {
        const checkSlot = () => {
            const freeIndex = semaphore.findIndex(slot => slot === null);
            if (freeIndex !== -1) {
                semaphore[freeIndex] = true;
                resolve(freeIndex);
            } else {
                setTimeout(checkSlot, 50);
            }
        };
        checkSlot();
    });
}

async function loadCondominioData(condominio, slotIndex, semaphore) {
    const cacheKey = condominio.id;

    try {
        painelCache.isLoading.add(cacheKey);
        console.log(`🏗️ Carregando ${condominio.nome}...`);

        // Atualizar progresso
        updateLoadingProgress(`Carregando ${condominio.nome}...`);

        // 1. Carregar blocos
        let blocos = painelCache.blocos.get(cacheKey);
        if (!blocos) {
            blocos = await withRetry(
                () => getBlocosByCondominio(condominio.id),
                `blocos de ${condominio.nome}`
            );
            painelCache.blocos.set(cacheKey, blocos);

            // Atualizar appState
            blocos.forEach(bloco => {
                const existingIndex = appState.blocos.findIndex(b => b.id === bloco.id);
                if (existingIndex >= 0) {
                    appState.blocos[existingIndex] = bloco;
                } else {
                    appState.blocos.push(bloco);
                }
            });
        }

        console.log(`📋 ${condominio.nome}: ${blocos.length} blocos encontrados`);
        
        // CORRECAO v91: Carregar CASAS do condomínio
        let casas = painelCache.casas ? painelCache.casas.get(cacheKey) : null;
        if (!casas) {
            casas = await withRetry(
                () => getCasasByCondominio(condominio.id),
                `casas de ${condominio.nome}`
            );
            
            if (!painelCache.casas) {
                painelCache.casas = new Map();
            }
            painelCache.casas.set(cacheKey, casas);

            // Atualizar appState
            casas.forEach(casa => {
                const existingIndex = appState.casas.findIndex(c => c.id === casa.id);
                if (existingIndex >= 0) {
                    appState.casas[existingIndex] = casa;
                } else {
                    appState.casas.push(casa);
                }
            });
        }
        
        console.log(`🏠 ${condominio.nome}: ${casas.length} casas encontradas`);

        // 2. Carregar apartamentos em lotes com progresso
        const apartamentosPromises = [];
        for (let i = 0; i < blocos.length; i++) {
            const bloco = blocos[i];
            updateLoadingProgress(`${condominio.nome}: Carregando ${bloco.nome} (${i + 1}/${blocos.length})`);
            apartamentosPromises.push(loadBlocoApartamentos(bloco, cacheKey));
        }

        const results = await Promise.allSettled(apartamentosPromises);

        // Contar sucessos e falhas
        const sucessos = results.filter(r => r.status === 'fulfilled').length;
        const falhas = results.filter(r => r.status === 'rejected').length;

        if (falhas > 0) {
            console.warn(`⚠️ ${condominio.nome}: ${sucessos} blocos carregados, ${falhas} falharam`);
        }

        // Marcar como carregado
        painelCache.lastUpdate.set(cacheKey, Date.now());
        console.log(`✅ ${condominio.nome} carregado com sucesso (${sucessos}/${blocos.length} blocos)`);

    } catch (error) {
        console.error(`❌ Erro ao carregar ${condominio.nome}:`, error);
        showToast(`Erro ao carregar ${condominio.nome}`, 'error');
    } finally {
        painelCache.isLoading.delete(cacheKey);
        semaphore[slotIndex] = null;
    }
}

function updateLoadingProgress(message) {
    const loadingElement = document.getElementById('painelLoading');
    if (loadingElement) {
        const textElement = loadingElement.querySelector('.loading-text');
        if (textElement) {
            textElement.textContent = message;
        }
    }
}

async function loadBlocoApartamentos(bloco, condominioId) {
    try {
        const apartamentos = await withRetry(
            () => getApartamentosByBloco(bloco.id),
            `apartamentos do ${bloco.nome}`
        );

        // Cache dos apartamentos
        const blocoKey = `${condominioId}-${bloco.id}`;
        painelCache.apartamentos.set(blocoKey, apartamentos);

        // Atualizar appState em lotes
        apartamentos.forEach(apartamento => {
            const apt = {
                ...apartamento,
                condominioId: apartamento.condominioId || condominioId,
                blocoId: apartamento.blocoId || bloco.id
            };

            const existingIndex = appState.apartamentos.findIndex(a => a.id === apt.id);
            if (existingIndex >= 0) {
                appState.apartamentos[existingIndex] = { ...appState.apartamentos[existingIndex], ...apt };
            } else {
                appState.apartamentos.push(apt);
            }
        });

        console.log(`✅ ${bloco.nome}: ${apartamentos.length} apartamentos carregados`);

        // CORRECAO v80: Carregar apenas pagamentos do período ativo (otimização)
        if (apartamentos.length > 0 && appState.activeYear && appState.activeMonth) {
            try {
                const date = `${appState.activeYear}-${appState.activeMonth}`;
                
                // Buscar pagamentos do bloco para o período ativo (1 requisição em vez de N)
                const payments = await getPaymentsByBlocoAndPeriod(bloco.id, date);
                
                // Mesclar pagamentos sem duplicar
                payments.forEach(payment => {
                    const existingIndex = appState.payments.condominio.findIndex(p => 
                        p.apartamentoId === payment.apartamentoId && p.date === payment.date
                    );
                    if (existingIndex >= 0) {
                        appState.payments.condominio[existingIndex] = payment;
                    } else {
                        appState.payments.condominio.push(payment);
                    }
                });
                
                console.log(`💰 ${bloco.nome}: ${payments.length} pagamentos carregados para ${date}`);
            } catch (paymentError) {
                // CORRECAO v81: Não travar se pagamentos não existirem (404)
                if (paymentError.code === 'not-found' || paymentError.message?.includes('404')) {
                    console.log(`ℹ️ ${bloco.nome}: Sem pagamentos para ${appState.activeYear}-${appState.activeMonth} (normal)`);
                } else {
                    console.warn(`⚠️ Erro ao carregar pagamentos do ${bloco.nome}:`, paymentError);
                }
            }
        }

    } catch (error) {
        // CORRECAO v81: Tratamento específico para erros 404 (bloco sem apartamentos)
        if (error.code === 'not-found' || error.message?.includes('404')) {
            console.log(`ℹ️ ${bloco.nome}: Sem apartamentos cadastrados (normal)`);
        } else {
            console.error(`❌ Erro definitivo ao carregar apartamentos do ${bloco.nome}:`, error);
            // Não mostrar toast para cada bloco com erro (evita spam)
            // showToast(`Erro ao carregar ${bloco.nome}. Alguns dados podem estar incompletos.`, 'warning');
        }
    }
}

// Sistema de notificações melhorado
const notificationQueue = [];
let isShowingNotification = false;

function showToast(message, type = 'info', duration = 4000) {
    // Adicionar à fila se já estiver mostrando uma notificação
    if (isShowingNotification) {
        notificationQueue.push({ message, type, duration });
        return;
    }

    displayToast(message, type, duration);
}

function displayToast(message, type, duration) {
    isShowingNotification = true;

    // Remover toast existente se houver
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Ícones por tipo
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="closeToast(this)">×</button>
        </div>
        <div class="toast-progress"></div>
    `;

    // Adicionar ao DOM
    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('toast-show'), 100);

    // Animar barra de progresso
    const progressBar = toast.querySelector('.toast-progress');
    progressBar.style.animation = `toast-progress ${duration}ms linear`;

    // Auto-remover
    setTimeout(() => {
        closeToast(toast);
    }, duration);
}

function closeToast(element) {
    const toast = element.closest ? element.closest('.toast') : element;

    if (toast) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            toast.remove();
            isShowingNotification = false;

            // Mostrar próxima notificação da fila
            if (notificationQueue.length > 0) {
                const next = notificationQueue.shift();
                displayToast(next.message, next.type, next.duration);
            }
        }, 300);
    }
}

// Tornar closeToast acessível globalmente para uso em onclick
window.closeToast = closeToast;

// Função para mostrar progresso de carregamento
function showLoadingToast(message) {
    const loadingToast = document.createElement('div');
    loadingToast.className = 'toast toast-loading';
    loadingToast.id = 'loadingToast';

    loadingToast.innerHTML = `
        <div class="toast-content">
            <div class="loading-spinner-small"></div>
            <span class="toast-message">${message}</span>
        </div>
    `;

    document.body.appendChild(loadingToast);
    setTimeout(() => loadingToast.classList.add('toast-show'), 100);

    return loadingToast;
}

// Sistema de monitoramento de performance
const performanceMonitor = {
    metrics: new Map(),

    start(operation) {
        this.metrics.set(operation, {
            startTime: performance.now(),
            startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
        });
        console.log(`🚀 Iniciando: ${operation}`);
    },

    end(operation) {
        const metric = this.metrics.get(operation);
        if (!metric) return null;

        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

        const result = {
            operation,
            duration: Math.round(endTime - metric.startTime),
            memoryDelta: endMemory - metric.startMemory,
            timestamp: new Date().toISOString()
        };

        // Log performance crítica
        if (result.duration > 2000) {
            console.warn(`⚠️ Operação lenta detectada: ${operation} (${result.duration}ms)`);
        } else {
            console.log(`✅ ${operation} concluído em ${result.duration}ms`);
        }

        if (result.memoryDelta > 10 * 1024 * 1024) { // 10MB
            console.warn(`⚠️ Alto uso de memória detectado: ${operation} (+${Math.round(result.memoryDelta / 1024 / 1024)}MB)`);
        }

        this.metrics.delete(operation);
        return result;
    },

    getStats() {
        if (!performance.memory) return null;

        return {
            usedMemory: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            totalMemory: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            memoryLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
    }
};

function hideLoadingToast() {
    const loadingToast = document.getElementById('loadingToast');
    if (loadingToast) {
        loadingToast.classList.add('toast-hide');
        setTimeout(() => loadingToast.remove(), 300);
    }
}

function showPainelLoading(show) {
    const loadingElement = document.getElementById('painelLoading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }

    // Desabilitar filtros durante carregamento
    const filterElements = [
        elements.filterAno,
        elements.filterCondominio,
        elements.filterBloco,
        elements.filterMes,
        elements.clearFilters
    ];

    filterElements.forEach(element => {
        if (element) {
            element.disabled = show;
        }
    });
}

async function openPainel() {
    console.log('🔍 Verificando permissões para painel geral...');
    console.log('👤 Usuário atual:', appState.userProfile);
    console.log('🔑 Permissão generateReports:', hasPermission('generateReports'));

    if (!requirePermission('generateReports')) return;

    console.log('🏠 Abrindo painel geral...');

    // Verificar se há condomínios carregados
    if (!appState.condominios || appState.condominios.length === 0) {
        console.warn('⚠️ Nenhum condomínio carregado');
        showToast('Nenhum condomínio encontrado. Carregue os dados primeiro.', 'warning');
        return;
    }

    console.log(`📊 ${appState.condominios.length} condomínio(s) disponível(is)`);
    showScreen('painel');
    showPainelLoading(true);

    // Carregamento assíncrono para não bloquear a UI
    setTimeout(async () => {
        try {
            await ensurePainelApartamentosLoaded('');
            renderPainel();
        } catch (error) {
            console.error('❌ Erro ao carregar painel:', error);
            showToast('Erro ao carregar painel geral', 'error');
        } finally {
            showPainelLoading(false);
        }
    }, 100);
}

function renderPainel() {
    console.log('🎨 Renderizando painel...');
    populateFilters();
    applyFiltersDebounced();
}

function populateFilters() {
    try {
        // Popular filtro de anos
        populateYearFilter();

        // CORRECAO v105: Adicionar opção padrão "Selecione um condomínio"
        elements.filterCondominio.innerHTML = '';
        
        // Adicionar opção padrão
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecione um condomínio';
        defaultOption.selected = true;
        elements.filterCondominio.appendChild(defaultOption);
        
        if (appState.condominios.length > 0) {
            appState.condominios.forEach((cond) => {
                const option = document.createElement('option');
                option.value = cond.id;
                option.textContent = cond.nome;
                elements.filterCondominio.appendChild(option);
            });
            
            // CORRECAO v105: Popular blocos sem selecionar nenhum
            populateBlocoFilter('', false);
        }

        // CORRECAO v105: Popular filtro de meses sem selecionar nenhum
        populateMonthFilter(false);

    } catch (error) {
        console.error('❌ Erro ao popular filtros:', error);
    }
}

function populateYearFilter() {
    if (!elements.filterAno) return;

    // CORRECAO v105: Adicionar opção padrão "Selecione um ano"
    elements.filterAno.innerHTML = '';
    
    // Adicionar opção padrão
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um ano';
    defaultOption.selected = true;
    elements.filterAno.appendChild(defaultOption);

    // Gerar anos de 2024 até 2040 (padronizado)
    const startYear = 2024;
    const endYear = 2040;
    
    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year;
        elements.filterAno.appendChild(option);
    }
}

function populateBlocoFilter(condominioId = '', selectFirst = false) {
    // CORRECAO v105: Adicionar opção padrão "Selecione um bloco"
    elements.filterBloco.innerHTML = '';
    
    // Adicionar opção padrão
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecione um bloco';
    defaultOption.selected = true;
    elements.filterBloco.appendChild(defaultOption);
    
    console.log(`🔍 [FILTRO] ========== POPULATE BLOCO FILTER ==========`);
    console.log(`🔍 [FILTRO] condominioId: ${condominioId}`);
    console.log(`🔍 [FILTRO] Total casas no appState: ${appState.casas ? appState.casas.length : 0}`);
    
    if (appState.casas && appState.casas.length > 0) {
        console.log(`🔍 [FILTRO] Primeiras 3 casas:`, appState.casas.slice(0, 3).map(c => ({
            id: c.id,
            numero: c.numero,
            condominioId: c.condominioId
        })));
    }

    const blocos = condominioId
        ? appState.blocos.filter(b => b.condominioId === condominioId)
        : appState.blocos;

    console.log(`🔍 [FILTRO] Blocos filtrados: ${blocos.length}`);

    // Ordenar blocos por nome
    blocos.sort((a, b) => a.nome.localeCompare(b.nome));

    blocos.forEach((bloco) => {
        const option = document.createElement('option');
        option.value = bloco.id;

        if (condominioId) {
            option.textContent = bloco.nome;
        } else {
            const condominio = appState.condominios.find(c => c.id === bloco.condominioId);
            option.textContent = bloco.nome + ' (' + (condominio ? condominio.nome : 'N/A') + ')';
        }

        elements.filterBloco.appendChild(option);
    });
    
    // CORRECAO v93: Adicionar CASAS ao filtro individualmente
    if (condominioId) {
        console.log(`🔍 [FILTRO] Filtrando casas do condomínio ${condominioId}...`);
        const casasDoCondominio = appState.casas ? appState.casas.filter(c => c.condominioId === condominioId) : [];
        console.log(`🔍 [FILTRO] Casas encontradas: ${casasDoCondominio.length}`);
        
        if (casasDoCondominio.length > 0) {
            console.log(`🔍 [FILTRO] Casas do condomínio:`, casasDoCondominio.map(c => ({
                id: c.id,
                numero: c.numero
            })));
            
            // Ordenar casas por número
            casasDoCondominio.sort((a, b) => {
                const numA = parseInt(a.numero) || 0;
                const numB = parseInt(b.numero) || 0;
                return numA - numB;
            });
            
            // Adicionar cada casa individualmente
            casasDoCondominio.forEach(casa => {
                const casaOption = document.createElement('option');
                casaOption.value = `CASA-${casa.id}`;
                casaOption.textContent = `Casa ${casa.numero}`;
                elements.filterBloco.appendChild(casaOption);
                console.log(`✅ [FILTRO] Adicionada: Casa ${casa.numero} (${casa.id})`);
            });
            
            console.log(`✅ [FILTRO] Total adicionadas: ${casasDoCondominio.length} casas`);
        } else {
            console.log(`⚠️ [FILTRO] Nenhuma casa encontrada para este condomínio`);
        }
    }
    
    console.log(`🔍 [FILTRO] ========== FIM POPULATE ==========`);
}

function populateMonthFilter(selectJaneiro = false) {
    // CORRECAO v87: Remover opção "Todos os meses"
    elements.filterMes.innerHTML = '';

    const meses = [
        { id: '01', nome: 'Janeiro' },
        { id: '02', nome: 'Fevereiro' },
        { id: '03', nome: 'Março' },
        { id: '04', nome: 'Abril' },
        { id: '05', nome: 'Maio' },
        { id: '06', nome: 'Junho' },
        { id: '07', nome: 'Julho' },
        { id: '08', nome: 'Agosto' },
        { id: '09', nome: 'Setembro' },
        { id: '10', nome: 'Outubro' },
        { id: '11', nome: 'Novembro' },
        { id: '12', nome: 'Dezembro' }
    ];

    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = mes.id;
        option.textContent = mes.nome;
        
        // CORRECAO v87: Selecionar Janeiro por padrão
        if (selectJaneiro && index === 0) {
            option.selected = true;
            currentFilters.mes = mes.id;
        }
        
        elements.filterMes.appendChild(option);
    });
}

function updateBlocoFilter() {
    const condominioId = elements.filterCondominio.value;
    
    // CORRECAO v94: Salvar seleção atual antes de repopular
    const currentSelection = elements.filterBloco.value;
    
    // CORRECAO v87: Não selecionar primeiro bloco automaticamente ao trocar condomínio
    populateBlocoFilter(condominioId, false);

    // CORRECAO v94: Restaurar seleção se ainda existir (ex: casa selecionada)
    if (currentSelection) {
        // Verificar se a opção ainda existe
        const optionExists = Array.from(elements.filterBloco.options).some(opt => opt.value === currentSelection);
        if (optionExists) {
            elements.filterBloco.value = currentSelection;
            currentFilters.bloco = currentSelection;
            console.log(`✅ [FILTRO] Seleção restaurada: ${currentSelection}`);
        } else {
            // Limpar seleção apenas se não existir mais
            elements.filterBloco.value = '';
            currentFilters.bloco = '';
        }
    } else {
        // Limpar seleção de bloco ao trocar condomínio
        elements.filterBloco.value = '';
        currentFilters.bloco = '';
    }
}

// Aplicar filtros com debounce para melhor performance
function applyFiltersDebounced() {
    if (filterDebounceTimer) {
        clearTimeout(filterDebounceTimer);
    }

    filterDebounceTimer = setTimeout(() => {
        applyFilters();
    }, PAINEL_CONFIG.DEBOUNCE_DELAY);
}

function applyFilters() {
    console.log('🔍 Aplicando filtros...');

    // Iniciar monitoramento
    performanceMonitor.start('filterApplication');

    try {
        // Mostrar loading na tabela
        showTableLoading(true);

        // Atualizar filtros atuais
        currentFilters.ano = elements.filterAno ? elements.filterAno.value : '';
        currentFilters.condominio = elements.filterCondominio.value;
        currentFilters.bloco = elements.filterBloco.value;
        currentFilters.mes = elements.filterMes.value;

        // Atualizar filtro de blocos se necessário
        if (currentFilters.condominio) {
            updateBlocoFilterOptions();
        }

        // Renderizar tabela de forma assíncrona
        setTimeout(() => {
            renderPaymentsTable();
            showTableLoading(false);

            // Finalizar monitoramento
            const metrics = performanceMonitor.end('filterApplication');
            if (metrics && metrics.duration > 500) {
                console.warn(`⚠️ Filtros lentos: ${metrics.duration}ms`);
            }
        }, 50);

    } catch (error) {
        console.error('❌ Erro ao aplicar filtros:', error);
        showTableLoading(false);
        showToast('Erro ao aplicar filtros', 'error');
        performanceMonitor.end('filterApplication'); // Limpar métrica
    }
}

function updateBlocoFilterOptions() {
    const filteredBlocos = appState.blocos.filter(b => b.condominioId === currentFilters.condominio);

    // CORRECAO v95: Verificar se o bloco/casa selecionado ainda é válido
    let blocoValido = !currentFilters.bloco;
    
    if (currentFilters.bloco) {
        // Se for uma casa (CASA-xxx), verificar se existe
        if (currentFilters.bloco.startsWith('CASA-')) {
            const casaId = currentFilters.bloco.replace('CASA-', '');
            const casaExiste = appState.casas && appState.casas.some(c => 
                c.id === casaId && c.condominioId === currentFilters.condominio
            );
            blocoValido = casaExiste;
            console.log(`🔍 [FILTRO] Validando casa ${casaId}: ${blocoValido ? 'válida' : 'inválida'}`);
        } else {
            // Se for um bloco normal, verificar se existe
            blocoValido = filteredBlocos.some(b => b.id === currentFilters.bloco);
            console.log(`🔍 [FILTRO] Validando bloco ${currentFilters.bloco}: ${blocoValido ? 'válido' : 'inválido'}`);
        }
    }

    if (!blocoValido) {
        console.log(`⚠️ [FILTRO] Bloco/casa inválido, limpando seleção`);
        elements.filterBloco.value = '';
        currentFilters.bloco = '';
    }
}

function showTableLoading(show) {
    if (show) {
        elements.paymentsTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner"></div>
                    <div style="margin-top: 10px; color: var(--gray-500);">
                        Carregando dados...
                    </div>
                </td>
            </tr>
        `;
    }
}

function clearAllFilters() {
    if (elements.filterAno) elements.filterAno.value = new Date().getFullYear().toString();
    elements.filterCondominio.value = '';
    elements.filterBloco.value = '';
    elements.filterMes.value = '';
    currentFilters = {
        ano: new Date().getFullYear().toString(),
        condominio: '',
        bloco: '',
        mes: ''
    };
    currentPage = 1; // Reset para primeira página
    populateFilters();
    applyFiltersDebounced();
}

// Função para limpar cache manualmente
function clearPainelCache() {
    console.log('🧹 Limpando cache do painel...');

    painelCache.condominios.clear();
    painelCache.blocos.clear();
    painelCache.apartamentos.clear();
    painelCache.lastUpdate.clear();
    painelCache.isLoading.clear();

    // Limpar também cache de formatação
    if (typeof monthFormatCache !== 'undefined') {
        monthFormatCache.clear();
    }

    console.log('✅ Cache do painel limpo');
    showToast('Cache limpo com sucesso', 'success');
}

// Função para recarregar dados forçadamente
async function forceReloadPainelData() {
    console.log('🔄 Forçando recarga dos dados do painel...');

    try {
        // Limpar cache primeiro
        clearPainelCache();

        // Mostrar loading
        showPainelLoading(true);

        // Recarregar dados de todos os condomínios
        const promises = appState.condominios.map(cond =>
            ensurePainelApartamentosLoaded(cond.id)
        );
        await Promise.all(promises);

        // Resetar página atual
        currentPage = 1;

        // Re-renderizar tabela
        renderPaymentsTable();

        showToast('Dados recarregados com sucesso', 'success');

    } catch (error) {
        console.error('❌ Erro ao recarregar dados:', error);
        showToast('Erro ao recarregar dados', 'error');
    } finally {
        showPainelLoading(false);
    }
}

// CORREÇÃO 2025: Função de validação e debug para pagamentos de 2025
async function validate2025Payments() {
    console.log('🔍 [VALIDAÇÃO 2025] Iniciando validação...');
    
    // 1. Verificar se há pagamentos de 2025 no estado
    const payments2025 = appState.payments.condominio.filter(p => 
        p.date && p.date.startsWith('2025')
    );
    
    console.log(`📊 [VALIDAÇÃO] Pagamentos de 2025 no estado: ${payments2025.length}`);
    
    if (payments2025.length === 0) {
        console.warn('⚠️ [VALIDAÇÃO] Nenhum pagamento de 2025 encontrado no estado');
        await ensure2025PaymentsLoaded();
        
        // Verificar novamente após carregamento
        const afterLoad = appState.payments.condominio.filter(p => 
            p.date && p.date.startsWith('2025')
        );
        console.log(`📊 [VALIDAÇÃO] Após carregamento: ${afterLoad.length} pagamentos de 2025`);
    }
    
    // 2. Testar determineApartmentStatus para 2025
    const testApartment = appState.apartamentos[0];
    if (testApartment) {
        const testMonth = '2025-01';
        const testPayment = appState.payments.condominio.find(p => 
            p.apartamentoId === testApartment.id && p.date === testMonth
        );
        
        const status = determineApartmentStatus(testApartment, testPayment, testMonth);
        console.log(`🧪 [VALIDAÇÃO] Teste status para ${testApartment.numero}-${testMonth}: ${status}`);
        
        if (testPayment) {
            console.log(`💡 [VALIDAÇÃO] Pagamento encontrado:`, {
                id: testPayment.id,
                status: testPayment.status,
                date: testPayment.date
            });
        }
    }
    
    // 3. Estatísticas finais
    const finalStats = {
        total2025: appState.payments.condominio.filter(p => p.date?.startsWith('2025')).length,
        pagos2025: appState.payments.condominio.filter(p => p.date?.startsWith('2025') && p.status === 'pago').length,
        pendentes2025: appState.payments.condominio.filter(p => p.date?.startsWith('2025') && p.status === 'pendente').length
    };
    
    console.log('📈 [VALIDAÇÃO] Estatísticas finais 2025:', finalStats);
    
    return finalStats;
}

// CORRECAO v86: Função para garantir carregamento de pagamentos de 2025
async function ensure2025PaymentsLoaded() {
    console.log('🔄 [2025] Garantindo carregamento de pagamentos de 2025...');
    
    try {
        // Verificar se já existem pagamentos de 2025
        const existing2025 = appState.payments.condominio.filter(p => 
            p.date && p.date.startsWith('2025')
        );
        
        if (existing2025.length > 0) {
            console.log(`✅ [2025] Já existem ${existing2025.length} pagamentos carregados`);
            return existing2025.length;
        }
        
        console.log('🔄 [2025] Nenhum pagamento encontrado - iniciando carregamento completo...');
        
        // Determinar quais meses carregar baseado nos filtros
        let monthsToLoad = [];
        
        if (currentFilters.mes) {
            // Se há filtro de mês, carregar apenas esse mês
            monthsToLoad.push(`2025-${currentFilters.mes}`);
        } else {
            // Carregar todos os 12 meses de 2025
            for (let month = 1; month <= 12; month++) {
                monthsToLoad.push(`2025-${String(month).padStart(2, '0')}`);
            }
        }
        
        console.log(`📅 [2025] Carregando ${monthsToLoad.length} mês(es): ${monthsToLoad.join(', ')}`);
        
        // Carregar cada mês
        let totalLoaded = 0;
        for (const monthKey of monthsToLoad) {
            const loaded = await load2025PaymentsOnDemand(monthKey);
            totalLoaded += loaded;
        }
        
        console.log(`✅ [2025] Total carregado: ${totalLoaded} pagamentos`);
        
        // Validar carregamento
        const finalCount = appState.payments.condominio.filter(p => 
            p.date && p.date.startsWith('2025')
        ).length;
        
        if (finalCount === 0) {
            console.warn('⚠️ [2025] Nenhum pagamento foi carregado. Verifique se há dados no Firebase.');
        } else {
            console.log(`✅ [2025] Validação: ${finalCount} pagamentos de 2025 no estado`);
        }
        
        return totalLoaded;
        
    } catch (error) {
        console.error('❌ [2025] Erro ao garantir carregamento:', error);
        showToast('Erro ao carregar pagamentos de 2025', 'error');
        return 0;
    }
}

// CORREÇÃO 2025: Função simples para carregar pagamentos sob demanda
async function load2025PaymentsOnDemand(monthKey) {
    console.log(`🔄 [2025] Carregando pagamentos para ${monthKey} sob demanda...`);
    
    try {
        const [year, month] = monthKey.split('-');
        const date = `${year}-${month}`;
        
        // Obter TODOS os blocos relevantes para garantir sincronização completa
        let targetBlocos = [];
        
        if (currentFilters.bloco) {
            // Se há filtro de bloco, usar apenas esse bloco
            targetBlocos = appState.blocos.filter(b => b.id === currentFilters.bloco);
        } else if (currentFilters.condominio) {
            // Se há filtro de condomínio, usar todos os blocos desse condomínio
            targetBlocos = appState.blocos.filter(b => b.condominioId === currentFilters.condominio);
        } else {
            // Se não há filtro, usar TODOS os blocos (mas limitar a 10 para evitar sobrecarga)
            targetBlocos = appState.blocos.slice(0, 10);
            console.log(`⚠️ [2025] Sem filtro, limitando a ${targetBlocos.length} blocos para evitar sobrecarga`);
        }
        
        let loadedCount = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let recycledCount = 0;
        
        for (const bloco of targetBlocos) {
            try {
                const payments = await getPaymentsByBlocoAndPeriod(bloco.id, date);
                
                // Adicionar apenas pagamentos que ainda não existem
                payments.forEach(payment => {
                    const exists = appState.payments.condominio.some(p => 
                        p.id === payment.id || 
                        (p.apartamentoId === payment.apartamentoId && p.date === payment.date)
                    );
                    
                    if (!exists) {
                        appState.payments.condominio.push(payment);
                        loadedCount++;
                        
                        // Contar por status
                        if (payment.status === 'pago') paidCount++;
                        else if (payment.status === 'pendente') pendingCount++;
                        else if (payment.status === 'reciclado') recycledCount++;
                    }
                });
                
                if (payments.length > 0) {
                    const blockPaid = payments.filter(p => p.status === 'pago').length;
                    const blockPending = payments.filter(p => p.status === 'pendente').length;
                    const blockRecycled = payments.filter(p => p.status === 'reciclado').length;
                    
                    console.log(`💰 [2025] ${bloco.nome}: ${payments.length} pagamentos (${blockPaid} pagos, ${blockPending} pendentes, ${blockRecycled} reciclados)`);
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao carregar ${bloco.nome}:`, error);
            }
        }
        
        console.log(`✅ [2025] Carregados ${loadedCount} novos pagamentos para ${monthKey}`);
        console.log(`📊 [2025] Status: ${paidCount} pagos, ${pendingCount} pendentes, ${recycledCount} reciclados`);
        
        return loadedCount;
        
    } catch (error) {
        console.error('❌ [2025] Erro ao carregar pagamentos sob demanda:', error);
        return 0;
    }
}

async function getFilteredData() {
    console.log('📊 Gerando dados filtrados...');
    const startTime = performance.now();

    const allData = [];

    // CORRECAO v81: Determinar meses a processar ANTES de filtrar apartamentos
    const monthsToProcess = getMonthsToProcess();
    
    // CORRECAO v81: Se não há mês/ano selecionado, retornar vazio (evita processar tudo)
    if (monthsToProcess.length === 0) {
        console.warn('⚠️ Nenhum período selecionado para filtrar');
        return allData;
    }

    // Filtrar apartamentos por condomínio e bloco
    let filteredApartments = appState.apartamentos;
    let filteredCasas = [];
    
    if (currentFilters.condominio) {
        filteredApartments = filteredApartments.filter(apt => apt.condominioId === currentFilters.condominio);
    }
    
    // CORRECAO v92: Se filtro de bloco for uma casa específica (CASA-xxx), filtrar apenas essa casa
    if (currentFilters.bloco && currentFilters.bloco.startsWith('CASA-')) {
        const casaId = currentFilters.bloco.replace('CASA-', '');
        console.log(`🏠 Filtrando casa específica: ${casaId}`);
        const casa = appState.casas.find(c => c.id === casaId);
        if (casa) {
            filteredCasas = [casa];
            filteredApartments = []; // Não processar apartamentos
            console.log(`✅ Casa encontrada: ${casa.numero}`);
        }
    } else if (currentFilters.bloco) {
        filteredApartments = filteredApartments.filter(apt => apt.blocoId === currentFilters.bloco);
    }
    
    // CORRECAO v82: Limitar quantidade de apartamentos processados (evita travamento)
    const MAX_APARTMENTS = 1000;
    if (filteredApartments.length > MAX_APARTMENTS) {
        // CORRECAO v82: Só mostrar alerta se NÃO há filtro de condomínio
        if (!currentFilters.condominio) {
            console.warn(`⚠️ Muitos apartamentos (${filteredApartments.length}). Limitando a ${MAX_APARTMENTS}. Use filtros!`);
            showToast(`Muitos dados! Selecione um condomínio específico para melhor performance.`, 'warning');
        } else {
            console.warn(`⚠️ Condomínio grande (${filteredApartments.length} apts). Limitando a ${MAX_APARTMENTS}.`);
        }
        filteredApartments = filteredApartments.slice(0, MAX_APARTMENTS);
    }

    // Cache para condomínios e blocos
    const condominioCache = new Map();
    const blocoCache = new Map();

    appState.condominios.forEach(c => condominioCache.set(c.id, c));
    appState.blocos.forEach(b => blocoCache.set(b.id, b));
    
    // CORRECAO v81: Cache de pagamentos por apartamento (evita busca repetida)
    const paymentCache = new Map();
    
    // CORREÇÃO 2025: Abordagem lazy - carrega apenas quando necessário
    const is2025Selected = monthsToProcess.some(month => month.startsWith('2025'));
    if (is2025Selected) {
        console.log('🔍 [2025] Ano 2025 selecionado - verificando dados...');
        
        // Verificar se há pagamentos de 2025 no estado
        const has2025Payments = appState.payments.condominio.some(p => 
            p.date && p.date.startsWith('2025')
        );
        
        if (!has2025Payments) {
            console.warn('⚠️ [2025] Nenhum pagamento de 2025 encontrado no estado');
            
            // Carregar TODOS os meses de 2025 selecionados sob demanda
            for (const monthKey of monthsToProcess) {
                if (monthKey.startsWith('2025')) {
                    console.log(`🔄 [2025] Carregando ${monthKey} sob demanda...`);
                    await load2025PaymentsOnDemand(monthKey);
                }
            }
        } else {
            const count2025 = appState.payments.condominio.filter(p => p.date.startsWith('2025')).length;
            console.log(`✅ [2025] Encontrados ${count2025} pagamentos de 2025`);
        }
    }
    
    appState.payments.condominio.forEach(p => {
        const key = `${p.apartamentoId}-${p.date}`;
        paymentCache.set(key, p);
    });
    
    // DEBUG: Verificar se pagamentos de 2025 foram para o cache
    if (is2025Selected) {
        const cache2025Count = Array.from(paymentCache.keys()).filter(key => key.includes('2025')).length;
        console.log(`🔍 [CACHE] ${cache2025Count} pagamentos de 2025 no cache`);
        
        // Mostrar alguns exemplos
        const cache2025Keys = Array.from(paymentCache.keys()).filter(key => key.includes('2025')).slice(0, 3);
        cache2025Keys.forEach(key => {
            const payment = paymentCache.get(key);
            console.log(`💡 [CACHE] Exemplo: ${key} = ${payment?.status}`);
        });
    }

    // Processar apartamentos em lotes para melhor performance
    const batchSize = 50;
    for (let i = 0; i < filteredApartments.length; i += batchSize) {
        const batch = filteredApartments.slice(i, i + batchSize);

        batch.forEach(apartment => {
            const bloco = blocoCache.get(apartment.blocoId);
            const condominio = condominioCache.get(apartment.condominioId);

            if (!bloco || !condominio) return;

            monthsToProcess.forEach(monthKey => {
                // CORRECAO v81: Buscar no cache em vez de find() repetido
                const paymentKey = `${apartment.id}-${monthKey}`;
                const payment = paymentCache.get(paymentKey);

                // Determinar status de forma mais eficiente
                const status = determineApartmentStatus(apartment, payment, monthKey);

                const [year, month] = monthKey.split('-');

                // CORRECAO v82: Calcular valor baseado no status (mesmo sem pagamento registrado)
                let value = 0;
                if (payment && payment.value) {
                    // Se tem pagamento com valor, usar o valor registrado
                    value = payment.value;
                } else {
                    // Se não tem pagamento OU não tem valor, calcular baseado no status
                    if (status === 'pago') {
                        value = 80.00;
                    } else if (status === 'reciclado') {
                        value = 40.00;
                    } else if (status === 'pendente') {
                        value = 80.00; // Pendente tem valor potencial de R$ 80
                    } else if (status === 'acordo') {
                        value = 0; // Acordo não soma
                    }
                }

                allData.push({
                    id: `${apartment.id}-${monthKey}`,
                    apartmentId: apartment.id,
                    condominio: condominio.nome,
                    condominioId: condominio.id,
                    bloco: bloco.nome,
                    blocoId: bloco.id,
                    apartamento: apartment.numero,
                    proprietario: apartment.proprietario || 'N/A',
                    monthKey: monthKey,
                    month: formatMonthOptimized(monthKey),
                    ano: year,
                    mes: month,
                    value: value,
                    status: status,
                    observacao: apartment.observacao || ''
                });
            });
        });
    }
    
    // CORRECAO v90: Processar CASAS se filtro for "CASAS"
    if (filteredCasas.length > 0) {
        console.log(`🏠 Processando ${filteredCasas.length} casas...`);
        
        const condominio = condominioCache.get(currentFilters.condominio);
        
        filteredCasas.forEach(casa => {
            if (!condominio) return;

            monthsToProcess.forEach(monthKey => {
                // Buscar pagamento da casa no cache
                const paymentKey = `${casa.id}-${monthKey}`;
                const payment = paymentCache.get(paymentKey);

                // Determinar status
                const status = determineApartmentStatus(casa, payment, monthKey);

                const [year, month] = monthKey.split('-');

                // Calcular valor baseado no status
                let value = 0;
                if (payment && payment.value) {
                    value = payment.value;
                } else {
                    if (status === 'pago') {
                        value = 80.00;
                    } else if (status === 'reciclado') {
                        value = 40.00;
                    } else if (status === 'pendente') {
                        value = 80.00;
                    } else if (status === 'acordo') {
                        value = 0;
                    }
                }

                allData.push({
                    id: `${casa.id}-${monthKey}`,
                    apartmentId: casa.id,
                    condominio: condominio.nome,
                    condominioId: condominio.id,
                    bloco: 'Casas',
                    blocoId: 'CASAS',
                    apartamento: casa.numero,
                    proprietario: casa.morador || 'N/A',
                    monthKey: monthKey,
                    month: formatMonthOptimized(monthKey),
                    ano: year,
                    mes: month,
                    value: value,
                    status: status,
                    observacao: casa.observacao || ''
                });
            });
        });
        
        console.log(`✅ ${filteredCasas.length} casas processadas`);
    }

    const endTime = performance.now();
    console.log(`✅ Dados gerados em ${(endTime - startTime).toFixed(2)}ms - ${allData.length} registros`);

    return allData;
}

function getMonthsToProcess() {
    const selectedYear = currentFilters.ano;
    const selectedMonth = currentFilters.mes;

    // Se n�o h� ano selecionado, mostrar meses do ano atual
    const year = selectedYear || new Date().getFullYear().toString();

    const months = [];

    // Se h� m�s espec�fico selecionado
    if (selectedMonth) {
        months.push(`${year}-${selectedMonth}`);
    } else {
        // Mostrar todos os meses do ano
        for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            months.push(`${year}-${monthStr}`);
        }
    }

    return months;
}

function determineApartmentStatus(apartment, payment, monthKey) {
    // CORRECAO v86: Buscar SEMPRE no appState primeiro (fonte da verdade)
    if (monthKey) {
        const [year, month] = monthKey.split('-');
        const realPayment = appState.payments.condominio.find(p => 
            p.apartamentoId === apartment.id && (
                p.date === monthKey ||
                (p.ano === year && p.mes === month)
            )
        );
        
        if (realPayment) {
            if (monthKey.startsWith('2025')) {
                console.log(`✅ [STATUS] ${apartment.numero}-${monthKey}: ${realPayment.status}`);
            }
            return realPayment.status || 'pendente';
        }
    }
    
    // Fallback: usar payment do cache se existir
    if (payment) {
        if (monthKey && monthKey.startsWith('2025')) {
            console.log(`🔧 [CACHE] ${apartment.numero}-${monthKey}: ${payment.status} (via cache)`);
        }
        return payment.status || 'pendente';
    }

    // Se NÃO houver pagamento, mostrar como pendente
    if (monthKey && monthKey.startsWith('2025')) {
        console.warn(`❌ [NOT FOUND] ${apartment.numero}-${monthKey}: pendente (sem pagamento)`);
    }
    return 'pendente';
}

// Cache para formatação de meses
const monthFormatCache = new Map();

function formatMonthOptimized(monthKey) {
    if (monthFormatCache.has(monthKey)) {
        return monthFormatCache.get(monthKey);
    }

    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

    monthFormatCache.set(monthKey, formatted);
    return formatted;
}

function getRelevantMonths() {
    const months = new Set();
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Limitar a um período razoável: últimos 12 meses até mês atual
    const maxMonthsBack = 12;
    const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - maxMonthsBack, 1);

    // Coletar APENAS meses com pagamentos que estão dentro do período relevante
    appState.payments.condominio.forEach(payment => {
        const [year, month] = payment.date.split('-');
        const paymentDate = new Date(parseInt(year), parseInt(month) - 1, 1);

        // Adicionar apenas se estiver dentro do período relevante
        if (paymentDate >= cutoffDate) {
            months.add(payment.date);
        }
    });

    // Adicionar apenas mês atual e último mês (para mostrar pendências recentes)
    // Isso evita multiplicação excessiva de meses sem pagamentos
    months.add(currentMonthKey);

    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    months.add(lastMonthKey);

    return Array.from(months).sort();
}

function formatMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

// Configuração de paginação

async function renderPaymentsTable() {
    console.log('🎨 Renderizando tabela de pagamentos...');
    const startTime = performance.now();

    try {
        // CORRECAO v84: Garantir que pagamentos de 2025 estejam carregados
        const selectedYear = currentFilters.ano || '2025';
        if (selectedYear === '2025') {
            console.log('🔄 [v84] Verificando pagamentos de 2025...');
            const payments2025 = appState.payments.condominio.filter(p => p.date && p.date.startsWith('2025'));
            console.log(`📊 [v84] Pagamentos de 2025 no estado: ${payments2025.length}`);
            
            if (payments2025.length === 0) {
                console.warn('⚠️ [v84] Nenhum pagamento de 2025 - carregando...');
                await ensure2025PaymentsLoaded();
                
                const afterLoad = appState.payments.condominio.filter(p => p.date && p.date.startsWith('2025'));
                console.log(`✅ [v84] Após carregamento: ${afterLoad.length} pagamentos de 2025`);
            }
        }
        
        const allData = await getFilteredData();

        if (allData.length === 0) {
            renderEmptyTable();
            return;
        }

        // Ordenar dados por condomínio, bloco, apartamento
        allData.sort((a, b) => {
            if (a.condominio !== b.condominio) return a.condominio.localeCompare(b.condominio);
            if (a.bloco !== b.bloco) return a.bloco.localeCompare(b.bloco);
            if (a.apartamento !== b.apartamento) return a.apartamento.localeCompare(b.apartamento);
            return b.monthKey.localeCompare(a.monthKey); // Mês mais recente primeiro
        });

        // Implementar paginação
        const totalPages = Math.ceil(allData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = allData.slice(startIndex, endIndex);

        // Renderizar dados da página atual
        renderTableRows(pageData);

        // Atualizar informações da tabela
        updateTableInfo(allData.length, startIndex + 1, Math.min(endIndex, allData.length), totalPages);

        // REMOVIDO v122: updatePainelSummary() - Painel de totais foi removido

        // Renderizar controles de paginação
        renderPaginationControls(totalPages);

        const endTime = performance.now();
        console.log(`✅ Tabela renderizada em ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
        console.error('❌ Erro ao renderizar tabela:', error);
        renderErrorTable();
    }
}

function renderTableRows(data) {
    const tbody = elements.paymentsTableBody;
    tbody.innerHTML = '';

    // Usar DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();

    // CORRECAO v84: Valores corretos por status (pendente também tem valor)
    const valoresPorStatus = {
        pago: 80,
        reciclado: 40,
        pendente: 80,  // CORRIGIDO: Pendente tem valor potencial
        acordo: 0
    };

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = `table-row status-${item.status}`;

        // Calcular valor: apenas pago e reciclado têm valor
        const valorCalculado = valoresPorStatus[item.status] || 0;

        row.innerHTML = `
            <td class="td-condominio">${item.condominio}</td>
            <td class="td-bloco">${item.bloco}</td>
            <td class="td-apartamento">${item.apartamento}</td>
            <td class="td-proprietario">${item.proprietario}</td>
            <td class="td-mes">${item.month}</td>
            <td class="td-valor">R$ ${formatCurrency(valorCalculado)}</td>
            <td class="td-status">
                <div class="status-cell">
                    <div class="status-dot ${item.status}"></div>
                    <span class="status-text ${item.status}">
                        ${getStatusText(item.status)}
                    </span>
                </div>
            </td>
        `;

        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

function renderEmptyTable() {
    elements.paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-title">Nenhum registro encontrado</div>
                <div class="empty-subtitle">
                    Ajuste os filtros ou verifique se há dados cadastrados
                </div>
            </td>
        </tr>
    `;
    elements.tableInfo.textContent = '0 registros';
    hidePaginationControls();
}

function renderErrorTable() {
    elements.paymentsTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Erro ao carregar dados</div>
                <div class="error-subtitle">
                    Tente recarregar a página ou contate o suporte
                </div>
            </td>
        </tr>
    `;
    elements.tableInfo.textContent = 'Erro no carregamento';
    hidePaginationControls();
}

function updateTableInfo(total, start, end, totalPages) {
    elements.tableInfo.textContent =
        `Mostrando ${start}-${end} de ${total} registros (Página ${currentPage} de ${totalPages})`;
}

/**
 * REMOVIDO v122: Função updatePainelSummary() - Painel de totais foi removido
 */
// async function updatePainelSummary() { ... }

function renderPaginationControls(totalPages) {
    let paginationContainer = document.getElementById('paginationControls');

    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.className = 'pagination-controls';

        // Inserir após a tabela
        const tableContainer = elements.paymentsTableBody.closest('.table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        }
    }

    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';

    // Botão anterior
    const prevBtn = createPaginationButton('‹ Anterior', currentPage > 1, () => {
        if (currentPage > 1) {
            currentPage--;
            renderPaymentsTable();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Números das páginas (mostrar até 5 páginas)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = createPaginationButton(i.toString(), true, () => {
            currentPage = i;
            renderPaymentsTable();
        });

        if (i === currentPage) {
            pageBtn.classList.add('active');
        }

        paginationContainer.appendChild(pageBtn);
    }

    // Botão próximo
    const nextBtn = createPaginationButton('Próximo ›', currentPage < totalPages, () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPaymentsTable();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

function createPaginationButton(text, enabled, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'pagination-btn';
    button.disabled = !enabled;

    if (enabled) {
        button.addEventListener('click', onClick);
    }

    return button;
}

function hidePaginationControls() {
    const paginationContainer = document.getElementById('paginationControls');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
}

function formatCurrency(value) {
    return (value || 0).toFixed(2).replace('.', ',');
}

function getStatusText(status) {
    const key = (status || '').toString().trim().toLowerCase();
    const statusMap = {
        // Status antigos (compatibilidade)
        paid: 'PAGO',
        pending: 'PENDENTE',
        agreement: 'ACORDO',
        // Status do apartamento
        'pendente': 'PENDENTE',
        'pago': 'PAGO',
        'reciclado': 'PAGO RECICLADO',
        'acordo': 'ACORDO'
    };
    return statusMap[key] || statusMap[status] || status;
}

// Função para mapear status do apartamento para exportação

async function updateSummaryCards() {
    const data = await getFilteredData();

    const paid = data.filter(item => item.status === 'paid').length;
    const pending = data.filter(item => item.status === 'pending').length;
    const agreement = data.filter(item => item.status === 'agreement').length;
    const totalValue = data.filter(item => item.status === 'paid')
        .reduce((sum, item) => sum + item.value, 0);

    elements.totalPaid.textContent = paid;
    elements.totalPending.textContent = pending;
    elements.totalAgreement.textContent = agreement;
    elements.totalValue.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
}

function editStatus(itemId, currentStatus, apartamento, month) {
    currentStatusEdit = { itemId, currentStatus, apartamento, month };

    elements.statusApartmentInfo.textContent = `Apartamento ${apartamento} - ${month}`;

    // Selecionar status atual
    const statusRadio = document.querySelector(`input[name="newStatus"][value="${currentStatus}"]`);
    if (statusRadio) {
        statusRadio.checked = true;
    }

    elements.statusModal.classList.remove('hidden');
}

// Tornar editStatus acessível globalmente para uso em onclick
window.editStatus = editStatus;

function hideStatusModal() {
    elements.statusModal.classList.add('hidden');
    currentStatusEdit = null;
}

async function confirmStatusChange() {
    if (!requirePermission('registerPayments')) return;

    if (!currentStatusEdit) return;

    const newStatus = document.querySelector('input[name="newStatus"]:checked').value;
    const [apartmentId, monthKey] = currentStatusEdit.itemId.split('-');
    const [ano, mes] = monthKey.split('-');

    // 1) Persistir status escolhido no apartamento (para refletir no Painel Geral)
    const apartamento = appState.apartamentos.find(a => a.id === apartmentId);
    if (apartamento) {
        apartamento.status = newStatus;
        // CORRECAO: NAO atualizar documento do apartamento
        // O status ja esta sendo salvo no pagamento abaixo
        // Atualizar o documento causa erro para casas (que estao em subcoleção)
        /*
        if (typeof updateApartamento === 'function') {
            updateApartamento(apartmentId, { status: newStatus, observacao: apartamento.observacao || '' })
                .catch(err => console.warn('Falha ao salvar status no Firebase:', err));
        }
        */
    }

    // 2) Manter regra antiga de pagamento do Painel (pago/reciclado cria pagamento; pendente/acordo remove)
    if (newStatus === 'pago' || newStatus === 'reciclado') {
        const paymentData = {
            apartamentoId: apartmentId,
            date: monthKey,
            ano: ano,
            mes: mes,
            value: newStatus === 'pago' ? 80.00 : 40.00,
            type: 'condominio',
            status: newStatus,
            updatedAt: new Date()
        };

        // Verificar se j� existe pagamento no appState
        const existingPaymentIndex = appState.payments.condominio.findIndex(p =>
            p.apartamentoId === apartmentId && p.date === monthKey
        );

        try {
            if (existingPaymentIndex >= 0) {
                const paymentId = appState.payments.condominio[existingPaymentIndex].id;
                // Pagamento j� existe, atualizar status e valor
                appState.payments.condominio[existingPaymentIndex] = {
                    ...appState.payments.condominio[existingPaymentIndex],
                    ...paymentData
                };

                if (typeof updatePayment === 'function') {
                    await updatePayment(paymentId, paymentData);
                }
            } else {
                // Criar novo pagamento
                if (typeof createPayment === 'function') {
                    const newId = await createPayment(paymentData);
                    appState.payments.condominio.push({
                        id: newId,
                        ...paymentData
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao persistir pagamento:', error);
            showToast('Erro ao salvar no banco de dados', 'error');
        }
    } else {
        // Remover pagamento se existir
        const existingPayment = appState.payments.condominio.find(p =>
            p.apartamentoId === apartmentId && p.date === monthKey
        );

        if (existingPayment) {
            try {
                if (typeof deletePayment === 'function') {
                    await deletePayment(existingPayment.id);
                }
                appState.payments.condominio = appState.payments.condominio.filter(p => p.id !== existingPayment.id);
            } catch (error) {
                console.error('Erro ao deletar pagamento:', error);
            }
        }
    }

    // saveData(); // Removido por n�o estar definido e usamos chamadas diretas
    hideStatusModal();
    applyFilters();
    showToast('Status atualizado com sucesso!', 'success');
}

async function getCurrentTaxForApartment() {
    try {
        const apartamento = appState.selectedApartamento;
        if (!apartamento) return;

        const currentTax = await getCurrentTax(apartamento.condominioId);

        const valueField = document.getElementById('paymentValue');
        if (valueField && currentTax && !valueField.value) {
            valueField.value = currentTax.value.toFixed(2);
        }
    } catch (error) {
        console.warn('Erro ao buscar taxa atual:', error);
        const valueField = document.getElementById('paymentValue');
        if (valueField && !valueField.value) {
            valueField.value = '285.00';
        }
    }
}

function loadApartmentCurrentStatus(apartamento) {
    const currentObservations = apartamento.observacao || '';
    const observationsField = document.getElementById('apartmentObservations');
    if (observationsField) {
        observationsField.value = currentObservations;
    }
}

// Inicializar aplicacao quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}


// ============================================
// SCRIPT ESPECIAL: MARCAR 2025 COMO PAGO
// ============================================

// Adicionar bot�o secreto para administradores
function adicionarBotaoScript2025() {
    // S� adicionar se for administrador
    if (appState.user && appState.user.role === 'administrador') {
        const userInfo = document.getElementById('userInfo');
        if (userInfo && !document.getElementById('btn2025')) {
            const btn = document.createElement('button');
            btn.id = 'btn2025';
            btn.textContent = '2025';
            btn.style.cssText = `
                margin-left: 10px;
                padding: 8px 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
            `;
            btn.title = 'Marcar 2025 como pago';
            btn.onclick = confirmarScript2025;
            userInfo.appendChild(btn);
            console.log('? Bot�o 2025 adicionado');
        }
    }
}

function confirmarScript2025() {
    const confirmacao = confirm(
        '?? ATEN��O!\n\n' +
        'Este script ir� marcar TODO O ANO DE 2025 como PAGO para:\n' +
        '� Todos os condom�nios\n' +
        '� Todos os blocos\n' +
        '� Todos os apartamentos\n' +
        '� Todas as casas\n\n' +
        'Isso criar� 12 pagamentos (Janeiro a Dezembro) para cada unidade.\n\n' +
        'Esta a��o N�O pode ser desfeita facilmente!\n\n' +
        'Deseja continuar?'
    );

    if (confirmacao) {
        executarScript2025();
    }
}

async function executarScript2025() {
    const btn = document.getElementById('btn2025');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Processando...';
    }

    console.log('?? Iniciando script para marcar 2025 como pago...');
    console.log('?? IMPORTANTE: Abra o Console (F12) para ver o progresso detalhado');
    
    const ano = 2025;
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    let totalCriados = 0;
    let totalAtualizados = 0;
    let totalErros = 0;
    let totalProcessados = 0;

    try {
        // Buscar todos os condom�nios
        console.log('?? Buscando condom�nios...');
        const condominios = await getCondominios();
        console.log(`? Encontrados ${condominios.length} condom�nios`);

        if (typeof showToast === 'function') {
            showToast(`Processando ${condominios.length} condom�nios...`, 'info');
        }

        // Para cada condom�nio
        for (const condominio of condominios) {
            console.log(`\n?? Processando: ${condominio.nome}`);

            // Buscar blocos
            const blocos = await getBlocosByCondominio(condominio.id);
            console.log(`  ?? ${blocos.length} blocos`);

            // Para cada bloco
            for (const bloco of blocos) {
                const apartamentos = await getApartamentosByBloco(bloco.id);
                console.log(`    ?? ${bloco.nome}: ${apartamentos.length} apartamentos`);

                // Para cada apartamento
                for (const apartamento of apartamentos) {
                    // Para cada m�s de 2025
                    for (const mes of meses) {
                        const date = `${ano}-${mes}`;
                        
                        try {
                            const paymentData = {
                                apartamentoId: apartamento.id,
                                condominioId: condominio.id,
                                blocoId: bloco.id,
                                apartamentoNumero: apartamento.numero,
                                ano: ano,
                                mes: mes,
                                date: date,
                                type: 'condominio',
                                status: 'pago',
                                observacao: 'Pagamento autom�tico - Script 2025',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            // CORRECAO: Buscar pagamentos do apartamento e filtrar pelo per�odo
                            const allPayments = await getPaymentsByApartamento(apartamento.id);
                            const existingPayment = allPayments.find(p => 
                                p.ano === ano && p.mes === mes
                            );
                            
                            if (existingPayment) {
                                // Atualizar existente
                                await updatePayment(existingPayment.id, paymentData);
                                totalAtualizados++;
                                if (totalProcessados % 10 === 0) {
                                    console.log(`      ? Atualizado: Apt ${apartamento.numero} - ${mes}/2025`);
                                }
                            } else {
                                // Criar novo
                                await createPayment(paymentData);
                                totalCriados++;
                                if (totalProcessados % 10 === 0) {
                                    console.log(`      ? Criado: Apt ${apartamento.numero} - ${mes}/2025`);
                                }
                            }
                            
                            totalProcessados++;
                            
                            // Mostrar progresso a cada 50 pagamentos
                            if (totalProcessados % 50 === 0) {
                                console.log(`    ?? Progresso: ${totalProcessados} pagamentos processados`);
                            }

                        } catch (error) {
                            console.error(`      ? Erro no apt ${apartamento.numero} m�s ${mes}:`, error.message);
                            totalErros++;
                        }
                    }
                }
            }

            // Processar casas
            const casas = await getCasasByCondominio(condominio.id);
            if (casas.length > 0) {
                console.log(`  ?? ${casas.length} casas`);

                for (const casa of casas) {
                    for (const mes of meses) {
                        const date = `${ano}-${mes}`;
                        
                        try {
                            const paymentData = {
                                apartamentoId: casa.id,
                                condominioId: condominio.id,
                                apartamentoNumero: casa.numero,
                                ano: ano,
                                mes: mes,
                                date: date,
                                type: 'condominio',
                                status: 'pago',
                                observacao: 'Pagamento autom�tico - Script 2025',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };
                            
                            // CORRECAO: Casas nao tem blocoId - nao adicionar o campo

                            // Buscar pagamentos da casa
                            const allPayments = await getPaymentsByApartamento(casa.id);
                            const existingPayment = allPayments.find(p => 
                                p.ano === ano && p.mes === mes
                            );
                            
                            if (existingPayment) {
                                await updatePayment(existingPayment.id, paymentData);
                                totalAtualizados++;
                                if (totalProcessados % 10 === 0) {
                                    console.log(`      ? Atualizado: Casa ${casa.numero} - ${mes}/2025`);
                                }
                            } else {
                                await createPayment(paymentData);
                                totalCriados++;
                                if (totalProcessados % 10 === 0) {
                                    console.log(`      ? Criado: Casa ${casa.numero} - ${mes}/2025`);
                                }
                            }
                            
                            totalProcessados++;

                        } catch (error) {
                            console.error(`      ? Erro na casa ${casa.numero} m�s ${mes}:`, error.message);
                            totalErros++;
                        }
                    }
                }
            }
            
            console.log(`  ? ${condominio.nome} conclu�do`);
        }

        // Resumo final
        console.log('\n' + '='.repeat(60));
        console.log('? SCRIPT CONCLU�DO!');
        console.log('='.repeat(60));
        console.log(`?? Total processado: ${totalProcessados} pagamentos`);
        console.log(`? Criados: ${totalCriados}`);
        console.log(`?? Atualizados: ${totalAtualizados}`);
        console.log(`? Erros: ${totalErros}`);
        console.log('='.repeat(60));

        const mensagem = `? Script conclu�do!\n\n` +
            `Total processado: ${totalProcessados}\n` +
            `Criados: ${totalCriados}\n` +
            `Atualizados: ${totalAtualizados}\n` +
            `Erros: ${totalErros}\n\n` +
            `Ano 2025 marcado como pago!`;

        alert(mensagem);

        if (typeof showToast === 'function') {
            showToast('Ano 2025 marcado como pago! Recarregando...', 'success');
        }

        // Recarregar visualiza��es
        if (appState.selectedCondominio && typeof loadBlocosData === 'function') {
            console.log('?? Recarregando visualiza��es...');
            await loadBlocosData(appState.selectedCondominio.id);
            console.log('? Visualiza��es recarregadas');
        }

    } catch (error) {
        console.error('? Erro fatal no script:', error);
        alert('? Erro ao executar script: ' + error.message + '\n\nVeja o console (F12) para mais detalhes.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '2025';
        }
    }
}

// Adicionar bot�o quando o usu�rio fizer login
if (typeof window !== 'undefined') {
    // Tentar adicionar o bot�o ap�s 2 segundos (dar tempo do login)
    setTimeout(() => {
        adicionarBotaoScript2025();
    }, 2000);
}


// ============================================
// PAGAMENTOS HOJE - FAB E MODAL
// ============================================

let pagamentosHojeData = [];

// Inicializar FAB e Modal de Pagamentos Hoje
function initPagamentosHoje() {
    console.log('🚀 Inicializando FAB Pagamentos Hoje...');
    
    const fabButton = document.getElementById('fabPagamentosHoje');
    const modal = document.getElementById('modalPagamentosHoje');
    const closeBtn = document.getElementById('closePagamentosHoje');

    console.log('📍 Elementos:', {
        fabButton: !!fabButton,
        modal: !!modal,
        closeBtn: !!closeBtn
    });

    if (!fabButton || !modal || !closeBtn) {
        console.warn('⚠️ Elementos do FAB não encontrados');
        return;
    }

    // Verificar usuário atual
    const currentUser = getCurrentUser();
    const currentProfile = getCurrentProfile();
    
    console.log('👤 Usuário atual:', {
        user: currentUser ? currentUser.email : 'nenhum',
        profile: currentProfile
    });

    // Mostrar FAB apenas para admin@condominio.com
    if (currentUser && currentUser.email === 'admin@condominio.com') {
        fabButton.style.display = 'flex';
        console.log('✅ FAB habilitado para admin');
        
        // Carregar dados iniciais
        carregarPagamentosHoje();
    } else {
        fabButton.style.display = 'none';
        console.log('❌ FAB não habilitado - usuário:', currentUser ? currentUser.email : 'nenhum');
    }

    // Abrir modal
    fabButton.addEventListener('click', () => {
        console.log('🖱️ FAB clicado');
        modal.classList.remove('hidden');
        carregarPagamentosHoje();
    });

    // Fechar modal
    closeBtn.addEventListener('click', () => {
        console.log('❌ Fechando modal');
        modal.classList.add('hidden');
    });

    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

async function carregarPagamentosHoje() {
    console.log('📊 Carregando pagamentos de hoje...');
    
    const dataHojeElement = document.getElementById('dataHoje');
    const listaPagamentos = document.getElementById('listaPagamentosHoje');
    const badge = document.getElementById('fabBadge');

    // Mostrar data de hoje
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    dataHojeElement.textContent = dataFormatada;

    // Mostrar loading
    listaPagamentos.innerHTML = `
        <div class="loading-pagamentos">
            <div class="spinner-small"></div>
            <p>Carregando pagamentos...</p>
        </div>
    `;

    try {
        // Buscar todos os pagamentos de hoje
        const pagamentosHoje = await buscarPagamentosHoje();
        pagamentosHojeData = pagamentosHoje;

        console.log(`✅ ${pagamentosHoje.length} pagamentos encontrados hoje`);

        // Atualizar badge
        badge.textContent = pagamentosHoje.length;

        // Renderizar pagamentos
        renderizarPagamentosHoje(pagamentosHoje);

    } catch (error) {
        console.error('❌ Erro ao carregar pagamentos:', error);
        listaPagamentos.innerHTML = `
            <div class="empty-pagamentos">
                <div class="empty-pagamentos-icon">❌</div>
                <div class="empty-pagamentos-text">Erro ao carregar</div>
                <div class="empty-pagamentos-desc">${error.message}</div>
            </div>
        `;
    }
}

async function buscarPagamentosHoje() {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`🔍 Buscando pagamentos de ${hojeStr}...`);
    console.log(`📊 Total de apartamentos: ${appState.apartamentos.length}`);

    const pagamentosHoje = [];
    
    try {
        // Importar Firestore
        const { db } = await import('./firebase-config.js');
        const { collection, query, where, getDocs, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Buscar todos os pagamentos de hoje em uma única query
        const paymentsRef = collection(db, 'payments');
        
        // Criar timestamp de início do dia
        const inicioDia = new Date(hoje);
        inicioDia.setHours(0, 0, 0, 0);
        
        console.log(`📅 Buscando pagamentos desde ${inicioDia.toISOString()}`);
        
        // Query simplificada - apenas updatedAt >= hoje (sem range)
        const q = query(
            paymentsRef,
            where('updatedAt', '>=', Timestamp.fromDate(inicioDia))
        );
        
        const snapshot = await getDocs(q);
        console.log(`✅ ${snapshot.size} pagamentos encontrados no Firebase`);
        
        // Filtrar e processar cada pagamento
        snapshot.forEach(doc => {
            const payment = { id: doc.id, ...doc.data() };
            
            // Verificar se é de hoje e tem status válido
            if (!payment.updatedAt) return;
            
            const paymentDate = payment.updatedAt.toDate ? 
                payment.updatedAt.toDate() : 
                new Date(payment.updatedAt);
            
            const paymentDateStr = paymentDate.toISOString().split('T')[0];
            
            // Filtrar apenas pagamentos de hoje com status válido
            if (paymentDateStr !== hojeStr) return;
            if (!['pago', 'reciclado', 'acordo'].includes(payment.status)) return;
            
            // Buscar informações do apartamento
            const apartamento = appState.apartamentos.find(a => a.id === payment.apartamentoId);
            const casa = appState.casas ? appState.casas.find(c => c.id === payment.apartamentoId) : null;
            
            const unidade = apartamento || casa;
            
            if (unidade) {
                const bloco = appState.blocos.find(b => b.id === unidade.blocoId);
                const condominio = appState.condominios.find(c => c.id === (bloco ? bloco.condominioId : unidade.condominioId));
                
                if (condominio) {
                    pagamentosHoje.push({
                        ...payment,
                        condominio: condominio.nome,
                        condominioId: condominio.id,
                        bloco: bloco ? bloco.nome : 'Casa',
                        blocoId: bloco ? bloco.id : null,
                        apartamento: unidade.numero,
                        apartamentoId: unidade.id,
                        proprietario: unidade.proprietario || 'N/A',
                        tipo: casa ? 'casa' : 'apartamento'
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar pagamentos:', error);
        console.error('Stack:', error.stack);
    }

    console.log(`✅ Total de pagamentos hoje: ${pagamentosHoje.length}`);
    return pagamentosHoje;
}

function renderizarPagamentosHoje(pagamentos) {
    const listaPagamentos = document.getElementById('listaPagamentosHoje');
    const totalCondominiosEl = document.getElementById('totalCondominiosHoje');
    const totalApartamentosEl = document.getElementById('totalApartamentosHoje');
    const totalValorEl = document.getElementById('totalValorHoje');

    if (pagamentos.length === 0) {
        listaPagamentos.innerHTML = `
            <div class="empty-pagamentos">
                <div class="empty-pagamentos-icon">📭</div>
                <div class="empty-pagamentos-text">Nenhum pagamento hoje</div>
                <div class="empty-pagamentos-desc">Ainda não houve pagamentos registrados hoje</div>
            </div>
        `;
        
        totalCondominiosEl.textContent = '0';
        totalApartamentosEl.textContent = '0';
        totalValorEl.textContent = 'R$ 0';
        return;
    }

    // Calcular estatísticas
    const condominiosUnicos = new Set(pagamentos.map(p => p.condominioId));
    const apartamentosUnicos = new Set(pagamentos.map(p => p.apartamentoId));
    const valorTotal = pagamentos.reduce((sum, p) => sum + (p.value || 80), 0);

    totalCondominiosEl.textContent = condominiosUnicos.size;
    totalApartamentosEl.textContent = apartamentosUnicos.size;
    totalValorEl.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;

    // Agrupar por condomínio
    const porCondominio = {};
    pagamentos.forEach(p => {
        if (!porCondominio[p.condominio]) {
            porCondominio[p.condominio] = [];
        }
        porCondominio[p.condominio].push(p);
    });

    // Renderizar
    let html = '';
    
    Object.keys(porCondominio).sort().forEach(condominioNome => {
        const pagamentosCondominio = porCondominio[condominioNome];
        const valorCondominio = pagamentosCondominio.reduce((sum, p) => sum + (p.value || 80), 0);

        html += `
            <div class="pagamento-grupo">
                <div class="pagamento-grupo-header">
                    <div class="pagamento-grupo-icon">🏢</div>
                    <div class="pagamento-grupo-info">
                        <h3>${condominioNome}</h3>
                        <p>${pagamentosCondominio.length} pagamento(s) • R$ ${valorCondominio.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
        `;

        pagamentosCondominio.forEach(pagamento => {
            const tipoUnidade = pagamento.tipo === 'casa' ? 'Casa' : 'Apt';
            const mesNome = getMesNome(pagamento.month);
            const statusBadge = getStatusBadge(pagamento.status);
            const valor = pagamento.value || 80;

            html += `
                <div class="pagamento-item-hoje">
                    <div class="pagamento-item-info">
                        <div class="pagamento-item-titulo">
                            ${pagamento.bloco} - ${tipoUnidade} ${pagamento.apartamento}
                        </div>
                        <div class="pagamento-item-detalhes">
                            <div class="pagamento-detalhe">
                                <span class="pagamento-detalhe-icon">👤</span>
                                ${pagamento.proprietario}
                            </div>
                            <div class="pagamento-detalhe">
                                <span class="pagamento-detalhe-icon">📅</span>
                                ${mesNome}/${pagamento.year}
                            </div>
                        </div>
                    </div>
                    <div class="pagamento-item-status">
                        <div class="pagamento-valor">R$ ${valor.toFixed(2).replace('.', ',')}</div>
                        <div class="pagamento-badges">
                            ${statusBadge}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    });

    listaPagamentos.innerHTML = html;
}

function getMesNome(mesNumero) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[parseInt(mesNumero) - 1] || mesNumero;
}

function getStatusBadge(status) {
    const badges = {
        'pago': '<span class="pagamento-badge pago">Pago</span>',
        'reciclado': '<span class="pagamento-badge reciclado">Reciclado</span>',
        'acordo': '<span class="pagamento-badge acordo">Acordo</span>'
    };
    return badges[status] || '';
}

// Inicializar quando o app carregar
window.addEventListener('load', () => {
    console.log('🌐 Window loaded - aguardando auth...');
    
    // Aguardar autenticação antes de inicializar FAB
    setTimeout(() => {
        console.log('⏰ Timeout - tentando inicializar FAB...');
        initPagamentosHoje();
    }, 2000);
});

// Também inicializar quando mudar de tela (caso o usuário já esteja logado)
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    
    // Observar mudanças no appState para detectar login
    const checkAuth = setInterval(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            console.log('✅ Usuário detectado:', currentUser.email);
            clearInterval(checkAuth);
            initPagamentosHoje();
        }
    }, 500);
    
    // Parar de verificar após 10 segundos
    setTimeout(() => clearInterval(checkAuth), 10000);
});


// ============================================
// NOTIFICAÇÕES PUSH - DIRETAS (SEM FCM)
// ============================================

let notificationsEnabled = false;

// Inicializar notificações push
async function initPushNotifications() {
    console.log('🔔 Inicializando notificações push...');
    
    try {
        // Verificar se é admin
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.email !== 'admin@condominio.com') {
            console.log('⚠️ Notificações disponíveis apenas para admin');
            return;
        }

        // Verificar suporte
        if (!('Notification' in window)) {
            console.warn('⚠️ Navegador não suporta notificações');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Navegador não suporta Service Workers');
            return;
        }

        // Solicitar permissão automaticamente após 3 segundos
        setTimeout(async () => {
            if (Notification.permission === 'granted') {
                console.log('✅ Permissão já concedida');
                notificationsEnabled = true;
                showToast('Notificações ativadas! Você receberá alertas de novos pagamentos.', 'success');
                return;
            }

            if (Notification.permission === 'denied') {
                console.log('❌ Permissão negada anteriormente');
                return;
            }

            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('✅ Notificações habilitadas!');
                notificationsEnabled = true;
                showToast('Notificações ativadas! Você receberá alertas de novos pagamentos.', 'success');
            } else {
                console.log('⚠️ Permissão de notificação negada');
            }
        }, 3000);

    } catch (error) {
        console.error('❌ Erro ao inicializar notificações:', error);
    }
}

// Enviar notificação quando houver novo pagamento
async function notifyNewPayment(apartamento, condominio, bloco, valor, status) {
    if (!notificationsEnabled) return;
    if (Notification.permission !== 'granted') return;
    
    try {
        console.log('📬 Enviando notificação de pagamento...');
        
        // Determinar emoji e texto baseado no status
        let emoji = '💰';
        let statusText = 'Pago';
        
        if (status === 'reciclado') {
            emoji = '♻️';
            statusText = 'Pago Reciclado';
        } else if (status === 'acordo') {
            emoji = '🤝';
            statusText = 'Acordo';
        }

        const title = `${emoji} Novo Pagamento - ${statusText}`;
        const body = `${condominio}\n${bloco} - Apt ${apartamento}\nR$ ${valor.toFixed(2).replace('.', ',')}`;

        // Verificar se tem Service Worker registrado
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Enviar via Service Worker (funciona com app fechado)
            const registration = await navigator.serviceWorker.ready;
            
            await registration.showNotification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200, 100, 200],
                tag: 'payment-notification',
                requireInteraction: true,
                silent: false,
                data: {
                    condominio,
                    bloco,
                    apartamento,
                    valor,
                    status,
                    timestamp: Date.now()
                }
            });
            
            console.log('✅ Notificação enviada via Service Worker');
        } else {
            // Fallback: notificação direta (só funciona com app aberto)
            const notification = new Notification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200, 100, 200],
                tag: 'payment-notification',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Abrir modal de pagamentos
                const modal = document.getElementById('modalPagamentosHoje');
                if (modal) {
                    modal.classList.remove('hidden');
                    carregarPagamentosHoje();
                }
            };
            
            console.log('✅ Notificação enviada diretamente');
        }

        // Vibrar também via API
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

    } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
    }
}

// Escutar cliques em notificações do Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Mensagem do SW:', event.data);
        
        if (event.data.type === 'NOTIFICATION_CLICK') {
            // Abrir modal de pagamentos
            const modal = document.getElementById('modalPagamentosHoje');
            if (modal) {
                modal.classList.remove('hidden');
                carregarPagamentosHoje();
            }
        }
    });
}

// Função global para abrir modal (chamada pelo SW)
window.openPagamentosHoje = function() {
    const modal = document.getElementById('modalPagamentosHoje');
    if (modal) {
        modal.classList.remove('hidden');
        carregarPagamentosHoje();
    }
};

// Inicializar após login
window.addEventListener('load', () => {
    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.email === 'admin@condominio.com') {
            initPushNotifications();
            setupPaymentChangeListener(); // Listener para mudanças de outros admins
        }
    }, 5000);
});

// ============================================
// LISTENER DE MUDANÇAS DE PAGAMENTO (OUTROS ADMINS)
// ============================================

// Listener para detectar mudanças feitas por outros admins
function setupPaymentChangeListener() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.email !== 'admin@condominio.com') {
        return; // Só admin principal recebe notificações
    }

    console.log('🔔 Configurando listener de mudanças de pagamento...');

    // Listener para PAYMENTS (onde os status são salvos)
    const paymentsRef = window.db.collection('payments');
    
    paymentsRef.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified' || change.type === 'added') {
                const data = change.doc.data();
                const docId = change.doc.id;
                
                // Verificar se houve mudança de status para pago/reciclado/acordo
                const statusChanged = ['pago', 'reciclado', 'acordo'].includes(data.status);
                
                // Verificar se foi modificado recentemente (últimos 10 segundos)
                const now = Date.now();
                const updatedAt = data.updatedAt?.toMillis() || data.createdAt?.toMillis() || 0;
                const isRecent = (now - updatedAt) < 10000;
                
                // Verificar se foi modificado por outro usuário
                const modifiedBy = data.lastModifiedBy || '';
                const isOtherUser = modifiedBy && modifiedBy !== currentUser.email;
                
                if (statusChanged && isRecent && isOtherUser) {
                    console.log(`📬 Mudança detectada por ${modifiedBy} em pagamento ${docId}`);
                    
                    // Buscar informações completas do apartamento
                    const apartamento = appState.apartamentos?.find(a => a.id === data.apartamentoId);
                    const bloco = appState.blocos?.find(b => b.id === data.blocoId);
                    const condominio = appState.condominios?.find(c => c.id === data.condominioId);
                    
                    // Se não encontrou nos arrays, usar dados do próprio payment
                    const condominioNome = condominio?.nome || data.condominioNome || 'Condomínio';
                    const blocoNome = bloco?.nome || data.blocoNome || (data.tipo === 'casa' ? 'Casa' : 'Bloco');
                    const aptNumero = apartamento?.numero || data.apartamentoNumero || '?';
                    const valor = data.value || 80;
                    
                    // Enviar notificação
                    notifyNewPayment(
                        aptNumero,
                        condominioNome,
                        blocoNome,
                        valor,
                        data.status
                    );
                }
            }
        });
    }, (error) => {
        console.error('❌ Erro no listener de pagamentos:', error);
    });

    console.log('✅ Listener de mudanças configurado!');
}


