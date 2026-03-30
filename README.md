# 🐝 BEEE: High-Fidelity Stepper Simulator

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r166-000000?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A professional-grade, interactive 3D engineering dashboard for hybrid stepper motor simulation. **BEEE** provides high-fidelity mechanical visualization, real-time telemetry, and technical diagnostic modes optimized for both desktop and mobile devices.

---

## 📖 Table of Contents
- [Core Features](#-core-features)
- [Technical Assembly](#-technical-assembly)
- [Visualization Modes](#-visualization-modes)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🚀 Core Features

### 🛠️ High-Fidelity Mechanical Assembly
- **Laminated Stator**: Physically accurate simulation of a 42-plate silicon steel stator stack to minimize eddy current visual artifacts.
- **Detailed Hybrid Rotor**: Multi-component assembly featuring a stainless-steel shaft, neodymium permanent magnet core, and a 50-tooth mechanical cage.
- **Precision Components**: Includes scaled ball bearings, stator lead frames, and industrial NEMA-style housing.

### 📊 Real-Time Engineering Dashboard
- **Dynamic Telemetry**: Live readouts for Torque (N·m), Flux Bias (T), and Angular Position (deg).
- **Interactive Inspection**: Direct click-to-inspect logic for all 3D elements with emissive highlighting and technical tooltips.
- **Fluid Dynamics**: High-bandwidth rotation drive with smooth target interpolation for jitter-free mechanical movement.

### 📱 Responsive Design
- **Mobile First**: Transition to a bottom-docked control interface on small screens for optimal touch interaction.
- **Theme Support**: Seamless switching between "Engineering Light" and "Deep Midnight Dark" modes.

---

## 🔍 Visualization Modes

| Mode | Description |
| :--- | :--- |
| **Blueprint / X-Ray** | Diagnostic view highlighting magnetic fields (Green), current loops (Orange), and structural integrity (Blue). |
| **Exploded View** | Staggered animation sequence revealing internal assembly relationships with radial leader lines. |
| **Cross-Section** | Top-down transverse cut with artifact-free stencil capping for internal component inspection. |

---

## 💻 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router)
- **3D Engine**: [Three.js](https://threejs.org/) via [@react-three/fiber](https://github.com/pmndrs/react-three-fiber)
- **Controls/Helpers**: [@react-three/drei](https://github.com/pmndrs/drei)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks (useRef, useMemo, useCallback)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kowalskiye/BEEE-stepper-motor-simulation.git
   cd stepper-sim
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the simulator.

---

## ☁️ Deployment

The BEEE simulator is optimized for deployment on **Vercel**:

1. Push your changes to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. The framework (Next.js) will be automatically detected.
4. Click **Deploy**.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed by <a href="https://github.com/Kowalskiye">Kowalskiye</a>
</p>
