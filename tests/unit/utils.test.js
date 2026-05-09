import { describe, it, expect } from 'vitest';

describe('Funções Utilitárias', () => {
  describe('Formatação de Data', () => {
    it('deve formatar data no padrão brasileiro', () => {
      // Usar UTC para evitar problemas de timezone
      const data = new Date('2026-05-06T00:00:00Z');
      const formatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      expect(formatada).toBe('06/05/2026');
    });

    it('deve criar período no formato YYYY-MM', () => {
      const ano = 2026;
      const mes = 5;
      const periodo = `${ano}-${String(mes).padStart(2, '0')}`;
      expect(periodo).toBe('2026-05');
    });
  });

  describe('Validação de Email', () => {
    it('deve validar email correto', () => {
      const email = 'admin@condominio.com';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(regex.test(email)).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      const email = 'admin@';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(regex.test(email)).toBe(false);
    });

    it('deve rejeitar email sem @', () => {
      const email = 'admincondominio.com';
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(regex.test(email)).toBe(false);
    });
  });

  describe('Cálculo de Percentual', () => {
    it('deve calcular percentual corretamente', () => {
      const pagos = 75;
      const total = 100;
      const percentual = Math.round((pagos / total) * 100);
      expect(percentual).toBe(75);
    });

    it('deve retornar 0 quando total é 0', () => {
      const pagos = 0;
      const total = 0;
      const percentual = total > 0 ? Math.round((pagos / total) * 100) : 0;
      expect(percentual).toBe(0);
    });

    it('deve retornar 100 quando todos pagos', () => {
      const pagos = 50;
      const total = 50;
      const percentual = Math.round((pagos / total) * 100);
      expect(percentual).toBe(100);
    });
  });

  describe('Formatação de Moeda', () => {
    it('deve formatar valor em reais', () => {
      const valor = 80.50;
      const formatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      // Usar regex para aceitar espaço normal ou NBSP
      expect(formatado).toMatch(/R\$\s80,50/);
    });

    it('deve formatar valor inteiro', () => {
      const valor = 100;
      const formatado = valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      // Usar regex para aceitar espaço normal ou NBSP
      expect(formatado).toMatch(/R\$\s100,00/);
    });
  });

  describe('Status de Pagamento', () => {
    it('deve identificar status válidos', () => {
      const statusValidos = ['pago', 'pendente', 'reciclado', 'isento'];
      
      expect(statusValidos.includes('pago')).toBe(true);
      expect(statusValidos.includes('pendente')).toBe(true);
      expect(statusValidos.includes('reciclado')).toBe(true);
      expect(statusValidos.includes('isento')).toBe(true);
    });

    it('deve rejeitar status inválidos', () => {
      const statusValidos = ['pago', 'pendente', 'reciclado', 'isento'];
      
      expect(statusValidos.includes('invalido')).toBe(false);
      expect(statusValidos.includes('')).toBe(false);
      expect(statusValidos.includes(null)).toBe(false);
    });
  });

  describe('Geração de Código de Apartamento', () => {
    it('deve gerar código no formato correto', () => {
      const condominio = 'DES';
      const bloco = '01';
      const numero = '101';
      const codigo = `${condominio}-${bloco}-${numero}`;
      
      expect(codigo).toBe('DES-01-101');
      expect(codigo).toMatch(/^[A-Z]{3}-\d{2}-\d{3}$/);
    });

    it('deve validar formato de código', () => {
      const regex = /^[A-Z]{3}-\d{2}-\d{3}$/;
      
      expect(regex.test('DES-01-101')).toBe(true);
      expect(regex.test('VID-05-203')).toBe(true);
      expect(regex.test('AYR-22-405')).toBe(true);
      expect(regex.test('INVALID')).toBe(false);
      expect(regex.test('DES-1-101')).toBe(false);
    });
  });

  describe('Validação de Período', () => {
    it('deve validar período no formato MM/YYYY', () => {
      const validarPeriodo = (periodo) => {
        const regex = /^(\d{2})\/(\d{4})$/;
        const match = periodo.match(regex);
        if (!match) return false;
        
        const mes = parseInt(match[1], 10);
        return mes >= 1 && mes <= 12;
      };
      
      expect(validarPeriodo('01/2026')).toBe(true);
      expect(validarPeriodo('12/2025')).toBe(true);
      expect(validarPeriodo('1/2026')).toBe(false);
      expect(validarPeriodo('13/2026')).toBe(false);
      expect(validarPeriodo('00/2026')).toBe(false);
    });

    it('deve validar mês entre 1 e 12', () => {
      const validarMes = (mes) => mes >= 1 && mes <= 12;
      
      expect(validarMes(1)).toBe(true);
      expect(validarMes(12)).toBe(true);
      expect(validarMes(0)).toBe(false);
      expect(validarMes(13)).toBe(false);
    });
  });
});
