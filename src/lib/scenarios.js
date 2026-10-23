export const scenarios = [
  {
    id: "family",
    title: "A familiar voice. An urgent request.",
    type: "Family impersonation",
    difficulty: "Start here",
    description:
      "Someone sounds like your family. Does that make the request trustworthy?",
    lines: [
      "It's me. I need you to send money now.",
      "Don't tell anyone about this.",
      "Stay on the call. Transfer the money to a safe account immediately.",
    ],
    expected: "verify",
    explanation:
      "A familiar voice is not proof of identity. Call back using a saved number or ask a private family question.",
  },
  {
    id: "arrest",
    title: "The “official” on the other end",
    type: "Digital arrest",
    difficulty: "High pressure",
    description: "An authority claim becomes a threat, then a payment demand.",
    lines: [
      "This is a CBI officer calling about your parcel.",
      "You will be arrested. Stay on the video call. Do not tell anyone.",
      "Transfer money to a safe account immediately. Ignore any warning from your apps.",
    ],
    expected: "stop",
    explanation:
      "Stop payments and independently verify the claimed organization. Threats, secrecy and money requests together justify a strong warning.",
  },
  {
    id: "bank",
    title: "A call from the bank",
    type: "Credential theft",
    difficulty: "Subtle start",
    description: "A plausible KYC message asks you to reveal a private code.",
    lines: [
      "Your KYC expired and your account will be suspended.",
      "Tell me your OTP right now to restore the account.",
      "Do not hang up. Share your screen so I can help.",
    ],
    expected: "stop",
    explanation:
      "Do not reveal banking OTPs or share your screen. End the call and use your bank’s official app or published number.",
  },
  {
    id: "joke",
    title: "“Relax, I was only joking”",
    type: "Family exception",
    difficulty: "Verify first",
    description:
      "Learn how to dismiss a warning without granting permanent trust.",
    lines: [
      "Send money now, I am your brother.",
      "Just joking! It is really me.",
    ],
    expected: "verify",
    explanation:
      "A joke can look suspicious. Verify independently, then dismiss for this session. The phrase “just joking” must never be a bypass.",
  },
  {
    id: "awareness",
    title: "Talking about scams",
    type: "False-positive check",
    difficulty: "Everyday call",
    description: "A family member shares advice from a news article.",
    lines: [
      "The news article is about scammers who ask for money.",
      "Never share your OTP or transfer money to an unknown account.",
    ],
    expected: "context",
    explanation:
      "This is advice and reported speech, not a direct demand. Rules suppress these simple cases, but context detection is incomplete.",
  },
  {
    id: "delivery",
    title: "The delivery at your door",
    type: "Legitimate context",
    difficulty: "Use judgment",
    description:
      "An ordinary delivery code can resemble a banking-code request.",
    lines: [
      "I am outside with your delivery.",
      "Please give the delivery code after you check the parcel.",
    ],
    expected: "verify",
    explanation:
      "Check your order and the delivery in person. A delivery code is different from a bank OTP; never reveal financial credentials.",
  },
  {
    id: "hindi",
    title: "“Abhi paise bhejo”",
    type: "Hinglish pressure",
    difficulty: "Language test",
    description: "A small illustrative set of Hindi and Hinglish patterns.",
    lines: [
      "Abhi paise bhejo. K Hindi mein baat kar raha hoon.",
      "Kisi ko mat batana. Stay on the call.",
    ],
    expected: "stop",
    explanation:
      "Urgency, money and secrecy stack across languages. These example rules do not establish Hindi accuracy.",
  },
  {
    id: "tamil",
    title: "An urgent request in Tamil",
    type: "Tamil pressure",
    difficulty: "Language test",
    description:
      "An illustrative Tamil example with multiple pressure signals.",
    lines: ["உடனே பணம் அனுப்பு.", "யாரிடமும் சொல்லாதே. Stay on the call."],
    expected: "stop",
    explanation:
      "The demo recognizes these specific Tamil patterns. Broader dialect and code-mixed coverage still needs evaluation.",
  },
  {
    id: "investment",
    title: "Too good to be true?",
    type: "Investment offer",
    difficulty: "Payment pressure",
    description: "A promised profit comes with a deadline and payment request.",
    lines: [
      "We offer guaranteed returns. You can double your money.",
      "Transfer money immediately. Keep this secret.",
    ],
    expected: "stop",
    explanation:
      "Promises of guaranteed returns combined with urgency and secrecy warrant independent verification before paying.",
  },
];
export const initialTranscript = scenarios[0].lines.slice(0, 2).join("\n");
