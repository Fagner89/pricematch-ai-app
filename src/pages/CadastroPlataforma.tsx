import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { storage } from "@/lib/storage";
import { NumericInput } from "@/components/ui/numeric-input";

const CadastroPlataforma = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const editPlataforma = location.state?.plataforma;
  const [formData, setFormData] = useState({ nome: "", taxa: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editPlataforma) {
      setFormData({ nome: editPlataforma.nome, taxa: editPlataforma.taxa.toString() });
    }
  }, [editPlataforma]);

  const savePlataforma = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.taxa.trim()) newErrors.taxa = "Taxa é obrigatória";

    // Validate taxa is a valid number
    const taxaNum = parseFloat(formData.taxa.replace(',', '.'));
    if (isNaN(taxaNum) || taxaNum < 0) {
      newErrors.taxa = "Taxa deve ser um número válido";
    }

    // Check for duplicates
    const dadosPlataformas = JSON.parse(await storage.getItem("plataformas") || "[]");
    const nomeLower = formData.nome.trim().toLowerCase();
    
    const duplicateNome = dadosPlataformas.find((p: any) => 
      p.nome.toLowerCase() === nomeLower && (!editPlataforma || p.id !== editPlataforma.id)
    );
    
    if (duplicateNome) {
      newErrors.nome = "Já existe uma plataforma com este nome";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Erro ao salvar",
        description: Object.values(newErrors)[0],
        variant: "destructive"
      });
      return false;
    }

    if (editPlataforma) {
      const index = dadosPlataformas.findIndex((p: any) => p.id === editPlataforma.id);
      if (index !== -1) {
        dadosPlataformas[index] = {
          ...dadosPlataformas[index],
          nome: formData.nome.trim(),
          taxa: taxaNum
        };
      }
    } else {
      dadosPlataformas.push({
        id: Date.now().toString(),
        nome: formData.nome.trim(),
        taxa: taxaNum
      });
    }

    await storage.setItem("plataformas", JSON.stringify(dadosPlataformas));
    return true;
  };

  const handleSave = async () => {
    if (await savePlataforma()) {
      toast({
        title: editPlataforma ? "Plataforma atualizada!" : "Plataforma salva!",
        description: editPlataforma ? "A plataforma foi atualizada com sucesso" : "A plataforma foi cadastrada com sucesso"
      });
      navigate("/listagem-plataformas");
    }
  };

  const handleBack = () => {
    navigate("/listagem-plataformas");
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "taxa") {
      // Allow only numbers, comma, and dot
      const sanitizedValue = value.replace(/[^\d,.-]/g, "");
      setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Remove error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-muted min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          
          <h1 className="text-base sm:text-lg font-bold text-primary">
            Plataformas
          </h1>
          
          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 safe-area-bottom">
        <div className="max-w-lg mx-auto p-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/cadastros">Cadastros</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/listagem-plataformas">Plataformas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{editPlataforma ? "Editar" : "Cadastrar"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="shadow-lg border-0" style={{ borderRadius: '3px' }}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Nome Field */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Nome da Plataforma
                  </label>
                  <Input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    placeholder="Digite o nome da plataforma"
                    className={errors.nome ? 'border-destructive' : ''}
                  />
                  {errors.nome && (
                    <p className="text-destructive text-xs mt-1">{errors.nome}</p>
                  )}
                </div>

                {/* Taxa Field */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Taxa (%)
                  </label>
                  <NumericInput
                    decimalPlaces={2}
                    value={formData.taxa}
                    onChange={(e) => handleInputChange("taxa", e.target.value)}
                    placeholder="Digite a taxa"
                    className={errors.taxa ? 'border-destructive' : ''}
                  />
                  {errors.taxa && (
                    <p className="text-destructive text-xs mt-1">{errors.taxa}</p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-16">
                <Button
                  onClick={handleSave}
                  className="w-full h-12 font-bold"
                  style={{ backgroundColor: "#180F33", borderRadius: "3px" }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editPlataforma ? "Salvar Alterações" : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 sm:p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 h-11 sm:h-12 text-sm"
          >
            Voltar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-11 sm:h-12 text-sm font-semibold"
          >
            {editPlataforma ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CadastroPlataforma;