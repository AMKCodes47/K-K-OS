/*
  K&K OS CONTENT FILE — YOUR MAIN CUSTOMISATION ZONE
  -------------------------------------------------
  Edit the values below. Keep quote marks and commas intact.
  Profile pictures go in media/profiles/ (see README_FIRST.txt).
  Photos/videos go in media/memory-vault/kartik, /kritika, or /shared.
  The filename becomes the Polaroid title. Dates and captions can be entered below.
*/
window.KK_DATA = {
  profiles: {
    kartik: {
      name: "Kartik",
      handle: "Kartik.exe",
      role: "THE TECH DEPARTMENT",
      tagline: "Probably has an app for this.",
      title: "Chief Problem Over-Engineer",
      birthday: "Birthday mode: ENABLED",
      description: "A little bit code, a little bit chaos, and a suspicious confidence that every problem needs a custom solution.",
      welcomeLine: "Everything is under control. Allegedly.",
      profileImage: "kartik.jpg",
      accent: "blue"
    },
    kritika: {
      name: "Kritika",
      handle: "Kritika.exe",
      role: "THE PLOT TWIST DEPARTMENT",
      tagline: "Knows how the story ends. Reads it anyway.",
      title: "Director of Plot Twists",
      birthday: "Birthday mode: ENABLED",
      description: "Rom-com heart, thriller-reader instincts, and absolutely no obligation to explain the plot to anyone.",
      welcomeLine: "The plot is plotting. Please proceed.",
      profileImage: "kritika.jpg",
      accent: "rose"
    }
  },
  // Use each media filename exactly as it appears in the relevant memory folder.
  // Example key: "shared/Trampoline Madness.png"
  memories: {
    "shared/Trampoline Madness.png": { date: "ADD THE DATE", caption: "A perfectly normal day. Allegedly.", featured: true },
    "kartik/RENAME-ME.jpg": { date: "ADD THE DATE", caption: "Replace this example with an actual memory." },
    "kritika/RENAME-ME.jpg": { date: "ADD THE DATE", caption: "Replace this example with an actual memory." }
  },
  quotes: {
    kartik: [
      { quote: "[Add Kartik's iconic line here]", context: "[What happened?]", date: "[Date / era]" },
      { quote: "[Copy-paste another quote here]", context: "[Context goes here]", date: "[Date / era]" },
      { quote: "[The line that gets repeated every single time]", context: "[Context goes here]", date: "[Date / era]" },
      { quote: "[Quote #4]", context: "[Context]", date: "[Date]" },
      { quote: "[Quote #5]", context: "[Context]", date: "[Date]" }
    ],
    kritika: [
      { quote: "[Add Kritika's iconic line here]", context: "[What happened?]", date: "[Date / era]" },
      { quote: "[Copy-paste another quote here]", context: "[Context goes here]", date: "[Date / era]" },
      { quote: "[A line with suspiciously accurate predictions]", context: "[Context goes here]", date: "[Date / era]" },
      { quote: "[Quote #4]", context: "[Context]", date: "[Date]" },
      { quote: "[Quote #5]", context: "[Context]", date: "[Date]" }
    ],
    shared: [
      { quote: "[Add a shared inside joke here]", context: "[The lore behind it]", date: "[Date / era]" },
      { quote: "[The sentence that somehow became a whole personality]", context: "[Context]", date: "[Date / era]" }
    ]
  },
  lore: {
    kartik: [
      { title: "CASE FILE 001 — THE UNSOLVED BUG", tag: "TECHNICAL INCIDENT", body: "[Write the real incident here. What happened, who was there, and why does it still get mentioned?]" },
      { title: "CASE FILE 002 — QUESTIONABLE OPTIMISATION", tag: "REPEAT OFFENDER", body: "[Add one of Kartik's recurring bits.]" }
    ],
    kritika: [
      { title: "CASE FILE 001 — THE PLOT WAS OBVIOUS", tag: "PREDICTION ARCHIVE", body: "[Write an actual prediction, incident, or running joke here.]" },
      { title: "CASE FILE 002 — SPOILER-FREE ZONE", tag: "RESTRICTED FILE", body: "[Add one of Kritika's recurring bits.]" }
    ],
    shared: [
      { title: "CASE FILE 000 — HOW DID THIS BECOME A THING?", tag: "GROUP INCIDENT", body: "[The shared lore goes here. Start from the beginning, or don't. The confusion may be part of the story.]" }
    ]
  },
  stats: {
    kartik: [
      { label: "Ideas that could've been a text", value: 87, suffix: "+" },
      { label: "Tabs open in the brain", value: 42, suffix: " (minimum)" },
      { label: "Solutions involving an app", value: 96, suffix: "%" },
      { label: "Normal behaviour", value: 12, suffix: "/100" }
    ],
    kritika: [
      { label: "Plots predicted early", value: 91, suffix: "%" },
      { label: "Books on the mental TBR", value: 73, suffix: "+" },
      { label: "Unspoken side-eye", value: 88, suffix: "/100" },
      { label: "Tolerance for boring plots", value: 4, suffix: "%" }
    ],
    shared: [
      { label: "Shared brain cells", value: 2, suffix: " (on rotation)" },
      { label: "Lore still under investigation", value: 100, suffix: "%" }
    ]
  },
  letters: {
    kartik: {
      title: "For the one who can probably automate this",
      opening: "Happy birthday, Kartik.",
      body: "[Write your personal message here. Start with the jokes, then say the thing you actually want him to remember.]",
      signoff: "Keep building things. Keep being you. — Arslan"
    },
    kritika: {
      title: "For the one who knows the plot twist",
      opening: "Happy birthday, Kritika.",
      body: "[Write your personal message here. A little chaos, a little sincerity, and a reminder that she's genuinely appreciated.]",
      signoff: "May your year have excellent characters and no unnecessary plot holes. — Arslan"
    }
  },
  sharedBirthday: {
    title: "TWO USERS. ONE BIRTHDAY. ZERO NORMAL SETTINGS.",
    message: "One link, two completely different operating systems, and a collection of memories that would make absolutely no sense to anyone else. That's the point. Happy birthday, both of you."
  }
};
