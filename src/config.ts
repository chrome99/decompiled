export const SITE = {
  website: "https://ezra-feldman.pages.dev/",
  author: "Ezra Feldman",
  profile: "https://github.com/chrome99",
  desc: "Some notes on programming.",
  title: "Decompiled",
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true,
  editPost: {
    enabled: true,
    text: "Suggest Changes",
    url: "https://github.com/chrome99/blog/edit/main/",
  },
  dynamicOgImage: true,
  lang: "en",
  timezone: "Asia/Jerusalem",
} as const;
