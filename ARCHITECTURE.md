# Rayu — Arquitectura de Componentes

> Renderizar con: [PlantUML Online](https://www.plantuml.com/plantuml/uml/) · VSCode extension **PlantUML** · IntelliJ plugin **PlantUML Integration**

```plantuml
@startuml Rayu_Componentes
skinparam componentStyle rectangle
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam backgroundColor #FAFAFA
skinparam shadowing false
skinparam ArrowColor #444444
skinparam ArrowFontSize 9
skinparam ArrowFontColor #555555

skinparam component {
  BackgroundColor #FFFFFF
  BorderColor #888888
  FontColor #111111
}
skinparam interface {
  BackgroundColor #FFF9C4
  BorderColor #F9A825
  FontColor #5D4037
  FontSize 10
}
skinparam package {
  FontStyle bold
  FontSize 12
}
skinparam note {
  BackgroundColor #F3F4F6
  BorderColor #9CA3AF
  FontSize 9
}
skinparam database {
  BackgroundColor #FFF3E0
  BorderColor #FB8C00
  FontColor #333333
}

title Rayu — Diagrama de Componentes UML\n(Microhistorias Colaborativas)

' ╔══════════════════════════════════════════════════════════════╗
' ║  FRONTEND                                                    ║
' ╚══════════════════════════════════════════════════════════════╝
package "Frontend — Browser" #EFF6FF {

  package "Páginas HTML" #DBEAFE {
    component [index.html] as IndexHTML <<page>>
    component [story.html] as StoryHTML <<page>>
  }

  package "Entry Points" #DBEAFE {
    component [main.js] as MainJS <<entrypoint>>
    component [story-main.js] as StoryMainJS <<entrypoint>>

    note right of StoryMainJS
      Lee ?storyId de URLSearchParams
      e instancia: api + view + app
    end note
  }

  ' ── Puertos (interfaces) que el Application Layer requiere ──
  interface "IStoryApi" as IStoryApi
  note top of IStoryApi
    listStories() : Story[]
    createStory(payload) : Result
    getStoryGraph(storyId) : Graph
    createChapter(storyId, payload) : Result
  end note

  interface "IStoryView" as IStoryView
  note top of IStoryView
    renderStories(stories, selected, onOpen)
    renderStoryDetail(story, graph)
    populateParentOptions(graph)
    drawGraph(graph)
    openStoryPage(storyId)
    readCreateStoryForm() : Payload
    readCreateChapterForm() : Payload
    bindStorySubmit(handler)
    bindChapterSubmit(handler)
    resetStoryForm()
    clearChapterInput()
    showSuccess(msg) / showError(msg)
  end note

  interface "IStoryReaderView" as IStoryReaderView
  note top of IStoryReaderView
    setStoryHeader(story, chapterCount)
    showEmptyState()
    renderGraph({ layoutNodes, edges, w, h })
    populateParentOptions(nodes)
    bindChapterSubmit(handler)
    readCreateChapterForm() : Payload
    clearChapterInput()
    applyZoom(level)
    showSuccess(msg) / showError(msg)
    showLoadError(msg)
  end note

  package "Application Layer" #BFDBFE {
    component [storyApp] as StoryApp <<application>>
    note right of StoryApp
      init()
        bindStorySubmit → handleCreateStory
        bindChapterSubmit → handleCreateChapter
        loadStories()
      loadStories()
        api.listStories()
        view.renderStories()
      handleCreateStory()
        view.readCreateStoryForm()
        api.createStory(payload)
        view.resetStoryForm()
        loadStories()
      handleCreateChapter()
        view.readCreateChapterForm()
        api.createChapter(selectedStory.id, payload)
        loadStories() + loadGraph()
      handleOpenStoryPage(story)
        view.openStoryPage(story.id)
    end note

    component [storyReaderApp] as StoryReaderApp <<application>>
    note right of StoryReaderApp
      init(storyId)
        bindChapterSubmit → handleCreateChapter
        loadStory(storyId)
      loadStory(storyId)
        api.getStoryGraph(storyId)
        api.listStories()  ← busca metadata
        buildLayout(graph) ← calcula posiciones
        view.renderGraph(layout)
        view.populateParentOptions(nodes)
      buildLayout(graph)
        BFS desde raíces
        asigna depth a cada nodo
        centra cada nivel horizontalmente
        devuelve { layoutNodes, width, height }
      handleCreateChapter()
        view.readCreateChapterForm()
        api.createChapter(storyId, payload)
        view.clearChapterInput()
        loadStory(storyId)
    end note
  }

  package "Adapters" #E0F2FE {
    component [httpStoryApi] as HttpApi <<adapter>>
    note bottom of HttpApi
      Implementa IStoryApi sobre fetch()
      ─────────────────────────────
      requestJson(url, options)
        fetch + Content-Type: application/json
        lanza Error si !response.ok
      listStories()   GET  /api/stories
      createStory()   POST /api/stories
      getStoryGraph() GET  /api/stories/:id/graph
      createChapter() POST /api/stories/:id/chapters
    end note

    component [domStoryView] as DomView <<adapter>>
    note bottom of DomView
      Implementa IStoryView sobre el DOM de index.html
      ─────────────────────────────
      renderStories()
        clona #storyCardTemplate por historia
        filtra por #storySearch (búsqueda local)
        guarda allStories para re-filtrar
      openStoryModal() / closeStoryModal()
        toggle .hidden en #storyModal
      drawGraph(graph)
        dibuja círculos y líneas en SVG #graph
        posiciona nodos con sin() para ondular
    end note

    component [domStoryReaderView] as DomReaderView <<adapter>>
    note bottom of DomReaderView
      Implementa IStoryReaderView sobre el DOM de story.html
      ─────────────────────────────
      renderGraph({ layoutNodes, edges, width, height })
        limpia nodesLayer y edgesLayer
        crea <article class="graph-node"> por nodo
        dibuja curvas Bézier cúbicas SVG (arrowhead)
        scrollLeft = (width - clientWidth) / 2
        scrollTop = 0  ← centra nodo raíz
      applyZoom(level)
        zoomWrapper.style.zoom = level
        (CSS zoom afecta layout y scrollbars)
      Zoom: STEP=0.2 · MIN=0.3 · MAX=2.0
    end note
  }

  package "Domain — funciones puras" #EDE9FE {
    component [storyDomain] as StoryDomain <<domain>>
    note right of StoryDomain
      escapeHtml(value)
        reemplaza & < > " '
      displayContent(contentType, content)
        "image" → <img src=...>
        "text"  → <p>...</p>
      sortChaptersByNumber(nodes)
        ordena por chapterNumber ASC
    end note
  }
}

' ╔══════════════════════════════════════════════════════════════╗
' ║  BACKEND                                                     ║
' ╚══════════════════════════════════════════════════════════════╝
package "Backend — Node.js / Express" #ECFDF5 {

  component [server.js] as ServerJS <<entrypoint>>
  note right of ServerJS
    dotenv.config()
    PORT = process.env.PORT || 3000
    STARTUP_RETRIES, STARTUP_RETRY_DELAY_MS
    bootstrapApp({ port, retries, delayMs })
    maneja SIGINT / SIGTERM → shutdown()
  end note

  component [bootstrap] as Bootstrap <<infrastructure>>
  note right of Bootstrap
    bootstrapApp(port)
      initializeDatabasesWithRetry()
        loop retries: initNeo4j() + initPostgres()
      createContainer()
      createHttpApp({ storyService })
      app.listen(port)
    closeResources()
      driver.close()
      pool.end()
  end note

  component [createHttpApp] as HttpApp <<infrastructure>>
  note right of HttpApp
    express.json({ limit: "2mb" })
    express.static("public/")
    GET /api/health → { status: "ok" }
    app.use("/api", StoriesRouter)
    error handler global → 500
  end note

  component [StoriesRouter] as Router <<controller>>
  note right of Router
    GET  /api/stories
      → storyService.listStories()
      ← { stories: Story[] }
    POST /api/stories
      body: { username, title, contentType, content }
      → storyService.createStory(body)
      ← 201 { story, firstChapterId }
    GET  /api/stories/:storyId/graph
      → storyService.getStoryGraph(id)
      ← { nodes: Chapter[], edges: Edge[] }
    POST /api/stories/:storyId/chapters
      body: { username, parentChapterId, contentType, content }
      → storyService.createChapter({ storyId, ...body })
      ← 201 { chapter }
  end note

  component [Container] as Container <<infrastructure>>
  note right of Container
    createPostgresStoryRepository({ pool })
    createNeo4jStoryGraphRepository({ driver })
    createStoryService({
      storyRepository,
      storyGraphRepository,
      idGenerator: uuidv4,
      now: () => new Date()
    })
  end note

  ' ── Puertos que StoryService requiere ──
  interface "IStoryRepository" as IStoryRepo
  note bottom of IStoryRepo
    listStoriesWithChapterCount() : Story[]
    storyExists(storyId) : boolean
    withTransaction(work) : any
      [tx] findOrCreateUser(username) : User
      [tx] insertStory(params)
      [tx] insertChapterActivity(params)
  end note

  interface "IStoryGraphRepository" as IGraphRepo
  note bottom of IGraphRepo
    createRootChapter(params)
    createChildChapter(params)
    getStoryGraph(storyId) : { nodes, edges }
    findChapterInStory({ storyId, chapterId })
  end note

  package "Application Layer" #BBFDE8 {
    component [StoryService] as Service <<application>>
    note right of Service
      listStories()
        storyRepository.listStoriesWithChapterCount()
      createStory({ username, title, contentType, content })
        validateContentType()
        idGenerator() × 2  ← storyId + chapterId
        withTransaction:
          findOrCreateUser(username)
          insertStory(storyId, ...)
          storyGraphRepo.createRootChapter(chapterId, ...)
          insertChapterActivity(chapterNumber=1)
      getStoryGraph(storyId)
        storyGraphRepo.getStoryGraph(storyId)
      createChapter({ storyId, username, parentChapterId, ... })
        validateContentType()
        storyRepository.storyExists(storyId)
        storyGraphRepo.findChapterInStory(storyId, parentId)
        chapterNumber = parent.chapterNumber + 1
        withTransaction:
          findOrCreateUser(username)
          storyGraphRepo.createChildChapter(...)
          insertChapterActivity(chapterNumber)
    end note
  }

  package "Infrastructure — Repositories" #D1FAE5 {
    component [PostgresStoryRepository] as PGRepo <<repository>>
    note right of PGRepo
      listStoriesWithChapterCount()
        JOIN stories + users + chapter_activity
        COALESCE(chapter_count, 0)
        ORDER BY created_at DESC LIMIT 50
      storyExists(storyId)
        SELECT id FROM stories WHERE id=$1
      withTransaction(work)
        pool.connect()
        BEGIN / work(txRepo) / COMMIT
        ROLLBACK on error
        client.release()
    end note

    component [Neo4jStoryGraphRepository] as Neo4jRepo <<repository>>
    note right of Neo4jRepo
      createRootChapter(params)
        CREATE (:Chapter { id, storyId, contentType,
          content, chapterNumber:1, authorId, createdAt })
      createChildChapter(params)
        MATCH (parent:Chapter {id, storyId})
        CREATE (child:Chapter {...})
        CREATE (parent)-[:NEXT {id, createdAt}]->(child)
      getStoryGraph(storyId)
        MATCH (c:Chapter {storyId})
        OPTIONAL MATCH (parent)-[r:NEXT]->(c)
        RETURN c, parent, r
      findChapterInStory(storyId, chapterId)
        MATCH (c:Chapter {id, storyId}) RETURN c LIMIT 1
    end note
  }
}

' ╔══════════════════════════════════════════════════════════════╗
' ║  BASES DE DATOS                                              ║
' ╚══════════════════════════════════════════════════════════════╝
package "Bases de Datos" #FFF3E0 {

  database "PostgreSQL" as PG
  note right of PG
    users
      id UUID PK
      username VARCHAR UNIQUE
    stories
      id UUID PK
      title TEXT
      content_type VARCHAR
      cover_content TEXT
      created_by UUID FK→users
      created_at TIMESTAMP
    chapter_activity
      id UUID PK
      story_id UUID FK→stories
      chapter_id UUID
      chapter_number INT
      parent_chapter_id UUID NULL
      created_by UUID FK→users
  end note

  database "Neo4j" as Neo4j
  note right of Neo4j
    Nodo :Chapter
      id           String
      storyId      String
      contentType  String  (text|image)
      content      String
      chapterNumber Integer
      parentChapterId String NULL
      authorId     String
      createdAt    DateTime
    Relación [:NEXT]
      id           String
      createdAt    DateTime
    Cypher: (parent)-[:NEXT]->(child)
  end note
}

' ╔══════════════════════════════════════════════════════════════╗
' ║  CONEXIONES                                                  ║
' ╚══════════════════════════════════════════════════════════════╝

' — Páginas → Entry Points —
IndexHTML  --> MainJS      : <script type=module>
StoryHTML  --> StoryMainJS : <script type=module>

' — Entry Points → instancias —
MainJS     --> HttpApi     : createHttpStoryApi()
MainJS     --> DomView     : createDomStoryView()
MainJS     --> StoryApp    : createStoryApp({ storyApi, view })

StoryMainJS --> HttpApi       : createHttpStoryApi()
StoryMainJS --> DomReaderView : createDomStoryReaderView()
StoryMainJS --> StoryReaderApp : createStoryReaderApp({ storyApi, view })

' — Implementaciones de puertos —
HttpApi      ..|> IStoryApi       : implements
DomView      ..|> IStoryView      : implements
DomReaderView ..|> IStoryReaderView : implements

' — Application usa puertos —
StoryApp       ..> IStoryApi       : requires
StoryApp       ..> IStoryView      : requires
StoryReaderApp ..> IStoryApi       : requires
StoryReaderApp ..> IStoryReaderView : requires

' — Adapters DOM usan Domain —
DomView       --> StoryDomain : escapeHtml()\ndisplayContent()\nsortChaptersByNumber()
DomReaderView --> StoryDomain : escapeHtml()\ndisplayContent()

' — HTTP: Frontend → Backend —
HttpApi --> Router : HTTP/1.1 JSON\nfetch(url, { headers, body })\nthrows Error si !response.ok

' — Bootstrap —
ServerJS  --> Bootstrap  : bootstrapApp(port)\nSIGINT/SIGTERM → shutdown()
Bootstrap --> Container  : createContainer()
Bootstrap --> HttpApp    : createHttpApp({ storyService })
Bootstrap ..> PG         : initPostgres() con reintentos\npg pool.connect()
Bootstrap ..> Neo4j      : initNeo4j() con reintentos\ndriver.verifyConnectivity()

' — HTTP App —
HttpApp --> Router : app.use("/api", router)\nexpress.static("public/")

' — Router → Service —
Router --> Service : listStories()\ncreateStory(body)\ngetStoryGraph(storyId)\ncreateChapter({ storyId, ...body })

' — Container inyecta —
Container --> PGRepo   : new({ pool })
Container --> Neo4jRepo : new({ driver })
Container --> Service  : new({ storyRepository: PGRepo,\nstoryGraphRepository: Neo4jRepo,\nidGenerator: uuidv4,\nnow: ()=>new Date() })

' — Implementaciones de puertos backend —
PGRepo   ..|> IStoryRepo  : implements
Neo4jRepo ..|> IGraphRepo  : implements

' — Service usa puertos —
Service ..> IStoryRepo  : storyRepository.*
Service ..> IGraphRepo  : storyGraphRepository.*

' — Repos → Bases de Datos —
PGRepo   --> PG    : pool.query(SQL)\nparameterized $1..$n\npg npm driver
Neo4jRepo --> Neo4j : session.run(Cypher)\nparámetros nombrados\nneo4j-driver npm

@enduml
```

---

## Flujo de datos — Crear capítulo (punta a punta)

```plantuml
@startuml Rayu_Flujo_CreateChapter
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam backgroundColor #FAFAFA
skinparam sequenceArrowThickness 1.5
skinparam sequenceParticipantBackgroundColor #FFFFFF
skinparam sequenceLifeLineBorderColor #AAAAAA
skinparam ActorBorderColor #555555

title Rayu — Flujo: Agregar Capítulo

actor       "Usuario"            as User
participant "domStoryReaderView" as View
participant "storyReaderApp"     as App
participant "httpStoryApi"       as Api
participant "StoriesRouter"      as Router
participant "StoryService"       as Svc
participant "PostgresRepo"       as PGRepo
participant "Neo4jRepo"          as GRepo
database    "PostgreSQL"         as PG
database    "Neo4j"              as Neo4j

User -> View : click "+ Capítulo"\n(openChapterModal)
User -> View : rellena form y submit
View -> App  : handler() vía bindChapterSubmit

App -> View  : readCreateChapterForm()\n← { username, parentChapterId,\n   contentType, content }

App -> Api   : createChapter(storyId, payload)
Api -> Router : POST /api/stories/:id/chapters\nContent-Type: application/json\nbody: { username, parentChapterId,\n        contentType, content }

Router -> Svc : createChapter({ storyId, ...body })

Svc -> Svc   : validateContentType(contentType)
Svc -> PGRepo : storyExists(storyId)
PGRepo -> PG  : SELECT id FROM stories WHERE id=$1
PG --> PGRepo : row | empty
PGRepo --> Svc : true | false

Svc -> GRepo  : findChapterInStory({ storyId, parentChapterId })
GRepo -> Neo4j : MATCH (c:Chapter {id:$id, storyId:$sid})\nRETURN c LIMIT 1
Neo4j --> GRepo : Chapter node | null
GRepo --> Svc  : { chapterNumber, ... } | null

Svc -> Svc   : chapterNumber = parent.chapterNumber + 1\nchapterId = uuidv4()\nrelationId = uuidv4()

Svc -> PGRepo : withTransaction(work)
  PGRepo -> PG   : BEGIN
  PGRepo -> PGRepo : findOrCreateUser(username)
  PGRepo -> PG   : SELECT / INSERT INTO users
  PG --> PGRepo  : { id, username }

  PGRepo -> GRepo : createChildChapter({ parentId, chapterId,\n  storyId, contentType, content,\n  chapterNumber, authorId,\n  relationId, createdAt })
  GRepo -> Neo4j  : MATCH (parent:Chapter {id, storyId})\n  CREATE (child:Chapter {...})\n  CREATE (parent)-[:NEXT {id}]->(child)
  Neo4j --> GRepo : child node

  PGRepo -> PG   : INSERT INTO chapter_activity\n  (id, story_id, chapter_id,\n   chapter_number, parent_chapter_id,\n   created_by)
  PG --> PGRepo  : OK
  PGRepo -> PG   : COMMIT
PGRepo --> Svc  : { chapter }

Svc --> Router  : { chapter }
Router --> Api  : 201 { chapter }
Api --> App    : chapter creado

App -> View    : clearChapterInput()\ncloseChapterModal()
App -> Api     : getStoryGraph(storyId)
Api -> Router  : GET /api/stories/:id/graph
Router -> Svc  : getStoryGraph(storyId)
Svc -> GRepo   : getStoryGraph(storyId)
GRepo -> Neo4j : MATCH (c:Chapter {storyId})\nOPTIONAL MATCH (p)-[r:NEXT]->(c)\nRETURN c, p, r
Neo4j --> GRepo : records
GRepo --> Svc   : { nodes[], edges[] }
Svc --> Router  : { nodes[], edges[] }
Router --> Api  : 200 { nodes[], edges[] }
Api --> App    : graph

App -> App     : buildLayout(graph)\n← BFS depth + centra niveles
App -> View    : renderGraph({ layoutNodes,\n  edges, width, height })
View -> View   : scroll al nodo raíz\nscrollLeft = (w - clientW) / 2\nscrollTop = 0
View --> User  : grafo actualizado

@enduml
```

---

## Diagrama de Actividades

```plantuml
@startuml Rayu_Actividades
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam backgroundColor #FAFAFA
skinparam shadowing false
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #666666
skinparam ActivityBorderThickness 1
skinparam ActivityStartColor #0f7d5a
skinparam ActivityEndColor #0f7d5a
skinparam ActivityDiamondBackgroundColor #FFF9C4
skinparam ActivityDiamondBorderColor #F9A825
skinparam ArrowColor #444444
skinparam ArrowFontSize 9
skinparam PartitionBorderThickness 1.5

title Rayu — Diagrama de Actividades

|#DBEAFE| Usuario |
|#BFDBFE| Frontend (Browser) |
|#BBF7D0| Express API |
|#FEF3C7| StoryService |
|#FFE0B2| Bases de Datos |

start

|Usuario|
:Abre **http://localhost:8080**;

|Frontend (Browser)|
:Descarga **index.html**;
:Ejecuta **main.js**\ninstancia api + view + app;
:storyApp.**init()**;

|Express API|
note right: GET /api/stories
:Recibe petición;

|StoryService|
:listStories()
→ storyRepository.listStoriesWithChapterCount();

|Bases de Datos|
:SELECT stories JOIN users\nLEFT JOIN chapter_activity\nORDER BY created_at DESC LIMIT 50;
:Devuelve **Story[]**;

|Frontend (Browser)|
:renderStories(stories)\nclona #storyCardTemplate por historia;
:Muestra listado de historias;

|Usuario|
fork
  ' ─── BÚSQUEDA LOCAL ───────────────────────
  :Escribe en el **buscador**;

  |Frontend (Browser)|
  :Filtra allStories[] por título\n(toLowerCase · includes)\nsin llamada al servidor;
  :Re-renderiza cards filtradas;

fork again
  ' ─── CREAR HISTORIA ───────────────────────
  :Click **"+ Nueva Historia"**;

  |Frontend (Browser)|
  :Abre modal #storyModal;

  |Usuario|
  :Rellena username, título,\ntipo de contenido y texto/URL;
  :Submit form;

  |Frontend (Browser)|
  :readCreateStoryForm()
  → { username, title, contentType, content };

  |Express API|
  note right: POST /api/stories
  :Recibe body JSON;

  |StoryService|
  :Valida campos obligatorios;
  :validateContentType(contentType);
  :Genera **storyId** = uuidv4();
  :Genera **chapterId** = uuidv4();
  :**withTransaction**(work);

  |Bases de Datos|
  :BEGIN;
  :SELECT users WHERE username=$1
  → si no existe INSERT INTO users;
  :INSERT INTO stories
  (id, title, content_type, cover_content, created_by);
  :CREATE (:Chapter { id:chapterId,
  storyId, contentType, content,
  chapterNumber:1, authorId, createdAt })
  **[Neo4j]**;
  :INSERT INTO chapter_activity
  (id, storyId, chapterId,
  chapterNumber:1, parentChapterId:NULL, createdBy);
  :COMMIT;

  |StoryService|
  :Devuelve { story, firstChapterId };

  |Frontend (Browser)|
  :resetStoryForm();
  :closeStoryModal();
  :loadStories() → re-renderiza lista;

fork again
  ' ─── VER HISTORIA ────────────────────────
  :Click en **card de historia**;

  |Frontend (Browser)|
  :openStoryPage(storyId)
  window.location → **story.html?storyId=...**;
  :Descarga **story.html**;
  :Ejecuta **story-main.js**
  lee ?storyId de URLSearchParams;
  :storyReaderApp.**init(storyId)**;

  |Express API|
  note right: GET /api/stories/:id/graph
  :Recibe storyId;

  |StoryService|
  :getStoryGraph(storyId)
  → storyGraphRepo.getStoryGraph(storyId);

  |Bases de Datos|
  :MATCH (c:Chapter {storyId: $sid})
  OPTIONAL MATCH (p)-[r:NEXT]->(c)
  RETURN c, p, r
  **[Neo4j Cypher]**;
  :Mapea records → { nodes[], edges[] };

  |Frontend (Browser)|
  :buildLayout(graph)
  → BFS desde nodos raíz (sin incoming)
  → asigna depth por nivel
  → centra cada nivel horizontalmente
  → devuelve { layoutNodes, width, height };
  :renderGraph({ layoutNodes, edges, width, height })
  → crea <article.graph-node> por nodo
  → dibuja curvas Bézier SVG con arrowhead;
  :Scroll automático al nodo raíz
  scrollLeft = (width - clientWidth) / 2
  scrollTop = 0;
  :populateParentOptions(nodes)
  → llena select#chapterParent;
  :Muestra **grafo interactivo**;

  |Usuario|
  fork
    ' ─── ZOOM ────────────────────────────
    :Click **+** o **−** (botones zoom);

    |Frontend (Browser)|
    if (zoom in?) then (sí)
      :zoomLevel = min(zoomLevel + 0.2, 2.0);
    else (no)
      :zoomLevel = max(zoomLevel - 0.2, 0.3);
    endif
    :zoomWrapper.style.zoom = zoomLevel
    (CSS zoom afecta layout y scrollbars);

  fork again
    ' ─── AGREGAR CAPÍTULO ────────────────
    :Click **"+ Capítulo"**;

    |Frontend (Browser)|
    :Abre modal #chapterModal;

    |Usuario|
    :Selecciona nodo padre del árbol,
    tipo de contenido y texto/URL;
    :Submit form;

    |Frontend (Browser)|
    :readCreateChapterForm()
    → { username, parentChapterId,
       contentType, content };

    |Express API|
    note right: POST /api/stories/:id/chapters
    :Recibe storyId + body JSON;

    |StoryService|
    :validateContentType(contentType);
    :storyExists(storyId)
    → SELECT id FROM stories WHERE id=$1;
    if (historia no existe?) then (sí)
      :Lanza AppError 404;
      stop
    endif
    :findChapterInStory({ storyId, parentChapterId })
    MATCH (c:Chapter {id, storyId}) RETURN c LIMIT 1;
    if (padre no existe?) then (sí)
      :Lanza AppError 404;
      stop
    endif
    :chapterNumber = parent.chapterNumber + 1;
    :Genera **chapterId** = uuidv4();
    :Genera **relationId** = uuidv4();
    :**withTransaction**(work);

    |Bases de Datos|
    :BEGIN;
    :SELECT / INSERT INTO users;
    :MATCH (parent:Chapter {id, storyId})
    CREATE (child:Chapter { id:chapterId,
    storyId, contentType, content,
    chapterNumber, authorId, createdAt })
    CREATE (parent)-[:NEXT {id:relationId}]->(child)
    **[Neo4j Cypher]**;
    :INSERT INTO chapter_activity
    (id, storyId, chapterId,
    chapterNumber, parentChapterId, createdBy)
    **[PostgreSQL]**;
    :COMMIT;

    |Frontend (Browser)|
    :clearChapterInput();
    :closeChapterModal();
    :loadStory(storyId)
    → re-fetcha grafo y re-renderiza;
  end fork
end fork

stop

@enduml
```

---

## Diagrama de Implementación (Despliegue)

```plantuml
@startuml Rayu_Despliegue
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam backgroundColor #FAFAFA
skinparam shadowing false
skinparam componentStyle rectangle

skinparam node {
  BackgroundColor #FFFFFF
  BorderColor #888888
  FontColor #111111
}
skinparam component {
  BackgroundColor #FFFFFF
  BorderColor #888888
}
skinparam database {
  BackgroundColor #FFF3E0
  BorderColor #FB8C00
}
skinparam storage {
  BackgroundColor #F0FFF4
  BorderColor #27AE60
}
skinparam ArrowColor #444444
skinparam ArrowFontSize 9
skinparam ArrowFontColor #555555
skinparam note {
  BackgroundColor #F3F4F6
  BorderColor #9CA3AF
  FontSize 9
}

title Rayu — Diagrama de Implementación (Despliegue)\nDocker Compose · Tres contenedores

' ╔══════════════════════════════════════════════════════════════╗
' ║  CLIENTE                                                     ║
' ╚══════════════════════════════════════════════════════════════╝
node "Dispositivo del Usuario\n(PC / Móvil)" as ClientDevice #FEF9C3 {
  node "Navegador Web\n(Chrome / Firefox / Safari)" as Browser #FEF3C7 {
    component [index.html + story.html\nJS ESModules · CSS] as SPA <<SPA>>
    note right of SPA
      Descargado vía HTTP desde rayu-app
      Se ejecuta completamente en el browser
      Comunicación con el servidor sólo via REST API
      No requiere framework — Vanilla JS ESModules
    end note
  }
}

' ╔══════════════════════════════════════════════════════════════╗
' ║  SERVIDOR                                                    ║
' ╚══════════════════════════════════════════════════════════════╝
node "Máquina Host\n(Servidor / Laptop del desarrollador)" as Host #EFF6FF {

  node "Docker Engine" as DockerEngine #E0F2FE {

    node "Red virtual Docker\nrayu_default  (bridge)" as DockerNet #F0FFF4 {

      ' ─── CONTENEDOR APP ──────────────────────
      node "**rayu-app**\nImagen: node:20-bookworm-slim\nBuild: Dockerfile" as AppNode #DBEAFE {

        component [**src/server.js**\nnpm start\nnode src/server.js] as ServerProcess <<process>>

        component [**public/**\nindex.html · story.html\nJS · CSS · img/] as StaticFiles <<artifact>>

        note bottom of AppNode
          Variables de entorno:
          ─────────────────────────────
          PORT                    = 8080
          STARTUP_RETRIES         = 20
          STARTUP_RETRY_DELAY_MS  = 3000
          NEO4J_URI      = bolt://neo4j:7687
          NEO4J_USER     = neo4j
          NEO4J_PASSWORD = rayu_neo4j_password
          DATABASE_URL   = postgresql://postgres:postgres
                           @postgres:5432/rayu
          ─────────────────────────────
          restart: unless-stopped
          depends_on: postgres (healthy)
                      neo4j    (healthy)
        end note
      }

      ' ─── CONTENEDOR POSTGRES ─────────────────
      node "**rayu-postgres**\nImagen: postgres:16\n(oficial Docker Hub)" as PGNode #DCFCE7 {

        database "**PostgreSQL 16**\n/var/lib/postgresql/data" as PGDb

        note bottom of PGNode
          Variables de entorno:
          ─────────────────────────────
          POSTGRES_USER     = postgres
          POSTGRES_PASSWORD = postgres
          POSTGRES_DB       = rayu
          ─────────────────────────────
          healthcheck:
            test: pg_isready -U postgres -d rayu
            interval: 5s · timeout: 5s · retries: 20
          restart: unless-stopped
        end note
      }

      ' ─── CONTENEDOR NEO4J ────────────────────
      node "**rayu-neo4j**\nImagen: neo4j:5.22\n(oficial Docker Hub)" as Neo4jNode #FFFDE7 {

        database "**Neo4j 5.22**\n/data" as Neo4jDb

        note bottom of Neo4jNode
          Variables de entorno:
          ─────────────────────────────
          NEO4J_AUTH = neo4j/rayu_neo4j_password
          NEO4J_server_config_strict_validation = false
          ─────────────────────────────
          healthcheck:
            test: cypher-shell RETURN 1
            interval: 5s · timeout: 10s · retries: 30
          restart: unless-stopped
        end note
      }
    }

    ' ─── VOLÚMENES ──────────────────────────────
    storage "Volume\n**postgres_data**\n(persistencia SQL)" as PGVol
    storage "Volume\n**neo4j_data**\n(persistencia grafo)" as Neo4jVol
  }
}

' ╔══════════════════════════════════════════════════════════════╗
' ║  CONEXIONES                                                  ║
' ╚══════════════════════════════════════════════════════════════╝

' — Cliente → Servidor —
Browser --> AppNode : **HTTP/1.1**\nHost: localhost:8080\nGET  /  → index.html\nGET  /story.html\nGET  /api/stories\nPOST /api/stories\nGET  /api/stories/:id/graph\nPOST /api/stories/:id/chapters

' — Puertos expuestos del Host —
AppNode    ..> Host : expone **:8080**\n(host:8080 → container:8080)
PGNode     ..> Host : expone **:5432**\n(host:5432 → container:5432)
Neo4jNode  ..> Host : expone **:7474** HTTP Browser\n**:7687** Bolt protocol\n(host → container)

' — Comunicación interna Docker network —
AppNode --> PGNode    : **postgresql://**\npostgres@postgres:5432/rayu\npg driver · pool · SQL parameterizado\nBEGIN / COMMIT / ROLLBACK

AppNode --> Neo4jNode : **bolt://neo4j:7687**\nneo4j-driver · session.run()\nCypher queries\n(:Chapter nodes · [:NEXT] rels)

' — Startup order (depends_on healthy) —
AppNode .down.> PGNode    : depends_on\n⟨condition: service_healthy⟩
AppNode .down.> Neo4jNode : depends_on\n⟨condition: service_healthy⟩

' — Volúmenes montados —
PGNode    --> PGVol    : bind mount\n/var/lib/postgresql/data
Neo4jNode --> Neo4jVol : bind mount\n/data

@enduml
```
