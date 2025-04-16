"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { createResource } from "./resources";
import { SourceType } from "@/lib/db/schema/resources";
import { nanoid } from "@/lib/utils";

// Função para processar o arquivo PDF e extrair seu texto
export async function processPdfFile(
  file: File
): Promise<{ success: boolean; message: string; resourceId?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Importar pdf-parse dinamicamente para evitar problemas com arquivos de teste internos
    const pdfParse = await import('pdf-parse').then(module => module.default);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text;
    
    // Extrair nome do arquivo sem extensão para usar como título
    const filename = file.name.replace(/\.[^/.]+$/, "");
    
    // Formatar o conteúdo para incluir o nome do arquivo como título
    const content = `# ${filename}\n\n${pdfText}`;
    
    // Gerar um ID único para o arquivo PDF
    const pdfId = nanoid();
    
    // Adicionar à base de conhecimento com sourceType = PDF
    const result = await createResource({ 
      content,
      sourceType: SourceType.PDF,
      sourceId: pdfId
    });
    
    if (typeof result === "string" && result.includes("successfully")) {
      return { 
        success: true, 
        message: `PDF "${filename}" processado e adicionado com sucesso.`,
        resourceId: pdfId
      };
    }
    
    return { 
      success: false, 
      message: "Erro ao adicionar o conteúdo do PDF à base de conhecimento." 
    };
  } catch (error) {
    console.error("Erro ao processar o arquivo PDF:", error);
    return { 
      success: false, 
      message: "Erro ao processar o arquivo PDF. Verifique se o arquivo é válido." 
    };
  }
}

// Server Action para processar upload de PDF diretamente do frontend
export async function uploadPdf(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return {
        success: false,
        message: "Nenhum arquivo enviado"
      };
    }
    
    // Verificar se o arquivo é um PDF
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return {
        success: false,
        message: "O arquivo deve ser um PDF"
      };
    }

    // Processar o arquivo PDF
    return await processPdfFile(file);
  } catch (error) {
    console.error("Erro ao processar upload de PDF:", error);
    return {
      success: false,
      message: "Erro ao processar o upload do arquivo"
    };
  }
} 