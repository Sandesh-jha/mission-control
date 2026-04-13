const express = require("express");
const { chromium } = require("playwright");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/run", async (req, res) => {
  const { command } = req.body;

  try {
    // 🧠 Groq AI
    const aiRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "Summarize this task." },
          { role: "user", content: command }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    const aiText = aiRes.data.choices[0].message.content;

    // 🌐 Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://example.com");
    const text = await page.textContent("body");

    await browser.close();

    res.json({
      ai: aiText,
      data: text.slice(0, 500)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running"));
