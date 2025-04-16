import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText, tool } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system: `Você é um assistente jurídico especializado em direito trabalhista brasileiro, com foco especial na CLT (Consolidação das Leis do Trabalho).
    Use ferramentas em todas as solicitações.
    É OBRIGATÓRIO consultar sua base de conhecimento (getInformation) antes de responder qualquer pergunta sobre leis ou direitos trabalhistas.
    Se o usuário apresentar informações sobre si mesmo, use a ferramenta addResource para armazenar.
    
    RESPONDA APENAS usando informações das chamadas de ferramentas e da CLT.
    Se nenhuma informação relevante for encontrada nas chamadas de ferramentas, responda: "Desculpe, não encontrei informações específicas sobre isso na CLT. Posso ajudar com outra questão trabalhista?"
    
    Se a informação relevante não for uma correspondência direta com a pergunta do usuário, você pode deduzir a resposta usando seu conhecimento jurídico.
    
    SEMPRE cite os artigos específicos da CLT em sua resposta quando disponíveis.
    
    Mantenha as respostas objetivas e diretas.
    Sempre responda em português em um tom profissional e prestativo.
`,
    tools: {
      addResource: tool({
        description: `Adicionar um recurso à sua base de conhecimento.
          Se o usuário fornecer uma informação aleatória sem solicitação, use esta ferramenta sem pedir confirmação.`,
        parameters: z.object({
          content: z
            .string()
            .describe("o conteúdo ou recurso a ser adicionado à base de conhecimento"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description: `Consultar o conhecimento jurídico sobre a CLT e leis trabalhistas para responder com precisão.`,
        parameters: z.object({
          question: z.string().describe("a pergunta do usuário"),
          keywords: z.array(z.string()).describe("palavras-chave adicionais para pesquisa"),
        }),
        execute: async ({ question, keywords }) => {
          console.log("Consultando conhecimento jurídico...");
          
          // Primeiro tentamos com a pergunta completa
          const directResults = await findRelevantContent(question);
          
          // Depois tentamos com cada palavra-chave
          const keywordResults = await Promise.all(
            keywords.map(async (keyword) => await findRelevantContent(keyword))
          );
          
          // Combinar e ordenar resultados
          const allResults = [...directResults, ...keywordResults.flat()];
          
          // Remover duplicatas baseado no conteúdo
          const uniqueContents = new Map();
          allResults.forEach(item => {
            if (item && item.content && !uniqueContents.has(item.content)) {
              uniqueContents.set(item.content, item);
            }
          });
          
          const finalResults = Array.from(uniqueContents.values());
          
          // Ordenar por similaridade (maior para menor)
          finalResults.sort((a, b) => {
            if (a.similarity && b.similarity) {
              return b.similarity - a.similarity;
            }
            return 0;
          });
          
          console.log(`Encontrados ${finalResults.length} artigos e precedentes relevantes`);
          
          // Transformar para o formato esperado pelo modelo
          const formattedResults = finalResults.map(item => ({
            name: item.content,
            similarity: item.similarity
          }));
          
          return formattedResults.slice(0, 10); // Limitamos a 10 resultados
        },
      }),
      understandQuery: tool({
        description: `Analisar a consulta do usuário para entender o contexto jurídico e legislação aplicável.`,
        parameters: z.object({
          query: z.string().describe("a consulta do usuário"),
          toolsToCallInOrder: z
            .array(z.string())
            .describe(
              "ferramentas que você precisa chamar na ordem necessária para responder à consulta do usuário",
            ),
        }),
        execute: async ({ query }) => {
          console.log("Analisando contexto jurídico da consulta:", query);
          
          const { object } = await generateObject({
            model: openai("gpt-4o"),
            system:
              "Você é um especialista em direito trabalhista. Analise a consulta e gere palavras-chave relevantes para pesquisa na CLT.",
            schema: z.object({
              questions: z
                .array(z.string())
                .max(3)
                .describe("perguntas semelhantes à consulta do usuário"),
              keywords: z
                .array(z.string())
                .max(5)
                .describe("palavras-chave relacionadas à legislação trabalhista relevantes para a consulta")
            }),
            prompt: `Analise esta consulta sobre direito trabalhista: "${query}". Forneça:
                    1. Até 3 perguntas semelhantes que poderiam ajudar a responder a consulta do usuário
                    2. Até 5 palavras-chave específicas relacionadas à CLT e legislação trabalhista relevantes para a consulta`,
          });
          
          console.log("Análise jurídica concluída:", object);
          return {
            questions: object.questions || [],
            keywords: object.keywords || []
          };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
