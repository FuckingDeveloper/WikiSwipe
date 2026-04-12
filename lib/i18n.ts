export type AppLanguage = "en" | "ru" | "de" | "fr" | "zh" | "es";

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "zh", label: "中文" },
  { value: "es", label: "Español" }
];

export interface UICopy {
  heroTitle: string;
  homeSubtitle: string;
  leaderboardSubtitle: string;
  languageLabel: string;
  actionLeaderboard: string;
  actionBackToSwipe: string;
  mobileNavHome: string;
  mobileNavLeaderboard: string;
  mobileNavAria: string;
  mobileTimerToggleAria: string;
  timerAria: string;
  readingLock: string;
  unlocksAfter: (seconds: number) => string;
  voteNo: string;
  voteYes: string;
  swipeLeft: string;
  swipeRight: string;
  voteLocked: string;
  voteSaving: string;
  voteUnlocked: string;
  votingControlsAria: string;
  swipeStatus: string;
  swipeStatusLocked: string;
  swipeStatusUnlocked: string;
  machineTranslatedBadge: string;
  openWikipedia: string;
  noImage: string;
  noArticleTitle: string;
  noArticleDescription: string;
  articleLoading: string;
  articleTranslating: string;
  retry: string;
  articleLoadError: string;
  articleTranslateError: string;
  voteError: string;
  leaderboardTitle: string;
  leaderboardLoading: string;
  leaderboardLoadError: string;
  noVotesTitle: string;
  noVotesDescription: string;
  paginationPrevious: string;
  paginationNext: string;
  paginationStatus: (page: number, totalPages: number) => string;
  likes: string;
  dislikes: string;
  score: string;
  viewSource: string;
  articleCardAriaPrefix: string;
}

export const UI_COPY: Record<AppLanguage, UICopy> = {
  en: {
    heroTitle: "Discover Wikipedia with intention",
    homeSubtitle: "Read each random article before voting. Great discoveries deserve focus.",
    leaderboardSubtitle: "Community picks, ranked by score.",
    languageLabel: "Language",
    actionLeaderboard: "Leaderboard",
    actionBackToSwipe: "Back to Swipe",
    mobileNavHome: "Discover",
    mobileNavLeaderboard: "Ranking",
    mobileNavAria: "Main navigation",
    mobileTimerToggleAria: "Show or hide timer details",
    timerAria: "Reading timer progress",
    readingLock: "Reading Lock",
    unlocksAfter: (seconds) => `Unlocks after ${seconds}s`,
    voteNo: "No",
    voteYes: "Yes",
    swipeLeft: "Swipe left",
    swipeRight: "Swipe right",
    voteLocked: "Voting unlocks when the reading timer reaches zero.",
    voteSaving: "Saving your vote...",
    voteUnlocked: "Voting is unlocked. Swipe or tap a button.",
    votingControlsAria: "Voting controls",
    swipeStatus: "Swipe Status",
    swipeStatusLocked: "Locked while reading timer is active.",
    swipeStatusUnlocked: "Unlocked: drag card left or right.",
    machineTranslatedBadge: "Machine translated",
    openWikipedia: "Open on Wikipedia",
    noImage: "Image unavailable",
    noArticleTitle: "No article available",
    noArticleDescription: "Wikipedia returned low-quality content. Try another draw.",
    articleLoading: "Loading article...",
    articleTranslating: "Translating article...",
    retry: "Retry",
    articleLoadError: "Could not load an article.",
    articleTranslateError: "Could not translate the current article.",
    voteError: "Vote could not be saved.",
    leaderboardTitle: "Top Articles",
    leaderboardLoading: "Loading leaderboard...",
    leaderboardLoadError: "Could not load leaderboard.",
    noVotesTitle: "No votes yet",
    noVotesDescription: "Be the first to swipe and shape the ranking.",
    paginationPrevious: "Previous",
    paginationNext: "Next",
    paginationStatus: (page, totalPages) => `Page ${page} of ${totalPages}`,
    likes: "Likes",
    dislikes: "Dislikes",
    score: "Score",
    viewSource: "View source",
    articleCardAriaPrefix: "Wikipedia article card"
  },
  ru: {
    heroTitle: "Открывайте Википедию осознанно",
    homeSubtitle: "Сначала прочитайте случайную статью, потом голосуйте.",
    leaderboardSubtitle: "Выбор сообщества, отсортированный по рейтингу.",
    languageLabel: "Язык",
    actionLeaderboard: "Рейтинг",
    actionBackToSwipe: "Назад к свайпам",
    mobileNavHome: "Лента",
    mobileNavLeaderboard: "Топ",
    mobileNavAria: "Основная навигация",
    mobileTimerToggleAria: "Показать или скрыть детали таймера",
    timerAria: "Прогресс таймера чтения",
    readingLock: "Таймер чтения",
    unlocksAfter: (seconds) => `Разблокируется через ${seconds}с`,
    voteNo: "Нет",
    voteYes: "Да",
    swipeLeft: "Свайп влево",
    swipeRight: "Свайп вправо",
    voteLocked: "Голосование откроется, когда таймер дойдет до нуля.",
    voteSaving: "Сохраняем ваш голос...",
    voteUnlocked: "Голосование открыто. Свайпните или нажмите кнопку.",
    votingControlsAria: "Управление голосованием",
    swipeStatus: "Статус свайпа",
    swipeStatusLocked: "Заблокировано, пока активен таймер чтения.",
    swipeStatusUnlocked: "Разблокировано: тяните карточку влево или вправо.",
    machineTranslatedBadge: "Машинный перевод",
    openWikipedia: "Открыть в Википедии",
    noImage: "Изображение недоступно",
    noArticleTitle: "Статья недоступна",
    noArticleDescription: "Википедия вернула некачественный материал. Попробуйте еще раз.",
    articleLoading: "Загружаем статью...",
    articleTranslating: "Переводим статью...",
    retry: "Повторить",
    articleLoadError: "Не удалось загрузить статью.",
    articleTranslateError: "Не удалось перевести текущую статью.",
    voteError: "Не удалось сохранить голос.",
    leaderboardTitle: "Топ статей",
    leaderboardLoading: "Загружаем рейтинг...",
    leaderboardLoadError: "Не удалось загрузить рейтинг.",
    noVotesTitle: "Пока нет голосов",
    noVotesDescription: "Станьте первым, кто повлияет на рейтинг.",
    paginationPrevious: "Назад",
    paginationNext: "Далее",
    paginationStatus: (page, totalPages) => `Страница ${page} из ${totalPages}`,
    likes: "Лайки",
    dislikes: "Дизлайки",
    score: "Счет",
    viewSource: "Открыть источник",
    articleCardAriaPrefix: "Карточка статьи Википедии"
  },
  de: {
    heroTitle: "Wikipedia bewusst entdecken",
    homeSubtitle: "Lies jeden Zufallsartikel zuerst und stimme dann ab.",
    leaderboardSubtitle: "Community-Favoriten nach Score sortiert.",
    languageLabel: "Sprache",
    actionLeaderboard: "Bestenliste",
    actionBackToSwipe: "Zurück zum Swipe",
    mobileNavHome: "Feed",
    mobileNavLeaderboard: "Topliste",
    mobileNavAria: "Hauptnavigation",
    mobileTimerToggleAria: "Timer-Details ein- oder ausblenden",
    timerAria: "Fortschritt des Lesetimers",
    readingLock: "Lese-Sperre",
    unlocksAfter: (seconds) => `Freigabe nach ${seconds}s`,
    voteNo: "Nein",
    voteYes: "Ja",
    swipeLeft: "Nach links wischen",
    swipeRight: "Nach rechts wischen",
    voteLocked: "Abstimmen wird freigeschaltet, wenn der Timer null erreicht.",
    voteSaving: "Deine Stimme wird gespeichert...",
    voteUnlocked: "Abstimmung ist frei. Wische oder tippe eine Taste.",
    votingControlsAria: "Abstimmungssteuerung",
    swipeStatus: "Swipe-Status",
    swipeStatusLocked: "Gesperrt, solange der Lesetimer aktiv ist.",
    swipeStatusUnlocked: "Freigegeben: Karte nach links oder rechts ziehen.",
    machineTranslatedBadge: "Maschinelle Übersetzung",
    openWikipedia: "In Wikipedia öffnen",
    noImage: "Bild nicht verfügbar",
    noArticleTitle: "Kein Artikel verfügbar",
    noArticleDescription: "Wikipedia hat ungeeigneten Inhalt geliefert. Bitte erneut versuchen.",
    articleLoading: "Artikel wird geladen...",
    articleTranslating: "Artikel wird übersetzt...",
    retry: "Erneut",
    articleLoadError: "Artikel konnte nicht geladen werden.",
    articleTranslateError: "Aktueller Artikel konnte nicht übersetzt werden.",
    voteError: "Stimme konnte nicht gespeichert werden.",
    leaderboardTitle: "Top-Artikel",
    leaderboardLoading: "Bestenliste wird geladen...",
    leaderboardLoadError: "Bestenliste konnte nicht geladen werden.",
    noVotesTitle: "Noch keine Stimmen",
    noVotesDescription: "Sei der Erste und beeinflusse das Ranking.",
    paginationPrevious: "Zurück",
    paginationNext: "Weiter",
    paginationStatus: (page, totalPages) => `Seite ${page} von ${totalPages}`,
    likes: "Likes",
    dislikes: "Dislikes",
    score: "Score",
    viewSource: "Quelle öffnen",
    articleCardAriaPrefix: "Wikipedia-Artikelkarte"
  },
  fr: {
    heroTitle: "Découvrir Wikipédia avec intention",
    homeSubtitle: "Lisez chaque article aléatoire avant de voter.",
    leaderboardSubtitle: "Classement communautaire par score.",
    languageLabel: "Langue",
    actionLeaderboard: "Classement",
    actionBackToSwipe: "Retour au Swipe",
    mobileNavHome: "Flux",
    mobileNavLeaderboard: "Top",
    mobileNavAria: "Navigation principale",
    mobileTimerToggleAria: "Afficher ou masquer les détails du minuteur",
    timerAria: "Progression du minuteur de lecture",
    readingLock: "Verrou de lecture",
    unlocksAfter: (seconds) => `Déverrouillage après ${seconds}s`,
    voteNo: "Non",
    voteYes: "Oui",
    swipeLeft: "Glisser à gauche",
    swipeRight: "Glisser à droite",
    voteLocked: "Le vote sera disponible quand le minuteur atteindra zéro.",
    voteSaving: "Enregistrement de votre vote...",
    voteUnlocked: "Vote débloqué. Glissez ou appuyez sur un bouton.",
    votingControlsAria: "Commandes de vote",
    swipeStatus: "Statut du swipe",
    swipeStatusLocked: "Verrouillé tant que le minuteur est actif.",
    swipeStatusUnlocked: "Déverrouillé : glissez la carte à gauche ou à droite.",
    machineTranslatedBadge: "Traduction automatique",
    openWikipedia: "Ouvrir sur Wikipédia",
    noImage: "Image indisponible",
    noArticleTitle: "Aucun article disponible",
    noArticleDescription: "Wikipédia a renvoyé un contenu insuffisant. Réessayez.",
    articleLoading: "Chargement de l'article...",
    articleTranslating: "Traduction de l'article...",
    retry: "Réessayer",
    articleLoadError: "Impossible de charger un article.",
    articleTranslateError: "Impossible de traduire l'article actuel.",
    voteError: "Impossible d'enregistrer le vote.",
    leaderboardTitle: "Meilleurs articles",
    leaderboardLoading: "Chargement du classement...",
    leaderboardLoadError: "Impossible de charger le classement.",
    noVotesTitle: "Aucun vote pour l'instant",
    noVotesDescription: "Soyez le premier à faire évoluer le classement.",
    paginationPrevious: "Précédent",
    paginationNext: "Suivant",
    paginationStatus: (page, totalPages) => `Page ${page} sur ${totalPages}`,
    likes: "Likes",
    dislikes: "Dislikes",
    score: "Score",
    viewSource: "Voir la source",
    articleCardAriaPrefix: "Carte d'article Wikipédia"
  },
  zh: {
    heroTitle: "有意识地探索维基百科",
    homeSubtitle: "先阅读随机词条，再进行投票。",
    leaderboardSubtitle: "按得分排序的社区排行榜。",
    languageLabel: "语言",
    actionLeaderboard: "排行榜",
    actionBackToSwipe: "返回滑动",
    mobileNavHome: "发现",
    mobileNavLeaderboard: "榜单",
    mobileNavAria: "主导航",
    mobileTimerToggleAria: "显示或隐藏计时详情",
    timerAria: "阅读计时进度",
    readingLock: "阅读锁定",
    unlocksAfter: (seconds) => `${seconds}秒后解锁`,
    voteNo: "否",
    voteYes: "是",
    swipeLeft: "左滑",
    swipeRight: "右滑",
    voteLocked: "计时结束后才可投票。",
    voteSaving: "正在保存你的投票...",
    voteUnlocked: "已解锁，可滑动或点击按钮投票。",
    votingControlsAria: "投票控件",
    swipeStatus: "滑动状态",
    swipeStatusLocked: "阅读计时进行中，暂不可投票。",
    swipeStatusUnlocked: "已解锁：向左或向右拖动卡片。",
    machineTranslatedBadge: "机器翻译",
    openWikipedia: "在维基百科中打开",
    noImage: "暂无图片",
    noArticleTitle: "暂无可用词条",
    noArticleDescription: "维基百科返回了低质量内容，请重试。",
    articleLoading: "正在加载词条...",
    articleTranslating: "正在翻译词条...",
    retry: "重试",
    articleLoadError: "加载词条失败。",
    articleTranslateError: "当前词条翻译失败。",
    voteError: "保存投票失败。",
    leaderboardTitle: "热门词条",
    leaderboardLoading: "正在加载排行榜...",
    leaderboardLoadError: "加载排行榜失败。",
    noVotesTitle: "暂无投票",
    noVotesDescription: "成为第一个投票并影响排行榜的人。",
    paginationPrevious: "上一页",
    paginationNext: "下一页",
    paginationStatus: (page, totalPages) => `第 ${page} / ${totalPages} 页`,
    likes: "喜欢",
    dislikes: "不喜欢",
    score: "得分",
    viewSource: "查看来源",
    articleCardAriaPrefix: "维基百科词条卡片"
  },
  es: {
    heroTitle: "Descubre Wikipedia con intención",
    homeSubtitle: "Lee cada artículo aleatorio antes de votar.",
    leaderboardSubtitle: "Selecciones de la comunidad ordenadas por puntuación.",
    languageLabel: "Idioma",
    actionLeaderboard: "Ranking",
    actionBackToSwipe: "Volver a Swipe",
    mobileNavHome: "Descubrir",
    mobileNavLeaderboard: "Top",
    mobileNavAria: "Navegación principal",
    mobileTimerToggleAria: "Mostrar u ocultar detalles del temporizador",
    timerAria: "Progreso del temporizador de lectura",
    readingLock: "Bloqueo de lectura",
    unlocksAfter: (seconds) => `Se desbloquea después de ${seconds}s`,
    voteNo: "No",
    voteYes: "Sí",
    swipeLeft: "Desliza a la izquierda",
    swipeRight: "Desliza a la derecha",
    voteLocked: "La votación se desbloquea cuando el temporizador llega a cero.",
    voteSaving: "Guardando tu voto...",
    voteUnlocked: "Votación desbloqueada. Desliza o toca un botón.",
    votingControlsAria: "Controles de votación",
    swipeStatus: "Estado del swipe",
    swipeStatusLocked: "Bloqueado mientras el temporizador de lectura está activo.",
    swipeStatusUnlocked: "Desbloqueado: arrastra la tarjeta a izquierda o derecha.",
    machineTranslatedBadge: "Traducción automática",
    openWikipedia: "Abrir en Wikipedia",
    noImage: "Imagen no disponible",
    noArticleTitle: "Artículo no disponible",
    noArticleDescription: "Wikipedia devolvió contenido de baja calidad. Inténtalo de nuevo.",
    articleLoading: "Cargando artículo...",
    articleTranslating: "Traduciendo artículo...",
    retry: "Reintentar",
    articleLoadError: "No se pudo cargar el artículo.",
    articleTranslateError: "No se pudo traducir el artículo actual.",
    voteError: "No se pudo guardar el voto.",
    leaderboardTitle: "Mejores artículos",
    leaderboardLoading: "Cargando ranking...",
    leaderboardLoadError: "No se pudo cargar el ranking.",
    noVotesTitle: "Aún no hay votos",
    noVotesDescription: "Sé el primero en votar y dar forma al ranking.",
    paginationPrevious: "Anterior",
    paginationNext: "Siguiente",
    paginationStatus: (page, totalPages) => `Página ${page} de ${totalPages}`,
    likes: "Likes",
    dislikes: "Dislikes",
    score: "Puntuación",
    viewSource: "Ver fuente",
    articleCardAriaPrefix: "Tarjeta de artículo de Wikipedia"
  }
};

export function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return (
    value === "en" ||
    value === "ru" ||
    value === "de" ||
    value === "fr" ||
    value === "zh" ||
    value === "es"
  );
}
