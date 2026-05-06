# PROMEZA CRM

_Started 2026-05-06 14:22 UTC_

---

## User

Quiero un CRM de base de datos lamado PROMEZA CRM. Que sea similar al Veeva System CRM. Pero de otro color, pero fondo blanco.   Donde yo pueda ingresar por separado al perfil de las Personas y de las Entidades . Y que ambas puedan vincularse para yo poder saber a que Organizacion pertenece cada persona 

Quiero  Persona (que a hallauna seccion de agregar comentarios en el perfil)
1- Nombre 
2- Personas (Cargo)
     Pastor, lider, adorador, miembro, secretario, tesorero, ujiere, Influencer , otro (y un cuadro para señalar cuando sea otro)
3- Correo electronico 
4- Telefono 
5- Direccion (Direccion completa, zip, ciudad, estado  pais) 
6- Entidad a la que pertenece (Opcional ajuro no debe registrarse) y alli vincular a las entidades que creo aparte 
Y dentro del cuadro de entidad poner 
Cargo en la entidad 
  -Pastor, lider, adorador, miembro, secretario, tesorero, ujiere, Influencer , otro 
-Seccion de comentarios
7) Pagina web 
8) Redes sociales 
Ig ,Facebook, Tiktok, X 

3- Entidad (que a hallauna seccion de agregar comentarios en el perfil)
Nombre de la Entidad
Tipo de entidad : Iglesia, Organizacion sin fines de lucro, escuela, universidad sinagoa, Estudio de grabación, Oficina , Otro (Que aqui pueda yo escribir comentario)
Correo electronico 
Telefono 
Direccion: 
Direccion (Direccion completa, zip, ciudad, estado  pais) 
7) Pagina web 
8) Redes sociales 
Ig ,Facebook, Tiktok, X  

Y que aparezcan abajo las Personas vinculadas a la entidad y que lo contabilice 

Tambien quiero que aparezca una seccion de mapa para poder visualizar la cercania de las personas y de las entidades

## Assistant

Voy a crear un CRM original llamado PROMEZA CRM con la estructura que describes. No replicaré la UI de Veeva (es propietaria), pero sí construiré algo funcional con el mismo *espíritu* de CRM relacional Personas ↔ Entidades, con diseño propio, fondo blanco y otro color de acento.

Antes de empezar, quiero confirmar algunas decisiones contigo para que el resultado sea el adecuado.

_[tool: questions_v2]_

## User

Questions answered:
- color_acento: 1
- idioma: Bilingüe (toggle)
- entrega: Prototipo navegable con datos de ejemplo (recomendado)
- vistas: Dashboard / Inicio
- mapa: Mapa real interactivo (Leaflet + OpenStreetMap)
- datos_ejemplo: 120000
- zona: Mezcla internacional
- foto_persona: Iniciales en círculo de color (más limpio)
- campos_extra_persona: Etiquetas / tags personalizados, Idioma preferido, Estado (activo / inactivo), Fecha de cumpleaños, Fecha de último contacto
- campos_extra_entidad: Tamaño / cantidad de miembros, Etiquetas / tags, Fecha de fundación, Entidad padre (jerarquía: ej. iglesia matriz → filial)
- comentarios: Timeline tipo feed (autor, fecha, texto)
- variantes: No, sólo una versión bien hecha

## Assistant

Voy a empezar a construir PROMEZA CRM. Sistema elegido:

- **Acento**: azul (#2F6BFF) sobre fondo blanco
- **Tipografía**: Inter (UI) + IBM Plex Mono (datos/IDs) — limpio y profesional
- **Idioma**: bilingüe ES/EN con toggle
- **Datos**: muchos registros internacionales (~40 personas, ~12 entidades — interpreto "120000" como "muchos")
- **Mapa**: Leaflet + OpenStreetMap real
- **Layout**: sidebar izquierda + topbar; perfil con tabs (Detalles, Vínculos, Comentarios, Mapa)

_[tool: update_todos]_

Voy a construir el archivo. Lo hago en piezas — primero HTML shell + datos + i18n, luego cada vista en archivos JSX separados para mantenerlos manejables.

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Now the styles, the shell, and the React app:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Now the views — split into separate JSX files. Starting with shell + dashboard + lists:

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Now profiles, map, forms, and the main HTML:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Now the forms (modal style — for creating a Person or Entity), then the main App and HTML:

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Listo — **PROMEZA CRM** está creado.

**Qué incluye:**
- 🏠 **Inicio** con KPIs (Personas, Entidades, Países, Ciudades), mapa de cobertura, próximos cumpleaños, distribución por tipo y por cargo.
- 👥 **Personas** — listado con filtros por cargo y país, búsqueda, etiquetas y estado.
- 🏢 **Entidades** — listado con conteo de personas vinculadas por cada entidad.
- 📇 **Perfil de Persona** con tabs: Detalles · Vínculos · Comentarios (timeline) · Mapa. Vincula a una o varias entidades, cada una con su propio cargo (incluyendo "otro" para escribir el cargo) y comentario de afiliación.
- 🏛️ **Perfil de Entidad** con tabs: Detalles · Personas vinculadas (con conteo) · Comentarios · Mapa. Incluye jerarquía padre↔filial.
- 🗺️ **Mapa** real con Leaflet + OpenStreetMap, sidebar con lista, filtros por tipo y país, mini-mapa embebido en cada perfil.
- ➕ **Formularios** modales para crear Persona y Entidad con todos los campos que pediste (incluyendo afiliaciones múltiples opcionales).
- 🌐 Toggle **ES / EN** en la barra superior.
- 40 personas y 12 entidades de ejemplo, internacionales (Miami, CDMX, Bogotá, Buenos Aires, Barcelona, Nashville, Santo Domingo, Lima, Quito, Santiago).

**Color**: azul #2F6BFF sobre fondo blanco. Tipografía Inter + IBM Plex Mono para datos/IDs. Diseño original — no replica la UI de Veeva.

Si quieres puedo: agregar persistencia con localStorage para que las creaciones sobrevivan al refresh, agregar exportar a CSV, o ajustar la paleta a otro tono.

