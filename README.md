# iTj Hackathon 2026 – miCoach

## Day 1 Checklist – Proyecto: AI Career Navigator

---

## 1. Challenge

**Challenge elegido:** Navegación de Carrera

**Problema específico:**
Las personas no tienen claridad sobre:

* En qué punto están en su carrera
* Qué rol deberían perseguir después
* Qué habilidades específicas les faltan para avanzar

Esto genera:

* Estancamiento profesional
* Aprendizaje desorganizado
* Pérdida de motivación

---

## 2. Solución

**Propuesta:**
Una herramienta impulsada por IA que:

* Realiza una entrevista interactiva tipo chat de voz
* Analiza el perfil del usuario (skills, experiencia, intereses)
* Genera un career path personalizado con enfoque en gap analysis

**Diferenciador clave:**
No solo sugiere un camino, sino que responde:

> “Esto es exactamente lo que te falta para llegar a tu siguiente nivel profesional”

---

## 3. MVP (Mantenerlo simple)

### Lo que SÍ vamos a construir:

* Interfaz de entrevista tipo chat de voz
* Procesamiento de respuestas del usuario
* Generación de:

  * Perfil actual (rol estimado)
  * Siguiente rol recomendado
  * Lista de gaps (skills faltantes)
* Pantalla de resultados clara y visual

### Lo que NO vamos a construir:

* Sistema de gamificación (streaks, puntos, niveles)
* Funcionalidades sociales (posts, perfiles públicos)
* Sistema complejo de tareas diarias

---

## 4. Demo (30 segundos)

**Usuario → Acción → Resultado**

1. Un usuario entra a la app
2. Responde una entrevista rápida con IA
3. Recibe:

   * Su perfil profesional actual
   * Su siguiente rol recomendado
   * Un listado claro de habilidades que le faltan

Si el usuario comprende claramente qué habilidades tiene que mejorar, se logró el objetivo.

---

## 5. Enfoque

**Un solo flujo principal (end-to-end):**

* Inicio
* Entrevista (chat de voz)
* Resultado (career path + gaps)

---

## 6. Tech

**Propuesta:**

* Frontend / Backend: SvelteKit

**IA:**

* Proveedor: Groq

* Modelos open-source:

  * Language model: qwen/qwen3-32b
  * Text to speech: Canopy Labs Orpheus English
  * Automatic Speech Recognition: Whisper V3 Large

* Almacenamiento: Redis

---

## 7. Riesgos

### Riesgos principales:

* La IA no genera resultados coherentes
* La entrevista es muy larga o confusa
* El output no es claro o útil
* Problemas de integración frontend-backend
* Tiempo insuficiente

### Mitigación:

* Limitar la entrevista a 4–5 preguntas clave
* Definir estructura fija del output
* Hardcodear ejemplos si es necesario para demo
* Priorizar claridad sobre complejidad

---

## 8. Plan

### Día 1

**Objetivo: Definición de scope**

* Propuesta de ideas
* Análisis de riesgos
* Definición de tecnologías
* Planeación por días / colaboradores

### Día 2

**Objetivo: Base funcional completa**

* Definir preguntas de entrevista
* Implementar UI básica de chat
* Crear lógica inicial de procesamiento
* Generar primer output mock (hardcoded si es necesario)

### Día 3

**Objetivo: Pulir y preparar demo**

* Mejorar UX/UI
* Reducir fricción en flujo
* Preparar storytelling del pitch
* Ensayar demo (varias veces)

---

## Roles sugeridos

### 1. AI / Backend (Diego Beltran Lopez)

* Lógica de entrevista
* Procesamiento de respuestas
* Generación de career path

### 2. Frontend (Cristian Alexis Lopez Bautista)

* UI del chat
* Pantalla de resultados
* Flujo de navegación

### 3. Product / UX (Ken Antonio Santillan)

* Definición de preguntas
* Estructura del output
* Copywriting
* Preparación del pitch y demo

---

## Enfoque final

No intentamos construir una plataforma completa.
Intentamos demostrar un insight poderoso en el menor tiempo posible.

**Éxito =**

El usuario entiende claramente:

* Quién es profesionalmente
* A dónde puede ir
* Qué le falta para llegar ahí
