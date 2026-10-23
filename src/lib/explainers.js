import { istWeek } from "./family-score.mjs";
export const explainers = [
  {
    id: "arrest",
    title: "The “digital arrest” pressure script",
    tag: "Authority impersonation",
    summary:
      "A caller claims to be an officer, asks you to stay on video and demands secrecy or money.",
    signals: [
      "A threat creates panic",
      "You are told not to speak to family",
      "A payment is framed as verification",
    ],
    steps: [
      "Pause any payment and end the call yourself.",
      "Find the claimed organization’s official contact independently.",
      "Contact someone you trust before responding.",
    ],
    practiceId: "arrest",
  },
  {
    id: "qr",
    title: "The refund QR that asks you to pay",
    tag: "Payment QR awareness",
    summary:
      "A person promises a refund, then sends a payment QR or asks you to approve a request.",
    signals: [
      "Receiving money is made conditional on a PIN",
      "The payee or amount is different from what you expected",
      "The caller rushes your approval",
    ],
    steps: [
      "Read the payee and amount in your payment app.",
      "A UPI PIN authorizes a payment; do not enter it to receive a refund.",
      "Verify the refund through the business’s official app or support.",
    ],
    practiceId: "bank",
  },
  {
    id: "family",
    title: "A familiar voice, an unfamiliar request",
    tag: "Family impersonation",
    summary:
      "A caller sounds like a relative but needs money urgently and cannot answer an independent check.",
    signals: [
      "Urgent money request",
      "A new account or payee",
      "Pressure to keep the call secret",
    ],
    steps: [
      "Call the person on a number already saved in your contacts.",
      "Ask a private family question without revealing the answer.",
      "If it was a joke, dismiss only after checking.",
    ],
    practiceId: "family",
  },
  {
    id: "links",
    title: "Read the domain before the message",
    tag: "Phishing link awareness",
    summary:
      "A familiar brand in a subdomain or before an @ symbol can distract from the actual destination.",
    signals: [
      "Brand spelling is slightly different",
      "The address hides its destination behind a short link",
      "A QR sends you to an unexpected login page",
    ],
    steps: [
      "Inspect the actual hostname in Links & QR.",
      "Open the official app yourself instead of following a pressured link.",
      "Treat an unknown result as unverified.",
    ],
    practiceId: "bank",
  },
];
export function weeklyExplainer(now = new Date()) {
  return explainers[
    Math.floor(+new Date(istWeek(now).start) / 604800000) % explainers.length
  ];
}
