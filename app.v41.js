// Sistema de Gestao Condominial - v40 - 2026-01-31
// Importar mÃƒÂ³dulos Firebase
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
    updateApartamento, // Ensure this is imported
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
    getCasasByCondominio,
    updateCasa,
    // FunÃƒÂ§ÃƒÂµes de taxa
    getCondominioTaxes,
    createCondominioTax,
    getCurrentTax,
    subscribeToCondominioTaxes
} from './firebase-database.js';

// Estado da aplicaÃ§Ã£o
let appState = {
    currentScreen: 'login',
    selectedCondominio: null,
    selectedBloco: null,
    selectedApartamento: null,
    currentYear: new Date().getFullYear(),
    selectedMonth: null,
    // Controle manual de perÃ­odo ativo
    activeYear: null,
    activeMonth: null,
    // SalÃ£o state
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
    // Sistema de autenticaÃ§Ã£o Firebase
    currentUser: null,
    userProfile: null,
    isAuthenticated: false,
    // Listeners para cleanup
    unsubscribeFunctions: [],
    unsubscribeSalao: null,
    // Taxa do condomÃ­nio
    condominioTaxes: [],
    currentTax: null
};

// PaginaÃ§Ã£o do painel
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

    // SalÃƒÂ£o elements
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

// InicializaÃ§Ã£o da aplicaÃ§Ã£o
document.addEventListener('DOMContentLoaded', () => {
    console.log('ðŸš€ Sistema de Gestao Condominial - Inicializando...');
    console.log('ðŸ“‹ VersÃ£o: v28 - Cache atualizado');

    try {
        initializeApp();
        console.log('âœ… Event listener DOMContentLoaded configurado');
    } catch (error) {
        console.error('âŒ Erro na inicializaÃ§Ã£o:', error);
        if (typeof showToast === 'function') {
            showToast('Erro na inicializaÃ§Ã£o do sistema', 'error');
        }
    }
});

async function initializeApp() {
    console.log('ðŸ”§ Iniciando configuraÃ§Ã£o da aplicaÃ§Ã£o...');

    try {
        // Simular carregamento com tempo mÃƒÂ­nimo para mostrar splash
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Inicializar listener de autenticaÃƒÂ§ÃƒÂ£o Firebase
        initAuthListener(handleAuthStateChange);

        // Configurar event listeners
        setupEventListeners();

        // Inicializar funcionalidades PWA
        initializePWA();

        // Mostrar interface
        elements.loading.classList.add('hidden');
        elements.header.classList.remove('hidden');
        elements.main.classList.remove('hidden');

        // A tela inicial serÃƒÂ¡ definida pelo handleAuthStateChange

        // Mostrar banner de instalaÃƒÂ§ÃƒÂ£o apÃƒÂ³s delay
        setTimeout(() => {
            if (!isStandalone() && deferredPrompt && appState.isAuthenticated) {
                showInstallBanner();
            }
        }, 3000);

        console.log('âœ… AplicaÃ§Ã£o totalmente inicializada');

    } catch (error) {
        console.error('âŒ Erro durante inicializaÃ§Ã£o:', error);
        if (typeof showToast === 'function') {
            showToast('Erro durante inicializaÃ§Ã£o: ' + error.message, 'error');
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

function exportToExcel() {
    if (!requirePermission('generateReports')) return;

    const data = getFilteredData();
    if (data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }

    const excelData = [
        ['Condominio', 'Bloco', 'Apartamento', 'Ano', 'Mes', 'Status de Pagamento', 'Observacoes / Acordo']
    ];

    const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    data.forEach(item => {
        const mesNome = monthNames[parseInt(item.mes)] || item.mes;
        excelData.push([
            item.condominio,
            item.bloco,
            item.apartamento,
            item.ano,
            mesNome,
            getStatusForExport(item.status),
            item.observacao || ''
        ]);
    });

    const csvContent = excelData.map(row => row.join('\t')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagamentos-condominio-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();

    showToast('Arquivo Excel exportado!', 'success');
}

function exportToCSV() {
    if (!requirePermission('generateReports')) return;

    const data = getFilteredData();
    if (data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }

    const csvData = [
        ['Condominio', 'Bloco', 'Apartamento', 'Ano', 'Mes', 'Status de Pagamento', 'Observacoes / Acordo']
    ];

    const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    data.forEach(item => {
        const mesNome = monthNames[parseInt(item.mes)] || item.mes;
        csvData.push([
            item.condominio,
            item.bloco,
            item.apartamento,
            item.ano,
            mesNome,
            getStatusForExport(item.status),
            item.observacao || ''
        ]);
    });

    const csvContent = csvData.map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pagamentos-condominio-${new Date().toISOString().split('T')[0]}.csv`;
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
        // Mostrar informaÃ§Ãµes do usuÃ¡rio
        if (elements.userName) elements.userName.textContent = appState.userProfile.name;
        if (elements.userRole) elements.userRole.textContent = getRoleDisplayName(appState.userProfile.role);
        if (elements.userInfo) elements.userInfo.classList.remove('hidden');

        // Aplicar classe CSS baseada no perfil
        document.body.className = `user-${appState.userProfile.role}`;

        // Controlar visibilidade de elementos baseado em permissÃµes
        updatePermissions();
    } else {
        // Esconder informaÃ§Ãµes do usuÃ¡rio
        if (elements.userInfo) elements.userInfo.classList.add('hidden');
        document.body.className = '';
    }
}

function getRoleDisplayName(role) {
    const roleNames = {
        [USER_ROLES.ADMIN]: 'Administrador',
        [USER_ROLES.OPERATOR]: 'Operador',
        [USER_ROLES.VIEWER]: 'VisualizaÃ§Ã£o'
    };
    return roleNames[role] || role;
}

function updatePermissions() {
    // Controlar botÃµes de aÃ§Ã£o baseado em permissÃµes
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

    // Controlar botÃµes de exportaÃ§Ã£o
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

    // Controlar acesso ao salÃ£o
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

    // Controlar botÃ£o de carregar dados
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
    console.log('ðŸ” Verificando permissÃ£o:', permission);
    const currentProfile = getCurrentProfile();
    console.log('ðŸ‘¤ Perfil do usuÃ¡rio:', currentProfile);

    if (!hasPermission(permission)) {
        console.error('âŒ PermissÃ£o negada para:', permission);
        showToast('VocÃª nÃ£o tem permissÃ£o para realizar esta aÃ§Ã£o', 'error');
        return false;
    }

    console.log('âœ… PermissÃ£o concedida para:', permission);
    return true;
}

// Manipular mudanÃƒÂ§as no estado de autenticaÃƒÂ§ÃƒÂ£o
function handleAuthStateChange({ user, profile }) {
    if (user && profile) {
        // UsuÃƒÂ¡rio autenticado
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
        // UsuÃƒÂ¡rio nÃƒÂ£o autenticado
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
        // Configurar listener em tempo real para condomÃƒÂ­nios
        const unsubscribe = subscribeToCondominios((condominios) => {
            appState.condominios = condominios;
            if (appState.currentScreen === 'condominios') {
                renderCondominios();
            }
        });

        appState.unsubscribeFunctions.push(unsubscribe);

    } catch (error) {
        console.error('Erro ao carregar condomÃƒÂ­nios:', error);
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
        
        // Carregar TODOS os apartamentos do condomínio para calcular status dos blocos
        if (blocos.length > 0) {
            const apartamentosPromises = blocos.map(bloco => getApartamentosByBloco(bloco.id));
            const apartamentosArrays = await Promise.all(apartamentosPromises);
            appState.apartamentos = apartamentosArrays.flat();
            
            // Carregar pagamentos do período ativo para TODOS os apartamentos
            if (appState.activeYear && appState.activeMonth) {
                const date = `${appState.activeYear}-${appState.activeMonth}`;
                const paymentsPromises = blocos.map(bloco => getPaymentsByBlocoAndPeriod(bloco.id, date));
                const paymentsArrays = await Promise.all(paymentsPromises);
                appState.payments.condominio = paymentsArrays.flat();

                // Também carregar pagamentos para CASAS (são subcoleção do condomínio)
                if (appState.casas && appState.casas.length > 0) {
                    try {
                        const casasPromises = appState.casas.map(c => getPaymentsByApartamento(c.id));
                        const casasPaymentsArrays = await Promise.all(casasPromises);
                        const casasPeriodPayments = casasPaymentsArrays.flat().filter(p =>
                            (p.date === date) || (p.ano === appState.activeYear && p.mes === appState.activeMonth)
                        );
                        // Mesclar sem duplicar
                        appState.payments.condominio = appState.payments.condominio.concat(casasPeriodPayments);
                    } catch (err) {
                        console.warn('Erro ao carregar pagamentos das casas:', err);
                    }
                }
            }
        }
        
        renderBlocos();
    } catch (error) {
        console.error('Erro ao carregar blocos e casas:', error);
        showToast('Erro ao carregar dados do condomínio', 'error');
    }
}

async function loadApartamentosData(blocoId) {
    try {
        // Mostrar loading enquanto carrega
        elements.apartamentosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Carregando apartamentos...</h3>
                <p>Aguarde um momento</p>
            </div>
        `;

        const apartamentos = await getApartamentosByBloco(blocoId);
        
        // CORRECAO: Atualizar apenas apartamentos deste bloco, mantendo os outros
        // Remover apartamentos antigos deste bloco
        appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== blocoId);
        // Adicionar apartamentos atualizados deste bloco
        appState.apartamentos = appState.apartamentos.concat(apartamentos);

        // Carregar pagamentos do bloco para o mês ativo
        if (appState.activeYear && appState.activeMonth) {
            const date = `${appState.activeYear}-${appState.activeMonth}`;
            const payments = await getPaymentsByBlocoAndPeriod(blocoId, date);
            
            // CORRECAO: Mesclar pagamentos em vez de substituir
            // Remover pagamentos antigos deste bloco
            appState.payments.condominio = appState.payments.condominio.filter(p => p.blocoId !== blocoId);
            // Adicionar pagamentos atualizados deste bloco
            appState.payments.condominio = appState.payments.condominio.concat(payments);
        }

        renderApartamentos();
    } catch (error) {
        console.error('Erro ao carregar apartamentos:', error);
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

// FunÃƒÂ§ÃƒÂ£o para inicializar estrutura dos condomÃƒÂ­nios (apenas admin)
async function carregarDadosCondominios() {
    if (!requirePermission('manageStructure')) return;

    try {
        elements.loadCondominiosBtn.disabled = true;
        elements.loadCondominiosBtn.textContent = 'Criando estrutura completa...';

        // Mostrar progresso
        showToast('Iniciando criaÃƒÂ§ÃƒÂ£o da estrutura completa (condomÃƒÂ­nios + blocos + apartamentos)...', 'info');

        await initializeCondominiosStructure();

        showToast('Estrutura completa criada com sucesso! Aguarde o carregamento...', 'success');

        // CORREÃƒâ€¡ÃƒÆ’O: Recarregar os dados na interface apÃƒÂ³s criar a estrutura
        console.log('Recarregando dados na interface...');

        // Aguardar um pouco para o Firestore processar
        setTimeout(() => {
            // O listener em tempo real deve capturar automaticamente
            // Mas vamos forÃƒÂ§ar uma atualizaÃƒÂ§ÃƒÂ£o se necessÃƒÂ¡rio
            if (appState.condominios.length === 0) {
                console.log('ForÃƒÂ§ando recarregamento...');
                loadCondominiosData();
            }

            showToast('Estrutura completa! Clique nos condomÃƒÂ­nios para ver os blocos.', 'success');
        }, 3000);

    } catch (error) {
        console.error('Erro ao carregar estrutura:', error);
        showToast('Erro ao criar estrutura dos condomÃƒÂ­nios: ' + error.message, 'error');
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

// ===== MÃ“DULO DA AGENDA DO SALÃƒO =====

function openAgendaModal() {
    console.log('ðŸŽ¯ openAgendaModal chamada');

    if (!appState.selectedCondominio) {
        console.error('âŒ Nenhum condomÃ­nio selecionado');
        showToast('Erro: Nenhum condomÃ­nio selecionado', 'error');
        return;
    }

    console.log('âœ… CondomÃ­nio selecionado:', appState.selectedCondominio.nome);

    // Atualizar tÃ­tulo do modal
    const monthNames = ['Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    if (elements.agendaModalTitle) {
        elements.agendaModalTitle.textContent = `Agenda do SalÃ£o - ${appState.selectedCondominio.nome}`;
        console.log('âœ… TÃ­tulo do modal atualizado');
    } else {
        console.error('âŒ Elemento agendaModalTitle nÃ£o encontrado');
    }

    if (elements.agendaMonthYear) {
        elements.agendaMonthYear.textContent = `${monthNames[appState.salaoCurrentMonth]} ${appState.salaoCurrentYear} `;
        console.log('âœ… SubtÃ­tulo do modal atualizado');
    } else {
        console.error('âŒ Elemento agendaMonthYear nÃ£o encontrado');
    }

    // Carregar dados da agenda
    console.log('ðŸ“Š Carregando dados da agenda...');
    loadAgendaData();

    // Mostrar modal
    if (elements.agendaModal) {
        elements.agendaModal.classList.remove('hidden');
        console.log('âœ… Modal da agenda aberto');
    } else {
        console.error('âŒ Elemento agendaModal nÃ£o encontrado');
    }
}

function hideAgendaModal() {
    if (elements.agendaModal) {
        elements.agendaModal.classList.add('hidden');
    }
}

function loadAgendaData() {
    console.log('ðŸ“Š loadAgendaData chamada');

    const currentMonth = appState.salaoCurrentMonth;
    const currentYear = appState.salaoCurrentYear;

    console.log(`ðŸ“… MÃªs / Ano atual: ${currentMonth}/${currentYear}`);
    console.log('ðŸ¢ CondomÃ­nio:', appState.selectedCondominio ? appState.selectedCondominio.nome : 'Nenhum');
    console.log('ðŸ“‹ Total de reservas:', (appState.salaoReservations && appState.salaoReservations.length) || 0);

    // Filtrar reservas do mÃªs atual
    const monthReservations = appState.salaoReservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.getMonth() === currentMonth &&
            reservationDate.getFullYear() === currentYear &&
            reservation.condominioId === appState.selectedCondominio.id;
    });

    console.log(`ðŸ“‹ Reservas do mÃªs filtradas: ${monthReservations.length}`);

    // Calcular estatÃ­sticas
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const reservedDays = monthReservations.length;
    const availableDays = daysInMonth - reservedDays;
    const paidReservations = monthReservations.filter(r => r.status === 'paid').length;

    console.log(`ðŸ“Š EstatÃ­sticas: ${availableDays} disponÃ­veis, ${reservedDays} reservados, ${paidReservations} pagos`);

    // Atualizar estatÃ­sticas no modal
    if (elements.availableDays) {
        elements.availableDays.textContent = availableDays;
        console.log('âœ… availableDays atualizado');
    }

    if (elements.reservedDays) {
        elements.reservedDays.textContent = reservedDays;
        console.log('âœ… reservedDays atualizado');
    }

    if (elements.paidReservations) {
        elements.paidReservations.textContent = paidReservations;
        console.log('âœ… paidReservations atualizado');
    }

    // Renderizar lista de reservas
    console.log('ðŸ“‹ Renderizando lista de reservas...');
    renderReservationsList(monthReservations);
}

function renderReservationsList(reservations) {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    if (reservations.length === 0) {
        if (elements.reservationsList) {
            elements.reservationsList.innerHTML = `
                <div class="reservations-empty">
                    <div class="reservations-empty-icon">ðŸ“…</div>
                    <div class="reservations-empty-text">Nenhuma reserva neste mÃªs</div>
                    <div class="reservations-empty-desc">O salÃ£o estÃ¡ completamente disponÃ­vel</div>
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

            // Buscar informaÃ§Ãµes do apartamento
            const apartment = appState.apartamentos.find(apt => apt.id === reservation.apartamentoId);
            const apartmentInfo = apartment ?
                `${apartment.tipo === 'casa' ? 'Casa' : 'Apt'} ${apartment.numero}` :
                'Apartamento nÃ£o encontrado';
            const residentName = apartment ? apartment.proprietario : 'ProprietÃ¡rio nÃ£o encontrado';

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
                    ${reservation.status === 'paid' ? 'ðŸ’° Pago' : 'ðŸ“‹ Reservado'}
                </div>
                <div class="reservation-value">
                    R$ ${reservation.value ? reservation.value.toFixed(2).replace('.', ',') : '0,00'}
                </div>
            `;

            // Adicionar evento de clique para editar reserva
            reservationElement.addEventListener('click', () => {
                hideAgendaModal();
                // Abrir modal de ediÃ§Ã£o da reserva
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
    const monthNames = ['Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Filtrar reservas do mÃªs atual
    const monthReservations = appState.salaoReservations.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        return reservationDate.getMonth() === currentMonth &&
            reservationDate.getFullYear() === currentYear &&
            reservation.condominioId === appState.selectedCondominio.id;
    });

    if (monthReservations.length === 0) {
        showToast('Nenhuma reserva para exportar neste mÃªs', 'warning');
        return;
    }

    // Preparar dados para CSV
    const csvData = [];
    csvData.push(['Data', 'Apartamento', 'ProprietÃ¡rio', 'Status', 'Valor']);

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

    // SalÃƒÂ£o calendar navigation
    if (elements.prevMonth) elements.prevMonth.addEventListener('click', () => changeSalaoMonth(-1));
    if (elements.nextMonth) elements.nextMonth.addEventListener('click', () => changeSalaoMonth(1));

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
            currentPage = 1; // Reset para primeira pÃ¡gina

            // Carregar dados do condomÃ­nio selecionado se necessÃ¡rio
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
            currentPage = 1; // Reset para primeira pÃ¡gina
            applyFiltersDebounced();
        });
    }

    if (elements.filterMes) {
        elements.filterMes.addEventListener('change', () => {
            currentPage = 1; // Reset para primeira pÃ¡gina
            applyFiltersDebounced();
        });
    }

    if (elements.clearFilters) {
        elements.clearFilters.addEventListener('click', () => {
            currentPage = 1; // Reset para primeira pÃ¡gina
            clearAllFilters();
        });
    }

    // BotÃµes de controle do painel
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

    // Apartment Modal Events - VERSÃƒÆ’O DEFINITIVA COM MÃƒÅ¡LTIPLAS PROTEÃƒâ€¡Ãƒâ€¢ES
    console.log('Ã°Å¸â€Â§ Configurando event listeners do modal de apartamento...');

    // MÃƒÂ©todo 1: Event listeners diretos nos elementos
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
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o X clicado');
            closeApartmentModal();
        });

        // Garantir que seja clicÃƒÂ¡vel
        newCloseBtn.style.setProperty('pointer-events', 'auto', 'important');
        newCloseBtn.style.setProperty('z-index', '100001', 'important');
        newCloseBtn.style.setProperty('position', 'relative', 'important');
        newCloseBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('Ã¢Å“â€¦ Event listener do botÃƒÂ£o X configurado');
    } else {
        console.warn('Ã¢Å¡Â Ã¯Â¸Â BotÃƒÂ£o closeApartmentModal nÃƒÂ£o encontrado');
    }

    if (cancelApartmentModalBtn) {
        // Remover listeners existentes
        cancelApartmentModalBtn.replaceWith(cancelApartmentModalBtn.cloneNode(true));
        const newCancelBtn = document.getElementById('cancelApartmentModal');

        newCancelBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Cancelar clicado');
            closeApartmentModal();
        });

        // Garantir que seja clicÃƒÂ¡vel
        newCancelBtn.style.setProperty('pointer-events', 'auto', 'important');
        newCancelBtn.style.setProperty('z-index', '100001', 'important');
        newCancelBtn.style.setProperty('position', 'relative', 'important');
        newCancelBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('Ã¢Å“â€¦ Event listener do botÃƒÂ£o Cancelar configurado');
    } else {
        console.warn('Ã¢Å¡Â Ã¯Â¸Â BotÃƒÂ£o cancelApartmentModal nÃƒÂ£o encontrado');
    }

    if (saveApartmentStatusBtn) {
        // Remover listeners existentes
        saveApartmentStatusBtn.replaceWith(saveApartmentStatusBtn.cloneNode(true));
        const newSaveBtn = document.getElementById('saveApartmentStatus');

        newSaveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Salvar clicado');
            saveApartmentStatusNew();
        });

        // Garantir que seja clicÃƒÂ¡vel
        newSaveBtn.style.setProperty('pointer-events', 'auto', 'important');
        newSaveBtn.style.setProperty('z-index', '100001', 'important');
        newSaveBtn.style.setProperty('position', 'relative', 'important');
        newSaveBtn.style.setProperty('cursor', 'pointer', 'important');

        console.log('Ã¢Å“â€¦ Event listener do botÃƒÂ£o Salvar configurado');
    } else {
        console.warn('Ã¢Å¡Â Ã¯Â¸Â BotÃƒÂ£o saveApartmentStatus nÃƒÂ£o encontrado');
    }

    if (apartmentModalElement) {
        // Remover listeners existentes
        apartmentModalElement.replaceWith(apartmentModalElement.cloneNode(true));
        const newModal = document.getElementById('apartmentModal');

        newModal.addEventListener('click', function (e) {
            if (e.target === newModal) {
                console.log('Ã°Å¸â€“Â±Ã¯Â¸Â Clique fora do modal');
                closeApartmentModal();
            }
        });

        // Reconfigurar elementos apÃƒÂ³s clonagem
        elements.apartmentModal = newModal;

        console.log('Ã¢Å“â€¦ Event listener do modal (clique fora) configurado');
    } else {
        console.warn('Ã¢Å¡Â Ã¯Â¸Â Modal apartmentModal nÃƒÂ£o encontrado');
    }

    // MÃƒÂ©todo 2: Event delegation no document para garantir funcionamento
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'closeApartmentModal') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o X clicado (delegation)');
            closeApartmentModal();
        }

        if (e.target && e.target.id === 'cancelApartmentModal') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Cancelar clicado (delegation)');
            closeApartmentModal();
        }

        if (e.target && e.target.id === 'saveApartmentStatus') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Salvar clicado (delegation)');
            saveApartmentStatusNew();
        }
    });

    console.log('Ã¢Å“â€¦ Event delegation configurado como backup');

    // Event listeners para mudanÃƒÂ§a de status
    const statusRadios = document.querySelectorAll('input[name="aptStatus"]');
    statusRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log('Ã°Å¸â€œâ€¹ Status selecionado:', e.target.value);
                handleStatusChange(e.target.value);
            }
        });

        // Garantir que sejam clicÃƒÂ¡veis
        radio.style.setProperty('pointer-events', 'auto', 'important');
        radio.style.setProperty('z-index', '100001', 'important');
        radio.style.setProperty('position', 'relative', 'important');
    });

    console.log('Ã¢Å“â€¦ Event listeners dos radio buttons configurados');
}

// ==========================================
// CONTROLE DE PERÃODO ATIVO (ANO/MÃŠS)
// ==========================================

function populateYearSelector() {
    if (!elements.activeYear) return;

    const currentYear = new Date().getFullYear();
    const startYear = 2024; // Ano inicial fixo
    const endYear = 2100; // AtÃ© 2100

    elements.activeYear.innerHTML = '<option value="">Selecione o ano</option>';

    // Ler período salvo no localStorage (se houver)
    const savedYear = (window.localStorage && window.localStorage.getItem('gc_activeYear')) || '';
    const savedMonth = (window.localStorage && window.localStorage.getItem('gc_activeMonth')) || '';

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
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

function handlePeriodChange() {
    const year = (elements.activeYear && elements.activeYear.value) || '';
    const month = (elements.activeMonth && elements.activeMonth.value) || '';

    appState.activeYear = year;
    appState.activeMonth = month;

    updateActivePeriodDisplay();
    console.log('ðŸ“… PerÃ­odo ativo alterado:', { year, month });

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
            if (appState.currentScreen === 'pagamentos' && typeof renderMonthsGrid === 'function') {
                renderMonthsGrid();
            }
        }
    } catch (err) {
        console.warn('Erro ao sincronizar currentYear com activeYear', err);
    }
}

function updateActivePeriodDisplay() {
    if (!elements.activePeriodText) return;

    const year = appState.activeYear;
    const month = appState.activeMonth;

    if (!year || !month) {
        elements.activePeriodText.textContent = 'Nenhum perÃ­odo selecionado';
        elements.activePeriodText.style.color = '#fbbf24'; // warning color
        return;
    }

    const monthNames = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'MarÃ§o',
        '04': 'Abril', '05': 'Maio', '06': 'Junho',
        '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
        '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };

    elements.activePeriodText.textContent = `${monthNames[month]}/${year}`;
    elements.activePeriodText.style.color = '#ffffff';
}

function checkActivePeriod() {
    if (!appState.activeYear || !appState.activeMonth) {
        showToast('Selecione o ano e mÃªs antes de continuar', 'warning');
        return false;
    }
    return true;
}

// ==========================================

function showScreen(screenName) {
    // Verificar autenticaÃƒÂ§ÃƒÂ£o para telas protegidas
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

    // Atualizar subtÃƒÂ­tulo do Dashboard (Removed)
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

// RenderizaÃƒÂ§ÃƒÂ£o de condomÃƒÂ­nios
function renderCondominios() {
    elements.condominiosList.innerHTML = '';

    if (appState.condominios.length === 0) {
        elements.condominiosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum condomÃƒÂ­nio cadastrado</h3>
                <p>Clique em "Criar Estrutura" para inicializar os condomÃƒÂ­nios</p>
            </div>
        `;
        return;
    }

    appState.condominios.forEach((condominio, index) => {
        // Usar totais do documento do condomÃƒÂ­nio se disponÃƒÂ­veis, senÃƒÂ£o tentar calcular (fallback)
        const blocosCount = condominio.totalBlocos || appState.blocos.filter(b => b.condominioId === condominio.id).length;
        const apartamentosCount = condominio.totalUnidades || appState.apartamentos.filter(a => a.condominioId === condominio.id).length;

        const condominioElement = document.createElement('div');
        condominioElement.className = 'item-card condominio-card';
        condominioElement.style.animationDelay = `${index * 0.1}s`;

        condominioElement.innerHTML = `
            <div class="card-header">
                <h3>${condominio.nome}</h3>
                <div class="card-badge">${apartamentosCount} unidades</div>
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
                        <span class="stat-number">${condominio.totalCasas || 0}</span>
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

function selectCondominio(condominio) {
    appState.selectedCondominio = condominio;
    showScreen('blocos'); // Go straight to blocos
    loadBlocosData(condominio.id);
}

// RenderizaÃƒÂ§ÃƒÂ£o de blocos
function renderBlocos() {
    elements.blocosList.innerHTML = '';

    const blocos = appState.blocos;

    if (blocos.length === 0) {
        elements.blocosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum bloco encontrado</h3>
                <p>Este condomÃƒÂ­nio nÃƒÂ£o possui blocos cadastrados</p>
            </div>
        `;
        return;
    }

    blocos.forEach((bloco, index) => {
        // ... (existing bloco rendering logic)
        const apartamentosCount = appState.apartamentos.filter(a => a.blocoId === bloco.id).length;
        const apartamentosPagos = appState.apartamentos.filter(a =>
            a.blocoId === bloco.id && a.status === 'pago'
        ).length;

        const percentualPago = apartamentosCount > 0 ?
            Math.round((apartamentosPagos / apartamentosCount) * 100) : 0;

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

    // Renderizar Casas (SeÃƒÂ§ÃƒÂ£o Separada)
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

function selectBloco(bloco) {
    appState.selectedBloco = bloco;
    showScreen('apartamentos');
    loadApartamentosData(bloco.id);
}

// RenderizaÃƒÂ§ÃƒÂ£o de apartamentos
function renderApartamentos() {
    elements.apartamentosList.innerHTML = '';

    const apartamentos = appState.apartamentos;

    if (apartamentos.length === 0) {
        elements.apartamentosList.innerHTML = `
            <div class="item-card empty-state">
                <h3>Nenhum apartamento encontrado</h3>
                <p>Este bloco nÃƒÂ£o possui apartamentos cadastrados</p>
            </div>
        `;
        return;
    }

    // Ordenar apartamentos por nÃƒÂºmero
    apartamentos.sort((a, b) => {
        const numA = parseInt(a.numero);
        const numB = parseInt(b.numero);
        return numA - numB;
    });

    apartamentos.forEach((apartamento, index) => {
        // const condominioPayments = appState.payments.condominio.filter(p => p.apartamentoId === apartamento.id);
        // const salaoPayments = appState.payments.salao.filter(p => p.apartamentoId === apartamento.id);

        // Determinar status: priorizar pagamento do período ativo (se existir),
        // caso contrário usar o campo do documento do apartamento.
        let status = 'pendente';
        if (appState.activeYear && appState.activeMonth) {
            const payment = appState.payments.condominio.find(p =>
                p.apartamentoId === apartamento.id &&
                ((p.ano === appState.activeYear && p.mes === appState.activeMonth) || (p.date === `${appState.activeYear}-${appState.activeMonth}`))
            );
            if (payment) {
                status = payment.status || 'pendente';
            } else {
                status = apartamento.status || 'pendente';
            }
        } else {
            status = apartamento.status || 'pendente';
        }

        // DEBUG: Verificar status do apartamento
        if (apartamento.status === 'acordo') {
            console.log(`ðŸŽ¯ APARTAMENTO ${apartamento.numero} COM STATUS ACORDO:`, apartamento.status);
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
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â Clique no apartamento:', apartamento.numero);

            apartamentoElement.classList.add('selected');
            apartamentoElement.style.transform = 'scale(0.98)';

            setTimeout(() => {
                console.log('Ã¢ÂÂ° Timeout executado, chamando openApartmentModal...');
                try {
                    // selectApartamento(apartamento); // Old navigation
                    openApartmentModal(apartamento); // New Modal
                } catch (error) {
                    console.error('Ã¢ÂÅ’ Erro ao abrir modal:', error);
                }

                apartamentoElement.classList.remove('selected');
                apartamentoElement.style.transform = '';
            }, 200);
        });

        elements.apartamentosList.appendChild(apartamentoElement);
    });
}

// New Apartment Modal Functions - VERSÃƒÆ’O DEFINITIVA BULLETPROOF
function openApartmentModal(apartamento) {
    console.log('ðŸŽ¯ MODAL DEFINITIVO - openApartmentModal chamada com:', apartamento);

    // VERIFICAR PERÃODO ATIVO PRIMEIRO
    if (!checkActivePeriod()) {
        return;
    }

    if (!apartamento) {
        console.error('Ã¢ÂÅ’ Apartamento nÃƒÂ£o fornecido');
        return;
    }

    // ETAPA 1: Verificar e encontrar modal
    let modal = elements.apartmentModal;
    if (!modal) {
        console.log('Ã°Å¸â€Â Modal nÃƒÂ£o encontrado em elements, buscando diretamente...');
        modal = document.getElementById('apartmentModal');
        if (modal) {
            console.log('Ã¢Å“â€¦ Modal encontrado diretamente, atualizando elements...');
            elements.apartmentModal = modal;
        } else {
            console.error('Ã¢ÂÅ’ Modal realmente nÃƒÂ£o existe no DOM - criando emergÃƒÂªncia...');
            createEmergencyModal(apartamento);
            return;
        }
    }

    console.log('Ã¢Å“â€¦ Modal encontrado, iniciando processo de abertura...');
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
            // Usar .catch porque openApartmentModal nao e async
            loadPaymentsData(apartamento.id).catch(err => {
                console.warn('Erro ao carregar pagamentos ao abrir modal:', err);
            });
        }
    } catch (err) {
        console.warn('Erro ao garantir carregamento de pagamentos do apartamento:', err);
    }

    // ETAPA 2: Configurar conteÃƒÂºdo do modal
    try {
        const tipo = apartamento.tipo === 'casa' ? 'Casa' : 'Apartamento';

        // TÃƒÂ­tulo
        const titleElement = document.getElementById('apartmentModalTitle');
        if (titleElement) {
            titleElement.textContent = `${tipo} ${apartamento.numero}`;
            console.log('Ã¢Å“â€¦ TÃƒÂ­tulo definido:', `${tipo} ${apartamento.numero}`);
        }

        // Breadcrumb
        const breadcrumbElement = document.getElementById('apartmentBreadcrumb');
        if (breadcrumbElement) {
            const condominio = (appState.selectedCondominio ? appState.selectedCondominio.nome : 'CondomÃƒÂ­nio');
            if (apartamento.tipo === 'casa') {
                breadcrumbElement.textContent = condominio + ' > Casas > ' + apartamento.numero;
            } else {
                const bloco = (appState.selectedBloco ? appState.selectedBloco.nome : 'Bloco');
                breadcrumbElement.textContent = condominio + ' > ' + bloco + ' > ' + apartamento.numero;
            }
            console.log('Ã¢Å“â€¦ Breadcrumb definido');
        }

        // Limpar formulÃƒÂ¡rio
        const radios = document.querySelectorAll('input[name="aptStatus"]');
        radios.forEach(radio => radio.checked = false);

        const observationsField = document.getElementById('apartmentObservations');
        if (observationsField) observationsField.value = '';

        // Selecionar status atual se existir
        if (apartamento.status) {
            const currentRadio = document.querySelector(`input[name="aptStatus"][value="${apartamento.status}"]`);
            if (currentRadio) {
                currentRadio.checked = true;
                console.log('Ã¢Å“â€¦ Status atual selecionado:', apartamento.status);
            }
        }

        // Preencher observaÃƒÂ§ÃƒÂµes se existir
        if (apartamento.observacao && observationsField) {
            observationsField.value = apartamento.observacao;
            console.log('Ã¢Å“â€¦ ObservaÃƒÂ§ÃƒÂµes preenchidas');
        }

        // NOVO: LÃƒÂ³gica para campo de morador (somente casas)
        const houseGroup = document.getElementById('houseResidentGroup');
        const houseInput = document.getElementById('houseResidentName');

        if (apartamento.tipo === 'casa') {
            if (houseGroup) {
                houseGroup.classList.remove('hidden');
                houseGroup.style.setProperty('display', 'block', 'important');
            }
            if (houseInput) {
                houseInput.value = apartamento.morador || '';
            }
        } else {
            if (houseGroup) {
                houseGroup.classList.add('hidden');
                houseGroup.style.setProperty('display', 'none', 'important');
            }
        }

        console.log('Ã¢Å“â€¦ ConteÃƒÂºdo do modal configurado');
    } catch (error) {
        console.error('Ã¢ÂÅ’ Erro ao configurar conteÃƒÂºdo:', error);
    }

    // ETAPA 3: FORÃƒâ€¡AR VISIBILIDADE - MÃƒâ€°TODO DEFINITIVO
    console.log('Ã°Å¸Å¡â‚¬ FORÃƒâ€¡ANDO VISIBILIDADE DO MODAL - MÃƒâ€°TODO DEFINITIVO');

    // RE-ATTACH LISTENERS (SeguranÃƒÂ§a contra falhas de inicializaÃƒÂ§ÃƒÂ£o)
    const closeBtn = document.getElementById('closeApartmentModal');
    const cancelBtn = document.getElementById('cancelApartmentModal');
    const saveBtn = document.getElementById('saveApartmentStatus');

    if (closeBtn) closeBtn.onclick = closeApartmentModal;
    if (cancelBtn) cancelBtn.onclick = closeApartmentModal;
    if (saveBtn) saveBtn.onclick = saveApartmentStatusNew;

    try {
        // MÃƒÂ©todo 1: Limpar classes problemÃƒÂ¡ticas
        modal.classList.remove('hidden');
        modal.classList.add('modal-visible');
        console.log('Ã¢Å“â€¦ Classes atualizadas');

        // MÃƒÂ©todo 2: Estilos inline com mÃƒÂ¡xima prioridade
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
        console.log('Ã¢Å“â€¦ Estilos crÃƒÂ­ticos aplicados');

        // Garantir que todos os elementos interativos sejam clicÃƒÂ¡veis
        const interactiveElements = modal.querySelectorAll('button, input, textarea, label, .status-option-card');
        interactiveElements.forEach(element => {
            element.style.setProperty('pointer-events', 'auto', 'important');
            element.style.setProperty('z-index', '100001', 'important');
            element.style.setProperty('position', 'relative', 'important');
        });
        console.log('Ã¢Å“â€¦ Todos os elementos interativos configurados para serem clicÃƒÂ¡veis');

        // Reconfigurar event listeners do modal apÃƒÂ³s forÃƒÂ§ar visibilidade
        setupModalEventListeners();

        // MÃƒÂ©todo 3: Garantir container visÃƒÂ­vel
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
            console.log('Ã¢Å“â€¦ Container configurado');
        }

        // ETAPA 4: FORÃƒâ€¡AR EVENT LISTENERS DIRETAMENTE NOS BOTÃƒâ€¢ES
        console.log('Ã°Å¸â€Â§ FORÃƒâ€¡ANDO EVENT LISTENERS DIRETAMENTE...');

        // BotÃƒÂ£o X (fechar)
        const closeBtn = document.getElementById('closeApartmentModal');
        if (closeBtn) {
            // Remover listeners antigos
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            const newCloseBtn = document.getElementById('closeApartmentModal');

            // Adicionar novo listener
            newCloseBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Ã°Å¸â€â€™ BotÃƒÂ£o X clicado - fechando modal');
                closeApartmentModal();
            });

            // ForÃƒÂ§ar estilos
            newCloseBtn.style.setProperty('pointer-events', 'auto', 'important');
            newCloseBtn.style.setProperty('z-index', '100002', 'important');
            newCloseBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('Ã¢Å“â€¦ BotÃƒÂ£o X configurado');
        }

        // BotÃƒÂ£o Cancelar
        const cancelBtn = document.getElementById('cancelApartmentModal');
        if (cancelBtn) {
            // Remover listeners antigos
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            const newCancelBtn = document.getElementById('cancelApartmentModal');

            // Adicionar novo listener
            newCancelBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Ã°Å¸â€â€™ BotÃƒÂ£o Cancelar clicado - fechando modal');
                closeApartmentModal();
            });

            // ForÃƒÂ§ar estilos
            newCancelBtn.style.setProperty('pointer-events', 'auto', 'important');
            newCancelBtn.style.setProperty('z-index', '100002', 'important');
            newCancelBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('Ã¢Å“â€¦ BotÃƒÂ£o Cancelar configurado');
        }

        // BotÃƒÂ£o Salvar
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            // Remover listeners antigos
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('saveApartmentStatus');

            // Adicionar novo listener
            newSaveBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Ã°Å¸â€™Â¾ BotÃƒÂ£o Salvar clicado - processando dados');
                saveApartmentStatusNew();
            });

            // ForÃƒÂ§ar estilos
            newSaveBtn.style.setProperty('pointer-events', 'auto', 'important');
            newSaveBtn.style.setProperty('z-index', '100002', 'important');
            newSaveBtn.style.setProperty('cursor', 'pointer', 'important');
            console.log('Ã¢Å“â€¦ BotÃƒÂ£o Salvar configurado');
        }

        // Clique fora do modal para fechar
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                console.log('Ã°Å¸â€â€™ Clique fora do modal - fechando');
                closeApartmentModal();
            }
        });

        // Configurar radio buttons
        const radioButtons = modal.querySelectorAll('input[name="aptStatus"]');
        radioButtons.forEach((radio, index) => {
            radio.style.setProperty('pointer-events', 'auto', 'important');
            radio.style.setProperty('z-index', '100002', 'important');

            radio.addEventListener('change', function (e) {
                console.log(`Ã°Å¸â€œâ€¹ Status selecionado: ${e.target.value}`);
                handleStatusChange(e.target.value);
            });
        });

        // Configurar textarea
        const textarea = document.getElementById('apartmentObservations');
        if (textarea) {
            textarea.style.setProperty('pointer-events', 'auto', 'important');
            textarea.style.setProperty('z-index', '100002', 'important');
        }

        console.log('Ã¢Å“â€¦ TODOS OS EVENT LISTENERS FORÃƒâ€¡ADOS DIRETAMENTE');

        // ETAPA 5: VerificaÃƒÂ§ÃƒÂ£o final com timeout
        setTimeout(() => {
            const computedDisplay = window.getComputedStyle(modal).display;
            const computedVisibility = window.getComputedStyle(modal).visibility;
            const computedOpacity = window.getComputedStyle(modal).opacity;

            console.log('Ã°Å¸â€Â VERIFICAÃƒâ€¡ÃƒÆ’O FINAL:');
            console.log(`  - Display: ${computedDisplay}`);
            console.log(`  - Visibility: ${computedVisibility}`);
            console.log(`  - Opacity: ${computedOpacity}`);
            console.log(`  - Z-index: ${window.getComputedStyle(modal).zIndex}`);
            console.log(`  - Classes: ${modal.className}`);

            const isVisible = computedDisplay === 'flex' &&
                computedVisibility === 'visible' &&
                parseFloat(computedOpacity) > 0;

            if (isVisible) {
                console.log('Ã°Å¸Å½â€° SUCESSO! MODAL ESTÃƒÂ COMPLETAMENTE VISÃƒÂVEL!');
                showToast('Modal aberto com sucesso!', 'success');
            } else {
                console.error('Ã¢ÂÅ’ FALHA CRÃƒÂTICA - Modal nÃƒÂ£o ficou visÃƒÂ­vel');
                console.log('Ã°Å¸Å¡Â¨ Ativando sistema de emergÃƒÂªncia...');

                // Ocultar modal problemÃƒÂ¡tico
                modal.style.display = 'none';

                // Criar modal de emergÃƒÂªncia
                createEmergencyModal(apartamento);
            }
        }, 300);

    } catch (error) {
        console.error('Ã¢ÂÅ’ ERRO CRÃƒÂTICO ao forÃƒÂ§ar visibilidade:', error);
        console.log('Ã°Å¸Å¡Â¨ Ativando sistema de emergÃƒÂªncia imediatamente...');
        createEmergencyModal(apartamento);
    }
}

// FunÃƒÂ§ÃƒÂ£o para configurar event listeners do modal quando ele abre
function setupModalEventListeners() {
    console.log('Ã°Å¸â€Â§ Reconfigurando event listeners do modal...');

    // Configurar botÃƒÂ£o fechar (X)
    const closeBtn = document.getElementById('closeApartmentModal');
    if (closeBtn) {
        closeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o X clicado (onclick)');
            closeApartmentModal();
        };

        closeBtn.style.setProperty('pointer-events', 'auto', 'important');
        closeBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('Ã¢Å“â€¦ BotÃƒÂ£o X reconfigurado');
    }

    // Configurar botÃƒÂ£o cancelar
    const cancelBtn = document.getElementById('cancelApartmentModal');
    if (cancelBtn) {
        cancelBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Cancelar clicado (onclick)');
            closeApartmentModal();
        };

        cancelBtn.style.setProperty('pointer-events', 'auto', 'important');
        cancelBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('Ã¢Å“â€¦ BotÃƒÂ£o Cancelar reconfigurado');
    }

    // Configurar botÃƒÂ£o salvar
    const saveBtn = document.getElementById('saveApartmentStatus');
    if (saveBtn) {
        saveBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Ã°Å¸â€“Â±Ã¯Â¸Â BotÃƒÂ£o Salvar clicado (onclick)');
            saveApartmentStatusNew();
        };

        saveBtn.style.setProperty('pointer-events', 'auto', 'important');
        saveBtn.style.setProperty('cursor', 'pointer', 'important');
        console.log('Ã¢Å“â€¦ BotÃƒÂ£o Salvar reconfigurado');
    }

    // Configurar radio buttons
    const radioButtons = document.querySelectorAll('#apartmentModal input[name="aptStatus"]');
    radioButtons.forEach((radio, index) => {
        radio.onclick = function (e) {
            console.log(`Ã°Å¸â€œâ€¹ Radio ${index + 1} clicado:`, e.target.value);
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
                console.log(`Ã°Å¸â€œâ€¹ Label ${index + 1} clicado, radio selecionado:`, radio.value);
                handleStatusChange(radio.value);
            }
        };

        label.style.setProperty('pointer-events', 'auto', 'important');
        label.style.setProperty('cursor', 'pointer', 'important');
    });

    console.log('Ã¢Å“â€¦ Event listeners do modal reconfigurados');
}

function closeApartmentModal() {
    console.log('Ã°Å¸â€â€™ closeApartmentModal chamada');

    const modal = elements.apartmentModal || document.getElementById('apartmentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('modal-visible');
        modal.style.display = 'none';
        console.log('Ã¢Å“â€¦ Modal fechado com sucesso');
    }

    appState.selectedApartamento = null;

    // Limpar formulÃƒÂ¡rio
    try {
        clearApartmentModalForm();
    } catch (error) {
        console.warn('Erro ao limpar formulÃƒÂ¡rio:', error);
    }
}

function clearApartmentModalForm() {
    console.log('Ã°Å¸Â§Â¹ Limpando formulÃƒÂ¡rio do modal');

    // Limpar radio buttons
    const radios = document.querySelectorAll('input[name="aptStatus"]');
    radios.forEach(radio => radio.checked = false);

    // Limpar textarea
    const observationsField = document.getElementById('apartmentObservations');
    if (observationsField) observationsField.value = '';

    const houseInput = document.getElementById('houseResidentName');
    if (houseInput) houseInput.value = '';

    console.log('Ã¢Å“â€¦ FormulÃƒÂ¡rio limpo');
}

function handleStatusChange(status) {
    console.log('Ã°Å¸â€â€ž handleStatusChange chamada com status:', status);

    // Aqui vocÃƒÂª pode adicionar lÃƒÂ³gica especÃƒÂ­fica para cada status
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

async function saveApartmentStatusNew() {
    console.log('ðŸ’¾ saveApartmentStatusNew CORRIGIDA chamada');

    // VERIFICAR PERIODO ATIVO
    if (!appState.activeYear || !appState.activeMonth) {
        alert('Erro: Selecione o ano e mes antes de salvar');
        return;
    }

    if (!appState.selectedApartamento) {
        console.error('âŒ Nenhum apartamento selecionado');
        alert('Erro: Nenhum apartamento selecionado');
        return;
    }

    const apartamento = appState.selectedApartamento;
    const statusInput = document.querySelector('input[name="aptStatus"]:checked');
    const selectedStatus = statusInput ? statusInput.value : 'pendente';
    const obsInput = document.getElementById('apartmentObservations');
    const observacoes = obsInput ? obsInput.value : '';
    const residentInput = document.getElementById('houseResidentName');
    const morador = residentInput ? residentInput.value : '';

    console.log('ðŸ“‹ Salvando pagamento para:', {
        apartamento: apartamento.numero,
        ano: appState.activeYear,
        mes: appState.activeMonth,
        status: selectedStatus,
        observacoes: observacoes
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
            blocoId: apartamento.blocoId,
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

                // Atualizar no estado local para refletir imediatamente na UI
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

                    appState.payments.condominio.push({
                        ...paymentData,
                        id: savedPaymentId
                    });
                } catch (err) {
                    console.error('Erro ao criar payment localmente:', err);
                }
            }
        }

        // NAO atualizar o status do apartamento - apenas criar/atualizar o pagamento do mes

        // Recarregar dados de pagamentos
        // if (typeof loadPaymentsData === 'function') {
        //     await loadPaymentsData(apartamento.id);
        // }

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
        console.error('âŒ Erro ao salvar:', error);
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

// FunÃƒÂ§ÃƒÂ£o de emergÃƒÂªncia DEFINITIVA - cria modal do zero se necessÃƒÂ¡rio
function createEmergencyModal(apartamento = null) {
    console.log('Ã°Å¸Å¡Â¨ CRIANDO MODAL DE EMERGÃƒÅ NCIA DEFINITIVO...');

    // Usar apartamento do estado se nÃƒÂ£o fornecido
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
        console.log('Ã°Å¸â€”â€˜Ã¯Â¸Â Modal de emergÃƒÂªncia anterior removido');
    }

    const tipo = apartamento.tipo === 'casa' ? 'Casa' : 'Apartamento';
    const condominio = (appState.selectedCondominio ? appState.selectedCondominio.nome : 'CondomÃƒÂ­nio');
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
                    ">Ãƒâ€”</button>
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
                                    ">Ã¢ÂÂ°</div>
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
                                    ">Ã¢Å“â€œ</div>
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
                                    ">Ã¢â€ Â»</div>
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
                                    ">Ã¢Å¡â€“</div>
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
                            Acordo / ObservaÃƒÂ§ÃƒÂµes
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
                        " placeholder="Digite observaÃƒÂ§ÃƒÂµes sobre o acordo ou outras informaÃƒÂ§ÃƒÂµes relevantes...">${apartamento.observacao || ''}</textarea>
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
                    " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">Salvar AlteraÃƒÂ§ÃƒÂµes</button>
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

    // Selecionar status atual ou pendente por padrÃƒÂ£o
    const currentStatus = apartamento.status || 'pendente';
    selectEmergencyStatus(currentStatus);

    console.log('Ã¢Å“â€¦ MODAL DE EMERGÃƒÅ NCIA CRIADO E EXIBIDO COM SUCESSO!');
    console.log('Ã°Å¸Å½â€° Este modal SEMPRE funciona - ÃƒÂ© impossÃƒÂ­vel falhar!');

    // Mostrar toast de sucesso
    if (typeof showToast === 'function') {
        showToast('Modal de emergÃƒÂªncia ativado - Sistema funcionando!', 'success');
    }
}
// VariÃƒÂ¡vel global para status selecionado
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

        // Definir valor padrÃƒÂ£o
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
            alert('Erro: Apartamento nÃƒÂ£o selecionado');
            return;
        }

        const observations = document.getElementById('emergencyObservations').value.trim();
        const value = document.getElementById('emergencyValue').value;
        const date = document.getElementById('emergencyDate').value;

        // ValidaÃƒÂ§ÃƒÂµes
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
            blocoId: apartamento.blocoId,
            date: currentMonth,
            type: 'condominio',
            status: selectedEmergencyStatus,
            observations: observations
        };

        // Adicionar valor apenas para pagamentos efetivos
        if (selectedEmergencyStatus === 'pago' || selectedEmergencyStatus === 'reciclado') {
            paymentData.value = parseFloat(value);
            paymentData.paymentDate = date;
        }

        // Verificar se jÃƒÂ¡ existe pagamento para este mÃƒÂªs
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

// Tornar funÃ§Ãµes de modal de emergÃªncia acessÃ­veis globalmente
window.selectEmergencyStatus = selectEmergencyStatus;
window.closeEmergencyModal = closeEmergencyModal;
window.saveEmergencyStatus = saveEmergencyStatus;

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
        elements.saveApartmentBtn.textContent = 'Salvar AlteraÃƒÂ§ÃƒÂµes';
        elements.saveApartmentBtn.disabled = false;
    }
}

/* function selectApartamento(apartamento) {
    appState.selectedApartamento = apartamento;
    showScreen('pagamentos');
    loadPaymentsData(apartamento.id);
    renderPagamentos();
} */

// RenderizaÃƒÂ§ÃƒÂ£o de pagamentos
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

// Verificar dÃƒÂ©bitos anteriores
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
        const monthNames = ['Janeiro', 'Fevereiro', 'MarÃƒÂ§o', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const oldestMonthName = monthNames[oldestDebt.month];

        elements.debtMessage.textContent = `Existem ${debtCount} mÃƒÂªs${debtCount > 1 ? 'es' : ''} em aberto. O dÃƒÂ©bito mais antigo ÃƒÂ© de ${oldestMonthName}/${oldestDebt.year}.`;
        elements.debtAlert.classList.remove('hidden');
    } else {
        elements.debtAlert.classList.add('hidden');
    }
}

// Renderizar grid de meses
function renderMonthsGrid() {
    elements.monthsGrid.innerHTML = '';

    const monthNames = ['Janeiro', 'Fevereiro', 'MarÃƒÂ§o', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    monthNames.forEach((monthName, index) => {
        const monthKey = `${appState.currentYear}-${String(index + 1).padStart(2, '0')}`;
        const payment = appState.payments.condominio.find(p =>
            p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
        );

        // Determinar status do mÃƒÂªs
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

        const value = payment ? payment.value : 285.00; // Valor padrÃƒÂ£o

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
                // Se jÃƒÂ¡ estÃƒÂ¡ pago, permitir alterar valor ou remover
                showPaymentModal(monthName, appState.currentYear, index, payment);
            } else {
                // Se nÃƒÂ£o estÃƒÂ¡ pago, permitir marcar como pago
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

    // Buscar taxa vigente para o mÃƒÂªs
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

// Confirmar pagamento do mÃƒÂªs
async function confirmMonthPayment() {
    if (!requirePermission('registerPayments')) return;

    const value = parseFloat(elements.paymentValue.value);

    if (!value || value <= 0) {
        showToast('Valor invÃƒÂ¡lido', 'error');
        return;
    }

    const monthKey = `${appState.selectedMonth.year}-${String(appState.selectedMonth.index + 1).padStart(2, '0')}`;

    try {
        // Buscar taxa vigente para o mÃƒÂªs
        const tax = await getCurrentTax(appState.selectedCondominio.id, monthKey + '-01');

        // Verificar se jÃƒÂ¡ existe pagamento
        const existingPayment = appState.payments.condominio.find(p =>
            p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
        );

        const paymentData = {
            apartamentoId: appState.selectedApartamento.id,
            date: monthKey,
            value: value,
            type: 'condominio',
            taxValue: tax.value, // Salvar valor da taxa vigente
            taxId: tax.id || null // ReferÃƒÂªncia ÃƒÂ  taxa utilizada
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

                // Verificar se jÃƒÂ¡ existe pagamento
                const existingPayment = appState.payments.condominio.find(p =>
                    p.apartamentoId === appState.selectedApartamento.id && p.date === monthKey
                );

                if (!existingPayment) {
                    // Buscar taxa vigente para o mÃƒÂªs
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
                showToast('Todos os meses jÃƒÂ¡ estÃƒÂ£o pagos!', 'warning');
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
                    <p>Adicione o primeiro pagamento de condomÃƒÂ­nio</p>
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
                    <p>Adicione o primeiro pagamento de salÃƒÂ£o</p>
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

// AdiÃƒÂ§ÃƒÂ£o de pagamentos
function addCondominioPayment() {
    const month = elements.condominioMonth.value;
    const value = parseFloat(elements.condominioValue.value);

    if (!month || !value || value <= 0) {
        showToast('Preencha todos os campos corretamente', 'error');
        return;
    }

    // Verificar se jÃƒÂ¡ existe pagamento para este mÃƒÂªs
    const existingPayment = appState.payments.condominio.find(p =>
        p.apartamentoId === appState.selectedApartamento.id && p.date === month
    );

    if (existingPayment) {
        showToast('JÃƒÂ¡ existe um pagamento para este mÃƒÂªs', 'warning');
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
        // renderSalaoPayments serÃ¡ chamado pelo listener onSnapshot de pagamentos
    } catch (error) {
        console.error('Erro ao adicionar pagamento do salÃ£o:', error);
        showToast('Erro ao salvar pagamento', 'error');
    } finally {
        elements.addSalaoPayment.classList.remove('loading');
        elements.addSalaoPayment.disabled = false;
    }
}

// Modal functions
function showAddModal(type) {
    const titles = {
        condominio: 'Adicionar CondomÃƒÂ­nio',
        bloco: 'Adicionar Bloco',
        apartamento: 'Adicionar Apartamento'
    };

    const placeholders = {
        condominio: 'Nome do condomÃƒÂ­nio',
        bloco: 'Nome do bloco',
        apartamento: 'NÃƒÂºmero do apartamento'
    };

    elements.modalTitle.textContent = titles[type];
    elements.modalInput.placeholder = placeholders[type];
    elements.modalInput.value = '';

    elements.modalConfirm.onclick = () => {
        const value = elements.modalInput.value.trim();
        if (!value) {
            showToast('Campo obrigatÃƒÂ³rio', 'error');
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
    elements.modalTitle.textContent = 'ProprietÃƒÂ¡rio do Apartamento';
    elements.modalInput.placeholder = 'Nome do proprietÃƒÂ¡rio';
    elements.modalInput.value = '';

    elements.modalConfirm.onclick = () => {
        const proprietario = elements.modalInput.value.trim();
        if (!proprietario) {
            showToast('Nome do proprietÃƒÂ¡rio ÃƒÂ© obrigatÃƒÂ³rio', 'error');
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
    // Verificar se jÃƒÂ¡ existe apartamento com este nÃƒÂºmero no bloco
    const existingApartment = appState.apartamentos.find(a =>
        a.blocoId === appState.selectedBloco.id && a.numero === numero
    );

    if (existingApartment) {
        showToast('JÃƒÂ¡ existe um apartamento com este nÃƒÂºmero', 'error');
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
    if (confirm('Tem certeza que deseja excluir este condomÃƒÂ­nio? Todos os dados relacionados serÃƒÂ£o perdidos.')) {
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
        showToast('CondomÃƒÂ­nio excluÃƒÂ­do com sucesso', 'success');
    }
}

function deleteBloco(id) {
    if (confirm('Tem certeza que deseja excluir este bloco? Todos os apartamentos e pagamentos relacionados serÃƒÂ£o perdidos.')) {
        appState.blocos = appState.blocos.filter(b => b.id !== id);

        const apartamentosIds = appState.apartamentos.filter(a => a.blocoId === id).map(a => a.id);
        appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== id);
        appState.payments.condominio = appState.payments.condominio.filter(p => !apartamentosIds.includes(p.apartamentoId));
        appState.payments.salao = appState.payments.salao.filter(p => !apartamentosIds.includes(p.apartamentoId));

        saveData();
        renderBlocos();
        showToast('Bloco excluÃƒÂ­do com sucesso', 'success');
    }
}

function deleteApartamento(id) {
    if (confirm('Tem certeza que deseja excluir este apartamento? Todos os pagamentos relacionados serÃƒÂ£o perdidos.')) {
        appState.apartamentos = appState.apartamentos.filter(a => a.id !== id);
        appState.payments.condominio = appState.payments.condominio.filter(p => p.apartamentoId !== id);
        appState.payments.salao = appState.payments.salao.filter(p => p.apartamentoId !== id);

        saveData();
        renderApartamentos();
        showToast('Apartamento excluÃƒÂ­do com sucesso', 'success');
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

        showToast('Pagamento excluÃƒÂ­do com sucesso', 'success');
    }
}

// Tornar deletePaymentLocal acessÃ­vel globalmente
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
    if (confirm('Nova versÃƒÂ£o disponÃƒÂ­vel! Deseja atualizar?')) {
        if (swRegistration && swRegistration.waiting) {
            swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

// Handle offline/online status
window.addEventListener('online', () => {
    showToast('ConexÃƒÂ£o restaurada', 'success');
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
// MÃƒÂ³dulo de SalÃƒÂ£o de Festas
function openSalao() {
    if (!requirePermission('manageSalao')) return;

    if (!appState.selectedCondominio) {
        showToast('Erro: Nenhum condomÃ­nio selecionado', 'error');
        return;
    }

    // Limpar listeners antigos do salÃ£o se existirem
    if (appState.unsubscribeSalao) {
        appState.unsubscribeSalao();
        appState.unsubscribeSalao = null;
    }

    // Ativar listener em tempo real para reservas do salÃ£o
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

    // Mostrar loading no select enquanto carrega apartamentos
    elements.apartmentSelect.innerHTML = '<option value="">Carregando apartamentos...</option>';
    elements.apartmentSelect.classList.add('loading');

    // Carregar apartamentos de forma assÃ­ncrona
    populateApartmentSelect().finally(() => {
        elements.apartmentSelect.classList.remove('loading');
    });
}

function updateCalendarHeader() {
    const monthNames = ['Janeiro', 'Fevereiro', 'MarÃƒÂ§o', 'Abril', 'Maio', 'Junho',
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

        // Verificar se hÃƒÂ¡ reserva para esta data
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

        // Adicionar evento de clique apenas para dias do mÃƒÂªs atual e nÃƒÂ£o passados
        if (isCurrentMonth && !isPast) {
            dayElement.addEventListener('click', () => {
                showReservationModal(currentDate, reservation);
            });
        } else if (isPast) {
            dayElement.style.opacity = '0.5';
            dayElement.style.cursor = 'not-allowed';
        }

        elements.calendarGrid.appendChild(dayElement);
    }
}

async function populateApartmentSelect() {
    elements.apartmentSelect.innerHTML = '<option value="">Selecione o apartamento</option>';

    if (!appState.selectedCondominio) {
        console.warn('Nenhum condomÃ­nio selecionado para popular apartamentos');
        return;
    }

    try {
        // Buscar todos os blocos do condomÃ­nio
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

        // Ordenar por bloco e depois por nÃºmero
        todosApartamentos.sort((a, b) => {
            if (a.blocoNome !== b.blocoNome) {
                return a.blocoNome.localeCompare(b.blocoNome);
            }
            const numA = parseInt(a.numero) || 0;
            const numB = parseInt(b.numero) || 0;
            return numA - numB;
        });

        // Agrupar por bloco para melhor visualizaÃ§Ã£o
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

            // Adicionar ao Ãºltimo optgroup
            const lastOptgroup = elements.apartmentSelect.lastElementChild;
            if (lastOptgroup && lastOptgroup.tagName === 'OPTGROUP') {
                lastOptgroup.appendChild(option);
            } else {
                elements.apartmentSelect.appendChild(option);
            }
        });

        console.log(`âœ… ${todosApartamentos.length} apartamentos carregados no select`);

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

        // Selecionar "reservado" por padrÃƒÂ£o
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
        showToast('Selecione o apartamento responsÃ¡vel', 'error');
        return;
    }

    if (!value || value <= 0) {
        showToast('Valor invÃ¡lido', 'error');
        return;
    }

    // Add loading state
    elements.confirmReservation.classList.add('loading');
    elements.confirmReservation.disabled = true;

    try {
        const dateString = appState.selectedDate.toISOString().split('T')[0];

        // Verificar se jÃ¡ existe reserva localmente para decidir se Ã© update ou create
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

        // Se o status for "pago", tambÃ©m adicionar aos pagamentos do edifÃ­cio
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

            // Verificar se jÃ¡ existe pagamento para evitar duplicatas (estratÃ©gia simples)
            // No Firestore idealmente farÃ­amos uma busca antes, mas como o SalÃ£o 
            // Ã© controlado, o risco Ã© menor. O listener de pagamentos cuidarÃ¡ da UI.
            await createPayment(paymentData);
            showToast('Pagamento do salÃ£o registrado!', 'success');
        }

        hideReservationModal();
        // renderCalendar serÃ¡ chamado automaticamente pelo listener onSnapshot
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
                showToast('Reserva excluÃ­da com sucesso!', 'success');
                hideReservationModal();
                // renderCalendar serÃ¡ chamado pelo listener
            } catch (error) {
                console.error('Erro ao excluir reserva:', error);
                showToast('Erro ao excluir reserva', 'error');
            } finally {
                elements.deleteReservation.disabled = false;
            }
        }
    }
}
// MÃƒÂ³dulo do Painel Geral
let currentFilters = {
    ano: new Date().getFullYear().toString(),
    condominio: '',
    bloco: '',
    mes: ''
};

let currentStatusEdit = null;

// Cache simples para nÃ£o recarregar sempre (Painel Geral)
// Sistema de retry para operaÃ§Ãµes de rede
const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    BACKOFF_MULTIPLIER: 2
};

async function withRetry(operation, context = 'operaÃ§Ã£o') {
    let lastError;

    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.warn(`âŒ Tentativa ${attempt}/${RETRY_CONFIG.MAX_RETRIES} falhou para ${context}:`, error.message);

            if (attempt < RETRY_CONFIG.MAX_RETRIES) {
                const delay = RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
                console.log(`â³ Aguardando ${delay}ms antes da prÃ³xima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`âŒ Todas as tentativas falharam para ${context}:`, lastError);
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

// ConfiguraÃ§Ãµes de performance
const PAINEL_CONFIG = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
    BATCH_SIZE: 10, // Carregar apartamentos em lotes
    MAX_CONCURRENT: 3, // MÃ¡ximo de requests simultÃ¢neos
    DEBOUNCE_DELAY: 300 // Delay para filtros
};

// Debounce para filtros
let filterDebounceTimer = null;

async function ensurePainelApartamentosLoaded(condominioId = '') {
    console.log('ðŸ”„ Carregando dados do painel...', condominioId || 'todos');
    console.log('ðŸ“Š Estado atual:', {
        condominios: appState.condominios.length,
        blocos: appState.blocos.length,
        apartamentos: appState.apartamentos.length
    });

    // Iniciar monitoramento
    performanceMonitor.start('painelDataLoad');

    try {
        // Mostrar loading
        showPainelLoading(true);

        const condominiosToLoad = condominioId
            ? appState.condominios.filter(c => c.id === condominioId)
            : appState.condominios;

        if (condominiosToLoad.length === 0) {
            console.warn('âš ï¸ Nenhum condomÃ­nio para carregar');
            showToast('Nenhum condomÃ­nio disponÃ­vel', 'warning');
            return;
        }

        console.log(`ðŸ“¦ Carregando ${condominiosToLoad.length} condomÃ­nio(s)...`);

        // Carregar em paralelo com limite de concorrÃªncia
        const loadPromises = [];
        const semaphore = new Array(PAINEL_CONFIG.MAX_CONCURRENT).fill(null);

        for (const cond of condominiosToLoad) {
            if (!cond || !cond.id) continue;

            // Verificar cache
            const cacheKey = cond.id;
            const lastUpdate = painelCache.lastUpdate.get(cacheKey);
            const now = Date.now();

            if (lastUpdate && (now - lastUpdate) < PAINEL_CONFIG.CACHE_DURATION) {
                console.log(`âœ… Cache vÃ¡lido para ${cond.nome}`);
                continue;
            }

            if (painelCache.isLoading.has(cacheKey)) {
                console.log(`â³ JÃ¡ carregando ${cond.nome}`);
                continue;
            }

            // Aguardar slot disponÃ­vel
            const slotIndex = await waitForSlot(semaphore);

            const loadPromise = loadCondominioData(cond, slotIndex, semaphore);
            loadPromises.push(loadPromise);
        }

        // Aguardar todos os carregamentos
        if (loadPromises.length > 0) {
            await Promise.allSettled(loadPromises);
            console.log('âœ… Carregamento do painel concluÃ­do');
        }

        // Finalizar monitoramento
        const metrics = performanceMonitor.end('painelDataLoad');
        if (metrics) {
            console.log(`ðŸ“Š Performance: ${metrics.duration}ms, MemÃ³ria: +${Math.round(metrics.memoryDelta / 1024)}KB`);
        }

    } catch (error) {
        console.error('âŒ Erro no carregamento do painel:', error);
        showToast('Erro ao carregar dados do painel', 'error');
        performanceMonitor.end('painelDataLoad'); // Limpar mÃ©trica em caso de erro
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
        console.log(`ðŸ—ï¸ Carregando ${condominio.nome}...`);

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

        console.log(`ðŸ“‹ ${condominio.nome}: ${blocos.length} blocos encontrados`);

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
            console.warn(`âš ï¸ ${condominio.nome}: ${sucessos} blocos carregados, ${falhas} falharam`);
        }

        // Marcar como carregado
        painelCache.lastUpdate.set(cacheKey, Date.now());
        console.log(`âœ… ${condominio.nome} carregado com sucesso (${sucessos}/${blocos.length} blocos)`);

    } catch (error) {
        console.error(`âŒ Erro ao carregar ${condominio.nome}:`, error);
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

        console.log(`âœ… ${bloco.nome}: ${apartamentos.length} apartamentos carregados`);

    } catch (error) {
        console.error(`âŒ Erro definitivo ao carregar apartamentos do ${bloco.nome}:`, error);

        // Notificar usuÃ¡rio sobre falha especÃ­fica
        showToast(`Erro ao carregar ${bloco.nome}. Alguns dados podem estar incompletos.`, 'warning');
    }
}

// Sistema de notificaÃ§Ãµes melhorado
const notificationQueue = [];
let isShowingNotification = false;

function showToast(message, type = 'info', duration = 4000) {
    // Adicionar Ã  fila se jÃ¡ estiver mostrando uma notificaÃ§Ã£o
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

    // Forçar estilos inline mínimos para evitar toasts gigantes (ex.: modais forçando estilos)
    // Mantemos classes para compatibilidade com CSS, mas garantimos um tamanho e posição razoáveis.
    try {
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.left = 'auto';
        toast.style.maxWidth = '380px';
        toast.style.width = 'auto';
        toast.style.borderRadius = '10px';
        toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
        toast.style.zIndex = '110000';
        toast.style.overflow = 'hidden';
    } catch (e) {
        // noop
    }

    // Ãcones por tipo
    const icons = {
        success: 'âœ…',
        error: 'âŒ',
        warning: 'âš ï¸',
        info: 'â„¹ï¸'
    };

    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="closeToast(this)">Ã—</button>
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

            // Mostrar prÃ³xima notificaÃ§Ã£o da fila
            if (notificationQueue.length > 0) {
                const next = notificationQueue.shift();
                displayToast(next.message, next.type, next.duration);
            }
        }, 300);
    }
}

// Tornar closeToast acessÃ­vel globalmente para uso em onclick
window.closeToast = closeToast;

// FunÃ§Ã£o para mostrar progresso de carregamento
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
        console.log(`ðŸš€ Iniciando: ${operation}`);
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

        // Log performance crÃ­tica
        if (result.duration > 2000) {
            console.warn(`âš ï¸ OperaÃ§Ã£o lenta detectada: ${operation} (${result.duration}ms)`);
        } else {
            console.log(`âœ… ${operation} concluÃ­do em ${result.duration}ms`);
        }

        if (result.memoryDelta > 10 * 1024 * 1024) { // 10MB
            console.warn(`âš ï¸ Alto uso de memÃ³ria detectado: ${operation} (+${Math.round(result.memoryDelta / 1024 / 1024)}MB)`);
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
    console.log('ðŸ” Verificando permissÃµes para painel geral...');
    console.log('ðŸ‘¤ UsuÃ¡rio atual:', appState.userProfile);
    console.log('ðŸ”‘ PermissÃ£o generateReports:', hasPermission('generateReports'));

    if (!requirePermission('generateReports')) return;

    console.log('ðŸ  Abrindo painel geral...');

    // Verificar se hÃ¡ condomÃ­nios carregados
    if (!appState.condominios || appState.condominios.length === 0) {
        console.warn('âš ï¸ Nenhum condomÃ­nio carregado');
        showToast('Nenhum condomÃ­nio encontrado. Carregue os dados primeiro.', 'warning');
        return;
    }

    console.log(`ðŸ“Š ${appState.condominios.length} condomÃ­nio(s) disponÃ­vel(is)`);
    showScreen('painel');
    showPainelLoading(true);

    // Carregamento assÃ­ncrono para nÃ£o bloquear a UI
    setTimeout(async () => {
        try {
            await ensurePainelApartamentosLoaded('');
            renderPainel();
        } catch (error) {
            console.error('âŒ Erro ao carregar painel:', error);
            showToast('Erro ao carregar painel geral', 'error');
        } finally {
            showPainelLoading(false);
        }
    }, 100);
}

function renderPainel() {
    console.log('ðŸŽ¨ Renderizando painel...');
    populateFilters();
    applyFiltersDebounced();
}

function populateFilters() {
    try {
        // Popular filtro de anos
        populateYearFilter();

        // Popular filtro de condomÃ­nios
        elements.filterCondominio.innerHTML = '<option value="">Todos os condomÃ­nios</option>';
        appState.condominios.forEach((cond, index) => {
            const option = document.createElement('option');
            option.value = cond.id;
            option.textContent = cond.nome;
            elements.filterCondominio.appendChild(option);
        });

        // Popular filtro de blocos (inicialmente todos)
        populateBlocoFilter();

        // Popular filtro de meses
        populateMonthFilter();

    } catch (error) {
        console.error('âŒ Erro ao popular filtros:', error);
    }
}

function populateYearFilter() {
    const filterAno = document.getElementById('filterAno');
    if (!filterAno) return;

    filterAno.innerHTML = '<option value="">Todos os anos</option>';
    const currentYear = new Date().getFullYear();

    // Gerar anos (atual - 2 atÃ© atual + 1)
    for (let year = currentYear + 1; year >= currentYear - 2; year--) {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year.toString();
        filterAno.appendChild(option);
    }

    // Set default value
    if (currentFilters.ano) {
        filterAno.value = currentFilters.ano;
    }
}

function populateBlocoFilter(condominioId = '') {
    elements.filterBloco.innerHTML = '<option value="">Todos os blocos</option>';

    const blocos = condominioId
        ? appState.blocos.filter(b => b.condominioId === condominioId)
        : appState.blocos;

    // Ordenar blocos por nome
    blocos.sort((a, b) => a.nome.localeCompare(b.nome));

    blocos.forEach(bloco => {
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
}

function populateMonthFilter() {
    elements.filterMes.innerHTML = '<option value="">Todos os meses</option>';

    const meses = [
        { id: '01', nome: 'Janeiro' },
        { id: '02', nome: 'Fevereiro' },
        { id: '03', nome: 'MarÃ§o' },
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

    meses.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes.id;
        option.textContent = mes.nome;
        elements.filterMes.appendChild(option);
    });
}

function updateBlocoFilter() {
    const condominioId = elements.filterCondominio.value;
    populateBlocoFilter(condominioId);

    // Limpar seleÃ§Ã£o de bloco ao trocar condomÃ­nio
    elements.filterBloco.value = '';
    currentFilters.bloco = '';
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
    console.log('ðŸ” Aplicando filtros...');

    // Iniciar monitoramento
    performanceMonitor.start('filterApplication');

    try {
        // Mostrar loading na tabela
        showTableLoading(true);

        // Atualizar filtros atuais
        const filterAnoEl = document.getElementById('filterAno');
        currentFilters.ano = filterAnoEl ? filterAnoEl.value : '';
        currentFilters.condominio = elements.filterCondominio.value;
        currentFilters.bloco = elements.filterBloco.value;
        currentFilters.mes = elements.filterMes.value;

        // Atualizar filtro de blocos se necessÃ¡rio
        if (currentFilters.condominio) {
            updateBlocoFilterOptions();
        }

        // Renderizar tabela de forma assÃ­ncrona
        setTimeout(() => {
            renderPaymentsTable();
            showTableLoading(false);

            // Finalizar monitoramento
            const metrics = performanceMonitor.end('filterApplication');
            if (metrics && metrics.duration > 500) {
                console.warn(`âš ï¸ Filtros lentos: ${metrics.duration}ms`);
            }
        }, 50);

    } catch (error) {
        console.error('âŒ Erro ao aplicar filtros:', error);
        showTableLoading(false);
        showToast('Erro ao aplicar filtros', 'error');
        performanceMonitor.end('filterApplication'); // Limpar mÃ©trica
    }
}

function updateBlocoFilterOptions() {
    const filteredBlocos = appState.blocos.filter(b => b.condominioId === currentFilters.condominio);

    // Verificar se o bloco selecionado ainda Ã© vÃ¡lido
    const blocoValido = !currentFilters.bloco ||
        filteredBlocos.some(b => b.id === currentFilters.bloco);

    if (!blocoValido) {
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
    const filterAno = document.getElementById('filterAno');
    if (filterAno) filterAno.value = new Date().getFullYear().toString();
    elements.filterCondominio.value = '';
    elements.filterBloco.value = '';
    elements.filterMes.value = '';
    currentFilters = {
        ano: new Date().getFullYear().toString(),
        condominio: '',
        bloco: '',
        mes: ''
    };
    currentPage = 1; // Reset para primeira pÃ¡gina
    populateFilters();
    applyFiltersDebounced();
}

// FunÃ§Ã£o para limpar cache manualmente
function clearPainelCache() {
    console.log('ðŸ§¹ Limpando cache do painel...');

    painelCache.condominios.clear();
    painelCache.blocos.clear();
    painelCache.apartamentos.clear();
    painelCache.lastUpdate.clear();
    painelCache.isLoading.clear();

    // Limpar tambÃ©m cache de formataÃ§Ã£o
    if (typeof monthFormatCache !== 'undefined') {
        monthFormatCache.clear();
    }

    console.log('âœ… Cache do painel limpo');
    showToast('Cache limpo com sucesso', 'success');
}

// FunÃ§Ã£o para recarregar dados forÃ§adamente
async function forceReloadPainelData() {
    console.log('ðŸ”„ ForÃ§ando recarga dos dados do painel...');

    try {
        // Limpar cache primeiro
        clearPainelCache();

        // Mostrar loading
        showPainelLoading(true);

        // Recarregar dados de todos os condomÃ­nios
        const promises = appState.condominios.map(cond =>
            ensurePainelApartamentosLoaded(cond.id)
        );
        await Promise.all(promises);

        // Resetar pÃ¡gina atual
        currentPage = 1;

        // Re-renderizar tabela
        renderPaymentsTable();

        showToast('Dados recarregados com sucesso', 'success');

    } catch (error) {
        console.error('âŒ Erro ao recarregar dados:', error);
        showToast('Erro ao recarregar dados', 'error');
    } finally {
        showPainelLoading(false);
    }
}

function getFilteredData() {
    console.log('ðŸ“Š Gerando dados filtrados...');
    const startTime = performance.now();

    const allData = [];
    const currentDate = new Date();

    // Determinar meses a processar
    const monthsToProcess = getMonthsToProcess();

    // Filtrar apartamentos por condomÃ­nio e bloco
    let filteredApartments = appState.apartamentos;
    if (currentFilters.condominio) {
        filteredApartments = filteredApartments.filter(apt => apt.condominioId === currentFilters.condominio);
    }
    if (currentFilters.bloco) {
        filteredApartments = filteredApartments.filter(apt => apt.blocoId === currentFilters.bloco);
    }

    // Cache para condomÃ­nios e blocos
    const condominioCache = new Map();
    const blocoCache = new Map();

    appState.condominios.forEach(c => condominioCache.set(c.id, c));
    appState.blocos.forEach(b => blocoCache.set(b.id, b));

    // Processar apartamentos em lotes para melhor performance
    const batchSize = 50;
    for (let i = 0; i < filteredApartments.length; i += batchSize) {
        const batch = filteredApartments.slice(i, i + batchSize);

        batch.forEach(apartment => {
            const bloco = blocoCache.get(apartment.blocoId);
            const condominio = condominioCache.get(apartment.condominioId);

            if (!bloco || !condominio) return;

            monthsToProcess.forEach(monthKey => {
                // Buscar pagamento especÃ­fico
                const payment = appState.payments.condominio.find(p =>
                    p.apartamentoId === apartment.id && p.date === monthKey
                );

                // Determinar status de forma mais eficiente
                const status = determineApartmentStatus(apartment, payment, monthKey);

                if (status) {
                    const [year, month] = monthKey.split('-');

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
                        value: payment ? (payment.value || 0) : 0,
                        status: status,
                        observacao: apartment.observacao || ''
                    });
                }
            });
        });
    }

    const endTime = performance.now();
    console.log(`âœ… Dados gerados em ${(endTime - startTime).toFixed(2)}ms - ${allData.length} registros`);

    return allData;
}

function getMonthsToProcess() {
    const selectedYear = currentFilters.ano;

    // CORREÃ‡ÃƒO: Retornar APENAS meses com pagamentos registrados
    const months = new Set();

    // Coletar APENAS meses que tÃªm pagamentos reais
    if (appState.payments.condominio && appState.payments.condominio.length > 0) {
        appState.payments.condominio.forEach(p => {
            if (p.date) {
                months.add(p.date);
            }
        });
    }

    // Se hÃ¡ filtro de ano, filtrar apenas esse ano
    if (selectedYear) {
        const filteredMonths = Array.from(months).filter(m => m.startsWith(selectedYear));

        // Se hÃ¡ filtro de mÃªs tambÃ©m, filtrar apenas esse mÃªs
        if (currentFilters.mes) {
            return filteredMonths.filter(m => m.endsWith(`-${currentFilters.mes}`));
        }

        return filteredMonths.sort();
    }

    // Se hÃ¡ filtro de mÃªs sem ano, filtrar apenas esse mÃªs
    if (currentFilters.mes) {
        return Array.from(months).filter(m => m.endsWith(`-${currentFilters.mes}`)).sort();
    }

    // Retornar todos os meses com pagamentos
    return Array.from(months).sort();
}

function determineApartmentStatus(apartment, payment, monthKey) {
    // CORREÃ‡ÃƒO: Usar APENAS o pagamento registrado, nÃ£o o status do apartamento

    // Se hÃ¡ pagamento registrado para este mÃªs, usar seu status
    if (payment) {
        return payment.status || 'pendente';
    }

    // Se NÃƒO hÃ¡ pagamento registrado, NÃƒO mostrar este mÃªs
    // (retornar null faz com que o mÃªs nÃ£o apareÃ§a na tabela)
    return null;
}

// Cache para formataÃ§Ã£o de meses
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

    // Limitar a um perÃ­odo razoÃ¡vel: Ãºltimos 12 meses atÃ© mÃªs atual
    const maxMonthsBack = 12;
    const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - maxMonthsBack, 1);

    // Coletar APENAS meses com pagamentos que estÃ£o dentro do perÃ­odo relevante
    appState.payments.condominio.forEach(payment => {
        const [year, month] = payment.date.split('-');
        const paymentDate = new Date(parseInt(year), parseInt(month) - 1, 1);

        // Adicionar apenas se estiver dentro do perÃ­odo relevante
        if (paymentDate >= cutoffDate) {
            months.add(payment.date);
        }
    });

    // Adicionar apenas mÃªs atual e Ãºltimo mÃªs (para mostrar pendÃªncias recentes)
    // Isso evita multiplicaÃ§Ã£o excessiva de meses sem pagamentos
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

// ConfiguraÃ§Ã£o de paginaÃ§Ã£o

function renderPaymentsTable() {
    console.log('ðŸŽ¨ Renderizando tabela de pagamentos...');
    const startTime = performance.now();

    try {
        const allData = getFilteredData();

        if (allData.length === 0) {
            renderEmptyTable();
            return;
        }

        // Ordenar dados por condomÃ­nio, bloco, apartamento
        allData.sort((a, b) => {
            if (a.condominio !== b.condominio) return a.condominio.localeCompare(b.condominio);
            if (a.bloco !== b.bloco) return a.bloco.localeCompare(b.bloco);
            if (a.apartamento !== b.apartamento) return a.apartamento.localeCompare(b.apartamento);
            return b.monthKey.localeCompare(a.monthKey); // MÃªs mais recente primeiro
        });

        // Implementar paginaÃ§Ã£o
        const totalPages = Math.ceil(allData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = allData.slice(startIndex, endIndex);

        // Renderizar dados da pÃ¡gina atual
        renderTableRows(pageData);

        // Atualizar informaÃ§Ãµes da tabela
        updateTableInfo(allData.length, startIndex + 1, Math.min(endIndex, allData.length), totalPages);

        // Atualizar resumo de valores
        updatePainelSummary();

        // Renderizar controles de paginaÃ§Ã£o
        renderPaginationControls(totalPages);

        const endTime = performance.now();
        console.log(`âœ… Tabela renderizada em ${(endTime - startTime).toFixed(2)}ms`);

    } catch (error) {
        console.error('âŒ Erro ao renderizar tabela:', error);
        renderErrorTable();
    }
}

function renderTableRows(data) {
    const tbody = elements.paymentsTableBody;
    tbody.innerHTML = '';

    // Usar DocumentFragment para melhor performance
    const fragment = document.createDocumentFragment();

    // Valores fixos por status (apenas para pagos)
    const valoresPorStatus = {
        pago: 80,
        reciclado: 40,
        pendente: 0,
        acordo: 0
    };

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = `table-row status-${item.status}`;

        // Calcular valor: apenas pago e reciclado tÃªm valor
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
                <div class="empty-icon">ðŸ“Š</div>
                <div class="empty-title">Nenhum registro encontrado</div>
                <div class="empty-subtitle">
                    Ajuste os filtros ou verifique se hÃ¡ dados cadastrados
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
                <div class="error-icon">âš ï¸</div>
                <div class="error-title">Erro ao carregar dados</div>
                <div class="error-subtitle">
                    Tente recarregar a pÃ¡gina ou contate o suporte
                </div>
            </td>
        </tr>
    `;
    elements.tableInfo.textContent = 'Erro no carregamento';
    hidePaginationControls();
}

function updateTableInfo(total, start, end, totalPages) {
    elements.tableInfo.textContent =
        `Mostrando ${start}-${end} de ${total} registros (PÃ¡gina ${currentPage} de ${totalPages})`;
}

/**
 * Atualiza o resumo de valores do painel
 */
function updatePainelSummary() {
    // Pegar os dados jÃ¡ filtrados (que incluem o mÃªs/ano correto)
    const filteredData = getFilteredData();

    console.log(`ðŸ“Š Calculando valores para ${filteredData.length} registros filtrados`);

    // Regras de valores - APENAS PAGO E RECICLADO TÃŠM VALOR
    const valoresRegra = {
        pago: 80,
        reciclado: 40,
        pendente: 0,
        acordo: 0
    };

    const valores = {
        totalGeral: 0,
        porStatus: {
            pago: { quantidade: 0, valor: 0 },
            pendente: { quantidade: 0, valor: 0 },
            reciclado: { quantidade: 0, valor: 0 },
            acordo: { quantidade: 0, valor: 0 }
        }
    };

    filteredData.forEach(item => {
        const status = item.status || 'pendente';
        const valorUnitario = valoresRegra[status] || 0;

        if (valores.porStatus[status]) {
            valores.porStatus[status].quantidade++;
            valores.porStatus[status].valor += valorUnitario;
            valores.totalGeral += valorUnitario;
        }
    });

    // Atualizar os elementos da UI
    const totalGeralEl = document.getElementById('totalGeral');
    const totalPagoEl = document.getElementById('totalPago');
    const totalPendenteEl = document.getElementById('totalPendente');
    const totalRecicladoEl = document.getElementById('totalReciclado');
    const totalAcordoEl = document.getElementById('totalAcordo');

    if (totalGeralEl) {
        totalGeralEl.textContent = `R$ ${valores.totalGeral.toFixed(2).replace('.', ',')}`;
    }

    if (totalPagoEl) {
        const qtd = valores.porStatus.pago.quantidade;
        const val = valores.porStatus.pago.valor;
        totalPagoEl.textContent = `${qtd} Ã— R$ 80 = R$ ${val.toFixed(2).replace('.', ',')}`;
    }

    if (totalPendenteEl) {
        const qtd = valores.porStatus.pendente.quantidade;
        totalPendenteEl.textContent = `${qtd} Ã— R$ 80 = R$ 0,00`;
    }

    if (totalRecicladoEl) {
        const qtd = valores.porStatus.reciclado.quantidade;
        const val = valores.porStatus.reciclado.valor;
        totalRecicladoEl.textContent = `${qtd} Ã— R$ 40 = R$ ${val.toFixed(2).replace('.', ',')}`;
    }

    if (totalAcordoEl) {
        const qtd = valores.porStatus.acordo.quantidade;
        totalAcordoEl.textContent = `${qtd} apts (nÃ£o somam)`;
    }

    console.log('ðŸ“Š Resumo atualizado:', valores);
}

function renderPaginationControls(totalPages) {
    let paginationContainer = document.getElementById('paginationControls');

    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'paginationControls';
        paginationContainer.className = 'pagination-controls';

        // Inserir apÃ³s a tabela
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

    // BotÃ£o anterior
    const prevBtn = createPaginationButton('â€¹ Anterior', currentPage > 1, () => {
        if (currentPage > 1) {
            currentPage--;
            renderPaymentsTable();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // NÃºmeros das pÃ¡ginas (mostrar atÃ© 5 pÃ¡ginas)
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

    // BotÃ£o prÃ³ximo
    const nextBtn = createPaginationButton('PrÃ³ximo â€º', currentPage < totalPages, () => {
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

// FunÃ§Ã£o para mapear status do apartamento para exportaÃ§Ã£o

function updateSummaryCards() {
    const data = getFilteredData();

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

// Tornar editStatus acessÃ­vel globalmente para uso em onclick
window.editStatus = editStatus;

function hideStatusModal() {
    elements.statusModal.classList.add('hidden');
    currentStatusEdit = null;
}

function confirmStatusChange() {
    if (!requirePermission('registerPayments')) return;

    if (!currentStatusEdit) return;

    const newStatus = document.querySelector('input[name="newStatus"]:checked').value;
    const [apartmentId, monthKey] = currentStatusEdit.itemId.split('-');

    // 1) Persistir status escolhido no apartamento (para refletir no Painel Geral)
    const apartamento = appState.apartamentos.find(a => a.id === apartmentId);
    if (apartamento) {
        apartamento.status = newStatus;
        // manter observaÃ§Ã£o existente do apartamento
        if (typeof updateApartamento === 'function') {
            updateApartamento(apartmentId, { status: newStatus, observacao: apartamento.observacao || '' })
                .catch(err => console.warn('Falha ao salvar status no Firebase:', err));
        }
    }

    // 2) Manter regra antiga de pagamento do Painel (pago/reciclado cria pagamento; pendente/acordo remove)
    if (newStatus === 'pago' || newStatus === 'reciclado') {
        // Verificar se jÃƒÂ¡ existe pagamento
        const existingPaymentIndex = appState.payments.condominio.findIndex(p =>
            p.apartamentoId === apartmentId && p.date === monthKey
        );

        if (existingPaymentIndex >= 0) {
            // Pagamento jÃ¡ existe, atualizar status no registro (se existir campo)
            appState.payments.condominio[existingPaymentIndex].status = newStatus;
        } else {
            // Criar novo pagamento
            const payment = {
                id: generateId(),
                apartamentoId: apartmentId,
                date: monthKey,
                value: 285.00,
                type: 'condominio',
                status: newStatus
            };
            appState.payments.condominio.push(payment);
        }
    } else {
        // Remover pagamento se existir
        appState.payments.condominio = appState.payments.condominio.filter(p =>
            !(p.apartamentoId === apartmentId && p.date === monthKey)
        );
    }

    saveData();
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
