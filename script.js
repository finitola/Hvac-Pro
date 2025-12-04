const app = {
    timerInterval: null,
    examTimeLeft: 0,
    currentQuestionIndex: 0,
    examQuestions: [],
    userAnswers: {}, // ინახავს: { questionIndex: selectedOptionIndex }
    skippedQuestions: [], // ინახავს გამოტოვებულ ინდექსებს

    hideAllViews() {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    },

    showHome() {
        this.hideAllViews();
        document.getElementById('home-view').classList.add('active-view');
        document.getElementById('timer').style.display = "none";
        clearInterval(this.timerInterval);
        window.scrollTo(0, 0);
    },

    // 1. სასწავლო რეჟიმი (ძველი სტილით, სქროლვადი)
    startStudyMode() {
        this.hideAllViews();
        document.getElementById('quiz-view').classList.add('active-view');
        window.scrollTo(0, 0);

        // ელემენტების მართვა
        document.getElementById('exam-controls').style.display = 'none';
        document.getElementById('exam-progress-container').style.display = 'none';
        document.getElementById('question-card-container').innerHTML = ''; // ვასუფთავებთ კარტის კონტეინერს
        
        const listContainer = document.getElementById('study-list-container');
        listContainer.innerHTML = '';

        document.getElementById('quiz-header-info').innerHTML = `
            <div class="card" style="text-align:center; border-left: 5px solid var(--primary); margin-bottom:20px;">
                <h2 style="margin:0">📖 სასწავლო რეჟიმი</h2>
                <p>ყველა კითხვა სწორი პასუხებით.</p>
            </div>
        `;

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
            card.innerHTML = `<div class="question-text">${index + 1}. ${q.q}</div>${optionsHtml}`;
            listContainer.appendChild(card);
        });
    },

    // 2. საგამოცდო რეჟიმი (ახალი - სათითაოდ)
    startExamMode() {
        this.hideAllViews();
        document.getElementById('quiz-view').classList.add('active-view');
        document.getElementById('timer').style.display = "block";
        
        // UI ელემენტების გამოჩენა/დამალვა
        document.getElementById('study-list-container').innerHTML = '';
        document.getElementById('quiz-header-info').innerHTML = '';
        document.getElementById('exam-controls').style.display = 'flex';
        document.getElementById('exam-progress-container').style.display = 'block';

        // მონაცემების ინიციალიზაცია
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.skippedQuestions = [];
        
        // 30 რენდომული კითხვა
        const shuffled = [...hvacData.questions].map((q, origIndex) => ({...q, originalIndex: origIndex})).sort(() => 0.5 - Math.random());
        this.examQuestions = shuffled.slice(0, 30);

        // ტაიმერი (30 წუთი)
        this.examTimeLeft = 30 * 60;
        this.updateTimerDisplay();
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.examTimeLeft--;
            this.updateTimerDisplay();
            if (this.examTimeLeft <= 0) this.finishExam();
        }, 1000);

        this.renderQuestion();
    },

    renderQuestion() {
        const q = this.examQuestions[this.currentQuestionIndex];
        const container = document.getElementById('question-card-container');
        
        // პროგრესის განახლება
        const progressPercent = ((this.currentQuestionIndex) / 30) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').innerText = `კითხვა ${this.currentQuestionIndex + 1} / 30`;
        
        const skippedCount = this.skippedQuestions.length;
        const badge = document.getElementById('skipped-badge');
        if (skippedCount > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = `გამოტოვებული: ${skippedCount}`;
            badge.className = 'badge bg-orange';
        } else {
            badge.style.display = 'none';
        }

        // ბოლო კითხვაზე ღილაკის შეცვლა
        const nextBtn = document.querySelector('#exam-controls .btn-primary');
        if (this.currentQuestionIndex === 29) {
            nextBtn.innerText = "დასრულება ✅";
            nextBtn.onclick = () => this.finishExam();
        } else {
            nextBtn.innerText = "შემდეგი ➡️";
            nextBtn.onclick = () => this.nextQuestion();
        }

        // კარტის აწყობა
        let optionsHtml = '<ul class="options">';
        q.options.forEach((opt, i) => {
            // შევამოწმოთ თუ უკვე მონიშნული აქვს (უკან დაბრუნებისას ან გადახედვისას)
            const isChecked = this.userAnswers[this.currentQuestionIndex] === i ? 'checked' : '';
            optionsHtml += `
            <li>
                <label class="option-label">
                    <input type="radio" name="currentQ" value="${i}" ${isChecked} onchange="app.saveAnswer(${i})">
                    <span>${String.fromCharCode(97 + i)}. ${opt}</span>
                </label>
            </li>`;
        });
        optionsHtml += '</ul>';

        container.innerHTML = `
            <div class="question-card">
                <div class="question-text">${this.currentQuestionIndex + 1}. ${q.q}</div>
                ${optionsHtml}
            </div>
        `;
        window.scrollTo(0,0);
    },

    saveAnswer(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        // თუ გამოტოვებულებში იყო, ამოვიღოთ
        this.skippedQuestions = this.skippedQuestions.filter(i => i !== this.currentQuestionIndex);
    },

    nextQuestion() {
        // თუ არ მონიშნა და არც გამოტოვა, ჩავთვალოთ გამოტოვებულად? 
        // ჯობია არ გავუშვათ თუ არ მონიშნა, ან გამოტოვებას დააჭიროს.
        // მაგრამ მარტივი ლოგიკისთვის: უბრალოდ გადავიდეს.
        
        if (this.currentQuestionIndex < 29) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.finishExam();
        }
    },

    skipQuestion() {
        if (!this.skippedQuestions.includes(this.currentQuestionIndex)) {
            this.skippedQuestions.push(this.currentQuestionIndex);
        }
        this.nextQuestion();
    },

    updateTimerDisplay() {
        const m = Math.floor(this.examTimeLeft / 60);
        const s = this.examTimeLeft % 60;
        document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' + s : s}`;
    },

    finishExam() {
        clearInterval(this.timerInterval);
        let score = 0;
        const reviewContainer = document.getElementById('review-container');
        reviewContainer.innerHTML = '';

        this.examQuestions.forEach((q, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = (userAnswer === q.correct);
            
            if (isCorrect) {
                score++;
            } else {
                // შეცდომების გამოტანა
                const card = document.createElement('div');
                card.className = "question-card";
                
                let optionsHtml = '<ul class="options">';
                q.options.forEach((opt, i) => {
                    let liClass = '';
                    if (i === q.correct) liClass = 'user-correct'; // სწორი პასუხი
                    if (i === userAnswer && i !== q.correct) liClass = 'user-wrong'; // მომხმარებლის არასწორი არჩევანი
                    
                    // თუ არაფერი მოუნიშნავს
                    if (userAnswer === undefined && i === q.correct) {
                        liClass = 'user-correct'; // მაინც ვაჩვენოთ რომელი იყო სწორი
                    }

                    optionsHtml += `<li class="option-label ${liClass}" style="cursor:default">${String.fromCharCode(97 + i)}. ${opt}</li>`;
                });
                optionsHtml += '</ul>';
                
                const statusText = userAnswer === undefined ? '<span style="color:orange">(გამოტოვებული)</span>' : '';
                card.innerHTML = `<div class="question-text">${index + 1}. ${q.q} ${statusText}</div>${optionsHtml}`;
                reviewContainer.appendChild(card);
            }
        });

        this.hideAllViews();
        document.getElementById('result-view').classList.add('active-view');
        document.getElementById('timer').style.display = "none";
        window.scrollTo(0, 0);

        const scoreEl = document.getElementById('final-score');
        const textEl = document.getElementById('pass-fail-text');
        const descEl = document.getElementById('pass-fail-desc');
        
        scoreEl.innerText = score;
        
        if (score >= 27) {
            textEl.innerText = "გილოცავ! ჩაბარებულია 🎉";
            textEl.style.color = "var(--success)";
            scoreEl.style.backgroundColor = "var(--success)";
            descEl.innerText = "შენ გამოავლინე შესანიშნავი ცოდნა.";
        } else {
            textEl.innerText = "ვერ ჩაბარდა ❌";
            textEl.style.color = "var(--danger)";
            scoreEl.style.backgroundColor = "var(--danger)";
            descEl.innerText = "ჩასაბარებლად საჭიროა 27 სწორი პასუხი.";
        }
    },

    // 3. ინფო რეჟიმი
    startInfoMode() {
        this.hideAllViews();
        document.getElementById('info-view').classList.add('active-view');
        document.getElementById('info-content').innerHTML = hvacData.infoContent;
        window.scrollTo(0, 0);
    },

    // 4. ინვერტორის რეჟიმი
    startInverterMode() {
        this.hideAllViews();
        document.getElementById('inverter-view').classList.add('active-view');
        document.getElementById('inverter-content').innerHTML = hvacData.inverterContent;
        window.scrollTo(0, 0);
    }
};
