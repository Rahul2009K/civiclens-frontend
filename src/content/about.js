// About page copy. Edit freely: this is the creator's own story, in their own words.

export const ABOUT = {
  headline: 'Built by a student who wants to vote informed.',
  intro:
    "I'm Rahul, a junior at Brookfield Central High School in Wisconsin. I built Billshelf to raise awareness of what our government is actually doing, because most people my age only hear about a law after it passes, usually from a headline or a thirty-second video.",

  story: [
    {
      heading: 'Why I built it',
      paragraphs: [
        "Young people are the least politically involved group in the country: voters under 25 turn out at the lowest rate of any age group. I don't think that's because we don't care. It's because the information isn't built for us.",
        "Bills are long and written in legal language, so even curious people give up after the first paragraph. That leaves teenagers out of conversations about the things that shape our future: what college costs, which jobs exist, how the internet is regulated, what happens to the climate, who gets to call this country home.",
        "Many of these bills don't affect me directly today. They will soon. In a few years my friends and I will be voters, and I want us to walk into that booth knowing what our representatives actually did, not just what they said.",
      ],
    },
    {
      heading: 'Where I come from',
      paragraphs: [
        "My family immigrated from India, and I'm a first-generation immigrant. I've seen how hard it is to follow American government when the language is dense and nobody explains the context. A lot of first-generation families learn the system one confusing form at a time.",
        "Billshelf is the tool I wish my family and I had: something that explains what Congress is doing in words anyone can follow, without telling you what to think about it.",
      ],
    },
  ],

  accuracy: [
    'Every bill comes straight from Congress.gov, the official record kept by the Library of Congress.',
    'Claude, an AI model by Anthropic, rewrites each bill in plain English from the official summary or, when that is not published yet, from the full text of the bill itself. Every bill page says which one it used.',
    'Summaries are written to be neutral. Billshelf never tells you whether a bill is good or bad.',
    'AI can make mistakes, so every bill links to its official text. Check it before you cite a bill in class or an argument.',
  ],

  privacy: [
    'You can read everything without an account.',
    'Signing in with Google is only needed to save bills and vote. Billshelf stores your saved bills and your votes under an anonymous account ID.',
    'Vote totals are public counts. Nobody can see how you voted.',
    'The site uses Google Analytics to count visits. There are no ads and no data is sold.',
  ],

  builtWith: [
    ['Congress.gov API', 'bill data, official summaries and full text'],
    ['Claude (Anthropic)', 'plain-English summaries'],
    ['Python + Flask', 'the API, hosted on Render'],
    ['React + Vite', 'this website, hosted on Vercel'],
    ['Firebase', 'Google sign-in, watchlists and votes'],
  ],

}
