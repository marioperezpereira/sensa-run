
interface MotivationalQuote {
  text: string;
  author: string;
}

export const motivationalQuotes: MotivationalQuote[] = [
  {
    text: "El dolor es temporal. El orgullo es para siempre.",
    author: "Emil Zatopek"
  },
  {
    text: "No importa lo lento que vayas, siempre y cuando no te detengas.",
    author: "Confucio"
  },
  {
    text: "Corre cuando puedas, camina cuando debas, gatea si es necesario, pero nunca te rindas.",
    author: "Dean Karnazes"
  },
  {
    text: "El talento gana partidos, pero el trabajo en equipo y la inteligencia ganan campeonatos.",
    author: "Michael Jordan"
  },
  {
    text: "No cuentes los días, haz que los días cuenten.",
    author: "Muhammad Ali"
  },
  {
    text: "Los límites, como los miedos, a menudo son solo ilusiones.",
    author: "Michael Jordan"
  },
  {
    text: "Los campeones siguen jugando hasta que lo hacen bien.",
    author: "Billie Jean King"
  },
  {
    text: "La diferencia entre lo imposible y lo posible reside en la determinación de una persona.",
    author: "Tommy Lasorda"
  },
  {
    text: "La victoria más importante es la victoria sobre ti mismo.",
    author: "Platón"
  },
  {
    text: "No entreno hasta que no puedo más. Entreno hasta que ellos no pueden más.",
    author: "Herschel Walker"
  },
  {
    text: "Nunca es demasiado tarde para ser lo que podrías haber sido.",
    author: "George Eliot"
  },
  {
    text: "Si no tienes confianza, siempre encontrarás una manera de no ganar.",
    author: "Carl Lewis"
  },
  {
    text: "La mejor forma de empezar es dejando de hablar y empezando a hacer.",
    author: "Walt Disney"
  },
  {
    text: "Lo que hoy parece imposible, mañana será tu calentamiento.",
    author: "Anónimo"
  },
  {
    text: "Lo que te define no es cuántas veces caes, sino cuántas veces te levantas.",
    author: "Usain Bolt"
  },
  {
    text: "Para dar cualquier cosa menos que tu mejor esfuerzo es sacrificar el don.",
    author: "Steve Prefontaine"
  },
  {
    text: "Correr es la mayor metáfora de la vida, porque obtienes de ello lo que pones.",
    author: "Oprah Winfrey"
  },
  {
    text: "El único mal entrenamiento es el que no haces.",
    author: "Anónimo"
  }
];

/**
 * Returns a random motivational quote from the list
 */
export const getRandomQuote = (): MotivationalQuote => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};
