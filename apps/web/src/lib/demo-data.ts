export const demoTeam = {
  name: "IT Operations",
  present: 4,
  total: 6,
  members: [
    { name: "Jan Vinding", initials: "JV", status: "Til stede", self: true },
    { name: "Lars Bech", initials: "LB", status: "Til stede" },
    { name: "Ahmed Nasser", initials: "AN", status: "Fraværende" },
    { name: "Sofie Lund", initials: "SL", status: "Fri" },
    { name: "Ida Krogh", initials: "IK", status: "Ferie" },
    { name: "Mette Holm", initials: "MH", status: "Til stede" },
  ],
};

export const demoRequests = [
  {
    type: "Ferie",
    typeClass: "vacation" as const,
    dates: "man 26. okt – fre 30. okt · 5 arbejdsdage",
    status: "Afventer godkendelse · sendt 8. okt 2026",
    statusKind: "pending" as const,
  },
];
