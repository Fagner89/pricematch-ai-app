import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Storage Wrapper - Usa Capacitor Preferences em mobile e localStorage no web
 * Garante persistência de dados em dispositivos móveis
 */

const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Migração automática de dados do localStorage para Preferences
 * Executada uma única vez na primeira utilização
 */
const migrateFromLocalStorage = async () => {
  if (!isNativePlatform()) return;
  
  const migrationKey = '_storage_migrated';
  const { value: migrated } = await Preferences.get({ key: migrationKey });
  
  if (migrated === 'true') return; // Já migrado
  
  console.log('[Storage] Iniciando migração do localStorage para Preferences...');
  
  try {
    const keys = Object.keys(localStorage);
    let migratedCount = 0;
    
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        await Preferences.set({ key, value });
        migratedCount++;
      }
    }
    
    await Preferences.set({ key: migrationKey, value: 'true' });
    console.log(`[Storage] Migração concluída: ${migratedCount} itens migrados`);
  } catch (error) {
    console.error('[Storage] Erro durante migração:', error);
  }
};

// Executar migração ao carregar o módulo
if (isNativePlatform()) {
  migrateFromLocalStorage();
}

/**
 * Storage API compatível com localStorage
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.set({ key, value });
      // Backup automático a cada salvamento crítico
      if (isCriticalKey(key)) {
        await createBackup(key, value);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    if (isNativePlatform()) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  },

  async keys(): Promise<string[]> {
    if (isNativePlatform()) {
      const { keys } = await Preferences.keys();
      return keys;
    }
    return Object.keys(localStorage);
  }
};

/**
 * Helpers para gerenciamento de dados
 */

// Chaves críticas que devem ter backup automático
const criticalKeys = [
  'dadosLoja',
  'produtos',
  'insumos',
  'plataformas',
  'unidades',
  'margem',
  'pedidos',
  'estoque',
  'movimentacoes'
];

const isCriticalKey = (key: string): boolean => {
  return criticalKeys.includes(key);
};

/**
 * Sistema de Backup Automático
 */
const createBackup = async (key: string, value: string): Promise<void> => {
  const backupKey = `backup_${key}`;
  const timestamp = new Date().toISOString();
  const backupData = {
    data: value,
    timestamp,
    versao: '1.0'
  };
  
  try {
    await Preferences.set({ 
      key: backupKey, 
      value: JSON.stringify(backupData) 
    });
  } catch (error) {
    console.error(`[Storage] Erro ao criar backup de ${key}:`, error);
  }
};

/**
 * Restaurar dados do backup
 */
export const restoreFromBackup = async (key: string): Promise<string | null> => {
  const backupKey = `backup_${key}`;
  
  try {
    const { value } = await Preferences.get({ key: backupKey });
    if (!value) return null;
    
    const backupData = JSON.parse(value);
    console.log(`[Storage] Restaurando backup de ${key} (${backupData.timestamp})`);
    return backupData.data;
  } catch (error) {
    console.error(`[Storage] Erro ao restaurar backup de ${key}:`, error);
    return null;
  }
};

/**
 * Sistema de Histórico de Vendas
 */
export const historicoVendas = {
  async salvarVendaDoDia(data: string, vendaData: { total: number; quantidade: number; pedidoIds: string[] }): Promise<void> {
    const historicoKey = 'historicoVendas';
    const historicoAtual = await storage.getItem(historicoKey);
    const historico = historicoAtual ? JSON.parse(historicoAtual) : {};
    
    historico[data] = vendaData;
    
    await storage.setItem(historicoKey, JSON.stringify(historico));
  },

  async obterVendasDoDia(data: string): Promise<{ total: number; quantidade: number; pedidoIds: string[] } | null> {
    const historicoKey = 'historicoVendas';
    const historicoAtual = await storage.getItem(historicoKey);
    
    if (!historicoAtual) return null;
    
    const historico = JSON.parse(historicoAtual);
    return historico[data] || null;
  },

  async obterHistoricoCompleto(): Promise<Record<string, { total: number; quantidade: number; pedidoIds: string[] }>> {
    const historicoKey = 'historicoVendas';
    const historicoAtual = await storage.getItem(historicoKey);
    
    return historicoAtual ? JSON.parse(historicoAtual) : {};
  }
};

/**
 * Exportar/Importar dados (para backup manual)
 */
export const exportData = async (): Promise<string> => {
  const allKeys = await storage.keys();
  const exportData: Record<string, string> = {};
  
  for (const key of allKeys) {
    if (!key.startsWith('_') && !key.startsWith('backup_')) {
      const value = await storage.getItem(key);
      if (value) {
        exportData[key] = value;
      }
    }
  }
  
  return JSON.stringify({
    versao: '1.0',
    dataExportacao: new Date().toISOString(),
    dados: exportData
  }, null, 2);
};

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const imported = JSON.parse(jsonData);
    
    if (!imported.dados) {
      throw new Error('Formato de dados inválido');
    }
    
    for (const [key, value] of Object.entries(imported.dados)) {
      await storage.setItem(key, value as string);
    }
    
    console.log('[Storage] Dados importados com sucesso');
    return true;
  } catch (error) {
    console.error('[Storage] Erro ao importar dados:', error);
    return false;
  }
};

/**
 * Gerenciamento de Vendas Diárias
 * Mantém cache de vendas do dia atual + histórico completo
 */
export const vendasDiarias = {
  async atualizarVendasHoje(novoTotal: number, novaQuantidade: number, pedidoId: string): Promise<void> {
    const hoje = new Date().toDateString();
    
    // Atualizar cache rápido
    const vendasHojeCache = {
      data: hoje,
      total: novoTotal,
      quantidade: novaQuantidade,
      ultimaAtualizacao: new Date().toISOString()
    };
    await storage.setItem('vendasHoje', JSON.stringify(vendasHojeCache));
    
    // Atualizar histórico
    const vendaAtual = await historicoVendas.obterVendasDoDia(hoje) || { 
      total: 0, 
      quantidade: 0, 
      pedidoIds: [] 
    };
    
    await historicoVendas.salvarVendaDoDia(hoje, {
      total: novoTotal,
      quantidade: novaQuantidade,
      pedidoIds: [...vendaAtual.pedidoIds, pedidoId]
    });
  },

  async obterVendasHoje(): Promise<{ total: number; quantidade: number }> {
    const hoje = new Date().toDateString();
    const vendasCache = await storage.getItem('vendasHoje');
    
    if (vendasCache) {
      const parsed = JSON.parse(vendasCache);
      if (parsed.data === hoje) {
        return { total: parsed.total, quantidade: parsed.quantidade };
      }
    }
    
    // Se cache está desatualizado, buscar do histórico
    const vendaHistorico = await historicoVendas.obterVendasDoDia(hoje);
    if (vendaHistorico) {
      return { total: vendaHistorico.total, quantidade: vendaHistorico.quantidade };
    }
    
    return { total: 0, quantidade: 0 };
  },

  async resetarContadoresDiarios(): Promise<void> {
    // Esta função não faz nada, pois agora mantemos o histórico completo
    // Os contadores são automaticamente zerados quando o dia muda
    console.log('[Storage] Contadores diários são gerenciados automaticamente via histórico');
  }
};