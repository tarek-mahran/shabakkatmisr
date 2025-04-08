import React, { useState, useCallback } from 'react';
import { BarChart3, Users, AlertTriangle, AlertCircle, AlertOctagon, Bell, Activity, RefreshCw, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        color: '#f1f5f9',
      },
      ticks: {
        precision: 0,
      },
    },
  },
};

// Card types and styles
const cardStyles = {
  running: { gradient: 'from-blue-600 to-blue-800', icon: BarChart3 },
  sa: { gradient: 'from-emerald-500 to-emerald-700', icon: Users },
  sa_emergency: { gradient: 'from-red-500 to-red-700', icon: AlertTriangle },
  sa_critical: { gradient: 'from-blue-500 to-blue-700', icon: AlertCircle },
  sa_major: { gradient: 'from-green-500 to-green-700', icon: AlertOctagon },
  sa_minor: { gradient: 'from-amber-500 to-amber-700', icon: Bell },
  nsa: { gradient: 'from-gray-500 to-gray-700', icon: Activity },
  nsa_emergency: { gradient: 'from-red-500 to-red-700', icon: AlertTriangle },
  nsa_critical: { gradient: 'from-blue-500 to-blue-700', icon: AlertCircle },
  nsa_major: { gradient: 'from-green-500 to-green-700', icon: AlertOctagon },
  nsa_minor: { gradient: 'from-amber-500 to-amber-700', icon: Bell }
};

interface CardProps {
  title: string;
  value: string;
  type: keyof typeof cardStyles;
  big?: boolean;
}

const Card: React.FC<CardProps> = ({ title, value, type, big = false }) => {
  const style = cardStyles[type];
  const Icon = style.icon;

  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${style.gradient} p-6 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${big ? 'text-4xl' : 'text-2xl'} mb-2`}>{value}</p>
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
      <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10" />
    </div>
  );
};

interface FilterSectionProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, options, selected, onChange }) => {
  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <label
            key={option}
            className="flex items-center space-x-2 rounded-lg border border-gray-200 p-2 transition-colors hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

interface DataRow {
  Region: string;
  Impact: string;
  'Sub Project': string;
  'Fault Level': string;
}

function App() {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);

  const processData = useCallback((rows: DataRow[]) => {
    // Extract unique regions and domains
    const uniqueRegions = Array.from(new Set(rows.map(row => row.Region))).filter(Boolean);
    const uniqueDomains = Array.from(new Set(rows.map(row => row['Sub Project']))).filter(Boolean);
    
    setRegions(uniqueRegions.sort());
    setDomains(uniqueDomains.sort());
    setData(rows);
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<DataRow>(firstSheet);
      processData(rows);
    };
    reader.readAsArrayBuffer(file);
  }, [processData]);

  const getFilteredData = useCallback(() => {
    let filtered = [...data];

    if (selectedRegions.length > 0) {
      filtered = filtered.filter(row => selectedRegions.includes(row.Region));
    }
    if (selectedDomains.length > 0) {
      filtered = filtered.filter(row => selectedDomains.includes(row['Sub Project']));
    }
    if (selectedImpacts.length > 0) {
      filtered = filtered.filter(row => {
        const impact = row.Impact?.includes('NSA') ? 'NSA' : 'SA';
        return selectedImpacts.includes(impact);
      });
    }
    if (selectedSeverities.length > 0) {
      filtered = filtered.filter(row => selectedSeverities.includes(row['Fault Level']));
    }

    return filtered;
  }, [data, selectedRegions, selectedDomains, selectedImpacts, selectedSeverities]);

  const getCardValues = useCallback(() => {
    const filtered = getFilteredData();
    const total = filtered.length;
    const sa = filtered.filter(row => !row.Impact?.includes('NSA'));
    const nsa = filtered.filter(row => row.Impact?.includes('NSA'));

    return {
      total: total.toString(),
      sa: sa.length.toString(),
      nsa: nsa.length.toString(),
      sa_emergency: sa.filter(row => row['Fault Level'] === 'Emergency').length.toString(),
      sa_critical: sa.filter(row => row['Fault Level'] === 'Critical').length.toString(),
      sa_major: sa.filter(row => row['Fault Level'] === 'Major').length.toString(),
      sa_minor: sa.filter(row => row['Fault Level'] === 'Minor').length.toString(),
      nsa_emergency: nsa.filter(row => row['Fault Level'] === 'Emergency').length.toString(),
      nsa_critical: nsa.filter(row => row['Fault Level'] === 'Critical').length.toString(),
      nsa_major: nsa.filter(row => row['Fault Level'] === 'Major').length.toString(),
      nsa_minor: nsa.filter(row => row['Fault Level'] === 'Minor').length.toString(),
    };
  }, [getFilteredData]);

  const getChartData = useCallback(() => {
    const filtered = getFilteredData();
    const regionData = regions.map(region => {
      const regionRows = filtered.filter(row => row.Region === region);
      return {
        region,
        sa: regionRows.filter(row => !row.Impact?.includes('NSA')).length,
        nsa: regionRows.filter(row => row.Impact?.includes('NSA')).length,
      };
    });

    return {
      labels: regionData.map(d => d.region),
      datasets: [
        {
          label: 'SA',
          data: regionData.map(d => d.sa),
          backgroundColor: '#10B981', // emerald-500
          borderRadius: 4,
        },
        {
          label: 'NSA',
          data: regionData.map(d => d.nsa),
          backgroundColor: '#2563EB', // blue-600
          borderRadius: 4,
        },
      ],
    };
  }, [getFilteredData, regions]);

  const cardValues = getCardValues();
  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">PCMs Dashboard</h1>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                Upload Data
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700"
                onClick={() => console.log('Refresh clicked')}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FilterSection
              title="Select Region"
              options={regions}
              selected={selectedRegions}
              onChange={setSelectedRegions}
            />
            <FilterSection
              title="Select Domain"
              options={domains}
              selected={selectedDomains}
              onChange={setSelectedDomains}
            />
            <FilterSection
              title="Select Impact"
              options={['SA', 'NSA']}
              selected={selectedImpacts}
              onChange={setSelectedImpacts}
            />
            <FilterSection
              title="Select Severity"
              options={['Emergency', 'Critical', 'Major', 'Minor']}
              selected={selectedSeverities}
              onChange={setSelectedSeverities}
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Card title="Running Tickets" value={cardValues.total} type="running" big />
          </div>
          <Card title="SA Tickets" value={cardValues.sa} type="sa" />
          <Card title="Emergency SA" value={cardValues.sa_emergency} type="sa_emergency" />
          <Card title="Critical SA" value={cardValues.sa_critical} type="sa_critical" />
          <Card title="Major SA" value={cardValues.sa_major} type="sa_major" />
          <Card title="Minor SA" value={cardValues.sa_minor} type="sa_minor" />
          <Card title="NSA Tickets" value={cardValues.nsa} type="nsa" />
          <Card title="Emergency NSA" value={cardValues.nsa_emergency} type="nsa_emergency" />
          <Card title="Critical NSA" value={cardValues.nsa_critical} type="nsa_critical" />
          <Card title="Major NSA" value={cardValues.nsa_major} type="nsa_major" />
          <Card title="Minor NSA" value={cardValues.nsa_minor} type="nsa_minor" />
        </div>

        {/* Data Visualization Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">PCMs Distribution by Region</h2>
            <div className="h-[400px] w-full">
              {data.length > 0 ? (
                <Bar options={chartOptions} data={chartData} />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Upload data to view the chart
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">PCMs Summary by Region</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Region
                    </th>
                    <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      SA
                    </th>
                    <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      NSA
                    </th>
                    <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {regions.map(region => {
                    const regionData = getFilteredData().filter(row => row.Region === region);
                    const sa = regionData.filter(row => !row.Impact?.includes('NSA')).length;
                    const nsa = regionData.filter(row => row.Impact?.includes('NSA')).length;
                    const total = sa + nsa;

                    return (
                      <tr key={region} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{region}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{sa}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{nsa}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;