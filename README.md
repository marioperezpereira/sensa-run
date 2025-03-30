# Sensa: Corre por sensaciones

https://github.com/user-attachments/assets/d75ceef9-8201-400b-bda4-d0a50873ef74

**URL**: https://sensa.run

## Tus sensaciones, claves en el entrenamiento

Para evaluar qué entrenamientos realizar su día a día y cumplir con sus objetivos, los corredores suelen recurrir a dos fórmulas: 
- Planes cerrados de entrenamiento, que se encuentran disponibles en múltiples plataformas y formatos desde hace décadas.
- Entrenador personal, que además de diseñar una planificación, evalúa las condiciones del atleta, el calendario de competiciones y especifica el entrenamiento a realizar teniendo en cuenta múltiples factores

Para aquellos atletas que buscan respuestas a la pregunta **"¿Qué entrenamiento me conviene realizar hoy?"** y no disponen de un entrenador al alcance nace Sensa: un asistente que recoge tus últimos entrenamientos y tus sensaciones y te recomienda cuál es el mejor entrenamiento a realizar en el día de hoy.

## ¿Cómo funciona?

Actualmente, la aplicación cuenta con tres componentes:

### Personalización

Está destinado a obtener la información del atleta (experiencia, objetivos, hábitos...) a través de una serie de pasos estructurados. Cuenta con conexión con Strava para recuperar sus últimos entrenamientos.

Esta personalización se puede repetir en cualquier momento desde la sección "Mi perfil", en caso de que cambien los objetivos o hábitos del usuario.

### Entrenamientos del día a día

Destinado a ser el punto diario de encuentro con Sensa, el usuario recibe una serie de preguntas acerca de cómo fue su último entrenamiento, estado de fatiga y cómo se encuentra en el día de hoy mentalmente.

Una vez respondidas estas 3 preguntas, el usuario recibirá una sesión de entrenamiento recomendada acorde a la información recogida.

![image](https://github.com/user-attachments/assets/1414d89d-fca7-41ca-8331-77e37f5366ee)

### Personal Bests

En esta sección el usuario puede registrar sus mejores marcas en diferentes pruebas. Cuenta con una calculadora de puntos basado en puntuaciones de World Athletics, que sirve al usuario para saber en qué distancias ha tenido mejor rendimiento que en otras.

## Tecnología

Este proyecto está realizado con [Lovable](https://lovable.dev)

Cuenta con conexión a Supabase, que organiza la autenticación de usuarios, base de datos y conexión a APIs de terceros: Strava para recoger las últimas sesiones de entrenamiento del usuario, y con OpenAI para, a través de un prompt generado, obtener la recomendación del entrenamiento a realizar.
