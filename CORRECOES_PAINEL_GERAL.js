// ============================================================================
// CORREÇÕES PARA O PAINEL GERAL - Sistema de Gestão de Condomínios
// ============================================================================
// Este arquivo contém todas as correções necessárias para resolver os
// 8 problemas críticos identificados na análise do Painel Geral.
//
// INSTRUÇÕES:
// 1. Fazer backup do app.js atual
// 2. Aplicar as correções na ordem indicada
// 3. Testar cada correção individualmente
// 4. Executar testes de integração ao final
// ============================================================================

// ============================================================================
// CORREÇÃO #1: Implementar função ensure2025PaymentsLoaded()
// Localização: Adicionar após linha 5380 (após validate2025Payments)
// Severidade: 🔴 CRÍTICA
// ============================================================================

/**
 * Garante que todos os pagamentos de 2025 estejam carregados no appState
 * @returns {Promise<number>} Quantidade de pagamentos carregados
 */
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

// ============================================================================
// CORREÇÃO #2: Corrigir ordem de população do cache em getFilteredData()
// Localização: Substituir linhas 5500-5545
// Severidade: 🔴 CRÍTICA
// ============================================================================

// SUBSTITUIR a função getFilteredData() completa:
async function getFilteredData() {
    console.log('📊 Gerando dados filtrados...');
    const startTime = performance.now();

    const allData = [];

    // Determinar meses a processar ANTES de filtrar apartamentos
    const monthsToProcess = getMonthsToProcess();
    
    // Se não há mês/ano selecionado, retornar vazio (evita processar tudo)
    if (monthsToProcess.length === 0) {
        console.warn('⚠️ Nenhum período selecionado para filtrar');
        return allData;
    }

    // Filtrar apartamentos por condomínio e bloco
    let filteredApartments = appState.apartamentos;
    if (currentFilters.condominio) {
        filteredApartments = filteredApartments.filter(apt => apt.condominioId === currentFilters.condominio);
    }
    if (currentFilters.bloco) {
        filteredApartments = filteredApartments.filter(apt => apt.blocoId === currentFilters.bloco);
    }
    
    // Limitar quantidade de apartamentos processados (evita travamento)
    const MAX_APARTMENTS = 1000;
    if (filteredApartments.length > MAX_APARTMENTS) {
        // Só mostrar alerta se NÃO há filtro de condomínio
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
    
    // ✅ CORREÇÃO: Carregar pagamentos de 2025 ANTES de criar o cache
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
    
    // ✅ CORREÇÃO: Criar cache de pagamentos DEPOIS de carregar 2025
    const paymentCache = new Map();
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
                // Buscar no cache
                const paymentKey = `${apartment.id}-${monthKey}`;
                const payment = paymentCache.get(paymentKey);

                // Determinar status
                const status = determineApartmentStatus(apartment, payment, monthKey);

                const [year, month] = monthKey.split('-');

                // Calcular valor usando função centralizada
                const value = calculatePaymentValue(status, payment);

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

    const endTime = performance.now();
    console.log(`✅ Dados gerados em ${(endTime - startTime).toFixed(2)}ms - ${allData.length} registros`);

    return allData;
}

// ============================================================================
// CORREÇÃO #3: Refatorar determineApartmentStatus()
// Localização: Substituir linhas 5634-5720
// Severidade: 🔴 CRÍTICA
// ============================================================================

/**
 * Determina o status de um apartamento para um mês específico
 * CORREÇÃO: Busca SEMPRE no appState primeiro (fonte da verdade)
 * @param {Object} apartment - Objeto do apartamento
 * @param {Object} payment - Pagamento do cache (pode ser null)
 * @param {string} monthKey - Chave do mês (formato: YYYY-MM)
 * @returns {string} Status do apartamento (pago, pendente, reciclado, acordo)
 */
function determineApartmentStatus(apartment, payment, monthKey) {
    // ✅ CORREÇÃO: Buscar SEMPRE no appState primeiro (fonte da verdade)
    if (monthKey) {
        const [year, month] = monthKey.split('-');
        const realPayment = appState.payments.condominio.find(p => 
            p.apartamentoId === apartment.id && (
                p.date === monthKey ||
                (p.ano === year && p.mes === month)
            )
        );
        
        if (realPayment) {
            // DEBUG: Log para pagamentos de 2025
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

// ============================================================================
// CORREÇÃO #4: Adicionar inicialização de período ativo em openPainel()
// Localização: Substituir linhas 5019-5052
// Severidade: 🟡 ALTA
// ============================================================================

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
    
    // ✅ CORREÇÃO: Garantir que período ativo está definido
    if (!appState.activeYear || !appState.activeMonth) {
        const now = new Date();
        appState.activeYear = now.getFullYear().toString();
        appState.activeMonth = String(now.getMonth() + 1).padStart(2, '0');
        console.log(`📅 Período ativo definido: ${appState.activeYear}-${appState.activeMonth}`);
    }
    
    showScreen('painel');
    showPainelLoading(true);

    // ✅ CORREÇÃO: Aguardar carregamento de dados antes de renderizar
    setTimeout(async () => {
        try {
            // Garantir que dados do período ativo estão carregados
            await ensurePainelApartamentosLoaded('');
            
            // ✅ CORREÇÃO: Se ano 2025 está selecionado, garantir carregamento
            if (currentFilters.ano === '2025') {
                console.log('🔄 Ano 2025 detectado - garantindo carregamento...');
                await ensure2025PaymentsLoaded();
            }
            
            renderPainel();
        } catch (error) {
            console.error('❌ Erro ao carregar painel:', error);
            showToast('Erro ao carregar painel geral', 'error');
        } finally {
            showPainelLoading(false);
        }
    }, 100);
}

// ============================================================================
// CORREÇÃO #5: Atualizar populateYearFilter() para disparar carregamento
// Localização: Substituir linhas 5100-5115
// Severidade: 🟡 ALTA
// ============================================================================

function populateYearFilter() {
    if (!elements.filterAno) return;

    elements.filterAno.innerHTML = '<option value="">Todos os anos</option>';
    const currentYear = new Date().getFullYear();

    // Gerar anos de 2024 até 2040 (padronizado)
    const startYear = 2024;
    const endYear = 2040;
    
    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year;
        
        // ✅ CORREÇÃO: Selecionar 2025 por padrão E atualizar filtro
        if (year === 2025) {
            option.selected = true;
            currentFilters.ano = '2025'; // ✅ Atualizar filtro
            console.log('📅 Ano 2025 selecionado por padrão');
        }
        
        elements.filterAno.appendChild(option);
    }
    
    // ✅ CORREÇÃO: Disparar carregamento se 2025 está selecionado
    if (currentFilters.ano === '2025') {
        console.log('🔄 Ano 2025 selecionado - disparando carregamento...');
        setTimeout(async () => {
            try {
                await ensure2025PaymentsLoaded();
                console.log('✅ Pagamentos de 2025 carregados após seleção de ano');
            } catch (error) {
                console.error('❌ Erro ao carregar pagamentos de 2025:', error);
            }
        }, 100);
    }
}

// ============================================================================
// CORREÇÃO #6: Centralizar lógica de cálculo de valores
// Localização: Adicionar após linha 4520
// Severidade: 🟡 MÉDIA
// ============================================================================

/**
 * Calcula o valor de um pagamento baseado no status
 * Centraliza a lógica de cálculo para evitar inconsistências
 * @param {string} status - Status do pagamento (pago, pendente, reciclado, acordo)
 * @param {Object} payment - Objeto do pagamento (opcional)
 * @returns {number} Valor calculado
 */
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

// ============================================================================
// CORREÇÃO #7: Adicionar cache de pagamentos ao painelCache
// Localização: Substituir linhas 4565-4572
// Severidade: 🟡 MÉDIA
// ============================================================================

// SUBSTITUIR a definição do painelCache:
const painelCache = {
    condominios: new Map(),
    blocos: new Map(),
    apartamentos: new Map(),
    payments: new Map(), // ✅ ADICIONAR cache de pagamentos
    lastUpdate: new Map(),
    isLoading: new Set()
};

// ✅ ADICIONAR função para limpar cache de pagamentos
function clearPaymentsCache() {
    console.log('🧹 Limpando cache de pagamentos...');
    painelCache.payments.clear();
}

// ✅ MODIFICAR loadBlocoApartamentos() para usar cache de pagamentos
// Localização: Dentro da função loadBlocoApartamentos(), após linha 4800
// Adicionar após o carregamento de apartamentos:

// DENTRO de loadBlocoApartamentos(), substituir a seção de carregamento de pagamentos:
if (apartamentos.length > 0 && appState.activeYear && appState.activeMonth) {
    try {
        const date = `${appState.activeYear}-${appState.activeMonth}`;
        const cacheKey = `${bloco.id}-${date}`;
        
        // ✅ CORREÇÃO: Verificar cache de pagamentos
        let payments = painelCache.payments.get(cacheKey);
        
        if (!payments) {
            // Buscar do Firebase se não estiver no cache
            payments = await getPaymentsByBlocoAndPeriod(bloco.id, date);
            painelCache.payments.set(cacheKey, payments); // ✅ Cachear
            console.log(`💾 [CACHE] Pagamentos de ${bloco.nome} cacheados para ${date}`);
        } else {
            console.log(`✅ [CACHE] Usando pagamentos cacheados de ${bloco.nome} para ${date}`);
        }
        
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
        // Tratamento específico para erros 404 (sem pagamentos)
        if (paymentError.code === 'not-found' || paymentError.message?.includes('404')) {
            console.log(`ℹ️ ${bloco.nome}: Sem pagamentos para ${appState.activeYear}-${appState.activeMonth} (normal)`);
        } else {
            console.warn(`⚠️ Erro ao carregar pagamentos do ${bloco.nome}:`, paymentError);
        }
    }
}

// ============================================================================
// CORREÇÃO #8: Remover limite de 10 blocos e implementar carregamento em lotes
// Localização: Substituir linhas 5382-5452 (load2025PaymentsOnDemand)
// Severidade: 🟡 MÉDIA
// ============================================================================

/**
 * Carrega pagamentos de 2025 sob demanda para um mês específico
 * CORREÇÃO: Remove limite de 10 blocos e implementa carregamento em lotes
 */
async function load2025PaymentsOnDemand(monthKey) {
    console.log(`🔄 [2025] Carregando pagamentos para ${monthKey} sob demanda...`);
    
    try {
        const [year, month] = monthKey.split('-');
        const date = `${year}-${month}`;
        
        // Obter blocos relevantes baseado nos filtros
        let targetBlocos = [];
        
        if (currentFilters.bloco) {
            // Se há filtro de bloco, usar apenas esse bloco
            targetBlocos = appState.blocos.filter(b => b.id === currentFilters.bloco);
        } else if (currentFilters.condominio) {
            // Se há filtro de condomínio, usar todos os blocos desse condomínio
            targetBlocos = appState.blocos.filter(b => b.condominioId === currentFilters.condominio);
        } else {
            // ✅ CORREÇÃO: Carregar TODOS os blocos, mas em lotes
            targetBlocos = appState.blocos;
            
            if (targetBlocos.length > 50) {
                console.warn(`⚠️ [2025] Muitos blocos (${targetBlocos.length}). Recomenda-se usar filtros.`);
                showToast('Carregando muitos dados. Use filtros para melhor performance.', 'warning');
            }
            
            console.log(`🔄 [2025] Carregando ${targetBlocos.length} blocos...`);
        }
        
        let loadedCount = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let recycledCount = 0;
        
        // ✅ CORREÇÃO: Processar em lotes de 10 para não sobrecarregar
        const BATCH_SIZE = 10;
        for (let i = 0; i < targetBlocos.length; i += BATCH_SIZE) {
            const batch = targetBlocos.slice(i, i + BATCH_SIZE);
            
            // Processar lote em paralelo
            await Promise.all(batch.map(async (bloco) => {
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
            }));
            
            // Log de progresso
            const processed = Math.min(i + BATCH_SIZE, targetBlocos.length);
            console.log(`📊 [2025] Processados ${processed}/${targetBlocos.length} blocos`);
        }
        
        console.log(`✅ [2025] Carregados ${loadedCount} novos pagamentos para ${monthKey}`);
        console.log(`📊 [2025] Status: ${paidCount} pagos, ${pendingCount} pendentes, ${recycledCount} reciclados`);
        
        return loadedCount;
        
    } catch (error) {
        console.error('❌ [2025] Erro ao carregar pagamentos sob demanda:', error);
        return 0;
    }
}

// ============================================================================
// CORREÇÃO ADICIONAL: Atualizar renderTableRows para usar função centralizada
// Localização: Substituir linha 5810 em renderTableRows()
// ============================================================================

// DENTRO de renderTableRows(), substituir:
// const valorCalculado = valoresPorStatus[item.status] || 0;
// POR:
const valorCalculado = calculatePaymentValue(item.status);

// ============================================================================
// CORREÇÃO ADICIONAL: Limpar cache ao mudar filtros
// Localização: Adicionar no início de applyFilters() (linha 5190)
// ============================================================================

function applyFilters() {
    console.log('🔍 Aplicando filtros...');

    // ✅ CORREÇÃO: Limpar cache de pagamentos ao mudar filtros
    if (currentFilters.ano !== elements.filterAno?.value ||
        currentFilters.condominio !== elements.filterCondominio.value ||
        currentFilters.bloco !== elements.filterBloco.value ||
        currentFilters.mes !== elements.filterMes.value) {
        
        console.log('🧹 Filtros mudaram - limpando cache de pagamentos');
        clearPaymentsCache();
    }

    // ... resto do código existente ...
}

// ============================================================================
// FIM DAS CORREÇÕES
// ============================================================================

console.log('✅ Todas as correções do Painel Geral foram definidas');
console.log('📋 Total de correções: 8 (3 críticas, 2 altas, 3 médias)');
console.log('🔧 Aplique as correções na ordem indicada para melhor resultado');
