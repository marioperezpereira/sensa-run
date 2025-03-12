# Sensa: Corre por sensaciones

**URL**: https://sensa.run

## Tus sensaciones, claves en el entrenamiento

Para evaluar qué entrenamientos realizar en el día a día, los atletas de fondo suelen recurrir a dos fórmulas: 
- Planes cerrados de entrenamiento, que se encuentran disponibles en múltiples plataformas y formatos desde hace décadas.
- Entrenador personal, que además de diseñar una planificación, evalúa las condiciones del atleta, el calendario de competiciones y especifica el entrenamiento a realizar teniendo en cuenta múltiples factores

Para aquellos atletas que buscan respuestas a la pregunta **"¿Qué entrenamiento me conviene realizar hoy?"** y no disponen de un entrenador  hemos creado Sensa, un asistente que recoge tus últimos entrenamientos y tus sensaciones y te recomienda cuál es el mejor entrenamiento a realizar en el día de hoy.

## ¿Cómo funciona?

Actualmente, la aplicación cuenta con dos componentes:

### Personalización

Está destinado a obtener la información del atleta (experiencia, objetivos, hábitos...) a través de una serie de pasos estructurados.

Finalmente cuenta con conexión con Strava para recuperar sus últimos entrenamientos.

![image](https://github.com/user-attachments/assets/f96acabc-8c8c-44a7-9450-9972f1bd2232)

Esta personalización se puede repetir en cualquier momento desde la sección "Mi perfil", en caso de que cambien los objetivos o hábitos del usuario.

### Entrenamientos del día a día

![image](https://github.com/user-attachments/assets/2fbf0545-d4e8-4e46-8489-1554456b0617)

Destinado a ser el punto diario de encuentro con Sensa, el usuario recibe una serie de preguntas acerca de cómo fue su último entrenamiento, estado de fatiga y cómo se encuentra en el día de hoy mentalmente.

Una vez respondidas estas 3 preguntas, el usuario recibirá una sesión de entrenamiento recomendada acorde a la información recogida.

![image](https://github.com/user-attachments/assets/da8c32ad-01d2-4134-96dd-0be0e1b9a809)

## Tecnología

Este proyecto está realizado con [Lovable](https://lovable.dev)

Cuenta con conexión a Supabase, que organiza la autenticación de usuarios, base de datos y conexión a APIs de terceros.

Los terceros con los que se integra son con Strava para recoger las últimas 20 sesiones de entrenamiento del usuario, y con OpenAI para, a través de un prompt generado, obtener la recomendación del entrenamiento a realizar.
