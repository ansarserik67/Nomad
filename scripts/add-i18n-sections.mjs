import fs from "node:fs";

const path = "src/lib/i18n/dictionaries.ts";
let source = fs.readFileSync(path, "utf8");

function insertBefore(anchor, block) {
  if (!source.includes(anchor)) throw new Error(`anchor missing: ${anchor}`);
  source = source.replace(anchor, block + anchor);
}

const en = `  hotels: {
    destination: "Destination",
    destinationHint: "City, area or country — exactly as you would type it on Booking.com.",
    destinationPlaceholder: "Almaty, Kazakhstan",
    checkIn: "Check-in",
    checkOut: "Check-out",
    adults: "Adults",
    children: "Children",
    rooms: "Rooms",
    childAgeLabel: "Child {index} age",
    childrenAges: "Children's ages",
    childrenAgesHint: "Booking.com needs an age per child to price the stay correctly.",
    totalBudget: "Total budget for the stay",
    budgetPerNightHint: "{amount} per night across {nights} nights.",
    budgetHintOnly: "Used for the in-app calculation and hint only.",
    budgetNotSet: "Budget not set",
    datesNotSet: "Dates not set",
    rating: "Preferred hotel rating",
    anyRating: "Any rating",
    stars: "{stars}+ stars",
    location: "Preferred location",
    locationHint: "Neighbourhood or landmark, e.g. “near Chimbulak”.",
    locationPlaceholder: "City centre",
    amenities: "Amenities",
    notes: "Additional preferences",
    notesHint: "Anything else — quiet floor, late check-in, connecting rooms.",
    notesPlaceholder: "Late check-in, quiet room, walkable to the old town.",
    searchHotels: "Search hotels",
    opensBooking: "Opens Booking.com in a new tab. You finish and book there.",
    bookingOpening: "Booking.com is opening in a new tab",
    bookingExplanation:
      "Continue the search and booking on Booking.com. NOMAD keeps your brief — nights, guests and budget — and files the reservation once you add it to the Booking Manager.",
    budgetPerNightResult: "Budget per night: {amount}",
    applyFilters: "Booking.com cannot receive these through the link — apply them there:",
    openSearchAgain: "Open the search again",
    nightCount: "{count} nights",
    nightCountOne: "{count} night",
    perNightShort: "{amount} / night",
    adultsCount: "{count} adults",
    childrenCount: "{count} children",
    roomsCount: "{count} rooms",
    amenityWifi: "Wi-Fi",
    amenityBreakfast: "Breakfast",
    amenityPool: "Swimming pool",
    amenityParking: "Parking",
    amenityGym: "Gym",
    amenitySpa: "Spa",
    amenityShuttle: "Airport shuttle",
    amenityPets: "Pet friendly",
    amenityFamily: "Family rooms",
    amenityKitchen: "Kitchen",
  },
  wallet: {
    eyebrow: "Currency",
    title: "Convert with live reference rates",
    description: "Frankfurter · European Central Bank reference rates",
    refreshRates: "Refresh rates",
    from: "From",
    to: "To",
    swap: "Swap currencies",
    amount: "Amount",
    unavailable: "Exchange rates are unavailable right now.",
    unreachable: "Could not reach the exchange-rate service.",
    choosePair: "Choose a currency pair to see a rate.",
    referenceDate: " · reference date {date}",
    indicative: "Indicative mid-market rates, not the rate your bank or card will apply.",
    fromTo: "1 {base} = {rate} {target}",
  },
`;

const ru = `  hotels: {
    destination: "Направление",
    destinationHint: "Город, район или страна — так, как вы ввели бы на Booking.com.",
    destinationPlaceholder: "Алматы, Казахстан",
    checkIn: "Заезд",
    checkOut: "Выезд",
    adults: "Взрослые",
    children: "Дети",
    rooms: "Номера",
    childAgeLabel: "Возраст ребёнка {index}",
    childrenAges: "Возраст детей",
    childrenAgesHint: "Booking.com нужен возраст каждого ребёнка, чтобы верно рассчитать цену.",
    totalBudget: "Общий бюджет проживания",
    budgetPerNightHint: "{amount} за ночь на {nights} ночей.",
    budgetHintOnly: "Используется только для расчёта и подсказки в приложении.",
    budgetNotSet: "Бюджет не указан",
    datesNotSet: "Даты не выбраны",
    rating: "Желаемый рейтинг отеля",
    anyRating: "Любой рейтинг",
    stars: "{stars}+ звёзд",
    location: "Желаемое расположение",
    locationHint: "Район или ориентир, например «рядом с Чимбулаком».",
    locationPlaceholder: "Центр города",
    amenities: "Удобства",
    notes: "Дополнительные пожелания",
    notesHint: "Всё остальное — тихий этаж, поздний заезд, смежные номера.",
    notesPlaceholder: "Поздний заезд, тихий номер, рядом со старым городом.",
    searchHotels: "Найти отели",
    opensBooking: "Откроет Booking.com в новой вкладке. Бронирование — там.",
    bookingOpening: "Booking.com открывается в новой вкладке",
    bookingExplanation:
      "Продолжите поиск и бронирование на Booking.com. NOMAD сохраняет ваш запрос — ночи, гостей и бюджет — и добавит бронь, когда вы внесёте её в Booking Manager.",
    budgetPerNightResult: "Бюджет за ночь: {amount}",
    applyFilters: "Booking.com не примет это по ссылке — выберите на сайте:",
    openSearchAgain: "Открыть поиск снова",
    nightCount: "{count} ночей",
    nightCountOne: "{count} ночь",
    perNightShort: "{amount} / ночь",
    adultsCount: "{count} взрослых",
    childrenCount: "{count} детей",
    roomsCount: "{count} номеров",
    amenityWifi: "Wi-Fi",
    amenityBreakfast: "Завтрак",
    amenityPool: "Бассейн",
    amenityParking: "Парковка",
    amenityGym: "Тренажёрный зал",
    amenitySpa: "Спа",
    amenityShuttle: "Трансфер из аэропорта",
    amenityPets: "Можно с питомцами",
    amenityFamily: "Семейные номера",
    amenityKitchen: "Кухня",
  },
  wallet: {
    eyebrow: "Валюта",
    title: "Конвертация по актуальным справочным курсам",
    description: "Frankfurter · справочные курсы Европейского центрального банка",
    refreshRates: "Обновить курсы",
    from: "Из",
    to: "В",
    swap: "Поменять валюты",
    amount: "Сумма",
    unavailable: "Курсы валют сейчас недоступны.",
    unreachable: "Не удалось связаться с сервисом курсов.",
    choosePair: "Выберите пару валют, чтобы увидеть курс.",
    referenceDate: " · дата курса {date}",
    indicative: "Ориентировочные рыночные курсы, а не курс вашего банка или карты.",
    fromTo: "1 {base} = {rate} {target}",
  },
`;

const kk = `  hotels: {
    destination: "Бағыт",
    destinationHint: "Қала, аудан немесе ел — Booking.com-да тергендей етіп.",
    destinationPlaceholder: "Алматы, Қазақстан",
    checkIn: "Кіру",
    checkOut: "Шығу",
    adults: "Ересектер",
    children: "Балалар",
    rooms: "Бөлмелер",
    childAgeLabel: "{index}-баланың жасы",
    childrenAges: "Балалардың жасы",
    childrenAgesHint: "Booking.com бағаны дұрыс есептеу үшін әр баланың жасын қажет етеді.",
    totalBudget: "Тұрудың жалпы бюджеті",
    budgetPerNightHint: "{nights} түн үшін түніне {amount}.",
    budgetHintOnly: "Тек қосымшадағы есептеу мен кеңес үшін қолданылады.",
    budgetNotSet: "Бюджет көрсетілмеген",
    datesNotSet: "Күндер таңдалмаған",
    rating: "Қалаған қонақүй рейтингі",
    anyRating: "Кез келген рейтинг",
    stars: "{stars}+ жұлдыз",
    location: "Қалаған орналасуы",
    locationHint: "Аудан немесе бағдар, мысалы «Шымбұлақ маңы».",
    locationPlaceholder: "Қала орталығы",
    amenities: "Қолайлықтар",
    notes: "Қосымша қалаулар",
    notesHint: "Басқа да нәрселер — тыныш қабат, кеш кіру, жалғас бөлмелер.",
    notesPlaceholder: "Кеш кіру, тыныш бөлме, ескі қалаға жақын.",
    searchHotels: "Қонақүй іздеу",
    opensBooking: "Booking.com жаңа қосымша бетте ашылады. Брондау — сонда.",
    bookingOpening: "Booking.com жаңа қосымша бетте ашылуда",
    bookingExplanation:
      "Іздеуді және брондауды Booking.com-да жалғастырыңыз. NOMAD сіздің сұрауыңызды — түндер, қонақтар және бюджет — сақтап, бронды Booking Manager-ге қосқанда тіркейді.",
    budgetPerNightResult: "Түніне бюджет: {amount}",
    applyFilters: "Booking.com мұны сілтеме арқылы қабылдамайды — сайтта таңдаңыз:",
    openSearchAgain: "Іздеуді қайта ашу",
    nightCount: "{count} түн",
    nightCountOne: "{count} түн",
    perNightShort: "{amount} / түн",
    adultsCount: "{count} ересек",
    childrenCount: "{count} бала",
    roomsCount: "{count} бөлме",
    amenityWifi: "Wi-Fi",
    amenityBreakfast: "Таңғы ас",
    amenityPool: "Бассейн",
    amenityParking: "Тұрақ",
    amenityGym: "Спорт залы",
    amenitySpa: "Спа",
    amenityShuttle: "Әуежайдағы трансфер",
    amenityPets: "Үй жануарларымен болады",
    amenityFamily: "Отбасылық бөлмелер",
    amenityKitchen: "Ас үй",
  },
  wallet: {
    eyebrow: "Валюта",
    title: "Ағымдағы анықтамалық бағаммен айырбастау",
    description: "Frankfurter · Еуропа орталық банкінің анықтамалық бағамдары",
    refreshRates: "Бағамдарды жаңарту",
    from: "Қайдан",
    to: "Қайда",
    swap: "Валюталарды ауыстыру",
    amount: "Сома",
    unavailable: "Валюта бағамдары қазір қолжетімсіз.",
    unreachable: "Бағам қызметіне қосылу мүмкін болмады.",
    choosePair: "Бағамды көру үшін валюта жұбын таңдаңыз.",
    referenceDate: " · бағам күні {date}",
    indicative: "Бағдарламалық нарықтық бағамдар, банк немесе карта қолданатын бағам емес.",
    fromTo: "1 {base} = {rate} {target}",
  },
`;

const anchors = [
  ['  profile: {\n    fullName: "Full name",', en],
  ['  profile: {\n    fullName: "Имя и фамилия",', ru],
  ['  profile: {\n    fullName: "Аты-жөні",', kk],
];

for (const [anchor, block] of anchors) insertBefore(anchor, block);

// Booking validation messages
const messageBlocks = [
  [
    'const enMessages: Record<string, string> = {',
    {
      "Enter a city or country.": "Enter a city or country.",
      "Keep the destination under 120 characters.":
        "Keep the destination under 120 characters.",
      "Choose a check-in date.": "Choose a check-in date.",
      "Use a valid date.": "Use a valid date.",
      "Choose a check-out date.": "Choose a check-out date.",
      "Check-out must be after check-in.": "Check-out must be after check-in.",
      "Booking.com searches are limited to 60 nights.":
        "Booking.com searches are limited to 60 nights.",
      "Between 1 and 16 adults.": "Between 1 and 16 adults.",
      "Between 0 and 8 children.": "Between 0 and 8 children.",
      "Add an age for every child.": "Add an age for every child.",
      "Child ages must be 0–17.": "Child ages must be 0–17.",
      "Between 1 and 8 rooms.": "Between 1 and 8 rooms.",
      "Enter a budget of 0 or more.": "Enter a budget of 0 or more.",
      "Pick a currency.": "Pick a currency.",
      "Keep the preferred area under 120 characters.":
        "Keep the preferred area under 120 characters.",
      "Keep the extra notes under 500 characters.":
        "Keep the extra notes under 500 characters.",
    },
  ],
  [
    'const ruMessages: Record<string, string> = {',
    {
      "Enter a city or country.": "Укажите город или страну.",
      "Keep the destination under 120 characters.":
        "Сократите направление до 120 символов.",
      "Choose a check-in date.": "Выберите дату заезда.",
      "Use a valid date.": "Укажите корректную дату.",
      "Choose a check-out date.": "Выберите дату выезда.",
      "Check-out must be after check-in.": "Дата выезда должна быть позже заезда.",
      "Booking.com searches are limited to 60 nights.":
        "Поиск на Booking.com ограничен 60 ночами.",
      "Between 1 and 16 adults.": "Взрослых: от 1 до 16.",
      "Between 0 and 8 children.": "Детей: от 0 до 8.",
      "Add an age for every child.": "Укажите возраст каждого ребёнка.",
      "Child ages must be 0–17.": "Возраст детей: от 0 до 17.",
      "Between 1 and 8 rooms.": "Номеров: от 1 до 8.",
      "Enter a budget of 0 or more.": "Укажите бюджет 0 или больше.",
      "Pick a currency.": "Выберите валюту.",
      "Keep the preferred area under 120 characters.":
        "Сократите район до 120 символов.",
      "Keep the extra notes under 500 characters.":
        "Сократите заметки до 500 символов.",
    },
  ],
  [
    'const kkMessages: Record<string, string> = {',
    {
      "Enter a city or country.": "Қаланы немесе елді көрсетіңіз.",
      "Keep the destination under 120 characters.":
        "Бағытты 120 таңбадан аспайтын етіп қысқартыңыз.",
      "Choose a check-in date.": "Кіру күнін таңдаңыз.",
      "Use a valid date.": "Жарамды күнді көрсетіңіз.",
      "Choose a check-out date.": "Шығу күнін таңдаңыз.",
      "Check-out must be after check-in.": "Шығу күні кіру күнінен кейін болуы керек.",
      "Booking.com searches are limited to 60 nights.":
        "Booking.com іздеуі 60 түнмен шектелген.",
      "Between 1 and 16 adults.": "Ересектер: 1-ден 16-ға дейін.",
      "Between 0 and 8 children.": "Балалар: 0-ден 8-ге дейін.",
      "Add an age for every child.": "Әр баланың жасын көрсетіңіз.",
      "Child ages must be 0–17.": "Балалардың жасы: 0–17.",
      "Between 1 and 8 rooms.": "Бөлмелер: 1-ден 8-ге дейін.",
      "Enter a budget of 0 or more.": "Бюджетті 0 немесе одан көп етіп көрсетіңіз.",
      "Pick a currency.": "Валютаны таңдаңыз.",
      "Keep the preferred area under 120 characters.":
        "Ауданды 120 таңбадан аспайтын етіп қысқартыңыз.",
      "Keep the extra notes under 500 characters.":
        "Жазбаларды 500 таңбадан аспайтын етіп қысқартыңыз.",
    },
  ],
];

for (const [anchor, entries] of messageBlocks) {
  const lines = Object.entries(entries)
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join("\n");
  insertBefore(anchor, `${anchor}\n${lines}\n`);
  // remove the duplicated anchor line left above the inserted entries
  source = source.replace(`${anchor}\n${lines}\n${anchor}`, `${anchor}\n${lines}`);
}

fs.writeFileSync(path, source);
console.log("dictionary sections added");
