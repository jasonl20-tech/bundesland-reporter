import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BUNDESLAENDER = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", 
  "Hamburg", "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", 
  "Nordrhein-Westfalen", "Rheinland-Pfalz", "Saarland", "Sachsen", 
  "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];

export const DocumentUploadForm = () => {
  const [formData, setFormData] = useState({
    year: "",
    month: "",
    bundesland: "",
    gesamtstunden: null as File | null,
    schichtplan: null as File | null,
    rules: [""] as string[]
  });
  const [visibleRules, setVisibleRules] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (field: 'gesamtstunden' | 'schichtplan') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    console.log(`File selected for ${field}:`, file?.name);
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const triggerFileInput = (inputId: string) => {
    console.log(`Triggering file input for: ${inputId}`);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.click();
    } else {
      console.error(`Input element not found: ${inputId}`);
    }
  };

  const handleRuleChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const addRule = () => {
    if (visibleRules < 5) {
      setVisibleRules(prev => prev + 1);
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, ""]
      }));
    }
  };

  const testWebhook = async () => {
    setIsSubmitting(true);
    setDebugInfo(null);
    
    try {
      const testData = new FormData();
      testData.append('test', 'true');
      testData.append('timestamp', new Date().toISOString());
      
      console.log('Testing webhook...');
      
      const response = await fetch('https://ckwxlgumjxmczyuftlit.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        body: testData,
      });
      
      const responseText = await response.text();
      
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        timestamp: new Date().toISOString()
      });
      
      if (response.ok) {
        toast({
          title: "Test erfolgreich!",
          description: "Webhook-Verbindung funktioniert.",
        });
      } else {
        toast({
          title: "Test fehlgeschlagen",
          description: `Status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Test-Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.year || !formData.month || !formData.bundesland) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      setDebugInfo(null);
      const formDataToSend = new FormData();
      formDataToSend.append('year', formData.year);
      formDataToSend.append('month', formData.month);
      formDataToSend.append('bundesland', formData.bundesland);
      
      if (formData.gesamtstunden) {
        formDataToSend.append('gesamtstunden', formData.gesamtstunden);
      }
      if (formData.schichtplan) {
        formDataToSend.append('schichtplan', formData.schichtplan);
      }
      
      formData.rules.forEach((rule, index) => {
        if (rule.trim()) {
          formDataToSend.append(`rule_${index + 1}`, rule);
        }
      });

      const response = await fetch('https://ckwxlgumjxmczyuftlit.supabase.co/functions/v1/webhook-proxy', {
        method: 'POST',
        body: formDataToSend,
      });

      const responseText = await response.text();
      
      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "Erfolgreich gesendet!",
          description: "Ihre Daten wurden erfolgreich übertragen.",
        });
        // Reset form
        setFormData({
          year: "",
          month: "",
          bundesland: "",
          gesamtstunden: null,
          schichtplan: null,
          rules: [""]
        });
        setVisibleRules(1);
      } else {
        setDebugInfo(prev => ({ ...prev, error: 'Upload failed' }));
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error.message,
        timestamp: new Date().toISOString()
      }));
      toast({
        title: "Fehler beim Senden",
        description: "Es gab ein Problem beim Übertragen der Daten.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Dokumenten-Upload</h1>
          <p className="text-muted-foreground">Übertragen Sie Ihre Arbeitszeiten und Schichtpläne</p>
        </div>

        <Card className="p-8 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zeit und Ort */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Jahr</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="month">Monat</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="12"
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bundesland">Bundesland</Label>
                <Select value={formData.bundesland} onValueChange={(value) => setFormData(prev => ({ ...prev, bundesland: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {BUNDESLAENDER.map((land) => (
                      <SelectItem key={land} value={land}>{land}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Felder */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gesamtstunden-file">Gesamtstundenübersicht</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => triggerFileInput('gesamtstunden-file')}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <input
                    id="gesamtstunden-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                    onChange={handleFileChange('gesamtstunden')}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.gesamtstunden ? formData.gesamtstunden.name : "Datei hochladen oder hier ablegen"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schichtplan-file">Schichtplan</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => triggerFileInput('schichtplan-file')}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <input
                    id="schichtplan-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                    onChange={handleFileChange('schichtplan')}
                    className="hidden"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.schichtplan ? formData.schichtplan.name : "Datei hochladen oder hier ablegen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Regeln */}
            <div className="space-y-4">
              <Label>Regeln</Label>
              {Array.from({ length: visibleRules }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`rule-${index}`}>Regel {index + 1}</Label>
                  <Input
                    id={`rule-${index}`}
                    placeholder="Beschreiben Sie eine Regel..."
                    value={formData.rules[index] || ""}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                  />
                </div>
              ))}
              
              {visibleRules < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRule}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Weitere Regel hinzufügen
                </Button>
              )}
            </div>

            {/* Test und Submit Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={testWebhook}
                disabled={isSubmitting}
              >
                🧪 Test Webhook
              </Button>
              
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-elegant transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Wird gesendet..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Daten übertragen
                  </>
                )}
              </Button>
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};