export type Region = "Europe" | "Asia" | "Americas" | "Africa" | "Oceania" | "Middle East";

export type Destination = {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  region: Region;
  lat: number;
  lng: number;
  hue: number;
  currency: string;
  dailyBudget: number;
  bestMonths: string;
  summary: string;
  tags: string[];
  highlights: string[];
};

/**
 * Editorially curated catalog. No external API is required and nothing here is
 * presented as live availability or pricing — dailyBudget is an indicative
 * planning figure in USD.
 */
export const DESTINATIONS: Destination[] = [
  {
    id: "kyoto-jp",
    city: "Kyoto",
    country: "Japan",
    countryCode: "JP",
    region: "Asia",
    lat: 35.0116,
    lng: 135.7681,
    hue: 342,
    currency: "JPY",
    dailyBudget: 140,
    bestMonths: "Mar – May · Oct – Nov",
    summary:
      "Temple courtyards at dawn, quiet machiya lanes and a food culture that rewards walking slowly.",
    tags: ["Culture", "Food", "Slow travel"],
    highlights: ["Fushimi Inari at sunrise", "Nishiki Market", "Philosopher's Path"],
  },
  {
    id: "lisbon-pt",
    city: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    region: "Europe",
    lat: 38.7223,
    lng: -9.1393,
    hue: 32,
    currency: "EUR",
    dailyBudget: 110,
    bestMonths: "Apr – Jun · Sep – Oct",
    summary:
      "Atlantic light, tiled facades and hilltop viewpoints. A city that works equally well for a long weekend or a month.",
    tags: ["City break", "Coastal", "Value"],
    highlights: ["Alfama at sunset", "Belém pastéis", "Day trip to Sintra"],
  },
  {
    id: "reykjavik-is",
    city: "Reykjavík",
    country: "Iceland",
    countryCode: "IS",
    region: "Europe",
    lat: 64.1466,
    lng: -21.9426,
    hue: 198,
    currency: "ISK",
    dailyBudget: 210,
    bestMonths: "Jun – Aug · Feb – Mar",
    summary:
      "A compact capital as basecamp for glaciers, black-sand coastlines and the northern lights.",
    tags: ["Nature", "Road trip", "Adventure"],
    highlights: ["Golden Circle", "Blue Lagoon", "South coast waterfalls"],
  },
  {
    id: "marrakech-ma",
    city: "Marrakech",
    country: "Morocco",
    countryCode: "MA",
    region: "Africa",
    lat: 31.6295,
    lng: -7.9811,
    hue: 18,
    currency: "MAD",
    dailyBudget: 85,
    bestMonths: "Mar – May · Oct – Nov",
    summary:
      "Souks, rooftop mint tea and the High Atlas an hour away. Sensory, warm and surprisingly easy to navigate.",
    tags: ["Culture", "Markets", "Desert"],
    highlights: ["Jemaa el-Fna", "Majorelle Garden", "Atlas Mountains day trip"],
  },
  {
    id: "mexico-city-mx",
    city: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    region: "Americas",
    lat: 19.4326,
    lng: -99.1332,
    hue: 152,
    currency: "MXN",
    dailyBudget: 95,
    bestMonths: "Nov – Apr",
    summary:
      "World-class museums, neighbourhood kitchens and a design scene that keeps pulling you back.",
    tags: ["Food", "Art", "City break"],
    highlights: ["Museo Frida Kahlo", "Roma Norte", "Teotihuacán"],
  },
  {
    id: "cape-town-za",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    region: "Africa",
    lat: -33.9249,
    lng: 18.4241,
    hue: 188,
    currency: "ZAR",
    dailyBudget: 105,
    bestMonths: "Nov – Mar",
    summary:
      "A mountain in the middle of the city, two oceans, vineyards an hour inland. One of the easiest great trips to plan.",
    tags: ["Coastal", "Wine", "Hiking"],
    highlights: ["Table Mountain", "Cape Peninsula drive", "Stellenbosch"],
  },
  {
    id: "siem-reap-kh",
    city: "Siem Reap",
    country: "Cambodia",
    countryCode: "KH",
    region: "Asia",
    lat: 13.3671,
    lng: 103.8448,
    hue: 42,
    currency: "KHR",
    dailyBudget: 60,
    bestMonths: "Nov – Feb",
    summary:
      "Angkor at dawn, then slow afternoons by the river. A deeply rewarding low-budget base.",
    tags: ["History", "Value", "Slow travel"],
    highlights: ["Angkor Wat sunrise", "Bayon", "Tonlé Sap"],
  },
  {
    id: "copenhagen-dk",
    city: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    region: "Europe",
    lat: 55.6761,
    lng: 12.5683,
    hue: 208,
    currency: "DKK",
    dailyBudget: 165,
    bestMonths: "May – Sep",
    summary:
      "Bike-first streets, exceptional bakeries and a seaside calm that makes even three days feel unhurried.",
    tags: ["Design", "Food", "Cycling"],
    highlights: ["Nyhavn", "Torvehallerne", "Louisiana museum"],
  },
  {
    id: "queenstown-nz",
    city: "Queenstown",
    country: "New Zealand",
    countryCode: "NZ",
    region: "Oceania",
    lat: -45.0312,
    lng: 168.6626,
    hue: 196,
    currency: "NZD",
    dailyBudget: 175,
    bestMonths: "Dec – Mar · Jun – Aug",
    summary:
      "Alpine lakes, day-hike trails and the most scenic drive in the country on your doorstep.",
    tags: ["Adventure", "Nature", "Road trip"],
    highlights: ["Milford Sound", "Ben Lomond", "Glenorchy road"],
  },
  {
    id: "istanbul-tr",
    city: "Istanbul",
    country: "Türkiye",
    countryCode: "TR",
    region: "Middle East",
    lat: 41.0082,
    lng: 28.9784,
    hue: 268,
    currency: "TRY",
    dailyBudget: 90,
    bestMonths: "Apr – Jun · Sep – Oct",
    summary:
      "Two continents, layered history and ferries that turn commuting into the best hour of the day.",
    tags: ["Culture", "Food", "Markets"],
    highlights: ["Hagia Sophia", "Karaköy ferries", "Grand Bazaar"],
  },
  {
    id: "medellin-co",
    city: "Medellín",
    country: "Colombia",
    countryCode: "CO",
    region: "Americas",
    lat: 6.2442,
    lng: -75.5812,
    hue: 138,
    currency: "COP",
    dailyBudget: 70,
    bestMonths: "Dec – Mar · Jul – Aug",
    summary:
      "Eternal-spring weather, cable cars into the hills and a café culture built for remote work.",
    tags: ["Value", "Nature", "Remote work"],
    highlights: ["Comuna 13", "Parque Arví", "Guatapé"],
  },
  {
    id: "seoul-kr",
    city: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    region: "Asia",
    lat: 37.5665,
    lng: 126.978,
    hue: 220,
    currency: "KRW",
    dailyBudget: 135,
    bestMonths: "Apr – May · Sep – Oct",
    summary:
      "Palaces beside neon, late-night markets, and a transit system that makes the whole city feel close.",
    tags: ["Food", "City break", "Shopping"],
    highlights: ["Gyeongbokgung", "Bukchon", "Gwangjang Market"],
  },
  {
    id: "amalfi-it",
    city: "Amalfi Coast",
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    lat: 40.6333,
    lng: 14.6029,
    hue: 48,
    currency: "EUR",
    dailyBudget: 195,
    bestMonths: "May – Jun · Sep",
    summary:
      "Cliffside villages and lemon groves — best done by ferry, with as few plans as possible.",
    tags: ["Coastal", "Romance", "Slow travel"],
    highlights: ["Path of the Gods", "Ravello", "Positano by ferry"],
  },
  {
    id: "oaxaca-mx",
    city: "Oaxaca",
    country: "Mexico",
    countryCode: "MX",
    region: "Americas",
    lat: 17.0732,
    lng: -96.7266,
    hue: 24,
    currency: "MXN",
    dailyBudget: 80,
    bestMonths: "Oct – Mar",
    summary:
      "The most focused food city in Mexico, with mezcal, textiles and ruins in easy reach.",
    tags: ["Food", "Culture", "Markets"],
    highlights: ["Mercado 20 de Noviembre", "Monte Albán", "Hierve el Agua"],
  },
  {
    id: "dubai-ae",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Middle East",
    lat: 25.2048,
    lng: 55.2708,
    hue: 36,
    currency: "AED",
    dailyBudget: 200,
    bestMonths: "Nov – Mar",
    summary:
      "A long layover city worth extending: desert mornings, serious restaurants and efficient connections.",
    tags: ["Luxury", "Desert", "Stopover"],
    highlights: ["Old Dubai souks", "Desert reserve", "Dubai Marina"],
  },
  {
    id: "zanzibar-tz",
    city: "Zanzibar",
    country: "Tanzania",
    countryCode: "TZ",
    region: "Africa",
    lat: -6.1659,
    lng: 39.2026,
    hue: 174,
    currency: "TZS",
    dailyBudget: 90,
    bestMonths: "Jun – Oct",
    summary:
      "Turquoise water, spice-trade history and the rare beach destination where the town is the highlight.",
    tags: ["Beach", "Culture", "Slow travel"],
    highlights: ["Stone Town", "Nungwi", "Spice farm tour"],
  },
  {
    id: "ljubljana-si",
    city: "Ljubljana",
    country: "Slovenia",
    countryCode: "SI",
    region: "Europe",
    lat: 46.0569,
    lng: 14.5058,
    hue: 126,
    currency: "EUR",
    dailyBudget: 100,
    bestMonths: "May – Sep",
    summary:
      "A green, car-light capital that makes a perfect rail base for Lake Bled and the Julian Alps.",
    tags: ["Rail", "Nature", "Value"],
    highlights: ["Lake Bled", "Vintgar Gorge", "Metelkova"],
  },
  {
    id: "tbilisi-ge",
    city: "Tbilisi",
    country: "Georgia",
    countryCode: "GE",
    region: "Europe",
    lat: 41.7151,
    lng: 44.8271,
    hue: 286,
    currency: "GEL",
    dailyBudget: 65,
    bestMonths: "Apr – Jun · Sep – Oct",
    summary:
      "Sulphur baths, balconied old town and a wine culture older than almost anywhere else.",
    tags: ["Value", "Food", "Wine"],
    highlights: ["Abanotubani", "Kazbegi day trip", "Rustaveli"],
  },
];

export const REGIONS: Region[] = ["Europe", "Asia", "Americas", "Africa", "Oceania", "Middle East"];

export function findDestination(city: string, countryCode?: string | null) {
  const normalized = city.trim().toLowerCase();
  return (
    DESTINATIONS.find(
      (destination) =>
        destination.city.toLowerCase() === normalized &&
        (!countryCode || destination.countryCode === countryCode.toUpperCase()),
    ) ??
    DESTINATIONS.find((destination) => destination.city.toLowerCase() === normalized) ??
    null
  );
}

export function recommendedDestinations(limit = 4, seed = 0) {
  const offset = Math.abs(Math.trunc(seed)) % DESTINATIONS.length;
  return Array.from({ length: Math.min(limit, DESTINATIONS.length) }, (_, index) => {
    return DESTINATIONS[(offset + index * 3) % DESTINATIONS.length];
  });
}
