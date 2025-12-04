const app = {
    timerInterval: null,
    examTimeLeft: 0,

    // ნავიგაცია
    hideAllViews() {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    },

    showHome() {
        this.hideAllViews();
        document.getElementById('home-view').classList.add('active-view');
        document.getElementById('timer').style.display = "none";
        document.getElementById('exam-questions-container').innerHTML = '';
        document.getElementById('review-container').innerHTML = ''; 
        clearInterval(this.timerInterval);
        window.scrollTo(0,0);
    },

    // 1. სასწავლო რეჟიმი
    startStudyMode() {
        this.hideAllViews();
        document.getElementById('quiz-view').classList.add('active-view');
        window.scrollTo(0,0);

        const container = document.getElementById('questions-container');
        document.getElementById('quiz-header-info').innerHTML = `
            <div class="card" style="text-align:center; border-left: 5px solid var(--primary);">
                <h2 style="margin:0">📖 სასწავლო რეჟიმი</h2>
                <p>აქ მოცემულია ყველა კითხვა სწორი პასუხებით.</p>
            </div>
        `;
        document.getElementById('finish-btn').style.display = 'none';

        container.innerHTML = '';
        hvacData.questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = "question-card";
            let optionsHtml = '<ul class="options">';
            q.options.forEach((opt, i) => {
                const isCorrect = (i === q.correct);
                const liClass = isCorrect ? 'correct-static' : '';
                optionsHtml += `<li class="option-label ${liClass}" style="cursor:default">${isCorrect ? '✅ ' : ''}${String.fromCharCode(97 + i)}. ${opt}</li>`;
            });
            optionsHtml += '</ul>';
            card.innerHTML = `<div class="question-text">${q.q}</div>${optionsHtml}`;
            container.appendChild(card);
        });
    },

    // 2. საგამოცდო რეჟიმი
    startExamMode() {
        this.hideAllViews();
        document.getElementById('quiz-view').classList.add('active-view');
        document.getElementById('timer').style.display = "block";
        document.getElementById('finish-btn').style.display = 'inline-block';
        window.scrollTo(0,0);

        // ტესტის გასუფთავება
        document.getElementById('review-container').innerHTML = ''; 
        const container = document.getElementById('questions-container');
        document.getElementById('quiz-header-info').innerHTML = '';
        container.innerHTML = ''; 

        // 30 რენდომული კითხვა
        const shuffled = [...hvacData.questions].sort(() => 0.5 - Math.random());
        const examQuestions = shuffled.slice(0, 30);
        
        examQuestions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = "question-card";
            card.dataset.correct = q.correct; 

            let optionsHtml = '<ul class="options">';
            q.options.forEach((opt, i) => {
                optionsHtml += `<li><label class="option-label"><input type="radio" name="q${index}" value="${i}"><span>${String.fromCharCode(97 + i)}. ${opt}</span></label></li>`;
            });
            optionsHtml += '</ul>';
            card.innerHTML = `<div class="question-text">${index + 1}. ${q.q}</div>${optionsHtml}`;
            container.appendChild(card);
        });

        // ტაიმერი (30 წუთი)
        this.examTimeLeft = 30 * 60;
        this.updateTimerDisplay();
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.examTimeLeft--;
            this.updateTimerDisplay();
            if (this.examTimeLeft <= 0) this.finishExam();
        }, 1000);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.examTimeLeft / 60);
        const s = this.examTimeLeft % 60;
        document.getElementById('timer').innerText = `${m}:${s < 10 ? '0'+s : s}`;
    },

    finishExam() {
        clearInterval(this.timerInterval);
        let score = 0;
        const container = document.getElementById('questions-container');
        const cards = Array.from(container.getElementsByClassName('question-card'));
        const reviewContainer = document.getElementById('review-container');
        
        reviewContainer.innerHTML = ''; 

        cards.forEach((card, index) => {
            const correctIndex = parseInt(card.dataset.correct);
            const selectedInput = card.querySelector(`input[name="q${index}"]:checked`);
            const inputs = card.querySelectorAll('input');
            inputs.forEach(inp => inp.disabled = true);
            
            if (selectedInput) {
                const val = parseInt(selectedInput.value);
                const lbl = selectedInput.parentElement;
                if (val === correctIndex) {
                    score++;
                    lbl.classList.add('user-correct');
                } else {
                    lbl.classList.add('user-wrong');
                    // სწორი პასუხის მონიშვნა
                    card.querySelectorAll('.option-label')[correctIndex].classList.add('user-correct');
                }
            } else {
                 card.querySelectorAll('.option-label')[correctIndex].classList.add('user-correct');
            }
            reviewContainer.appendChild(card);
        });

        this.hideAllViews();
        document.getElementById('result-view').classList.add('active-view');
        document.getElementById('timer').style.display = "none";
        window.scrollTo(0,0);

        const scoreEl = document.getElementById('final-score');
        const textEl = document.getElementById('pass-fail-text');
        
        scoreEl.innerText = score;
        if (score >= 27) {
            textEl.innerText = "ჩაბარებულია! 🎉";
            textEl.style.color = "var(--success)";
            scoreEl.style.backgroundColor = "var(--success)";
        } else {
            textEl.innerText = "ვერ ჩაბარდა ❌";
            textEl.style.color = "var(--danger)";
            scoreEl.style.backgroundColor = "var(--danger)";
        }
    },

    // 3. ინფო რეჟიმი
    startInfoMode() {
        this.hideAllViews();
        document.getElementById('info-view').classList.add('active-view');
        document.getElementById('info-content').innerHTML = hvacData.infoContent;
        window.scrollTo(0,0);
    }
};