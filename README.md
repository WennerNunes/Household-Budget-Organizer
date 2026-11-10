# 🧾 Household Budget Organizer

A web-based personal finance tool to plan a monthly budget, split it across categories, track expenses and see where the money goes in interactive charts.

🔗 **Live demo:** [household-budget-wenner.netlify.app](https://household-budget-wenner.netlify.app/)

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

## 🧩 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/WennerNunes/Household-Budget-Organizer.git
   ```
2. **Navigate into the project folder**
   ```bash
   cd Household-Budget-Organizer
   ```
3. **Open the project:** open `index.html` in your browser, or right-click it and choose **"Open with Live Server"** in VS Code.

💡 No frameworks or installations required, everything runs directly in your browser.

---

## 🧱 Project Structure

```
/
├── index.html   # Main HTML structure
├── style.css    # Styling and responsive design
└── script.js    # App logic and Chart.js integration
```

---

## 📈 Learning Outcomes

This project enhanced my understanding of:

- DOM manipulation and dynamic rendering
- Data visualization with Chart.js
- Front-end architecture and UI/UX design
- LocalStorage for persistent state
- Dark/light themes with CSS variables

---

## 🧑‍💻 About the Developer

Developed by **Wenner Nunes**, front-end developer building clean, responsive and user-focused web applications.

- GitHub: [WennerNunes](https://github.com/WennerNunes)
- LinkedIn: [Wenner Luiz Santana Nunes](https://www.linkedin.com/in/wenner-luiz-santana-nunes-122712205)
