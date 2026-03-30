# Rayu

App de escritura colaborativa en la que cada historia crece capítulo a capítulo y se visualiza como grafo.

## Stack

- Backend: JavaScript + Express
- Grafo de capítulos: Neo4j
- Metadatos relacionales: PostgreSQL
- Frontend: HTML + CSS + JavaScript vanilla

## Flujo de uso

1. Un usuario crea una micro historia (texto o imagen) => se crea el capítulo 1.
2. Otro usuario entra a esa historia y agrega capítulo 2 (o siguientes) desde un capítulo padre.
3. Cada nuevo capítulo se conecta al anterior mediante una arista `NEXT` en Neo4j.
4. El home muestra la lista de micro historias y al seleccionar una se dibuja su grafo de capítulos.

## Requisitos (local)

- Node.js 20+
- Neo4j en ejecución
- PostgreSQL en ejecución

## Requisitos (Docker)

- Docker
- Docker Compose

## Ejecutar con Docker (recomendado)

1. Construir e iniciar todos los servicios:

```bash
docker compose up --build
```

2. Abrir la app:

- `http://localhost:3000`

3. Accesos útiles:

- Neo4j Browser: `http://localhost:7474`
- PostgreSQL: `localhost:5432`

4. Detener servicios:

```bash
docker compose down
```

5. Detener y borrar volúmenes (reset completo):

```bash
docker compose down -v
```

## Configuración local (sin Docker)

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo `.env` desde `.env.example` y configura credenciales:

```env
PORT=3000
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rayu
```

3. Crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE rayu;
```

4. Levanta la app:

```bash
npm run dev
```

5. Abre:

- `http://localhost:3000`

## Endpoints API

- `GET /api/health`
- `GET /api/stories`
- `POST /api/stories`
- `GET /api/stories/:storyId/graph`
- `POST /api/stories/:storyId/chapters`

### Ejemplo crear historia

```http
POST /api/stories
Content-Type: application/json

{
  "username": "andres",
  "title": "La lluvia en Marte",
  "contentType": "text",
  "content": "Una gota cayó donde no debía existir agua."
}
```

### Ejemplo agregar capítulo

```http
POST /api/stories/:storyId/chapters
Content-Type: application/json

{
  "username": "lucia",
  "parentChapterId": "<id_del_capitulo_1>",
  "contentType": "text",
  "content": "La gota era un mensaje cifrado de una colonia perdida."
}
```
