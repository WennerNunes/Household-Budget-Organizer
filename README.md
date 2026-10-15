# 🧾 Household Budget Organizer

A web-based personal finance tool to plan a monthly budget, split it across categories, track expenses and see where the money goes in interactive charts.

## 💡 Overview

Enter your monthly income, give each category a percentage target, and the app calculates the spending limit for every category. Add expenses, follow the progress bars and compare spending with limits in a chart. Your data stays in your browser.

## 🚀 Features

- Set a **monthly budget** and a **percentage target** for each category
- **6 default categories** (Financial Freedom, Fixed Costs, Pleasures, Goals, Education, Comfort)
- **Custom categories**: choose a name, a Font Awesome icon and an accent color, and **delete** them any time
- **Add, edit and delete expenses**
- Warning when an expense goes **over the category limit**
- Summary with **total spent, remaining balance and percentage used**
- **Progress bars** that change color as you get close to the limit
- **Bar chart** comparing spending and limits for every category (Chart.js)
- **Dark / light theme** toggle
- **LocalStorage**: data is kept after refreshing the page
- Responsive layout for desktop and mobile

## 🧰 Tech Stack

- **HTML5**
- **CSS3** (custom properties for the light and dark themes)
- **JavaScript** (vanilla, no frameworks)
- **Chart.js** for the chart
- **Font Awesome** for the icons
- **LocalStorage** for persistence

## 🧮 How to Use

1. Enter your **monthly budget** at the top of the page.
2. Set a **percentage target** for each category (the warning disappears when the total is 100%).
3. Add expenses with a short description and an amount.
4. Check the **progress bars and the chart**.
5. Use **Add Category** to create your own categories, and the **X** on a custom card to remove it.
6. Switch between light and dark mode anytime.

## 🧩 Run Locally

```bash
git clone https://github.com/WennerNunes/Household-Budget-Organizer.git
cd Household-Budget-Organizer
```

Open `index.html` in your browser (or use "Open with Live Server" in VS Code).

No installation needed. An internet connection is required because Chart.js and Font Awesome are loaded from a CDN.

## 🧱 Project Structure

```text
/
├── index.html   # Page structure and modals
├── style.css    # Styles, themes and responsive layout
└── script.js    # App logic, LocalStorage and chart
```

## 📈 Learning Outcomes

- DOM manipulation and dynamic rendering
- Data visualization with Chart.js
- Persisting state with LocalStorage
- Light and dark themes with CSS variables
- Refactoring duplicated code into a single card factory
- Escaping user input before rendering it as HTML
- Finding and fixing a bug where saved expenses did not show after a reload

## 🧑‍💻 About the Developer

Developed by **Wenner Nunes**, front-end developer building clean, responsive and user-focused web applications.

- GitHub: [WennerNunes](https://github.com/WennerNunes)
- LinkedIn: [Wenner Luiz Santana Nunes](https://www.linkedin.com/in/wenner-luiz-santana-nunes-122712205)
