# AIMER

AIMER is a browser-based aim training platform designed for Valorant players. The project focuses on precision aiming, target acquisition, reaction time improvement, and mouse control through a collection of structured training scenarios inspired by modern aim-training software.

Built with Next.js and TypeScript, AIMER combines a custom gameplay engine, configurable crosshair system, performance analytics, and persistent session tracking in a single web application.

---

## Overview

The objective of AIMER is to provide a lightweight, high-performance environment for aim training while preserving the feel of a player's existing Valorant configuration.

The platform allows users to:

* Configure Valorant sensitivity settings
* Customize and import Valorant crosshairs
* Practice across multiple training scenarios
* Track historical performance
* Analyze accuracy and reaction time metrics
* Monitor long-term improvement

---

## Features

### Training Scenarios

#### Six Shot

A precision-focused scenario that maintains six small targets on screen at all times.

Characteristics:

* Six simultaneous targets
* Small target size
* Random target placement
* Immediate target replacement on hit
* Designed for precision flicking and micro-adjustments

---

#### Multishot

A clustered target acquisition scenario.

Characteristics:

* Four simultaneous targets
* Medium-sized targets
* Targets appear within a cluster region
* Immediate target replacement on hit
* Designed to improve flick speed and target transitions

---

#### Multishot 3x3

A structured grid-based scenario.

Characteristics:

* Invisible 3×3 grid system
* Three simultaneous targets
* Randomized target positions within available cells
* Immediate target replacement on hit
* Designed to improve speed, accuracy, and spatial control

---

### Match Flow

All scenarios follow the same gameplay sequence:

1. Scenario selection
2. Fullscreen and pointer lock initialization
3. Three-second countdown
4. Thirty-second active training session
5. Automatic results generation
6. Session persistence and analytics updates

---

### Crosshair System

AIMER includes support for Valorant-style crosshair customization.

Capabilities include:

* Import Valorant crosshair codes
* Export crosshair configurations
* Live preview rendering
* Adjustable:

  * Color
  * Opacity
  * Thickness
  * Gap
  * Length
  * Outline
  * Center Dot
  * Inner Lines
  * Outer Lines

Example:

```text
0;p;0;c;1;s;1;P;c;8;u;6E92FFFF;b;1;f;0;0t;1;0l;2;0v;2;0o;2;0a;1
```

---

### Sensitivity Configuration

The platform provides configurable settings designed around common Valorant configurations.

Default settings:

| Setting      | Value   |
| ------------ | ------- |
| Sensitivity  | 0.35    |
| DPI          | 1600    |
| Polling Rate | 1000 Hz |

Additional options:

* Raw Input
* Mouse Configuration Profiles
* Persistent Settings Storage

---

### Analytics

AIMER records detailed performance metrics for every session.

Tracked statistics include:

* Score
* Hits
* Misses
* Accuracy Percentage
* Total Clicks
* Average Reaction Time
* Best Reaction Time
* Worst Reaction Time
* Session Duration

Historical session data can be used to evaluate long-term improvement and compare performance across scenarios.

---

### Theme Customization

The interface supports user-defined visual themes.

Configurable elements:

* Background Color
* Accent Color
* User Interface Colors
* Target Colors
* Hit Effects
* Crosshair Colors

The default appearance uses a dark, performance-focused interface designed to minimize distractions during training.

---

## Technology Stack

### Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS
* Framer Motion

### State Management

* Zustand

### Database

* Prisma ORM
* SQLite

### Gameplay Engine

Custom browser-based engine utilizing:

* requestAnimationFrame
* Pointer Lock API
* Fullscreen API
* Canvas Rendering

---

## Project Structure

```text
src/
│
├── app/
│   ├── dashboard/
│   ├── train/
│   ├── analytics/
│   └── settings/
│
├── components/
│
├── game/
│   ├── analytics/
│   ├── core/
│   ├── input/
│   ├── modes/
│   ├── rendering/
│   ├── scoring/
│   └── targets/
│
├── hooks/
├── lib/
├── prisma/
├── store/
└── types/
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Meeth-W/Aim-Trainer.git
cd Aim-Trainer
```

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Initialize the Database

```bash
npx prisma db push
```

### Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Database

The project uses SQLite by default to simplify local development and deployment.

Stored data includes:

* User Settings
* Session History
* Performance Metrics
* Crosshair Configurations
* Theme Preferences

The database layer is structured through Prisma and can be adapted for alternative providers in future versions.

---

## Roadmap

Planned areas of development include:

### Additional Training Modes

* Gridshot
* Microshot
* MotionShot
* Spidershot
* SphereTrack
* StrafeTrack
* SwitchTrack

### Advanced Analytics

* Click Heatmaps
* Hit Heatmaps
* Session Comparison Tools
* Performance Trend Analysis

### User Features

* User Accounts
* Cloud Synchronization
* Online Profiles
* Leaderboards

### Engine Improvements

* Expanded Crosshair Compatibility
* Enhanced Sensitivity Calibration
* Additional Input Configuration Options
* High Refresh Rate Optimization

---

## Browser Requirements

Recommended browsers:

* Google Chrome
* Microsoft Edge
* Brave
* Opera GX

Required browser features:

* Pointer Lock API
* Fullscreen API
* requestAnimationFrame
* Local Storage

For the best experience:

* Use fullscreen mode
* Use the same sensitivity and DPI settings configured in Valorant
* Train on a high refresh rate display when available

---

## Contributing

Contributions are welcome.

Areas where contributions may be particularly valuable include:

* Additional training scenarios
* Gameplay engine improvements
* Analytics enhancements
* Input system optimization
* User interface improvements
* Performance optimization

Please open an issue before submitting significant architectural changes.

---

## License

This project is licensed under the MIT License.

---

## Disclaimer

AIMER is an independent open-source project and is not affiliated with, endorsed by, or associated with Riot Games, Valorant, or Aimlabs.

All trademarks and product names belong to their respective owners.
