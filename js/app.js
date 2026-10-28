/*
 * ============================================================
 * 3rd YEAR CHEMISTRY APP
 * app.js
 * ============================================================
 *
 * Main application logic.
 *
 * Responsibilities:
 * - Render courses
 * - Render chapters
 * - Render chapter topics
 * - Render resources
 * - Search syllabus/resources
 * - Handle navigation
 * - Handle resource file opening
 * - Update statistics
 *
 * ============================================================
 */


/* ============================================================
   APPLICATION STATE
   ============================================================ */

const APP_STATE = {
  currentView: "courses",
  selectedCourseId: null,
  selectedChapterId: null,
  searchQuery: "",
  searchResults: null
};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function getAppRoot() {
  return document.getElementById("app-root");
}


function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ============================================================
   APPLICATION INITIALIZATION
   ============================================================ */

function initializeApp() {

  const root = getAppRoot();

  if (!root) {
    console.error("App root not found.");
    return;
  }

  renderApplication();

  setupKineticScroll();

  setupPrologue();

}


/* ============================================================
   LOADER
   ============================================================ */

function setupPrologue() {

  const loader =
    document.getElementById("loader-overlay");

  if (!loader) return;

  const skipButton =
    document.getElementById("skip-prologue");

  let hasFinished = false;

  const finishPrologue = () => {

    if (hasFinished) return;

    hasFinished = true;

    loader.classList.add("hidden");

    setTimeout(() => {

      loader.style.display = "none";

    }, 650);

  };

  if (skipButton) {

    skipButton.addEventListener("click", finishPrologue);

  }

  loader.addEventListener("pointerdown", event => {

    if (event.target.closest(".skip-prologue")) return;

    finishPrologue();

  });

  setTimeout(finishPrologue, 3000);

}


/* ============================================================
   KINETIC SCROLLING
   ============================================================ */

let kineticObserver = null;
let scrollFrame = null;
let lastScrollPosition = 0;


function setupKineticScroll() {

  if (kineticObserver) {
    kineticObserver.disconnect();
  }

  const motionItems = document.querySelectorAll(
    ".page-heading, .section-heading, .course-card, .chapter-card, .resource-card, .topic-item, .search-result-card, .empty-state"
  );

  motionItems.forEach((item, index) => {

    item.classList.add("scroll-reveal");
    item.style.setProperty("--reveal-delay", `${Math.min(index % 8, 6) * 55}ms`);

  });

  if ("IntersectionObserver" in window) {

    kineticObserver = new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            kineticObserver.unobserve(entry.target);
          }

        });

      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    motionItems.forEach(item => kineticObserver.observe(item));

  } else {

    motionItems.forEach(item => item.classList.add("is-visible"));

  }

  if (!window.__kineticScrollBound) {

    window.__kineticScrollBound = true;

    window.addEventListener("scroll", updateKineticScroll, { passive: true });

  }

  updateKineticScroll();

}


function updateKineticScroll() {

  if (scrollFrame) return;

  scrollFrame = window.requestAnimationFrame(() => {

    const currentPosition = window.scrollY || 0;
    const movement = Math.max(-18, Math.min(18, currentPosition - lastScrollPosition));

    document.documentElement.style.setProperty("--scroll-shift", `${currentPosition * -0.08}px`);
    document.documentElement.style.setProperty("--scroll-velocity", `${movement * 0.16}deg`);

    lastScrollPosition = currentPosition;
    scrollFrame = null;

  });

}


/* ============================================================
   MAIN APPLICATION RENDER
   ============================================================ */

function renderApplication() {

  const root = getAppRoot();

  root.innerHTML = `

    <div class="app-shell">

      ${renderHeader()}

      <div class="app-body">

        ${renderSidebar()}

        <main class="main-content" id="main-content">

          ${renderCurrentView()}

        </main>

      </div>

      ${renderFooter()}

    </div>

  `;

  attachEventListeners();

}


/* ============================================================
   HEADER
   ============================================================ */

function renderHeader() {

  return `

    <header class="app-header">

      <div class="brand-section">

        <button
          class="mobile-menu-btn"
          id="mobile-menu-btn"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div class="brand-icon">
          ⚗
        </div>

        <div class="brand-text">

          <h1>
            3rd Year Chemistry
          </h1>

          <span>
            Syllabus & Resources
          </span>

        </div>

      </div>


      <div class="header-actions">

        <button
          class="header-btn"
          id="home-btn"
          title="Home"
        >
          🏠
        </button>

        <button
          class="header-btn"
          id="search-focus-btn"
          title="Search"
        >
          🔍
        </button>

      </div>

    </header>

  `;

}


/* ============================================================
   SIDEBAR
   ============================================================ */

function renderSidebar() {

  const courses =
    typeof getAllCourses === "function"
      ? getAllCourses()
      : [];

  const courseCount =
    typeof getCourseCount === "function"
      ? getCourseCount()
      : courses.length;

  const chapterCount =
    typeof getChapterCount === "function"
      ? getChapterCount()
      : courses.reduce(
          (total, course) =>
            total +
            (course.chapters
              ? course.chapters.length
              : 0),
          0
        );

  const resourceCount =
    typeof getResourceCount === "function"
      ? getResourceCount()
      : 0;


  return `

    <aside
      class="sidebar"
      id="sidebar"
    >

      <div class="sidebar-inner">

        <nav class="sidebar-nav">

          <button
            class="nav-item ${APP_STATE.currentView === "courses" ? "active" : ""}"
            data-view="courses"
          >
            <span class="nav-icon">📚</span>
            <span>Courses</span>
          </button>


          <button
            class="nav-item ${APP_STATE.currentView === "resources" ? "active" : ""}"
            data-view="resources"
          >
            <span class="nav-icon">📁</span>
            <span>All Resources</span>
          </button>


          <button
            class="nav-item ${APP_STATE.currentView === "search" ? "active" : ""}"
            data-view="search"
          >
            <span class="nav-icon">🔎</span>
            <span>Search</span>
          </button>

        </nav>


        <div class="sidebar-divider"></div>


        <div class="sidebar-stats">

          <div class="stat-item">

            <span class="stat-number">
              ${courseCount}
            </span>

            <span class="stat-label">
              Courses
            </span>

          </div>


          <div class="stat-item">

            <span class="stat-number">
              ${chapterCount}
            </span>

            <span class="stat-label">
              Chapters
            </span>

          </div>


          <div class="stat-item">

            <span class="stat-number">
              ${resourceCount}
            </span>

            <span class="stat-label">
              Resources
            </span>

          </div>

        </div>

      </div>

    </aside>

  `;

}


/* ============================================================
   FOOTER
   ============================================================ */

function renderFooter() {

  return `

    <footer class="app-footer">

      <div>
        3rd Year Chemistry
      </div>

      <div>
        Academic Resource Hub
      </div>

    </footer>

  `;

}


/* ============================================================
   CURRENT VIEW
   ============================================================ */

function renderCurrentView() {

  switch (APP_STATE.currentView) {

    case "courses":
      return renderCoursesView();

    case "course":
      return renderCourseView();

    case "chapter":
      return renderChapterView();

    case "resources":
      return renderResourcesView();

    case "search":
      return renderSearchView();

    default:
      return renderCoursesView();

  }

}


/* ============================================================
   COURSES VIEW
   ============================================================ */

function renderCoursesView() {

  const courses =
    typeof getAllCourses === "function"
      ? getAllCourses()
      : [];


  return `

    <section class="page-section">

      <div class="page-heading">

        <div>

          <span class="eyebrow">
            ACADEMIC YEAR
          </span>

          <h2>
            Chemistry Courses
          </h2>

          <p>
            Explore your 3rd-year Chemistry syllabus,
            chapters, topics and study resources.
          </p>

        </div>

      </div>


      <div class="course-grid">

        ${
          courses.length
            ? courses.map(renderCourseCard).join("")
            : renderEmptyState(
                "No courses found",
                "Syllabus data is currently unavailable."
              )
        }

      </div>

    </section>

  `;

}


/* ============================================================
   COURSE CARD
   ============================================================ */

function renderCourseCard(course) {

  const chapters =
    Array.isArray(course.chapters)
      ? course.chapters
      : [];


  const chapterCount =
    chapters.length;


  let resourceCount = 0;

  if (typeof getResourcesByCourse === "function") {

    resourceCount =
      getResourcesByCourse(course.code).length;

  }


  return `

    <article
      class="course-card"
      data-course-id="${escapeHTML(course.id)}"
    >

      <div class="course-card-top">

        <span class="course-code">
          ${escapeHTML(course.code)}
        </span>

        <span class="course-arrow">
          →
        </span>

      </div>


      <h3 class="course-title">
        ${escapeHTML(course.title)}
      </h3>


      ${
        course.description
          ? `
            <p class="course-description">
              ${escapeHTML(course.description)}
            </p>
          `
          : ""
      }


      <div class="course-meta">

        <span>
          📖 ${chapterCount}
          ${chapterCount === 1 ? "Chapter" : "Chapters"}
        </span>

        <span>
          📁 ${resourceCount}
          ${resourceCount === 1 ? "Resource" : "Resources"}
        </span>

      </div>

    </article>

  `;

}


/* ============================================================
   COURSE VIEW
   ============================================================ */

function renderCourseView() {

  const course =
    typeof getCourseById === "function"
      ? getCourseById(APP_STATE.selectedCourseId)
      : null;


  if (!course) {

    APP_STATE.currentView = "courses";

    return renderCoursesView();

  }


  const chapters =
    Array.isArray(course.chapters)
      ? course.chapters
      : [];


  const courseLibraryResources =
    typeof getCourseLibraryResources === "function"
      ? getCourseLibraryResources(course.code)
      : [];


  return `

    <section class="page-section">

      <button
        class="back-btn"
        id="back-to-courses"
      >
        ← Back to Courses
      </button>


      <div class="course-page-header">

        <div>

          <span class="course-code large">
            ${escapeHTML(course.code)}
          </span>

          <h2>
            ${escapeHTML(course.title)}
          </h2>

          ${
            course.description
              ? `
                <p>
                  ${escapeHTML(course.description)}
                </p>
              `
              : ""
          }

        </div>

      </div>


      ${
        courseLibraryResources.length
          ? `
            <div class="content-section course-library-section">

              <div class="section-heading">

                <h3>
                  Course Library
                </h3>

                <span>
                  ${courseLibraryResources.length}
                </span>

              </div>

              ${renderMaterialCollection(
                "Previous Materials",
                "previous",
                courseLibraryResources,
                "No course-wide previous materials yet."
              )}

            </div>
          `
          : ""
      }


      <div class="section-heading">

        <h3>
          Chapters
        </h3>

        <span>
          ${chapters.length} Chapters
        </span>

      </div>


      <div class="chapter-list">

        ${
          chapters.length
            ? chapters.map(
                chapter =>
                  renderChapterCard(
                    chapter,
                    course
                  )
              ).join("")
            : renderEmptyState(
                "No chapters found",
                "This course has no chapter data yet."
              )
        }

      </div>

    </section>

  `;

}


/* ============================================================
   CHAPTER CARD
   ============================================================ */

function renderChapterCard(chapter, course) {

  const topics =
    Array.isArray(chapter.topics)
      ? chapter.topics
      : [];


  let resourceCount = 0;

  if (typeof getResourcesByChapter === "function") {

    resourceCount =
      getResourcesByChapter(chapter.id).length;

  }


  return `

    <article
      class="chapter-card"
      data-chapter-id="${escapeHTML(chapter.id)}"
    >

      <div class="chapter-number">

        ${escapeHTML(chapter.number)}

      </div>


      <div class="chapter-info">

        <h3>
          ${escapeHTML(chapter.title)}
        </h3>

        <div class="chapter-meta">

          <span>
            ${topics.length} Topics
          </span>

          <span>
            ${resourceCount} Resources
          </span>

        </div>

      </div>


      <div class="chapter-arrow">
        →
      </div>

    </article>

  `;

}


/* ============================================================
   CHAPTER VIEW
   ============================================================ */

function renderChapterView() {

  const chapter =
    typeof getChapterById === "function"
      ? getChapterById(APP_STATE.selectedChapterId)
      : null;


  if (!chapter) {

    APP_STATE.currentView = "courses";

    return renderCoursesView();

  }


  const course =
    typeof getCourseByChapterId === "function"
      ? getCourseByChapterId(chapter.id)
      : null;


  const topics =
    Array.isArray(chapter.topics)
      ? chapter.topics
      : [];


  const resources =
    typeof getResourcesByChapter === "function"
      ? getResourcesByChapter(chapter.id)
      : [];


  const previousMaterials =
    typeof getChapterResourcesByCollection === "function"
      ? getChapterResourcesByCollection(chapter.id, "previous")
      : [];


  const batch53Materials =
    typeof getChapterResourcesByCollection === "function"
      ? getChapterResourcesByCollection(chapter.id, "batch-53")
      : [];


  return `

    <section class="page-section">

      <button
        class="back-btn"
        id="back-to-course"
      >
        ← Back to ${course ? escapeHTML(course.code) : "Course"}
      </button>


      <div class="chapter-page-header">

        ${
          course
            ? `
              <span class="course-code">
                ${escapeHTML(course.code)}
              </span>
            `
            : ""
        }


        <div class="chapter-heading-row">

          <span class="chapter-page-number">
            Chapter ${escapeHTML(chapter.number)}
          </span>

          <h2>
            ${escapeHTML(chapter.title)}
          </h2>

        </div>

      </div>


      <!-- TOPICS -->

      <div class="content-section">

        <div class="section-heading">

          <h3>
            Topics
          </h3>

          <span>
            ${topics.length}
          </span>

        </div>


        <div class="topics-container">

          ${
            topics.length
              ? topics.map(
                  (topic, index) => `
                    <div class="topic-item">

                      <span class="topic-number">
                        ${index + 1}
                      </span>

                      <span>
                        ${escapeHTML(topic)}
                      </span>

                    </div>
                  `
                ).join("")
              : `
                <div class="empty-inline">
                  No topics listed.
                </div>
              `
          }

        </div>

      </div>


      <!-- RESOURCES -->

      <div class="content-section">

        <div class="section-heading">

          <h3>
            Study Resources
          </h3>

          <span>
            ${resources.length}
          </span>

        </div>


        <div class="material-collection-stack">

          ${renderMaterialCollection(
            "Previous Materials",
            "previous",
            previousMaterials,
            "No materials from previous batches are available for this chapter yet."
          )}

          ${renderMaterialCollection(
            "Batch 53 Materials",
            "batch-53",
            batch53Materials,
            "Newly added materials for Batch 53 will appear here."
          )}

        </div>

      </div>

    </section>

  `;

}


/* ============================================================
   MATERIAL COLLECTIONS
   ============================================================ */

function renderMaterialCollection(title, collection, resources, emptyMessage) {

  const icon =
    collection === "previous"
      ? "🗂️"
      : "✨";


  return `

    <details
      class="material-collection ${escapeHTML(collection)}"
      open
    >

      <summary>

        <span class="material-collection-title">
          <span class="material-collection-icon">${icon}</span>
          <span>${escapeHTML(title)}</span>
        </span>

        <span class="material-collection-count">
          ${resources.length}
        </span>

      </summary>

      <div class="material-collection-body">

        ${
          resources.length
            ? `
              <div class="resource-grid">
                ${resources.map(renderResourceCard).join("")}
              </div>
            `
            : `
              <div class="empty-inline material-empty">
                ${escapeHTML(emptyMessage)}
              </div>
            `
        }

      </div>

    </details>

  `;

}


/* ============================================================
   RESOURCES VIEW
   ============================================================ */

function renderResourcesView() {

  const resources =
    typeof getAllResources === "function"
      ? getAllResources()
      : [];


  return `

    <section class="page-section">

      <div class="page-heading">

        <div>

          <span class="eyebrow">
            STUDY MATERIAL
          </span>

          <h2>
            All Resources
          </h2>

          <p>
            Browse Previous Materials and Batch 53 Materials by course,
            chapter and resource type.
          </p>

        </div>

      </div>


      <div class="resource-filters">

        <button
          class="filter-btn active"
          data-resource-filter="all"
        >
          All
        </button>

        <button
          class="filter-btn"
          data-resource-filter="collection:previous"
        >
          🗂️ Previous Materials
        </button>

        <button
          class="filter-btn"
          data-resource-filter="collection:batch-53"
        >
          ✨ Batch 53 Materials
        </button>

        <button
          class="filter-btn"
          data-resource-filter="class-note"
        >
          📝 Class Notes
        </button>

        <button
          class="filter-btn"
          data-resource-filter="personal-note"
        >
          📒 Personal Notes
        </button>

        <button
          class="filter-btn"
          data-resource-filter="teacher-material"
        >
          👨‍🏫 Teacher Material
        </button>

        <button
          class="filter-btn"
          data-resource-filter="slide"
        >
          📊 Slides
        </button>

        <button
          class="filter-btn"
          data-resource-filter="book"
        >
          📚 Books
        </button>

        <button
          class="filter-btn"
          data-resource-filter="previous-year-question"
        >
          📄 Previous Year Questions
        </button>

        <button
          class="filter-btn"
          data-resource-filter="video"
        >
          🎥 Videos
        </button>

      </div>


      <div
        class="resource-grid"
        id="all-resource-grid"
      >

        ${
          resources.length
            ? resources
                .map(renderResourceCard)
                .join("")
            : renderEmptyState(
                "No resources available",
                "Add resource objects to resources.js."
              )
        }

      </div>

    </section>

  `;

}


/* ============================================================
   RESOURCE CARD
   ============================================================ */

function renderResourceCard(resource) {

  const type =
    typeof getResourceTypeLabel === "function"
      ? getResourceTypeLabel(resource.type)
      : resource.type;


  const icon =
    typeof getResourceTypeIcon === "function"
      ? getResourceTypeIcon(resource.type)
      : "📄";


  const course =
    typeof getCourseByChapterId === "function"
      ? getCourseByChapterId(resource.chapterId)
      : null;


  const courseCode =
    course?.code ||
    resource.courseCode ||
    "";


  const collectionLabel =
    typeof getMaterialCollectionLabel === "function"
      ? getMaterialCollectionLabel(resource.collection)
      : "Study Materials";


  return `

    <article
      class="resource-card"
      data-resource-type="${escapeHTML(resource.type)}"
      data-resource-collection="${escapeHTML(resource.collection || "")}" 
    >

      <div class="resource-icon">
        ${icon}
      </div>


      <div class="resource-content">

        <div class="resource-labels">
          <span class="resource-type">
            ${escapeHTML(type)}
          </span>

          <span class="resource-collection-badge ${escapeHTML(resource.collection || "")}">
            ${escapeHTML(collectionLabel)}
          </span>
        </div>


        <h4 class="resource-title">
          ${escapeHTML(resource.title)}
        </h4>


        <div class="resource-details">

          ${
            courseCode
              ? `
                <span>
                  ${escapeHTML(courseCode)}
                </span>
              `
              : ""
          }

          <span>
            ${escapeHTML(resource.chapterTitle)}
          </span>

        </div>


        <div class="resource-footer">

          <span class="file-name">
            ${escapeHTML(resource.fileName)}
          </span>


          <button
            class="resource-open-btn"
            data-resource-path="${escapeHTML(resource.filePath)}"
            title="Open resource"
          >
            Open →
          </button>

        </div>

      </div>

    </article>

  `;

}


/* ============================================================
   SEARCH VIEW
   ============================================================ */

function renderSearchView() {

  const query =
    APP_STATE.searchQuery;


  let results = APP_STATE.searchResults;


  if (!query) {

    return `

      <section class="page-section">

        <div class="page-heading">

          <div>

            <span class="eyebrow">
              FIND MATERIAL
            </span>

            <h2>
              Search
            </h2>

            <p>
              Search courses, chapters, topics and resources.
            </p>

          </div>

        </div>


        <div class="search-box-large">

          <input
            type="search"
            id="main-search-input"
            placeholder="Search Chemistry syllabus..."
            autocomplete="off"
          >

          <button
            id="main-search-btn"
          >
            🔍 Search
          </button>

        </div>


        <div class="search-hints">

          <span>Try:</span>

          <button data-search-example="electrochemistry">
            Electrochemistry
          </button>

          <button data-search-example="polymer">
            Polymer
          </button>

          <button data-search-example="spectroscopy">
            Spectroscopy
          </button>

          <button data-search-example="symmetry">
            Symmetry
          </button>

        </div>

      </section>

    `;

  }


  if (!results) {

    results =
      performSearch(query);

    APP_STATE.searchResults =
      results;

  }


  return `

    <section class="page-section">

      <div class="search-top">

        <button
          class="back-btn"
          id="back-from-search"
        >
          ← Back
        </button>


        <div class="search-box-large">

          <input
            type="search"
            id="main-search-input"
            value="${escapeHTML(query)}"
            placeholder="Search..."
          >

          <button
            id="main-search-btn"
          >
            🔍 Search
          </button>

        </div>

      </div>


      <div class="search-results-header">

        <h2>
          Search Results
        </h2>

        <span>
          ${results.length} result${results.length === 1 ? "" : "s"}
        </span>

      </div>


      <div class="search-results">

        ${
          results.length
            ? results
                .map(renderSearchResult)
                .join("")
            : renderEmptyState(
                "Nothing found",
                `No results matched "${query}".`
              )
        }

      </div>

    </section>

  `;

}


/* ============================================================
   SEARCH
   ============================================================ */

function performSearch(query) {

  const cleanQuery =
    String(query || "")
      .trim()
      .toLowerCase();


  if (!cleanQuery) {
    return [];
  }


  const results = [];


  /*
   * COURSE SEARCH
   */

  const courses =
    typeof getAllCourses === "function"
      ? getAllCourses()
      : [];


  courses.forEach(course => {

    const courseText =
      [
        course.code,
        course.title,
        course.description || ""
      ]
        .join(" ")
        .toLowerCase();


    if (courseText.includes(cleanQuery)) {

      results.push({
        type: "course",
        course
      });

    }


    /*
     * CHAPTER + TOPIC SEARCH
     */

    (course.chapters || []).forEach(chapter => {

      const chapterText =
        [
          chapter.title,
          ...(chapter.topics || [])
        ]
          .join(" ")
          .toLowerCase();


      if (chapterText.includes(cleanQuery)) {

        results.push({
          type: "chapter",
          course,
          chapter
        });

      }

    });

  });


  /*
   * RESOURCE SEARCH
   */

  const resources =
    typeof getAllResources === "function"
      ? getAllResources()
      : [];


  resources.forEach(resource => {

    const resourceText =
      [
        resource.title,
        resource.fileName,
        resource.chapterTitle,
        resource.courseCode,
        resource.type
      ]
        .join(" ")
        .toLowerCase();


    if (resourceText.includes(cleanQuery)) {

      results.push({
        type: "resource",
        resource
      });

    }

  });


  return results;

}


/* ============================================================
   SEARCH RESULT CARD
   ============================================================ */

function renderSearchResult(result) {

  if (result.type === "course") {

    return `

      <article
        class="search-result-card"
        data-course-id="${escapeHTML(result.course.id)}"
        data-search-result-type="course"
      >

        <div class="search-result-icon">
          📚
        </div>

        <div>

          <span class="search-result-type">
            COURSE
          </span>

          <h3>
            ${escapeHTML(result.course.code)}
            — ${escapeHTML(result.course.title)}
          </h3>

        </div>

        <span class="search-result-arrow">
          →
        </span>

      </article>

    `;

  }


  if (result.type === "chapter") {

    return `

      <article
        class="search-result-card"
        data-chapter-id="${escapeHTML(result.chapter.id)}"
        data-search-result-type="chapter"
      >

        <div class="search-result-icon">
          📖
        </div>

        <div>

          <span class="search-result-type">
            CHAPTER · ${escapeHTML(result.course.code)}
          </span>

          <h3>
            Chapter ${escapeHTML(result.chapter.number)}
            — ${escapeHTML(result.chapter.title)}
          </h3>

        </div>

        <span class="search-result-arrow">
          →
        </span>

      </article>

    `;

  }


  if (result.type === "resource") {

    const icon =
      typeof getResourceTypeIcon === "function"
        ? getResourceTypeIcon(result.resource.type)
        : "📄";


    return `

      <article
        class="search-result-card"
        data-resource-path="${escapeHTML(result.resource.filePath)}"
        data-search-result-type="resource"
      >

        <div class="search-result-icon">
          ${icon}
        </div>

        <div>

          <span class="search-result-type">
            ${escapeHTML(result.resource.type)}
          </span>

          <h3>
            ${escapeHTML(result.resource.title)}
          </h3>

          <p>
            ${escapeHTML(result.resource.chapterTitle)}
          </p>

        </div>

        <span class="search-result-arrow">
          →
        </span>

      </article>

    `;

  }


  return "";

}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function renderEmptyState(title, message) {

  return `

    <div class="empty-state">

      <div class="empty-icon">
        📭
      </div>

      <h3>
        ${escapeHTML(title)}
      </h3>

      <p>
        ${escapeHTML(message)}
      </p>

    </div>

  `;

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function showCourses() {

  APP_STATE.currentView =
    "courses";

  APP_STATE.selectedCourseId =
    null;

  APP_STATE.selectedChapterId =
    null;

  APP_STATE.searchQuery =
    "";

  APP_STATE.searchResults =
    null;

  refreshApplication();

}


function showCourse(courseId) {

  APP_STATE.currentView =
    "course";

  APP_STATE.selectedCourseId =
    courseId;

  APP_STATE.selectedChapterId =
    null;

  refreshApplication();

}


function showChapter(chapterId) {

  APP_STATE.currentView =
    "chapter";

  APP_STATE.selectedChapterId =
    chapterId;

  refreshApplication();

}


function showResources() {

  APP_STATE.currentView =
    "resources";

  APP_STATE.searchQuery =
    "";

  APP_STATE.searchResults =
    null;

  refreshApplication();

}


function showSearch(query = "") {

  APP_STATE.currentView =
    "search";

  APP_STATE.searchQuery =
    query.trim();

  APP_STATE.searchResults =
    query.trim()
      ? performSearch(query)
      : null;

  refreshApplication();

}


function refreshApplication() {

  renderApplication();

  setupKineticScroll();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ============================================================
   RESOURCE OPENING
   ============================================================ */

function openResource(filePath) {

  if (!filePath) {

    console.error(
      "Resource file path is missing."
    );

    return;

  }


  /*
   * Open the resource in a new browser tab.
   */

  window.open(
    filePath,
    "_blank",
    "noopener,noreferrer"
  );

}


/* ============================================================
   EVENT LISTENERS
   ============================================================ */

function attachEventListeners() {


  /*
   * NAVIGATION ITEMS
   */

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const view =
            button.dataset.view;


          if (view === "courses") {
            showCourses();
          }

          else if (view === "resources") {
            showResources();
          }

          else if (view === "search") {
            showSearch();
          }

        }
      );

    });


  /*
   * COURSE CARDS
   */

  document
    .querySelectorAll(".course-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          showCourse(
            card.dataset.courseId
          );

        }
      );

    });


  /*
   * CHAPTER CARDS
   */

  document
    .querySelectorAll(".chapter-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          showChapter(
            card.dataset.chapterId
          );

        }
      );

    });


  /*
   * RESOURCE OPEN BUTTONS
   */

  document
    .querySelectorAll(".resource-open-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          openResource(
            button.dataset.resourcePath
          );

        }
      );

    });


  /*
   * RESOURCE FILTERS
   */

  document
    .querySelectorAll(".filter-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          filterResources(
            button.dataset.resourceFilter
          );

        }
      );

    });


  /*
   * BACK TO COURSES
   */

  const backToCourses =
    document.getElementById(
      "back-to-courses"
    );


  if (backToCourses) {

    backToCourses.addEventListener(
      "click",
      showCourses
    );

  }


  /*
   * BACK TO COURSE
   */

  const backToCourse =
    document.getElementById(
      "back-to-course"
    );


  if (backToCourse) {

    backToCourse.addEventListener(
      "click",
      () => {

        const course =
          typeof getCourseByChapterId === "function"
            ? getCourseByChapterId(
                APP_STATE.selectedChapterId
              )
            : null;


        if (course) {

          showCourse(course.id);

        } else {

          showCourses();

        }

      }
    );

  }


  /*
   * HOME BUTTON
   */

  const homeBtn =
    document.getElementById(
      "home-btn"
    );


  if (homeBtn) {

    homeBtn.addEventListener(
      "click",
      showCourses
    );

  }


  /*
   * SEARCH FOCUS BUTTON
   */

  const searchFocusBtn =
    document.getElementById(
      "search-focus-btn"
    );


  if (searchFocusBtn) {

    searchFocusBtn.addEventListener(
      "click",
      () => showSearch()
    );

  }


  /*
   * MAIN SEARCH
   */

  const searchButton =
    document.getElementById(
      "main-search-btn"
    );


  const searchInput =
    document.getElementById(
      "main-search-input"
    );


  if (searchButton && searchInput) {

    searchButton.addEventListener(
      "click",
      () => {

        showSearch(
          searchInput.value
        );

      }
    );


    searchInput.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {

          showSearch(
            searchInput.value
          );

        }

      }
    );

  }


  /*
   * SEARCH EXAMPLES
   */

  document
    .querySelectorAll(
      "[data-search-example]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showSearch(
            button.dataset.searchExample
          );

        }
      );

    });


  /*
   * SEARCH RESULT COURSES
   */

  document
    .querySelectorAll(
      '[data-search-result-type="course"]'
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          showCourse(
            card.dataset.courseId
          );

        }
      );

    });


  /*
   * SEARCH RESULT CHAPTERS
   */

  document
    .querySelectorAll(
      '[data-search-result-type="chapter"]'
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          showChapter(
            card.dataset.chapterId
          );

        }
      );

    });


  /*
   * SEARCH RESULT RESOURCES
   */

  document
    .querySelectorAll(
      '[data-search-result-type="resource"]'
    )
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          openResource(
            card.dataset.resourcePath
          );

        }
      );

    });


  /*
   * MOBILE MENU
   */

  const mobileMenuBtn =
    document.getElementById(
      "mobile-menu-btn"
    );


  const sidebar =
    document.getElementById(
      "sidebar"
    );


  if (mobileMenuBtn && sidebar) {

    mobileMenuBtn.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );

      }
    );

  }

}


/* ============================================================
   RESOURCE FILTERING
   ============================================================ */

function filterResources(filter) {

  const cards =
    document.querySelectorAll(
      "#all-resource-grid .resource-card"
    );


  const buttons =
    document.querySelectorAll(
      ".filter-btn"
    );


  buttons.forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.resourceFilter === filter
    );

  });


  cards.forEach(card => {

    const type =
      card.dataset.resourceType;


    const collection =
      card.dataset.resourceCollection;


    const isCollectionFilter =
      filter.startsWith("collection:");


    const selectedCollection =
      isCollectionFilter
        ? filter.replace("collection:", "")
        : "";


    if (
      filter === "all" ||
      (isCollectionFilter && collection === selectedCollection) ||
      (!isCollectionFilter && type === filter)
    ) {

      card.style.display = "";

    } else {

      card.style.display = "none";

    }

  });

}


/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    /*
     * "/" → Search
     */

    if (
      event.key === "/" &&
      !isTypingInField(event)
    ) {

      event.preventDefault();

      showSearch();

    }


    /*
     * Escape → Courses
     */

    if (
      event.key === "Escape" &&
      !isTypingInField(event)
    ) {

      showCourses();

    }

  }
);


function isTypingInField(event) {

  const target =
    event.target;


  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );

}


/* ============================================================
   START APPLICATION
   ============================================================ */

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();

}
