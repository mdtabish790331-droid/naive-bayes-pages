// LocalStorage for Sidebar Progress
let completedSections = JSON.parse(localStorage.getItem('naiveBayesProgress')) || [];

function updateSidebarProgress() {
    navLinks.forEach(link => {
        const sectionId = link.getAttribute('href').substring(1);
        if (completedSections.includes(sectionId)) {
            link.classList.add('completed');
        }
    });
}

function markSectionCompleted(sectionId) {
    if (!completedSections.includes(sectionId)) {
        completedSections.push(sectionId);
        localStorage.setItem('naiveBayesProgress', JSON.stringify(completedSections));
        updateSidebarProgress();
    }
}

// Sidebar active link logic
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.sidebar ul li a');

// Initialize sidebar progress on load
updateSidebarProgress();

// Reset progress logic
const resetProgressBtn = document.getElementById('resetProgressBtn');
if (resetProgressBtn) {
    resetProgressBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset your learning progress?')) {
            completedSections = [];
            localStorage.removeItem('naiveBayesProgress');
            navLinks.forEach(link => link.classList.remove('completed'));
        }
    });
}

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
            // Mark as completed when user reaches this section
            if (current) {
                markSectionCompleted(current);
            }
        }
    });
});

// Smooth scrolling and mark as completed on click
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        
        // Mark as completed immediately on click
        markSectionCompleted(targetId);
        
        const targetSection = document.getElementById(targetId);
        window.scrollTo({
            top: targetSection.offsetTop - 20,
            behavior: 'smooth'
        });
    });
});

// Tab Switching Logic for Code Section
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and target content
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// PapaParse CSV Upload logic
const csvFileInput = document.getElementById('csvFileInput');
const uploadBtn = document.getElementById('uploadBtn');
const tableContainer = document.getElementById('tableContainer');
const csvTableHead = document.querySelector('#csvTable thead');
const csvTableBody = document.querySelector('#csvTable tbody');

let edaChartInstance = null;
let edaPieChartInstance = null;

uploadBtn.addEventListener('click', () => {
    const file = csvFileInput.files[0];
    if (!file) {
        alert("Please select a CSV file first.");
        return;
    }

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            if (data.length > 0) {
                renderTable(data);
                generateEDA(data);
            }
        }
    });
});

function renderTable(data) {
    csvTableHead.innerHTML = '';
    csvTableBody.innerHTML = '';

    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    csvTableHead.appendChild(headerRow);

    const rowsToShow = Math.min(5, data.length);
    for (let i = 0; i < rowsToShow; i++) {
        const tr = document.createElement('tr');
        headers.forEach(headerText => {
            const td = document.createElement('td');
            td.textContent = data[i][headerText];
            tr.appendChild(td);
        });
        csvTableBody.appendChild(tr);
    }
    tableContainer.style.display = 'block';
}

function generateEDA(data) {
    const headers = Object.keys(data[0]);
    const targetColumn = headers[headers.length - 1];

    const classCounts = {};
    data.forEach(row => {
        const val = row[targetColumn];
        if(val) classCounts[val] = (classCounts[val] || 0) + 1;
    });

    const labels = Object.keys(classCounts);
    const counts = Object.values(classCounts);

    const ctxBar = document.getElementById('edaChart').getContext('2d');
    const ctxPie = document.getElementById('edaPieChart').getContext('2d');
    
    if (edaChartInstance) edaChartInstance.destroy();
    if (edaPieChartInstance) edaPieChartInstance.destroy();

    document.getElementById('chartPlaceholder').style.display = 'none';
    document.getElementById('edaChartsGrid').style.display = 'grid';

    const colors = [
        'rgba(41, 128, 185, 0.8)',
        'rgba(231, 76, 60, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(241, 196, 15, 0.8)'
    ];
    const borderColors = colors.map(c => c.replace('0.8', '1'));

    edaChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Count',
                data: counts,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `Count: ${context.raw}`; }
                    }
                }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    edaPieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a,b)=>a+b, 0);
                            const percent = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${context.raw} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Training Logic Simulation
const splitSlider = document.getElementById('splitSlider');
const splitValue = document.getElementById('splitValue');
const trainBtn = document.getElementById('trainBtn');
const trainingProgress = document.getElementById('trainingProgress');
const trainingSummary = document.getElementById('trainingSummary');
const summaryPriors = document.getElementById('summaryPriors');

if (splitSlider) {
    splitSlider.addEventListener('input', (e) => {
        const trainPct = e.target.value;
        const testPct = 100 - trainPct;
        splitValue.textContent = `${trainPct}% Train / ${testPct}% Test`;
    });
}

if (trainBtn) {
    trainBtn.addEventListener('click', () => {
        trainingSummary.style.display = 'none';
        trainingProgress.style.display = 'block';
        trainBtn.disabled = true;
        trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
        
        let progress = 0;
        const fill = document.querySelector('.progress-fill');
        const interval = setInterval(() => {
            progress += 20;
            fill.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    trainingProgress.style.display = 'none';
                    trainingSummary.style.display = 'block';
                    fill.style.width = '0%';
                    trainBtn.disabled = false;
                    trainBtn.innerHTML = '<i class="fas fa-play"></i> Train Model';
                    
                    // Show mock summary based on Weather dataset priors
                    summaryPriors.innerHTML = `
                        <li><strong>P(Yes)</strong> = 9/14 &approx; 0.643</li>
                        <li><strong>P(No)</strong> = 5/14 &approx; 0.357</li>
                    `;
                }, 400);
            }
        }, 200);
    });
}

// Prediction Logic Demo (Weather Dataset)
const priors = { Yes: 9/14, No: 5/14 };
const likelihoods = {
    Yes: {
        Outlook: { Sunny: 2/9, Overcast: 4/9, Rain: 3/9 },
        Humidity: { High: 3/9, Normal: 6/9 },
        Wind: { Weak: 6/9, Strong: 3/9 }
    },
    No: {
        Outlook: { Sunny: 3/5, Overcast: 0/5, Rain: 2/5 },
        Humidity: { High: 4/5, Normal: 1/5 },
        Wind: { Weak: 2/5, Strong: 3/5 }
    }
};

document.getElementById('predictBtn').addEventListener('click', () => {
    const outlook = document.getElementById('inputOutlook').value;
    const humidity = document.getElementById('inputHumidity').value;
    const wind = document.getElementById('inputWind').value;

    const probYes = priors.Yes * likelihoods.Yes.Outlook[outlook] * likelihoods.Yes.Humidity[humidity] * likelihoods.Yes.Wind[wind];
    const probNo = priors.No * likelihoods.No.Outlook[outlook] * likelihoods.No.Humidity[humidity] * likelihoods.No.Wind[wind];

    const resultBox = document.getElementById('predictionResult');
    const calcYesText = document.getElementById('calcYesText');
    const calcNoText = document.getElementById('calcNoText');
    const finalVerdict = document.getElementById('finalVerdict');
    const verdictExplanation = document.getElementById('verdictExplanation');

    calcYesText.innerHTML = `P(Yes) &times; P(${outlook}|Yes) &times; P(${humidity}|Yes) &times; P(${wind}|Yes) <br><br> = ${priors.Yes.toFixed(3)} &times; ${likelihoods.Yes.Outlook[outlook].toFixed(3)} &times; ${likelihoods.Yes.Humidity[humidity].toFixed(3)} &times; ${likelihoods.Yes.Wind[wind].toFixed(3)} <br><br> = <strong>${probYes.toFixed(4)}</strong>`;
    
    calcNoText.innerHTML = `P(No) &times; P(${outlook}|No) &times; P(${humidity}|No) &times; P(${wind}|No) <br><br> = ${priors.No.toFixed(3)} &times; ${likelihoods.No.Outlook[outlook].toFixed(3)} &times; ${likelihoods.No.Humidity[humidity].toFixed(3)} &times; ${likelihoods.No.Wind[wind].toFixed(3)} <br><br> = <strong>${probNo.toFixed(4)}</strong>`;

    const verdictBox = document.querySelector('.final-verdict-box');

    if (probYes > probNo) {
        finalVerdict.innerHTML = "YES (Play Golf)";
        finalVerdict.style.color = "#16a34a"; // green
        verdictBox.style.borderColor = "#16a34a";
        verdictBox.style.backgroundColor = "#eafaf1";
        verdictExplanation.innerHTML = `Because <strong>${probYes.toFixed(4)}</strong> > <strong>${probNo.toFixed(4)}</strong>, the model assigns the class 'Yes'.`;
    } else {
        finalVerdict.innerHTML = "NO (Do NOT Play Golf)";
        finalVerdict.style.color = "#dc2626"; // red
        verdictBox.style.borderColor = "#dc2626";
        verdictBox.style.backgroundColor = "#fef2f2";
        verdictExplanation.innerHTML = `Because <strong>${probNo.toFixed(4)}</strong> > <strong>${probYes.toFixed(4)}</strong>, the model assigns the class 'No'.`;
    }

    resultBox.style.display = 'block';
    
    // Slight delay to allow render before scrolling
    setTimeout(() => {
        resultBox.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }, 100);
});
