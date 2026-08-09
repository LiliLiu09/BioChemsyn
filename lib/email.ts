import type { QuoteRequest } from "./types";

type EmailResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function quoteSubject(quote: QuoteRequest) {
  const company = quote.customer.company || quote.customer.name;
  return `新询价单 ${quote.id} - ${company}`;
}

function quoteText(quote: QuoteRequest) {
  const customer = quote.customer;
  const lines = quote.lines
    .map(
      (line, index) =>
        `${index + 1}. ${line.nameCn || line.nameEn} / ${line.sku}
   CAS: ${line.cas || "待确认"}
   规格: ${line.packageSize || "待确认"}
   数量: ${line.qty}`
    )
    .join("\n\n");

  return `新询价单：${quote.id}
提交时间：${new Date(quote.createdAt).toLocaleString("zh-CN")}

客户信息
联系人：${customer.name}
公司：${customer.company}
电话：${customer.phone}
邮箱：${customer.email}
地区：${customer.region || "未填写"}
备注：${customer.remark || "未填写"}

产品清单
${lines}
`;
}

function quoteHtml(quote: QuoteRequest) {
  const customer = quote.customer;
  const rows = quote.lines
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.nameCn || line.nameEn)}<br><small>${escapeHtml(line.nameEn || "")}</small></td>
          <td>${escapeHtml(line.sku)}<br><small>CAS: ${escapeHtml(line.cas || "待确认")}</small></td>
          <td>${escapeHtml(line.packageSize || "待确认")}</td>
          <td>${escapeHtml(line.qty)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,'Microsoft YaHei',sans-serif;color:#10212f;line-height:1.6">
      <h2>新询价单：${escapeHtml(quote.id)}</h2>
      <p>提交时间：${escapeHtml(new Date(quote.createdAt).toLocaleString("zh-CN"))}</p>
      <h3>客户信息</h3>
      <p>
        联系人：${escapeHtml(customer.name)}<br>
        公司：${escapeHtml(customer.company)}<br>
        电话：${escapeHtml(customer.phone)}<br>
        邮箱：${escapeHtml(customer.email)}<br>
        地区：${escapeHtml(customer.region || "未填写")}<br>
        备注：${escapeHtml(customer.remark || "未填写")}
      </p>
      <h3>产品清单</h3>
      <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#d8e2ea">
        <thead>
          <tr>
            <th align="left">产品</th>
            <th align="left">货号 / CAS</th>
            <th align="left">规格</th>
            <th align="left">数量</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export async function sendQuoteNotification(quote: QuoteRequest): Promise<EmailResult> {
  const apiKey = env("RESEND_API_KEY");
  const to = env("SALES_EMAIL") || "support@biochemsyn.com";
  const from = env("MAIL_FROM") || "凯森斯生物 KASONS <support@biochemsyn.com>";

  if (!apiKey) {
    return { ok: true, skipped: true, reason: "RESEND_API_KEY is not configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: quote.customer.email,
      subject: quoteSubject(quote),
      text: quoteText(quote),
      html: quoteHtml(quote)
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: errorText || `Resend request failed with ${response.status}` };
  }

  return { ok: true };
}
