// Deep Seas — Bloomberg terminal mock dataset
// Each weapon maps to a fictional company set + weekly YoY growth %
// Last column (current week) is the "reacting" column — animate this one on trigger
// Structure mirrors real Bloomberg comp tables: Week Ending dates, green = positive, red = negative

const weekEndingDates = ["16-Apr", "23-Apr", "30-Apr", "07-May", "14-May", "21-May", "28-May", "04-Jun", "11-Jun"];

const bloombergData = {

  // ===== DISRUPTOR =====

  D01: {
    title: "Global Shipping Index — YoY Growth %",
    compSource: "Analyst Curated (Maritime)",
    companies: [
      { name: "Hormuz Transit Median",   color: "white",  base: [4.8, -0.6, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, -18.4] },
      { name: "Vantage Tankers Intl",    color: "blue",   base: [3.1, -4.8, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, -22.1] },
      { name: "Meridian Bulk Carriers",  color: "amber",  base: [10.4, 0.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, -19.6] },
      { name: "Coastal Freight Holdings",color: "orange", base: [6.5, 1.4, -2.8, -7.4, 9.2, 0.1, -3.1, -0.4, -25.3] },
      { name: "Strait Oil Logistics",    color: "red",    base: [-21.0, -2.5, -12.9, -22.8, -13.9, -25.8, -8.5, -10.9, -34.2] },
    ],
    reactionNote: "Oil +18%, shipping equities -22%"
  },

  D02: {
    title: "Defender Cargo Value Index — YoY Growth %",
    compSource: "Analyst Curated (Trade)",
    companies: [
      { name: "Cargo Value Median",      color: "white",  base: [5.1, -0.5, -4.9, -6.1, 12.5, 2.3, 0.6, 0.1, -8.7] },
      { name: "Burlington Maritime",     color: "blue",   base: [3.4, -5.1, -8.0, -0.9, 18.9, 6.8, 7.0, 0.8, -10.2] },
      { name: "TJX Global Shipping",     color: "amber",  base: [10.9, 1.0, -0.7, -5.8, 17.0, 4.6, 4.6, 7.1, -9.4] },
      { name: "Ross Freight Inc",        color: "orange", base: [6.7, 1.5, -2.5, -7.7, 9.5, 0.1, -3.3, -0.5, -11.8] },
    ],
    reactionNote: "Cargo index -15%, compounding"
  },

  D03: {
    title: "Crude Spot & Tanker Equities — YoY Growth %",
    compSource: "Analyst Curated (Energy)",
    companies: [
      { name: "Crude Spot Median",       color: "white",  base: [5.0, -0.7, -5.3, -6.4, 13.1, 2.0, 0.4, 0.2, 24.6] },
      { name: "Gulf Tanker Co",          color: "blue",   base: [3.2, -5.0, -8.1, -1.0, 18.6, 6.5, 6.8, 0.6, -31.4] },
      { name: "Seabridge Energy",        color: "amber",  base: [10.6, 0.8, -1.0, -5.6, 16.9, 4.3, 4.4, 7.0, 19.8] },
      { name: "Nautilus Shipping Trust", color: "red",    base: [-2.1, 1.2, -2.7, -7.5, 9.3, 0.0, -3.2, -0.6, -28.9] },
    ],
    reactionNote: "Crude spot spike, vessel revenue frozen"
  },

  D04: {
    title: "Port Infrastructure Equities — YoY Growth %",
    compSource: "Analyst Curated (Infra)",
    companies: [
      { name: "Port Equities Median",    color: "white",  base: [4.9, -0.6, -5.2, -6.3, 12.9, 2.1, 0.5, 0.1, -29.7] },
      { name: "Harborline Holdings",     color: "blue",   base: [3.3, -4.9, -8.0, -1.1, 18.4, 6.3, 6.7, 0.5, -33.5] },
      { name: "Defender Underwriters",   color: "amber",  base: [10.5, 0.9, -1.2, -5.4, 16.6, 4.1, 4.3, 6.8, -27.2] },
      { name: "Quaystone Logistics",     color: "red",    base: [-1.8, -2.6, -12.8, -22.5, -13.6, -25.5, -8.3, -10.6, -41.3] },
    ],
    reactionNote: "Port equities -30%, insurance suspended"
  },

  D05: {
    title: "Lloyd's War Risk Index — YoY Growth %",
    compSource: "Analyst Curated (Lloyd's)",
    companies: [
      { name: "War Risk Median",         color: "white",  base: [5.0, -0.6, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, 0.0] },
      { name: "Britannia P&I Club",      color: "blue",   base: [3.1, -4.8, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, 0.0] },
      { name: "Lloyd's Syndicate 4729",  color: "amber",  base: [10.4, 0.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, 0.0] },
      { name: "Maritime Mutual Ins",     color: "red",    base: [-21.0, -2.5, -12.9, -22.8, -13.9, -25.8, -8.5, -10.9, 0.0] },
    ],
    reactionNote: "All movement frozen — flat line on every ticker"
  },

  D06: {
    title: "Port Logistics Data Integrity — YoY Growth %",
    compSource: "Analyst Curated (Cyber)",
    companies: [
      { name: "AIS Integrity Median",    color: "white",  base: [4.8, -0.6, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, "ERR"] },
      { name: "Nordhaven Port Systems",  color: "blue",   base: [3.1, -4.8, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, "ERR"] },
      { name: "Cascade Routing Tech",    color: "amber",  base: [10.4, 0.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, "ERR"] },
      { name: "Defender Customs Net",    color: "red",    base: [-21.0, -2.5, -12.9, -22.8, -13.9, -25.8, -8.5, -10.9, "ERR"] },
    ],
    reactionNote: "Data corruption — terminal returns ERR"
  },

  // ===== DEFENDER =====

  R01: {
    title: "Naval Escort Transit Recovery — YoY Growth %",
    compSource: "Analyst Curated (Maritime)",
    companies: [
      { name: "Transit Recovery Median", color: "white",  base: [-18.4, -10.2, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, 9.6] },
      { name: "Vantage Tankers Intl",    color: "blue",   base: [-22.1, -12.5, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, 11.2] },
      { name: "Meridian Bulk Carriers",  color: "amber",  base: [-19.6, -8.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, 8.4] },
    ],
    reactionNote: "Shipping recovery, oil stabilising"
  },

  R02: {
    title: "Re-flagged Vessel Cargo Value — YoY Growth %",
    compSource: "Analyst Curated (Trade)",
    companies: [
      { name: "Cargo Value Median",      color: "white",  base: [-8.7, -3.1, -4.9, -6.1, 12.5, 2.3, 0.6, 0.1, 6.8] },
      { name: "Burlington Maritime",     color: "blue",   base: [-10.2, -4.0, -8.0, -0.9, 18.9, 6.8, 7.0, 0.8, 7.9] },
      { name: "TJX Global Shipping",     color: "amber",  base: [-9.4, -2.2, -0.7, -5.8, 17.0, 4.6, 4.6, 7.1, 5.6] },
    ],
    reactionNote: "Cargo index recovers partially"
  },

  R03: {
    title: "Cape Route Transit Time Index — YoY Growth %",
    compSource: "Analyst Curated (Logistics)",
    companies: [
      { name: "Transit Time Median",     color: "white",  base: [5.0, -0.6, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, 40.0] },
      { name: "Cape Route Freight",      color: "blue",   base: [3.1, -4.8, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, 43.5] },
      { name: "Quaystone Logistics",     color: "amber",  base: [10.4, 0.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, 37.2] },
    ],
    reactionNote: "Transit time +40%, supply chain intact"
  },

  R04: {
    title: "Volatility Index (Diplomatic Channel) — YoY Growth %",
    compSource: "Analyst Curated (Macro)",
    companies: [
      { name: "Volatility Median",       color: "white",  base: [12.8, 8.1, 4.5, 2.2, 0.8, -1.1, -3.5, -4.2, -6.8] },
      { name: "Gulf Risk Index Fund",    color: "blue",   base: [18.3, 10.4, 6.9, 0.7, -1.2, -3.4, -5.6, -6.7, -9.1] },
      { name: "Strait Stability Fund",   color: "amber",  base: [16.7, 9.2, 4.5, 1.9, 0.4, -1.5, -3.8, -4.5, -7.3] },
    ],
    reactionNote: "Volatility index drops slightly"
  },

  R05: {
    title: "Strategic Reserve Release Impact — YoY Growth %",
    compSource: "Analyst Curated (Energy)",
    companies: [
      { name: "Crude Spot Median",       color: "white",  base: [24.6, 18.2, 10.5, 5.1, 1.2, -1.1, -3.5, -6.2, -12.0] },
      { name: "Gulf Tanker Co",          color: "blue",   base: [-31.4, -22.5, -10.9, -5.6, -1.2, 1.4, 3.6, 5.8, 9.4] },
      { name: "Seabridge Energy",        color: "amber",  base: [19.8, 14.1, 8.5, 4.2, 0.9, -1.0, -2.8, -5.1, -10.6] },
    ],
    reactionNote: "Oil -12%, D05 fear signal neutralised"
  },

  R06: {
    title: "Coalition Naval Response Index — YoY Growth %",
    compSource: "Analyst Curated (Defense)",
    companies: [
      { name: "Coalition Index Median",  color: "white",  base: [5.0, -0.6, -5.1, -6.2, 12.8, 2.1, 0.5, 0.2, 14.6] },
      { name: "Allied Maritime Defense", color: "blue",   base: [3.1, -4.8, -7.9, -1.2, 18.3, 6.4, 6.9, 0.7, 17.2] },
      { name: "Joint Fleet Holdings",    color: "amber",  base: [10.4, 0.9, -1.1, -5.5, 16.7, 4.2, 4.5, 6.9, 12.9] },
    ],
    reactionNote: "All Disruptor decay accelerates"
  },
};

// Usage pattern in detector.html:
//
// function fireWeapon(weaponCode) {
//   const data = bloombergData[weaponCode];
//   renderTable(data, weekEndingDates);
//   animateColumn(8); // animate the last (current week) column ticking to its value
// }
//
// animateColumn() should count from the previous week's value up/down to the
// current week's value over ~800ms, so it reads as a live tick rather than a snap.

export { bloombergData, weekEndingDates };
