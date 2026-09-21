import React, { useState } from 'react';
import { useCadastreStore } from '../../stores/cadastreStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Search, ShieldCheck, QrCode, Building, ArrowRight, ExternalLink } from 'lucide-react';
import { PropertyPassportModal } from './PropertyPassportModal';
import { Unit } from '../../domain/types';

export const CitizenSearchPage: React.FC = () => {
  const { units, buildings, floors } = useCadastreStore();
  const [query, setQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const searchResults = query.trim() === ''
    ? []
    : units.filter(
        (u) =>
          u.ulpin3d?.toLowerCase().includes(query.toLowerCase()) ||
          u.flatNumber?.toLowerCase().includes(query.toLowerCase()) ||
          u.ownerName?.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2 py-4">
        <h1 className="text-2xl font-bold text-theme-main">
          National 3D Land & Property Public Registry Search
        </h1>
        <p className="text-xs text-theme-muted">
          Search and verify statutory 3D title records, floor elevation boundaries, and encumbrance status across India.
        </p>

        <div className="pt-4 max-w-lg mx-auto">
          <Input
            placeholder="Enter 3D ULPIN (e.g. MH-MUM-98213-B04-F12-U302) or Flat No..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search size={16} />}
            className="text-sm py-2.5"
          />
        </div>
      </div>

      {/* Suggested Quick Searches */}
      {query.trim() === '' && (
        <div className="p-4 rounded-xl border border-theme bg-theme-surface max-w-2xl mx-auto space-y-2 text-xs">
          <span className="font-semibold text-theme-muted uppercase tracking-wider text-[10px]">
            Frequently Verified Titles
          </span>
          <div className="flex flex-wrap gap-2">
            {units.slice(0, 4).map((u) => (
              <button
                key={u.unitId}
                onClick={() => setQuery(u.ulpin3d)}
                className="px-3 py-1.5 rounded-lg bg-theme-subtle hover:bg-blue-500/10 hover:text-blue-500 border border-theme text-xs font-mono transition-colors"
              >
                {u.ulpin3d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3 max-w-3xl mx-auto">
          <span className="text-xs text-theme-muted">
            Found {searchResults.length} authenticated cadastral record(s)
          </span>

          <div className="space-y-3">
            {searchResults.map((u) => {
              const fl = floors.find((f) => f.floorId === u.floorId);
              const b = buildings.find((item) => item.buildingId === fl?.buildingId);

              return (
                <div
                  key={u.ulpin3d}
                  className="p-5 rounded-xl border border-theme bg-theme-surface hover:border-blue-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-theme-main">
                        Flat {u.flatNumber || u.unitId} · {b?.name ?? 'Structure'}
                      </span>
                      <Chip label={u.verificationStatus} variant="success" size="sm" icon={<ShieldCheck size={12} />} />
                    </div>
                    <div className="text-xs font-mono text-blue-500 select-all">
                      {u.ulpin3d}
                    </div>
                    <div className="text-xs text-theme-muted">
                      Owner: {u.ownerName} · Built-up Area: {u.builtUpAreaSqm} m² · Elevation: Floor {fl?.code}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={<QrCode size={14} />}
                    onClick={() => setSelectedUnit(u)}
                  >
                    View Digital Passport
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Property Passport Modal */}
      {selectedUnit && (
        <PropertyPassportModal
          isOpen={!!selectedUnit}
          onClose={() => setSelectedUnit(null)}
          unit={selectedUnit}
        />
      )}
    </div>
  );
};
