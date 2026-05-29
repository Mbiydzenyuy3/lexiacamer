# 📖 Lexia Cameroon

![Lexia Cameroon](public/pwa-512x512.png)

**Lexia Cameroon** is a premium, accessible Progressive Web Application (PWA) designed to tackle "Learning Poverty" in Cameroon. It uses an interactive, phonics-first approach to help children aged 10+ master core reading and spelling skills, combining localized cultural contexts with highly resilient offline architecture.

---

## 🎯 The Problem and Solution

### ⚠️ The Problem: Learning Poverty
Many primary-school children in Cameroon face high rates of "Learning Poverty," which is defined as being unable to read and understand a simple text by age 10. Several factors contribute to this:
1. **Connectivity Issues:** Unstable or non-existent internet in rural areas and conflict zones limits access to remote learning tools.
2. **Lack of Localized Content:** Most educational software uses Western examples (Apple, Snowflake) that students can't relate to, decreasing engagement.
3. **Hardware Constraints:** Expensive devices restrict app accessibility. Educational initiatives require solutions that work flawlessly on low-end, battery-constrained Android devices.
4. **Bilingual Education Gap:** Cameroon is officially bilingual, and children often struggle to bridge the gap between English and French phonics.

### 💡 The Solution: Lexia Cameroon
Lexia bridges this educational gap by offering an interactive phonics ecosystem tailored specifically to Cameroonian context:
- **Offline-First Delivery:** By implementing a Progressive Web App (PWA) architecture, Lexia only needs to be loaded once. Afterward, the interactive modules and text-to-speech functionality work perfectly entirely disconnected from the web, surviving network outages.
- **Culturally Relevant Context:** All learning materials are built around Cameroonian cities (Douala, Yaoundé), foods (Ndolé, Koki, Achu), and names (Abena, Fon), creating immediate relevance and cultural resonance.
- **Low-End Hardware Optimization:** Replaced heavy UI libraries with raw lightweight vanilla CSS and SVGs, ensuring 60 FPS performance, low memory footprints, and minimized battery drainage on older Android smartphones.
- **Bilingual By Design:** Complete support for both French and English interfaces and native Offline Web Speech API integration that guides students on phoneme pronunciations smoothly in either language.

---

## 🏗️ System Design Plan

### **Architecture Overview**
The architecture centers around a statically built React application transformed into an optimized PWA using Vite. The main layers are categorized into the **App Shell**, **Content Store**, and **Educational Modules**.

1. **Client-Side Framework (React 18 + Vite):**
   - High-performance, unopinionated framework ensuring minimal bundle size. Component-driven design for `PhonicsLab` and `WordForge`.
2. **PWA Layer (`vite-plugin-pwa`):**
   - **Service Workers:** Auto-injected to precache the build artifacts (HTML, CSS, JS, and minimal assets), maintaining the app offline.
   - **Manifest:** Defined via `manifest.webmanifest` allowing Android Chrome users to "Install" the portal as a native app on their home screen.
3. **Web Speech API (`speech.js`):**
   - Implements native browser capabilities as a Singleton pattern class handling localized text-to-speech without external API requests. Features graceful fallbacks and offline-native voice detection.
4. **State Management & i18n (`App.jsx` & `i18n.js`):**
   - Pure React local `useState` managed at the Root component, with context propagated downward. 
   - Uses `localStorage` persistently syncing progress (streak, words, stars), and a lightweight JSON configuration for bilingual content mapping without large i18n libraries.

---

## 🚀 How to Run the App (Local Development)

### Prerequisites 
- Ensure you have [Node.js](https://nodejs.org/) installed (v16.14.0 or greater).
- Use `npm`, `yarn`, or `pnpm`.

### Steps
1. **Navigate to the Project Directory**
   ```bash
   cd lexiacamer
   ```
2. **Install Dependencies**
   Run the following to securely pull all required packages:
   ```bash
   npm install
   ```
3. **Start the Development Server**
   Start the local Vite server with Fast Refresh.
   ```bash
   npm run dev
   ```
4. **Preview the Application**
   Open your browser to `http://localhost:5173/` (or the port specified in your terminal).

### Production Build
To create an optimized payload bundled for production:
```bash
npm run build
npm run preview
```
Testing the production build is highly recommended to verify Service Worker generation and test true PWA capabilities.

---

## 📥 How to Clone

To get a local copy of this repository on your machine, run the following git command:

```bash
# Clone via SSH (Recommended)
git clone git@github.com:Mbiydzenyuy3/lexiacamer.git

# Navigate into the project folder
cd lexiacamer
```

---

## 🤝 How to Contribute

We welcome and encourage educational modules, translations, and UI contributions.

### Contributing Guideline
1. **Fork the Repository:** Create your own branch off of `main` via GitHub UI.
2. **Clone your Fork:** Pull it onto your local machine.
3. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Commit your Changes:** Include a concise and readable commit message describing your edits.
   ```bash
   git commit -m 'feat: Added vocabulary on Cameroonian rivers'
   ```
5. **Push to the Branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request:** Open a PR against the `main` branch. Describe exactly the problem you are solving, the rationale behind your solution, and attach any UI screenshots if applicable!

### What are we looking for?
- **More Regional Vocabulaire:** (E比如: additional traditional meals, native animal species, proverbs translated).
- **Design Enhancements:** Smooth SVG implementations, or better responsive scaling for `300px` Android screens.
- **A11Y (Accessibility):** Enhancements on ARIA labels, contrast ratio, and screen-readable prompts.

---
*Built to empower the next generation of Cameroonian readers! ❤️💚💛*
