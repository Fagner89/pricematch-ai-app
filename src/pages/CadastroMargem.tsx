import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handlePercentageInput, parsePercentageToDecimal } from "@/lib/utils";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { storage } from "@/lib/storage";

const CadastroMargem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [margem, setMargem] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingMargem, setHasExistingMargem] = useState(false);
  const [custoIndireto, setCustoIndireto] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Format values for display
  const formatForDisplay = (value: string) => {
    if (!value) return "";
    // Remove all non-numeric characters except comma and dot
    const numericValue = value.replace(/[^\d,.-]/g, "");
    return numericValue;
  };

// Check if margin already exists
    useEffect(() => {
      const carregarMargem = async () => {
        const storedMargem = await storage.getItem("margem");
        if (storedMargem) {
          try {
            const parsed = JSON.parse(storedMargem);
            // Load values without % symbol for editing
            setMargem(formatForDisplay(parsed.margem || ""));
            setCustoIndireto(formatForDisplay(parsed.custoIndireto || ""));
            setHasExistingMargem(true);
          } catch (error) {
            console.error("Erro ao carregar margem:", error);
          }
        }

      // Modo edição via query param
      const params = new URLSearchParams(location.search);
      const modo = params.get("modo");
      if (modo === "editar") {
        setIsEditing(true);
      }
    };

    carregarMargem();
  }, [location.search]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!margem.trim()) {
      newErrors.margem = "% Margem é obrigatória";
    } else {
      const margemDecimal = parsePercentageToDecimal(margem);
      if (margemDecimal <= 0) {
        newErrors.margem = "A margem deve ser maior que 0%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, verifique os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Format values with % symbol for storage
    const margemFormatted = margem.trim() + "%";
    const custoIndiretoFormatted = custoIndireto.trim() ? custoIndireto.trim() + "%" : "0%";
    
    const margemDecimal = parsePercentageToDecimal(margemFormatted);
    const custoIndiretoDecimal = parsePercentageToDecimal(custoIndiretoFormatted);
   
    const margemData = {
      margem: margemFormatted,
      margemDecimal: margemDecimal,
      custoIndireto: custoIndiretoFormatted,
      custoIndiretoDecimal: custoIndiretoDecimal,
      updatedAt: new Date().toISOString()
    };

    await storage.setItem("margem", JSON.stringify(margemData));
    toast({
      title: hasExistingMargem ? "Margem atualizada!" : "Margem cadastrada!",
      description: hasExistingMargem ? "A margem foi atualizada com sucesso" : "A margem foi cadastrada com sucesso"
    });
    navigate("/listagem-margem");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleBack = () => {
    navigate("/listagem-margem");
  };

  const handleInputChange = (field: string, value: string) => {
    // Allow only numbers, comma, and dot
    const sanitizedValue = value.replace(/[^\d,.-]/g, "");
    
    if (field === "margem") {
      setMargem(sanitizedValue);
    } else if (field === "custoIndireto") {
      setCustoIndireto(sanitizedValue);
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
            {hasExistingMargem && !isEditing ? "Margem Cadastrada" : "Margem"}
          </h1>

          <div className="w-10 sm:w-11"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20">
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
                  <Link to="/listagem-margem">Margem</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{hasExistingMargem && !isEditing ? "Visualizar" : "Cadastrar"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="shadow-lg border-0" style={{ borderRadius: "3px" }}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* % Margem Field */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    % Margem
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={margem}
                    onChange={(e) => handleInputChange("margem", e.target.value)}
                    placeholder="Digite a margem"
                    disabled={hasExistingMargem && !isEditing}
                    className={errors.margem ? 'border-destructive' : ''}
                  />
                  {errors.margem && (
                    <p className="text-destructive text-xs mt-1">{errors.margem}</p>
                  )}
                </div>

                {/* Custo Indireto Field */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Custo Indireto Padrão (%)
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={custoIndireto}
                    onChange={(e) => handleInputChange("custoIndireto", e.target.value)}
                    placeholder="Digite o custo indireto"
                    disabled={hasExistingMargem && !isEditing}
                  />
                </div>
              </div>

              {/* Save/Edit Button */}
              {hasExistingMargem && !isEditing && (
                <div className="mt-16">
                  <Button
                    onClick={handleEdit}
                    className="w-full h-12 font-bold"
                    style={{ backgroundColor: "#180F33", borderRadius: "3px" }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              )}

              {(!hasExistingMargem || isEditing) && (
                <div className="mt-16">
                  <Button
                    onClick={handleSave}
                    className="w-full h-12 font-bold"
                    style={{ backgroundColor: "#180F33", borderRadius: "3px" }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {hasExistingMargem ? "Salvar Alterações" : "Salvar"}
                  </Button>
                </div>
              )}
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
            {hasExistingMargem ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CadastroMargem;