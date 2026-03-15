/**
 * NaviCrimea Project Manifest & Documentation
 * This file serves as a programmatic description of the application's architecture, 
 * features, and technical specifications.
 */

export const NAVI_CRIMEA_MANIFEST = {
  metadata: {
    name: "NaviCrimea RIS",
    version: "3.0.0",
    description: "Regional Information System (Digital Ministry of Tourism) for Crimea",
    author: "Tohaboomerang",
    checkpoint: "2026-03-14",
    strategy: "GCHP (State-Private Partnership)",
  },

  architecture: {
    frontend: "React 18+ with TypeScript",
    styling: "Tailwind CSS (Mobile-first, Responsive)",
    animations: "Framer Motion (motion/react)",
    icons: "Lucide React",
    stateManagement: "React Hooks (useState, useMemo, useEffect)",
    routing: "Internal state-based routing (SPA)",
    circuits: {
      A: "B2B Hotelier Cabinet (Inventory, Grants, Standards)",
      B: "G2B/G2G State Monitoring (Heatmaps, FMS, Registry)",
      C: "B2C Tourist Portal & External API (Booking, Channel Manager)",
    }
  },

  coreFeatures: {
    geoCentric: {
      stays: "Booking system for apartments, houses, hotels, and hostels.",
      routes: "Complex route planning with time and cost estimation.",
      experiences: "Booking for excursions, equipment rental, and local activities.",
      companionFinder: "Social module to find travel partners and split costs.",
    },
    aiCapabilities: {
      routePlanner: "Gemini-powered AI that generates optimized travel routes based on user preferences.",
      voiceAssistant: "Voice-controlled search and navigation using browser SpeechRecognition and Gemini API.",
      consultant: "AI assistant in the Landlord Cabinet to help with listing creation.",
    },
    stateModules: {
      inspector: "Mobile app for police/administration to verify object legality.",
      fmsGateway: "Direct data sync with Ministry of Internal Affairs for migration control.",
      grantSystem: "Interface for hoteliers to apply for state subsidies.",
      qualityAudit: "Checklist and certification for 'Crimean Standard' compliance.",
    },
    logistics: {
      fleetManagement: "Micro-Uber for vehicle accounting, leasing, and dispatching.",
      channelManager: "API Gateway for Yandex.Travel and Ozon integration.",
    },
    offlineFirst: {
      caching: "Local storage caching for map data and object details.",
      outbox: "Queue system for messages and bookings made while offline, syncing automatically when connection returns.",
      navigation: "Simplified offline navigation list.",
    },
  },

  technicalStack: {
    apis: ["Gemini API (@google/genai)", "Yandex Maps API", "Google Maps API", "External Aggregator APIs (Yandex/Ozon)"],
    libraries: ["jsPDF (PDF generation)", "Lucide React (Icons)", "Tailwind CSS (UI)"],
    infrastructure: ["PostGIS-ready data structures", "Kubernetes (Scalability)", "Protected Cloud (FZ-152)"],
    analytics: ["Superset/Grafana for Ministry BI Dashboards"],
  },

  monetization: {
    model: "Fixed Fee",
    rate: "500 RUB per guest",
    logic: "Total_Fee = Guests * 500",
  }
};

export default NAVI_CRIMEA_MANIFEST;
