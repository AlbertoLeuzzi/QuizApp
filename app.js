// Prepariamoci Pupa - Logica JavaScript aggiornata per i tuoi JSON

const subjectMap = {
  "diritto_amministrativo": "📋 Diritto Amministrativo",
  "enti_locali": "🏛️ Enti Locali",
  "servizio_sociale": "🤝 Servizio Sociale",
  "deontologia": "⚖️ Deontologia",
  "trasparenza_anticorruzione": "🔍 Trasparenza e Anticorruzione",
  "regione_puglia": "🌍 Regione Puglia",
  "pubblico_impiego": "💼 Lavoro Pubblico",
  "diritto_penale": "👨‍⚖️ Diritto Penale",
  "dati_personali": "🔐 Dati Personali",
  "inglese": "🇬🇧 Inglese",
  "informatica": "💻 Informatica"
};

let allQuestions = {};
let currentQuiz = [];
let currentIndex = 0;
let currentSubject = "";
let score = 0;
let wrongAnswers = [];
let timer = null;
let timeLeft = 2700;
let isEsame = false;

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function loadAllJSON() {
  const subjects = Object.keys(subjectMap);
  let loaded = 0;
  subjects.forEach(subject => {
    fetch(`domande/${subject}.json`)
      .then(res => res.json())
      .then(data => {
        allQuestions[subject] = data;
        loaded++;
        if (loaded === subjects.length) createSubjectButtons();
      });
  });
}

function createSubjectButtons() {
  const container = document.getElementById("subject-buttons");
  container.innerHTML = "";
  Object.entries(subjectMap).forEach(([key, name]) => {
    const btn = document.createElement("button");
    btn.className = "subject-btn";
    btn.innerHTML = name;
    btn.onclick = () => {
      currentSubject = key;
      showPage("question-count");
    };
    container.appendChild(btn);
  });
}

function startQuizMateria(n) {
  isEsame = false;
  score = 0;
  wrongAnswers = [];
  currentQuiz = shuffle([...allQuestions[currentSubject]]).slice(0, n);
  currentIndex = 0;
  showPage("quiz");
  document.getElementById("timer").style.display = "none";
  displayQuestion();
}

function startQuizEsame() {
  isEsame = true;
  score = 0;
  wrongAnswers = [];
  currentQuiz = [];
  const schema = {
    "diritto_amministrativo": 4,
    "enti_locali": 5,
    "servizio_sociale": 6,
    "deontologia": 3,
    "trasparenza_anticorruzione": 2,
    "regione_puglia": 2,
    "pubblico_impiego": 3,
    "diritto_penale": 3,
    "dati_personali": 2
  };
  Object.entries(schema).forEach(([subject, count]) => {
    const questions = shuffle([...allQuestions[subject]]).slice(0, count);
    currentQuiz.push(...questions.map(q => ({ ...q, subject })));
  });
  currentQuiz = shuffle(currentQuiz);
  currentIndex = 0;
  const timerEnabled = document.getElementById("timer-enabled").checked;
  if (timerEnabled) {
    timeLeft = 2700;
    document.getElementById("timer").style.display = "block";
    startTimer();
  } else {
    document.getElementById("timer").style.display = "none";
  }
  showPage("quiz");
  displayQuestion();
}

function startTimer() {
  updateTimerDisplay();
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timer);
      endQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("time-display").textContent = `${m}:${s}`;
}

function displayQuestion() {
  const q = currentQuiz[currentIndex];
  if (!q || !q.options || typeof q.correctIndex !== "number") {
    console.error("Domanda malformata:", q);
    return;
  }
  document.getElementById("current-question").textContent = currentIndex + 1;
  document.getElementById("total-questions").textContent = currentQuiz.length;
  document.getElementById("question-text").textContent = q.question;
  const container = document.getElementById("answers");
  container.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(opt, btn);
    container.appendChild(btn);
  });
  document.getElementById("next-btn").style.display = "none";
}

function selectAnswer(opt, btn) {
  const q = currentQuiz[currentIndex];
  const buttons = document.querySelectorAll(".answer-btn");
  buttons.forEach(b => {
    b.style.pointerEvents = "none";
    if (b.textContent === q.options[q.correctIndex]) b.classList.add("correct");
    else if (b === btn) b.classList.add("incorrect");
  });
  if (opt === q.options[q.correctIndex]) score++;
  else wrongAnswers.push({ ...q, selected: opt });
  document.getElementById("next-btn").style.display = "block";
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex < currentQuiz.length) displayQuestion();
  else endQuiz();
}

function endQuiz() {
  if (timer) clearInterval(timer);
  const pct = Math.round((score / currentQuiz.length) * 100);
  const sd = document.getElementById("score-display");
  const st = document.getElementById("score-text");
  const se = document.getElementById("score-emoji");
  sd.textContent = `${score}/${currentQuiz.length}`;
  st.textContent = `${pct}%`;
  se.textContent = pct >= 80 ? "🏆 Eccellente!" : pct >= 60 ? "👍 Buon lavoro!" : "📖 Continua a studiare!";
  sd.className = `score ${pct >= 80 ? "good" : pct >= 60 ? "average" : "poor"}`;
  if (wrongAnswers.length > 0) {
    localStorage.setItem("errori", JSON.stringify(wrongAnswers));
    document.getElementById("study-wrong-btn").style.display = "inline-block";
  }
  saveStorico(pct);
  showPage("results");
}

function saveStorico(pct) {
  const now = new Date().toLocaleString();
  if (isEsame) {
    const errByMateria = {};
    wrongAnswers.forEach(q => {
      errByMateria[q.subject] = (errByMateria[q.subject] || 0) + 1;
    });
    const esame = JSON.parse(localStorage.getItem("storicoEsame") || "[]");
    esame.push({ data: now, punteggio: pct, errori: errByMateria });
    localStorage.setItem("storicoEsame", JSON.stringify(esame));
  } else {
    const storico = JSON.parse(localStorage.getItem("storicoMateria") || "{}");
    if (!storico[currentSubject]) storico[currentSubject] = [];
    storico[currentSubject].push({ data: now, punteggio: pct });
    localStorage.setItem("storicoMateria", JSON.stringify(storico));
  }
}

function showStudyMode() {
  const errors = JSON.parse(localStorage.getItem("errori") || "[]");
  const cont = document.getElementById("study-content");
  cont.innerHTML = "";
  if (errors.length === 0) {
    cont.innerHTML = "<p>🎉 Nessun errore da studiare!</p>";
  } else {
    errors.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "study-mode";
      div.innerHTML = `<h4>${i + 1}. ${q.question}</h4>
        <p><strong>Risposta corretta:</strong> ${q.options[q.correctIndex]}</p>
        <p><strong>Tua risposta:</strong> ${q.selected}</p>`;
      cont.appendChild(div);
    });
  }
  showPage("study");
}

function showStorico() {
  const sm = JSON.parse(localStorage.getItem("storicoMateria") || "{}");
  const se = JSON.parse(localStorage.getItem("storicoEsame") || "[]");
  const mDiv = document.getElementById("storico-materia");
  const eDiv = document.getElementById("storico-esame");
  mDiv.innerHTML = "<h3>📚 Risultati per Materia</h3>";
  for (const mat in sm) {
    const rows = sm[mat].map(r => `${r.data}: ${r.punteggio}%`).join("<br>");
    mDiv.innerHTML += `<p><strong>${subjectMap[mat]}:</strong><br>${rows}</p>`;
  }
  eDiv.innerHTML = "<h3>🎯 Risultati Quiz Esame</h3>";
  se.forEach(r => {
    const err = Object.entries(r.errori).map(([k, v]) => `${subjectMap[k]}: ${v}`).join(", ");
    eDiv.innerHTML += `<p><strong>${r.data}:</strong> ${r.punteggio}%<br>❌ Errori: ${err}</p>`;
  });
  
  const ctx = document.getElementById('grafico-materie').getContext('2d');
  const subjectNames = Object.keys(sm);
  const medie = subjectNames.map(sub => {
    const scores = sm[sub].map(r => r.punteggio);
    const media = scores.reduce((a,b) => a+b, 0) / scores.length;
    return Math.round(media);
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjectNames.map(k => subjectMap[k] || k),
      datasets: [{
        label: 'Media Punteggio %',
        data: medie,
        backgroundColor: medie.map(v => v < 60 ? '#dc3545' : v < 80 ? '#ffc107' : '#28a745')
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });

  showPage("storico");
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

document.addEventListener("DOMContentLoaded", () => {
  loadAllJSON();
  console.log("App caricata ✅");
});
