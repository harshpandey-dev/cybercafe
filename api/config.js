export default function handler(req, res) {
  res.json({ emailRecipient: process.env.UIDAI_RECIPIENT || 'help@uidai.gov.in' });
}
