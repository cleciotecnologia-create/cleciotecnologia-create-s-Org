import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import twilio from "twilio";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Email Config
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Twilio Config
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Email Notification Route
  app.post("/api/notify/email", async (req, res) => {
    const { to, subject, body } = req.body;
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Email configuration missing" });
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "CondoPro <noreply@condopro.com>",
        to,
        subject,
        html: body,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // WhatsApp Notification Route
  app.post("/api/notify/whatsapp", async (req, res) => {
    const { to, message } = req.body;

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(500).json({ error: "WhatsApp configuration missing" });
    }

    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
        to: `whatsapp:${to.replace(/\s+/g, '')}`,
        body: message,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("WhatsApp error:", error);
      res.status(500).json({ error: "Failed to send WhatsApp message" });
    }
  });

  // Bite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
