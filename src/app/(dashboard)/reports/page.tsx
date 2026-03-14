import Link from 'next/link';
import { Package, BarChart3, Layers, Clock, ClipboardCheck, PieChart } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';

const REPORTS = [
  {
    href: '/reports/poh-performance',
    title: 'POH Type Performance',
    description: 'Average completion time, on-time rates, and stage durations per POH type',
    icon: BarChart3,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    href: '/reports/stage-performance',
    title: 'Stage Performance',
    description: 'Average duration and on-time completion rates per POH stage',
    icon: Layers,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    href: '/reports/parts-management',
    title: 'Parts Management',
    description: 'Most frequently missing parts, delay impact, and procurement analysis',
    icon: Package,
    color: 'bg-red-100 text-red-600',
  },
  {
    href: '/reports/timeline-performance',
    title: 'Timeline Performance',
    description: 'Timeline status distribution, delay trends, and longest delayed coaches',
    icon: Clock,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    href: '/reports/checklist-compliance',
    title: 'Checklist Compliance',
    description: 'Checklist completion rates and mandatory item compliance per POH type',
    icon: ClipboardCheck,
    color: 'bg-green-100 text-green-600',
  },
  {
    href: '/reports/missing-parts',
    title: 'Missing Parts Report',
    description: 'View all Missing/Pending parts across active rakes with coach and rake details',
    icon: Package,
    color: 'bg-orange-100 text-orange-600',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Performance reports and analytics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="transition-shadow hover:shadow-md h-full">
                <CardBody className="space-y-3 py-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${report.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                    <p className="mt-1 text-xs text-gray-500">{report.description}</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
