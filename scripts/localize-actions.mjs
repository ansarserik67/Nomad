// Adds server-action sentences to the `messages` maps (en/ru/kk) and wraps the
// matching string literals in the action files with `await translateMessage(...)`.
import fs from "node:fs";

const ROWS = [
  ["The activity could not be saved. You may not have edit access to this trip.", "Не удалось сохранить занятие. Возможно, у вас нет прав на редактирование этой поездки.", "Іс-шараны сақтау мүмкін болмады. Бұл сапарды өңдеу құқығыңыз жоқ шығар."],
  ["Activity added to the itinerary.", "Занятие добавлено в маршрут.", "Іс-шара маршрутқа қосылды."],
  ["The expense could not be saved.", "Не удалось сохранить расход.", "Шығысты сақтау мүмкін болмады."],
  ["Expense recorded.", "Расход записан.", "Шығыс жазылды."],
  ["Enter a valid email address and role.", "Укажите корректный адрес эл. почты и роль.", "Дұрыс эл. пошта мекенжайы мен рөлді көрсетіңіз."],
  ["Only the trip owner can invite members.", "Приглашать участников может только владелец поездки.", "Қатысушыларды тек сапар иесі шақыра алады."],
  ["The invitation could not be sent. Check that the database migration is applied.", "Не удалось отправить приглашение. Проверьте, что миграция базы применена.", "Шақыруды жіберу мүмкін болмады. Дерекқор миграциясы қолданылғанын тексеріңіз."],
  ["Invitation saved for {email}. It activates when they create their account.", "Приглашение для {email} сохранено. Оно активируется, когда пользователь создаст аккаунт.", "{email} үшін шақыру сақталды. Ол пайдаланушы аккаунт жасағанда іске қосылады."],
  ["{email} now has access to this trip.", "У {email} теперь есть доступ к этой поездке.", "{email} енді бұл сапарға қолжетімді."],
  ["Invalid identifier.", "Некорректный идентификатор.", "Жарамсыз идентификатор."],
  ["Could not remove that activity.", "Не удалось удалить это занятие.", "Бұл іс-шараны жою мүмкін болмады."],
  ["Could not remove that expense.", "Не удалось удалить этот расход.", "Бұл шығысты жою мүмкін болмады."],
  ["Could not remove that member.", "Не удалось удалить этого участника.", "Бұл қатысушыны жою мүмкін болмады."],
  ["Choose a file to upload.", "Выберите файл для загрузки.", "Жүктеу үшін файл таңдаңыз."],
  ["Files must be 10 MB or smaller.", "Размер файла — не более 10 МБ.", "Файл өлшемі 10 МБ-тан аспауы керек."],
  ["Please upload a PDF, JPG, PNG, WEBP or TXT file.", "Загрузите файл PDF, JPG, PNG, WEBP или TXT.", "PDF, JPG, PNG, WEBP немесе TXT файлын жүктеңіз."],
  ["Give the document a title (140 characters max).", "Укажите название документа (до 140 символов).", "Құжатқа атау беріңіз (140 таңбадан аспайды)."],
  ["Choose a valid document category.", "Выберите корректную категорию документа.", "Дұрыс құжат санатын таңдаңыз."],
  ["Use a valid expiry date.", "Укажите корректную дату истечения срока.", "Дұрыс жарамдылық мерзімін көрсетіңіз."],
  ["Invalid trip.", "Некорректная поездка.", "Жарамсыз сапар."],
  ["The file could not be uploaded. Confirm the travel-documents storage bucket exists.", "Не удалось загрузить файл. Проверьте, что хранилище travel-documents существует.", "Файлды жүктеу мүмкін болмады. travel-documents қоймасы бар екенін тексеріңіз."],
  ["The document record could not be created.", "Не удалось создать запись документа.", "Құжат жазбасын жасау мүмкін болмады."],
  ["Document filed in the vault.", "Документ сохранён в хранилище.", "Құжат қоймаға сақталды."],
  ["Document not found.", "Документ не найден.", "Құжат табылмады."],
  ["Only the owner can delete this document.", "Удалить этот документ может только владелец.", "Бұл құжатты тек иесі жоя алады."],
  ["Could not delete that document.", "Не удалось удалить этот документ.", "Бұл құжатты жою мүмкін болмады."],
  ["The trip could not be created. Check that the database migration has been applied and try again.", "Не удалось создать поездку. Проверьте, применена ли миграция базы, и попробуйте снова.", "Сапарды жасау мүмкін болмады. Дерекқор миграциясы қолданылғанын тексеріп, қайталап көріңіз."],
];

const dictPath = "src/lib/i18n/dictionaries.ts";
let source = fs.readFileSync(dictPath, "utf8");

function escape(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function addToMessages(blockStart, blockEnd, index) {
  let block = source.slice(blockStart, blockEnd);
  const additions = [];
  for (const row of ROWS) {
    const key = row[0];
    if (block.includes(`"${escape(key)}":`)) continue;
    additions.push(`  "${escape(key)}": "${escape(row[index])}",`);
  }
  if (additions.length === 0) return;
  const insertAt = blockEnd;
  source =
    source.slice(0, insertAt) + additions.join("\n") + "\n" + source.slice(insertAt);
}

const maps = [
  { marker: "const enMessages: Record<string, string> = {", index: 0 },
  { marker: "const ruMessages: Record<string, string> = {", index: 1 },
  { marker: "const kkMessages: Record<string, string> = {", index: 2 },
];

// Fill from the last map to the first so earlier offsets stay valid.
for (const map of [...maps].reverse()) {
  const start = source.indexOf(map.marker);
  if (start < 0) {
    console.error(`missing map ${map.marker}`);
    process.exit(1);
  }
  const end = source.indexOf("\n};", start);
  if (end < 0) {
    console.error(`missing end for ${map.marker}`);
    process.exit(1);
  }
  addToMessages(start, end + 1, map.index);
}

fs.writeFileSync(dictPath, source);

const actionFiles = ["src/app/(app)/trips/[id]/actions.ts", "src/app/(app)/planner/actions.ts"];
for (const file of actionFiles) {
  let text = fs.readFileSync(file, "utf8");
  for (const row of ROWS) {
    const literal = `"${escape(row[0])}"`;
    if (!text.includes(literal)) continue;
    text = text.split(literal).join(`await translateMessage(${literal})`);
  }
  text = text.replace(
    "? `Invitation saved for ${email}. It activates when they create their account.`",
    '? format(await translateMessage("Invitation saved for {email}. It activates when they create their account."), { email })',
  );
  text = text.replace(
    ": `${email} now has access to this trip.`",
    ': format(await translateMessage("{email} now has access to this trip."), { email })',
  );
  if (text.includes("format(") && !text.includes('from "@/lib/i18n/dictionaries"')) {
    text = text.replace(
      'import { translateFieldErrors, translateMessage } from "@/lib/i18n/server";',
      'import { format } from "@/lib/i18n/dictionaries";\nimport { translateFieldErrors, translateMessage } from "@/lib/i18n/server";',
    );
  }
  fs.writeFileSync(file, text);
}

console.log("done");
