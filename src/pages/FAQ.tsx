import { useState, useMemo } from "react";
import { getFaqData, FAQ_CATEGORIES, type FaqItem } from "@/data/faqData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Info, FolderKanban, BarChart3, Upload, Shield, Lightbulb, Pencil } from "lucide-react";
import { useIsAdmin } from "@/hooks/useUserRole";
import { FaqAdminEditor } from "@/components/FaqAdminEditor";

const categoryIcons: Record<string, React.ReactNode> = {
  "Général": <Info className="h-4 w-4" />,
  "Projets": <FolderKanban className="h-4 w-4" />,
  "Notation & Pondérations": <BarChart3 className="h-4 w-4" />,
  "Import / Export": <Upload className="h-4 w-4" />,
  "Administration": <Shield className="h-4 w-4" />,
  "Astuces": <Lightbulb className="h-4 w-4" />,
};

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin } = useIsAdmin();

  const faqItems = useMemo(() => getFaqData(), [refreshKey]);

  const filtered = useMemo(() => {
    let items = faqItems;
    if (activeCategory) {
      items = items.filter((i) => i.category === activeCategory);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) => i.question.toLowerCase().includes(s) || i.answer.toLowerCase().includes(s)
      );
    }
    return items;
  }, [faqItems, activeCategory, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  // Preserve category order from FAQ_CATEGORIES
  const orderedCategories = FAQ_CATEGORIES.map((c) => c.name).filter((name) => grouped.has(name));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Foire aux questions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Retrouvez les réponses aux questions les plus courantes sur PLANCHA Projets.
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Gérer la FAQ
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans la FAQ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          Toutes
        </Badge>
        {FAQ_CATEGORIES.map((cat) => (
          <Badge
            key={cat.name}
            variant={activeCategory === cat.name ? "default" : "outline"}
            className="cursor-pointer gap-1"
            onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
          >
            {categoryIcons[cat.name]}
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* FAQ content */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun résultat pour votre recherche.
        </div>
      ) : (
        orderedCategories.map((catName) => (
          <div key={catName} className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2 mt-4">
              {categoryIcons[catName]}
              {catName}
            </h2>
            <Accordion type="multiple" className="space-y-1">
              {grouped.get(catName)!.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line prose prose-sm max-w-none">
                    {item.answer.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))
      )}

      {/* Admin editor dialog */}
      {isAdmin && (
        <FaqAdminEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSave={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
