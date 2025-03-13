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

![image](https://github.com/user-attachments/assets/b4d46d19-4be6-4d2b-a66d-541b73a20c6d)
![image](https://github.com/user-attachments/assets/08bf1fb7-c448-4d7c-b032-93e852d166b9)
![image](https://github.com/user-attachments/assets/5674569e-1dbf-491f-9e74-ac801c9e26bd)

Esta personalización se puede repetir en cualquier momento desde la sección "Mi perfil", en caso de que cambien los objetivos o hábitos del usuario.

### Entrenamientos del día a día

Destinado a ser el punto diario de encuentro con Sensa, el usuario recibe una serie de preguntas acerca de cómo fue su último entrenamiento, estado de fatiga y cómo se encuentra en el día de hoy mentalmente.
![image](https://github.com/user-attachments/assets/70de7127-212d-4efd-b914-9ecf2535a1bb)
![image](https://github.com/user-attachments/assets/bd55978b-c05b-4382-bc4e-8bbeeafbeac3)
![image](https://github.com/user-attachments/assets/641529b3-0879-4ccb-8aab-ed0783e7395f)

Una vez respondidas estas 3 preguntas, el usuario recibirá una sesión de entrenamiento recomendada acorde a la información recogida.

![image](https://github.com/user-attachments/assets/1414d89d-fca7-41ca-8331-77e37f5366ee)

## Tecnología

Este proyecto está realizado con [Lovable](https://lovable.dev)

Cuenta con conexión a Supabase, que organiza la autenticación de usuarios, base de datos y conexión a APIs de terceros.

Los terceros con los que se integra son con Strava para recoger las últimas 20 sesiones de entrenamiento del usuario, y con OpenAI para, a través de un prompt generado, obtener la recomendación del entrenamiento a realizar.
