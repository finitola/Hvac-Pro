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

    // 1. სასწავლო რეჟიმი
    startStudyMode() {
        this.hideAllViews();
        document.getElementById('quiz-view').classList.add('active-view');
        window.scrollTo(0, 0);

        // ელემენტების მართვა
        document.getElementById('exam-controls').style.display = 'none';
        document.getElementById('exam-progress-container').style.display = 'none';
        document.getElementById('question-card-container').innerHTML = ''; 
        
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

    // 2. საგამოცდო რეჟიმი
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
        
        // გამოტოვებულების სტატისტიკა
        // ვითვლით რეალურად რამდენი კითხვაა ამჟამად პასუხგაუცემელი (skipped array-ში)
        const currentSkippedCount = this.skippedQuestions.length;
        const badge = document.getElementById('skipped-badge');
        
        if (currentSkippedCount > 0) {
            badge.style.display = 'inline-block';
            badge.innerText = `გამოტოვებული: ${currentSkippedCount}`;
            badge.className = 'badge bg-orange';
        } else {
            badge.style.display = 'none';
        }

        // ღილაკების ლოგიკა
        const nextBtn = document.querySelector('#exam-controls .btn-primary');
        if (this.currentQuestionIndex === 29) {
            nextBtn.innerText = "დასრულება ✅";
            // ბოლო კითხვაზე იძახებს შემოწმებას
            nextBtn.onclick = () => this.tryFinishExam();
        } else {
            nextBtn.innerText = "შემდეგი ➡️";
            nextBtn.onclick = () => this.nextQuestion();
        }

        // კარტის აწყობა
        let optionsHtml = '<ul class="options">';
        q.options.forEach((opt, i) => {
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
        // თუ ეს კითხვა გამოტოვებულებში იყო, ამოვიღოთ სიიდან, რადგან უკვე გასცა პასუხი
        this.skippedQuestions = this.skippedQuestions.filter(i => i !== this.currentQuestionIndex);
        
        // განვაახლოთ გამოტოვებულების ბეჯი
        const badge = document.getElementById('skipped-badge');
        if (this.skippedQuestions.length === 0) badge.style.display = 'none';
        else badge.innerText = `გამოტოვებული: ${this.skippedQuestions.length}`;
    },

    nextQuestion() {
        // 1. შემოწმება: მონიშნულია თუ არა პასუხი?
        if (this.userAnswers[this.currentQuestionIndex] === undefined) {
            alert("⚠️ გთხოვთ მონიშნოთ პასუხი!\n\nთუ პასუხი არ იცით და გსურთ გადასვლა, გამოიყენეთ ღილაკი 'გამოტოვება'.");
            return;
        }

        // 2. გადასვლა
        if (this.currentQuestionIndex < 29) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.tryFinishExam();
        }
    },

    skipQuestion() {
        // ამატებს გამოტოვებულებში, თუ უკვე არ არის
        if (!this.skippedQuestions.includes(this.currentQuestionIndex)) {
            // თუ პასუხი უკვე გაცემულია, skip-ს აზრი არ აქვს, მაგრამ მაინც გადავიდეს
            if (this.userAnswers[this.currentQuestionIndex] === undefined) {
                this.skippedQuestions.push(this.currentQuestionIndex);
            }
        }
        
        // გადადის შემდეგზე პასუხის მოთხოვნის გარეშე
        if (this.currentQuestionIndex < 29) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            // თუ ბოლო კითხვაზე "გამოტოვებას" დააჭირა
            this.tryFinishExam();
        }
    },

    // ახალი ფუნქცია: დასრულების მცდელობა
    tryFinishExam() {
        // 1. ამოწმებს მიმდინარე კითხვას (თუ ბოლო კითხვაზეა)
        if (this.userAnswers[this.currentQuestionIndex] === undefined && !this.skippedQuestions.includes(this.currentQuestionIndex)) {
             // თუ არც პასუხია და არც გამოტოვებულებშია (მაგ. ბოლო კითხვაზე პირდაპირ დასრულებას დააწვა)
             alert("⚠️ მონიშნეთ ამ კითხვის პასუხი ან დააჭირეთ 'გამოტოვებას'.");
             return;
        }

        // 2. ამოწმებს არის თუ არა სადმე გამოტოვებული/უპასუხო კითხვა
        // (უნდა იყოს 30 პასუხი სულ)
        let firstUnanswered = -1;
        for (let i = 0; i < 30; i++) {
            if (this.userAnswers[i] === undefined) {
                firstUnanswered = i;
                break;
            }
        }

        if (firstUnanswered !== -1) {
            const confirmGo = confirm(`⚠️ ტესტს ვერ დაასრულებთ!\n\nთქვენ გაქვთ გამოტოვებული ან პასუხგაუცემელი კითხვები.\nსავალდებულოა ყველა კითხვაზე პასუხის გაცემა.\n\nგსურთ გადახვიდეთ პირველ გამოტოვებულ კითხვაზე? (კითხვა №${firstUnanswered + 1})`);
            if (confirmGo) {
                this.currentQuestionIndex = firstUnanswered;
                this.renderQuestion();
            }
            return;
        }

        // 3. თუ ყველაფერი რიგზეა, ასრულებს
        this.finishExam();
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
                    if (i === q.correct) liClass = 'user-correct'; 
                    if (i === userAnswer && i !== q.correct) liClass = 'user-wrong'; 
                    
                    optionsHtml += `<li class="option-label ${liClass}" style="cursor:default">${String.fromCharCode(97 + i)}. ${opt}</li>`;
                });
                optionsHtml += '</ul>';
                
                // აქ "გამოტოვებული" წესით აღარ უნდა გამოჩნდეს, რადგან დავბლოკეთ, მაგრამ მაინც იყოს კოდში
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
