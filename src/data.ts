/**
 * Data and constants for the Interactive Love Page.
 */

export interface LoveMessage {
  text: string;
  emoji: string;
}

export const LOVE_MESSAGES: string[] = [
  "Semangat kerjanya hari ini, {partner}! Jangan lupa kalau di sini ada {sender} yang selalu bangga sama semua kerja keras dan dedikasimu. 🥰❤️",
  "Capek ya hari ini di kantor? Sini, istirahat dulu sebentar. Kamu hebat banget sudah bertahan sejauh ini menyelesaikan semua deadline. I'm so proud of you, {partner}! 🌸✨",
  "Ingat ya, sesibuk apa pun pekerjaan dan meeting-mu, kamu selalu punya tempat untuk pulang, yaitu {sender}. Istirahat yang cukup ya, {partner}! 💕",
  "Setiap kali kamu merasa lelah dengan tumpukan kerjaan, ingatlah kalau kamu adalah alasan di balik senyum {sender} setiap hari. Kamu pasti bisa melewati semua rintangan karir ini! Semangat! 🌟❤️",
  "{sender} tahu kerjaan di kantor kadang bikin pusing dan capek banget, tapi {sender} yakin pacar {sender} yang hebat dan profesional ({partner}) pasti bisa melewatinya dengan mulus. Semangat terus ya! 😘",
  "Jika dunia kerja atau rekan kerja terasa berat hari ini, bayangkan {sender} sedang memelukmu dengan erat sekarang. Kamu tidak berjuang sendirian, {partner}. 🤗💖",
  "Jangan terlalu memaksakan diri bekerja lembur ya. Target dan pekerjaan itu penting, tapi kesehatan fisik dan mental kamu jauh lebih berharga buat {sender}. Take care, {partner}! 🌹",
  "Kamu adalah hal terindah yang hadir dalam hidup {sender}. Terima kasih ya {partner} sudah selalu berjuang dan memberikan yang terbaik setiap harinya. Love you to the moon and back! 🌙❤️",
  "Hari ini mungkin melelahkan dengan tumpukan tugas kantor, tapi esok adalah hari yang baru. Tidur yang nyenyak malam ini ya, biar besok bertenaga lagi. Mimpi indah, {partner}! 💤💖",
  "Apapun rintangan di tempat kerja hari ini, ingat kalau {sender} selalu ada di sini untuk mendengarkan keluh kesahmu. Jangan sungkan buat cerita ya, {partner}! 🫂💗",
  "Semangat kerjanya sayang, {partner}! Ingat masa depan indah yang sedang kita rakit bersama. Setiap langkah kecilmu hari ini sangatlah berarti bagi {sender}. 💕💼",
  "Hei {partner}, jangan lupa senyum hari ini ya! Senyumanmu itu adalah energi terbesar buat {sender} setelah seharian beraktivitas. Semangat terus kerjanya! 😍❤️"
];

export interface SpecialLetter {
  id: string;
  title: string;
  icon: string;
  subject: string;
  content: string;
  tagline: string;
}

export const SPECIAL_LETTERS: SpecialLetter[] = [
  {
    id: "capek-kerja",
    title: "Saat Capek Kerja/Lembur 💼",
    icon: "Briefcase",
    subject: "Semangat Bekerja, Sayangku!",
    content: "{partner}, {sender} tahu hari-hari di tempat kerja itu padat banget. Banyak deadline, tumpukan tugas, meeting yang melelahkan, belum lagi tekanan kerjaan. Capek banget ya? Tapi ingat ya, kamu itu luar biasa hebat, mandiri, dan tangguh. Jangan terlalu memaksakan diri sampai lupa makan, telat makan siang, atau kurang tidur ya. Kesehatan fisik dan kedamaian pikiranmu jauh lebih penting bagi {sender} dibanding pekerjaan apa pun. {sender} di sini selalu siap mendengarkan semua keluh kesahmu tentang kerjaan, bos, atau rekan kerja, dan memelukmu saat kamu merasa lelah. {sender} selalu bangga punya pasangan sehebat {partner}! ❤️",
    tagline: "Selesai kerja, hubungi {sender} ya. Sini aku usap-usap kepalamu dan pijat pundakmu yang capek. 🤗"
  },
  {
    id: "kangen",
    title: "Saat Kamu Kangen 🥺",
    icon: "HeartHandshake",
    subject: "Rindu Ini Hanya Sementara",
    content: "Hai {partner}, lagi kangen ya sama {sender}? Hehe, {sender} juga kangen banget-banget sama kamu! Rasa kangen ini kadang emang bikin sesak, tapi itu jadi bukti seberapa berharganya kamu di hidup {sender}. Bayangkan {sender} lagi di sampingmu sekarang, menggenggam tanganmu erat-erat, dan berbisik kalau semuanya akan baik-baik saja. Jarak dan kesibukan pekerjaan ini cuma sementara kok. Rasa sayang {sender} ke kamu gak akan berkurang sedikit pun, malah makin bertambah setiap detiknya. Sebentar lagi kita bakal ketemu dan makan malam romantis bareng lagi ya, {partner}! 💕",
    tagline: "Pelukan hangat virtual dikirimkan... Tetap tersenyum ya {partner}! 🥰"
  },
  {
    id: "butuh-pelukan",
    title: "Saat Butuh Pelukan/Sedih 🫂",
    icon: "Smile",
    subject: "Aku Selalu Ada Untukmu",
    content: "Sini mendekat ke {sender}... Tarik napas dalam-dalam, lalu hembuskan perlahan. Bayangkan kedua lengan {sender} melingkar dengan sangat hangat di pundakmu, melindungimu dari segala hal yang bikin kamu sedih atau cemas hari ini. Di dekapan {sender}, kamu aman. Kamu boleh nangis, boleh ngeluh, boleh tumpahin semua yang mengganjal di hatimu. {sender} gak akan pernah bosan mendengar suara indahmu. Ingat ya {partner}, seberat apa pun hari-harimu di luar sana, kamu selalu punya tempat bersandar yang tulus, yaitu {sender}. Kamu sangat berharga, dicintai, dan tak akan pernah sendirian. 😘",
    tagline: "Kamu adalah rumah teraman bagi {sender}. Aku sayang banget sama kamu, {partner}. 💖"
  }
];

export function formatText(text: string, partner: string, sender: string): string {
  const pName = partner.trim() !== "" ? partner : "Sayang";
  const sName = sender.trim() !== "" ? sender : "aku";
  return text
    .replace(/{partner}/g, pName)
    .replace(/{sender}/g, sName);
}

export interface LoveLevel {
  clicks: number;
  badge: string;
  color: string;
  desc: string;
}

export const LOVE_LEVELS: LoveLevel[] = [
  { clicks: 0, badge: "Awal Kasih Sayang", color: "from-pink-400 to-rose-400", desc: "Ketuk terus tombol hati untuk mengirimkan energi cinta!" },
  { clicks: 5, badge: "Mulai Salting 🥰", color: "from-pink-400 to-pink-500", desc: "Cieee, detak jantungmu mulai berdebar kencang ya!" },
  { clicks: 15, badge: "Bucin Gemas 💕", color: "from-pink-500 to-rose-500", desc: "Kamu manis banget deh, aku sayang banget sama kamu!" },
  { clicks: 30, badge: "Cinta Membara 🔥", color: "from-rose-500 to-red-500", desc: "Wah, level kebucinan kamu sudah di luar batas wajar!" },
  { clicks: 50, badge: "Cinta Sehidup Semati ♾️", color: "from-purple-500 to-pink-600", desc: "Cinta kita selamanya tak terbatas dan melampaui semesta!" },
  { clicks: 80, badge: "Puncak Kebucinan 👑", color: "from-amber-400 to-pink-600", desc: "Kamu telah dinobatkan sebagai pasangan paling bucin sedunia!" },
  { clicks: 120, badge: "Maharaja Kasih Abadi 🌌", color: "from-indigo-500 via-purple-600 to-pink-500", desc: "Cinta yang melampaui ruang dan waktu, abadi dalam ikatan suci semesta!" }
];

export const DAILY_AFFIRMATIONS: string[] = [
  "Hari ini {partner} pasti luar biasa! Ingatlah bahwa kamu kuat, berharga, dan mampu meraih segala cita-citamu dan karir impianmu. {sender} di sini selalu mendukungmu! 🌟💪",
  "Napas dalam-dalam, lepaskan cemasmu. Hari ini adalah awal baru yang indah untuk {partner}. Lakukan yang terbaik dan jangan lupa bahagia! 💖🌸",
  "Apapun yang terjadi hari ini, {partner} adalah kebanggaan terbesar {sender}. Kamu hebat, profesional, dan berhati luar biasa hangat. 🌹✨",
  "Semangat pagi cintaku! Ingat ya, kamu berhak mendapatkan hari yang damai, produktif, dan bebas stres kerja. {sender} selalu mendoakan kesuksesanmu dari jauh. 🥰💼",
  "Jangan takut menghadapi tantangan atau project baru di tempat kerja. {partner} punya kompetensi luar biasa dalam diri. Hadapi dengan senyuman terbaikmu ya sayang! 🤗🔥",
  "Setiap usaha kerasmu hari ini adalah tabungan masa depan kita. Terima kasih {partner} sudah terus berjuang pantang menyerah mencari rezeki! Proud of you. 💕🌈",
  "Kamu adalah matahari tercantik yang menerangi hari-hari {sender}. Semoga harimu di tempat kerja penuh kebaikan dan kemudahan ya! Love you! ☀️❤️",
  "Fokuslah pada hal-hal baik hari ini. Jika ada tugas berat atau revisi, kerjakan pelan-pelan. {sender} yakin {partner} pasti bisa menyelesaikan semuanya! 📝✌️",
  "Kamu cantik, kamu pintar, kamu profesional yang luar biasa. Jangan biarkan ucapan atau kesulitan hari ini memudarkan binar matamu yang indah, {partner}! 💖🌌",
  "Semangat beraktivitas di kantor ya sayang! Jaga kesehatan, jangan lupa makan siang tepat waktu, dan ketahuilah {sender} selalu rindu kamu di sini. 😘🍱"
];
