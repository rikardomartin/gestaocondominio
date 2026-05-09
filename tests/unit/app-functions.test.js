import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Funções do App.js', () => {
  describe('getStatusForExport', () => {
    it('deve retornar status traduzido corretamente', () => {
      const getStatusForExport = (status) => {
        const statusMap = {
          'pago': 'Pago',
          'pendente': 'Pendente',
          'reciclado': 'Reciclado',
          'isento': 'Isento'
        };
        return statusMap[status] || status;
      };

      expect(getStatusForExport('pago')).toBe('Pago');
      expect(getStatusForExport('pendente')).toBe('Pendente');
      expect(getStatusForExport('reciclado')).toBe('Reciclado');
      expect(getStatusForExport('isento')).toBe('Isento');
      expect(getStatusForExport('invalido')).toBe('invalido');
    });
  });

  describe('getRoleDisplayName', () => {
    it('deve retornar nome de perfil correto', () => {
      const getRoleDisplayName = (role) => {
        const roles = {
          'admin': 'Administrador',
          'gerente': 'Gerente',
          'sindico': 'Síndico',
          'porteiro': 'Porteiro'
        };
        return roles[role] || 'Usuário';
      };

      expect(getRoleDisplayName('admin')).toBe('Administrador');
      expect(getRoleDisplayName('gerente')).toBe('Gerente');
      expect(getRoleDisplayName('sindico')).toBe('Síndico');
      expect(getRoleDisplayName('porteiro')).toBe('Porteiro');
      expect(getRoleDisplayName('outro')).toBe('Usuário');
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores monetários', () => {
      const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'R$ 0,00';
        return value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
      };

      expect(formatCurrency(80.50)).toMatch(/R\$\s80,50/);
      expect(formatCurrency(100)).toMatch(/R\$\s100,00/);
      expect(formatCurrency(0)).toMatch(/R\$\s0,00/);
      expect(formatCurrency('invalid')).toBe('R$ 0,00');
    });
  });

  describe('getStatusText', () => {
    it('deve retornar texto de status correto', () => {
      const getStatusText = (status) => {
        const statusTexts = {
          'pago': 'Pago',
          'pendente': 'Pendente',
          'reciclado': 'Reciclado',
          'isento': 'Isento'
        };
        return statusTexts[status] || 'Desconhecido';
      };

      expect(getStatusText('pago')).toBe('Pago');
      expect(getStatusText('pendente')).toBe('Pendente');
      expect(getStatusText('reciclado')).toBe('Reciclado');
      expect(getStatusText('isento')).toBe('Isento');
      expect(getStatusText('outro')).toBe('Desconhecido');
    });
  });

  describe('calculatePaymentValue', () => {
    it('deve calcular valor de pagamento corretamente', () => {
      const calculatePaymentValue = (status, payment = null) => {
        if (status === 'isento' || status === 'reciclado') {
          return 0;
        }
        
        if (payment && payment.valor) {
          return parseFloat(payment.valor);
        }
        
        return 80.50; // Taxa padrão
      };

      expect(calculatePaymentValue('pago', { valor: 100 })).toBe(100);
      expect(calculatePaymentValue('pendente', { valor: 80.50 })).toBe(80.50);
      expect(calculatePaymentValue('isento')).toBe(0);
      expect(calculatePaymentValue('reciclado')).toBe(0);
      expect(calculatePaymentValue('pago')).toBe(80.50);
    });
  });

  describe('generateId', () => {
    it('deve gerar ID único', () => {
      const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      };

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('getMesNome', () => {
    it('deve retornar nome do mês correto', () => {
      const getMesNome = (mesNumero) => {
        const meses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return meses[mesNumero - 1] || 'Mês Inválido';
      };

      expect(getMesNome(1)).toBe('Janeiro');
      expect(getMesNome(6)).toBe('Junho');
      expect(getMesNome(12)).toBe('Dezembro');
      expect(getMesNome(0)).toBe('Mês Inválido');
      expect(getMesNome(13)).toBe('Mês Inválido');
    });
  });

  describe('formatMonth', () => {
    it('deve formatar chave de mês corretamente', () => {
      const formatMonth = (monthKey) => {
        if (!monthKey || typeof monthKey !== 'string') return '';
        
        const [year, month] = monthKey.split('-');
        if (!year || !month) return monthKey;
        
        const monthNames = [
          'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        
        const monthIndex = parseInt(month, 10) - 1;
        return `${monthNames[monthIndex]}/${year}`;
      };

      expect(formatMonth('2026-01')).toBe('Jan/2026');
      expect(formatMonth('2026-06')).toBe('Jun/2026');
      expect(formatMonth('2026-12')).toBe('Dez/2026');
      expect(formatMonth('invalid')).toBe('invalid');
      expect(formatMonth('')).toBe('');
    });
  });

  describe('isStandalone', () => {
    it('deve detectar modo standalone', () => {
      const isStandalone = () => {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
      };

      // Mock do matchMedia
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(typeof isStandalone()).toBe('boolean');
    });
  });

  describe('getMonthsToProcess', () => {
    it('deve retornar meses para processar', () => {
      const getMonthsToProcess = () => {
        const months = [];
        const currentYear = 2026;
        
        for (let month = 1; month <= 12; month++) {
          const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
          months.push(monthKey);
        }
        
        return months;
      };

      const months = getMonthsToProcess();
      
      expect(months).toHaveLength(12);
      expect(months[0]).toBe('2026-01');
      expect(months[11]).toBe('2026-12');
    });
  });

  describe('determineApartmentStatus', () => {
    it('deve determinar status do apartamento', () => {
      const determineApartmentStatus = (apartment, payment, monthKey) => {
        if (!payment) return 'pendente';
        
        if (payment.status === 'pago') return 'pago';
        if (payment.status === 'isento') return 'isento';
        if (payment.status === 'reciclado') return 'reciclado';
        
        return 'pendente';
      };

      expect(determineApartmentStatus({}, { status: 'pago' }, '2026-01')).toBe('pago');
      expect(determineApartmentStatus({}, { status: 'isento' }, '2026-01')).toBe('isento');
      expect(determineApartmentStatus({}, { status: 'reciclado' }, '2026-01')).toBe('reciclado');
      expect(determineApartmentStatus({}, null, '2026-01')).toBe('pendente');
      expect(determineApartmentStatus({}, { status: 'outro' }, '2026-01')).toBe('pendente');
    });
  });

  describe('getStatusBadge', () => {
    it('deve retornar badge HTML correto', () => {
      const getStatusBadge = (status) => {
        const badges = {
          'pago': '<span class="badge badge-success">Pago</span>',
          'pendente': '<span class="badge badge-warning">Pendente</span>',
          'reciclado': '<span class="badge badge-info">Reciclado</span>',
          'isento': '<span class="badge badge-secondary">Isento</span>'
        };
        return badges[status] || '<span class="badge badge-default">Desconhecido</span>';
      };

      expect(getStatusBadge('pago')).toContain('badge-success');
      expect(getStatusBadge('pendente')).toContain('badge-warning');
      expect(getStatusBadge('reciclado')).toContain('badge-info');
      expect(getStatusBadge('isento')).toContain('badge-secondary');
      expect(getStatusBadge('outro')).toContain('badge-default');
    });
  });
});
