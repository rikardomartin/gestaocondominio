# Script para Marcar 2025 como Pago - Via Console

## Instruções

1. Abra o sistema no navegador: https://gestaodoscondominios.web.app
2. **Faça login como Administrador**
3. Pressione **F12** para abrir o Console
4. Cole o código abaixo
5. Pressione **Enter**
6. Aguarde o processamento

## Código para Colar no Console

```javascript
(async function marcar2025Pago() {
    console.log('🚀 Iniciando script para marcar 2025 como pago...');
    
    const ano = 2025;
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    let totalCriados = 0;
    let totalErros = 0;
    
    try {
        // Importar funções do sistema
        const { 
            getCondominios,
            getBlocosByCondominio,
            getApartamentosByBloco,
            getCasasByCondominio,
            createPayment
        } = await import('./firebase-database.js');
        
        console.log('✅ Funções importadas');
        
        // Buscar condomínios
        const condominios = await getCondominios();
        console.log(`✅ Encontrados ${condominios.length} condomínios`);
        
        for (const condominio of condominios) {
            console.log(`🏢 Processando: ${condominio.nome}`);
            
            // Buscar blocos
            const blocos = await getBlocosByCondominio(condominio.id);
            
            for (const bloco of blocos) {
                const apartamentos = await getApartamentosByBloco(bloco.id);
                console.log(`  📦 ${bloco.nome}: ${apartamentos.length} apartamentos`);
                
                for (const apartamento of apartamentos) {
                    for (const mes of meses) {
                        try {
                            await createPayment({
                                apartamentoId: apartamento.id,
                                condominioId: condominio.id,
                                blocoId: bloco.id,
                                apartamentoNumero: apartamento.numero,
                                ano: ano,
                                mes: mes,
                                date: `${ano}-${mes}`,
                                type: 'condominio',
                                status: 'pago',
                                observacao: 'Pagamento automático - Script 2025',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                            totalCriados++;
                        } catch (error) {
                            totalErros++;
                        }
                    }
                }
            }
            
            // Processar casas
            const casas = await getCasasByCondominio(condominio.id);
            if (casas.length > 0) {
                console.log(`  🏡 ${casas.length} casas`);
                
                for (const casa of casas) {
                    for (const mes of meses) {
                        try {
                            await createPayment({
                                apartamentoId: casa.id,
                                condominioId: condominio.id,
                                blocoId: null,
                                apartamentoNumero: casa.numero,
                                ano: ano,
                                mes: mes,
                                date: `${ano}-${mes}`,
                                type: 'condominio',
                                status: 'pago',
                                observacao: 'Pagamento automático - Script 2025',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                            totalCriados++;
                        } catch (error) {
                            totalErros++;
                        }
                    }
                }
            }
        }
        
        console.log('='.repeat(60));
        console.log('✅ SCRIPT CONCLUÍDO!');
        console.log(`📊 Pagamentos criados: ${totalCriados}`);
        console.log(`❌ Erros: ${totalErros}`);
        console.log('='.repeat(60));
        
        alert(`✅ Script concluído!\n\nPagamentos criados: ${totalCriados}\nErros: ${totalErros}`);
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        alert('❌ Erro: ' + error.message);
    }
})();
```

## O que o Script Faz

1. Busca todos os condomínios
2. Para cada condomínio, busca todos os blocos
3. Para cada bloco, busca todos os apartamentos
4. Para cada apartamento, cria 12 pagamentos (Janeiro a Dezembro de 2025)
5. Marca todos como "PAGO"
6. Processa também as casas

## Tempo Estimado

- Pequeno (1-2 condomínios): 1-2 minutos
- Médio (3-5 condomínios): 3-5 minutos
- Grande (6+ condomínios): 5-10 minutos

## Importante

- **NÃO feche a página** enquanto o script estiver executando
- Você verá o progresso no console
- Ao final, aparecerá um alert com o resumo
- Se der erro de permissão, certifique-se de estar logado como Administrador

---

**Criado em:** 31/01/2026
