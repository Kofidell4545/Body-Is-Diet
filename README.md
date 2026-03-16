# 📱 Diet is Body 
🚀 *AI-Powered Meal Planner for Ghanaian Fitness Enthusiasts*  

---

## **📌 Core Goal & Vision**  
**Diet is Body** is a mobile application purpose-built to help **Ghanaian bodybuilders and fitness enthusiasts** create personalized meal plans using **locally available foods**. 

The core goal of this build is to provide a highly performant, culturally relevant fitness platform where users can:
- Generate a full **week’s meal plan** based on Ghanaian ingredients.
- Adapt their **favorite meals** into healthier, macro-friendly versions.
- Automatically generate a **grocery shopping list**.
- Customize plans based on exact **fitness goals, dietary restrictions, and portion sizes**.
- Access their plans **offline**.

---

## **🏗 Architecture & Current Build State**

We have intentionally structured this project as a robust, decoupled **Full-Stack Application** to ensure scalability and performance, moving away from monolithic BaaS setups.

### **1. Frontend (Mobile Client)**
- **Framework:** React Native + Expo + Expo Router
- **Styling & UI:** Native UI components, SafeArea context, consistent dark-mode aesthetics.
- **Client Security:** Expo SecureStore for encrypted, on-device JWT token persistence.
- **API Communication:** Axios with interceptor-based automatic credential rotation (refresh token flow).

### **2. Backend (REST API)**
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js 
- **Database:** SQLite (via `@databases/sqlite` pure WebAssembly driver) for local dev, swappable to PostgreSQL.
- **Security & Validation:**
  - Password Hashing: `bcrypt`
  - Request Validation: `Zod` schema validation
  - Rate Limiting & Auth: JWT-based stateless authentication 
- **Email:** Nodemailer (currently using Ethereal for dev password-reset flows).

### **3. Infrastructure (Docker)**
The backend is fully containerized for identical local, staging, and production environments.
- **Multi-stage `Dockerfile`** for lean production builds.
- **`docker-compose.yml`** for one-click startup and persistent database volumes.
- Dev-override (`docker-compose.dev.yml`) for live-reloading.

---

## **🔒 Implemented Core Flows (Phase 1)**

Currently, the robust **Authentication Foundation** has been entirely built and verified end-to-end:

1. **User Registration:** Users can sign up, generating a hashed record in the database and returning an immediate JWT pair.
2. **Secure Login:** Validates credentials and issues an Access Token (15m expiry) and Refresh Token (7d expiry, stored in DB).
3. **Session Management:** The frontend automatically rotates expired access tokens in the background without user interruption.
4. **Password Recovery:** Fully functional forgot-password & reset token generation flow.
5. **UI Completion:** Fully styled, responsive auth screens (Login, Signup, Forgot Password) built directly into the Expo layout.

---

## **🚀 Getting Started (Active Development)**

### **1. Run the Backend API**
You can run the backend either via Node directly or via Docker. The backend must be running for the mobile app to authenticate users.

**Option A: Node**
```bash
cd backend
npm install
npm run dev
# Starts on http://localhost:3000
```

**Option B: Docker**
```bash
docker compose up --build
```

### **2. Run the Mobile App**
Ensure your backend is running first.

```bash
cd body-is-diet
npm install

# Option A: Run in the local Xcode Simulator
npx expo run:ios 

# Option B: Run on your physical device via Expo Go app
npx expo start
```
*Note: If testing on a physical device, update `API_URL` in `body-is-diet/services/api.ts` from `localhost` to your Mac's LAN IP address.*

---

## **⏭ Next Milestones / Roadmap (TigerStyle Principles)**
Following TigerStyle (Simplicity, Orthogonality, Data Orientation, Explicitness):

### Phase 2: User Onboarding Flow
- **Goal Selection:** Lose Weight, Gain Muscle, Gain Weight, Maintain.
- **Body Metrics Input:** Age, Gender, Height, Weight, Target Weight (feeds BMR/TDEE calculations).
- **Activity Level:** Sedentary to Athlete (multiplier for TDEE).
- **Food Preferences:** Select Proteins, Carbs, Veggies, and avoidances (e.g., Rice, Yam, Banku, Chicken, Fish).
- **Favorite Meals:** Core differentiator — Waakye, Banku & Tilapia, Jollof, etc. AI adapts these.
- **Meal Frequency:** 3, 4, or 5 meals daily.
- **AI Processing Screen:** Loader animation while backend calculates BMR, macros, and builds the plan.

### Phase 3: Core Dashboard & Features
- **Meal Plan Result (Main Dashboard):** Weekly tab layout (Mon-Sun). Shows meals (Breakfast, Lunch, Dinner) and daily macro summary.
- **Shopping List:** Aggregated ingredients based on the weekly plan.
- **Meal Swap:** User can swap a meal (e.g., Waakye to Jollof) while keeping macros balanced.
- **Profile Screen:** Edit metrics, goals, preferences, and trigger recalculation.
