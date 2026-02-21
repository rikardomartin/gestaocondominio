// PATCH: Adicionar carregamento de status do periodo ativo
// Este arquivo deve ser carregado DEPOIS do app.js

console.log('🔧 [PATCH] Aplicando correcao de status do modal...');

// Aguardar app.js carregar
setTimeout(() => {
    if (typeof window.openApartmentModal === 'function') {
        const originalOpenApartmentModal = window.openApartmentModal;
        
        window.openApartmentModal = function(apartamento) {
            console.log('🔍 [PATCH] Interceptando openApartmentModal...');
            
            // Carregar status do periodo ativo ANTES de abrir o modal
            if (apartamento && window.appState && window.appState.activeYear && window.appState.activeMonth) {
                console.log('🔍 [PATCH] Buscando pagamento do periodo ativo...');
                console.log('📊 [PATCH] Total pagamentos:', window.appState.payments.condominio.length);
                
                const payment = window.appState.payments.condominio.find(p =>
                    p.apartamentoId === apartamento.id &&
                    p.ano === window.appState.activeYear &&
                    p.mes === window.appState.activeMonth
                );
                
                if (payment) {
                    console.log('✅ [PATCH] Pagamento encontrado:', payment.status);
                    apartamento.status = payment.status;
                    apartamento.observacao = payment.observacao || '';
                } else {
                    console.log('⚠️ [PATCH] Nenhum pagamento - usando pendente');
                    apartamento.status = 'pendente';
                    apartamento.observacao = '';
                }
            } else {
                console.log('⚠️ [PATCH] Periodo ativo nao definido ou apartamento invalido');
            }
            
            // Chamar funcao original
            originalOpenApartmentModal(apartamento);
        };
        
        console.log('✅ [PATCH] openApartmentModal interceptada com sucesso!');
    } else {
        console.error('❌ [PATCH] openApartmentModal nao encontrada');
    }
}, 2000); // Aguardar 2 segundos para garantir que app.js carregou
