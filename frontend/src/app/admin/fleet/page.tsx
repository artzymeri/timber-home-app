'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  Fuel,
  Gauge,
  MapPin,
  Navigation,
  Plus,
  Truck,
  UserPlus,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { MockDataNotice } from '@/components/mock-data-notice';
import { EmptyState } from '@/components/empty-state';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { TranslationKeys } from '@/lib/i18n/en';
import { cn } from '@/lib/utils';

type FleetStatus = 'on_route' | 'delivering' | 'at_workshop' | 'returning' | 'available';

interface FleetRow {
  id: number;
  plate: string;
  type: string;
  driver: string;
  status: FleetStatus;
  fuel: number;
  km: string;
  lastService: string;
  nextService: string;
  lat: number;
  lng: number;
  speed: number;
  destination?: string;
  color: string;
}

// GPS positions and live telemetry are simulated locally — the backend `fleet`
// schema doesn't carry coordinates yet. Static plates/drivers/types come from
// `/api/fleet` once a row exists; this seed acts as the fallback / demo data.
const SEED_VEHICLES: FleetRow[] = [
  { id: 1, plate: '01-234-KS', type: 'Sprinter Van', driver: 'Dritan Prifti', status: 'on_route', fuel: 72, km: '142,300', lastService: '2024-01-05', nextService: '2024-04-05', lat: 42.835, lng: 20.95, speed: 45, destination: 'Mitrovicë', color: '#3b82f6' },
  { id: 2, plate: '02-567-KS', type: 'Ford Transit', driver: 'Besnik Hoxha', status: 'delivering', fuel: 45, km: '89,200', lastService: '2023-12-15', nextService: '2024-03-15', lat: 42.81, lng: 20.98, speed: 62, destination: 'Agim Krasniqi', color: '#f59e0b' },
  { id: 3, plate: '03-891-KS', type: 'Mercedes Truck', driver: 'Arben Gashi', status: 'at_workshop', fuel: 90, km: '56,100', lastService: '2024-01-20', nextService: '2024-04-20', lat: 42.8231, lng: 20.9675, speed: 0, color: '#10b981' },
  { id: 4, plate: '04-112-KS', type: 'VW Caddy', driver: 'Fisnik Morina', status: 'returning', fuel: 38, km: '67,800', lastService: '2024-02-10', nextService: '2024-05-10', lat: 42.84, lng: 20.99, speed: 55, destination: 'Punishte', color: '#8b5cf6' },
  { id: 5, plate: '05-334-KS', type: 'Iveco Daily', driver: '—', status: 'available', fuel: 95, km: '23,400', lastService: '2024-03-01', nextService: '2024-06-01', lat: 42.8231, lng: 20.968, speed: 0, color: '#6b7280' },
  { id: 6, plate: '06-221-KS', type: 'Fiat Ducato', driver: 'Kushtrim Leka', status: 'on_route', fuel: 61, km: '112,500', lastService: '2024-02-20', nextService: '2024-05-20', lat: 42.845, lng: 20.935, speed: 52, destination: 'Skenderaj', color: '#ef4444' },
  { id: 7, plate: '07-445-KS', type: 'Mercedes Vito', driver: 'Burim Shala', status: 'delivering', fuel: 33, km: '78,900', lastService: '2024-01-10', nextService: '2024-04-10', lat: 42.795, lng: 20.955, speed: 38, destination: 'Drenas', color: '#06b6d4' },
  { id: 8, plate: '08-678-KS', type: 'Renault Master', driver: 'Luan Berisha', status: 'returning', fuel: 52, km: '95,600', lastService: '2024-03-05', nextService: '2024-06-05', lat: 42.85, lng: 21.01, speed: 48, destination: 'Punishte', color: '#ec4899' },
  { id: 9, plate: '09-112-KS', type: 'Toyota Hilux', driver: '—', status: 'available', fuel: 88, km: '34,200', lastService: '2024-03-15', nextService: '2024-06-15', lat: 42.8235, lng: 20.967, speed: 0, color: '#84cc16' },
  { id: 10, plate: '10-556-KS', type: 'Peugeot Boxer', driver: 'Valon Krasniqi', status: 'on_route', fuel: 67, km: '104,800', lastService: '2024-02-01', nextService: '2024-05-01', lat: 42.815, lng: 20.94, speed: 57, destination: 'Vushtrri Qendër', color: '#f97316' },
];

const STATUS_LABEL_KEY: Record<FleetStatus, TranslationKeys> = {
  on_route: 'on_route',
  delivering: 'delivering',
  at_workshop: 'at_workshop',
  returning: 'returning',
  available: 'available',
};

const STATUS_TONE: Record<FleetStatus, string> = {
  on_route: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  delivering: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  at_workshop: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  returning: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  available: 'bg-stone-200 text-stone-700 dark:bg-stone-500/20 dark:text-stone-300',
};

export default function FleetPage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<FleetRow[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'moving' | 'stationary'>('all');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newStatus, setNewStatus] = useState<'available' | 'checked_out' | 'maintenance'>('available');

  const submitNewVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBusy(true);
    try {
      await api('/api/fleet', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_name: newVehicleName.trim(),
          plate_number: newPlate.trim(),
          status: newStatus,
        }),
      });
      toast.success(t('fleet_created'));
      setAddOpen(false);
      setNewVehicleName('');
      setNewPlate('');
      setNewStatus('available');
      // Refetch fleet
      try {
        const { fleet } = await api<{ fleet: Array<{ id: number; vehicle_name?: string; plate?: string }> }>('/api/fleet');
        if (fleet && fleet.length > 0) {
          const merged: FleetRow[] = SEED_VEHICLES.map((seed, idx) => {
            const real = fleet[idx % fleet.length];
            return { ...seed, plate: real?.plate || seed.plate, type: real?.vehicle_name || seed.type };
          });
          setVehicles(merged);
        }
      } catch {}
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setAddBusy(false);
    }
  };

  // Try to hydrate plates/drivers/types from the API; fall back to the seed.
  useEffect(() => {
    api<{ fleet: Array<{ id: number; vehicle_name?: string; plate?: string; status?: string; checked_out_by?: number | null }> }>('/api/fleet')
      .then(({ fleet }) => {
        if (!fleet || fleet.length === 0) {
          setVehicles(SEED_VEHICLES);
          return;
        }
        // Merge real records with simulated GPS — match by plate when possible.
        const merged: FleetRow[] = SEED_VEHICLES.map((seed, idx) => {
          const real = fleet[idx % fleet.length];
          return {
            ...seed,
            plate: real?.plate || seed.plate,
            type: real?.vehicle_name || seed.type,
          };
        });
        setVehicles(merged);
      })
      .catch(() => setVehicles(SEED_VEHICLES));
  }, []);

  // Simulate live movement on the GPS layer
  useEffect(() => {
    if (!vehicles) return;
    const id = setInterval(() => {
      setVehicles((prev) => {
        if (!prev) return prev;
        return prev.map((v) => {
          if (v.speed === 0) return v;
          const jitter = () => (Math.random() - 0.5) * 0.001;
          return {
            ...v,
            lat: v.lat + jitter() + (v.status === 'returning' ? -0.0002 : 0.0002),
            lng: v.lng + jitter() + (v.status === 'returning' ? -0.0001 : 0.0001),
            speed: Math.max(15, Math.min(80, v.speed + Math.floor(Math.random() * 6) - 3)),
            fuel: Math.max(0, v.fuel - 0.02),
          };
        });
      });
    }, 3000);
    return () => clearInterval(id);
  }, [vehicles?.length]);

  // Initialize map once we have data
  useEffect(() => {
    if (!vehicles || !mapRef.current || mapInstanceRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) return;
    const startMap = () => {
      if (!mapRef.current) return;
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 42.825, lng: 20.968 },
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        ],
      });
      mapInstanceRef.current = map;
    };

    if (typeof google !== 'undefined') {
      startMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.onload = startMap;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [vehicles]);

  // Sync markers when data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !vehicles || typeof google === 'undefined') return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    vehicles.forEach((v) => {
      const isSelected = selected === v.id;
      if (v.speed > 0) {
        const ring = new google.maps.Marker({
          map,
          position: { lat: v.lat, lng: v.lng },
          clickable: false,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 20 : 14,
            fillColor: v.color,
            fillOpacity: 0.15,
            strokeColor: v.color,
            strokeWeight: 1.5,
            strokeOpacity: 0.3,
          },
        });
        markersRef.current.push(ring);
      }
      const marker = new google.maps.Marker({
        map,
        position: { lat: v.lat, lng: v.lng },
        title: `${v.plate} — ${v.driver}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 9 : 7,
          fillColor: v.color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
        },
        zIndex: isSelected ? 100 : 1,
      });
      marker.addListener('click', () => setSelected(v.id === selected ? null : v.id));
      markersRef.current.push(marker);
    });

    if (selected) {
      const sv = vehicles.find((v) => v.id === selected);
      if (sv) map.panTo({ lat: sv.lat, lng: sv.lng });
    }
  }, [vehicles, selected]);

  const movingCount = useMemo(() => (vehicles ?? []).filter((v) => v.speed > 0).length, [vehicles]);
  const stationaryCount = useMemo(() => (vehicles ?? []).filter((v) => v.speed === 0).length, [vehicles]);

  const filtered = useMemo(() => {
    const list = vehicles ?? [];
    if (filter === 'moving') return list.filter((v) => v.speed > 0);
    if (filter === 'stationary') return list.filter((v) => v.speed === 0);
    return list;
  }, [vehicles, filter]);

  const selectedVehicle = vehicles?.find((v) => v.id === selected) ?? null;

  const trackVehicle = (id: number) => {
    setSelected(id);
    const v = vehicles?.find((x) => x.id === id);
    if (v && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: v.lat, lng: v.lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const assignDriver = (id: number) => {
    const name = prompt(t('assign_driver'));
    if (name && vehicles) {
      setVehicles((prev) => (prev ? prev.map((v) => (v.id === id ? { ...v, driver: name } : v)) : prev));
      toast.success(t('assign_driver'));
    }
  };

  const addService = (id: number) => {
    if (!vehicles) return;
    const today = new Date().toISOString().split('T')[0];
    setVehicles((prev) =>
      prev ? prev.map((v) => (v.id === id ? { ...v, lastService: today } : v)) : prev
    );
    toast.success(t('add_service'));
  };

  return (
    <PageContainer size="wide">
      <div className="space-y-4">
        <PageHeader
          title={t('fleet_management')}
          description={t('live_tracking')}
          actions={
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={14} />
              <span>{t('add_vehicle')}</span>
            </Button>
          }
        />

        <MockDataNotice message={t('fleet_mock_notice')} />

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">
                {t('all_vehicles')} {vehicles ? `(${vehicles.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="moving">
                {t('moving')} {vehicles ? `(${movingCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="stationary">
                {t('stationary')} {vehicles ? `(${stationaryCount})` : ''}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Map */}
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              {!vehicles ? (
                <Skeleton className="h-[460px] w-full rounded-md" />
              ) : !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
                <div className="h-[460px] flex items-center justify-center bg-muted/40">
                  <EmptyState
                    tone="warning"
                    icon={MapPin}
                    title={t('map_placeholder')}
                    compact
                  />
                </div>
              ) : (
                <div ref={mapRef} className="w-full h-[460px] md:h-[560px]" />
              )}

              {/* Floating legend */}
              {vehicles && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
                <div className="absolute bottom-3 left-3 rounded-lg border bg-background/90 p-2 text-xs shadow-sm backdrop-blur-sm space-y-1">
                  {(Object.keys(STATUS_LABEL_KEY) as FleetStatus[]).map((key) => {
                    const sample = vehicles.find((v) => v.status === key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: sample?.color || '#666' }}
                        />
                        <span>{t(STATUS_LABEL_KEY[key])}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side panel */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">{t('all_vehicles')}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 max-h-[560px] overflow-y-auto">
              {!vehicles ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState compact tone="info" icon={Truck} title={t('table_empty')} />
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((v) => {
                    const active = selected === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => trackVehicle(v.id)}
                        className={cn(
                          'w-full text-left p-2.5 rounded-md border transition-colors',
                          active
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-foreground/15 hover:bg-accent/40'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: v.color }}
                            />
                            <span className="text-sm font-semibold truncate">{v.plate}</span>
                          </div>
                          <Badge variant="secondary" className={cn('text-[10px]', STATUS_TONE[v.status])}>
                            {t(STATUS_LABEL_KEY[v.status])}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {v.driver !== '—' ? v.driver : '—'} · {v.type}
                        </p>
                        {v.speed > 0 ? (
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Gauge size={11} />
                              {v.speed} km/h
                            </span>
                            {v.destination && (
                              <span className="inline-flex items-center gap-1 truncate">
                                <Navigation size={11} />
                                {v.destination}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={11} />
                            {t('stationary')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected vehicle detail */}
        {selectedVehicle && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ background: selectedVehicle.color }}
                  >
                    <Truck size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate">{selectedVehicle.plate}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedVehicle.type} · {selectedVehicle.driver}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => assignDriver(selectedVehicle.id)}>
                    <UserPlus size={14} />
                    <span>{t('assign_driver')}</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addService(selectedVehicle.id)}>
                    <Wrench size={14} />
                    <span>{t('add_service')}</span>
                  </Button>
                  <Button size="sm" onClick={() => trackVehicle(selectedVehicle.id)}>
                    <Eye size={14} />
                    <span>{t('track_vehicle')}</span>
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Gauge size={12} />
                    {t('speed')}
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {selectedVehicle.speed}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">km/h</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Fuel size={12} />
                    {t('fuel_level')}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          selectedVehicle.fuel > 50
                            ? 'bg-emerald-500'
                            : selectedVehicle.fuel > 25
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        )}
                        style={{ width: `${selectedVehicle.fuel}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {Math.round(selectedVehicle.fuel)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('mileage')}</p>
                  <p className="text-lg font-bold tabular-nums">{selectedVehicle.km}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('last_service')}</p>
                  <p className="text-sm font-medium">{selectedVehicle.lastService}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('next_service')}</p>
                  <p className="text-sm font-medium">{selectedVehicle.nextService}</p>
                </div>
              </div>

              {selectedVehicle.destination && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                  <Navigation size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{t('destination')}:</span>
                  <span className="font-medium">{selectedVehicle.destination}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>{t('fleet_add_title')}</SheetTitle>
            <SheetDescription>{t('fleet_add_subtitle')}</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitNewVehicle} className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-name">{t('fleet_vehicle_name')}</Label>
                <Input
                  id="vehicle-name"
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  placeholder={t('fleet_vehicle_name_placeholder')}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-plate">{t('fleet_plate')}</Label>
                <Input
                  id="vehicle-plate"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder={t('fleet_plate_placeholder')}
                  required
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('fleet_initial_status')}</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as typeof newStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('available')}</SelectItem>
                    <SelectItem value="checked_out">{t('checked_out')}</SelectItem>
                    <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="flex-row justify-end border-t">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addBusy}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={addBusy}>
                {addBusy ? '…' : t('fleet_save')}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
