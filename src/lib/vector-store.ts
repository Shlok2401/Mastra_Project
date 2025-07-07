import { PgVector } from "@mastra/pg";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { MDocument } from "@mastra/rag";

export class VectorStore {
  private pgVector: PgVector;
  private readonly indexName = "berkshire_embeddings";
  
  constructor() {
    this.pgVector = new PgVector(process.env.POSTGRES_CONNECTION_STRING!);
  }
  
  async initializeIndex(): Promise<void> {
    try {
      await this.pgVector.createIndex({
        indexName: this.indexName,
        dimension: 1536, // text-embedding-3-small dimension
      });
      console.log(`Vector index '${this.indexName}' initialized`);
    } catch (error) {
      console.log(`Index might already exist: ${error}`);
    }
  }
  
  async processAndStoreDocuments(documents: MDocument[]): Promise<void> {
    console.log(`Processing ${documents.length} documents...`);
    
    for (const doc of documents) {
      // Create chunks
      const chunks = await doc.chunk({
        strategy: "recursive",
        size: 512,
        overlap: 50,
      });
      
      console.log(`Document chunks: ${chunks.length}`);
      
      // Generate embeddings
      const { embeddings } = await embedMany({
        values: chunks.map(chunk => chunk.text),
        model: openai.embedding("text-embedding-3-small"),
      });
      
      // Prepare vectors with metadata
      const vectors = chunks.map((chunk, index) => ({
        id: `${doc.metadata?.title || 'doc'}_${index}`,
        values: embeddings[index],
        metadata: {
          text: chunk.text,
          source: doc.metadata?.source || '',
          title: doc.metadata?.title || '',
          year: doc.metadata?.year || '',
          type: doc.metadata?.type || '',
          chunkIndex: index
        }
      }));
      
      // Store in vector database
      await this.pgVector.upsert({
        indexName: this.indexName,
        vectors: vectors,
      });
      
      console.log(`Stored ${vectors.length} vectors for document: ${doc.metadata?.title}`);
    }
  }

  async queryDocuments(queryText: string, topK: number = 5) {
    // Generate query embedding
    const { embeddings } = await embedMany({
      values: [queryText],
      model: openai.embedding("text-embedding-3-small"),
    });
    
    // Search similar chunks
    const results = await this.pgVector.query({
      indexName: this.indexName,
      queryVector: embeddings[0],
      topK: topK,
    });
    
    return results;
  }
}
