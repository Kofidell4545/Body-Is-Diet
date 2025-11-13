# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Diet is Body is an AI-powered weekly meal planner targeting Ghanaian fitness use-cases.
- Tech (from README): React Native mobile app; Firebase for auth/database; Python (TensorFlow) for meal planning and nutrition analysis.

Repository status and layout
- Current repo contains documentation (README.md). The README references two planned subprojects that may not yet exist in the tree:
  - mobile_app/ — React Native app (iOS/Android)
  - ai_model/ — Python/TensorFlow model code
- Commands below follow the README’s intended structure. If directories are absent locally, create them or pull the appropriate branch.

Common commands
Mobile app (React Native)
- Install dependencies
  ```bash
  cd mobile_app
  npm install   # or: yarn install
  ```
- Run on Android / iOS
  ```bash
  npx react-native run-android
  npx react-native run-ios
  ```
- Start Metro bundler (if you prefer running the app from an IDE or device directly)
  ```bash
  npx react-native start
  ```

AI model (Python/TensorFlow)
- Install dependencies and train the model
  ```bash
  cd ai_model
  pip install -r requirements.txt
  python train_model.py
  ```

Firebase (backend services)
- This project uses Firebase for auth and database. Use the Firebase CLI for environment setup (authentication and project selection). Coordinate project IDs and configs with maintainers.

Tests and linting
- No test or lint configuration is present in the repository at this time. Once added (e.g., Jest/Detox for React Native or Pytest for Python), update this file with the exact commands, including how to run a single test.

High-level architecture (big picture)
- Mobile app (React Native):
  - Collects user profile (age, weight, height, goals) and meal preferences.
  - Displays AI-generated weekly plans (3 meals/day) and supports customization.
  - Provides offline access to saved plans and shopping lists.
- Backend (Firebase):
  - Authentication and data storage for user profiles and meal plans.
- AI/ML service (Python/TensorFlow):
  - Generates meal plans grounded in Ghanaian foods and converts plans into grocery shopping lists.

Developer prerequisites (from README)
- Node.js with npm/yarn and React Native CLI; Android Studio or Xcode for device/emulator.
- Firebase CLI for backend setup.
- Python 3.x for AI model development.

Notes for future updates
- When tests, linting, or CI are introduced, add the precise commands here (include single-test examples and any env vars required).
- If additional services (e.g., hosting functions, model serving endpoints) are added, document their entry points and how the mobile app integrates with them.
