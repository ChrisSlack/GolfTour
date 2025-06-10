// Main application data
const appData = {
    schedule: [
        {
            "date": "Tuesday July 1, 2025",
            "course": "Travel from Faro Airport to Vila Gale Cerro Alagoa",
            "departureTime": "Upon Arrival",
            "travelTime": "45",
            "preTeeOffTime": "N/A",
            "teeTime": "N/A",
            "golfDrinksHours": "N/A",
            "pickUpTime": "N/A",
            "link": "N/A"
        },
        {
            "date": "Wednesday July 2, 2025",
            "course": "NAU Morgado Course",
            "departureTime": "08:30",
            "travelTime": "35",
            "preTeeOffTime": "1.12",
            "teeTime": "10:12",
            "golfDrinksHours": "6.80",
            "pickUpTime": "17:00",
            "link": "https://www.nauhotels.com/en/nau-morgado-golf-country-club"
        },
        {
            "date": "Thursday July 3, 2025",
            "course": "Amendoeira Golf Resort",
            "departureTime": "08:30",
            "travelTime": "25",
            "preTeeOffTime": "1.25",
            "teeTime": "10:10",
            "golfDrinksHours": "6.83",
            "pickUpTime": "17:00",
            "link": "https://www.amendoeiraresort.com/en/"
        },
        {
            "date": "Friday July 4, 2025",
            "course": "Free Day",
            "departureTime": "N/A",
            "travelTime": "N/A",
            "preTeeOffTime": "N/A",
            "teeTime": "N/A",
            "golfDrinksHours": "N/A",
            "pickUpTime": "N/A",
            "link": "N/A"
        },
        {
            "date": "Saturday July 5, 2025",
            "course": "Quinta do Lago South Course",
            "departureTime": "08:30",
            "travelTime": "38",
            "preTeeOffTime": "1.27",
            "teeTime": "10:24",
            "golfDrinksHours": "6.60",
            "pickUpTime": "17:00",
            "link": "https://www.quintadolagocc.com/en/quinta-do-lago"
        },
        {
            "date": "Sunday July 6, 2025",
            "course": "Travel from Vila Gale Cerro Alagoa to Faro Airport",
            "departureTime": "TBC (based on flight)",
            "travelTime": "45",
            "preTeeOffTime": "N/A",
            "teeTime": "N/A",
            "golfDrinksHours": "N/A",
            "pickUpTime": "N/A",
            "link": "N/A"
        }
    ],
    courses: {
        "morgado": {
            "name": "NAU Morgado Course",
            "description": "This superb course opened in 2003 and is one of the latest to open on the Algarve. Despite its young age, it feels surprisingly mature, a characteristic enhanced by the planting of 500 olive trees. Morgado features views of the Monchique Mountains and is set amongst valleys, rivers and woodland. With gently undulating fairways, deep bunkers and large tees and greens, Morgado is an excellent choice when travelling to the Algarve.",
            "tips": [
                "The greens are large with subtle breaks that can be difficult to read",
                "Deep Scottish-inspired bunkers are strategically placed throughout the course",
                "The course is relatively forgiving off the tee but demands good putting skills",
                "Watch out for the wind which can make some holes play much longer"
            ],
            "website": "https://www.nauhotels.com/en/nau-morgado-golf-country-club"
        },
        "amendoeira": {
            "name": "Amendoeira Golf Resort (Faldo Course)",
            "description": "Designed by six-time Major winner Sir Nick Faldo, this course is a standout destination for those seeking a top-rated golf holiday in Portugal. With breathtaking views and a layout that rewards thoughtful play, the Faldo Course offers an unforgettable round of golf in one of Europe's premier golf regions. Unlike traditional parkland courses, the Faldo Course embraces its unique Mediterranean setting, featuring desert-style bunkers, wild herbs, cacti and olive trees in place of heather and dense woodland.",
            "tips": [
                "As Sir Nick said: 'The real skill is that when you stand on the tee, the golf hole tells you what to do, and if you do what it tells you there is reward, but if you don't you're penalised'",
                "The course requires strategic play and careful positioning",
                "Keep right of the fairway on the 1st hole for a better line into the green",
                "Par 5 4th hole is reachable with a good drive but requires a demanding tee shot"
            ],
            "website": "https://www.amendoeiraresort.com/en/"
        },
        "quintadolago": {
            "name": "Quinta do Lago South Course",
            "description": "A favorite among European Tour professionals, the South Course requires accurate drives and precise shots. The most famous hole is the 15th, a memorable Par 3 requiring a 200m shot over a lake. Flanked by the Atlantic and the Ria Formosa Natural Park, Quinta do Lago is a tourist resort characterized by the harmony achieved between man and nature. Golf is a lifestyle here - Europe's largest golf course with 72 holes shared by four excellent 18-hole courses, two of which are listed among the top 25 golf courses in Europe.",
            "tips": [
                "The course is well-maintained with fast and true running greens",
                "Tee boxes are all very good, fairways a joy to play off",
                "Bunkers contain lovely white sand allowing plenty of spin",
                "There are plenty of dog leg holes where positioning your tee shots is crucial",
                "The best holes are 14/15/16 and 17 with great photo opportunities"
            ],
            "website": "https://www.quintadolagocc.com/en/quinta-do-lago"
        }
    },
    fineCategories: [
        {"name": "3 Putt", "amount": 1, "description": "Taking 3 stabs with a putter"},
        {"name": "Woody", "amount": 1, "description": "Hitting a tree during your round"},
        {"name": "Wetty", "amount": 1, "description": "Ball landing in water hazard"},
        {"name": "Sandy", "amount": 1, "description": "Ball landing in bunker"},
        {"name": "Lost Ball", "amount": 2, "description": "Losing a ball during play"},
        {"name": "Air Shot", "amount": 2, "description": "Completely missing the ball on a swing"},
        {"name": "Not clearing ladies tee", "amount": 5, "description": "Drive that doesn't make it past the ladies tee box"},
        {"name": "Club Throw", "amount": 2, "description": "Throwing a club in frustration"},
        {"name": "Late for Tee Time", "amount": 5, "description": "Arriving late for scheduled tee time"},
        {"name": "Phone Ringing", "amount": 2, "description": "Phone going off during play"},
        {"name": "Dress Code Violation", "amount": 2, "description": "Not adhering to proper golf attire"}
    ],
    fridayActivities: [
        {
            "category": "Beach",
            "activities": [
                {"name": "Praia dos Pescadores", "description": "Beautiful fisherman's beach within walking distance of the hotel", "votes": 0},
                {"name": "Praia da Oura", "description": "Golden sand beach with water sports options", "votes": 0},
                {"name": "Praia dos Alemães", "description": "Popular beach with sun loungers and beachside bars", "votes": 0}
            ]
        },
        {
            "category": "Water Activities",
            "activities": [
                {"name": "Dolphin Watching", "description": "2-hour speedboat cruise with chances to see wild dolphins", "votes": 0},
                {"name": "Cave Tours", "description": "Explore sea caves along the Algarve coast", "votes": 0},
                {"name": "Jet Skiing", "description": "Rent jet skis and explore the coastline", "votes": 0}
            ]
        },
        {
            "category": "Cultural",
            "activities": [
                {"name": "Silves Castle", "description": "Visit the historic Moorish castle in nearby Silves", "votes": 0},
                {"name": "Old Town Albufeira", "description": "Explore the charming streets and shops of the old town", "votes": 0},
                {"name": "Local Winery Tour", "description": "Sample Portuguese wines at a local vineyard", "votes": 0}
            ]
        },
        {
            "category": "Adventure",
            "activities": [
                {"name": "Jeep Safari", "description": "Off-road adventure through the Algarve countryside", "votes": 0},
                {"name": "Karting", "description": "Race go-karts at a local track", "votes": 0},
                {"name": "Zoomarine", "description": "Theme park with marine shows and attractions", "votes": 0}
            ]
        }
    ]
};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// Navigation
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetPage = this.getAttribute('data-page');
            
            // Update active nav link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page, hide others
            pages.forEach(page => {
                if (page.id === targetPage) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        });
    });
}

// Countdown Timer
function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    const daysElement = document.getElementById('countdown-days');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');
    const secondsElement = document.getElementById('countdown-seconds');
    
    // Trip start date: July 1, 2025
    const tripDate = new Date('July 1, 2025 00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = tripDate - now;
        
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display countdown
        daysElement.textContent = days;
        hoursElement.textContent = hours;
        minutesElement.textContent = minutes;
        secondsElement.textContent = seconds;
        
        // If countdown is over
        if (distance < 0) {
            clearInterval(countdownInterval);
            daysElement.textContent = '0';
            hoursElement.textContent = '0';
            minutesElement.textContent = '0';
            secondsElement.textContent = '0';
            
            // Add a message that the trip is on!
            const countdownParent = countdownElement.parentElement;
            const message = document.createElement('p');
            message.textContent = 'The trip is on! Time to golf!';
            message.classList.add('mt-8');
            countdownParent.appendChild(message);
        }
    }
    
    // Update countdown immediately
    updateCountdown();
    
    // Update countdown every second
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// Schedule Page
function initSchedulePage() {
    const scheduleTableBody = document.getElementById('schedule-table-body');
    
    // Clear existing content
    scheduleTableBody.innerHTML = '';
    
    // Populate schedule table
    appData.schedule.forEach(day => {
        const row = document.createElement('tr');
        
        // Create a course cell with link if available
        const courseCell = document.createElement('td');
        if (day.link !== 'N/A') {
            const courseLink = document.createElement('a');
            courseLink.href = day.link;
            courseLink.target = '_blank';
            courseLink.textContent = day.course;
            courseCell.appendChild(courseLink);
        } else {
            courseCell.textContent = day.course;
        }
        
        row.innerHTML = `
            <td>${day.date}</td>
        `;
        row.appendChild(courseCell);
        row.innerHTML += `
            <td>${day.departureTime}</td>
            <td>${day.travelTime}</td>
            <td>${day.preTeeOffTime}</td>
            <td>${day.teeTime}</td>
            <td>${day.golfDrinksHours}</td>
            <td>${day.pickUpTime}</td>
        `;
        
        scheduleTableBody.appendChild(row);
    });
}

// Golf Courses Page
function initCoursesPage() {
    const coursesGrid = document.querySelector('.courses-grid');
    const backButtons = document.querySelectorAll('.back-to-courses');
    
    // Create course cards
    function createCourseCards() {
        coursesGrid.innerHTML = '';
        
        // Loop through courses
        for (const [key, course] of Object.entries(appData.courses)) {
            const courseCard = document.createElement('div');
            courseCard.className = 'card course-card';
            courseCard.innerHTML = `
                <div class="card__body">
                    <h3 class="course-title">${course.name}</h3>
                    <p>${course.description.substring(0, 150)}...</p>
                    <button class="btn btn--primary btn--full-width view-course mt-8" data-course="${key}">
                        View Details
                    </button>
                </div>
            `;
            
            coursesGrid.appendChild(courseCard);
        }
        
        // Add event listeners to view course buttons
        document.querySelectorAll('.view-course').forEach(button => {
            button.addEventListener('click', function() {
                const courseKey = this.getAttribute('data-course');
                showCourseDetails(courseKey);
            });
        });
    }
    
    // Show course details
    function showCourseDetails(courseKey) {
        // Hide courses grid
        coursesGrid.style.display = 'none';
        
        // Show selected course details
        const courseDetails = document.getElementById(`course-${courseKey}`);
        courseDetails.style.display = 'block';
        
        // Populate course details
        const course = appData.courses[courseKey];
        
        // Description
        courseDetails.querySelector('.course-description').textContent = course.description;
        
        // Tips
        const tipsList = courseDetails.querySelector('.tips-list');
        tipsList.innerHTML = '';
        course.tips.forEach(tip => {
            const li = document.createElement('li');
            li.textContent = tip;
            tipsList.appendChild(li);
        });
        
        // Website link
        const websiteLink = courseDetails.querySelector('.course-website');
        websiteLink.href = course.website;
    }
    
    // Back to courses list
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Hide all course details
            document.querySelectorAll('.course-details').forEach(detail => {
                detail.style.display = 'none';
            });
            
            // Show courses grid
            coursesGrid.style.display = 'grid';
        });
    });
    
    createCourseCards();
}

// Banter & Fines Page
function initFinesPage() {
    // DOM Elements
    const fineForm = document.getElementById('fine-form');
    const categoryForm = document.getElementById('category-form');
    const fineTypeSelect = document.getElementById('fine-type');
    const finesTableBody = document.getElementById('fines-table-body');
    const summaryTableBody = document.getElementById('summary-table-body');
    const totalFinesAmount = document.getElementById('total-fines-amount');
    const noFinesMessage = document.getElementById('no-fines-message');
    const noSummaryMessage = document.getElementById('no-summary-message');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Local Storage Keys
    const FINES_KEY = 'golf_trip_fines';
    const CATEGORIES_KEY = 'golf_trip_fine_categories';
    
    // Initialize fine categories
    function initCategories() {
        // Check if categories exist in local storage
        let categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || [];
        
        // If no categories in storage, use default ones
        if (categories.length === 0) {
            categories = appData.fineCategories;
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        }
        
        // Populate the select dropdown
        updateCategoryDropdown(categories);
    }
    
    // Update category dropdown
    function updateCategoryDropdown(categories) {
        fineTypeSelect.innerHTML = '';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = `${category.name} (€${category.amount})`;
            option.dataset.amount = category.amount;
            fineTypeSelect.appendChild(option);
        });
    }
    
    // Load fines from local storage
    function loadFines() {
        const fines = JSON.parse(localStorage.getItem(FINES_KEY)) || [];
        return fines;
    }
    
    // Save fine to local storage
    function saveFine(fine) {
        const fines = loadFines();
        fines.push(fine);
        localStorage.setItem(FINES_KEY, JSON.stringify(fines));
    }
    
    // Update fines table
    function updateFinesTable() {
        const fines = loadFines();
        finesTableBody.innerHTML = '';
        
        if (fines.length === 0) {
            noFinesMessage.style.display = 'block';
            return;
        }
        
        noFinesMessage.style.display = 'none';
        
        fines.forEach(fine => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${fine.name}</td>
                <td>${fine.type}</td>
                <td>€${fine.amount}</td>
                <td>${fine.description || '-'}</td>
                <td>${fine.date}</td>
            `;
            finesTableBody.appendChild(row);
        });
    }
    
    // Update summary table
    function updateSummary() {
        const fines = loadFines();
        summaryTableBody.innerHTML = '';
        
        if (fines.length === 0) {
            noSummaryMessage.style.display = 'block';
            totalFinesAmount.textContent = '0';
            return;
        }
        
        noSummaryMessage.style.display = 'none';
        
        // Calculate totals by person
        const personTotals = {};
        let grandTotal = 0;
        
        fines.forEach(fine => {
            const amount = parseFloat(fine.amount);
            grandTotal += amount;
            
            if (personTotals[fine.name]) {
                personTotals[fine.name].count++;
                personTotals[fine.name].amount += amount;
            } else {
                personTotals[fine.name] = {
                    count: 1,
                    amount: amount
                };
            }
        });
        
        // Sort by amount (highest first)
        const sortedPeople = Object.keys(personTotals).sort((a, b) => {
            return personTotals[b].amount - personTotals[a].amount;
        });
        
        // Create table rows
        sortedPeople.forEach(person => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${person}</td>
                <td>${personTotals[person].count}</td>
                <td>€${personTotals[person].amount.toFixed(2)}</td>
            `;
            summaryTableBody.appendChild(row);
        });
        
        // Update grand total
        totalFinesAmount.textContent = grandTotal.toFixed(2);
    }
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab content
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
    
    // Add fine form submission
    fineForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('fine-name');
        const typeSelect = document.getElementById('fine-type');
        const descriptionInput = document.getElementById('fine-description');
        
        const selectedOption = typeSelect.options[typeSelect.selectedIndex];
        const amount = selectedOption.dataset.amount;
        
        // Create new fine object
        const fine = {
            name: nameInput.value.trim(),
            type: typeSelect.value,
            amount: amount,
            description: descriptionInput.value.trim(),
            date: new Date().toLocaleDateString()
        };
        
        // Save fine
        saveFine(fine);
        
        // Update UI
        updateFinesTable();
        updateSummary();
        
        // Reset form
        fineForm.reset();
    });
    
    // Add category form submission
    categoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('category-name');
        const amountInput = document.getElementById('category-amount');
        const descriptionInput = document.getElementById('category-description');
        
        // Create new category object
        const category = {
            name: nameInput.value.trim(),
            amount: parseFloat(amountInput.value),
            description: descriptionInput.value.trim()
        };
        
        // Save category
        const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || [];
        categories.push(category);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        
        // Update dropdown
        updateCategoryDropdown(categories);
        
        // Reset form
        categoryForm.reset();
        
        // Show confirmation
        alert(`New fine category "${category.name}" added successfully!`);
    });
    
    // Initialize
    initCategories();
    updateFinesTable();
    updateSummary();
}

// Friday Activities Page
function initFridayActivities() {
    const activitiesContainer = document.getElementById('activities-container');
    const activityForm = document.getElementById('activity-form');
    
    // Local Storage Key
    const ACTIVITIES_KEY = 'golf_trip_activities';
    
    // Load activities from local storage or use defaults
    function loadActivities() {
        let activities = JSON.parse(localStorage.getItem(ACTIVITIES_KEY));
        
        // If no activities in storage, use default ones
        if (!activities) {
            activities = appData.fridayActivities;
            localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
        }
        
        return activities;
    }
    
    // Save activities to local storage
    function saveActivities(activities) {
        localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    }
    
    // Update activities UI
    function updateActivitiesUI() {
        const activities = loadActivities();
        activitiesContainer.innerHTML = '';
        
        activities.forEach(category => {
            // Add category heading
            const heading = document.createElement('h3');
            heading.textContent = category.category;
            heading.className = 'category-heading';
            activitiesContainer.appendChild(heading);
            
            // Add activities in this category
            category.activities.forEach(activity => {
                const activityCard = document.createElement('div');
                activityCard.className = 'card activity-card';
                
                activityCard.innerHTML = `
                    <div class="card__body">
                        <div class="activity-title">
                            <h4>${activity.name}</h4>
                            <span class="vote-count">${activity.votes} votes</span>
                        </div>
                        <p class="mt-8">${activity.description}</p>
                        <button class="btn btn--secondary vote-btn" data-category="${category.category}" data-activity="${activity.name}">
                            <i class="fas fa-thumbs-up"></i> Vote
                        </button>
                    </div>
                `;
                
                activitiesContainer.appendChild(activityCard);
            });
        });
        
        // Add vote button event listeners
        document.querySelectorAll('.vote-btn').forEach(button => {
            button.addEventListener('click', function() {
                const categoryName = this.getAttribute('data-category');
                const activityName = this.getAttribute('data-activity');
                
                voteForActivity(categoryName, activityName);
            });
        });
    }
    
    // Vote for an activity
    function voteForActivity(categoryName, activityName) {
        const activities = loadActivities();
        
        // Find the category and activity
        const category = activities.find(cat => cat.category === categoryName);
        if (category) {
            const activity = category.activities.find(act => act.name === activityName);
            if (activity) {
                // Increment vote count
                activity.votes++;
                
                // Save updated activities
                saveActivities(activities);
                
                // Update UI
                updateActivitiesUI();
            }
        }
    }
    
    // Add new activity
    activityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const categorySelect = document.getElementById('activity-category');
        const nameInput = document.getElementById('activity-name');
        const descriptionInput = document.getElementById('activity-description');
        
        const categoryName = categorySelect.value;
        const activityName = nameInput.value.trim();
        const activityDescription = descriptionInput.value.trim();
        
        // Create new activity object
        const newActivity = {
            name: activityName,
            description: activityDescription,
            votes: 0
        };
        
        // Get current activities
        const activities = loadActivities();
        
        // Find category or create new one
        let category = activities.find(cat => cat.category === categoryName);
        
        if (category) {
            // Add activity to existing category
            category.activities.push(newActivity);
        } else {
            // Create new category
            activities.push({
                category: categoryName,
                activities: [newActivity]
            });
        }
        
        // Save updated activities
        saveActivities(activities);
        
        // Update UI
        updateActivitiesUI();
        
        // Reset form
        activityForm.reset();
        
        // Show confirmation
        alert(`New activity "${activityName}" added successfully!`);
    });
    
    // Initialize
    updateActivitiesUI();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all sections
    initNavigation();
    initCountdown();
    initSchedulePage();
    initCoursesPage();
    initFinesPage();
    initFridayActivities();
});