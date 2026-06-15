# Web Performance Budget & Optimization Planner ⚡

A web audit and budgeting planner tool designed to help developers set payload thresholds, calculate real-world load times, and follow Lighthouse best practices.

## 🌟 Features

1. **Budget Simulator**: Interactive range sliders to set target thresholds (in KB) for JavaScript, CSS, Images, and Font loads.
2. **Speed Predictor**: Instantly displays estimated download durations across various simulated network conditions (Slow 3G, Fast 3G, 4G, Broadband) based on standard throughput calculations.
3. **Lighthouse Checklist**: Interactive checklist offering guidance on image compression, lazy-loading, code-splitting, and CDN usage.
4. **Audit Importer (Basic JSON)**: Upload a basic JSON analysis file to populate your current payload budgets and automatically see the impact.

## 🚀 Usage

1. Open the planner and adjust the sliders to match your project's target payload sizes.
2. View the Speed Predictor card to see how your site will perform on mobile networks.
3. Check off optimization techniques as you implement them in your codebase.
4. If you have an exported `budget.json` audit, click the Upload button to auto-fill the sliders.
