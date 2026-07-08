function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toParagraphs(bodyText: string): string[] {
  return bodyText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

interface CandidateEmailContent {
  subject: string;
  bodyText: string;
}

export function buildCandidateEmailHtml({ subject, bodyText }: CandidateEmailContent): string {
  // bodyText may contain raw HTML tags (e.g. <b>, <a>) — rendered as-is, not escaped.
  const paragraphs = toParagraphs(bodyText)
    .map((block) => `<p style="margin: 0 0 16px;">${block.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

      <h2 style="margin-top: 0; font-size: 22px; color: #1a1a1a;">${escapeHtml(subject)}</h2>

      ${paragraphs || '<p style="margin: 0 0 16px; color: #999;">&nbsp;</p>'}

      <p style="color: #aaa; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; margin-bottom: 0;">
        Este é um email da Watt Consultoria. Por favor, não responda diretamente a este email.
      </p>
    </div>
  </body>
</html>`;
}

export function buildCandidateEmailPlainText({ subject, bodyText }: CandidateEmailContent): string {
  const body = toParagraphs(bodyText)
    .map((block) => stripHtml(block).trim())
    .filter(Boolean)
    .join('\n\n');
  return [subject, '', body, '', '---', 'Este é um email da Watt Consultoria.'].join('\n');
}
