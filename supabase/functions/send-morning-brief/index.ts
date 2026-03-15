import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type PersonaId = "general" | "trader" | "agri" | "logistics" | "analyst";

interface DailyBrief {
  id: string;
  brief_date: string;
  generated_at: string;
  feed_snapshot_at: string | null;
  narrative: string;
  three_things: string[];
  action_rationale: Record<string, string>;
  geopolitical_context: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
}

interface EmailSubscription {
  id: string;
  email: string;
  name: string;
  active: boolean;
  send_hour_utc: number;
  last_sent_at: string | null;
  unsubscribe_token: string;
  persona: PersonaId;
}

const PERSONA_META: Record<PersonaId, { label: string; accentColor: string; headerBg: string; borderColor: string }> = {
  general: {
    label: "Business Overview",
    accentColor: "#94a3b8",
    headerBg: "#1e293b",
    borderColor: "#334155",
  },
  trader: {
    label: "Commodity Trader",
    accentColor: "#f87171",
    headerBg: "#1c0a0a",
    borderColor: "#7f1d1d",
  },
  agri: {
    label: "Agri Buyer",
    accentColor: "#34d399",
    headerBg: "#052e16",
    borderColor: "#14532d",
  },
  logistics: {
    label: "Logistics Director",
    accentColor: "#38bdf8",
    headerBg: "#0c1a2e",
    borderColor: "#0c4a6e",
  },
  analyst: {
    label: "Risk Analyst",
    accentColor: "#fbbf24",
    headerBg: "#1c1207",
    borderColor: "#78350f",
  },
};

function buildPersonaFocusSection(persona: PersonaId, brief: DailyBrief): string {
  const rationale = brief.action_rationale ?? {};
  const threeThings = brief.three_things ?? [];

  const sectorLabel: Record<string, string> = {
    energy: "Energy",
    agricultural: "Agricultural / Grain",
    freight: "Freight & Shipping",
    fertilizer: "Fertilizers",
    metals: "Metals",
    fx: "FX / GBP",
    policy: "Policy / Macro",
  };

  function sectorRow(key: string): string {
    const val = rationale[key];
    if (!val || val.length < 5) return "";
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;vertical-align:top;width:120px;">
          <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${sectorLabel[key] ?? key}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:13px;color:#cbd5e1;line-height:1.5;">${val}</td>
      </tr>`;
  }

  function thingsList(indices: number[]): string {
    return indices
      .map(i => threeThings[i])
      .filter(Boolean)
      .map((t, idx) => `
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:24px;">
            <span style="display:inline-block;width:20px;height:20px;background:#0ea5e9;color:#fff;font-size:11px;font-weight:700;border-radius:50%;text-align:center;line-height:20px;">${idx + 1}</span>
          </td>
          <td style="padding:6px 0;font-size:14px;color:#cbd5e1;line-height:1.5;">${t}</td>
        </tr>`)
      .join("");
  }

  switch (persona) {
    case "trader": {
      const rows = [sectorRow("energy"), sectorRow("fx"), sectorRow("metals")].filter(Boolean).join("");
      const things = thingsList([0, 1, 2]);
      return rows || things ? `
        <tr><td style="background:#111827;border-left:1px solid #1e293b;border-right:1px solid #1e293b;padding:20px 32px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:0.12em;">Trader Focus — Price Signals &amp; Crisis Context</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;">Review before the 07:00 standup. Energy, FX, and metals attribution below.</p>
          ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">${rows}</table>` : ""}
          ${things ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:12px 16px 6px;">${things}</table>` : ""}
        </td></tr>` : "";
    }

    case "agri": {
      const rows = [sectorRow("agricultural"), sectorRow("fertilizer"), sectorRow("energy")].filter(Boolean).join("");
      const things = thingsList([0, 1, 2]);
      return rows || things ? `
        <tr><td style="background:#111827;border-left:1px solid #1e293b;border-right:1px solid #1e293b;padding:20px 32px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:0.12em;">Agri Buyer Focus — Grain, Fertilizer &amp; Black Sea</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;">Wheat, fertilizer input costs, and supply corridor status.</p>
          ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">${rows}</table>` : ""}
          ${things ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:12px 16px 6px;">${things}</table>` : ""}
        </td></tr>` : "";
    }

    case "logistics": {
      const rows = [sectorRow("freight"), sectorRow("energy"), sectorRow("policy")].filter(Boolean).join("");
      const things = thingsList([0, 1, 2]);
      return rows || things ? `
        <tr><td style="background:#111827;border-left:1px solid #1e293b;border-right:1px solid #1e293b;padding:20px 32px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.12em;">Logistics Focus — Shipping Lanes &amp; Bunker Costs</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;">Red Sea status, rerouting signals, and freight rate context.</p>
          ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">${rows}</table>` : ""}
          ${things ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:12px 16px 6px;">${things}</table>` : ""}
        </td></tr>` : "";
    }

    case "analyst": {
      const rows = Object.keys(rationale)
        .map(k => sectorRow(k))
        .filter(Boolean)
        .join("");
      return rows ? `
        <tr><td style="background:#111827;border-left:1px solid #1e293b;border-right:1px solid #1e293b;padding:20px 32px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:0.12em;">Risk Analyst Focus — Full Sector Intelligence</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;">All monitored sectors with citable context for client reporting.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">${rows}</table>
        </td></tr>` : "";
    }

    case "general":
    default: {
      const rows = [sectorRow("energy"), sectorRow("fx"), sectorRow("freight")].filter(Boolean).join("");
      return rows ? `
        <tr><td style="background:#111827;border-left:1px solid #1e293b;border-right:1px solid #1e293b;padding:20px 32px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.12em;">What This Means for Your Business</p>
          <p style="margin:0 0 10px;font-size:12px;color:#64748b;">Key impacts on UK operating costs and supply chains today.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">${rows}</table>
        </td></tr>` : "";
    }
  }
}

function buildPersonaSubjectTag(persona: PersonaId): string {
  const tags: Record<PersonaId, string> = {
    general: "Business Overview",
    trader: "Trader Edition",
    agri: "Agri Buyer Edition",
    logistics: "Logistics Edition",
    analyst: "Risk Analyst Edition",
  };
  return tags[persona] ?? "";
}

function buildHtmlEmail(
  brief: DailyBrief,
  recipientName: string,
  unsubscribeToken: string,
  supabaseUrl: string,
  persona: PersonaId,
): string {
  const dateStr = new Date(brief.brief_date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const unsubscribeUrl = `${supabaseUrl}/functions/v1/send-morning-brief?unsubscribe=${unsubscribeToken}`;
  const meta = PERSONA_META[persona] ?? PERSONA_META.general;

  const threeThingsRows = brief.three_things
    .map((thing, i) => `
      <tr>
        <td style="padding:6px 0;vertical-align:top;width:24px;">
          <span style="display:inline-block;width:20px;height:20px;background:#0ea5e9;color:#fff;font-size:11px;font-weight:700;border-radius:50%;text-align:center;line-height:20px;">${i + 1}</span>
        </td>
        <td style="padding:6px 0;font-size:14px;color:#cbd5e1;line-height:1.5;">${thing}</td>
      </tr>`)
    .join("");

  const personaSection = buildPersonaFocusSection(persona, brief);

  const greeting = recipientName ? `Hi ${recipientName},` : "Good morning,";
  const personaTag = persona !== "general" ? `<span style="display:inline-block;background:${meta.accentColor};color:#0f172a;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 8px;border-radius:20px;margin-left:8px;">${meta.label}</span>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Morning Brief — ${dateStr}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Persona accent bar -->
          <tr>
            <td style="background:${meta.accentColor};height:3px;border-radius:12px 12px 0 0;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${meta.headerBg} 0%,#1e293b 100%);border:1px solid ${meta.borderColor};border-top:none;border-bottom:none;padding:28px 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.12em;">Procurement Intelligence</p>
                    <h1 style="margin:0;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;">Morning Brief${personaTag}</h1>
                    <p style="margin:6px 0 0;font-size:13px;color:#64748b;">${dateStr}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display:inline-block;background:#0ea5e9;color:#fff;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:20px;">LIVE DATA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting + Narrative -->
          <tr>
            <td style="background:#111827;border-left:1px solid ${meta.borderColor};border-right:1px solid ${meta.borderColor};padding:24px 32px 0;">
              <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">${greeting}</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#f1f5f9;line-height:1.6;">${brief.narrative}</p>
              ${brief.geopolitical_context ? `<p style="margin:12px 0 0;font-size:13px;color:#64748b;line-height:1.6;padding-left:14px;border-left:2px solid ${meta.borderColor};">${brief.geopolitical_context}</p>` : ""}
            </td>
          </tr>

          <!-- 3 Things That Matter Today -->
          ${brief.three_things.length > 0 ? `
          <tr>
            <td style="background:#111827;border-left:1px solid ${meta.borderColor};border-right:1px solid ${meta.borderColor};padding:20px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:16px 16px 8px;">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;">
                    <p style="margin:0;font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.12em;">3 Things That Matter Today</p>
                  </td>
                </tr>
                ${threeThingsRows}
              </table>
            </td>
          </tr>` : ""}

          <!-- Persona-specific focus section -->
          ${personaSection}

          <!-- CTA -->
          <tr>
            <td style="background:#111827;border-left:1px solid ${meta.borderColor};border-right:1px solid ${meta.borderColor};padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${supabaseUrl.replace("/functions/v1", "").replace("https://", "https://").split(".supabase.co")[0]}.supabase.co"
                       style="display:inline-block;background:${meta.accentColor};color:#0f172a;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:6px;">
                      View Full Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;border:1px solid ${meta.borderColor};border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#334155;">
                      Procurement Intelligence Platform &middot; ${meta.label} Brief
                      ${brief.model && brief.model !== "none" ? ` &middot; AI analysis by ${brief.model}` : ""}
                    </p>
                  </td>
                  <td align="right">
                    <a href="${unsubscribeUrl}" style="font-size:11px;color:#475569;text-decoration:underline;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextEmail(brief: DailyBrief, recipientName: string, persona: PersonaId): string {
  const dateStr = new Date(brief.brief_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });

  const meta = PERSONA_META[persona] ?? PERSONA_META.general;
  const lines: string[] = [];
  lines.push(`MORNING BRIEF — ${meta.label.toUpperCase()} — ${dateStr}`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(recipientName ? `Hi ${recipientName},` : "Good morning,");
  lines.push("");
  lines.push(brief.narrative);
  if (brief.geopolitical_context) {
    lines.push("");
    lines.push(brief.geopolitical_context);
  }
  if (brief.three_things.length > 0) {
    lines.push("");
    lines.push("3 THINGS THAT MATTER TODAY");
    lines.push("-".repeat(30));
    brief.three_things.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
  }

  const rationale = brief.action_rationale ?? {};
  const sectorLabel: Record<string, string> = {
    energy: "ENERGY",
    agricultural: "AGRICULTURAL",
    freight: "FREIGHT",
    fertilizer: "FERTILIZERS",
    metals: "METALS",
    fx: "FX / GBP",
    policy: "POLICY / MACRO",
  };

  const personaSectors: Record<PersonaId, string[]> = {
    general: ["energy", "fx", "freight"],
    trader: ["energy", "fx", "metals"],
    agri: ["agricultural", "fertilizer", "energy"],
    logistics: ["freight", "energy", "policy"],
    analyst: Object.keys(rationale),
  };

  const sectors = personaSectors[persona] ?? personaSectors.general;
  const relevantRows = sectors
    .map(k => rationale[k] ? `${sectorLabel[k] ?? k.toUpperCase()}: ${rationale[k]}` : null)
    .filter(Boolean) as string[];

  if (relevantRows.length > 0) {
    lines.push("");
    lines.push(`${meta.label.toUpperCase()} FOCUS`);
    lines.push("-".repeat(30));
    relevantRows.forEach(r => lines.push(r));
  }

  lines.push("");
  lines.push("-".repeat(50));
  lines.push("Procurement Intelligence Platform");
  return lines.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const db = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const unsubscribeToken = url.searchParams.get("unsubscribe");

    if (unsubscribeToken) {
      await db
        .from("email_subscriptions")
        .update({ active: false })
        .eq("unsubscribe_token", unsubscribeToken);
      return new Response(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;max-width:400px;">
            <h1 style="font-size:24px;margin-bottom:12px;">Unsubscribed</h1>
            <p style="color:#94a3b8;">You have been removed from the morning brief mailing list.</p>
          </div>
        </body></html>`,
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));

      if (body.action === "subscribe") {
        const email = (body.email ?? "").toLowerCase().trim();
        const name = (body.name ?? "").trim();
        const persona: PersonaId = (["general", "trader", "agri", "logistics", "analyst"].includes(body.persona)
          ? body.persona
          : "general") as PersonaId;

        if (!email || !email.includes("@")) {
          return new Response(JSON.stringify({ error: "Invalid email address" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existing } = await db
          .from("email_subscriptions")
          .select("id, active")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          if (!existing.active) {
            await db
              .from("email_subscriptions")
              .update({ active: true, name, persona })
              .eq("email", email);
            return new Response(JSON.stringify({ success: true, message: "Resubscribed successfully" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          await db
            .from("email_subscriptions")
            .update({ persona })
            .eq("email", email);
          return new Response(JSON.stringify({ success: true, message: "Already subscribed — persona preference updated" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: insertErr } = await db
          .from("email_subscriptions")
          .insert({ email, name, persona });

        if (insertErr) throw new Error(`Subscribe error: ${insertErr.message}`);

        return new Response(JSON.stringify({ success: true, message: "Subscribed successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "send_now" || !body.action) {
        if (!resendKey) throw new Error("RESEND_API_KEY not configured");

        const todayUtc = new Date().toISOString().slice(0, 10);

        const { data: brief, error: briefErr } = await db
          .from("daily_brief")
          .select("*")
          .eq("brief_date", todayUtc)
          .maybeSingle();

        if (briefErr) throw new Error(`Brief fetch error: ${briefErr.message}`);
        if (!brief) {
          return new Response(JSON.stringify({ error: "No brief available for today yet" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: subscribers, error: subErr } = await db
          .from("email_subscriptions")
          .select("id, email, name, unsubscribe_token, persona")
          .eq("active", true)
          .eq("confirmed", true);

        if (subErr) throw new Error(`Subscribers fetch error: ${subErr.message}`);
        if (!subscribers || subscribers.length === 0) {
          return new Response(JSON.stringify({ sent: 0, message: "No active subscribers" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const dateStr = new Date(brief.brief_date).toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
        });

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const sub of subscribers as EmailSubscription[]) {
          try {
            const persona: PersonaId = (sub.persona as PersonaId) ?? "general";
            const personaTag = buildPersonaSubjectTag(persona);
            const subjectSuffix = personaTag ? ` · ${personaTag}` : "";

            const html = buildHtmlEmail(brief as DailyBrief, sub.name, sub.unsubscribe_token, supabaseUrl, persona);
            const text = buildTextEmail(brief as DailyBrief, sub.name, persona);

            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Morning Brief <onboarding@resend.dev>",
                to: [sub.email],
                subject: `07:00 Brief — ${dateStr}${subjectSuffix}`,
                html,
                text,
              }),
            });

            if (!resendRes.ok) {
              const errText = await resendRes.text();
              throw new Error(`Resend ${resendRes.status}: ${errText}`);
            }

            await db
              .from("email_subscriptions")
              .update({ last_sent_at: new Date().toISOString() })
              .eq("id", sub.id);

            sent++;
          } catch (e) {
            failed++;
            errors.push(`${sub.email}: ${String(e)}`);
          }
        }

        return new Response(
          JSON.stringify({ sent, failed, errors: errors.length > 0 ? errors : undefined }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
