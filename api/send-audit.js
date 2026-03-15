const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, role, company, email, quizType, totalScore, maxScore, verdict, categories } = req.body;

  if (!name || !company || !email || !quizType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const pct = Math.round((totalScore / maxScore) * 100);

  const categoryRows = (categories || []).map(c => {
    const catPct = Math.round((c.score / c.max) * 100);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1E2D3A;color:#AABCC8;">${c.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1E2D3A;color:#fff;text-align:center;">${c.score}/${c.max}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1E2D3A;color:#3FB8C4;text-align:center;">${catPct}%</td>
    </tr>`;
  }).join('');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;background:#080C10;color:#fff;padding:32px;max-width:600px;margin:0 auto;">
      <h2 style="color:#3FB8C4;margin-bottom:4px;">New ${quizType} Audit Lead</h2>
      <p style="color:#6B8799;font-size:14px;margin-bottom:24px;">Submitted from joelutai.com/quizzes</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#6B8799;width:120px;">Name</td><td style="color:#fff;">${name}</td></tr>
        <tr><td style="padding:6px 0;color:#6B8799;">Role</td><td style="color:#fff;">${role || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#6B8799;">Company</td><td style="color:#fff;">${company}</td></tr>
        <tr><td style="padding:6px 0;color:#6B8799;">Email</td><td style="color:#fff;"><a href="mailto:${email}" style="color:#3FB8C4;">${email}</a></td></tr>
      </table>

      <div style="background:#111820;border:1px solid #1E2D3A;border-radius:6px;padding:20px;margin-bottom:24px;">
        <h3 style="color:#3FB8C4;margin-bottom:12px;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Overall Score</h3>
        <div style="font-size:48px;font-weight:800;color:#fff;">${totalScore}<span style="font-size:20px;color:#6B8799;">/${maxScore}</span></div>
        <div style="font-size:24px;color:#3FB8C4;margin-bottom:4px;">${pct}%</div>
        <div style="font-size:16px;color:#E8943A;font-weight:700;">${verdict}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;background:#111820;border:1px solid #1E2D3A;border-radius:6px;">
        <thead>
          <tr style="border-bottom:2px solid #1E2D3A;">
            <th style="padding:10px 12px;text-align:left;color:#6B8799;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Category</th>
            <th style="padding:10px 12px;text-align:center;color:#6B8799;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Score</th>
            <th style="padding:10px 12px;text-align:center;color:#6B8799;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">%</th>
          </tr>
        </thead>
        <tbody>${categoryRows}</tbody>
      </table>
    </div>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'chiomaodo@gmail.com',
      subject: `New Audit: ${company} — ${totalScore}/${maxScore} (${verdict}) [${quizType}]`,
      html: htmlBody,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
