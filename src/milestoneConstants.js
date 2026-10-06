import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Target } from "lucide-react";

export const MS_SORT_ORDER = ["COMPLETED", "ON_TRACK", "AT_RISK", "DELAYED"];

export const MILESTONE_STATUS_CONFIG = {
  ON_TRACK: {
    label: "On Track",
    tailwind: "bg-green-100 text-green-800 border-green-200",
    icon: React.createElement(CheckCircle2, { size: 12, className: "mr-1" }),
    hex: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
    order: 1,
  },
  AT_RISK: {
    label: "At Risk",
    tailwind: "bg-red-100 text-red-800 border-red-200",
    icon: React.createElement(AlertTriangle, { size: 12, className: "mr-1" }),
    hex: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    order: 2,
  },
  DELAYED: {
    label: "Delayed",
    tailwind: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: React.createElement(Clock, { size: 12, className: "mr-1" }),
    hex: { bg: "#fef9c3", color: "#854d0e", border: "#fef08a" },
    order: 3,
  },
  COMPLETED: {
    label: "Completed",
    tailwind: "bg-blue-100 text-blue-800 border-blue-200",
    icon: React.createElement(Target, { size: 12, className: "mr-1" }),
    hex: { bg: "#dbeafe", color: "#1e40af", border: "#bfdbfe" },
    order: 0,
  },
};

export const getStatusConfig = (status) => {
  const config = MILESTONE_STATUS_CONFIG[status] || MILESTONE_STATUS_CONFIG.ON_TRACK;
  return {
    ...config,
    ...config.hex,
  };
};

export const sortMilestones = (list) => {
  return [...list].sort((a, b) => {
    const orderA = getStatusConfig(a.status).order;
    const orderB = getStatusConfig(b.status).order;
    return orderA - orderB;
  });
};
