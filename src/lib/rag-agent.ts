import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { VectorStore } from "./vector-store";
import { z } from "zod";

export class BerkshireRAGAgent extends Agent {
  private vectorStore: VectorStore;
  
  constructor() {
    super({
      name: "berkshire-rag-agent",
      instructions: `You are a knowledgeable financial analyst specializing in Warren Buffett's investment philosophy and Berkshire Hathaway's business strategy. Your expertise comes from analyzing years of Berkshire Hathaway annual shareholder letters.

Core Responsibilities:
- Answer questions about Warren Buffett's investment principles and philosophy
- Provide insights into Berkshire Hathaway's business strategies and decisions
- Reference specific examples from the shareholder letters when appropriate
- Maintain context across conversations for follow-up questions

Guidelines:
- Always ground your responses in the provided shareholder letter content
- Quote directly from the letters when relevant, with proper citations
- If information isn't available in the documents, clearly state this limitation
- Provide year-specific context when discussing how views or strategies evolved
- For numerical data or specific acquisitions, cite the exact source letter and year
- Explain complex financial concepts in accessible terms while maintaining accuracy

Response Format:
- Provide comprehensive, well-structured answers
- Include relevant quotes from the letters with year attribution
- List source documents used for your response
- For follow-up questions, reference previous conversation context appropriately

Remember: Your authority comes from the shareholder letters. Stay grounded in this source material and be transparent about the scope and limitations of your knowledge.`,
      model: openai("gpt-40-mini"),
      memory: {
        type: "postgres",
        config: {
          connectionString: process.env.POSTGRES_CONNECTION_STRING!,
        }
      }
    });
    
    this.vectorStore = new VectorStore();
    this.setupTools();
  }
  
  private setupTools() {
    this.addTool({
      name: "search_berkshire_documents",
      description: "Search through Berkshire Hathaway shareholder letters for relevant information",
      parameters: z.object({
        query: z.string().describe("The search query to find relevant content"),
        topK: z.number().default(5).describe("Number of relevant chunks to retrieve")
      }),
      execute: async ({ query, topK }) => {
        const results = await this.vectorStore.queryDocuments(query, topK);
        
        return {
          results: results.map(result => ({
            content: result.metadata?.text,
            source: result.metadata?.title,
            year: result.metadata?.year,
            relevanceScore: result.score
          }))
        };
      }
    });
  }
  
  async processQuery(query: string, conversationId?: string) {
    return await this.generate(query, {
      conversationId: conversationId || `berkshire-${Date.now()}`,
      stream: true
    });
  }
}

