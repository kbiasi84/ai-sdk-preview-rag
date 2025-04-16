// Script para migrar os dados existentes, atribuindo tipos de origem corretos

import { db } from "./index";
import { resources } from "./schema/resources";
import { links } from "./schema/links";
import { SourceType } from "./schema/resources";
import { eq, sql } from "drizzle-orm";

async function migrateExistingResources() {
  try {
    console.log("Iniciando migração de recursos existentes...");
    
    // Primeiro, obtém todos os recursos sem tipo de origem definido
    const existingResources = await db
      .select()
      .from(resources)
      .where(sql`source_type is null`);
      
    console.log(`Encontrados ${existingResources.length} recursos sem tipo de origem definido.`);
    
    if (existingResources.length === 0) {
      console.log("Nenhuma migração necessária, todos os recursos já têm tipo de origem definido.");
      return;
    }
    
    // Atualiza todos esses recursos para o tipo TEXT
    const result = await db
      .update(resources)
      .set({ sourceType: SourceType.TEXT })
      .where(sql`source_type is null`);
      
    console.log(`Migração concluída. Todos os recursos sem tipo foram marcados como '${SourceType.TEXT}'.`);
    
  } catch (error) {
    console.error("Erro durante a migração de dados:", error);
  }
}

// Execute a migração
migrateExistingResources()
  .then(() => console.log("Script de migração concluído com sucesso."))
  .catch(err => console.error("Erro ao executar script de migração:", err))
  .finally(() => process.exit(0)); 