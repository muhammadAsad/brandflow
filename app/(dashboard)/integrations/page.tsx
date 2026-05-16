import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const integrations = [
  { name: 'Loom', description: 'Record and share video messages', connected: true, category: 'Video' },
  { name: 'ClickUp', description: 'Project management and tasks', connected: true, category: 'Productivity' },
  { name: 'Notion', description: 'Docs, wikis, and databases', connected: false, category: 'Productivity' },
  { name: 'Zapier', description: 'Connect apps and automate workflows', connected: true, category: 'Automation' },
  { name: 'HubSpot', description: 'CRM and marketing automation', connected: false, category: 'CRM' },
  { name: 'Stripe', description: 'Payment processing and billing', connected: true, category: 'Payments' },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your favorite tools to BrandFlow</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {integrations.map((i) => (
          <Card key={i.name}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                {i.name[0]}
              </div>
              <Badge variant={i.connected ? 'success' : 'default'}>{i.connected ? 'Connected' : 'Available'}</Badge>
            </div>
            <p className="font-semibold text-gray-900">{i.name}</p>
            <p className="text-xs text-gray-500 mt-1">{i.description}</p>
            <Button variant={i.connected ? 'outline' : 'default'} size="sm" className="mt-3 w-full">
              {i.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
