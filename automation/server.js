const express = require("express");
const { chromium } = require("playwright");
const axios = require("axios");

const app = express();
app.use(express.json());

// ✅ Root route (so no "Cannot GET /")
app.get("/", (req, res) => {
  res.send("🚀 Mission Control Backend Running");
});

// ✅ Main API
app.post("/run", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command is required" });
  }

  try {
    // 🧠 STEP 1: Ask Groq
    const aiResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are an AI agent. Understand the task and explain what to do in simple steps."
          },
          {
            role: "user",
            content: command
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = aiResponse.data.choices[0].message.content;

    // 🌐 STEP 2: Playwright (open website)
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // 👉 You can change this later dynamically
    await page.goto("https://example.com");

    // Extract only text
    const pageText = await page.textContent("body");

    await browser.close();

    // 🧠 STEP 3: Summarize webpage using Groq
    const summaryResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "Summarize this webpage content briefly."
          },
          {
            role: "user",
            content: pageText.slice(0, 4000)
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const summary = summaryResponse.data.choices[0].message.content;

    // ✅ FINAL RESPONSE
    res.json({
      success: true,
      command,
      ai_plan: aiText,
      website_summary: summary
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ✅ PORT (important for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
