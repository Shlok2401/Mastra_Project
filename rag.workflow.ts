import { defineWorkflow, MDocument } from 'mastra'
import fs from 'fs'
import path from 'path'

export default defineWorkflow(async () => {
  const lettersDir = 'C:\\Users\\Welcome\\my-RAG\\src\\letters'

  const files = fs.readdirSync(lettersDir).filter(file => file.endsWith('.pdf'))

  for (const file of files) {
    const fullPath = path.join(lettersDir, file)
    console.log(`Processing ${file}...`)

    const doc = new MDocument({
      filePath: fullPath,
      chunkSize: 500,
      chunkOverlap: 100,
      metadata: {
        year: file.replace('.pdf', ''),
        source: 'Berkshire Hathaway Shareholder Letter'
      }
    })

    await doc.process()
    console.log(`✅ Finished: ${file}`)
  }
})
