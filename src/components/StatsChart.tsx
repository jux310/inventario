import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DataPoint {
  date: string;
  units: number;
}

interface StatsChartProps {
  data: DataPoint[];
  title: string;
  restockPoint?: number;
}

export function StatsChart({ data, title, restockPoint }: StatsChartProps) {
  const chartData = {
    datasets: [
      {
        label: 'Unidades',
        data: data.map(point => ({
          x: new Date(point.date),
          y: point.units
        })),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2
      },
      ...(restockPoint ? [{
        label: 'Punto de Reposición',
        data: data.map(point => ({
          x: new Date(point.date),
          y: restockPoint
        })),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0
      }] : [])
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {
        type: 'time' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        },
        time: {
          unit: 'day' as const,
          tooltipFormat: 'PPP',
          displayFormats: {
            day: 'd MMM'
          }
        },
        adapters: {
          date: {
            locale: es
          }
        },
        border: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: true
        },
        border: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}