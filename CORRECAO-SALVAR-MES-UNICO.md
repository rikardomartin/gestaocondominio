# CORREÇÃO: Salvar Status Apenas para o Mês Ativo

## Problema Identificado:
Ao marcar um apartamento como "pago" em janeiro/2026, o sistema está marcando como pago em TODOS os meses (dez, nov, out, set, ago, jul, jun).

## Causa:
A função `saveApartmentStatusNew()` está salvando o status no **objeto do apartamento** em vez de criar um **registro de pagamento específico para aquele mês**.

## Solução:
Modificar a função para criar um registro de pagamento com ano/mês específico.

---

## CÓDIGO CORRETO:

Substitua a função `saveApartmentStatusNew()` no arquivo `app.js` (linha ~1663) por:

```javascript
async function saveApartmentStatusNew() {
    console.log('💾 saveApartmentStatusNew chamada');

    // VERIFICAR PERÍODO ATIVO
    if (!appState.activeYear || !appState.activeMonth) {
        alert('Erro: Selecione o ano e mês antes de salvar');
        return;
    }

    if (!appState.selectedApartamento) {
        console.error('❌ Nenhum apartamento selecionado');
        alert('Erro: Nenhum apartamento selecionado');
        return;
    }

    const apartamento = appState.selectedApartamento;
    const selectedStatus = document.querySelector('input[name="aptStatus"]:checked')?.value || 'pendente';
    const observacoes = document.getElementById('apartmentObservations')?.value || '';
    const morador = document.getElementById('houseResidentName')?.value || '';

    console.log('📋 Salvando pagamento para:', {
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

        // Criar estrutura de pagamento ESPECÍFICA para o mês ativo
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

        // Verificar se já existe pagamento para este mês
        const existingPayments = appState.payments.condominio.filter(p =>
            p.apartamentoId === apartamento.id &&
            p.ano === appState.activeYear &&
            p.mes === appState.activeMonth
        );

        if (existingPayments.length > 0) {
            // Atualizar pagamento existente
            if (typeof updatePayment === 'function') {
                await updatePayment(existingPayments[0].id, paymentData);
                console.log('✅ Pagamento atualizado no Firebase');
            }
        } else {
            // Criar novo pagamento
            if (typeof createPayment === 'function') {
                await createPayment(paymentData);
                console.log('✅ Novo pagamento criado no Firebase');
            }
        }

        // NÃO atualizar o status do apartamento - apenas criar/atualizar o pagamento do mês

        // Recarregar dados de pagamentos
        if (typeof loadPaymentsData === 'function') {
            await loadPaymentsData(apartamento.id);
        }

        // Fechar modal
        closeApartmentModal();

        // Mostrar sucesso
        if (typeof showToast === 'function') {
            showToast(`Status salvo para ${appState.activeMonth}/${appState.activeYear}`, 'success');
        }

        // Restaurar botão
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alterações';
            saveBtn.disabled = false;
        }

    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);

        // Restaurar botão
        const saveBtn = document.getElementById('saveApartmentStatus');
        if (saveBtn) {
            saveBtn.textContent = 'Salvar Alterações';
            saveBtn.disabled = false;
        }
    }
}
```

---

## O que mudou:

1. ✅ **Verifica período ativo** no início
2. ✅ **Cria registro de pagamento** com ano/mês específico
3. ✅ **NÃO atualiza o apartamento** - apenas cria/atualiza o pagamento
4. ✅ **Verifica se já existe pagamento** para aquele mês antes de criar
5. ✅ **Usa `createPayment()` ou `updatePayment()`** em vez de `updateApartamento()`
6. ✅ **Mensagem de sucesso** mostra o mês/ano salvo

---

## Resultado Esperado:

Ao marcar apartamento 101 como "PAGO" em **Janeiro/2026**:
- ✅ Cria registro: `apartamento 101 - janeiro/2026 - PAGO`
- ✅ Outros meses permanecem sem registro (pendente)
- ✅ Para marcar fevereiro, precisa mudar o mês ativo e salvar novamente

---

## Próximos Passos:

1. Substituir a função no `app.js`
2. Limpar cache (`limpar-cache.html`)
3. Testar salvando status em janeiro
4. Verificar que outros meses não foram afetados
