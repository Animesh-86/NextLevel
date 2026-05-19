const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyByvl2C3mXmRmASqsiaB6dKlhqN1OkXTec";

async function testV1() {
  // Trying to force v1 API
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
    console.log("Testing with v1 API explicitly...");
    // The SDK version we have might not expose apiVersion easily in the constructor
    // but let's try gemini-1.5-flash-latest or similar
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hi");
    console.log("✅ v1 Connectivity OK!");

    const embModel = genAI.getGenerativeModel({ model: "text-embedding-004" }, { apiVersion: 'v1' });
    const emb = await embModel.embedContent("Hello world");
    console.log("✅ v1 Embedding OK!");
  } catch (err) {
    console.error("❌ v1 also failed:", err.message);
  }
}

testV1();
