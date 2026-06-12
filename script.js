const SHEET_ID = "1AYI24EdCHO-z48AWYVVeRE7cf2m-RT2bNlJJPNwiTvI";
const MAIN_SHEET_NAME = "Ivan Carluer";
const WORSHIP_SHEET_NAME = "louanges et adorations";
const MAIN_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:handleMainSheet&sheet=${encodeURIComponent(MAIN_SHEET_NAME)}`;
const WORSHIP_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:handleWorshipSheet&sheet=${encodeURIComponent(WORSHIP_SHEET_NAME)}`;

const fallbackVideos = [
  {
    titre: "Ce qui détruit tes plus belles relations - Ivan Carluer",
    tag: "Célébration",
    url: "https://www.youtube.com/watch?v=OIy3_NA8ZWY",
    miniature: "https://i.ytimg.com/vi/OIy3_NA8ZWY/maxresdefault.jpg",
    date: "2026-05-17T08:00:06Z",
    description:
      "MLK Chez Vous. Célébration du dimanche 17 mai 2026. Titre : INTOX : Ce qui détruit tes plus belles relations.",
  },
];

const mainVideo = document.querySelector("#mainVideo");
const featureTitle = document.querySelector("#featureTitle");
const featureDescription = document.querySelector("#featureDescription");
const contentLabel = document.querySelector("#contentLabel");
const featureMeta = document.querySelector("#featureMeta");
const choicePanel = document.querySelector("#choicePanel");
const celebrationPanel = document.querySelector("#celebrationPanel");
const allPanel = document.querySelector("#allPanel");
const prayerPanel = document.querySelector("#prayerPanel");
const worshipPanel = document.querySelector("#worshipPanel");
const celebrationBrowseGrid = document.querySelector("#celebrationBrowseGrid");
const allVideosGrid = document.querySelector("#allVideosGrid");
const prayerBrowseGrid = document.querySelector("#prayerBrowseGrid");
const worshipBrowseGrid = document.querySelector("#worshipBrowseGrid");
const celebrationSearch = document.querySelector("#celebrationSearch");
const allSearch = document.querySelector("#allSearch");
const prayerSearch = document.querySelector("#prayerSearch");
const worshipSearch = document.querySelector("#worshipSearch");
const navButtons = [...document.querySelectorAll(".nav-pill")];
const choiceButtons = [...document.querySelectorAll(".choice-button")];
const showAllButtons = [...document.querySelectorAll(".show-all-button")];
const syncStatus = document.querySelector("#syncStatus");
const sermonSubject = document.querySelector("#sermonSubject");
const callPrayerButton = document.querySelector("#callPrayerButton");
const callPopover = document.querySelector("#callPopover");
const callClose = document.querySelector("#callClose");

let allVideos = [];
let celebrationVideos = [];
let prayerVideos = [];
let worshipVideos = [];
let currentVideo = null;
const expandedLists = {
  celebration: false,
  prayer: false,
  worship: false,
};

function cellValue(cell) {
  if (!cell) return "";
  if (cell.f !== undefined && cell.f !== null) return cell.f;
  if (cell.v !== undefined && cell.v !== null) return cell.v;
  return "";
}

function normalizeKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rowsFromGoogleResponse(response) {
  const rows = response.table && response.table.rows ? response.table.rows : [];
  if (!rows.length) return [];

  const headers = rows[0].c.map((cell) => normalizeKey(cellValue(cell)));

  return rows
    .slice(1)
    .map((row) => {
      const values = {};
      headers.forEach((header, index) => {
        values[header] = cellValue(row.c[index]);
      });

      return {
        titre: values.titre,
        tag: values.tag,
        url: values.url,
        watch: values.watch || values["watch url"] || values.watchurl,
        embed: values.embed || values["embed url"] || values.embedurl,
        miniature: values.miniature,
        date: values.date,
        description: values.description,
      };
    })
    .filter((video) => video.titre && video.url);
}

function getYouTubeId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }

    if (parsed.pathname.includes("/shorts/")) {
      const shortsPart = parsed.pathname.split("/shorts/")[1];
      return shortsPart ? shortsPart.split("/")[0] : "";
    }

    if (parsed.pathname.includes("/embed/")) {
      const embedPart = parsed.pathname.split("/embed/")[1];
      return embedPart ? embedPart.split("/")[0] : "";
    }

    return parsed.searchParams.get("v");
  } catch (error) {
    return "";
  }
}

function formatDate(value) {
  if (!value) return "Date à venir";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/#\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function videoEmbedUrl(url) {
  const id = getYouTubeId(url);
  if (!id) return "";

  return `https://www.youtube.com/embed/${id}`;
}

function speakerFromTitle(title) {
  const parts = String(title || "").split(" - ");
  const possibleSpeaker = parts[parts.length - 1] ? parts[parts.length - 1].trim() : "";

  return possibleSpeaker || "MLK";
}

function subjectFromTitle(title) {
  const parts = String(title || "").split(" - ");
  if (parts.length < 2) return title;

  return parts.slice(0, -1).join(" - ").trim();
}

function dateTime(video) {
  const time = new Date(video.date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function byNewestDate(first, second) {
  return dateTime(second) - dateTime(first);
}

function selectVideo(video, index, videos) {
  const embedUrl = videoEmbedUrl(video.watch || video.url) || video.embed;
  const description = cleanDescription(video.description);
  const speaker = speakerFromTitle(video.titre);
  const subject = subjectFromTitle(video.titre);

  currentVideo = video;
  mainVideo.removeAttribute("src");
  setTimeout(() => {
    if (embedUrl) {
      mainVideo.src = embedUrl;
    }
  }, 50);
  featureTitle.textContent =
    index === 0 ? `Le dernier message du pasteur ${speaker}` : `Message du pasteur ${speaker}`;
  const prefix = document.createElement("span");
  prefix.className = "sermon-prefix";
  prefix.textContent = "Titre du message :";

  const title = document.createElement("span");
  title.className = "sermon-title";
  title.textContent = subject || video.titre;

  sermonSubject.replaceChildren(prefix, title);
  featureDescription.textContent =
    description || "Une prédication à écouter dans un espace simple, calme et sans distraction.";
  contentLabel.textContent = index === 0 ? "Dernière prédication" : "Prédication sélectionnée";

  featureMeta.replaceChildren();

  [...document.querySelectorAll(".content-card")].forEach((card) => {
    card.classList.toggle("active", Number(card.dataset.index) === index);
  });

  syncStatus.textContent = index === 0 ? "Dernière vidéo synchronisée" : "Vidéo sélectionnée";
  document.querySelector(".sermon-stage").scrollIntoView({ behavior: "smooth", block: "start" });
}

function createVideoCard(video, index, videos) {
  const card = document.createElement("button");
  card.className = "content-card";
  card.type = "button";
  card.dataset.index = String(index);

  const poster = document.createElement("span");
  poster.className = "poster";
  if (video.miniature) {
    poster.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,0), rgba(16,17,20,0.08)), url("${video.miniature}")`;
  }

  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = subjectFromTitle(video.titre);

  card.append(poster, title);
  card.addEventListener("click", () => selectVideo(videos[index], index, videos));

  return card;
}

function renderGrid(grid, videos, sourceVideos, limit) {
  if (!videos.length) {
    const empty = document.createElement("div");
    empty.className = "empty-library";
    empty.textContent = "Aucune vidéo trouvée pour le moment.";
    grid.replaceChildren(empty);
    return;
  }

  const visibleVideos = limit ? videos.slice(0, limit) : videos;

  grid.replaceChildren(
    ...visibleVideos.map((video) => {
      const index = sourceVideos.indexOf(video);
      return createVideoCard(video, index, sourceVideos);
    }),
  );
}

function updateShowAllButton(listKey, total, visibleCount, isExpanded) {
  const button = showAllButtons.find((item) => item.dataset.list === listKey);
  if (!button) return;

  const shouldHide = total <= visibleCount;
  button.hidden = shouldHide;
  button.textContent = isExpanded ? "Voir moins" : "Voir tout";
}

function filterVideos(videos, query) {
  const normalizedQuery = normalizeKey(query);
  if (!normalizedQuery) return videos;

  return videos.filter((video) => {
    const text = normalizeKey(`${video.titre} ${video.tag} ${video.description}`);
    return text.includes(normalizedQuery);
  });
}

function showView(view) {
  const isHome = view === "home";

  choicePanel.hidden = !isHome;
  celebrationPanel.hidden = view !== "celebration";
  allPanel.hidden = view !== "all";
  prayerPanel.hidden = view !== "prayer";
  worshipPanel.hidden = view !== "worship";

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  if (!isHome) {
    document.querySelector(`#${view}Panel`).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function playNextFrom(view) {
  const videosByView = {
    celebration: celebrationVideos,
    prayer: prayerVideos,
    worship: worshipVideos,
  };
  const sourceByView = {
    celebration: allVideos,
    prayer: allVideos,
    worship: worshipVideos,
  };
  const videos = videosByView[view] || [];
  const sourceVideos = sourceByView[view] || videos;

  if (!videos.length) {
    showView(view);
    return;
  }

  const currentIndex = videos.indexOf(currentVideo);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % videos.length : 0;
  const nextVideo = videos[nextIndex];

  selectVideo(nextVideo, sourceVideos.indexOf(nextVideo), sourceVideos);
  showView("home");
}

function renderSearchableViews() {
  const celebrationResults = filterVideos(celebrationVideos, celebrationSearch.value);
  const prayerResults = filterVideos(prayerVideos, prayerSearch.value);
  const worshipResults = filterVideos(worshipVideos, worshipSearch.value);
  const defaultLimit = 2;

  renderGrid(
    celebrationBrowseGrid,
    celebrationResults,
    allVideos,
    expandedLists.celebration || celebrationSearch.value ? 0 : defaultLimit,
  );
  renderGrid(allVideosGrid, filterVideos(allVideos, allSearch.value), allVideos, 12);
  renderGrid(
    prayerBrowseGrid,
    prayerResults,
    allVideos,
    expandedLists.prayer || prayerSearch.value ? 0 : defaultLimit,
  );
  renderGrid(
    worshipBrowseGrid,
    worshipResults,
    worshipVideos,
    expandedLists.worship || worshipSearch.value ? 0 : defaultLimit,
  );

  updateShowAllButton("celebration", celebrationResults.length, defaultLimit, expandedLists.celebration);
  updateShowAllButton("prayer", prayerResults.length, defaultLimit, expandedLists.prayer);
  updateShowAllButton("worship", worshipResults.length, defaultLimit, expandedLists.worship);
}

function renderMainVideos(videos) {
  const orderedVideos = [...videos].sort(byNewestDate);
  const otherVideos = orderedVideos.slice(1);
  allVideos = orderedVideos;
  celebrationVideos = orderedVideos
    .filter((video) => normalizeKey(video.tag) === "celebration")
    .sort(byNewestDate);
  prayerVideos = orderedVideos.filter((video) => {
    return normalizeKey(video.tag) === "priere";
  }).sort(byNewestDate);

  selectVideo(orderedVideos[0], 0, orderedVideos);
  renderSearchableViews();
}

function renderWorshipVideos(videos) {
  worshipVideos = [...videos].sort(byNewestDate);
  renderSearchableViews();
}

function loadSheet() {
  window.handleMainSheet = (response) => {
    const videos = rowsFromGoogleResponse(response);
    renderMainVideos(videos.length ? videos : fallbackVideos);
  };

  window.handleWorshipSheet = (response) => {
    const videos = rowsFromGoogleResponse(response);
    renderWorshipVideos(videos);
  };

  const mainScript = document.createElement("script");
  mainScript.src = MAIN_SHEET_URL;
  mainScript.onerror = () => {
    syncStatus.textContent = "Feuille Ivan Carluer indisponible";
    renderMainVideos(fallbackVideos);
  };

  const worshipScript = document.createElement("script");
  worshipScript.src = WORSHIP_SHEET_URL;
  worshipScript.onerror = () => {
    renderWorshipVideos([]);
  };

  document.head.append(mainScript, worshipScript);
}

loadSheet();

callPrayerButton.addEventListener("click", () => {
  callPopover.hidden = false;
});

callClose.addEventListener("click", () => {
  callPopover.hidden = true;
});

callPopover.addEventListener("click", (event) => {
  if (event.target === callPopover) {
    callPopover.hidden = true;
  }
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "celebration") {
      playNextFrom("celebration");
      return;
    }

    showView(button.dataset.view);
  });
});

[celebrationSearch, allSearch, prayerSearch, worshipSearch].forEach((input) => {
  input.addEventListener("input", renderSearchableViews);
});

showAllButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const listKey = button.dataset.list;
    expandedLists[listKey] = !expandedLists[listKey];
    renderSearchableViews();
  });
});
