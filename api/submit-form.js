// api/submit-form.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, service_id, locale_id, message, captchaToken } =
    req.body;

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  const TABLE_NAME = "Leads";

  try {
    // 1. Проверка reCAPTCHA v3 через Google API
    const captchaVerify = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      { method: "POST" }
    );
    const captchaData = await captchaVerify.json();

    // Если Google считает, что это бот (score < 0.5) или токен неверный
    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(403).json({
        message: "Security check failed. Please try again.",
        score: captchaData.score,
      });
    }

    // 2. Если проверка пройдена, сохраняем в Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Name: name,
            Email: email,
            Service: service_id ? [service_id] : [],
            Locale: locale_id ? [locale_id] : [],
            Message: message,
            Status: "New",
            Date: new Date().toISOString(),
          },
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to save to Airtable");

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
