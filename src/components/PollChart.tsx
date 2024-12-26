"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface ChartDataType {
  A: number;
  B: number;
  C: number;
  D: number;
}

interface PollChartProps {
  chartData: ChartDataType;
}

const PollChart = ({ chartData }: PollChartProps) => {
  // Ensure chartData has default values
  const safeChartData: ChartDataType = {
    A: chartData?.A ?? 0,
    B: chartData?.B ?? 0,
    C: chartData?.C ?? 0,
    D: chartData?.D ?? 0,
  };

  // Calculate total votes with explicit typing
  const totalVotes: number = (Object.values(safeChartData) as number[]).reduce(
    (acc: number, curr: number) => acc + curr,
    0,
  );

  // Calculate percentages
  const getPercentage = (count: number): number => {
    if (!totalVotes) return 0;
    const percentage = (count / totalVotes) * 100;
    const rounded = Number(percentage.toFixed(1));
    return isNaN(rounded) ? 0 : rounded;
  };

  const percentageData = {
    A: getPercentage(safeChartData.A),
    B: getPercentage(safeChartData.B),
    C: getPercentage(safeChartData.C),
    D: getPercentage(safeChartData.D),
  };

  const data: ChartData<"bar"> = {
    labels: ["A", "B", "C", "D"],
    datasets: [
      {
        label: "graph",
        data: [
          percentageData.A,
          percentageData.B,
          percentageData.C,
          percentageData.D,
        ],
        backgroundColor: [
          "#3B82F6", // Blue for A
          "#10B981", // Green for B
          "#F59E0B", // Amber for C
          "#EF4444", // Red for D
        ],
        borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626"],
        borderWidth: 1,
        barThickness: 40,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Live Poll Results",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percentage = context.raw as number;
            return `${percentage.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: { display: false },
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value.toString()}%`,
        },
        max: 100, // Ensure y-axis stays within 0-100%
      },
    },
  };

  return (
    <div className="mt-6 rounded-lg bg-slate-200 p-4">
      <Bar data={data} options={options} />
    </div>
  );
};

export default PollChart;
