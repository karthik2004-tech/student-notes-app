# Hackathon Project Planner with Team Management & Submission Tracker (HackFlow)

A professional team-focused hackathon planning workspace designed to align concepts brainstorming, organize task sprints, track deadlines, simulate team chats, and complete checklists requirements for successful devpost/devfolio submissions.

## Features

- **Time Remaining Countdown**: Displays live ticking remaining clock (days, hours, minutes, seconds) to match hackathon deadlines.
- **Analytics Suitability Dashboard**:
  - Live project milestone progress percentage gauge.
  - Count stats row illustrating Ideas proposed, Tasks completed ratio, and Milestones met.
  - Interactive milestones tracker checklist.
- **Concept Brainstorming Sandbox**: Propose concepts, fill in elevator pitches, and vote on team proposals. Grid is automatically sorted based on votes.
- **Kanban Sprint Board**: Set tasks with assignee roles (Vishwa, Saitej, Karthik, Priyanshi), select priority badges, set deadline dates, and shift columns (To Do, In Progress, In Review, Done).
- **Simulated Collaboration Hub**:
  - Simulated active team chat window.
  - Interactive auto-replies: Teammates answer user comments automatically.
  - Attachment upload simulation.
  - Conference video call modal launcher.
- **Submission Tracker Checklists**:
  - Submission requirements checklists.
  - Mock Submit Button verifying requirements, launching compilation overlays, and generating congratulations notifications.
- **Orange, Purple, Green & Black Dual Themes**: Professional variable colors tokens supporting light and dark modes.
- **JSON Profile Backups**: Export and import complete project states.

## Project Structure

- `index.html` - App navigation tabs, count indicators, milestones row, ideation grids, kanban columns, chat panels, checklists, and calls modals.
- `style.css` - Theme colors variables (orange/purple/green/black), card elements, bubble speech blocks, input slots, and calls layouts.
- `script.js` - Countdowns, task statuses shifting methods, voting aggregations, simulated responders, uploader actions, checklists controls, and backup JSON builders.
- `project.json` - Level 3 metadata parameters.

## Running Locally

1. Open `index.html` in any web browser.
2. Alternatively, run the local development server at the root directory:
   ```bash
   npm run dev
   ```
3. Navigate to **HackFlow** in the showcased project menu directory.
