import { inngest } from "@/lib/inngest";
import dbConnect from "@/lib/mongodb";
import Capture from "@/models/Capture";
import { analyzeText, generateEmbeddings } from "@/lib/gemini";

export const processCapture = inngest.createFunction(
  { id: "process-capture" },
  { event: "capture/created" },
  async ({ event, step }) => {
    const { captureId, content, type } = event.data;

    // 1. Scraping (if it's a link)
    const processedContent = await step.run("scrape-content", async () => {
      if (type === 'link' || (type === 'text' && /^https?:\/\//.test(content.trim()))) {
        try {
          const response = await fetch(`https://r.jina.ai/${content.trim()}`);
          if (response.ok) {
            return await response.text();
          }
        } catch (err) {
          console.error("Scraping failed:", err);
        }
      }
      return content;
    });

    // 2. AI Analysis
    const analysis = await step.run("ai-analysis", async () => {
      return await analyzeText(processedContent);
    });

    // 3. Generate Embeddings for Semantic Search
    const embedding = await step.run("generate-embeddings", async () => {
      // We embed the summary and title for the most relevant vector search
      const textToEmbed = `Title: ${analysis.title}\nSummary: ${analysis.summary}`;
      return await generateEmbeddings(textToEmbed);
    });

    // 4. Update Database
    await step.run("update-db", async () => {
      await dbConnect();
      await Capture.findByIdAndUpdate(captureId, {
        title: analysis.title,
        description: analysis.summary,
        category: analysis.category,
        urgency: analysis.urgency,
        tags: analysis.tags,
        embedding,
      });
    });

    return { success: true, captureId };
  }
);
