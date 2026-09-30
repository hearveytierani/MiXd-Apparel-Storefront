import { Router, type IRouter } from "express";
import {
  SubmitContactBody,
  SubscribeNewsletterBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim();
  return value || null;
};

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

router.post("/contact", async (req, res) => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please complete the required fields." });
  }

  const endpoint = getRequiredEnv("FORMSPREE_ENDPOINT");
  if (!endpoint) {
    return res.status(502).json({ error: "Contact form is not configured yet." });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        ...parsed.data,
        _subject: `MiXd contact: ${parsed.data.topic}`,
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "The contact provider could not accept this message." });
    }

    return res.json({
      status: "accepted",
      message: "Message sent.",
    });
  } catch {
    return res.status(502).json({ error: "The contact provider is temporarily unavailable." });
  }
});

router.post("/newsletter", async (req, res) => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }

  const supabaseUrl = getRequiredEnv("SUPABASE_URL");
  const supabaseKey = getRequiredEnv("SUPABASE_ANON_KEY");
  const table = getRequiredEnv("SUPABASE_NEWSLETTER_TABLE");
  if (!supabaseUrl || !supabaseKey || !table || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
    return res.status(502).json({ error: "Newsletter signup is not configured yet." });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        ...jsonHeaders,
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify({ email: parsed.data.email.trim().toLowerCase() }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: "The newsletter list could not accept this signup." });
    }

    return res.status(201).json({
      status: "subscribed",
      message: "You’re in. First dibs on every drop.",
    });
  } catch {
    return res.status(502).json({ error: "Supabase is temporarily unavailable." });
  }
});

export default router;