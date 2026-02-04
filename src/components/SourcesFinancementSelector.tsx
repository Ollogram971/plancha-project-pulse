import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const SOURCES_FINANCEMENT = [
  "Autres financements de l'État",
  "Autres financements publics",
  "Autres financements publics fléchés",
  "Financements de l'État fléchés",
  "Fiscalité affectée",
  "Recettes fléchées",
  "Recettes globalisées",
  "Recettes propres",
  "Recettes propres fléchées",
  "Subvention pour charges d'investissement",
  "Subvention pour charges d'investissement fléchée",
  "Subvention pour charges de service public",
];

interface SourcesFinancementSelectorProps {
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  disabled?: boolean;
}

export function SourcesFinancementSelector({
  selectedSources,
  onSourcesChange,
  disabled = false,
}: SourcesFinancementSelectorProps) {
  const handleSourceToggle = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Sources de financement</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {SOURCES_FINANCEMENT.map((source) => (
          <div key={source} className="flex items-center space-x-2">
            <Checkbox
              id={`source-${source}`}
              checked={selectedSources.includes(source)}
              onCheckedChange={() => handleSourceToggle(source)}
              disabled={disabled}
            />
            <Label
              htmlFor={`source-${source}`}
              className="text-sm font-normal cursor-pointer leading-tight"
            >
              {source}
            </Label>
          </div>
        ))}
      </div>
      {selectedSources.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedSources.length} source(s) sélectionnée(s)
        </p>
      )}
    </div>
  );
}

export { SOURCES_FINANCEMENT };
