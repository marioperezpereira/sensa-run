
export const motivationalQuotes = [
  "El único mal entrenamiento es el que no haces.",
  "Corre cuando puedas, camina cuando debas, gatea si es necesario, pero nunca te rindas.",
  "No importa lo lento que vayas, estás superando a todos los que están en el sofá.",
  "El dolor es temporal, el orgullo es para siempre.",
  "Los sueños no se hacen realidad mientras duermes.",
  "La distancia entre tus sueños y la realidad se llama disciplina.",
  "El sudor de hoy es el éxito de mañana.",
  "Cada paso cuenta. No importa si son cortos o lentos.",
  "Si no te retas a ti mismo, no te cambiarás a ti mismo.",
  "No busques excusas, busca soluciones.",
  "Lo que hoy parece imposible, mañana será tu calentamiento.",
  "Un kilómetro para un corredor sigue siendo un kilómetro para cualquier otro.",
  "La perseverancia no es una carrera larga, es muchas carreras cortas una tras otra.",
  "Cree en ti mismo y serás imparable.",
  "Cuando sientas que vas a rendirte, piensa en por qué empezaste."
];

/**
 * Returns a random motivational quote from the list
 */
export const getRandomQuote = (): string => {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
};
