import { MDocument } from "@mastra/rag";
import { readFileSync } from "fs";
import { join } from "path";
import pdf from "pdf-parse";

export class DocumentProcessor {
  async processPDFFromPath(filePath: string): Promise<MDocument> {
    try {
      const pdfBuffer = readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);
      
      // Create MDocument from extracted text
      const doc = MDocument.fromText(pdfData.text, {
        metadata: {
          source: filePath,
          title: this.extractTitleFromPath(filePath),
          type: "berkshire_letter",
          year: this.extractYearFromPath(filePath)
        }
      });
      
      return doc;
    } catch (error) {
      console.error(`Error processing PDF ${filePath}:`, error);
      throw error;
    }
  }
  
  private extractTitleFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace('.pdf', '');
  }
  
  private extractYearFromPath(filePath: string): string {
    const match = filePath.match(/(\d{4})/);
    return match ? match[1] : 'unknown';
  }
  
  async processAllPDFs(documentsDir: string): Promise<MDocument[]> {
    const fs = require('fs');
    const files = fs.readdirSync(documentsDir)
      .filter((file: string) => file.endsWith('.pdf'));
    
    const documents: MDocument[] = [];
    
    for (const file of files) {
      const filePath = join(documentsDir, file);
      try {
        const doc = await this.processPDFFromPath(filePath);
        documents.push(doc);
        console.log(`Processed: ${file}`);
      } catch (error) {
        console.error(`Failed to process ${file}:`, error);
      }
    }
    
    return documents;
  }
}
