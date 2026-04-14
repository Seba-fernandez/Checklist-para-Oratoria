# Checklist de Oratoria

App web para autoevaluar grabaciones de lectura en voz alta. Diseñada como herramienta de práctica para cursos de oratoria donde el ejercicio consiste en grabarse leyendo fragmentos de texto y escucharse activamente para detectar errores.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite) ![Anthropic](https://img.shields.io/badge/Claude-Haiku-D4A847?style=flat)

## ¿Qué hace?

Después de escucharte, marcás los problemas que detectás en tu grabación organizados en 5 bloques: **Claridad**, **Ritmo**, **Intención**, **Pausas** y **Seguridad**. La app manda esa información a la API de Claude y te devuelve un diagnóstico personalizado con el área crítica, qué está fallando técnicamente y una sola acción concreta para corregir en la próxima grabación.

## Stack

- React 18 + Vite
- CSS con variables (sin frameworks)
- Anthropic API (claude-haiku)

## Instalación para correr ésta app web

```bash
git clone https://github.com/Seba-fernandez/Checklist-para-Oratoria.git
cd Checklist-para-Oratoria
npm install
```

Creá un archivo `.env` en la raíz del proyecto:

```
VITE_ANTHROPIC_KEY=tu_api_key_aqui
```

Conseguís tu API key en [console.anthropic.com](https://console.anthropic.com).

```bash
npm run dev
```

## Estructura

```
src/
├── App.jsx
├── data/
│   └── bloques.js        
└── components/
    ├── Header.jsx
    ├── Bloque.jsx
    ├── Item.jsx
    ├── Diagnostico.jsx
    └── Resultado.jsx     
```

## Uso

1. Grabate leyendo un fragmento de texto (mínimo 2 minutos)
2. Escuchate y marcá los problemas que detectás
3. Completá el diagnóstico manual si querés darle más contexto a la IA
4. Apretá **Ver diagnóstico** y recibís el análisis

## Licencia

MIT
